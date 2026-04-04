"use client";

import { useMemo } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import styles from "../../backend/revenue-data/piechart_payment.module.css";

// ─── Types ────────────────────────────────────────────────────────────────────

export type PaymentMethod = "COD" | "QR";

export interface Order {
  id: string | number;
  amount: number;
  paymentMethod: PaymentMethod;
}

export interface PaymentBreakdownData {
  method: PaymentMethod;
  label: string;
  total: number;
  percentage: number;
  color: string;
}

// ─── Algorithm ────────────────────────────────────────────────────────────────
// Takes raw orders and returns the breakdown data for the chart

export function computePaymentBreakdown(orders: Order[]): {
  breakdown: PaymentBreakdownData[];
  totalStock: number;
} {
  const totals: Record<PaymentMethod, number> = { COD: 0, QR: 0 };

  for (const order of orders) {
    if (order.paymentMethod === "COD") totals.COD += order.amount;
    else if (order.paymentMethod === "QR") totals.QR += order.amount;
  }

  const totalStock = totals.COD + totals.QR;

  const breakdown: PaymentBreakdownData[] = [
    {
      method: "COD",
      label: "Cash on Delivery",
      total: totals.COD,
      percentage: totalStock > 0 ? Math.round((totals.COD / totalStock) * 100) : 0,
      color: "#2d4a1e",
    },
    {
      method: "QR",
      label: "QR Code",
      total: totals.QR,
      percentage: totalStock > 0 ? Math.round((totals.QR / totalStock) * 100) : 0,
      color: "#e8a800",
    },
  ];

  return { breakdown, totalStock };
}

// ─── Format ───────────────────────────────────────────────────────────────────

function formatPeso(value: number): string {
  return `₱${value.toLocaleString("en-PH")}`;
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────────

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d: PaymentBreakdownData = payload[0].payload;
  return (
    <div className={styles.tooltip}>
      <span className={styles.tooltipLabel}>{d.label}</span>
      <span className={styles.tooltipValue}>{formatPeso(d.total)}</span>
      <span className={styles.tooltipPct}>{d.percentage}%</span>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  /**
   * Raw orders from your DB/API.
   * Leave undefined to use mock data during development.
   */
  orders?: Order[];
}

// Mock data for development
const MOCK_ORDERS: Order[] = [
  ...Array.from({ length: 60 }, (_, i) => ({
    id: i,
    amount: Math.round(800 + Math.random() * 1200),
    paymentMethod: "COD" as PaymentMethod,
  })),
  ...Array.from({ length: 40 }, (_, i) => ({
    id: 100 + i,
    amount: Math.round(800 + Math.random() * 1200),
    paymentMethod: "QR" as PaymentMethod,
  })),
];

export function PaymentBreakdownChart({ orders }: Props) {
  const { breakdown, totalStock } = useMemo(
    () => computePaymentBreakdown(orders ?? MOCK_ORDERS),
    [orders]
  );

  return (
    <div className={styles.wrapper}>
      {/* Donut chart */}
      <div className={styles.chartWrap}>
        <ResponsiveContainer width={180} height={180}>
          <PieChart>
            <Pie
              data={breakdown}
              cx="50%"
              cy="50%"
              innerRadius={58}
              outerRadius={85}
              dataKey="total"
              startAngle={90}
              endAngle={-270}
              strokeWidth={0}
            >
              {breakdown.map((entry) => (
                <Cell key={entry.method} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>

        {/* Center label */}
        <div className={styles.center}>
          <span className={styles.centerLabel}>TOTAL STOCK</span>
          <span className={styles.centerValue}>{formatPeso(totalStock)}</span>
        </div>
      </div>

      {/* Legend */}
      <div className={styles.legend}>
        <p className={styles.legendTitle}>PAYMENT METHOD BREAKDOWN</p>
        {breakdown.map((d) => (
          <div key={d.method} className={styles.legendRow}>
            <span className={styles.legendDot} style={{ background: d.color }} />
            <span className={styles.legendName}>{d.label}</span>
            <span className={styles.legendPct}>{d.percentage}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}