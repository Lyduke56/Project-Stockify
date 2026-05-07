
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { logAudit, AuditEvent } from "@/lib/audit";

// Service-role client for writes that must bypass RLS
const supabaseAdmin = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Returns the first day of the month that is N months after the given billing_period date string */
function nextBillingPeriod(billingPeriod: string): string {
  const d = new Date(billingPeriod + "T00:00:00");
  d.setMonth(d.getMonth() + 1);
  d.setDate(1);
  return d.toISOString().slice(0, 10); // "YYYY-MM-DD"
}

/** Returns the due date (overdue_at) = billing_period + billing_due_days */
function calcOverdueAt(billingPeriod: string, billingDueDays: number): string {
  const d = new Date(billingPeriod + "T00:00:00");
  d.setDate(d.getDate() + billingDueDays);
  return d.toISOString();
}

/** Returns grace_ends_at = overdue_at + grace_period_days */
function calcGraceEndsAt(overdueAt: string, gracePeriodDays: number): string {
  const d = new Date(overdueAt);
  d.setDate(d.getDate() + gracePeriodDays);
  return d.toISOString();
}

// ── Handler ───────────────────────────────────────────────────────────────────

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient(); // for reads that respect session
  const { id: submissionId } = await params;

  const body = await req.json().catch(() => ({}));
  const { remarksAdmin, reviewedBy, amountOverride } = body as {
    remarksAdmin?:   string;
    reviewedBy?:     string;
    amountOverride?: number;
  };

  // ── 1. Fetch the submission ────────────────────────────────────────────────
  const { data: submission, error: sErr } = await supabaseAdmin
    .from("payment_submissions")
    .select("*")
    .eq("submission_id", submissionId)
    .single();

  if (sErr || !submission) {
    return NextResponse.json({ error: "Submission not found." }, { status: 404 });
  }
  if (submission.status !== "Pending") {
    return NextResponse.json(
      { error: `Submission is already ${submission.status}.` },
      { status: 409 }
    );
  }

  const tenantId = submission.tenant_id as string;

  // ── 2. Resolve target subscription_record ────────────────────────────────
  let targetSubscriptionId: string | null = submission.subscription_id ?? null;

  if (!targetSubscriptionId) {
    const { data: latest } = await supabaseAdmin
      .from("subscription_records")
      .select("subscription_id")
      .eq("tenant_id", tenantId)
      .in("payment_status", ["Pending", "Overdue"])
      .order("billing_period", { ascending: false })
      .limit(1)
      .single();

    targetSubscriptionId = latest?.subscription_id ?? null;
  }

  if (!targetSubscriptionId) {
    return NextResponse.json(
      { error: "No unpaid billing record found for this tenant." },
      { status: 422 }
    );
  }

  // ── 3. Fetch the current subscription_record ──────────────────────────────
  const { data: subRecord, error: srErr } = await supabaseAdmin
    .from("subscription_records")
    .select("subscription_id, tenant_id, billing_period, amount, amount_paid, payment_status")
    .eq("subscription_id", targetSubscriptionId)
    .single();

  if (srErr || !subRecord) {
    return NextResponse.json({ error: "Subscription record not found." }, { status: 404 });
  }

  // ── 4. Calculate new amount_paid ──────────────────────────────────────────
  // amountOverride is what the admin confirmed was paid in this submission.
  // Fall back to amount_declared on the submission, then to the full billed amount.
  const paymentAmount =
    amountOverride !== undefined && amountOverride > 0
      ? amountOverride
      : (submission.amount_declared ?? Number(subRecord.amount));

  const prevAmountPaid  = Number(subRecord.amount_paid ?? 0);
  const newAmountPaid   = prevAmountPaid + paymentAmount;
  const billedAmount    = Number(subRecord.amount);
  const isFullyPaid     = newAmountPaid >= billedAmount;
  const now             = new Date().toISOString();

  // ── 5. Update subscription_record ─────────────────────────────────────────
  const { error: recErr } = await supabaseAdmin
    .from("subscription_records")
    .update({
      amount_paid:    newAmountPaid,
      payment_status: isFullyPaid ? "Paid" : subRecord.payment_status, // only flip to Paid when fully settled
      paid_at:        isFullyPaid ? now : null,
      recorded_by:    reviewedBy ?? null,
    })
    .eq("subscription_id", targetSubscriptionId);

  if (recErr) {
    return NextResponse.json({ error: recErr.message }, { status: 500 });
  }

  // ── 6. Mark submission as Accepted ────────────────────────────────────────
  const { error: subErr } = await supabaseAdmin
    .from("payment_submissions")
    .update({
      status:          "Accepted",
      reviewed_by:     reviewedBy ?? null,
      reviewed_at:     now,
      remarks_admin:   remarksAdmin?.trim() || null,
      subscription_id: targetSubscriptionId,
    })
    .eq("submission_id", submissionId);

  if (subErr) {
    return NextResponse.json({ error: subErr.message }, { status: 500 });
  }

  // ── 7. Fetch tenant + billing_settings for next-row creation ──────────────
  const { data: tenant } = await supabaseAdmin
    .from("tenants")
    .select("business_name, subscription_status")
    .eq("tenant_id", tenantId)
    .single();

  const businessName = tenant?.business_name ?? null;

  // ── 8. Create next billing row if fully paid ──────────────────────────────
  if (isFullyPaid) {
    const { data: settings } = await supabaseAdmin
      .from("billing_settings")
      .select("monthly_price, billing_due_days, grace_period_days")
      .limit(1)
      .single();

    const monthlyPrice    = Number(settings?.monthly_price    ?? 1000);
    const billingDueDays  = Number(settings?.billing_due_days  ?? 30);
    const gracePeriodDays = Number(settings?.grace_period_days ?? 7);

    const nextPeriod    = nextBillingPeriod(subRecord.billing_period);
    const nextOverdueAt = calcOverdueAt(nextPeriod, billingDueDays);
    const nextGraceAt   = calcGraceEndsAt(nextOverdueAt, gracePeriodDays);

    // upsert so we never duplicate (unique key: tenant_id + billing_period)
    const { error: insertErr } = await supabaseAdmin
      .from("subscription_records")
      .upsert(
        {
          tenant_id:      tenantId,
          billing_period: nextPeriod,
          payment_status: "Pending",
          amount:         monthlyPrice,
          amount_paid:    0,
          overdue_at:     nextOverdueAt,
          grace_ends_at:  nextGraceAt,
        },
        { onConflict: "tenant_id,billing_period", ignoreDuplicates: true }
      );

    if (insertErr) {
      // Non-fatal — log but don't fail the whole request
      console.error("[accept] Failed to create next billing row:", insertErr.message);
    }
  }

  // ── 9. Audit log ──────────────────────────────────────────────────────────
  const balance = Math.max(0, billedAmount - newAmountPaid);

  await logAudit({
    performedBy:  reviewedBy ?? "Superadmin",
    eventType:    AuditEvent.PAYMENT_RECORDED,
    tenantId,
    businessName,
    description: isFullyPaid
      ? `Payment submission accepted. Record fully paid (₱${newAmountPaid.toFixed(2)}).`
      : `Payment submission accepted. Partial payment of ₱${paymentAmount.toFixed(2)} recorded. Remaining balance: ₱${balance.toFixed(2)}.`,
    metadata: {
      submissionId,
      subscriptionId:  targetSubscriptionId,
      paymentAmount,
      newAmountPaid,
      billedAmount,
      balance,
      isFullyPaid,
      remarksAdmin:    remarksAdmin ?? null,
    },
  });

  // ── 10. Restore tenant if Suspended + fully paid + no more unpaid ─────────
  if (isFullyPaid) {
    const { data: unpaid } = await supabaseAdmin
      .from("subscription_records")
      .select("subscription_id")
      .eq("tenant_id", tenantId)
      .in("payment_status", ["Pending", "Overdue"])
      .neq("subscription_id", targetSubscriptionId) // exclude the one we just paid
      .limit(1);

    if ((!unpaid || unpaid.length === 0) && tenant?.subscription_status === "Suspended") {
      await supabaseAdmin
        .from("tenants")
        .update({
          subscription_status: "Active",
          is_suspended:        false,
          suspended_until:     null,
          is_active:           true,
        })
        .eq("tenant_id", tenantId);

      await supabaseAdmin
        .from("users")
        .update({ is_active: true })
        .eq("tenant_id", tenantId);

      await supabaseAdmin
        .from("suspended_tenants")
        .delete()
        .eq("tenant_id", tenantId);

      await logAudit({
        performedBy:  reviewedBy ?? "Superadmin",
        eventType:    AuditEvent.TENANT_RESTORED,
        tenantId,
        businessName,
        description:  `Suspension lifted after payment submission accepted and balance cleared.`,
        metadata:     { submissionId },
      });
    }
  }

  return NextResponse.json({
    success:      true,
    isFullyPaid,
    newAmountPaid,
    balance: Math.max(0, billedAmount - newAmountPaid),
  });
}