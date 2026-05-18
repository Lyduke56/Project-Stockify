// app/api/superadmin/dashboard/stats/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    const [activeRes, pendingRes, suspendedRes] = await Promise.all([
      supabase.from("tenants").select("*", { count: "exact", head: true }).eq("subscription_status", "Active"),
      supabase.from("tenants").select("*", { count: "exact", head: true }).eq("subscription_status", "Pending"),
      supabase.from("tenants").select("*", { count: "exact", head: true }).eq("subscription_status", "Suspended"),
    ]);

    // 2. Fetch Subscription Records for MRR (using amount_paid)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const { data: records, error: mrrError } = await supabase
      .from("subscription_records")
      .select("amount_paid, billing_period")
      .gte("billing_period", sixMonthsAgo.toISOString().split('T')[0])
      .order("billing_period", { ascending: true });

    if (mrrError) throw mrrError;

    // Process MRR Data
    const monthlyMap: Record<string, number> = {};
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    
    (records || []).forEach((r: any) => {
      if (!r.billing_period) return;
      const date = new Date(r.billing_period);
      if (isNaN(date.getTime())) return;
      const key = `${monthNames[date.getMonth()]} ${date.getFullYear().toString().slice(-2)}`;
      monthlyMap[key] = (monthlyMap[key] || 0) + Number(r.amount_paid || 0);
    });

    const mrrChartData = Object.entries(monthlyMap).map(([month, revenue]) => ({
      month,
      revenue
    }));

    return NextResponse.json({
      stats: {
        active: activeRes.count || 0,
        pending: pendingRes.count || 0,
        suspended: suspendedRes.count || 0,
      },
      mrrChartData,
    });
  } catch (error: any) {
    console.error("[Dashboard Stats API Error]:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
