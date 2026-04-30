import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendBillingReminderEmail } from "@/lib/mailer";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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

  try {
    await sendBillingReminderEmail({
      to:          recipientEmail,
      ownerName,
      businessName,
      subject,
      header:      header.trim()      || "Subscription Payment Reminder",
      about:       about.trim()       || `Your monthly subscription for ${businessName} requires attention.`,
      body:        body.trim()        || `Your monthly subscription fee of ₱1,000.00 is due on ${dueDateLabel}.`,
      description: description.trim() || "Failure to pay within the grace period may lead to suspension.",
      dueDateLabel,
    });
  } catch (e) {
    console.error("[notify] Email failed:", e);
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
