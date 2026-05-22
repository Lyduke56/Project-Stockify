"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { fetchDashboardData, type DashboardData } from "@/lib/employee/dashboard-stats";
import StatCard from "@/components/cards/stat-cards";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ReferenceLine, ResponsiveContainer,
} from "recharts";
import { Loader2, AlertTriangle, Package, TrendingUp } from "lucide-react";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(n: number): string {
  if (n >= 1_000_000) return `₱${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `₱${(n / 1_000).toFixed(1)}K`;
  return `₱${n.toFixed(0)}`;
}

// ─── Chart Tooltip ────────────────────────────────────────────────────────────

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div className="bg-[#24481F] text-[#FFFCF0] text-xs rounded-lg px-4 py-3 shadow-xl border border-[#4A7842]">
        <p className="font-bold mb-1 text-[#F5E69E]">Day {label}</p>
        <p className="text-[14px]">₱{payload[0].value}K</p>
      </div>
    );
  }
  return null;
};

// ─── Alerts Card ─────────────────────────────────────────────────────────────

function LiveAlertsCard({ alerts, loading }: { alerts: DashboardData["alerts"]; loading: boolean }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const severityStyles = {
    critical: { bg: "bg-[#FDECEC]", text: "text-[#B91C1C] font-bold", detailsBg: "bg-[#FAD4D4]" },
    warning:  { bg: "bg-[#FFF8E6]", text: "text-[#9A6700] font-bold", detailsBg: "bg-[#FFEFB8]" },
  };

  return (
    <div className="bg-primary rounded-[20px] p-6 flex flex-col shadow-lg min-w-[240px] h-[480px]">
      <h2 className="text-[var(--color-sidebar-text,#FFF9D7)] text-[18px] font-extrabold font-['Inter'] mb-5 shrink-0 flex items-center gap-2">
        <AlertTriangle size={18} className="text-accent" />
        Unresolved Alerts
        {!loading && alerts.length > 0 && (
          <span className="ml-auto text-[12px] font-bold bg-red-500 text-white px-2 py-0.5 rounded-full">
            {alerts.length}
          </span>
        )}
      </h2>

      <div className="flex-1 overflow-y-auto pr-2 flex flex-col gap-3 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-white/25 transition-colors">
        {loading ? (
          <div className="flex items-center justify-center h-full text-white/40 gap-2">
            <Loader2 size={18} className="animate-spin" />
            <span className="text-[13px]">Loading alerts…</span>
          </div>
        ) : alerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-white/40 gap-2">
            <Package size={32} strokeWidth={1.5} />
            <p className="text-[13px] font-medium">All stock levels are healthy!</p>
          </div>
        ) : (
          alerts.map((alert) => {
            const style = severityStyles[alert.severity];
            const isExpanded = expandedId === alert.id;
            return (
              <div key={alert.id} className="flex flex-col shrink-0">
                <button
                  onClick={() => setExpandedId((p) => (p === alert.id ? null : alert.id))}
                  className={`group flex items-center justify-between px-5 py-3.5 transition-all duration-200 cursor-pointer w-full shadow-sm ${style.bg} hover:opacity-90 active:scale-[0.98] ${isExpanded ? "rounded-t-xl" : "rounded-xl"}`}
                >
                  <span className={`text-[13px] tracking-wide ${style.text}`}>{alert.label}</span>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                    className={`shrink-0 opacity-60 group-hover:opacity-100 transition-transform duration-300 ${style.text} ${isExpanded ? "rotate-90" : "rotate-0"}`}>
                    <path d="m9 18 6-6-6-6"/>
                  </svg>
                </button>
                <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? "max-h-24 opacity-100" : "max-h-0 opacity-0"}`}>
                  <div className={`p-4 text-[13px] font-medium text-[#2D2D2D] rounded-b-xl shadow-inner ${style.detailsBg}`}>
                    {alert.details}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ─── Revenue Chart Card ───────────────────────────────────────────────────────

function LiveRevenueCard({ data }: { data: DashboardData }) {
  const { chartData, chartAvg, projectedTotal, dailyAvg, peakDay, peakAmount, lowDay, lowAmount, monthLabel } = data;

  const peakPoint = chartData.reduce((best, p) => (p.revenue > best.revenue ? p : best), chartData[0]);

  const forecastStats = [
    { label: "MONTHLY TOTAL",  value: formatCurrency(projectedTotal), sub: monthLabel },
    { label: "DAILY AVERAGE",  value: formatCurrency(dailyAvg),       sub: "Avg per sales day" },
    { label: "PEAK DAY",       value: peakDay ?? "—",                  sub: peakAmount > 0 ? formatCurrency(peakAmount) : "No data" },
    { label: "LOW POINT",      value: lowDay  ?? "—",                  sub: lowAmount  > 0 ? formatCurrency(lowAmount)  : "No data", subColor: "#D32F2F" },
  ];

  return (
    <div className="bg-primary rounded-[20px] p-6 shadow-lg flex flex-col gap-6">
      <h2 className="text-[var(--color-sidebar-text,#FFF9D7)] text-[18px] font-extrabold tracking-wide flex items-center gap-2">
        <TrendingUp size={18} className="text-accent" />
        {monthLabel} Revenue
      </h2>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {forecastStats.map((s) => (
          <div key={s.label} className="bg-secondary rounded-xl px-4 py-3.5 flex flex-col justify-between shadow-inner">
            <span className="text-[10px] font-bold tracking-wider text-[#98C98A] uppercase mb-1">{s.label}</span>
            <span className="text-[16px] font-extrabold text-[#F5E69E] mb-0.5 truncate">{s.value}</span>
            <span className="text-[11px] font-semibold" style={{ color: s.subColor ?? "#7EC86B" }}>{s.sub}</span>
          </div>
        ))}
      </div>

      <div className="bg-[#FEFCE8] rounded-xl p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between px-2 mb-4 gap-2">
          <span className="text-[13px] font-extrabold text-[#2D2D2D] tracking-wide">Daily Revenue Trend</span>
          <div className="flex items-center gap-5 text-[11px] font-bold text-[#555]">
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-4 h-1 bg-[#385E31] rounded-full" /> REVENUE
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-4 border-t-2 border-dashed border-[#F7B71D]" /> AVG ₱{chartAvg}K
            </span>
          </div>
        </div>

        <div className="w-full h-52">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 25, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#385E31" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#385E31" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" tickFormatter={(v) => `D${v}`}
                tick={{ fontSize: 10, fill: "#888", fontWeight: 600 }} axisLine={false} tickLine={false} interval="preserveStartEnd" dy={10} />
              <YAxis tickFormatter={(v) => `₱${v}k`}
                tick={{ fontSize: 10, fill: "#888", fontWeight: 600 }} axisLine={false} tickLine={false} dx={-10} />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: "#98C98A", strokeWidth: 1, strokeDasharray: "4 4" }} />
              {chartAvg > 0 && (
                <ReferenceLine y={chartAvg} stroke="#F7B71D" strokeDasharray="5 4" strokeWidth={2} />
              )}
              {peakPoint && peakPoint.revenue > 0 && (
                <ReferenceLine x={peakPoint.day} y={peakPoint.revenue} stroke="transparent"
                  label={({ viewBox }: any) => {
                    if (!viewBox) return null;
                    const { x, y } = viewBox;
                    return (
                      <g>
                        <rect x={x - 32} y={y - 28} width={64} height={22} rx={6} fill="#F7B71D" />
                        <text x={x} y={y - 13} textAnchor="middle" fill="#2D2D2D" fontSize={10} fontWeight="800">
                          PEAK ₱{peakPoint.revenue}K
                        </text>
                      </g>
                    );
                  }}
                />
              )}
              <Area type="monotone" dataKey="revenue" stroke="#385E31" strokeWidth={3} fill="url(#revenueGrad)"
                dot={(props: any) => {
                  const { cx, cy, payload } = props;
                  if (payload.day === peakPoint?.day) {
                    return <circle key={`dot-${payload.day}`} cx={cx} cy={cy} r={5} fill="#385E31" stroke="#FEFCE8" strokeWidth={2.5} />;
                  }
                  return <g key={`dot-${payload.day}`} />;
                }}
                activeDot={{ r: 6, fill: "#F7B71D", stroke: "#385E31", strokeWidth: 3 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

type Props = { initialData?: DashboardData | null; tenantId: string };

export default function DashboardSection({ initialData, tenantId }: Props) {
  const [data,    setData]    = useState<DashboardData | null>(initialData ?? null);
  const [loading, setLoading] = useState(!initialData);

  const load = useCallback(async (tid: string) => {
    const result = await fetchDashboardData(tid);
    setData(result);
    setLoading(false);
  }, []);

  // Only fetch if initialData was not provided
  useEffect(() => {
    if (!initialData && tenantId) {
      load(tenantId);
    }
  }, [initialData, tenantId, load]);

  // Silent background polling every 30 seconds
  useEffect(() => {
    if (!tenantId) return;
    const intervalId = setInterval(() => load(tenantId), 30000);
    return () => clearInterval(intervalId);
  }, [tenantId, load]);

  const stats = data?.stats;

  return (
    <div className="w-full flex flex-col font-['Inter']">

      <div className="w-full flex flex-col items-center mt-2 mb-10">
        <div className="w-full flex justify-between items-start">
          <div className="flex-1 flex flex-col items-center">
            <h1 className="text-primary text-[30px] font-extrabold tracking-wide uppercase">
              Employee Dashboard
            </h1>
            <div className="w-[900px] max-w-full h-1.5 bg-accent mt-1 rounded-full" />
          </div>
        </div>
      </div>

      <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Total Orders"
          value={loading ? "—" : (stats?.totalOrders ?? 0).toString()}
          trendText="All orders placed"
          className="w-full"
          svgName="employee-icons/orders"
        />
        <StatCard
          title="Top Selling"
          value={loading ? "—" : (stats?.topProductCount ?? 0).toString()}
          trendText={loading ? "Loading…" : `${stats?.topProduct ?? "—"}`}
          className="w-full"
          svgName="employee-icons/topseller"
        />
        <StatCard
          title="Pending Orders"
          value={loading ? "—" : (stats?.pendingOrders ?? 0).toString()}
          trendText="Awaiting processing"
          className="w-full"
          svgName="employee-icons/orders"
        />
      </div>

      <div className="w-full grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6 mt-8">
        <LiveAlertsCard alerts={data?.alerts ?? []} loading={loading} />
        {data ? <LiveRevenueCard data={data} /> : (
          <div className="bg-primary rounded-[20px] p-6 flex items-center justify-center text-white/40 gap-3">
            <Loader2 size={22} className="animate-spin" />
            <span className="font-medium text-[14px]">Loading chart…</span>
          </div>
        )}
      </div>
    </div>
  );
}