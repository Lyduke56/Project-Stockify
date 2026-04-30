
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendSuspensionWarningEmail } from "@/lib/mailer";

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
    try {
    await sendSuspensionWarningEmail(
      suspension.owner_email,
      suspension.owner_name,
      suspension.business_name,
      suspension.reason || "Administrative review",
      daysRemaining,
      balanceRecord ? Number(balanceRecord.amount) : null,
      balanceRecord
        ? new Date(balanceRecord.billing_period).toLocaleDateString("en-PH", { month: "long", year: "numeric" })
        : null,
    );
  } catch (e) {
    console.error("[send-suspension-notification] Email failed:", e);
    return NextResponse.json({ error: "Failed to send email." }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
