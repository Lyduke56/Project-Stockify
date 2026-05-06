// app/api/superadmin/payment-submissions/route.ts
// GET  — list all pending (or filtered) payment submissions
// POST — superadmin manually creates a payment record (manual entry path)

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/client";
import { logAudit, AuditEvent } from "@/lib/audit";

// ── GET: list submissions ─────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const supabase = createClient(); 
  const { searchParams } = new URL(req.url);
  const status   = searchParams.get("status");   // "Pending" | "Accepted" | "Rejected" | null = all
  const tenantId = searchParams.get("tenantId"); // optional filter

  let query = supabase
    .from("payment_submissions")
    .select(`
      submission_id,
      tenant_id,
      subscription_id,
      submitted_by,
      proof_url,
      amount_declared,
      remarks_tenant,
      status,
      reviewed_by,
      reviewed_at,
      remarks_admin,
      created_at,
      tenants (
        business_name,
        owner_full_name,
        owner_email
      )
    `)
    .order("created_at", { ascending: false });

  if (status)   query = query.eq("status", status);
  if (tenantId) query = query.eq("tenant_id", tenantId);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Count pending for badge
  const { count: pendingCount } = await supabase
    .from("payment_submissions")
    .select("*", { count: "exact", head: true })
    .eq("status", "Pending");

  return NextResponse.json({ submissions: data ?? [], pendingCount: pendingCount ?? 0 });
}