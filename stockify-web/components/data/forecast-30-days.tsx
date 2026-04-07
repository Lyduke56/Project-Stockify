import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  Area,
  ComposedChart,
} from "recharts";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

interface CategoryCardProps {
  category: string;
  description: string;
  growth: string;
  /** Optional: override growth text color (defaults to green-400) */
  growthClassName?: string;
}

interface RevenueDataPoint {
  day: string;
  revenue: number;
}

// ─────────────────────────────────────────────
// Sub-component: CategoryCard
// Each of the 4 stat cards in the top row.
// ─────────────────────────────────────────────

const CategoryCard: React.FC<CategoryCardProps> = ({
  category,
  description,
  growth,
  growthClassName = "text-green-400",
}) => {
  return (
    <div className="relative flex-1 min-w-[140px] h-16 bg-lime-900 rounded-[10px] px-[9px] py-2 flex flex-col justify-between">
      {/* Muted label row */}
      <span className="text-orange-200/50 text-xs font-normal font-['Inter'] uppercase tracking-wide leading-none">
        {category}
      </span>

      {/* Bold description */}
      <span className="text-orange-200 text-base font-bold font-['Inter'] leading-tight">
        {description}
      </span>

      {/* Growth badge */}
      <span className={`text-[10px] font-semibold font-['Inter'] leading-none ${growthClassName}`}>
        {growth}
      </span>
    </div>
  );
};

// ─────────────────────────────────────────────
// Sample data for the Revenue Trend chart
// Days 1–30, revenue in thousands (displayed as $xxK)
// ─────────────────────────────────────────────

const revenueData: RevenueDataPoint[] = [
  { day: "DAY 1",  revenue: 27000 },
  { day: "DAY 3",  revenue: 38000 },
  { day: "DAY 5",  revenue: 54000 }, // peak ≈ $62k — adjust as needed
  { day: "DAY 8",  revenue: 62000 }, // PEAK
  { day: "DAY 10", revenue: 55000 },
  { day: "DAY 13", revenue: 46000 },
  { day: "DAY 15", revenue: 42000 },
  { day: "DAY 18", revenue: 44000 },
  { day: "DAY 20", revenue: 41000 },
  { day: "DAY 23", revenue: 39000 },
  { day: "DAY 25", revenue: 38500 },
  { day: "DAY 28", revenue: 39000 },
  { day: "DAY 30", revenue: 40000 },
];

const AVG_REVENUE = 42800; // dashed average line value

// ─────────────────────────────────────────────
// Custom tooltip shown on hover over chart
// ─────────────────────────────────────────────

const ChartTooltip: React.FC<{ active?: boolean; payload?: any[]; label?: string }> = ({
  active,
  payload,
  label,
}) => {
  if (!active || !payload?.length) return null;
  const value = payload[0]?.value as number;
  return (
    <div className="bg-lime-900 text-orange-200 text-xs font-semibold px-2 py-1 rounded shadow-md font-['Inter']">
      {label}: ${(value / 1000).toFixed(0)}K
    </div>
  );
};

// ─────────────────────────────────────────────
// Custom dot: highlights the peak data point
// ─────────────────────────────────────────────

const PeakDot: React.FC<any> = (props) => {
  const { cx, cy, payload } = props;
  const isPeak = payload.revenue === 62000;
  if (!isPeak) return null;
  return (
    <g>
      {/* Outer ring */}
      <circle cx={cx} cy={cy} r={6} fill="#4ade80" stroke="#14532d" strokeWidth={2} />
      {/* PEAK label pill */}
      <rect x={cx - 22} y={cy - 26} width={44} height={16} rx={4} fill="#facc15" />
      <text x={cx} y={cy - 14} textAnchor="middle" fontSize={9} fontWeight={700} fill="#14532d" fontFamily="Inter">
        PEAK $62k
      </text>
    </g>
  );
};

// ─────────────────────────────────────────────
// Main component: SalesForecast30Days
// ─────────────────────────────────────────────

const SalesForecast30Days: React.FC = () => {
  // ── Category card data ──────────────────────
  // Replace these with real props / API data as needed
  const cards: CategoryCardProps[] = [
    { category: "Category", description: "Description", growth: "Growth" },
    { category: "Category", description: "Description", growth: "Growth" },
    { category: "Category", description: "Description", growth: "Growth" },
    { category: "Category", description: "Description", growth: "Growth" },
  ];

  return (
    // ── Outer container ─────────────────────────
    // Dark forest-green card, fixed width to match design spec (688px)
    <div className="w-[688px] bg-lime-900 rounded-[10px] p-[21px] flex flex-col gap-4">

      {/* ── Dashboard title ───────────────────────── */}
      <h2 className="text-amber-50 text-base font-semibold font-['Inter']">
        30-day Sales Forecast
      </h2>

      {/* ── Top row: 4 × CategoryCard ─────────────── */}
      {/* Each card is a self-contained component (see CategoryCard above) */}
      <div className="flex gap-3">
        {cards.map((card, i) => (
          <CategoryCard
            key={i}
            category={card.category}
            description={card.description}
            growth={card.growth}
          />
        ))}
      </div>

      {/* ── Chart panel ───────────────────────────── */}
      {/* Cream/off-white background panel that holds the line chart */}
      <div className="bg-yellow-50 rounded-[10px] p-4">

        {/* Chart header row: title left, legend right */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-lime-900 text-xs font-semibold font-['Inter']">
            Revenue Trend — Days 1–30
          </span>
          <div className="flex items-center gap-4">
            {/* Revenue legend item */}
            <div className="flex items-center gap-1">
              <span className="block w-5 h-[2px] bg-lime-800" />
              <span className="text-lime-900 text-[10px] font-['Inter']">REVENUE</span>
            </div>
            {/* Average legend item */}
            <div className="flex items-center gap-1">
              <span className="block w-5 h-[2px] bg-yellow-400 border-dashed" style={{ borderTop: "2px dashed #facc15" }} />
              <span className="text-lime-900 text-[10px] font-['Inter']">AVG $42.8K</span>
            </div>
          </div>
        </div>

        {/* Recharts ComposedChart with area fill + line */}
        <ResponsiveContainer width="100%" height={200}>
          <ComposedChart data={revenueData} margin={{ top: 20, right: 10, left: 0, bottom: 0 }}>
            {/* Gradient fill for area under the line */}
            <defs>
              <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#4d7c0f" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#4d7c0f" stopOpacity={0.02} />
              </linearGradient>
            </defs>

            {/* X-axis: show day labels, hide axis line */}
            <XAxis
              dataKey="day"
              tick={{ fill: "#78716c", fontSize: 9, fontFamily: "Inter" }}
              axisLine={false}
              tickLine={false}
              interval={1}
            />

            {/* Y-axis: format as $xxK, hide axis line */}
            <YAxis
              tickFormatter={(v) => `$${v / 1000}k`}
              tick={{ fill: "#78716c", fontSize: 9, fontFamily: "Inter" }}
              axisLine={false}
              tickLine={false}
              domain={[10000, 70000]}
              ticks={[15000, 28000, 40000, 52000, 65000]}
            />

            {/* Custom hover tooltip */}
            <Tooltip content={<ChartTooltip />} />

            {/* Dashed average reference line */}
            <ReferenceLine
              y={AVG_REVENUE}
              stroke="#facc15"
              strokeDasharray="6 3"
              strokeWidth={1.5}
            />

            {/* Area fill beneath the revenue line */}
            <Area
              type="monotone"
              dataKey="revenue"
              fill="url(#revenueGradient)"
              stroke="none"
            />

            {/* Main revenue line with custom peak dot */}
            <Line
              type="monotone"
              dataKey="revenue"
              stroke="#365314"
              strokeWidth={2}
              dot={<PeakDot />}
              activeDot={{ r: 4, fill: "#4ade80" }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      {/* ── End chart panel ───────────────────────── */}

    </div>
    // ── End outer container ──────────────────────
  );
};

export default SalesForecast30Days;