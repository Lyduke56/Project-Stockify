import nodemailer from "nodemailer";

// ─── Transporter ──────────────────────────────────────────────────────────────

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER!,
    pass: process.env.GMAIL_APP_PASSWORD!,
  },
});

async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  await transporter.sendMail({
    from: `"Stockify" <${process.env.GMAIL_USER}>`,
    to,
    subject,
    html,
  });
}

function escHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// ─── Approval ─────────────────────────────────────────────────────────────────

export async function sendApprovalEmail(email: string, businessName: string, trialEndsAt: Date) {
  const trialEndStr = trialEndsAt.toLocaleDateString("en-PH", {
    month: "long", day: "numeric", year: "numeric",
  });
  await sendEmail({
    to: email,
    subject: `🎉 Welcome to Stockify — Your account is approved, ${businessName}!`,
    html: `
<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"/>
<style>
  body{font-family:Inter,Arial,sans-serif;background:#f5f5f5;margin:0;padding:0;}
  .wrap{max-width:600px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.08);}
  .hbar{background:#385E31;padding:24px 32px;}
  .hbar h1{color:#FFFCEB;margin:0;font-size:22px;font-weight:700;}
  .hbar p{color:#FFFCEB99;margin:4px 0 0;font-size:13px;}
  .body{padding:32px;}
  .box{background:#FFFCEB;border:1.5px solid #F7B71D;border-radius:8px;padding:16px 20px;margin:20px 0;}
  .foot{background:#f0f0f0;padding:16px 32px;text-align:center;color:#bbb;font-size:11px;}
</style></head><body>
<div class="wrap">
  <div class="hbar"><h1>Stockify</h1><p>Account Approved</p></div>
  <div class="body">
    <h2 style="color:#385E31;margin:0 0 14px;font-size:20px;">🎉 Welcome to Stockify!</h2>
    <p style="color:#333;font-size:15px;">Hi <strong>${escHtml(businessName)}</strong>,</p>
    <p style="color:#555;font-size:14px;line-height:1.7;">Your application has been <strong>approved</strong>! Your account is now active.</p>
    <div class="box">
      <div style="color:#385E31;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;">Free Trial Ends</div>
      <div style="color:#385E31;font-size:20px;font-weight:700;margin:4px 0;">${trialEndStr}</div>
      <div style="color:#666;font-size:12px;">After your trial, a monthly subscription of <strong>₱1,000</strong> will apply.</div>
    </div>
    <p style="color:#555;font-size:14px;line-height:1.7;">Log in to get started. Welcome aboard!</p>
    <p style="color:#385E31;font-weight:700;font-size:14px;">The Stockify Admin Team</p>
  </div>
  <div class="foot">© ${new Date().getFullYear()} Stockify · Automated account notice.</div>
</div>
</body></html>`,
  });
}

// ─── Rejection ────────────────────────────────────────────────────────────────

export async function sendRejectionEmail(email: string, businessName: string) {
  await sendEmail({
    to: email,
    subject: `Application update — ${businessName}`,
    html: `
<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"/>
<style>
  body{font-family:Inter,Arial,sans-serif;background:#f5f5f5;margin:0;padding:0;}
  .wrap{max-width:600px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.08);}
  .hbar{background:#385E31;padding:24px 32px;}
  .hbar h1{color:#FFFCEB;margin:0;font-size:22px;font-weight:700;}
  .hbar p{color:#FFFCEB99;margin:4px 0 0;font-size:13px;}
  .body{padding:32px;}
  .foot{background:#f0f0f0;padding:16px 32px;text-align:center;color:#bbb;font-size:11px;}
</style></head><body>
<div class="wrap">
  <div class="hbar"><h1>Stockify</h1><p>Application Update</p></div>
  <div class="body">
    <h2 style="color:#1a1a1a;margin:0 0 14px;font-size:20px;">Application Status Update</h2>
    <p style="color:#333;font-size:15px;">Hi <strong>${escHtml(businessName)}</strong>,</p>
    <p style="color:#555;font-size:14px;line-height:1.7;">After careful review, we are unable to approve your application at this time.</p>
    <p style="color:#555;font-size:14px;line-height:1.7;">If you believe this is an error, please contact our support team at <a href="mailto:support@stockify.ph" style="color:#385E31;">support@stockify.ph</a>.</p>
    <p style="color:#385E31;font-weight:700;font-size:14px;">The Stockify Admin Team</p>
  </div>
  <div class="foot">© ${new Date().getFullYear()} Stockify · Automated account notice.</div>
</div>
</body></html>`,
  });
}

// ─── Trial ending soon ────────────────────────────────────────────────────────

export async function sendTrialEndingEmail(email: string, businessName: string, trialEndsAt: Date) {
  const trialEndStr = trialEndsAt.toLocaleDateString("en-PH", {
    month: "long", day: "numeric", year: "numeric",
  });
  await sendEmail({
    to: email,
    subject: `⏰ Your free trial ends tomorrow — ${businessName}`,
    html: `
<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"/>
<style>
  body{font-family:Inter,Arial,sans-serif;background:#f5f5f5;margin:0;padding:0;}
  .wrap{max-width:600px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.08);}
  .hbar{background:#385E31;padding:24px 32px;}
  .hbar h1{color:#FFFCEB;margin:0;font-size:22px;font-weight:700;}
  .hbar p{color:#FFFCEB99;margin:4px 0 0;font-size:13px;}
  .body{padding:32px;}
  .box{background:#FFFCEB;border:1.5px solid #F7B71D;border-radius:8px;padding:16px 20px;margin:20px 0;}
  .foot{background:#f0f0f0;padding:16px 32px;text-align:center;color:#bbb;font-size:11px;}
</style></head><body>
<div class="wrap">
  <div class="hbar"><h1>Stockify</h1><p>Trial Expiry Notice</p></div>
  <div class="body">
    <h2 style="color:#385E31;margin:0 0 14px;font-size:20px;">⏰ Your Free Trial Ends Tomorrow</h2>
    <p style="color:#333;font-size:15px;">Hi <strong>${escHtml(businessName)}</strong>,</p>
    <p style="color:#555;font-size:14px;line-height:1.7;">Your free trial is expiring soon.</p>
    <div class="box">
      <div style="color:#385E31;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;">Trial Ends On</div>
      <div style="color:#385E31;font-size:20px;font-weight:700;margin:4px 0;">${trialEndStr}</div>
      <div style="color:#666;font-size:12px;">A monthly subscription fee of <strong>₱1,000.00</strong> will apply after this date.</div>
    </div>
    <p style="color:#385E31;font-weight:700;font-size:14px;">The Stockify Admin Team</p>
  </div>
  <div class="foot">© ${new Date().getFullYear()} Stockify · Automated account notice.</div>
</div>
</body></html>`,
  });
}

// ─── Billing invoice ──────────────────────────────────────────────────────────

export async function sendBillingInvoiceEmail(
  email: string,
  businessName: string,
  billingPeriod: string,
  amount: number
) {
  const periodLabel = new Date(billingPeriod + "T00:00:00").toLocaleDateString("en-PH", {
    month: "long", year: "numeric",
  });
  await sendEmail({
    to: email,
    subject: `Invoice for ${periodLabel} — ${businessName}`,
    html: `
<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"/>
<style>
  body{font-family:Inter,Arial,sans-serif;background:#f5f5f5;margin:0;padding:0;}
  .wrap{max-width:600px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.08);}
  .hbar{background:#385E31;padding:24px 32px;}
  .hbar h1{color:#FFFCEB;margin:0;font-size:22px;font-weight:700;}
  .hbar p{color:#FFFCEB99;margin:4px 0 0;font-size:13px;}
  .body{padding:32px;}
  .box{background:#FFFCEB;border:1.5px solid #F7B71D;border-radius:8px;padding:16px 20px;margin:20px 0;}
  .foot{background:#f0f0f0;padding:16px 32px;text-align:center;color:#bbb;font-size:11px;}
</style></head><body>
<div class="wrap">
  <div class="hbar"><h1>Stockify</h1><p>Monthly Invoice</p></div>
  <div class="body">
    <h2 style="color:#385E31;margin:0 0 14px;font-size:20px;">Invoice for ${periodLabel}</h2>
    <p style="color:#333;font-size:15px;">Hi <strong>${escHtml(businessName)}</strong>,</p>
    <p style="color:#555;font-size:14px;line-height:1.7;">Your monthly invoice is now available.</p>
    <div class="box">
      <div style="color:#385E31;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;">Amount Due</div>
      <div style="color:#385E31;font-size:28px;font-weight:900;margin:4px 0;">₱${amount.toLocaleString("en-PH", { minimumFractionDigits: 2 })}</div>
      <div style="color:#666;font-size:12px;">Please settle before the due date to avoid being marked overdue.</div>
    </div>
    <p style="color:#385E31;font-weight:700;font-size:14px;">The Stockify Admin Team</p>
  </div>
  <div class="foot">© ${new Date().getFullYear()} Stockify · Automated account notice.</div>
</div>
</body></html>`,
  });
}

// ─── Overdue notice ───────────────────────────────────────────────────────────

export async function sendOverdueNotificationEmail(
  email: string,
  businessName: string,
  billingPeriod: string
) {
  const periodLabel = new Date(billingPeriod + "T00:00:00").toLocaleDateString("en-PH", {
    month: "long", year: "numeric",
  });
  await sendEmail({
    to: email,
    subject: `⚠️ Overdue payment — ${businessName}`,
    html: `
<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"/>
<style>
  body{font-family:Inter,Arial,sans-serif;background:#f5f5f5;margin:0;padding:0;}
  .wrap{max-width:600px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.08);}
  .hbar{background:#E91F22;padding:24px 32px;}
  .hbar h1{color:#fff;margin:0;font-size:22px;font-weight:700;}
  .hbar p{color:#ffc8c8;margin:4px 0 0;font-size:13px;}
  .body{padding:32px;}
  .alert{background:#fff0f0;border:1.5px solid #E91F22;border-radius:8px;padding:14px 18px;color:#E91F22;font-size:13px;font-weight:600;margin-bottom:20px;}
  .foot{background:#f0f0f0;padding:16px 32px;text-align:center;color:#bbb;font-size:11px;}
</style></head><body>
<div class="wrap">
  <div class="hbar"><h1>Stockify</h1><p>Overdue Payment Notice</p></div>
  <div class="body">
    <h2 style="color:#E91F22;margin:0 0 14px;font-size:20px;">Payment Overdue</h2>
    <p style="color:#333;font-size:15px;">Hi <strong>${escHtml(businessName)}</strong>,</p>
    <div class="alert">⚠ Your subscription payment for <strong>${periodLabel}</strong> is now overdue.</div>
    <p style="color:#555;font-size:14px;line-height:1.7;">Please settle your outstanding balance of <strong>₱1,000.00</strong> immediately to avoid service interruption.</p>
    <p style="color:#555;font-size:14px;line-height:1.7;">Contact us at <a href="mailto:support@stockify.ph" style="color:#385E31;">support@stockify.ph</a> if you need assistance.</p>
    <p style="color:#385E31;font-weight:700;font-size:14px;">The Stockify Admin Team</p>
  </div>
  <div class="foot">© ${new Date().getFullYear()} Stockify · Automated account notice.</div>
</div>
</body></html>`,
  });
}

// ─── Grace period started ─────────────────────────────────────────────────────

export async function sendGracePeriodEmail(
  email: string,
  businessName: string,
  graceEndsAt: Date,
  graceDays: number
) {
  const endStr = graceEndsAt.toLocaleDateString("en-PH", {
    month: "long", day: "numeric", year: "numeric",
  });
  await sendEmail({
    to: email,
    subject: `⚠️ Payment overdue — ${graceDays}-day grace period started — ${businessName}`,
    html: `
<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"/>
<style>
  body{font-family:Inter,Arial,sans-serif;background:#f5f5f5;margin:0;padding:0;}
  .wrap{max-width:600px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.08);}
  .hbar{background:#E5AD24;padding:24px 32px;}
  .hbar h1{color:#385E31;margin:0;font-size:22px;font-weight:700;}
  .hbar p{color:#385E3199;margin:4px 0 0;font-size:13px;}
  .body{padding:32px;}
  .box{background:#FFFCEB;border:1.5px solid #E5AD24;border-radius:8px;padding:16px 20px;margin:20px 0;}
  .foot{background:#f0f0f0;padding:16px 32px;text-align:center;color:#bbb;font-size:11px;}
</style></head><body>
<div class="wrap">
  <div class="hbar"><h1>Stockify</h1><p>Grace Period Notice</p></div>
  <div class="body">
    <h2 style="color:#7A5500;margin:0 0 14px;font-size:20px;">⚠️ Grace Period Has Started</h2>
    <p style="color:#333;font-size:15px;">Hi <strong>${escHtml(businessName)}</strong>,</p>
    <p style="color:#555;font-size:14px;line-height:1.7;">Your subscription payment is <strong>overdue</strong>. You have been given a <strong>${graceDays}-day grace period</strong> to settle your balance.</p>
    <div class="box">
      <div style="color:#385E31;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;">Grace Period Ends</div>
      <div style="color:#385E31;font-size:20px;font-weight:700;margin:4px 0;">${endStr}</div>
      <div style="color:#666;font-size:12px;">If unpaid by this date, your account will be <strong>automatically suspended</strong>.</div>
    </div>
    <p style="color:#555;font-size:14px;line-height:1.7;">Please pay your outstanding balance of <strong>₱1,000.00</strong> immediately or contact <a href="mailto:support@stockify.ph" style="color:#385E31;">support@stockify.ph</a>.</p>
    <p style="color:#385E31;font-weight:700;font-size:14px;">The Stockify Admin Team</p>
  </div>
  <div class="foot">© ${new Date().getFullYear()} Stockify · Automated account notice.</div>
</div>
</body></html>`,
  });
}

// ─── Auto-suspended ───────────────────────────────────────────────────────────

export async function sendAutoSuspendEmail(
  email: string,
  businessName: string,
  suspensionEndsAt: Date
) {
  const endStr = suspensionEndsAt.toLocaleDateString("en-PH", {
    month: "long", day: "numeric", year: "numeric",
  });
  await sendEmail({
    to: email,
    subject: `🚫 Account suspended — ${businessName}`,
    html: `
<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"/>
<style>
  body{font-family:Inter,Arial,sans-serif;background:#f5f5f5;margin:0;padding:0;}
  .wrap{max-width:600px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.08);}
  .hbar{background:#E91F22;padding:24px 32px;}
  .hbar h1{color:#fff;margin:0;font-size:22px;font-weight:700;}
  .hbar p{color:#ffc8c8;margin:4px 0 0;font-size:13px;}
  .body{padding:32px;}
  .box{background:#FFFCEB;border:1.5px solid #F7B71D;border-radius:8px;padding:16px 20px;margin:20px 0;}
  .foot{background:#f0f0f0;padding:16px 32px;text-align:center;color:#bbb;font-size:11px;}
</style></head><body>
<div class="wrap">
  <div class="hbar"><h1>Stockify</h1><p>Account Suspended</p></div>
  <div class="body">
    <h2 style="color:#E91F22;margin:0 0 14px;font-size:20px;">🚫 Your Account Has Been Suspended</h2>
    <p style="color:#333;font-size:15px;">Hi <strong>${escHtml(businessName)}</strong>,</p>
    <p style="color:#555;font-size:14px;line-height:1.7;">Your account has been <strong>automatically suspended</strong> due to non-payment after the grace period expired.</p>
    <div class="box">
      <div style="color:#385E31;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;">Termination Deadline</div>
      <div style="color:#385E31;font-size:20px;font-weight:700;margin:4px 0;">${endStr}</div>
      <div style="color:#666;font-size:12px;">Resolve your balance before this date or your account will be <strong>permanently terminated</strong>.</div>
    </div>
    <p style="color:#555;font-size:14px;line-height:1.7;">Contact <a href="mailto:support@stockify.ph" style="color:#385E31;">support@stockify.ph</a> immediately to reinstate your account.</p>
    <p style="color:#385E31;font-weight:700;font-size:14px;">The Stockify Admin Team</p>
  </div>
  <div class="foot">© ${new Date().getFullYear()} Stockify · Automated account notice.</div>
</div>
</body></html>`,
  });
}

// ─── Manual suspend ───────────────────────────────────────────────────────────

export async function sendManualSuspendEmail(
  email: string,
  businessName: string,
  ownerName: string,
  reason: string,
  expiryLabel: string,
  suspensionDays: number
) {
  await sendEmail({
    to: email,
    subject: `[Account Suspended] ${businessName} — Pay Within ${suspensionDays} Days to Avoid Termination`,
    html: `
<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"/>
<style>
  body{font-family:Inter,Arial,sans-serif;background:#f5f5f5;margin:0;padding:0;}
  .wrap{max-width:600px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.08);}
  .hbar{background:#E91F22;padding:24px 32px;}
  .hbar h1{color:#fff;margin:0;font-size:22px;font-weight:700;}
  .hbar p{color:#ffc8c8;margin:4px 0 0;font-size:13px;}
  .body{padding:32px;}
  .alert{background:#fff0f0;border:1.5px solid #E91F22;border-radius:8px;padding:14px 18px;color:#E91F22;font-size:13px;font-weight:600;margin-bottom:20px;}
  .box{background:#FFFCEB;border:1.5px solid #F7B71D;border-radius:8px;padding:16px 20px;margin-bottom:20px;}
  ol{color:#444;font-size:14px;line-height:1.9;padding-left:20px;margin:12px 0;}
  .warn{color:#999;font-size:12px;line-height:1.7;border-top:1px solid #eee;padding-top:18px;margin-top:24px;}
  .foot{background:#f0f0f0;padding:16px 32px;text-align:center;color:#bbb;font-size:11px;}
</style></head><body>
<div class="wrap">
  <div class="hbar"><h1>Stockify</h1><p>Account Suspension Notice</p></div>
  <div class="body">
    <h2 style="color:#E91F22;margin:0 0 14px;font-size:20px;">Your Account Has Been Suspended</h2>
    <p style="color:#333;font-size:15px;">Hi <strong>${escHtml(ownerName)}</strong>,</p>
    <p style="color:#555;font-size:14px;line-height:1.7;">Your Stockify account for <strong>${escHtml(businessName)}</strong> has been <strong>suspended</strong> due to <strong>${escHtml(reason)}</strong>.</p>
    <div class="alert">⚠ Your account access is currently restricted.</div>
    <div class="box">
      <div style="color:#385E31;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;">Termination Deadline</div>
      <div style="color:#385E31;font-size:20px;font-weight:700;margin:4px 0 4px;">${escHtml(expiryLabel)}</div>
      <div style="color:#666;font-size:12px;">You have <strong>${suspensionDays} days</strong> from today to settle your outstanding balance.</div>
    </div>
    <p style="color:#333;font-size:14px;font-weight:600;">What you need to do:</p>
    <ol>
      <li>Log in to your Stockify dashboard.</li>
      <li>Navigate to <strong>Billing &amp; Subscription</strong>.</li>
      <li>Pay your outstanding balance of <strong>₱1,000.00</strong>.</li>
      <li>Your account will be reactivated within 24 hours of payment confirmation.</li>
    </ol>
    <p class="warn"><strong>Important:</strong> If payment is not received by <strong>${escHtml(expiryLabel)}</strong>, your account will be <strong>permanently terminated</strong>. Contact <a href="mailto:support@stockify.ph" style="color:#385E31;">support@stockify.ph</a> for assistance.</p>
  </div>
  <div class="foot">© ${new Date().getFullYear()} Stockify · Automated account notice.</div>
</div>
</body></html>`,
  });
}

// ─── Suspension warning (from suspended tenants tab) ─────────────────────────

export async function sendSuspensionWarningEmail(
  email: string,
  ownerName: string,
  businessName: string,
  reason: string,
  daysRemaining: number | null,
  outstandingAmount: number | null,
  billingPeriod: string | null
) {
  const urgencyColor = daysRemaining !== null && daysRemaining <= 2 ? "#E91F22" : "#E5AD24";

  const deadlineBlock = daysRemaining !== null
    ? `<div style="background:${urgencyColor}15;border-left:4px solid ${urgencyColor};border-radius:4px;padding:14px 18px;margin:20px 0;color:#333;font-size:14px;line-height:1.7;">
        <strong style="color:${urgencyColor};">${
          daysRemaining <= 0
            ? "⚠️ Your suspension period has already expired."
            : `⏳ You have ${daysRemaining} day${daysRemaining === 1 ? "" : "s"} remaining to resolve this issue.`
        }</strong><br/>
        Failure to resolve the issue by the deadline will result in the <strong>permanent termination</strong> of your account.
      </div>`
    : `<div style="background:#f8f8f8;border-left:4px solid #E5AD24;border-radius:4px;padding:14px 18px;margin:20px 0;color:#555;font-size:13px;">
        Please resolve the issue as soon as possible to avoid permanent termination.
      </div>`;

  const balanceBlock = outstandingAmount
    ? `<div style="background:#fff8f8;border:1px solid #ffcccc;border-radius:8px;padding:14px 18px;margin:16px 0;">
        <p style="margin:0;font-size:13px;color:#555;">Outstanding Balance${billingPeriod ? ` (${escHtml(billingPeriod)})` : ""}:</p>
        <p style="margin:4px 0 0;font-size:28px;font-weight:900;color:#E91F22;">₱${outstandingAmount.toLocaleString("en-PH", { minimumFractionDigits: 2 })}</p>
      </div>`
    : "";

  await sendEmail({
    to: email,
    subject: `[Action Required] Your Stockify Account is Suspended — ${businessName}`,
    html: `
<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"/>
<style>
  body{font-family:Inter,Arial,sans-serif;background:#f5f5f5;margin:0;padding:0;}
  .wrap{max-width:600px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.08);}
  .hbar{background:#385E31;padding:24px 32px;}
  .hbar h1{color:#FFFCEB;margin:0;font-size:22px;font-weight:700;}
  .hbar p{color:#FFFCEB99;margin:4px 0 0;font-size:13px;}
  .body{padding:32px;}
  .foot{background:#f0f0f0;padding:16px 32px;text-align:center;color:#bbb;font-size:11px;}
</style></head><body>
<div class="wrap">
  <div class="hbar"><h1>Stockify</h1><p>Account Suspension Notice — Action Required</p></div>
  <div class="body">
    <h2 style="color:#1a1a1a;margin:0 0 14px;font-size:20px;">Your Account Has Been Suspended</h2>
    <p style="color:#333;font-size:15px;">Hi <strong>${escHtml(ownerName)}</strong>,</p>
    <p style="color:#555;font-size:14px;line-height:1.7;">Your Stockify account for <strong>${escHtml(businessName)}</strong> has been temporarily suspended.</p>
    <div style="background:#f8f8f8;border-left:4px solid #385E31;border-radius:4px;padding:14px 18px;margin:16px 0;color:#555;font-size:13px;line-height:1.7;">
      <strong>Reason:</strong><br/>${escHtml(reason).replace(/\n/g, "<br/>")}
    </div>
    ${balanceBlock}
    ${deadlineBlock}
    <p style="color:#555;font-size:14px;line-height:1.7;">Contact <a href="mailto:support@stockify.ph" style="color:#385E31;">support@stockify.ph</a> to reinstate your account.</p>
    <p style="color:#385E31;font-weight:700;font-size:14px;">The Stockify Admin Team</p>
  </div>
  <div class="foot">© ${new Date().getFullYear()} Stockify · Please do not reply to this email.</div>
</div>
</body></html>`,
  });
}

// ─── Restore ──────────────────────────────────────────────────────────────────

export async function sendRestorationEmail(
  email: string,
  businessName: string,
  ownerName: string,
  remarks: string
) {
  await sendEmail({
    to: email,
    subject: `[Account Restored] ${businessName} — Stockify`,
    html: `
<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"/>
<style>
  body{font-family:Inter,Arial,sans-serif;background:#f5f5f5;margin:0;padding:0;}
  .wrap{max-width:600px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.08);}
  .hbar{background:#385E31;padding:24px 32px;}
  .hbar h1{color:#FFFCEB;margin:0;font-size:22px;font-weight:700;}
  .hbar p{color:#FFFCEB99;margin:4px 0 0;font-size:13px;}
  .body{padding:32px;}
  .note{background:#f0faf0;border-left:4px solid #385E31;border-radius:4px;padding:14px 18px;margin:20px 0;color:#333;font-size:13px;line-height:1.7;}
  .foot{background:#f0f0f0;padding:16px 32px;text-align:center;color:#bbb;font-size:11px;}
</style></head><body>
<div class="wrap">
  <div class="hbar"><h1>Stockify</h1><p>Account Restoration Notice</p></div>
  <div class="body">
    <h2 style="color:#1a1a1a;margin:0 0 14px;font-size:20px;">✅ Your Account Has Been Restored</h2>
    <p style="color:#333;font-size:15px;">Hi <strong>${escHtml(ownerName)}</strong>,</p>
    <p style="color:#555;font-size:14px;line-height:1.7;">Great news! Your Stockify account for <strong>${escHtml(businessName)}</strong> has been <strong>fully restored</strong>.</p>
    <div class="note"><strong>Restoration Note:</strong><br/>${escHtml(remarks).replace(/\n/g, "<br/>")}</div>
    <p style="color:#555;font-size:14px;line-height:1.7;">Contact <a href="mailto:support@stockify.ph" style="color:#385E31;">support@stockify.ph</a> if you need any assistance.</p>
    <p style="color:#555;font-size:14px;margin-top:24px;">Welcome back to Stockify!</p>
    <p style="color:#385E31;font-weight:700;font-size:14px;">The Stockify Admin Team</p>
  </div>
  <div class="foot">© ${new Date().getFullYear()} Stockify · Please do not reply to this email.</div>
</div>
</body></html>`,
  });
}

// ─── Termination ──────────────────────────────────────────────────────────────

export async function sendTerminationEmail(
  email: string,
  businessName: string,
  ownerName: string,
  remarks: string
) {
  await sendEmail({
    to: email,
    subject: `[Account Terminated] ${businessName} — Stockify`,
    html: `
<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"/>
<style>
  body{font-family:Inter,Arial,sans-serif;background:#f5f5f5;margin:0;padding:0;}
  .wrap{max-width:600px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.08);}
  .hbar{background:#1a1a1a;padding:24px 32px;}
  .hbar h1{color:#fff;margin:0;font-size:22px;font-weight:700;}
  .hbar p{color:#888;margin:4px 0 0;font-size:13px;}
  .body{padding:32px;}
  .rbox{background:#f8f8f8;border-left:4px solid #E91F22;border-radius:4px;padding:14px 18px;margin:20px 0;color:#555;font-size:13px;line-height:1.7;}
  .foot{background:#f0f0f0;padding:16px 32px;text-align:center;color:#bbb;font-size:11px;}
</style></head><body>
<div class="wrap">
  <div class="hbar"><h1>Stockify</h1><p>Account Termination Notice</p></div>
  <div class="body">
    <h2 style="color:#1a1a1a;margin:0 0 14px;font-size:20px;">Your Account Has Been Permanently Terminated</h2>
    <p style="color:#333;font-size:15px;">Hi <strong>${escHtml(ownerName)}</strong>,</p>
    <p style="color:#555;font-size:14px;line-height:1.7;">Your Stockify account for <strong>${escHtml(businessName)}</strong> has been <strong>permanently terminated</strong>.</p>
    <div class="rbox"><strong>Reason:</strong><br/>${escHtml(remarks).replace(/\n/g, "<br/>")}</div>
    <p style="color:#555;font-size:14px;line-height:1.7;">All associated data has been permanently removed. If you believe this was an error, contact <a href="mailto:support@stockify.ph" style="color:#385E31;">support@stockify.ph</a> within 30 days.</p>
    <p style="color:#385E31;font-weight:700;font-size:14px;">The Stockify Admin Team</p>
  </div>
  <div class="foot">© ${new Date().getFullYear()} Stockify · This is a final notice.</div>
</div>
</body></html>`,
  });
}

// ─── Billing reminder (notify route) ─────────────────────────────────────────

export async function sendBillingReminderEmail(params: {
  to: string;
  ownerName: string;
  businessName: string;
  subject: string;
  header: string;
  about: string;
  body: string;
  description: string;
  dueDateLabel: string;
}) {
  const { to, ownerName, businessName, subject, header, about, body, description, dueDateLabel } = params;
  await sendEmail({
    to,
    subject,
    html: `
<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"/>
<style>
  body{font-family:Inter,Arial,sans-serif;background:#f5f5f5;margin:0;padding:0;}
  .wrap{max-width:600px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.08);}
  .hbar{background:#385E31;padding:24px 32px;}
  .hbar h1{color:#FFFCEB;margin:0;font-size:22px;font-weight:700;}
  .hbar p{color:#c8e6b8;margin:4px 0 0;font-size:13px;}
  .body{padding:32px;}
  .badge{background:#F7B71D;color:#385E31;display:inline-block;padding:4px 14px;border-radius:40px;font-size:12px;font-weight:700;margin-bottom:14px;}
  .due{background:#FFFCEB;border:1.5px solid #F7B71D;border-radius:8px;padding:16px 20px;margin:20px 0;}
  .foot{background:#f0f0f0;padding:16px 32px;text-align:center;color:#bbb;font-size:11px;}
</style></head><body>
<div class="wrap">
  <div class="hbar"><h1>Stockify</h1><p>Subscription Management</p></div>
  <div class="body">
    <div class="badge">⚠ Action Required</div>
    <h2 style="color:#385E31;margin:0 0 6px;font-size:20px;">${escHtml(header)}</h2>
    <p style="color:#777;font-size:14px;font-style:italic;margin:0 0 18px;">${escHtml(about)}</p>
    <p style="color:#333;font-size:15px;margin:0 0 4px;">Hi <strong>${escHtml(ownerName)}</strong>,</p>
    <div class="due">
      <div style="color:#385E31;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;">Payment Due</div>
      <div style="color:#385E31;font-size:20px;font-weight:700;margin:4px 0 2px;">${dueDateLabel}</div>
      <div style="color:#E5AD24;font-size:13px;font-weight:600;">₱1,000.00 / month</div>
    </div>
    <p style="color:#444;font-size:14px;line-height:1.8;">${escHtml(body).replace(/\n/g, "<br/>")}</p>
    <p style="color:#999;font-size:12px;line-height:1.7;border-top:1px solid #eee;padding-top:18px;margin-top:24px;">${escHtml(description).replace(/\n/g, "<br/>")}</p>
  </div>
  <div class="foot">© ${new Date().getFullYear()} Stockify · Automated message from the Stockify Admin Team.</div>
</div>
</body></html>`,
  });
}