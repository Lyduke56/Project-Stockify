import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const MONTHLY_FEE = 1000; // ₱1,000 / month

/**
 * GET /api/superadmin/active-tenants
 * Returns Active + Overdue tenants with business_type, balance (₱), and next_billing_date.
 */
export async function GET() {
  const { data: tenants, error } = await supabase
    .from("tenants")
    .select(
      `
      tenant_id,
      business_name,
      owner_full_name,
      owner_email,
      business_type,
      created_at,
      subscription_status,
      subscription_records (
        subscription_id,
        billing_period,
        payment_status,
        amount
      )
    `
    )
    .eq("is_active", true)
    .in("subscription_status", ["Active", "Overdue"])
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const data = (tenants ?? []).map((tenant: any) => {
    const records: {
      subscription_id: string;
      billing_period: string;
      payment_status: string;
      amount: number | null;
    }[] = tenant.subscription_records ?? [];

    // ── Unpaid records (Pending or Overdue), sorted earliest first ──────
    const unpaidRecords = records
      .filter((r) => r.payment_status === "Pending" || r.payment_status === "Overdue")
      .sort(
        (a, b) =>
          new Date(a.billing_period).getTime() - new Date(b.billing_period).getTime()
      );

    // ── Balance: sum of unpaid amounts ───────────────────────────────────
    const unpaidTotal = unpaidRecords.reduce(
      (sum, r) => sum + (r.amount ?? MONTHLY_FEE),
      0
    );
    const balance =
      unpaidTotal > 0
        ? `₱${unpaidTotal.toLocaleString("en-PH")}`
        : "—";

    // ── Next billing date ────────────────────────────────────────────────
    let next_billing_date: string | null = null;

    if (unpaidRecords.length > 0) {
      // Earliest unpaid period IS the current due date
      next_billing_date = unpaidRecords[0].billing_period;
    } else {
      // All paid — advance latest paid by 1 month
      const paidRecords = records
        .filter((r) => r.payment_status === "Paid")
        .sort(
          (a, b) =>
            new Date(b.billing_period).getTime() - new Date(a.billing_period).getTime()
        );

      if (paidRecords.length > 0) {
        const d = new Date(paidRecords[0].billing_period + "T00:00:00");
        d.setMonth(d.getMonth() + 1);
        next_billing_date = d.toISOString().split("T")[0];
      } else {
        // No records at all — first billing is 1 month after tenant creation
        const d = new Date(tenant.created_at);
        d.setMonth(d.getMonth() + 1);
        next_billing_date = d.toISOString().split("T")[0];
      }
    }

    return {
      tenant_id:           tenant.tenant_id,
      business_name:       tenant.business_name,
      owner_full_name:     tenant.owner_full_name,
      owner_email:         tenant.owner_email,
      business_type:       tenant.business_type ?? "—",
      created_at:          tenant.created_at,
      subscription_status: tenant.subscription_status,
      balance,
      next_billing_date,
    };
  });

  return NextResponse.json({ data });
}