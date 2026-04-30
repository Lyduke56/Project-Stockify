// /app/api/cron/trial-check/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendBillingInvoiceEmail, sendTrialEndingEmail } from "@/lib/email";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();

  // ── Pull billing settings ──────────────────────────────────────────────────
  const { data: settings, error: settingsError } = await supabase
    .from("billing_settings")
    .select("trial_days, grace_period_days, suspension_days, monthly_price, billing_due_days")
    .single();

  if (settingsError || !settings) {
    return NextResponse.json({ error: "Could not load billing settings." }, { status: 500 });
  }

  const results = {
    trial_reminders_sent: [] as string[],
    converted_to_active: [] as string[],
    errors: [] as string[],
  };

  // ── Fetch all Trial tenants ────────────────────────────────────────────────
  const { data: trialTenants, error } = await supabase
    .from("tenants")
    .select("tenant_id, business_name, owner_email, trial_ends_at")
    .eq("subscription_status", "Trial")
    .eq("is_active", true);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  for (const tenant of trialTenants ?? []) {
    const trialEndsAt = tenant.trial_ends_at ? new Date(tenant.trial_ends_at) : null;
    if (!trialEndsAt) continue;

    const hoursLeft = (trialEndsAt.getTime() - now.getTime()) / 3_600_000;

    // ── Send 1-day-before reminder ───────────────────────────────────────────
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
            tenant_id: tenant.tenant_id,
            notification_type: "trial_ending_reminder",
            recipient_email: tenant.owner_email,
            subject: `Your free trial ends tomorrow — ${tenant.business_name}`,
          });
          results.trial_reminders_sent.push(tenant.tenant_id);
        } catch (e) {
          results.errors.push(`Trial reminder failed for ${tenant.tenant_id}: ${e}`);
        }
      }
    }

    // ── Trial expired → convert to Active + generate first invoice ───────────
    if (now >= trialEndsAt) {
      // billing_period = first day of current month (YYYY-MM-DD)
      const billingPeriod = new Date(now.getFullYear(), now.getMonth(), 1)
        .toISOString()
        .split("T")[0];

      // due_date = billing_due_days after trial ends (e.g. 30 days)
      const overdueAt = new Date(trialEndsAt);
      overdueAt.setDate(overdueAt.getDate() + settings.billing_due_days);

      // grace_ends_at = overdue_at + grace_period_days
      const graceEndsAt = new Date(overdueAt);
      graceEndsAt.setDate(graceEndsAt.getDate() + settings.grace_period_days);

      const { data: existing } = await supabase
        .from("subscription_records")
        .select("subscription_id")
        .eq("tenant_id", tenant.tenant_id)
        .eq("billing_period", billingPeriod)
        .maybeSingle();

      if (!existing) {
        const { error: insertError } = await supabase
          .from("subscription_records")
          .insert({
            tenant_id:      tenant.tenant_id,
            billing_period: billingPeriod,
            payment_status: "Pending",
            amount:         settings.monthly_price,
            overdue_at:     overdueAt.toISOString(),
            grace_ends_at:  graceEndsAt.toISOString(),
          });

        if (insertError) {
          results.errors.push(`Billing insert failed for ${tenant.tenant_id}: ${insertError.message}`);
          continue;
        }

        try {
          await sendBillingInvoiceEmail(
            tenant.owner_email,
            tenant.business_name,
            billingPeriod,
            settings.monthly_price
          );
          await supabase.from("billing_notifications").insert({
            tenant_id: tenant.tenant_id,
            notification_type: "invoice_generated",
            recipient_email: tenant.owner_email,
            subject: `Monthly invoice — ${tenant.business_name}`,
          });
        } catch (e) {
          results.errors.push(`Invoice email failed for ${tenant.tenant_id}: ${e}`);
        }
      }

      // Activate tenant
      await supabase
        .from("tenants")
        .update({ subscription_status: "Active", trial_ends_at: null })
        .eq("tenant_id", tenant.tenant_id);

      results.converted_to_active.push(tenant.tenant_id);
    }
  }

  return NextResponse.json({ success: true, results });
}