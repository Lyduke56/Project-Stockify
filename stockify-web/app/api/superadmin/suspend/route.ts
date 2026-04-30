import { sendManualSuspendEmail } from "@/lib/mailer";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";


const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);


export async function POST(req: Request) {
  const body = await req.json();
  const { tenantId, reason } = body as { tenantId: string; reason?: string };

  if (!tenantId) {
    return NextResponse.json({ error: "tenantId is required." }, { status: 400 });
  }

  // ── 1. Fetch tenant ───────────────────────────────────────────────────────
  const { data: tenant, error: fetchErr } = await supabase
    .from("tenants")
    .select("business_name, owner_full_name, owner_email")
    .eq("tenant_id", tenantId)
    .single();

  if (fetchErr || !tenant) {
    return NextResponse.json({ error: "Tenant not found." }, { status: 404 });
  }

  // ── 2. Fetch suspension_days from billing_settings ────────────────────────
  const { data: settings } = await supabase
    .from("billing_settings")
    .select("suspension_days")
    .single();

  const suspensionDays = settings?.suspension_days ?? 14;

  const suspensionExpiresAt = new Date();
  suspensionExpiresAt.setDate(suspensionExpiresAt.getDate() + suspensionDays);

  const expiryLabel = suspensionExpiresAt.toLocaleDateString("en-PH", {
    month: "long", day: "numeric", year: "numeric",
  });

  // ── 3. Update tenant record ───────────────────────────────────────────────
  const { error: updateErr } = await supabase
    .from("tenants")
    .update({
      subscription_status: "Suspended",
      is_suspended:        true,
      suspended_until:     suspensionExpiresAt.toISOString(),
      is_active:           false,
    })
    .eq("tenant_id", tenantId);

  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 500 });
  }

  // ── 4. Deactivate all users under this tenant ─────────────────────────────
  await supabase
    .from("users")
    .update({ is_active: false })
    .eq("tenant_id", tenantId);

  // ── 5. Audit log ──────────────────────────────────────────────────────────
  const { error: insertErr } = await supabase.from("suspended_tenants").insert({
    tenant_id:             tenantId,
    business_name:         tenant.business_name,
    owner_name:            tenant.owner_full_name,
    owner_email:           tenant.owner_email,
    reason:                reason?.trim() || "Overdue subscription payment",
    suspension_expires_at: suspensionExpiresAt.toISOString(),
  });

  if (insertErr) {
    console.error("[suspend] suspended_tenants insert error:", insertErr.message);
  }

  // ── 6. Send suspension email ──────────────────────────────────────────────
  try {
  await sendManualSuspendEmail(
    tenant.owner_email,
    tenant.business_name,
    tenant.owner_full_name,
    reason?.trim() || "overdue subscription payment",
    expiryLabel,
    suspensionDays,
  );
  } catch (e) {
    console.error("[suspend] Email failed:", e);
  }

  return NextResponse.json({ success: true });
}