// app/api/superadmin/payment-submissions/[id]/accept/route.ts
// PATCH — Superadmin accepts a payment submission.
//   • Marks submission as Accepted
//   • Marks linked subscription_record as Paid (or the latest Pending/Overdue one)
//   • Updates tenant subscription_status if they were Suspended
//   • Logs audit events

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/client";
import { logAudit, AuditEvent } from "@/lib/audit";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = createClient();
  const { id: submissionId } = await params;

  const body = await req.json().catch(() => ({}));
  const { remarksAdmin, reviewedBy, amountOverride } = body as {
    remarksAdmin?:   string;
    reviewedBy?:     string;
    amountOverride?: number;
  };

  // 1. Fetch the submission
  const { data: submission, error: sErr } = await supabase
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

  const tenantId = submission.tenant_id;

  // 2. Resolve which subscription_record to mark paid.
  //    Priority: the one linked on the submission, else latest Pending/Overdue for tenant.
  let targetSubscriptionId: string | null = submission.subscription_id ?? null;

  if (!targetSubscriptionId) {
    const { data: latest } = await supabase
      .from("subscription_records")
      .select("subscription_id, billing_period, amount")
      .eq("tenant_id", tenantId)
      .in("payment_status", ["Pending", "Overdue"])
      .order("billing_period", { ascending: false })
      .limit(1)
      .single();

    targetSubscriptionId = latest?.subscription_id ?? null;
  }

  const now = new Date().toISOString();

  // 3. Mark subscription_record as Paid
  if (targetSubscriptionId) {
    const updatePayload: Record<string, unknown> = {
      payment_status: "Paid",
      paid_at:        now,
      recorded_by:    reviewedBy ?? null,
    };
    if (amountOverride !== undefined && amountOverride > 0) {
      updatePayload.amount = amountOverride;
    }

    const { error: recErr } = await supabase
      .from("subscription_records")
      .update(updatePayload)
      .eq("subscription_id", targetSubscriptionId);

    if (recErr) {
      return NextResponse.json({ error: recErr.message }, { status: 500 });
    }
  }

  // 4. Mark submission as Accepted
  const { error: subErr } = await supabase
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

  // 5. Fetch tenant info for audit + possible restoration
  const { data: tenant } = await supabase
    .from("tenants")
    .select("business_name, subscription_status")
    .eq("tenant_id", tenantId)
    .single();

  const businessName = tenant?.business_name ?? null;

  // 6. Audit: payment accepted
  await logAudit({
    performedBy:  reviewedBy ?? "Superadmin",
    eventType:    AuditEvent.PAYMENT_RECORDED,
    tenantId,
    businessName,
    description:  `Payment submission accepted. Proof of payment reviewed and verified.`,
    metadata: {
      submissionId,
      subscriptionId: targetSubscriptionId,
      remarksAdmin:   remarksAdmin ?? null,
    },
  });

  // 7. If tenant was Suspended and no more unpaid records → restore
  const { data: unpaid } = await supabase
    .from("subscription_records")
    .select("subscription_id")
    .eq("tenant_id", tenantId)
    .in("payment_status", ["Pending", "Overdue"])
    .limit(1);

  if ((!unpaid || unpaid.length === 0) && tenant?.subscription_status === "Suspended") {
    await supabase
      .from("tenants")
      .update({
        subscription_status: "Active",
        is_suspended:        false,
        suspended_until:     null,
        is_active:           true,
      })
      .eq("tenant_id", tenantId);

    await supabase
      .from("users")
      .update({ is_active: true })
      .eq("tenant_id", tenantId);

    await supabase
      .from("suspended_tenants")
      .delete()
      .eq("tenant_id", tenantId);

    await logAudit({
      performedBy:  reviewedBy ?? "Superadmin",
      eventType:    AuditEvent.TENANT_RESTORED,
      tenantId,
      businessName,
      description:  `Suspension lifted after payment submission was accepted.`,
      metadata: { submissionId },
    });
  }

  return NextResponse.json({ success: true });
}