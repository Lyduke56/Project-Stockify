import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
/**
 * GET /api/superadmin/active-tenants
 * Returns all non-pending, non-terminated tenants with their latest subscription balance.
 */
export async function GET() {

  // Fetch tenants that are active or overdue (i.e. not Pending / Terminated / Suspended)
  const { data: tenants, error } = await supabase
    .from("tenants")
    .select(
      `
      tenant_id,
      business_name,
      owner_full_name,
      created_at,
      subscription_status,
      subscription_records (
        billing_period,
        payment_status
      )
    `
    )
    .eq("is_active", true)
    .in("subscription_status", ["Active", "Overdue"])
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Compute a balance label from unpaid subscription records
  const data = (tenants ?? []).map((tenant: any) => {
    const records: { billing_period: string; payment_status: string }[] =
      tenant.subscription_records ?? [];

    const unpaidCount = records.filter(
      (r) => r.payment_status === "Pending" || r.payment_status === "Overdue"
    ).length;

    return {
      tenant_id:           tenant.tenant_id,
      business_name:       tenant.business_name,
      owner_full_name:     tenant.owner_full_name,
      created_at:          tenant.created_at,
      subscription_status: tenant.subscription_status,
      // Show number of unpaid billing periods; replace with actual amount if stored
      balance: unpaidCount > 0 ? `${unpaidCount} unpaid` : "—",
    };
  });

  return NextResponse.json({ data });
}