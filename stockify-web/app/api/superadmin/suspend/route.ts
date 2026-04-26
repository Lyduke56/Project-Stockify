import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {

  const body = await req.json();
  const { tenantId } = body as { tenantId: string };

  if (!tenantId) {
    return NextResponse.json({ error: "tenantId is required." }, { status: 400 });
  }

  // ── 1. Get tenant info ────────────────────────────────────────────────────
  const { data: tenant, error: fetchErr } = await supabase
    .from("tenants")
    .select("business_name, owner_full_name")
    .eq("tenant_id", tenantId)
    .single();

  if (fetchErr || !tenant) {
    return NextResponse.json({ error: "Tenant not found." }, { status: 404 });
  }

  // ── 2. Mark tenant as suspended ───────────────────────────────────────────
  const { error: updateErr } = await supabase
    .from("tenants")
    .update({
      subscription_status: "Suspended",
      is_suspended:           true,
    })
    .eq("tenant_id", tenantId);

  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 500 });
  }

  // ── 3. Insert into suspended_tenants audit log ────────────────────────────
  const { error: insertErr } = await supabase.from("suspended_tenants").insert({
    tenant_id:     tenantId,
    business_name: tenant.business_name,
    owner_name:    tenant.owner_full_name,
  });

  if (insertErr) {
    // Non-fatal — tenant is already suspended; log and continue
    console.error("suspended_tenants insert error:", insertErr.message);
  }

  return NextResponse.json({ success: true });
}