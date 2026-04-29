// /lib/email.ts — ADD these functions to your existing email helpers
// (keep your existing sendApprovalEmail / sendRejectionEmail, just update
//  sendApprovalEmail's signature to accept trialEndsAt)

// ─── Updated sendApprovalEmail (adds trial info) ──────────────────────────────

export async function sendApprovalEmail(
  email: string,
  businessName: string,
  trialEndsAt: Date
) {
  const trialEndStr = trialEndsAt.toLocaleDateString("en-PH", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  // Replace with your email provider (Resend, SendGrid, Nodemailer, etc.)
  await sendEmail({
    to: email,
    subject: `🎉 Welcome to FarmFlow — Your account is approved, ${businessName}!`,
    html: `
      <p>Hi ${businessName},</p>
      <p>Your application has been <strong>approved</strong>! Your account is now active.</p>
      <p>
        You're currently on a <strong>7-day free trial</strong> which ends on
        <strong>${trialEndStr}</strong>. After that, a monthly subscription of
        <strong>₱1,000</strong> will apply.
      </p>
      <p>Log in to get started. Welcome aboard!</p>
    `,
  });
}

// ─── sendBillingInvoiceEmail ──────────────────────────────────────────────────

export async function sendBillingInvoiceEmail(
  email: string,
  businessName: string,
  billingPeriod: string, // "2025-07-01"
  amount: number
) {
  const periodLabel = new Date(billingPeriod + "T00:00:00").toLocaleDateString("en-PH", {
    month: "long",
    year: "numeric",
  });

  await sendEmail({
    to: email,
    subject: `Invoice for ${periodLabel} — ${businessName}`,
    html: `
      <p>Hi ${businessName},</p>
      <p>Your monthly invoice for <strong>${periodLabel}</strong> is now available.</p>
      <p><strong>Amount due: ₱${amount.toLocaleString("en-PH", { minimumFractionDigits: 2 })}</strong></p>
      <p>Please settle this before the 15th of next month to avoid being marked overdue.</p>
      <p>Thank you for using FarmFlow!</p>
    `,
  });
}

// ─── sendOverdueNotificationEmail ─────────────────────────────────────────────

export async function sendOverdueNotificationEmail(
  email: string,
  businessName: string,
  billingPeriod: string
) {
  const periodLabel = new Date(billingPeriod + "T00:00:00").toLocaleDateString("en-PH", {
    month: "long",
    year: "numeric",
  });

  await sendEmail({
    to: email,
    subject: `⚠️ Overdue payment — ${businessName}`,
    html: `
      <p>Hi ${businessName},</p>
      <p>
        Your subscription payment for <strong>${periodLabel}</strong> is now
        <strong>overdue</strong>.
      </p>
      <p>
        Please contact your administrator or settle the payment of
        <strong>₱1,000.00</strong> as soon as possible to avoid service interruption.
      </p>
    `,
  });
}

// ─── sendTrialEndingEmail ─────────────────────────────────────────────────────

export async function sendTrialEndingEmail(
  email: string,
  businessName: string,
  trialEndsAt: Date
) {
  const trialEndStr = trialEndsAt.toLocaleDateString("en-PH", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  await sendEmail({
    to: email,
    subject: `⏰ Your free trial ends tomorrow — ${businessName}`,
    html: `
      <p>Hi ${businessName},</p>
      <p>
        Your 7-day free trial expires on <strong>${trialEndStr}</strong>.
      </p>
      <p>
        Starting the next billing cycle, a monthly subscription fee of
        <strong>₱1,000.00</strong> will apply to keep your account active.
      </p>
      <p>Thank you for trying FarmFlow!</p>
    `,
  });
}

// ─── sendRejectionEmail — keep existing, re-exported here for completeness ────
export async function sendRejectionEmail(email: string, businessName: string) {
  await sendEmail({
    to: email,
    subject: `Application update — ${businessName}`,
    html: `
      <p>Hi ${businessName},</p>
      <p>
        After careful review, we are unable to approve your application at this time.
      </p>
      <p>If you believe this is an error, please contact our support team.</p>
    `,
  });
}

// ─── Internal send helper — replace with your actual provider ─────────────────
// Example uses Resend (https://resend.com). Swap for SendGrid / Nodemailer etc.

async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  // ── Resend example ────────────────────────────────────────────────────────
  // import { Resend } from "resend";
  // const resend = new Resend(process.env.RESEND_API_KEY!);
  // await resend.emails.send({
  //   from: "FarmFlow <noreply@yourdomain.com>",
  //   to,
  //   subject,
  //   html,
  // });

  // ── Nodemailer / SMTP example ─────────────────────────────────────────────
  // const transporter = nodemailer.createTransport({ ... });
  // await transporter.sendMail({ from: "...", to, subject, html });

  console.log(`[email] To: ${to} | Subject: ${subject}`);
}