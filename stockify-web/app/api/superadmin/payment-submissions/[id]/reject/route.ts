// app/api/superadmin/payment-submissions/[id]/reject/route.ts
// PATCH — Superadmin rejects a payment submission.
//   • Marks submission as Rejected with admin remarks
//   • Does NOT touch subscription_records (payment not verified)
//   • Logs audit event

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { logAudit, AuditEvent } from "@/lib/audit";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { id: submissionId } = await params;

  const body = await req.json().catch(() => ({}));
  const { remarksAdmin, reviewedBy } = body as {
    remarksAdmin?: string;
    reviewedBy?:   string;
  };

  if (!remarksAdmin?.trim()) {
    return NextResponse.json(
      { error: "A rejection reason (remarksAdmin) is required." },
      { status: 400 }
    );
  }

  // 1. Fetch submission to validate state
  const { data: submission, error: sErr } = await supabase
    .from("payment_submissions")
    .select("status, tenant_id, submission_id")
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

  const now      = new Date().toISOString();
  const tenantId = submission.tenant_id;

  // 2. Mark submission as Rejected
  const { error: upErr } = await supabase
    .from("payment_submissions")
    .update({
      status:        "Rejected",
      reviewed_by:   reviewedBy ?? null,
      reviewed_at:   now,
      remarks_admin: remarksAdmin.trim(),
    })
    .eq("submission_id", submissionId);

  if (upErr) {
    return NextResponse.json({ error: upErr.message }, { status: 500 });
  }

  // 3. Fetch tenant name for audit
  const { data: tenant } = await supabase
    .from("tenants")
    .select("business_name")
    .eq("tenant_id", tenantId)
    .single();

  // 4. Audit log
  await logAudit({
    performedBy:  reviewedBy ?? "Superadmin",
    eventType:    "PAYMENT_REJECTED" as any,
    tenantId,
    businessName: tenant?.business_name ?? null,
    description:  `Payment submission rejected. Reason: ${remarksAdmin.trim()}`,
    metadata: { submissionId, remarksAdmin: remarksAdmin.trim() },
  });

  return NextResponse.json({ success: true });
}