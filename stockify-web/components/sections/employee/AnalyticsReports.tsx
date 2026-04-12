"use client";

import StatCard from "@/components/cards/stat-cards";
import { useState, useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";

// ─── Mock Data ────────────────────────────────────────────────────────────────

const ALL_REVENUE_DATA: Record<string, { day: number; revenue: number }[]> = {
  "Last 7 Days": Array.from({ length: 7 }, (_, i) => ({
    day: i + 1,
    revenue: Math.floor(28000 + Math.random() * 35000),
  })),
  "Last 30 Days": [
    { day: 1, revenue: 28000 },
    { day: 2, revenue: 33000 },
    { day: 3, revenue: 45000 },
    { day: 4, revenue: 52000 },
    { day: 5, revenue: 62000 },
    { day: 6, revenue: 61000 },
    { day: 7, revenue: 55000 },
    { day: 8, revenue: 58000 },
    { day: 9, revenue: 53000 },
    { day: 10, revenue: 49000 },
    { day: 11, revenue: 46000 },
    { day: 12, revenue: 44000 },
    { day: 13, revenue: 48000 },
    { day: 14, revenue: 51000 },
    { day: 15, revenue: 54000 },
    { day: 16, revenue: 50000 },
    { day: 17, revenue: 47000 },
    { day: 18, revenue: 45000 },
    { day: 19, revenue: 43000 },
    { day: 20, revenue: 46000 },
    { day: 21, revenue: 49000 },
    { day: 22, revenue: 51000 },
    { day: 23, revenue: 48000 },
    { day: 24, revenue: 45000 },
    { day: 25, revenue: 43000 },
    { day: 26, revenue: 41000 },
    { day: 27, revenue: 42000 },
    { day: 28, revenue: 40000 },
    { day: 29, revenue: 39000 },
    { day: 30, revenue: 38500 },
  ],
  "Last 90 Days": Array.from({ length: 30 }, (_, i) => ({
    day: i * 3 + 1,
    revenue: Math.floor(30000 + Math.sin(i * 0.4) * 15000 + Math.random() * 10000),
  })),
};

const CATEGORIES = ["All", "Beverages", "Food", "Merchandise"];
const ITEMS: Record<string, string[]> = {
  All: ["All Items", "Americano", "Latte", "Croissant", "Tote Bag"],
  Beverages: ["All Beverages", "Americano", "Latte", "Cappuccino"],
  Food: ["All Food", "Croissant", "Sandwich", "Muffin"],
  Merchandise: ["All Merchandise", "Tote Bag", "Mug", "Cap"],
};

const TOP_PRODUCTS: Record<string, string> = {
  "All Items": "Americano",
  Americano: "Americano",
  Latte: "Latte",
  Croissant: "Croissant",
  "Tote Bag": "Tote Bag",
  "All Beverages": "Americano",
  Cappuccino: "Cappuccino",
  "All Food": "Croissant",
  Sandwich: "Sandwich",
  Muffin: "Muffin",
  "All Merchandise": "Tote Bag",
  Mug: "Mug",
  Cap: "Cap",
};

// ─── Custom Tooltip ───────────────────────────────────────────────────────────

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#2C4A27] text-white text-xs px-3 py-2 rounded-lg shadow-lg">
        <p className="font-bold">Day {label}</p>
        <p>₱{payload[0].value.toLocaleString()}</p>
      </div>
    );
  }
  return null;
};

// ─── Donut Chart ─────────────────────────────────────────────────────────────

function DonutChart({ cod, qr }: { cod: number; qr: number }) {
  const total = 124500;
  const r = 70;
  const cx = 90;
  const cy = 90;
  const circumference = 2 * Math.PI * r;
  const codDash = (cod / 100) * circumference;
  const qrDash = (qr / 100) * circumference;

  return (
    <svg width="180" height="180" viewBox="0 0 180 180">
      {/* QR (gold) - starts at top */}
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke="#F7B71D"
        strokeWidth="28"
        strokeDasharray={`${qrDash} ${circumference - qrDash}`}
        strokeDashoffset={0}
        transform={`rotate(-90 ${cx} ${cy})`}
      />
      {/* COD (green) - offset by qr portion */}
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke="#385E31"
        strokeWidth="28"
        strokeDasharray={`${codDash} ${circumference - codDash}`}
        strokeDashoffset={-qrDash}
        transform={`rotate(-90 ${cx} ${cy})`}
      />
      {/* Center Text */}
      <text x={cx} y={cy - 8} textAnchor="middle" fill="#385E31" fontSize="9" fontWeight="700" fontFamily="Inter">
        TOTAL STOCK
      </text>
      <text x={cx} y={cy + 8} textAnchor="middle" fill="#385E31" fontSize="12" fontWeight="800" fontFamily="Inter">
        ₱{total.toLocaleString()}
      </text>
    </svg>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AnalyticsReports() {
  const [dateRange, setDateRange] = useState("Last 30 Days");
  const [category, setCategory] = useState("All");
  const [item, setItem] = useState("All Items");
  const [showForecast, setShowForecast] = useState(false);
  const [showValuation, setShowValuation] = useState(false);

  const revenueData = ALL_REVENUE_DATA[dateRange] ?? ALL_REVENUE_DATA["Last 30 Days"];

  const totalRevenue = useMemo(
    () => revenueData.reduce((s, d) => s + d.revenue, 0),
    [revenueData]
  );
  const totalOrders = useMemo(
    () => Math.floor(totalRevenue / 500),
    [totalRevenue]
  );
  const avgRevenue = useMemo(
    () => Math.round(totalRevenue / revenueData.length),
    [revenueData, totalRevenue]
  );
  const peakDay = useMemo(
    () => revenueData.reduce((m, d) => (d.revenue > m.revenue ? d : m), revenueData[0]),
    [revenueData]
  );
  const topProduct = TOP_PRODUCTS[item] ?? "Americano";
  const codPercent = 60;
  const qrPercent = 40;

  const availableItems = ITEMS[category] ?? ITEMS["All"];

  const handleCategoryChange = (val: string) => {
    setCategory(val);
    setItem(ITEMS[val]?.[0] ?? "All Items");
  };

  const formatY = (v: number) =>
    v >= 1000 ? `₱${(v / 1000).toFixed(0)}k` : `₱${v}`;

  return (
    <div className="w-full flex flex-col gap-6">
      {/* ── Filter Bar ── */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-[#385E31] text-sm font-semibold">Filter by:</span>

        {/* Date Range */}
        <select
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
          className="border border-[#385E31] rounded-lg px-3 py-1.5 text-sm text-[#385E31] bg-white font-medium focus:outline-none focus:ring-2 focus:ring-[#F7B71D] cursor-pointer"
        >
          {["Last 7 Days", "Last 30 Days", "Last 90 Days"].map((d) => (
            <option key={d}>{d}</option>
          ))}
        </select>

        {/* Category */}
        <select
          value={category}
          onChange={(e) => handleCategoryChange(e.target.value)}
          className="border border-[#385E31] rounded-lg px-3 py-1.5 text-sm text-[#385E31] bg-white font-medium focus:outline-none focus:ring-2 focus:ring-[#F7B71D] cursor-pointer"
        >
          {CATEGORIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>

        {/* Item */}
        <select
          value={item}
          onChange={(e) => setItem(e.target.value)}
          className="border border-[#385E31] rounded-lg px-3 py-1.5 text-sm text-[#385E31] bg-white font-medium focus:outline-none focus:ring-2 focus:ring-[#F7B71D] cursor-pointer"
        >
          {availableItems.map((i) => (
            <option key={i}>{i}</option>
          ))}
        </select>

        {/* Export */}
        <button
          onClick={() => alert("Exporting data…")}
          className="ml-auto bg-[#F7B71D] hover:bg-[#e0a519] text-[#385E31] font-bold text-sm px-5 py-1.5 rounded-lg transition-colors duration-200 shadow-sm"
        >
          Export Data
        </button>
      </div>

      {/* ── Stat Cards ── */}
      <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <StatCard title="Total Revenue" value="₱ 32k" trendText="Total revenue as of mm/yy" className="w-full" svgName="employee-icons/piggybank" />
          <StatCard title="Total Orders" value="395" trendText="Total revenue as of today" className="w-full" svgName="employee-icons/orders" />
          <StatCard title="Top Selling Product" value="124" trendText="Total revenue as of mm/yy" className="w-full" svgName="employee-icons/topseller" />
      </div>  

      {/* ── Revenue Trend Chart ── */}
      <div className="bg-white rounded-2xl p-6 shadow-md">
        <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
          <h2 className="text-[#385E31] font-bold text-base">
            Revenue Trend — Days 1–{revenueData.length}
          </h2>
          <div className="flex items-center gap-4 text-xs text-[#385E31]">
            <span className="flex items-center gap-1.5">
              <span className="w-6 h-0.5 bg-[#385E31] inline-block rounded" />
              REVENUE
            </span>
            <span className="flex items-center gap-1.5">
              <span
                className="w-6 inline-block"
                style={{
                  borderBottom: "2px dashed #F7B71D",
                  display: "inline-block",
                }}
              />
              AVG ₱{(avgRevenue / 1000).toFixed(1)}K
            </span>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="revGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#385E31" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#385E31" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="day"
              tickFormatter={(v) => `DAY ${v}`}
              tick={{ fontSize: 10, fill: "#7a9e75" }}
              axisLine={false}
              tickLine={false}
              interval={Math.floor(revenueData.length / 6)}
            />
            <YAxis
              tickFormatter={formatY}
              tick={{ fontSize: 10, fill: "#7a9e75" }}
              axisLine={false}
              tickLine={false}
              width={45}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine
              y={avgRevenue}
              stroke="#F7B71D"
              strokeDasharray="6 4"
              strokeWidth={1.5}
            />
            {/* Peak label */}
            <ReferenceLine
              x={peakDay.day}
              stroke="transparent"
              label={{
                value: `PEAK ₱${(peakDay.revenue / 1000).toFixed(0)}k`,
                position: "top",
                fill: "#F7B71D",
                fontSize: 10,
                fontWeight: 700,
              }}
            />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#385E31"
              strokeWidth={2.5}
              fill="url(#revGradient)"
              dot={false}
              activeDot={{ r: 5, fill: "#F7B71D", stroke: "#385E31", strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* ── Bottom Row ── */}
      <div className="flex flex-col sm:flex-row gap-6 items-start">
        {/* Donut + Payment Breakdown */}
        <div className="flex items-center gap-6">
          <DonutChart cod={codPercent} qr={qrPercent} />
          <div className="flex flex-col gap-3">
            <p className="text-[#385E31] text-xs font-extrabold uppercase tracking-widest">
              Payment Method Breakdown
            </p>
            <div className="flex items-center gap-2 text-sm text-[#385E31] font-semibold">
              <span className="w-3 h-3 rounded-sm bg-[#385E31] inline-block" />
              Cash on Delivery
              <span className="ml-2 font-extrabold">{codPercent}%</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-[#385E31] font-semibold">
              <span className="w-3 h-3 rounded-sm bg-[#F7B71D] inline-block" />
              QR Code
              <span className="ml-2 font-extrabold">{qrPercent}%</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3 sm:ml-auto">
          <button
            onClick={() => setShowForecast(true)}
            className="bg-[#385E31] hover:bg-[#2e4e28] text-white font-bold text-sm px-8 py-3 rounded-xl transition-colors duration-200 shadow-md whitespace-nowrap"
          >
            Generate Annual Forecast
          </button>
          <button
            onClick={() => setShowValuation(true)}
            className="bg-[#F7B71D] hover:bg-[#e0a519] text-[#385E31] font-bold text-sm px-8 py-3 rounded-xl transition-colors duration-200 shadow-md whitespace-nowrap"
          >
            View Inventory Valuation Report
          </button>
        </div>
      </div>

      {/* ── Forecast Modal ── */}
      {showForecast && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
          onClick={() => setShowForecast(false)}
        >
          <div
            className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-[#385E31] text-xl font-extrabold mb-3">
              Annual Forecast
            </h3>
            <p className="text-gray-600 text-sm mb-4">
              Based on current trends, projected annual revenue:
            </p>
            <p className="text-[#385E31] text-4xl font-extrabold mb-6">
              ₱{(totalRevenue * 12).toLocaleString()}
            </p>
            <p className="text-xs text-gray-400 mb-6">
              * Estimate based on average monthly performance. Actual results may vary.
            </p>
            <button
              onClick={() => setShowForecast(false)}
              className="w-full bg-[#385E31] text-white font-bold py-2.5 rounded-xl hover:bg-[#2e4e28] transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* ── Valuation Modal ── */}
      {showValuation && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
          onClick={() => setShowValuation(false)}
        >
          <div
            className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-[#385E31] text-xl font-extrabold mb-4">
              Inventory Valuation Report
            </h3>
            <table className="w-full text-sm text-[#385E31]">
              <thead>
                <tr className="border-b border-[#e5e7eb]">
                  <th className="text-left pb-2 font-bold">Item</th>
                  <th className="text-right pb-2 font-bold">Stock</th>
                  <th className="text-right pb-2 font-bold">Value</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { name: "Americano", stock: 320, value: 48000 },
                  { name: "Latte", stock: 210, value: 37800 },
                  { name: "Croissant", stock: 140, value: 21000 },
                  { name: "Tote Bag", stock: 80, value: 17600 },
                  { name: "Mug", stock: 60, value: 10800 },
                ].map((row) => (
                  <tr key={row.name} className="border-b border-[#f3f4f6]">
                    <td className="py-2">{row.name}</td>
                    <td className="py-2 text-right">{row.stock}</td>
                    <td className="py-2 text-right font-semibold">
                      ₱{row.value.toLocaleString()}
                    </td>
                  </tr>
                ))}
                <tr>
                  <td className="pt-3 font-extrabold">TOTAL</td>
                  <td />
                  <td className="pt-3 text-right font-extrabold text-[#F7B71D]">
                    ₱135,200
                  </td>
                </tr>
              </tbody>
            </table>
            <button
              onClick={() => setShowValuation(false)}
              className="mt-6 w-full bg-[#F7B71D] text-[#385E31] font-bold py-2.5 rounded-xl hover:bg-[#e0a519] transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
