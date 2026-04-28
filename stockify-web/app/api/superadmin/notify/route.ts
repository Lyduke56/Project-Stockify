import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";


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

  // ── 1. Get tenant + latest pending subscription record ───────────────────
  const { data: tenant, error: fetchErr } = await supabase
    .from("tenants")
    .select(
      `
      business_name,
      owner_full_name,
      owner_email,
      subscription_records (
        billing_period,
        payment_status
      )
    `
    )
    .eq("tenant_id", tenantId)
    .single();

  if (fetchErr || !tenant) {
    return NextResponse.json({ error: "Tenant not found." }, { status: 404 });
  }

  // Find the earliest unpaid billing period
  const unpaidRecords = (
    (tenant as any).subscription_records as {
      billing_period: string;
      payment_status: string;
    }[]
  )
    .filter(
      (r) => r.payment_status === "Pending" || r.payment_status === "Overdue"
    )
    .sort(
      (a, b) =>
        new Date(a.billing_period).getTime() -
        new Date(b.billing_period).getTime()
    );

  const dueDateLabel =
    unpaidRecords.length > 0
      ? new Date(unpaidRecords[0].billing_period).toLocaleDateString("en-PH", {
          month: "long",
          day:   "numeric",
          year:  "numeric",
        })
      : "your upcoming billing date";

  // ── 2. Compose the notification payload ──────────────────────────────────
  const recipientEmail = (tenant as any).owner_email as string;
  const businessName   = (tenant as any).business_name as string;
  const ownerName      = (tenant as any).owner_full_name as string;

  const subject = `[Action Required] Subscription Payment Due — ${businessName}`;
  const htmlBody = `
    <p>Hi ${ownerName},</p>
    <p>
      This is a friendly reminder that your subscription payment for
      <strong>${businessName}</strong> is due on <strong>${dueDateLabel}</strong>.
    </p>
    <p>
      You have <strong>one (1) week</strong> to complete your payment.
      Failure to pay may result in temporary suspension of your account.
    </p>
    <p>Please log in to your dashboard to settle your balance.</p>
    <p>Thank you,<br/>The Admin Team</p>
  `;

  // ── 3. Send the email ─────────────────────────────────────────────────────
  //
  //  Replace the block below with your email provider.
  //
  //  ─── Option A: Resend ────────────────────────────────────────────────────
  //  import { Resend } from "resend";
  //  const resend = new Resend(process.env.RESEND_API_KEY!);
  //  await resend.emails.send({
  //    from:    "noreply@yourdomain.com",
  //    to:      recipientEmail,
  //    subject,
  //    html:    htmlBody,
  //  });
  //
  //  ─── Option B: Supabase Edge Function ────────────────────────────────────
  //  await supabase.functions.invoke("send-email", {
  //    body: { to: recipientEmail, subject, html: htmlBody },
  //  });
  //
  //  ─── Option C: Nodemailer (self-hosted SMTP) ──────────────────────────────
  //  const transporter = nodemailer.createTransport({ ... });
  //  await transporter.sendMail({ from, to: recipientEmail, subject, html: htmlBody });
  //
  // For now we log and return success so the UI flow is testable end-to-end.
  // ─────────────────────────────────────────────────────────────────────────

  console.log("[notify] Would send email to:", recipientEmail);
  console.log("[notify] Subject:", subject);
  console.log("[notify] Body preview:", htmlBody.slice(0, 120));

  // ── 4. (Optional) Update subscription record payment_status → "Overdue" ──
  if (unpaidRecords.length > 0) {
    const { error: updateErr } = await supabase
      .from("subscription_records")
      .update({ payment_status: "Overdue" })
      .eq("tenant_id", tenantId)
      .eq("billing_period", unpaidRecords[0].billing_period);

    if (updateErr) {
      console.error("Could not mark billing period as Overdue:", updateErr.message);
    }
  }

  return NextResponse.json({ success: true, sentTo: recipientEmail });
}