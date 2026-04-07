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

// ─── Types ───────────────────────────`───────────────────────────────────────

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
      <div className="bg-[#385E31] text-white text-xs rounded-lg px-3 py-2 shadow-md">
        <p className="font-bold">Day {label}</p>
        <p>₱{payload[0].value}K</p>
      </div>
    );
  }
  return null;
};

// ─── Peak Label (rendered on the chart) ─────────────────────────────────────

const PeakLabel = ({ viewBox, value }: any) => {
  if (!viewBox) return null;
  const { x, y } = viewBox;
  return (
    <g>
      <rect x={x - 24} y={y - 26} width={52} height={20} rx={4} fill="#F7B71D" />
      <text
        x={x + 2}
        y={y - 12}
        textAnchor="middle"
        fill="#2D2D2D"
        fontSize={10}
        fontWeight="bold"
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
      className={`bg-[#385E31] rounded-2xl p-5 shadow-lg flex flex-col gap-4 ${className}`}
    >
      {/* Title */}
      <h2 className="text-[#FFFCF0] text-[17px] font-extrabold tracking-wide">
        30-day Sales Forecast
      </h2>

      {/* Stat pills */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="bg-[#24481F] rounded-xl px-3 py-2 flex flex-col gap-0.5">
            <span className="text-[9px] font-bold tracking-widest text-[#FFFCF0] uppercase">
              {s.label}
            </span>
            <span className="text-[14px] font-extrabold text-[#F5E69E]">{s.value}</span>
            <span
              className="text-[10px] text-[#F5E69E] font-semibold"
              style={{ color: s.subColor ?? "#7EC86B" }}
            >
              {s.sub}
            </span>
          </div>
        ))}
      </div>
      <div className="bg-[#FEFCE8] rounded-md p-2">
      {/* Chart header */}
      <div className="flex items-center justify-between px-1 ">
        <span className="text-[11px] font-bold text-[#2D2D2D] tracking-wide">
          Revenue Trend — Days 1–30
        </span>
        <div className="flex items-center gap-4 text-[10px] font-semibold text-[#555]">
          <span className="flex items-center gap-1">
            <span className="inline-block w-5 h-0.5 bg-[#385E31] rounded-full" />
            REVENUE
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-5 border-t-2 border-dashed border-[#F7B71D]" />
            AVG ₱{average}K
          </span>
        </div>
      </div>

      {/* Chart */}
      <div className="w-full h-48 bg-[#FEFCE8] rounded-md">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 24, right: 8, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#385E31" stopOpacity={0.18} />
                <stop offset="95%" stopColor="#385E31" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="day"
              tickFormatter={(v) => `DAY ${v}`}
              tick={{ fontSize: 9, fill: "#888" }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tickFormatter={(v) => `$${v}k`}
              tick={{ fontSize: 9, fill: "#888" }}
              axisLine={false}
              tickLine={false}
              domain={[10, 70]}
              ticks={[15, 28, 40, 52, 66]}
            />
            <Tooltip content={<CustomTooltip />} />
            {/* Avg reference line */}
            <ReferenceLine
              y={average}
              stroke="#F7B71D"
              strokeDasharray="5 4"
              strokeWidth={1.5}
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
              strokeWidth={2.5}
              fill="url(#revenueGrad)"
              dot={(props) => {
                const { cx, cy, payload } = props;
                if (payload.day === 5 || payload.day === 15) {
                  return (
                    <circle
                      key={`dot-${payload.day}`}
                      cx={cx}
                      cy={cy}
                      r={4}
                      fill="#385E31"
                      stroke="white"
                      strokeWidth={2}
                    />
                  );
                }
                return <g key={`dot-${payload.day}`} />;
              }}
              activeDot={{ r: 5, fill: "#F7B71D", stroke: "#385E31", strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      </div>
    </div>
  );
}
