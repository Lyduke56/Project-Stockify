// lib/uptimeHeatmap.ts

// ─── Types ────────────────────────────────────────────────────────────────────

export type UptimeStatus = "up" | "degraded" | "outage";

export interface UptimeEntry {
  date: string;       // ISO format: "2024-01-15"
  status: UptimeStatus;
  uptimePercent?: number; // 0-100, optional for tooltip detail
}

export interface HeatmapCell {
  day: number;        // 1-31
  month: number;      // 0-11 (JS Date month index)
  year: number;
  status: UptimeStatus;
  uptimePercent: number;
  dateStr: string;    // "2024-01-15"
  exists: boolean;    // false for days that don't exist (e.g. Feb 30)
}

export interface HeatmapRow {
  month: number;      // 0-11
  monthLabel: string; // "Jan", "Feb", etc.
  cells: HeatmapCell[];
}

export interface HeatmapResult {
  rows: HeatmapRow[];
  overallUptime: number;   // e.g. 99.98
  totalDays: number;
  outages: number;
  degradedDays: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const MONTH_LABELS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const STATUS_UPTIME: Record<UptimeStatus, number> = {
  up: 100,
  degraded: 85,
  outage: 0,
};

// ─── Core Algorithm ───────────────────────────────────────────────────────────

/**
 * Builds the full heatmap grid from raw uptime log entries.
 *
 * @param entries   - Raw uptime log: one entry per day that had an event.
 *                    Days NOT in the list are assumed 100% up.
 * @param year      - The year to render (default: current year)
 * @param months    - Which months to include, 0-indexed (default: all 12)
 */
export function buildUptimeHeatmap(
  entries: UptimeEntry[],
  year: number = new Date().getFullYear(),
  months: number[] = [0,1,2,3,4,5,6,7,8,9,10,11]
): HeatmapResult {
  // Index entries by date string for O(1) lookup
  const entryMap = new Map<string, UptimeEntry>();
  for (const e of entries) entryMap.set(e.date, e);

  const rows: HeatmapRow[] = [];
  let totalUptime = 0;
  let totalDays = 0;
  let outages = 0;
  let degradedDays = 0;

  for (const month of months) {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: HeatmapCell[] = [];

    for (let day = 1; day <= 31; day++) {
      if (day > daysInMonth) {
        // Pad to 31 so every row has the same column count
        cells.push({
          day, month, year,
          status: "up",
          uptimePercent: 100,
          dateStr: "",
          exists: false,
        });
        continue;
      }

      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const entry = entryMap.get(dateStr);
      const status: UptimeStatus = entry?.status ?? "up";
      const uptimePercent = entry?.uptimePercent ?? STATUS_UPTIME[status];

      totalUptime += uptimePercent;
      totalDays++;
      if (status === "outage") outages++;
      if (status === "degraded") degradedDays++;

      cells.push({ day, month, year, status, uptimePercent, dateStr, exists: true });
    }

    rows.push({ month, monthLabel: MONTH_LABELS[month], cells });
  }

  const overallUptime = totalDays > 0
    ? parseFloat((totalUptime / totalDays).toFixed(2))
    : 100;

  return { rows, overallUptime, totalDays, outages, degradedDays };
}

// ─── Mock Data Generator (for dev/testing) ───────────────────────────────────

export function generateMockUptimeData(year: number = new Date().getFullYear()): UptimeEntry[] {
  const entries: UptimeEntry[] = [];
  const outageChance = 0.008;
  const degradedChance = 0.02;

  for (let month = 0; month < 12; month++) {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    for (let day = 1; day <= daysInMonth; day++) {
      const r = Math.random();
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      if (r < outageChance) {
        entries.push({ date: dateStr, status: "outage", uptimePercent: Math.round(Math.random() * 40) });
      } else if (r < outageChance + degradedChance) {
        entries.push({ date: dateStr, status: "degraded", uptimePercent: Math.round(75 + Math.random() * 20) });
      }
      // "up" days are omitted — default assumption
    }
  }
  return entries;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function statusColor(status: UptimeStatus): string {
  switch (status) {
    case "up":       return "#3d7a2a";
    case "degraded": return "#e8a800";
    case "outage":   return "#c0392b";
  }
}

export function statusLabel(status: UptimeStatus): string {
  switch (status) {
    case "up":       return "100%";
    case "degraded": return "Partial degradation";
    case "outage":   return "Service outage";
  }
}