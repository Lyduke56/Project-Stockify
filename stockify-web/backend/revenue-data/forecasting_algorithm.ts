// lib/forecasting.ts

export interface DataPoint {
  day: number;
  revenue: number;
}

export interface ForecastPoint {
  day: number;
  revenue: number;
  isForecast: boolean;
}

export interface ForecastResult {
  historical: ForecastPoint[];
  forecast: ForecastPoint[];
  combined: ForecastPoint[];
  average: number;
  peak: ForecastPoint;
  trend: "up" | "down" | "flat";
  slope: number;
}

// ─── Core Linear Regression ───────────────────────────────────────────────────
// Given historical data points, returns slope (m) and intercept (b) for y = mx + b

function linearRegression(data: DataPoint[]): { slope: number; intercept: number } {
  const n = data.length;
  const sumX = data.reduce((acc, p) => acc + p.day, 0);
  const sumY = data.reduce((acc, p) => acc + p.revenue, 0);
  const sumXY = data.reduce((acc, p) => acc + p.day * p.revenue, 0);
  const sumX2 = data.reduce((acc, p) => acc + p.day * p.day, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  return { slope, intercept };
}

// ─── Forecast Generator ───────────────────────────────────────────────────────
// historicalData : your actual revenue data points { day, revenue }
// forecastDays   : how many days ahead to project (e.g. 30 or 365)

export function generateForecast(
  historicalData: DataPoint[],
  forecastDays: number
): ForecastResult {
  const { slope, intercept } = linearRegression(historicalData);

  const lastDay = historicalData[historicalData.length - 1].day;

  // Map historical data
  const historical: ForecastPoint[] = historicalData.map((p) => ({
    ...p,
    isForecast: false,
  }));

  // Generate forecast points from lastDay+1 to lastDay+forecastDays
  const forecast: ForecastPoint[] = Array.from({ length: forecastDays }, (_, i) => {
    const day = lastDay + i + 1;
    return {
      day,
      revenue: Math.max(0, slope * day + intercept), // clamp to 0
      isForecast: true,
    };
  });

  const combined = [...historical, ...forecast];
  const allRevenues = combined.map((p) => p.revenue);
  const average = allRevenues.reduce((a, b) => a + b, 0) / allRevenues.length;
  const peak = combined.reduce((max, p) => (p.revenue > max.revenue ? p : max), combined[0]);

  const trend: ForecastResult["trend"] =
    slope > 100 ? "up" : slope < -100 ? "down" : "flat";

  return { historical, forecast, combined, average, peak, trend, slope };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function formatCurrency(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}k`;
  return `$${value.toFixed(0)}`;
}

// Generate placeholder historical data for dev/testing
export function generateMockData(days: number): DataPoint[] {
  let revenue = 28000;
  return Array.from({ length: days }, (_, i) => {
    revenue += (Math.random() - 0.48) * 4000;
    revenue = Math.max(10000, revenue);
    return { day: i + 1, revenue: Math.round(revenue) };
  });
}