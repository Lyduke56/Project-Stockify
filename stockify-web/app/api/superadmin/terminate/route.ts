
import { createClient as createAdminClient, createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {

  // Service-role client needed to delete from auth.users
  const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const body = await req.json();
  const { tenantId } = body as { tenantId: string };

  if (!tenantId) {
    return NextResponse.json({ error: "tenantId is required." }, { status: 400 });
  }

  // ── 1. Fetch tenant info ──────────────────────────────────────────────────
  const { data: tenant, error: fetchErr } = await supabase
    .from("tenants")
    .select("business_name, owner_full_name, owner_email")
    .eq("tenant_id", tenantId)
    .single();

  if (fetchErr || !tenant) {
    return NextResponse.json({ error: "Tenant not found." }, { status: 404 });
  }

  // ── 2. Fetch all public user IDs for this tenant ──────────────────────────
  const { data: users, error: usersErr } = await supabase
    .from("users")
    .select("user_id")
    .eq("tenant_id", tenantId);

  if (usersErr) {
    return NextResponse.json({ error: usersErr.message }, { status: 500 });
  }

  // ── 3. Archive into terminated_business ───────────────────────────────────
  const { error: archiveErr } = await supabase.from("terminated_business").insert({
    business_name: tenant.business_name,
    owner_name:    tenant.owner_full_name,
  });

  if (archiveErr) {
    return NextResponse.json({ error: archiveErr.message }, { status: 500 });
  }

  // ── 4. Delete each user from auth.users (service role) ───────────────────
  if (users && users.length > 0) {
    const deletions = users.map((u) =>
      supabaseAdmin.auth.admin.deleteUser(u.user_id)
    );

    const results = await Promise.allSettled(deletions);
    const failed  = results.filter((r) => r.status === "rejected");
    if (failed.length > 0) {
      console.error(
        "Some auth.users deletions failed:",
        failed.map((f) => (f as PromiseRejectedResult).reason)
      );
      // Continue anyway — public.users will still be cleaned up by the cascade below
    }
  }

  // ── 5. Delete tenant (cascades → public.users + subscription_records) ────
  const { error: deleteErr } = await supabase
    .from("tenants")
    .delete()
    .eq("tenant_id", tenantId);

  if (deleteErr) {
    return NextResponse.json({ error: deleteErr.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}