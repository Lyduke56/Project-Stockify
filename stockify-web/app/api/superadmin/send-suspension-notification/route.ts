
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
  const { tenantId } = body as { tenantId: string };

  if (!tenantId) {
    return NextResponse.json({ error: "tenantId is required." }, { status: 400 });
  }

  // ── 1. Fetch suspension record ────────────────────────────────────────────
  const { data: suspension, error: suspErr } = await supabase
    .from("suspended_tenants")
    .select("business_name, owner_name, owner_email, reason, suspended_at, suspension_expires_at")
    .eq("tenant_id", tenantId)
    .single();

  if (suspErr || !suspension) {
    return NextResponse.json({ error: "Suspension record not found." }, { status: 404 });
  }

  if (!suspension.owner_email) {
    return NextResponse.json(
      { error: "No email address on record for this tenant." },
      { status: 400 }
    );
  }

  // ── 2. Calculate days remaining ───────────────────────────────────────────
  let daysRemaining: number | null = null;
  if (suspension.suspension_expires_at) {
    const diff = new Date(suspension.suspension_expires_at).getTime() - Date.now();
    daysRemaining = Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  // ── 3. Fetch outstanding balance (most recent Overdue or Pending record) ──
  const { data: balanceRecord } = await supabase
    .from("subscription_records")
    .select("amount, billing_period, payment_status")
    .eq("tenant_id", tenantId)
    .in("payment_status", ["Overdue", "Pending"])
    .order("billing_period", { ascending: false })
    .limit(1)
    .maybeSingle();

  // ── 4. Send email ─────────────────────────────────────────────────────────
  const { error: emailErr } = await resend.emails.send({
    from: "Stockify <onboarding@resend.dev>",
    to: suspension.owner_email,
    subject: `[Action Required] Your Stockify Account is Suspended — ${suspension.business_name}`,
    html: buildSuspensionWarningEmail({
      ownerName:       suspension.owner_name,
      businessName:    suspension.business_name,
      reason:          suspension.reason || "Administrative review",
      daysRemaining,
      outstandingAmount: balanceRecord ? Number(balanceRecord.amount) : null,
      billingPeriod: balanceRecord
        ? new Date(balanceRecord.billing_period).toLocaleDateString("en-PH", {
            month: "long",
            year:  "numeric",
          })
        : null,
    }),
  });

  if (emailErr) {
    console.error("[send-suspension-notification] Resend error:", emailErr);
    return NextResponse.json({ error: "Failed to send email." }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

// ── Email builder ─────────────────────────────────────────────────────────────

interface SuspensionWarningEmailParams {
  ownerName:         string;
  businessName:      string;
  reason:            string;
  daysRemaining:     number | null;
  outstandingAmount: number | null;
  billingPeriod:     string | null;
}

function buildSuspensionWarningEmail(p: SuspensionWarningEmailParams): string {
  const urgencyColor =
    p.daysRemaining !== null && p.daysRemaining <= 2 ? "#E91F22" : "#E5AD24";

  const deadlineBlock =
    p.daysRemaining !== null
      ? `<div style="background:${urgencyColor}15;border-left:4px solid ${urgencyColor};border-radius:4px;padding:14px 18px;margin:20px 0;color:#333;font-size:14px;line-height:1.7;">
          <strong style="color:${urgencyColor};">
            ${
              p.daysRemaining <= 0
                ? "⚠️ Your suspension period has already expired."
                : `⏳ You have ${p.daysRemaining} day${p.daysRemaining === 1 ? "" : "s"} remaining to resolve this issue.`
            }
          </strong><br/>
          Failure to resolve the issue by the deadline will result in the
          <strong>permanent termination</strong> of your account and all associated data.
        </div>`
      : `<div style="background:#f8f8f8;border-left:4px solid #E5AD24;border-radius:4px;padding:14px 18px;margin:20px 0;color:#555;font-size:13px;line-height:1.7;">
          Please resolve the issue as soon as possible to avoid permanent termination of your account.
        </div>`;

  const balanceBlock = p.outstandingAmount
    ? `<div style="background:#fff8f8;border:1px solid #ffcccc;border-radius:8px;padding:14px 18px;margin:16px 0;">
        <p style="margin:0;font-size:13px;color:#555;">
          Outstanding Balance${p.billingPeriod ? ` (${escHtml(p.billingPeriod)})` : ""}:
        </p>
        <p style="margin:4px 0 0;font-size:28px;font-weight:900;color:#E91F22;">
          ₱${p.outstandingAmount.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
        </p>
      </div>`
    : "";

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <title>Account Suspended — Action Required</title>
  <style>
    body  { font-family: Inter, Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 0; }
    .wrap { max-width: 600px; margin: 32px auto; background: #fff; border-radius: 12px;
            overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,.08); }
    .hbar { background: #385E31; padding: 24px 32px; }
    .hbar h1 { color: #FFFCEB; margin: 0; font-size: 22px; font-weight: 700; }
    .hbar p  { color: #FFFCEB99; margin: 4px 0 0; font-size: 13px; }
    .body { padding: 32px; }
    .foot { background: #f0f0f0; padding: 16px 32px; text-align: center;
            color: #bbb; font-size: 11px; }
  </style>
</head>
<body>
<div class="wrap">
  <div class="hbar">
    <h1>Stockify</h1>
    <p>Account Suspension Notice — Action Required</p>
  </div>
  <div class="body">
    <h2 style="color:#1a1a1a; margin:0 0 14px; font-size:20px;">Your Account Has Been Suspended</h2>
    <p style="color:#333; font-size:15px;">Hi <strong>${escHtml(p.ownerName)}</strong>,</p>
    <p style="color:#555; font-size:14px; line-height:1.7;">
      Your Stockify account for <strong>${escHtml(p.businessName)}</strong> has been
      temporarily suspended.
    </p>
    <div style="background:#f8f8f8;border-left:4px solid #385E31;border-radius:4px;padding:14px 18px;margin:16px 0;color:#555;font-size:13px;line-height:1.7;">
      <strong>Reason for Suspension:</strong><br/>
      ${escHtml(p.reason).replace(/\n/g, "<br/>")}
    </div>
    ${balanceBlock}
    ${deadlineBlock}
    <p style="color:#555; font-size:14px; line-height:1.7;">
      To have your account reinstated, please resolve all outstanding issues and contact
      our support team at
      <a href="mailto:support@stockify.ph" style="color:#385E31;">support@stockify.ph</a>.
    </p>
    <p style="color:#555; font-size:14px; margin-top:24px;">Thank you for your understanding.</p>
    <p style="color:#385E31; font-weight:700; font-size:14px;">The Stockify Admin Team</p>
  </div>
  <div class="foot">
    © ${new Date().getFullYear()} Stockify · Please do not reply to this email — contact support@stockify.ph instead.
  </div>
</div>
</body>
</html>`;
}

function escHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}