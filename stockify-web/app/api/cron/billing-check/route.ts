// app/api/cron/billing-check/route.ts
//
// Vercel Cron — runs daily at 00:05 UTC.
// vercel.json: { "path": "/api/cron/billing-check", "schedule": "5 0 * * *" }

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  sendBillingInvoiceEmail,
  sendOverdueNotificationEmail,
  sendTrialEndingEmail,
} from "@/lib/mailer";
import { logAudit, AuditEvent } from "@/lib/audit";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  const auth = req.headers.get("authorization");
  return auth === `Bearer ${secret}`;
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const results = {
    trial_ended_upgraded:    [] as string[],
    billing_records_created: [] as string[],
    overdue_marked:          [] as string[],
    trial_reminders_sent:    [] as string[],
    errors:                  [] as string[],
  };

  // ── Load billing settings ────────────────────────────────────────────────────
  const { data: settings, error: settingsError } = await supabase
    .from("billing_settings")
    .select("trial_days, grace_period_days, suspension_days, monthly_price, billing_due_days")
    .single();

  if (settingsError || !settings) {
    console.error("[cron/billing-check] Could not load billing settings:", settingsError?.message);
    return NextResponse.json({ error: "Could not load billing settings." }, { status: 500 });
  }

  const monthlyPrice    = Number(settings.monthly_price    ?? 1000);
  const billingDueDays  = Number(settings.billing_due_days  ?? 30);
  const gracePeriodDays = Number(settings.grace_period_days ?? 7);

  // ── 1. Fetch all active / trial tenants ─────────────────────────────────────
  const { data: tenants, error: tenantsError } = await supabase
    .from("tenants")
    .select("tenant_id, business_name, owner_email, subscription_status, trial_ends_at")
    .in("subscription_status", ["Trial", "Active"])
    .eq("is_active", true);

  if (tenantsError) {
    console.error("[cron/billing-check] Failed to fetch tenants:", tenantsError.message);
    return NextResponse.json({ error: tenantsError.message }, { status: 500 });
  }

  for (const tenant of tenants ?? []) {
    const trialEndsAt = tenant.trial_ends_at ? new Date(tenant.trial_ends_at) : null;
    const isInTrial   = trialEndsAt ? now < trialEndsAt : false;

    // ── 2. Send "trial ending soon" reminder (1 day before expiry) ─────────────
    if (isInTrial && trialEndsAt) {
      const hoursLeft = (trialEndsAt.getTime() - now.getTime()) / 3_600_000;
      if (hoursLeft <= 24 && hoursLeft > 0) {
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
              tenant_id:         tenant.tenant_id,
              notification_type: "trial_ending_reminder",
              recipient_email:   tenant.owner_email,
              subject:           `Your free trial ends tomorrow — ${tenant.business_name}`,
            });

            await logAudit({
              performedBy:  "Automated System",
              eventType:    AuditEvent.TRIAL_REMINDER_SENT,
              tenantId:     tenant.tenant_id,
              businessName: tenant.business_name,
              description:  "Automated trial-ending reminder dispatched to owner's email (24 h before expiry).",
            });

            results.trial_reminders_sent.push(tenant.tenant_id);
          } catch (e) {
            results.errors.push(`Trial reminder email failed for ${tenant.tenant_id}: ${e}`);
          }
        }
      }
    }

    // ── 3. Trial has expired → upgrade to Active ──────────────────────────────
    if (tenant.subscription_status === "Trial" && trialEndsAt && now >= trialEndsAt) {
      const { error: upgradeError } = await supabase
        .from("tenants")
        .update({ subscription_status: "Active", trial_ends_at: null })
        .eq("tenant_id", tenant.tenant_id);

      if (!upgradeError) {
        await logAudit({
          performedBy:  "Cron: billing-check",
          eventType:    AuditEvent.TRIAL_CONVERTED,
          tenantId:     tenant.tenant_id,
          businessName: tenant.business_name,
          description:  "Trial period expired. Tenant automatically upgraded to Active.",
        });

        results.trial_ended_upgraded.push(tenant.tenant_id);
        tenant.subscription_status = "Active";
      } else {
        results.errors.push(`Upgrade failed for ${tenant.tenant_id}: ${upgradeError.message}`);
        continue;
      }
    }

    // ── 4. Generate monthly billing record (first day of current month) ─────────
    // Uses billing_settings for amount, overdue_at, and grace_ends_at.
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
        // overdue_at = billing_period + billing_due_days (from settings)
        const overdueDate = new Date(billingPeriod + "T00:00:00");
        overdueDate.setDate(overdueDate.getDate() + billingDueDays);

        // grace_ends_at = overdue_at + grace_period_days (from settings)
        const graceEndsDate = new Date(overdueDate);
        graceEndsDate.setDate(graceEndsDate.getDate() + gracePeriodDays);

        const overdueAt   = overdueDate.toISOString();
        const graceEndsAt = graceEndsDate.toISOString();

        const { data: newRecord, error: insertError } = await supabase
          .from("subscription_records")
          .insert({
            tenant_id:      tenant.tenant_id,
            billing_period: billingPeriod,
            payment_status: "Pending",
            amount:         monthlyPrice,
            overdue_at:     overdueAt,
            grace_ends_at:  graceEndsAt,
          })
          .select("subscription_id")
          .single();

        if (insertError) {
          results.errors.push(
            `Insert billing record failed for ${tenant.tenant_id}: ${insertError.message}`
          );
        } else {
          results.billing_records_created.push(newRecord.subscription_id);

          try {
            await sendBillingInvoiceEmail(
              tenant.owner_email,
              tenant.business_name,
              billingPeriod,
              monthlyPrice
            );
            await supabase.from("billing_notifications").insert({
              tenant_id:         tenant.tenant_id,
              notification_type: "invoice_generated",
              recipient_email:   tenant.owner_email,
              subject:           `Monthly invoice for ${billingPeriod} — ${tenant.business_name}`,
            });

            await logAudit({
              performedBy:  "Automated System",
              eventType:    AuditEvent.INVOICE_GENERATED,
              tenantId:     tenant.tenant_id,
              businessName: tenant.business_name,
              description:  `Monthly invoice generated for billing period ${billingPeriod}. Amount: ₱${monthlyPrice}. Due: ${overdueAt.split("T")[0]}.`,
              metadata: {
                subscriptionId: newRecord.subscription_id,
                billingPeriod,
                amount:       monthlyPrice,
                overdueAt,
                graceEndsAt,
              },
            });
          } catch (e) {
            results.errors.push(`Invoice email failed for ${tenant.tenant_id}: ${e}`);
          }
        }
      }
    }
  }

  // ── 5. Mark overdue records (Pending past overdue_at → Overdue) ──────────────
  const { data: overdueRecords } = await supabase
    .from("subscription_records")
    .select("subscription_id, tenant_id, billing_period, grace_ends_at, notification_sent_at")
    .eq("payment_status", "Pending")
    .lt("overdue_at", now.toISOString());

  if ((overdueRecords ?? []).length > 0) {
    const overdueIds = [...new Set((overdueRecords ?? []).map(r => r.tenant_id))];
    const { data: overdueTenants } = await supabase
      .from("tenants")
      .select("tenant_id, business_name, owner_email")
      .in("tenant_id", overdueIds);
    const overdueMap = new Map<string, { business_name: string; owner_email: string }>();
    (overdueTenants || []).forEach((t: any) => overdueMap.set(t.tenant_id, t));

    for (const record of overdueRecords ?? []) {
      const t = overdueMap.get(record.tenant_id) ?? { business_name: "Unknown", owner_email: "" };

      // Ensure grace_ends_at is set; compute from settings if missing
      let graceEndsAt: string | undefined = record.grace_ends_at ?? undefined;
      if (!graceEndsAt) {
        const g = new Date(now);
        g.setDate(g.getDate() + gracePeriodDays);
        graceEndsAt = g.toISOString();
      }

      const { error: overdueError } = await supabase
        .from("subscription_records")
        .update({ payment_status: "Overdue", grace_ends_at: graceEndsAt })
        .eq("subscription_id", record.subscription_id);

      if (!overdueError) {
        results.overdue_marked.push(record.subscription_id);

        if (!record.notification_sent_at) {
          try {
            await sendOverdueNotificationEmail(t.owner_email, t.business_name, record.billing_period);
            await supabase
              .from("subscription_records")
              .update({ notification_sent_at: now.toISOString() })
              .eq("subscription_id", record.subscription_id);

            await supabase.from("billing_notifications").insert({
              tenant_id:         record.tenant_id,
              notification_type: "overdue_notice",
              recipient_email:   t.owner_email,
              subject:           `Payment overdue for ${record.billing_period} — ${t.business_name}`,
            });

            await logAudit({
              performedBy:  "Automated System",
              eventType:    AuditEvent.OVERDUE_NOTICE_SENT,
              tenantId:     record.tenant_id,
              businessName: t.business_name,
              description:  `Payment overdue for billing period ${record.billing_period}. Overdue notification dispatched to owner's email. Grace period ends ${graceEndsAt?.split("T")[0]}.`,
              metadata: { subscriptionId: record.subscription_id, graceEndsAt },
            });
          } catch (e) {
            results.errors.push(`Overdue email failed for ${record.subscription_id}: ${e}`);
          }
        }
      }
    }
  }

  console.log("[cron/billing-check] Completed:", results);
  return NextResponse.json({ success: true, results });
}
