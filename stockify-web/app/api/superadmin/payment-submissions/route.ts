// app/api/superadmin/payment-submissions/route.ts
// GET  — list all pending (or filtered) payment submissions
// POST — superadmin manually creates a payment record (manual entry path)

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { logAudit, AuditEvent } from "@/lib/audit";

// ── GET: list submissions ─────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const supabase = await createClient(); 
  const { searchParams } = new URL(req.url);
  const status   = searchParams.get("status");
  const tenantId = searchParams.get("tenantId");

  let query = supabase
    .from("payment_submissions")
    .select(
      "submission_id, tenant_id, subscription_id, submitted_by, proof_url, amount_declared, remarks_tenant, status, reviewed_by, reviewed_at, remarks_admin, created_at"
    )
    .order("created_at", { ascending: false });

  if (status)   query = query.eq("status", status);
  if (tenantId) query = query.eq("tenant_id", tenantId);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Resolve tenant info separately (no FK join)
  const ids = [...new Set((data || []).map((s: any) => s.tenant_id).filter(Boolean))];
  let tenantMap = new Map<string, { business_name: string; owner_full_name: string; owner_email: string }>();
  if (ids.length > 0) {
    const { data: tenants } = await supabase
      .from("tenants")
      .select("tenant_id, business_name, owner_full_name, owner_email")
      .in("tenant_id", ids);
    (tenants || []).forEach((t: any) => tenantMap.set(t.tenant_id, t));
  }

  const enriched = (data || []).map((s: any) => ({
    ...s,
    tenants: tenantMap.get(s.tenant_id) ?? { business_name: null, owner_full_name: null, owner_email: null },
  }));

  // Count pending for badge
  const { count: pendingCount } = await supabase
    .from("payment_submissions")
    .select("*", { count: "exact", head: true })
    .eq("status", "Pending");

  return NextResponse.json({ submissions: enriched, pendingCount: pendingCount ?? 0 });
}