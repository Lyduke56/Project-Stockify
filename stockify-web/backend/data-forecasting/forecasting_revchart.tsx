"use client";

import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  DotProps,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  formatCurrency,
  generateForecast,
  generateMockData,
  type DataPoint,
  type ForecastPoint,
} from "../../backend/data-forecasting/forecasting_algorithm";
import styles from "./RevenueForecastChart.module.css";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  /**
   * Your actual historical revenue data.
   * Pass real data here — mock data is used only when this is undefined.
   */
  historicalData?: DataPoint[];

  /** "short" = up to 30 days forecast | "year" = 365 days forecast */
  mode?: "short" | "year";

  /** Number of days to forecast when mode is "short" (max 30, default 30) */
  shortDays?: number;

  title?: string;
}

// ─── Custom Dot: only renders on peak and notable points ─────────────────────

function PeakDot(props: DotProps & { payload?: ForecastPoint; peakDay: number }) {
  const { cx, cy, payload, peakDay } = props;
  if (!payload || payload.day !== peakDay) return null;
  return (
    <g>
      <circle cx={cx} cy={cy} r={6} fill="#2d4a1e" stroke="#fff" strokeWidth={2} />
    </g>
  );
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────────

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const point: ForecastPoint = payload[0].payload;
  return (
    <div className={styles.tooltip}>
      <span className={styles.tooltipLabel}>Day {point.day}</span>
      <span className={styles.tooltipValue}>{formatCurrency(point.revenue)}</span>
      {point.isForecast && <span className={styles.tooltipTag}>Forecast</span>}
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function RevenueForecastChart({
  historicalData,
  mode = "short",
  shortDays = 30,
  title,
}: Props) {
  const [activeMode, setActiveMode] = useState<"short" | "year">(mode);

  // Use real data if provided, otherwise mock
  const baseData = useMemo(
    () => historicalData ?? generateMockData(30),
    [historicalData]
  );

  const forecastDays = activeMode === "year" ? 365 : Math.min(shortDays, 30);

  const { combined, average, peak, historical } = useMemo(
    () => generateForecast(baseData, forecastDays),
    [baseData, forecastDays]
  );

  const lastHistoricalDay = historical[historical.length - 1]?.day ?? 0;

  // X-axis tick interval — keep it readable for both modes
  const tickInterval = activeMode === "year" ? Math.floor(combined.length / 12) : 4;

  const chartTitle =
    title ??
    (activeMode === "short"
      ? `Revenue Trend — Days 1–${lastHistoricalDay + forecastDays}`
      : "Revenue Trend — 12-Month Forecast");

  return (
    <div className={styles.wrapper}>
      {/* Header */}
      <div className={styles.header}>
        <h3 className={styles.title}>{chartTitle}</h3>

        <div className={styles.legend}>
          <span className={styles.legendRevenue}>— REVENUE</span>
          <span className={styles.legendForecast}>- - FORECAST</span>
          <span className={styles.legendAvg}>
            · · · AVG {formatCurrency(average)}
          </span>
        </div>

        {/* Mode toggle */}
        <div className={styles.toggle}>
          <button
            className={activeMode === "short" ? styles.toggleActive : styles.toggleBtn}
            onClick={() => setActiveMode("short")}
          >
            30 Days
          </button>
          <button
            className={activeMode === "year" ? styles.toggleActive : styles.toggleBtn}
            onClick={() => setActiveMode("year")}
          >
            1 Year
          </button>
        </div>
      </div>

      {/* Peak label */}
      <div className={styles.peakBadge} aria-label={`Peak ${formatCurrency(peak.revenue)}`}>
        PEAK {formatCurrency(peak.revenue)}
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={combined} margin={{ top: 24, right: 16, left: 8, bottom: 0 }}>
          <defs>
            {/* Historical fill */}
            <linearGradient id="fillHistorical" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#4a7c2f" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#4a7c2f" stopOpacity={0.03} />
            </linearGradient>
            {/* Forecast fill */}
            <linearGradient id="fillForecast" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#4a7c2f" stopOpacity={0.12} />
              <stop offset="95%" stopColor="#4a7c2f" stopOpacity={0.01} />
            </linearGradient>
          </defs>

          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#d4dfc8"
            vertical={false}
          />

          <XAxis
            dataKey="day"
            tickLine={false}
            axisLine={false}
            tick={{ fill: "#7a8c6e", fontSize: 11, fontFamily: "inherit" }}
            interval={tickInterval}
            tickFormatter={(v) =>
              activeMode === "year" ? `Mo ${Math.ceil(v / 30)}` : `Day ${v}`
            }
          />

          <YAxis
            tickLine={false}
            axisLine={false}
            tick={{ fill: "#7a8c6e", fontSize: 11, fontFamily: "inherit" }}
            tickFormatter={formatCurrency}
            width={52}
          />

          <Tooltip content={<CustomTooltip />} />

          {/* Average reference line */}
          <ReferenceLine
            y={average}
            stroke="#b5a800"
            strokeDasharray="6 4"
            strokeWidth={1.5}
          />

          {/* Historical area */}
          <Area
            type="monotone"
            dataKey={(p: ForecastPoint) => (!p.isForecast ? p.revenue : undefined)}
            stroke="#2d4a1e"
            strokeWidth={2.5}
            fill="url(#fillHistorical)"
            dot={(props: any) => (
              <PeakDot {...props} peakDay={peak.day} />
            )}
            activeDot={{ r: 5, fill: "#2d4a1e" }}
            connectNulls={false}
            name="Revenue"
          />

          {/* Forecast area — dashed stroke */}
          <Area
            type="monotone"
            dataKey={(p: ForecastPoint) => (p.isForecast ? p.revenue : undefined)}
            stroke="#4a7c2f"
            strokeWidth={2}
            strokeDasharray="6 4"
            fill="url(#fillForecast)"
            dot={false}
            activeDot={{ r: 5, fill: "#4a7c2f" }}
            connectNulls={false}
            name="Forecast"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}