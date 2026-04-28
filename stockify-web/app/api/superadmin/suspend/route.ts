import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { Resend } from "resend";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const resend = new Resend(process.env.RESEND_API_KEY!);

const SUSPENSION_DAYS = 7; // days before auto-termination

/**
 * POST /api/superadmin/suspend
 * Suspends a tenant, sets suspension_expires_at (+7 days), logs to suspended_tenants,
 * and sends a suspension email via Resend.
 * Body: { tenantId, reason? }
 */
export async function POST(req: Request) {
  const body = await req.json();
  const { tenantId, reason } = body as { tenantId: string; reason?: string };

  if (!tenantId) {
    return NextResponse.json({ error: "tenantId is required." }, { status: 400 });
  }

  // ── 1. Fetch tenant ───────────────────────────────────────────────────
  const { data: tenant, error: fetchErr } = await supabase
    .from("tenants")
    .select("business_name, owner_full_name, owner_email")
    .eq("tenant_id", tenantId)
    .single();

  if (fetchErr || !tenant) {
    return NextResponse.json({ error: "Tenant not found." }, { status: 404 });
  }

  const suspensionExpiresAt = new Date();
  suspensionExpiresAt.setDate(suspensionExpiresAt.getDate() + SUSPENSION_DAYS);

  const expiryLabel = suspensionExpiresAt.toLocaleDateString("en-PH", {
    month: "long", day: "numeric", year: "numeric",
  });

  // ── 2. Update tenant record ───────────────────────────────────────────
  const { error: updateErr } = await supabase
    .from("tenants")
    .update({
      subscription_status: "Suspended",
      is_suspended:        true,
      suspended_until:     suspensionExpiresAt.toISOString(),
    })
    .eq("tenant_id", tenantId);

  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 500 });
  }

  // ── 3. Audit log ──────────────────────────────────────────────────────
  const { error: insertErr } = await supabase.from("suspended_tenants").insert({
    tenant_id:             tenantId,
    business_name:         tenant.business_name,
    owner_name:            tenant.owner_full_name,
    owner_email:           tenant.owner_email,
    reason:                reason?.trim() || "Overdue subscription payment",
    suspension_expires_at: suspensionExpiresAt.toISOString(),
  });

  if (insertErr) {
    // Non-fatal — tenant is already suspended
    console.error("[suspend] suspended_tenants insert error:", insertErr.message);
  }

  // ── 4. Send suspension email ──────────────────────────────────────────
  const { error: emailErr } = await resend.emails.send({
    from:    "Stockify <onboarding@resend.dev>",
    to:      tenant.owner_email,
    subject: `[Account Suspended] ${tenant.business_name} — Pay Within 7 Days to Avoid Termination`,
    html:    buildSuspensionEmail({
      ownerName:    tenant.owner_full_name,
      businessName: tenant.business_name,
      reason:       reason?.trim() || "overdue subscription payment",
      expiryLabel,
    }),
  });

  if (emailErr) {
    console.error("[suspend] Resend error:", emailErr);
    // Still return success — the tenant is suspended even if email failed
  }

  return NextResponse.json({ success: true });
}

// ── Email builder ─────────────────────────────────────────────────────────────

interface SuspensionEmailParams {
  ownerName:    string;
  businessName: string;
  reason:       string;
  expiryLabel:  string;
}

function buildSuspensionEmail(p: SuspensionEmailParams): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <title>Account Suspended</title>
  <style>
    body  { font-family:Inter,Arial,sans-serif; background:#f5f5f5; margin:0; padding:0; }
    .wrap { max-width:600px; margin:32px auto; background:#fff; border-radius:12px;
            overflow:hidden; box-shadow:0 2px 12px rgba(0,0,0,.08); }
    .hbar { background:#E91F22; padding:24px 32px; }
    .hbar h1 { color:#fff; margin:0; font-size:22px; font-weight:700; }
    .hbar p  { color:#ffc8c8; margin:4px 0 0; font-size:13px; }
    .body { padding:32px; }
    .alert{ background:#fff0f0; border:1.5px solid #E91F22; border-radius:8px;
            padding:14px 18px; color:#E91F22; font-size:13px; font-weight:600;
            margin-bottom:20px; }
    .box  { background:#FFFCEB; border:1.5px solid #F7B71D; border-radius:8px;
            padding:16px 20px; margin-bottom:20px; }
    .box .lbl  { color:#385E31; font-size:11px; font-weight:700;
                 text-transform:uppercase; letter-spacing:.06em; }
    .box .date { color:#385E31; font-size:20px; font-weight:700; margin:4px 0 4px; }
    .box .sub  { color:#666; font-size:12px; }
    ol    { color:#444; font-size:14px; line-height:1.9; padding-left:20px; margin:12px 0; }
    .btn  { display:inline-block; background:#385E31; color:#FFFCEB !important;
            padding:12px 28px; border-radius:40px; text-decoration:none;
            font-weight:700; font-size:14px; margin:16px 0; }
    .warn { color:#999; font-size:12px; line-height:1.7; border-top:1px solid #eee;
            padding-top:18px; margin-top:24px; }
    .foot { background:#f0f0f0; padding:16px 32px; text-align:center;
            color:#bbb; font-size:11px; }
  </style>
</head>
<body>
<div class="wrap">
  <div class="hbar">
    <h1>Stockify</h1>
    <p>Account Suspension Notice</p>
  </div>
  <div class="body">
    <h2 style="color:#E91F22;margin:0 0 14px;font-size:20px;">Your Account Has Been Suspended</h2>
    <p style="color:#333;font-size:15px;">Hi <strong>${escHtml(p.ownerName)}</strong>,</p>
    <p style="color:#555;font-size:14px;line-height:1.7;">
      Your Stockify account for <strong>${escHtml(p.businessName)}</strong> has been
      <strong>suspended</strong> due to <strong>${escHtml(p.reason)}</strong>.
    </p>
    <div class="alert">⚠ Your account access is currently restricted.</div>
    <div class="box">
      <div class="lbl">Termination Deadline</div>
      <div class="date">${escHtml(p.expiryLabel)}</div>
      <div class="sub">You have <strong>7 days</strong> from today to settle your outstanding balance.</div>
    </div>
    <p style="color:#333;font-size:14px;font-weight:600;">What you need to do:</p>
    <ol>
      <li>Log in to your Stockify dashboard.</li>
      <li>Navigate to <strong>Billing &amp; Subscription</strong>.</li>
      <li>Pay your outstanding balance of <strong>₱1,000.00</strong>.</li>
      <li>Your account will be reactivated within 24 hours of payment confirmation.</li>
    </ol>
    <a href="#" class="btn">Go to Dashboard</a>
    <p class="warn">
      <strong>Important:</strong> If payment is not received by <strong>${escHtml(p.expiryLabel)}</strong>,
      your account will be <strong>permanently terminated</strong> and all associated data will be deleted.
      This action is irreversible. For assistance, contact
      <a href="mailto:support@stockify.ph" style="color:#385E31;">support@stockify.ph</a>.
    </p>
  </div>
  <div class="foot">
    © ${new Date().getFullYear()} Stockify · Automated account notice.
  </div>
</div>
</body>
</html>`;
}

function escHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}