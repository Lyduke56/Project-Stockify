// app/api/client/billing/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tenantId = searchParams.get("tenantId");
  const userId   = searchParams.get("userId");   // auth UUID from session

  // ── If only userId is provided, resolve tenant_id first ──────────────────
  let resolvedTenantId = tenantId;

  if (!resolvedTenantId && userId) {
    const { data: userRow, error: userErr } = await supabase
      .from("users")
      .select("user_id, tenant_id")
      .eq("user_id", userId)
      .maybeSingle();

    if (userErr || !userRow) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    resolvedTenantId = userRow.tenant_id;
  }

  if (!resolvedTenantId) {
    return NextResponse.json({ error: "tenantId or userId is required." }, { status: 400 });
  }

  const { data: tenant, error } = await supabase
    .from("tenants")
    .select(`
      tenant_id,
      business_name,
      owner_full_name,
      owner_email,
      subscription_status,
      trial_ends_at,
      is_suspended,
      suspended_until
    `)
    .eq("tenant_id", resolvedTenantId)
    .single();

  if (error || !tenant) {
    return NextResponse.json({ error: "Tenant not found." }, { status: 404 });
  }

  const { count: memberCount } = await supabase
    .from("users")
    .select("*", { count: "exact", head: true })
    .eq("tenant_id", resolvedTenantId)
    .eq("is_active", true)
    .in("role", ["Employee", "Manager", "Administrator"]);

  return NextResponse.json({
    user: { user_id: userId, tenant_id: resolvedTenantId },
    tenant: { ...tenant, member_count: memberCount ?? 0 },
  });
}