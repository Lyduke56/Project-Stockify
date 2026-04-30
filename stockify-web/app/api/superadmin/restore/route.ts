// /app/api/superadmin/restore/route.ts
//
// POST /api/superadmin/restore
// Body: { tenantId, suspendedRowId, remarks? }
//
// Steps:
//  1. Fetch tenant + suspension info
//  2. Update tenants: clear is_suspended + suspended_until
//  3. Delete row from suspended_tenants
//  4. Send restoration confirmation email to owner
//  5. Return success

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendRestorationEmail } from "@/lib/mailer";

export async function POST(req: Request) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const body = await req.json();
  const { tenantId, suspendedRowId, remarks } = body as {
    tenantId: string;
    suspendedRowId: string;
    remarks?: string;
  };

  if (!tenantId || !suspendedRowId) {
    return NextResponse.json(
      { error: "tenantId and suspendedRowId are required." },
      { status: 400 }
    );
  }

  // ── 1. Fetch tenant info ──────────────────────────────────────────────────
  const { data: tenant, error: tenantErr } = await supabase
    .from("tenants")
    .select("business_name, owner_full_name, owner_email")
    .eq("tenant_id", tenantId)
    .single();

  if (tenantErr || !tenant) {
    return NextResponse.json({ error: "Tenant not found." }, { status: 404 });
  }

  // ── 2. Unsuspend — clear suspension fields on tenants table ───────────────
  const { error: unsuspendErr } = await supabase
    .from("tenants")
    .update({
      subscription_status: "Active",
      is_suspended:        false,
      suspended_until:     null,
      is_active:           true,   // ← add this
    })
    .eq("tenant_id", tenantId);

    if (unsuspendErr) {
      return NextResponse.json({ error: unsuspendErr.message }, { status: 500 });
  }

  // ── 3. Delete from suspended_tenants ─────────────────────────────────────
  const { error: deleteErr } = await supabase
    .from("suspended_tenants")
    .delete()
    .eq("id", suspendedRowId);

    if (deleteErr) {
      console.error("[restore] Failed to delete suspended_tenants row:", deleteErr.message);
  }


  // ── 4. Send restoration email ─────────────────────────────────────────────

  await supabase
  .from("users")
  .update({ is_active: true })
  .eq("tenant_id", tenantId);
  
  try {
  await sendRestorationEmail(
    tenant.owner_email,
    tenant.business_name,
    tenant.owner_full_name,
    remarks?.trim() || "Suspension lifted by administrator.",
  );
} catch (e) {
  console.error("[restore] Email failed:", e);
}

  return NextResponse.json({ success: true });
}
