import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY!);

/**
 * POST /api/superadmin/terminate
 * Sends termination email, archives to terminated_business (with remarks),
 * deletes all auth.users for the tenant, then cascades the tenant delete.
 * Body: { tenantId, remarks? }
 */
export async function POST(req: Request) {
  // Service-role client — needed for auth.admin.deleteUser
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

  // ── 1. Fetch tenant info ──────────────────────────────────────────────
  const { data: tenant, error: fetchErr } = await supabase
    .from("tenants")
    .select("business_name, owner_full_name, owner_email")
    .eq("tenant_id", tenantId)
    .single();

  if (fetchErr || !tenant) {
    return NextResponse.json({ error: "Tenant not found." }, { status: 404 });
  }

  // ── 2. Fetch all user IDs for this tenant ─────────────────────────────
  const { data: users, error: usersErr } = await supabase
    .from("users")
    .select("user_id")
    .eq("tenant_id", tenantId);

  if (usersErr) {
    return NextResponse.json({ error: usersErr.message }, { status: 500 });
  }

  // ── 3. Send termination email BEFORE deleting data ───────────────────
  const { error: emailErr } = await resend.emails.send({
    from:    "Stockify <onboarding@resend.dev>",
    to:      tenant.owner_email,
    subject: `[Account Terminated] ${tenant.business_name} — Stockify`,
    html:    buildTerminationEmail({
      ownerName:    tenant.owner_full_name,
      businessName: tenant.business_name,
      remarks:      remarks?.trim() || "Administrative decision — please contact support for details.",
    }),
  });

  if (emailErr) {
    console.error("[terminate] Resend error:", emailErr);
    // Non-fatal — continue with deletion
  }

  // ── 4. Archive into terminated_business ───────────────────────────────
  const { error: archiveErr } = await supabase.from("terminated_business").insert({
    business_name: tenant.business_name,
    owner_name:    tenant.owner_full_name,
    owner_email:   tenant.owner_email,
    remarks:       remarks?.trim() || null,
  });

  if (archiveErr) {
    return NextResponse.json({ error: archiveErr.message }, { status: 500 });
  }

  // ── 5. Delete from auth.users (service role only) ─────────────────────
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

  // ── 6. Delete tenant row (cascades → users + subscription_records) ────
  const { error: deleteErr } = await supabase
    .from("tenants")
    .delete()
    .eq("tenant_id", tenantId);

  if (deleteErr) {
    return NextResponse.json({ error: deleteErr.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

// ── Email builder ─────────────────────────────────────────────────────────────

interface TerminationEmailParams {
  ownerName:    string;
  businessName: string;
  remarks:      string;
}

function buildTerminationEmail(p: TerminationEmailParams): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <title>Account Terminated</title>
  <style>
    body  { font-family:Inter,Arial,sans-serif; background:#f5f5f5; margin:0; padding:0; }
    .wrap { max-width:600px; margin:32px auto; background:#fff; border-radius:12px;
            overflow:hidden; box-shadow:0 2px 12px rgba(0,0,0,.08); }
    .hbar { background:#1a1a1a; padding:24px 32px; }
    .hbar h1 { color:#fff; margin:0; font-size:22px; font-weight:700; }
    .hbar p  { color:#888; margin:4px 0 0; font-size:13px; }
    .body { padding:32px; }
    .rbox { background:#f8f8f8; border-left:4px solid #E91F22; border-radius:4px;
            padding:14px 18px; margin:20px 0; color:#555; font-size:13px; line-height:1.7; }
    .foot { background:#f0f0f0; padding:16px 32px; text-align:center;
            color:#bbb; font-size:11px; }
  </style>
</head>
<body>
<div class="wrap">
  <div class="hbar">
    <h1>Stockify</h1>
    <p>Account Termination Notice</p>
  </div>
  <div class="body">
    <h2 style="color:#1a1a1a;margin:0 0 14px;font-size:20px;">Your Account Has Been Permanently Terminated</h2>
    <p style="color:#333;font-size:15px;">Hi <strong>${escHtml(p.ownerName)}</strong>,</p>
    <p style="color:#555;font-size:14px;line-height:1.7;">
      We are writing to inform you that your Stockify account for
      <strong>${escHtml(p.businessName)}</strong> has been
      <strong>permanently terminated</strong>.
    </p>
    <div class="rbox">
      <strong>Reason for Termination:</strong><br/>
      ${escHtml(p.remarks).replace(/\n/g, "<br/>")}
    </div>
    <p style="color:#555;font-size:14px;line-height:1.7;">
      All data associated with your account has been permanently removed from our systems.
      This action cannot be undone.
    </p>
    <p style="color:#555;font-size:14px;line-height:1.7;">
      If you believe this was done in error or would like to appeal this decision, please
      contact our support team at
      <a href="mailto:support@stockify.ph" style="color:#385E31;">support@stockify.ph</a>
      within 30 days.
    </p>
    <p style="color:#555;font-size:14px;margin-top:24px;">Thank you for your time with Stockify.</p>
    <p style="color:#385E31;font-weight:700;font-size:14px;">The Stockify Admin Team</p>
  </div>
  <div class="foot">
    © ${new Date().getFullYear()} Stockify · This is a final notice regarding your account.
  </div>
</div>
</body>
</html>`;
}

function escHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}