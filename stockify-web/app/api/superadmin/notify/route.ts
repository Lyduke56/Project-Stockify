import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const resend = new Resend(process.env.RESEND_API_KEY!);

/**
 * POST /api/superadmin/notify
 * Sends a customisable billing-reminder email to the tenant owner via Resend.
 * Body: { tenantId, title, header, about, body, description }
 */
export async function POST(req: Request) {
  const raw = await req.json();
  const {
    tenantId,
    title       = "",
    header      = "",
    about       = "",
    body        = "",
    description = "",
  } = raw as {
    tenantId:    string;
    title:       string;
    header:      string;
    about:       string;
    body:        string;
    description: string;
  };

  if (!tenantId) {
    return NextResponse.json({ error: "tenantId is required." }, { status: 400 });
  }

  // ── 1. Fetch tenant + subscription records ────────────────────────────
  const { data: tenant, error: fetchErr } = await supabase
    .from("tenants")
    .select(
      `business_name, owner_full_name, owner_email,
       subscription_records ( billing_period, payment_status, amount )`
    )
    .eq("tenant_id", tenantId)
    .single();

  if (fetchErr || !tenant) {
    return NextResponse.json({ error: "Tenant not found." }, { status: 404 });
  }

  const recipientEmail = (tenant as any).owner_email   as string;
  const businessName   = (tenant as any).business_name as string;
  const ownerName      = (tenant as any).owner_full_name as string;

  // ── 2. Resolve earliest unpaid billing period ─────────────────────────
  const records: { billing_period: string; payment_status: string; amount: number }[] =
    (tenant as any).subscription_records ?? [];

  const unpaidRecords = records
    .filter((r) => r.payment_status === "Pending" || r.payment_status === "Overdue")
    .sort(
      (a, b) => new Date(a.billing_period).getTime() - new Date(b.billing_period).getTime()
    );

  const dueDateLabel =
    unpaidRecords.length > 0
      ? new Date(unpaidRecords[0].billing_period + "T00:00:00").toLocaleDateString("en-PH", {
          month: "long", day: "numeric", year: "numeric",
        })
      : "your upcoming billing date";

  // ── 3. Build and send email ───────────────────────────────────────────
  const subject =
    title.trim() ||
    `[Action Required] Subscription Payment Due — ${businessName}`;

  const htmlEmail = buildReminderEmail({
    ownerName,
    businessName,
    header:      header.trim()      || "Subscription Payment Reminder",
    about:       about.trim()       || `Your monthly subscription for ${businessName} requires attention.`,
    body:        body.trim()        || `Your monthly subscription fee of ₱1,000.00 is due on ${dueDateLabel}. You have a 7-day grace period from your billing date to complete your payment before your account is marked Overdue.`,
    description: description.trim() || "Failure to pay within the grace period will result in your account being marked Overdue, and further non-payment may lead to temporary suspension. Please log in to your Stockify dashboard to settle your balance.",
    dueDateLabel,
  });

  const { error: emailErr } = await resend.emails.send({
    from:    "Stockify <onboarding@resend.dev>",
    to:      recipientEmail,
    subject,
    html:    htmlEmail,
  });

  if (emailErr) {
    console.error("[notify] Resend error:", emailErr);
    return NextResponse.json({ error: "Failed to send email." }, { status: 500 });
  }

  // ── 4. Log notification ───────────────────────────────────────────────
  await supabase.from("billing_notifications").insert({
    tenant_id:         tenantId,
    notification_type: "reminder",
    recipient_email:   recipientEmail,
    subject,
  });

  // ── 5. Stamp notification_sent_at on earliest unpaid record ──────────
  if (unpaidRecords.length > 0) {
    await supabase
      .from("subscription_records")
      .update({ notification_sent_at: new Date().toISOString() })
      .eq("tenant_id", tenantId)
      .eq("billing_period", unpaidRecords[0].billing_period);
  }

  return NextResponse.json({ success: true, sentTo: recipientEmail });
}

// ── Email builder ─────────────────────────────────────────────────────────────

interface ReminderEmailParams {
  ownerName:    string;
  businessName: string;
  header:       string;
  about:        string;
  body:         string;
  description:  string;
  dueDateLabel: string;
}

function buildReminderEmail(p: ReminderEmailParams): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${p.header}</title>
  <style>
    body   { font-family: Inter, Arial, sans-serif; background:#f5f5f5; margin:0; padding:0; }
    .wrap  { max-width:600px; margin:32px auto; background:#fff; border-radius:12px; overflow:hidden; box-shadow:0 2px 12px rgba(0,0,0,.08); }
    .hbar  { background:#385E31; padding:24px 32px; }
    .hbar h1 { color:#FFFCEB; margin:0; font-size:22px; font-weight:700; }
    .hbar p  { color:#c8e6b8; margin:4px 0 0; font-size:13px; }
    .body  { padding:32px; }
    .badge { background:#F7B71D; color:#385E31; display:inline-block; padding:4px 14px;
             border-radius:40px; font-size:12px; font-weight:700; margin-bottom:14px; }
    .about { color:#777; font-size:14px; font-style:italic; margin:0 0 18px; }
    .due   { background:#FFFCEB; border:1.5px solid #F7B71D; border-radius:8px;
             padding:16px 20px; margin:20px 0; }
    .due .lbl  { color:#385E31; font-size:11px; font-weight:700; text-transform:uppercase;
                 letter-spacing:.06em; }
    .due .date { color:#385E31; font-size:20px; font-weight:700; margin:4px 0 2px; }
    .due .amt  { color:#E5AD24; font-size:13px; font-weight:600; }
    .main  { color:#444; font-size:14px; line-height:1.8; white-space:pre-line; }
    .btn   { display:inline-block; background:#385E31; color:#FFFCEB !important;
             padding:12px 28px; border-radius:40px; text-decoration:none;
             font-weight:700; font-size:14px; margin:20px 0; }
    .desc  { color:#999; font-size:12px; line-height:1.7; border-top:1px solid #eee;
             padding-top:18px; margin-top:24px; white-space:pre-line; }
    .foot  { background:#f0f0f0; padding:16px 32px; text-align:center;
             color:#bbb; font-size:11px; }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="hbar">
      <h1>Stockify</h1>
      <p>Subscription Management</p>
    </div>
    <div class="body">
      <div class="badge">⚠ Action Required</div>
      <h2 style="color:#385E31;margin:0 0 6px;font-size:20px;">${p.header}</h2>
      <p class="about">${p.about}</p>
      <p style="color:#333;font-size:15px;margin:0 0 4px;">Hi <strong>${p.ownerName}</strong>,</p>
      <div class="due">
        <div class="lbl">Payment Due</div>
        <div class="date">${p.dueDateLabel}</div>
        <div class="amt">₱1,000.00 / month</div>
      </div>
      <p class="main">${escHtml(p.body)}</p>
      <a href="#" class="btn">Go to Dashboard</a>
      <p class="desc">${escHtml(p.description)}</p>
    </div>
    <div class="foot">
      © ${new Date().getFullYear()} Stockify · This is an automated message from the Stockify Admin Team.
    </div>
  </div>
</body>
</html>`;
}

function escHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\n/g, "<br/>");
}