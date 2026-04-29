import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/cron/trial-check
 * Runs daily — finds expired trials and converts them to Active billing.
 */
export async function GET() {
  const now = new Date();

  // Find all tenants whose trial has expired but are still on Trial status
  const { data: expiredTrials, error } = await supabase
    .from("tenants")
    .select("tenant_id, business_name, owner_email, trial_ends_at, subscription_status")
    .eq("subscription_status", "Trial")
    .lt("trial_ends_at", now.toISOString()); // trial_ends_at < now

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!expiredTrials || expiredTrials.length === 0) {
    return NextResponse.json({ message: "No expired trials found.", converted: 0 });
  }

  const results = [];

  for (const tenant of expiredTrials) {
    // Build billing period = today (YYYY-MM-DD)
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    const billingPeriod = `${y}-${m}-${d}`;

    // Skip if billing record already exists for today
    const { data: existing } = await supabase
      .from("subscription_records")
      .select("subscription_id")
      .eq("tenant_id", tenant.tenant_id)
      .eq("billing_period", billingPeriod)
      .maybeSingle();

    if (existing) {
      results.push({ tenant_id: tenant.tenant_id, status: "skipped — already billed" });
      continue;
    }

    // overdue_at = 1 month from today
    const overdueDate = new Date(now);
    overdueDate.setMonth(overdueDate.getMonth() + 1);

    // Insert billing record
    const { error: insertError } = await supabase
      .from("subscription_records")
      .insert({
        tenant_id:      tenant.tenant_id,
        billing_period: billingPeriod,
        payment_status: "Pending",
        amount:         1000.0,
        overdue_at:     overdueDate.toISOString(),
      });

    if (insertError) {
      results.push({ tenant_id: tenant.tenant_id, status: `error: ${insertError.message}` });
      continue;
    }

    // Activate tenant and clear trial
    await supabase
      .from("tenants")
      .update({
        subscription_status: "Active",
        trial_ends_at:       null,
      })
      .eq("tenant_id", tenant.tenant_id);

    results.push({ tenant_id: tenant.tenant_id, business_name: tenant.business_name, status: "converted to Active" });
  }

  return NextResponse.json({ converted: results.filter(r => r.status === "converted to Active").length, results });
}