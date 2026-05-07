"use client";

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

// ─── Types ───────────────────────────────────────────────────────────────────

interface ForecastStat {
  label: string;
  value: string;
  sub: string;
  subColor?: string;
}

interface DayData {
  day: number;
  revenue: number;
}

interface SalesForecastCardProps {
  stats?: ForecastStat[];
  data?: DayData[];
  average?: number;
  className?: string;
}

// ─── Defaults ────────────────────────────────────────────────────────────────

const defaultStats: ForecastStat[] = [
  { label: "PROJECTED TOTAL", value: "₱523.5K", sub: "↑ 12% vs last month" },
  { label: "DAILY AVERAGE", value: "₱12.5K", sub: "↑ 5% this month" },
  { label: "PEAK DAY", value: "03/19/2026", sub: "₱25K projected" },
  { label: "LOW POINT", value: "03/05/2026", sub: "₱6K projected", subColor: "#D32F2F" },
];

const defaultData: DayData[] = [
  { day: 1, revenue: 28 },
  { day: 3, revenue: 32 },
  { day: 5, revenue: 62 },
  { day: 7, revenue: 54 },
  { day: 10, revenue: 46 },
  { day: 12, revenue: 48 },
  { day: 15, revenue: 43 },
  { day: 17, revenue: 38 },
  { day: 19, revenue: 50 },
  { day: 21, revenue: 45 },
  { day: 23, revenue: 42 },
  { day: 25, revenue: 44 },
  { day: 27, revenue: 41 },
  { day: 30, revenue: 40 },
];

const DEFAULT_AVG = 42.8;

// ─── Custom Tooltip ──────────────────────────────────────────────────────────

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#24481F] text-[#FFFCF0] text-xs rounded-lg px-4 py-3 shadow-xl border border-[#4A7842]">
        <p className="font-bold mb-1 text-[#F5E69E]">Day {label}</p>
        <p className="text-[14px]">₱{payload[0].value}K</p>
      </div>
    );
  }
  return null;
};

// ─── Peak Label ──────────────────────────────────────────────────────────────

const PeakLabel = ({ viewBox }: any) => {
  if (!viewBox) return null;
  const { x, y } = viewBox;
  return (
    <g>
      {/* Adjusted positioning slightly so it doesn't clip as easily */}
      <rect x={x - 30} y={y - 28} width={60} height={22} rx={6} fill="#F7B71D" className="shadow-sm" />
      <text
        x={x}
        y={y - 13}
        textAnchor="middle"
        fill="#2D2D2D"
        fontSize={10}
        fontWeight="800"
      >
        PEAK ₱62K
      </text>
    </g>
  );
};

// ─── Component ───────────────────────────────────────────────────────────────

export default function SalesForecastCard({
  stats = defaultStats,
  data = defaultData,
  average = DEFAULT_AVG,
  className = "",
}: SalesForecastCardProps) {
  return (
    <div
      className={`bg-[#385E31] rounded-[20px] p-6 shadow-lg flex flex-col gap-6 ${className}`}
    >
      {/* Title */}
      <h2 className="text-[#FFFCF0] text-[18px] font-extrabold tracking-wide">
        30-day Sales Forecast
      </h2>

      {/* Stat pills */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-[#24481F] rounded-xl px-4 py-3.5 flex flex-col justify-between shadow-inner">
            <span className="text-[10px] font-bold tracking-wider text-[#98C98A] uppercase mb-1">
              {s.label}
            </span>
            <span className="text-[18px] font-extrabold text-[#F5E69E] mb-0.5">{s.value}</span>
            <span
              className="text-[11px] font-semibold"
              style={{ color: s.subColor ?? "#7EC86B" }}
            >
              {s.sub}
            </span>
          </div>
        ))}
      </div>

      {/* Chart Wrapper */}
      <div className="bg-[#FEFCE8] rounded-xl p-4 shadow-sm">
        {/* Chart header */}
        <div className="flex flex-wrap items-center justify-between px-2 mb-4 gap-2">
          <span className="text-[13px] font-extrabold text-[#2D2D2D] tracking-wide">
            Revenue Trend — Days 1–30
          </span>
          <div className="flex items-center gap-5 text-[11px] font-bold text-[#555]">
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-4 h-1 bg-[#385E31] rounded-full" />
              REVENUE
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-4 border-t-2 border-dashed border-[#F7B71D]" />
              AVG ₱{average}K
            </span>
          </div>
        </div>

        {/* Chart */}
        <div className="w-full h-52">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 25, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#385E31" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#385E31" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="day"
                tickFormatter={(v) => `DAY ${v}`}
                tick={{ fontSize: 10, fill: "#888", fontWeight: 600 }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
                dy={10}
              />
              <YAxis
                tickFormatter={(v) => `₱${v}k`} // Fixed to Peso symbol
                tick={{ fontSize: 10, fill: "#888", fontWeight: 600 }}
                axisLine={false}
                tickLine={false}
                domain={[10, 80]} // Increased top domain so the PeakLabel doesn't clip
                ticks={[15, 30, 45, 60]}
                dx={-10}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#98C98A', strokeWidth: 1, strokeDasharray: '4 4' }} />
              
              {/* Avg reference line */}
              <ReferenceLine
                y={average}
                stroke="#F7B71D"
                strokeDasharray="5 4"
                strokeWidth={2}
              />
              
              {/* Peak reference dot label */}
              <ReferenceLine
                x={5}
                y={62}
                stroke="transparent"
                label={<PeakLabel />}
              />
              
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#385E31"
                strokeWidth={3} // Made line slightly bolder
                fill="url(#revenueGrad)"
                dot={(props) => {
                  const { cx, cy, payload } = props;
                  // Highlight specific points
                  if (payload.day === 5 || payload.day === 15) {
                    return (
                      <circle
                        key={`dot-${payload.day}`}
                        cx={cx}
                        cy={cy}
                        r={5}
                        fill="#385E31"
                        stroke="#FEFCE8"
                        strokeWidth={2.5}
                      />
                    );
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