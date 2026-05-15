import { createClient } from "@/lib/supabase/client";

export interface ClientDashboardStats {
  activeNewCustomers: number;
  monthlyRevenue: number;
  totalSuccessTransactions: number; // For the current month
  currentMonthName: string;
  revenueTrend: number;
  customerTrend: number;
  orderTrend: number;
  shopStatus: {
    shopName: string;
    itemCount: number;
    lowStockCount: number;
    revenue: number;
    orders: number;
  };
  subscription: {
    status: string;
    daysLeft: number | null;
  };
}

export async function fetchClientDashboardData(tenantId: string): Promise<ClientDashboardStats> {
  const supabase = createClient();
  const now = new Date();
  const currentMonthName = now.toLocaleString('default', { month: 'long' });
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0).toISOString();

  try {
    // 1. Monthly Revenue
    const { data: currentMonthTx, error: curRevErr } = await supabase
      .from("transactions")
      .select("total_amount")
      .eq("tenant_id", tenantId)
      .gte("completed_at", monthStart);

    if (curRevErr) console.error("Error fetching current month revenue:", curRevErr);

    const monthlyRevenue = (currentMonthTx ?? []).reduce((sum: number, tx: { total_amount: number | string }) => sum + Number(tx.total_amount), 0);

    const { data: lastMonthTx, error: lastRevErr } = await supabase
      .from("transactions")
      .select("total_amount")
      .eq("tenant_id", tenantId)
      .gte("completed_at", lastMonthStart)
      .lte("completed_at", lastMonthEnd);

    if (lastRevErr) console.error("Error fetching last month revenue:", lastRevErr);

    const lastMonthRevenue = (lastMonthTx ?? []).reduce((sum: number, tx: { total_amount: number | string }) => sum + Number(tx.total_amount), 0);
    const revenueTrend = lastMonthRevenue === 0 ? 0 : ((monthlyRevenue - lastMonthRevenue) / lastMonthRevenue) * 100;

    // 2. Success Transactions (This month only)
    const { count: totalSuccessTransactions, error: totalTxErr } = await supabase
      .from("transactions")
      .select("transaction_id", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .gte("completed_at", monthStart);
    
    if (totalTxErr) console.error("Error fetching success transactions this month:", totalTxErr);

    const { count: lastMonthTotalTx, error: lastMonthTotalTxErr } = await supabase
      .from("transactions")
      .select("transaction_id", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .gte("completed_at", lastMonthStart)
      .lte("completed_at", lastMonthEnd);

    if (lastMonthTotalTxErr) console.error("Error fetching last month total transactions:", lastMonthTotalTxErr);

    const orderTrend = (lastMonthTotalTx ?? 0) === 0 ? 0 : (( (totalSuccessTransactions ?? 0) - (lastMonthTotalTx ?? 0)) / (lastMonthTotalTx ?? 0)) * 100;

    // 3. Active New Customers (This month only, role 'Customer')
    const { count: activeNewCustomers, error: customersErr } = await supabase
      .from("users")
      .select("user_id", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .eq("role", "Customer")
      .gte("created_at", monthStart);
    
    if (customersErr) console.error("Error fetching active new customers this month:", customersErr);
    
    // Previous month for trend
    const { count: prevActiveNewCustomers, error: prevCustomersErr } = await supabase
      .from("users")
      .select("user_id", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .eq("role", "Customer")
      .gte("created_at", lastMonthStart)
      .lt("created_at", monthStart);

    if (prevCustomersErr) console.error("Error fetching previous month customers:", prevCustomersErr);

    const customerTrend = (prevActiveNewCustomers ?? 0) === 0 ? 0 : (((activeNewCustomers ?? 0) - (prevActiveNewCustomers ?? 0)) / (prevActiveNewCustomers ?? 0)) * 100;

    // 4. Shop Status
    const { data: tenant, error: tenantErr } = await supabase
      .from("tenants")
      .select("business_name, subscription_status, trial_ends_at")
      .eq("tenant_id", tenantId)
      .single();

    if (tenantErr) console.error("Error fetching tenant details:", tenantErr);

    // Subscription calculation
    let daysLeft: number | null = null;
    if (tenant?.trial_ends_at) {
      const trialEnd = new Date(tenant.trial_ends_at);
      const diffTime = trialEnd.getTime() - now.getTime();
      daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    // Item Count (F&B + NFB)
    const { count: fnbCount, error: fnbCountErr } = await supabase
      .from("fnb_inventory_items")
      .select("item_id", { count: "exact", head: true })
      .eq("tenant_id", tenantId);

    if (fnbCountErr) console.error("Error fetching F&B item count:", fnbCountErr);

    const { count: nfbCount, error: nfbCountErr } = await supabase
      .from("nfb_products")
      .select("product_id", { count: "exact", head: true })
      .eq("tenant_id", tenantId);

    if (nfbCountErr) console.error("Error fetching NFB item count:", nfbCountErr);

    const itemCount = (fnbCount ?? 0) + (nfbCount ?? 0);

    // Low Stock Count
    let lowStockCount = 0;
    const { data: fnbLow, error: fnbLowErr } = await supabase
      .from("fnb_inventory_items")
      .select("stock, alert_limit")
      .eq("tenant_id", tenantId);

    if (fnbLowErr) console.error("Error fetching F&B low stock items:", fnbLowErr);

    for (const item of fnbLow ?? []) {
      if (item.stock <= (item.alert_limit ?? 0)) lowStockCount++;
    }

    const { data: nfbLow, error: nfbLowErr } = await supabase
      .from("nfb_products")
      .select("quantity, reorder_threshold")
      .eq("tenant_id", tenantId);

    if (nfbLowErr) console.error("Error fetching NFB low stock items:", nfbLowErr);

    for (const item of nfbLow ?? []) {
      if (item.quantity <= (item.reorder_threshold ?? 0)) lowStockCount++;
    }

    return {
      activeNewCustomers: activeNewCustomers ?? 0,
      monthlyRevenue,
      totalSuccessTransactions: totalSuccessTransactions ?? 0,
      currentMonthName,
      revenueTrend,
      customerTrend,
      orderTrend,
      shopStatus: {
        shopName: tenant?.business_name ?? "My Shop",
        itemCount,
        lowStockCount,
        revenue: monthlyRevenue,
        orders: totalSuccessTransactions ?? 0
      },
      subscription: {
        status: tenant?.subscription_status ?? "Inactive",
        daysLeft: daysLeft
      }
    };
  } catch (err) {
    console.error("Critical error in fetchClientDashboardData:", err);
    return {
      activeNewCustomers: 0,
      monthlyRevenue: 0,
      totalSuccessTransactions: 0,
      currentMonthName: "",
      revenueTrend: 0,
      customerTrend: 0,
      orderTrend: 0,
      shopStatus: {
        shopName: "My Shop",
        itemCount: 0,
        lowStockCount: 0,
        revenue: 0,
        orders: 0
      },
      subscription: {
        status: "Unknown",
        daysLeft: null
      }
    };
  }
}
