"use client";

import { useMemo, useState } from "react";
import {
  buildUptimeHeatmap,
  generateMockUptimeData,
  statusColor,
  statusLabel,
  type HeatmapCell,
  type UptimeEntry,
} from "./heatmap_uptimelogic";
import styles from "../../backend/revenue-data/heatmap_uptime.module.css";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  /**
   * Real uptime entries from your DB/API.
   * Leave undefined to use mock data during development.
   */
  entries?: UptimeEntry[];
  year?: number;
}

// ─── Tooltip ─────────────────────────────────────────────────────────────────

interface TooltipState {
  cell: HeatmapCell;
  x: number;
  y: number;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function SystemUptimeHeatmap({ entries, year = new Date().getFullYear() }: Props) {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  const data = useMemo(
    () => entries ?? generateMockUptimeData(year),
    [entries, year]
  );

  const { rows, overallUptime, outages, degradedDays } = useMemo(
    () => buildUptimeHeatmap(data, year),
    [data, year]
  );

  const handleMouseEnter = (cell: HeatmapCell, e: React.MouseEvent) => {
    if (!cell.exists) return;
    setTooltip({ cell, x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (tooltip) setTooltip((prev) => prev && { ...prev, x: e.clientX, y: e.clientY });
  };

  const handleMouseLeave = () => setTooltip(null);

  const statusDescription =
    outages === 0 && degradedDays === 0
      ? "All systems, including the multi-tenant SaaS inventory engine and database, are fully functional."
      : `${outages > 0 ? `${outages} outage${outages > 1 ? "s" : ""}` : ""}${outages > 0 && degradedDays > 0 ? " · " : ""}${degradedDays > 0 ? `${degradedDays} degraded day${degradedDays > 1 ? "s" : ""}` : ""} recorded this year.`;

  return (
    <div className={styles.wrapper}>
      {/* Left panel */}
      <div className={styles.left}>
        <span className={styles.pct}>{overallUptime}%</span>
        <p className={styles.desc}>{statusDescription}</p>
      </div>

      {/* Right panel */}
      <div className={styles.right} onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}>
        <p className={styles.title}>System Uptime</p>

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.cornerTh} />
                {Array.from({ length: 31 }, (_, i) => (
                  <th key={i + 1} className={styles.dayTh}>
                    {(i + 1) % 2 === 1 ? i + 1 : ""}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.month}>
                  <td className={styles.monthLabel}>{row.monthLabel}</td>
                  {row.cells.map((cell) => (
                    <td key={cell.day} className={styles.cellTd}>
                      {cell.exists ? (
                        <div
                          className={styles.cell}
                          style={{ background: statusColor(cell.status) }}
                          onMouseEnter={(e) => handleMouseEnter(cell, e)}
                        />
                      ) : (
                        <div className={styles.cellEmpty} />
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Legend */}
        <div className={styles.legend}>
          {(["up", "degraded", "outage"] as const).map((s) => (
            <div key={s} className={styles.legendItem}>
              <span className={styles.legendDot} style={{ background: statusColor(s) }} />
              <span className={styles.legendLabel}>{statusLabel(s)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className={styles.tooltip}
          style={{ left: tooltip.x + 14, top: tooltip.y - 36 }}
        >
          <span className={styles.tooltipDate}>{tooltip.cell.dateStr}</span>
          <span className={styles.tooltipStatus}>
            {statusLabel(tooltip.cell.status)} · {tooltip.cell.uptimePercent}%
          </span>
        </div>
      )}
    </div>
  );
}