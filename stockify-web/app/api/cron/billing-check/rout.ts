// /app/api/cron/billing/route.ts
//
// Vercel Cron — runs daily at 00:05 UTC.
// Add to vercel.json:
//   {
//     "crons": [{ "path": "/api/cron/billing", "schedule": "5 0 * * *" }]
//   }
//
// Set CRON_SECRET env var and pass it as Authorization: Bearer <secret>
// in the Vercel cron config, or Vercel will inject it automatically
// for Vercel-managed cron jobs (framework-native crons).

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  sendBillingInvoiceEmail,
  sendOverdueNotificationEmail,
  sendTrialEndingEmail,
} from "@/lib/email";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ─── Auth guard ───────────────────────────────────────────────────────────────
function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true; // dev: allow if no secret configured
  const auth = req.headers.get("authorization");
  return auth === `Bearer ${secret}`;
}

// ─── Main cron handler ────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const results = {
    trial_ended_upgraded: [] as string[],
    billing_records_created: [] as string[],
    overdue_marked: [] as string[],
    trial_reminders_sent: [] as string[],
    errors: [] as string[],
  };

  // ── 1. Fetch all active / trial tenants ─────────────────────────────────────
  const { data: tenants, error: tenantsError } = await supabase
    .from("tenants")
    .select("tenant_id, business_name, owner_email, subscription_status, trial_ends_at")
    .in("subscription_status", ["Trial", "Active"])
    .eq("is_active", true);

  if (tenantsError) {
    console.error("[cron/billing] Failed to fetch tenants:", tenantsError.message);
    return NextResponse.json({ error: tenantsError.message }, { status: 500 });
  }

  for (const tenant of tenants ?? []) {
    const trialEndsAt = tenant.trial_ends_at ? new Date(tenant.trial_ends_at) : null;
    const isInTrial = trialEndsAt ? now < trialEndsAt : false;

    // ── 2. Send "trial ending soon" reminder (1 day before expiry) ─────────────
    if (isInTrial && trialEndsAt) {
      const hoursLeft = (trialEndsAt.getTime() - now.getTime()) / 3_600_000;
      if (hoursLeft <= 24 && hoursLeft > 0) {
        // Check if we already sent today
        const { data: alreadySent } = await supabase
          .from("billing_notifications")
          .select("id")
          .eq("tenant_id", tenant.tenant_id)
          .eq("notification_type", "trial_ending_reminder")
          .gte("sent_at", new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString())
          .maybeSingle();

        if (!alreadySent) {
          try {
            await sendTrialEndingEmail(tenant.owner_email, tenant.business_name, trialEndsAt);
            await supabase.from("billing_notifications").insert({
              tenant_id: tenant.tenant_id,
              notification_type: "trial_ending_reminder",
              recipient_email: tenant.owner_email,
              subject: `Your free trial ends tomorrow — ${tenant.business_name}`,
            });
            results.trial_reminders_sent.push(tenant.tenant_id);
          } catch (e) {
            results.errors.push(`Trial reminder email failed for ${tenant.tenant_id}: ${e}`);
          }
        }
      }
    }

    // ── 3. Trial has expired → upgrade to Active + create first billing record ──
    if (tenant.subscription_status === "Trial" && trialEndsAt && now >= trialEndsAt) {
      const { error: upgradeError } = await supabase
        .from("tenants")
        .update({ subscription_status: "Active" })
        .eq("tenant_id", tenant.tenant_id);

      if (!upgradeError) {
        results.trial_ended_upgraded.push(tenant.tenant_id);
        tenant.subscription_status = "Active"; // mutate for step 4
      } else {
        results.errors.push(`Upgrade failed for ${tenant.tenant_id}: ${upgradeError.message}`);
        continue;
      }
    }

    // ── 4. Generate monthly billing record (first day of current month) ─────────
    if (tenant.subscription_status === "Active") {
      const billingPeriod = new Date(now.getFullYear(), now.getMonth(), 1)
        .toISOString()
        .split("T")[0];

      const { data: existing } = await supabase
        .from("subscription_records")
        .select("subscription_id")
        .eq("tenant_id", tenant.tenant_id)
        .eq("billing_period", billingPeriod)
        .maybeSingle();

      if (!existing) {
        // Due on the 15th of next month
        const overdueAt = new Date(
          now.getFullYear(),
          now.getMonth() + 1,
          15
        ).toISOString();

        const { data: newRecord, error: insertError } = await supabase
          .from("subscription_records")
          .insert({
            tenant_id: tenant.tenant_id,
            billing_period: billingPeriod,
            payment_status: "Pending",
            amount: 1000.0,
            overdue_at: overdueAt,
          })
          .select("subscription_id")
          .single();

        if (insertError) {
          results.errors.push(
            `Insert billing record failed for ${tenant.tenant_id}: ${insertError.message}`
          );
        } else {
          results.billing_records_created.push(newRecord.subscription_id);

          // Send invoice email + log notification
          try {
            await sendBillingInvoiceEmail(
              tenant.owner_email,
              tenant.business_name,
              billingPeriod,
              1000
            );
            await supabase.from("billing_notifications").insert({
              tenant_id: tenant.tenant_id,
              notification_type: "invoice_generated",
              recipient_email: tenant.owner_email,
              subject: `Monthly invoice for ${billingPeriod} — ${tenant.business_name}`,
            });
          } catch (e) {
            results.errors.push(`Invoice email failed for ${tenant.tenant_id}: ${e}`);
          }
        }
      }
    }
  }

  // ── 5. Mark overdue records ──────────────────────────────────────────────────
  const { data: overdueRecords } = await supabase
    .from("subscription_records")
    .select(
      `
      subscription_id,
      tenant_id,
      billing_period,
      notification_sent_at,
      tenants ( business_name, owner_email )
    `
    )
    .eq("payment_status", "Pending")
    .lt("overdue_at", now.toISOString());

  for (const record of overdueRecords ?? []) {
    const { error: overdueError } = await supabase
      .from("subscription_records")
      .update({ payment_status: "Overdue" })
      .eq("subscription_id", record.subscription_id);

    if (!overdueError) {
      results.overdue_marked.push(record.subscription_id);

      // Send overdue notification (once)
      if (!record.notification_sent_at) {
       const t = (Array.isArray(record.tenants) ? record.tenants[0] : record.tenants) as { business_name: string; owner_email: string };
        try {
          await sendOverdueNotificationEmail(
            t.owner_email,
            t.business_name,
            record.billing_period
          );
          await supabase
            .from("subscription_records")
            .update({ notification_sent_at: now.toISOString() })
            .eq("subscription_id", record.subscription_id);

          await supabase.from("billing_notifications").insert({
            tenant_id: record.tenant_id,
            notification_type: "overdue_notice",
            recipient_email: t.owner_email,
            subject: `Payment overdue for ${record.billing_period} — ${t.business_name}`,
          });
        } catch (e) {
          results.errors.push(`Overdue email failed for ${record.subscription_id}: ${e}`);
        }
      }
    }
  }

  console.log("[cron/billing] Completed:", results);
  return NextResponse.json({ success: true, results });
}