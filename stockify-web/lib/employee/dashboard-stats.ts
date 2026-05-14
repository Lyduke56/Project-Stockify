// lib/employee/dashboard-stats.ts
// Fetches all data needed for the employee dashboard in one place.

import { createClient } from "@/lib/supabase/client";

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface DashboardStats {
  totalRevenue:     number;
  totalOrders:      number;
  topProduct:       string;
  topProductCount:  number;
  pendingOrders:    number;
}

export interface StockAlert {
  id:       string;
  label:    string;         // "Out of Stock" | "Low Stock"
  severity: "critical" | "warning";
  details:  string;
  stock:    number;
  unit:     string;
}

export interface RevenuePoint {
  day:     number;
  revenue: number;         // in thousands (₱K)
}

export interface DashboardData {
  stats:        DashboardStats;
  alerts:       StockAlert[];
  chartData:    RevenuePoint[];
  chartAvg:     number;
  projectedTotal: number;
  dailyAvg:     number;
  peakDay:      string | null;
  peakAmount:   number;
  lowDay:       string | null;
  lowAmount:    number;
  monthLabel:   string;
}

// ─── Main fetch ────────────────────────────────────────────────────────────────

export async function fetchDashboardData(tenantId: string): Promise<DashboardData> {
  const supabase = createClient();

  const now = new Date();
  const year  = now.getFullYear();
  const month = now.getMonth(); // 0-indexed
  const monthStart = new Date(year, month, 1).toISOString();
  const monthEnd   = new Date(year, month + 1, 1).toISOString();
  const monthLabel = now.toLocaleDateString("en-PH", { month: "long", year: "numeric" });

  // ── 1. Total revenue (all-time completed) ────────────────────────────────────
  const { data: txAll } = await supabase
    .from("transactions")
    .select("total_amount")
    .eq("tenant_id", tenantId);

  const totalRevenue = (txAll ?? []).reduce(
    (sum, t) => sum + Number(t.total_amount), 0
  );

  // ── 2. Total orders (all-time) ───────────────────────────────────────────────
  const { count: totalOrders } = await supabase
    .from("orders")
    .select("order_id", { count: "exact", head: true })
    .eq("tenant_id", tenantId);

  // ── 3. Pending orders ────────────────────────────────────────────────────────
  const { count: pendingOrders } = await supabase
    .from("orders")
    .select("order_id", { count: "exact", head: true })
    .eq("tenant_id", tenantId)
    .eq("fulfillment_status", "Pending");

  // ── 4. Top selling product (resilient fetch) ───────────────────────────────
  let topProduct      = "—";
  let topProductCount = 0;

  try {
    const { data: orderItems, error: itemsErr } = await supabase
      .from("order_items")
      .select("item_name, quantity, orders!inner(tenant_id)")
      .eq("orders.tenant_id", tenantId);

    if (!itemsErr && orderItems) {
      const itemTotals: Record<string, number> = {};
      for (const item of orderItems) {
        const name = (item as any).item_name ?? "Unknown Item";
        itemTotals[name] = (itemTotals[name] ?? 0) + Number(item.quantity);
      }
      const topEntry = Object.entries(itemTotals).sort((a, b) => b[1] - a[1])[0];
      if (topEntry) {
        topProduct = topEntry[0];
        topProductCount = topEntry[1];
      }
    }
  } catch (e) {
    console.warn("[fetchDashboardData] Could not calculate top product:", e);
  }

  // ── 5. Stock alerts & Order alerts ──────────────────────────────────────────
  const alerts: StockAlert[] = [];

  // F&B ingredients — check stock vs alert_limit
  const { data: fnbItems } = await supabase
    .from("fnb_inventory_items")
    .select("item_id, name, stock, alert_limit, base_unit")
    .eq("tenant_id", tenantId)
    .eq("is_active", true)
    .order("stock");

  for (const item of fnbItems ?? []) {
    const stock = Number(item.stock) || 0;
    const limit = Number(item.alert_limit) || 0;
    if (stock === 0) {
      alerts.push({ id: `fnb-${item.item_id}`, label: "Out of Stock", severity: "critical", details: `${item.name} (0 ${item.base_unit} remaining)`, stock, unit: item.base_unit });
    } else if (stock <= limit) {
      alerts.push({ id: `fnb-${item.item_id}`, label: "Low Stock", severity: "warning", details: `${item.name} (${stock} ${item.base_unit} remaining)`, stock, unit: item.base_unit });
    }
  }

  // Pending Orders alerts
  if ((pendingOrders ?? 0) > 0) {
    alerts.push({
      id: "pending-orders-alert",
      label: "Pending Orders",
      severity: "warning",
      details: `You have ${pendingOrders} unresolved order${pendingOrders !== 1 ? 's' : ''} awaiting action.`,
      stock: pendingOrders ?? 0,
      unit: "orders"
    });
  }

  // Sort: critical first, then by stock ascending
  alerts.sort((a, b) => {
    if (a.severity !== b.severity) return a.severity === "critical" ? -1 : 1;
    return a.stock - b.stock;
  });

  // ── 6. Revenue chart (current month by day) ──────────────────────────────────
  const { data: txMonth } = await supabase
    .from("transactions")
    .select("total_amount, completed_at")
    .eq("tenant_id", tenantId)
    .gte("completed_at", monthStart)
    .lt("completed_at",  monthEnd)
    .order("completed_at");

  // Group by day
  const byDay: Record<number, number> = {};
  for (const tx of txMonth ?? []) {
    const d = new Date(tx.completed_at).getDate();
    byDay[d] = (byDay[d] ?? 0) + Number(tx.total_amount);
  }

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const chartData: RevenuePoint[] = [];
  for (let d = 1; d <= daysInMonth; d++) {
    if (byDay[d] !== undefined) {
      chartData.push({ day: d, revenue: Math.round((byDay[d] / 1000) * 10) / 10 });
    }
  }

  // Stats derived from chart
  const chartRevenues = Object.values(byDay);
  const projectedTotal = chartRevenues.reduce((s, v) => s + v, 0);
  const dailyAvg       = chartRevenues.length > 0 ? projectedTotal / chartRevenues.length : 0;
  const chartAvg       = Math.round((dailyAvg / 1000) * 10) / 10;

  let peakDay: string | null = null;
  let peakAmount = 0;
  let lowDay: string | null = null;
  let lowAmount = Infinity;

  for (const [dayStr, amt] of Object.entries(byDay)) {
    if (amt > peakAmount) { peakAmount = amt; peakDay = dayStr; }
    if (amt < lowAmount)  { lowAmount = amt;  lowDay  = dayStr; }
  }
  if (lowAmount === Infinity) lowAmount = 0;

  const formatDay = (d: string | null) =>
    d ? new Date(year, month, Number(d)).toLocaleDateString("en-PH", { month: "2-digit", day: "2-digit", year: "numeric" }) : null;

  return {
    stats: {
      totalRevenue,
      totalOrders:    totalOrders ?? 0,
      topProduct,
      topProductCount,
      pendingOrders:  pendingOrders ?? 0,
    },
    alerts,
    chartData: chartData.length > 0 ? chartData : [{ day: 1, revenue: 0 }],
    chartAvg,
    projectedTotal,
    dailyAvg,
    peakDay:   formatDay(peakDay),
    peakAmount,
    lowDay:    formatDay(lowDay),
    lowAmount: lowAmount === 0 ? 0 : lowAmount,
    monthLabel,
  };
}
