import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js"; // ← direct import, no browser client
import { sendApprovalEmail, sendRejectionEmail } from "@/lib/email";

// Service role client — bypasses RLS entirely
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ─── GET: fetch all pending tenants ──────────────────────────────────────────
export async function GET() {
  const { data, error } = await supabase
    .from("tenants")
    .select("tenant_id, business_name, owner_full_name, owner_email, created_at")
    .eq("subscription_status", "Pending")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}

// ─── POST: approve or reject a tenant ────────────────────────────────────────
export async function POST(req: NextRequest) {
  const { tenantId, action } = await req.json();

  if (!tenantId || !action) {
    return NextResponse.json(
      { error: "tenantId and action are required." },
      { status: 400 }
    );
  }

  const { data: tenant, error: tenantFetchError } = await supabase
    .from("tenants")
    .select("business_name, owner_email, owner_full_name")
    .eq("tenant_id", tenantId)
    .single();

  if (tenantFetchError || !tenant) {
    return NextResponse.json({ error: "Tenant not found." }, { status: 404 });
  }

  // ── APPROVE ─────────────────────────────────────────────────────────────────
  if (action === "approve") {
    const { error: tenantUpdateError } = await supabase
      .from("tenants")
      .update({ is_active: true, subscription_status: "Active" })
      .eq("tenant_id", tenantId);

    if (tenantUpdateError) {
      return NextResponse.json({ error: tenantUpdateError.message }, { status: 500 });
    }

    const { error: userUpdateError } = await supabase
      .from("users")
      .update({ is_active: true })
      .eq("tenant_id", tenantId);

    if (userUpdateError) {
      return NextResponse.json({ error: userUpdateError.message }, { status: 500 });
    }

    try {
      await sendApprovalEmail(tenant.owner_email, tenant.business_name);
    } catch {
      console.warn("Approval email failed — continuing.");
    }

    return NextResponse.json({ success: true });
  }

  // ── REJECT ───────────────────────────────────────────────────────────────────
  if (action === "reject") {

      // 1. Get user_id (REQUIRED)
      const { data: publicUser, error: userFetchError } = await supabase
        .from("users")
        .select("user_id")
        .eq("tenant_id", tenantId)
        .single();

      if (userFetchError || !publicUser) {
        return NextResponse.json(
          { error: "User not found for this tenant." },
          { status: 404 }
        );
      }

      // 2. Save to terminated table
      const { error: terminatedError } = await supabase
        .from("terminated_business")
        .insert({
          business_name: tenant.business_name,
          owner_name: tenant.owner_full_name,
        });

      if (terminatedError) {
        return NextResponse.json({ error: terminatedError.message }, { status: 500 });
      }

      // 3. Delete AUTH USER FIRST
      const { error: authDeleteError } = await supabase.auth.admin.deleteUser(
        publicUser.user_id
      );

      if (authDeleteError) {
        return NextResponse.json(
          { error: "Failed to delete auth user: " + authDeleteError.message },
          { status: 500 }
        );
      }

      // 4. Delete tenant (cascade deletes public.users)
      const { error: deleteError } = await supabase
        .from("tenants")
        .delete()
        .eq("tenant_id", tenantId);

      if (deleteError) {
        return NextResponse.json({ error: deleteError.message }, { status: 500 });
      }

      // 5. Email (non-blocking)
      try {
        await sendRejectionEmail(tenant.owner_email, tenant.business_name);
      } catch {
        console.warn("Rejection email failed — continuing.");
      }

      return NextResponse.json({ success: true });
    }

  return NextResponse.json({ error: "Invalid action." }, { status: 400 });
}