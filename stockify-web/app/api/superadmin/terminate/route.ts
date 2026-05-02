import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { sendTerminationEmail } from "@/lib/mailer";
import { logAudit, AuditEvent } from "@/lib/audit";

export async function POST(req: Request) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const body = await req.json();
  const { tenantId, remarks } = body as { tenantId: string; remarks?: string };

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

  // ── 2. Fetch all user IDs for this tenant ─────────────────────────────────
  const { data: users, error: usersErr } = await supabase
    .from("users")
    .select("user_id")
    .eq("tenant_id", tenantId);

  if (usersErr) {
    return NextResponse.json({ error: usersErr.message }, { status: 500 });
  }

  // ── 3. Send termination email BEFORE deleting data ───────────────────────
  try {
    await sendTerminationEmail(
      tenant.owner_email,
      tenant.business_name,
      tenant.owner_full_name,
      remarks?.trim() || "Administrative decision — please contact support for details.",
    );
  } catch (e) {
    console.error("[terminate] Email failed:", e);
  }

  // ── 4. Archive into terminated_business ──────────────────────────────────
  const { error: archiveErr } = await supabase.from("terminated_business").insert({
    business_name: tenant.business_name,
    owner_name:    tenant.owner_full_name,
    owner_email:   tenant.owner_email,
    remarks:       remarks?.trim() || null,
  });

  if (archiveErr) {
    return NextResponse.json({ error: archiveErr.message }, { status: 500 });
  }

  // ── 5. Audit: tenant terminated ───────────────────────────────────────────
  // Log BEFORE auth deletion while tenantId is still valid in the record
  await logAudit({
    performedBy:  "Superadmin",
    eventType:    AuditEvent.TENANT_TERMINATED,
    tenantId,
    businessName: tenant.business_name,
    description:  `Tenant permanently terminated. Remarks: "${remarks?.trim() || "Administrative decision — please contact support for details."}"`,
    metadata: {
      ownerEmail:  tenant.owner_email,
      remarks:     remarks?.trim() ?? null,
      userCount:   users?.length ?? 0,
    },
  });

  // ── 6. Delete from auth.users ─────────────────────────────────────────────
  if (users && users.length > 0) {
    const results = await Promise.allSettled(
      users.map((u) => supabase.auth.admin.deleteUser(u.user_id))
    );
    const failed = results.filter((r) => r.status === "rejected");
    if (failed.length > 0) {
      console.error(
        "[terminate] Some auth.users deletions failed:",
        failed.map((f) => (f as PromiseRejectedResult).reason)
      );
    }
  }

  // ── 7. Delete tenant row (cascades → users + subscription_records) ────────
  const { error: deleteErr } = await supabase
    .from("tenants")
    .delete()
    .eq("tenant_id", tenantId);

  if (deleteErr) {
    return NextResponse.json({ error: deleteErr.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}