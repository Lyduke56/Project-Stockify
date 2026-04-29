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
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY!);

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
      is_suspended: false,
      suspended_until: null,
      // Keep is_active: true — it should never have been set to false on suspend
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
    // Non-fatal — log but don't fail; tenant is already unsuspended
    console.error("[restore] Failed to delete suspended_tenants row:", deleteErr.message);
  }

  // ── 4. Send restoration email ─────────────────────────────────────────────
  if (tenant.owner_email) {
    const { error: emailErr } = await resend.emails.send({
      from: "Stockify <onboarding@resend.dev>",
      to: tenant.owner_email,
      subject: `[Account Restored] ${tenant.business_name} — Stockify`,
      html: buildRestorationEmail({
        ownerName: tenant.owner_full_name,
        businessName: tenant.business_name,
        remarks: remarks?.trim() || "Suspension lifted by administrator.",
      }),
    });

    if (emailErr) {
      // Non-fatal — account is restored, just log the email failure
      console.error("[restore] Resend error:", emailErr);
    }
  }

  return NextResponse.json({ success: true });
}

// ── Email builder ─────────────────────────────────────────────────────────────

function buildRestorationEmail({
  ownerName,
  businessName,
  remarks,
}: {
  ownerName: string;
  businessName: string;
  remarks: string;
}): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <title>Account Restored</title>
  <style>
    body  { font-family: Inter, Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 0; }
    .wrap { max-width: 600px; margin: 32px auto; background: #fff; border-radius: 12px;
            overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,.08); }
    .hbar { background: #385E31; padding: 24px 32px; }
    .hbar h1 { color: #FFFCEB; margin: 0; font-size: 22px; font-weight: 700; }
    .hbar p  { color: #FFFCEB99; margin: 4px 0 0; font-size: 13px; }
    .body { padding: 32px; }
    .note { background: #f0faf0; border-left: 4px solid #385E31; border-radius: 4px;
            padding: 14px 18px; margin: 20px 0; color: #333; font-size: 13px; line-height: 1.7; }
    .foot { background: #f0f0f0; padding: 16px 32px; text-align: center;
            color: #bbb; font-size: 11px; }
  </style>
</head>
<body>
<div class="wrap">
  <div class="hbar">
    <h1>Stockify</h1>
    <p>Account Restoration Notice</p>
  </div>
  <div class="body">
    <h2 style="color:#1a1a1a; margin:0 0 14px; font-size:20px;">
      ✅ Your Account Has Been Restored
    </h2>
    <p style="color:#333; font-size:15px;">Hi <strong>${escHtml(ownerName)}</strong>,</p>
    <p style="color:#555; font-size:14px; line-height:1.7;">
      Great news! Your Stockify account for <strong>${escHtml(businessName)}</strong>
      has been <strong>fully restored</strong>. You now have complete access to all features.
    </p>
    <div class="note">
      <strong>Restoration Note:</strong><br/>
      ${escHtml(remarks).replace(/\n/g, "<br/>")}
    </div>
    <p style="color:#555; font-size:14px; line-height:1.7;">
      If you have any questions or need assistance getting started again, please contact our
      support team at
      <a href="mailto:support@stockify.ph" style="color:#385E31;">support@stockify.ph</a>.
    </p>
    <p style="color:#555; font-size:14px; margin-top:24px;">
      Welcome back to Stockify!
    </p>
    <p style="color:#385E31; font-weight:700; font-size:14px;">The Stockify Admin Team</p>
  </div>
  <div class="foot">
    © ${new Date().getFullYear()} Stockify · Please do not reply to this email.
  </div>
</div>
</body>
</html>`;
}

function escHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}