// /app/api/cron/billing/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ─── GET: fetch billing records with tenant info ───────────────────────────
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const statusFilter   = searchParams.get("status");
  const tenantIdFilter = searchParams.get("tenantId");

  let tenantQuery = supabase
    .from("tenants")
    .select(`
      tenant_id,
      business_name,
      owner_email,
      business_type,
      owner_full_name,
      subscription_status,
      trial_ends_at,
      created_at,
      subscription_records (
        subscription_id,
        billing_period,
        payment_status,
        amount,
        paid_at,
        overdue_at,
        notification_sent_at
      )
    `)
    .in("subscription_status", ["Trial", "Active"])
    .order("created_at", { ascending: false });

  if (tenantIdFilter) {
    tenantQuery = tenantQuery.eq("tenant_id", tenantIdFilter);
  }

  const { data: tenants, error: tenantsError } = await tenantQuery;

  if (tenantsError) {
    return NextResponse.json({ error: tenantsError.message }, { status: 500 });
  }

  const result = (tenants ?? []).map((t) => {
    const records = (t.subscription_records ?? []).sort(
      (a: { billing_period: string }, b: { billing_period: string }) =>
        new Date(b.billing_period).getTime() - new Date(a.billing_period).getTime()
    );

    const now         = new Date();
    const trialEndsAt = t.trial_ends_at ? new Date(t.trial_ends_at) : null;
    const isInTrial   = trialEndsAt ? now < trialEndsAt : false;
    const trialDaysLeft = trialEndsAt
      ? Math.max(0, Math.ceil((trialEndsAt.getTime() - now.getTime()) / 86_400_000))
      : 0;

    const latestRecord = records[0] ?? null;

    return {
      tenant_id:           t.tenant_id,
      business_name:       t.business_name,
      owner_email:         t.owner_email,
      business_type:       t.business_type,
      owner_full_name:     t.owner_full_name,
      subscription_status: t.subscription_status,
      trial_ends_at:       t.trial_ends_at,
      is_in_trial:         isInTrial,
      trial_days_left:     trialDaysLeft,
      latest_billing:      latestRecord,
      all_records:         records,
    };
  });

  const filtered = statusFilter
    ? result.filter((r) => r.latest_billing?.payment_status === statusFilter)
    : result;

  return NextResponse.json({ data: filtered });
}

// ─── PATCH: mark a subscription record as paid ────────────────────────────
export async function PATCH(req: NextRequest) {
  const { subscriptionId, recordedBy } = await req.json();

  if (!subscriptionId) {
    return NextResponse.json({ error: "subscriptionId is required." }, { status: 400 });
  }

  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("subscription_records")
    .update({
      payment_status: "Paid",
      paid_at:        now,
      recorded_by:    recordedBy ?? null,
    })
    .eq("subscription_id", subscriptionId)
    .select("subscription_id, tenant_id, billing_period, payment_status, paid_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, data });
}

// ─── POST: end trial early and create first billing record ────────────────
export async function POST(req: NextRequest) {
  const { tenantId } = await req.json();

  if (!tenantId) {
    return NextResponse.json({ error: "tenantId is required." }, { status: 400 });
  }

  const { data: tenant, error: tenantError } = await supabase
    .from("tenants")
    .select("tenant_id, business_name, owner_email, trial_ends_at, subscription_status")
    .eq("tenant_id", tenantId)
    .single();

  if (tenantError || !tenant) {
    return NextResponse.json({ error: "Tenant not found." }, { status: 404 });
  }

  // ── Load billing settings ────────────────────────────────────────────────
  const { data: settings } = await supabase
    .from("billing_settings")
    .select("monthly_price, billing_due_days, grace_period_days")
    .single();

  const monthlyPrice    = Number(settings?.monthly_price    ?? 1000);
  const billingDueDays  = Number(settings?.billing_due_days  ?? 30);
  const gracePeriodDays = Number(settings?.grace_period_days ?? 7);

  const now = new Date();

  // billing_period = first day of current month (YYYY-MM-DD)
  const billingPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;

  // Check for existing billing record for this period
  const { data: existing } = await supabase
    .from("subscription_records")
    .select("subscription_id")
    .eq("tenant_id", tenantId)
    .eq("billing_period", billingPeriod)
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      { error: "Billing record already exists for this period." },
      { status: 409 }
    );
  }

  // overdue_at = today + billing_due_days (from settings)
  const overdueDate = new Date(now);
  overdueDate.setDate(overdueDate.getDate() + billingDueDays);
  const overdueAt = overdueDate.toISOString();

  // grace_ends_at = overdue_at + grace_period_days (from settings)
  const graceEndsDate = new Date(overdueDate);
  graceEndsDate.setDate(graceEndsDate.getDate() + gracePeriodDays);
  const graceEndsAt = graceEndsDate.toISOString();

  const { data: newRecord, error: insertError } = await supabase
    .from("subscription_records")
    .insert({
      tenant_id:      tenantId,
      billing_period: billingPeriod,
      payment_status: "Pending",
      amount:         monthlyPrice,
      overdue_at:     overdueAt,
      grace_ends_at:  graceEndsAt,
    })
    .select()
    .single();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  // ── Activate tenant (end trial) ──────────────────────────────────────────
  await supabase
    .from("tenants")
    .update({
      subscription_status: "Active",
      trial_ends_at:       null,
    })
    .eq("tenant_id", tenantId);

  // ── Send invoice email ───────────────────────────────────────────────────
  try {
    const { sendBillingInvoiceEmail } = await import("@/lib/mailer");
    await sendBillingInvoiceEmail(
      tenant.owner_email,
      tenant.business_name,
      billingPeriod,
      monthlyPrice
    );
  } catch (e) {
    console.error("[active-trial POST] Invoice email failed:", e);
  }

  // ── Insert in-app billing notification (visible on notification bell) ────
  await supabase.from("billing_notifications").insert({
    tenant_id:         tenantId,
    notification_type: "invoice_generated",
    recipient_email:   tenant.owner_email,
    subject:           `Your free trial has ended — First invoice generated for ${tenant.business_name}`,
  });

  // ── Audit log ────────────────────────────────────────────────────────────
  const { logAudit, AuditEvent } = await import("@/lib/audit");
  await logAudit({
    performedBy:  "Superadmin",
    eventType:    AuditEvent.TRIAL_CONVERTED,
    tenantId,
    businessName: tenant.business_name,
    description:  `Free trial ended early by superadmin. First billing record created for period ${billingPeriod}. Amount: ₱${monthlyPrice}. Due: ${overdueAt.split("T")[0]}.`,
    metadata: {
      subscriptionId: newRecord.subscription_id,
      billingPeriod,
      amount:       monthlyPrice,
      overdueAt,
      graceEndsAt,
    },
  });

  return NextResponse.json({ success: true, data: newRecord });
}