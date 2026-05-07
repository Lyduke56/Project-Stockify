
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tenantId = searchParams.get("tenantId");

  if (!tenantId) {
    return NextResponse.json({ error: "tenantId is required." }, { status: 400 });
  }

  // Tenant info
  const { data: tenant, error: tErr } = await supabase
    .from("tenants")
    .select(
      "tenant_id, business_name, owner_full_name, owner_email, subscription_status"
    )
    .eq("tenant_id", tenantId)
    .single();

  if (tErr || !tenant) {
    return NextResponse.json({ error: "Tenant not found." }, { status: 404 });
  }

  // All subscription records, newest first — now includes amount_paid
  const { data: records, error: rErr } = await supabase
    .from("subscription_records")
    .select(`
      subscription_id,
      billing_period,
      payment_status,
      amount,
      amount_paid,
      paid_at,
      overdue_at,
      grace_ends_at,
      notification_sent_at,
      recorded_by
    `)
    .eq("tenant_id", tenantId)
    .order("billing_period", { ascending: false });

  if (rErr) return NextResponse.json({ error: rErr.message }, { status: 500 });

  return NextResponse.json({ tenant, records: records ?? [] });
}