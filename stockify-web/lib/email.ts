import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendApprovalEmail(to: string, businessName: string) {
  await resend.emails.send({
    from: "Stockify <onboarding@resend.dev>",
    to,
    subject: "Your Stockify Account Has Been Approved!",
    html: `
      <h2>Congratulations!</h2>
      <p>Your business <strong>${businessName}</strong> has been approved by our team.</p>
      <p>You may now log in to your Stockify account.</p>
    `,
  });
}

export async function sendRejectionEmail(to: string, businessName: string) {
  await resend.emails.send({
    from: "Stockify <onboarding@resend.dev>",
    to,
    subject: "Your Stockify Registration Was Not Approved",
    html: `
      <h2>We're sorry.</h2>
      <p>After review, your business <strong>${businessName}</strong> was not approved at this time.</p>
      <p>If you believe this is a mistake, please contact our support team.</p>
    `,
  });
}