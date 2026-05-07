"use client";

import React, { useState, useEffect, useCallback } from "react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface PaymentHistoryStats {
  total_paid_amount: number;
  paid_count:        number;
  total_records:     number;
  late_count:        number;
  missed_count:      number;
  avg_days_late:     number;
}

interface SubscriptionRow {
  subscription_id:          string;
  billing_period:           string;
  payment_status:           string;
  amount:                   number;
  amount_paid:              number;
  balance:                  number;
  paid_at:                  string | null;
  overdue_at:               string | null;
  grace_ends_at:            string | null;
  days_late:                number | null;
  latest_submission_status: string | null;
  latest_proof_url:         string | null;
}

interface PaymentHistoryTabProps {
  tenantId: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatCurrency(n: number) {
  return (
    "₱" +
    n.toLocaleString("en-PH", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
}

function formatMonth(billingPeriod: string) {
  const d = new Date(billingPeriod + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

// ── Stat Card ─────────────────────────────────────────────────────────────────

interface StatCardProps {
  title:     string;
  value:     string | number;
  trendText: string;
  svgName:   string;
}

function StatCard({ title, value, trendText, svgName }: StatCardProps) {
  return (
    <div className="bg-[#385E31] rounded-[8px] p-4 flex flex-col shadow-sm border border-[#385E31]">
      <h3 className="text-[#FFFCEB] text-[14px] font-bold mb-3">{title}</h3>
      <div className="bg-[#FFFCEB] rounded-[6px] flex flex-col items-center justify-center py-4 flex-1">
        <div className="flex items-center justify-center gap-3">
          <img src={`/${svgName}.svg`} alt={title} className="w-10 h-10 object-contain" />
          <span className="text-[#385E31] text-[2.6rem] font-black leading-none">{value}</span>
        </div>
        <p className="text-[#385E31] text-[11px] mt-2 font-medium">{trendText}</p>
      </div>
    </div>
  );
}

// ── Total Revenue Chart ───────────────────────────────────────────────────────

function TotalRevenueChart({ records }: { records: SubscriptionRow[] }) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const statusColors: Record<string, string> = {
    Paid:    "#385E31",
    Late:    "#E5AD24",
    Overdue: "#E5AD24",
    Missed:  "#E91F22",
    Pending: "#A0A0A0",
  };

  const sorted = [...records]
    .sort((a, b) => a.billing_period.localeCompare(b.billing_period))
    .slice(-12);

  if (sorted.length === 0) return null;

  let cumulative = 0;
  const chartData = sorted.map((r) => {
    cumulative += r.amount_paid;
    return {
      month:   formatMonth(r.billing_period),
      amount:  cumulative,
      display: formatCurrency(cumulative),
      status:  r.payment_status,
    };
  });

  const maxAmount = Math.max(...chartData.map((d) => d.amount), 1);
  const polylinePoints = chartData
    .map(
      (d, i) =>
        `${(i / Math.max(chartData.length - 1, 1)) * 100},${
          100 - (d.amount / maxAmount) * 100
        }`
    )
    .join(" ");

  return (
    <div className="w-full flex flex-col mt-2">
      <h2 className="text-[16px] font-extrabold text-[#385E31] mb-3 text-center">
        Total Revenue
      </h2>
      <div className="relative w-full h-[200px] border border-[#385E31] rounded-[8px] bg-[#FFFCEB] flex shadow-sm">
        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none z-0 py-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="w-full flex items-center">
              <div className="flex-1 border-b border-[#385E31]/10 ml-2" />
            </div>
          ))}
        </div>
        <div className="absolute left-4 right-4 top-6 bottom-6 z-10">
          {chartData.length > 1 && (
            <svg
              className="absolute inset-0 w-full h-full overflow-visible"
              preserveAspectRatio="none"
              viewBox="0 0 100 100"
            >
              <polyline
                points={polylinePoints}
                fill="none"
                stroke="#E5AD24"
                strokeWidth="2.5"
                vectorEffect="non-scaling-stroke"
              />
            </svg>
          )}
          {chartData.map((data, index) => {
            const xPos = (index / Math.max(chartData.length - 1, 1)) * 100;
            const yPos = 100 - (data.amount / maxAmount) * 100;
            const color = statusColors[data.status] ?? statusColors.Pending;
            return (
              <div
                key={index}
                className="absolute w-3 h-3 cursor-pointer group"
                style={{ left: `${xPos}%`, top: `${yPos}%`, transform: "translate(-50%,-50%)" }}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {hoveredIndex === index && (
                  <div className="absolute -top-14 left-1/2 -translate-x-1/2 bg-[#385E31] text-[#FFFCEB] text-[10px] px-2.5 py-1.5 rounded-[6px] shadow-lg whitespace-nowrap z-30 flex flex-col gap-0.5 border border-[#F7B71D]">
                    <div className="font-bold text-[11px] text-[#F7B71D]">{data.month}</div>
                    <div className="font-medium capitalize">{data.status}</div>
                    <div className="font-medium">Cumulative: {data.display}</div>
                  </div>
                )}
                <div
                  className="w-full h-full rotate-45 border border-white shadow-sm transition-transform duration-200 group-hover:scale-125"
                  style={{ backgroundColor: color }}
                />
                <div className="absolute top-6 left-1/2 -translate-x-1/2 text-[9px] font-bold text-[#385E31] whitespace-nowrap">
                  {data.month.split(" ")[0]}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="flex justify-end gap-4 mt-7 text-[11px] font-bold text-[#385E31]">
        {(["Paid", "Overdue", "Missed"] as const).map((key) => (
          <div key={key} className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-[2px]" style={{ backgroundColor: statusColors[key] }} />
            <span className="capitalize">{key}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Status Pill ───────────────────────────────────────────────────────────────

function StatusPill({ status }: { status: string }) {
  const map: Record<string, { bg: string; text: string }> = {
    Paid:    { bg: "bg-[#385E31]", text: "text-[#FFFCEB]" },
    Late:    { bg: "bg-[#FFD980]", text: "text-[#385E31]" },
    Missed:  { bg: "bg-[#E91F22]", text: "text-[#FFFCEB]" },
    Overdue: { bg: "bg-[#FFD980]", text: "text-[#385E31]" },
    Pending: { bg: "bg-[#D4D4D4]", text: "text-[#555]"   },
  };
  const { bg, text } = map[status] ?? map.Pending;
  return (
    <div className={`w-[72px] py-0.5 rounded-[40px] flex justify-center items-center ${bg}`}>
      <span className={`${text} text-[9px] font-bold`}>{status}</span>
    </div>
  );
}

// ── Submission Badge ──────────────────────────────────────────────────────────

function SubmissionBadge({
  submissionStatus,
  proofUrl,
}: {
  submissionStatus: string | null;
  proofUrl: string | null;
}) {
  if (!submissionStatus)
    return <span className="text-[#385E31]/40 italic text-[11px]">—</span>;

  const colorMap: Record<string, string> = {
    Pending:  "text-[#E5AD24]",
    Accepted: "text-[#385E31]",
    Approved: "text-[#385E31]",
    Rejected: "text-[#E91F22]",
  };

  return (
    <div className="flex items-center gap-1.5">
      <span className={`text-[11px] font-bold ${colorMap[submissionStatus] ?? ""}`}>
        {submissionStatus}
      </span>
      {proofUrl && (
        <a
          href={proofUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#E5AD24] hover:text-[#D19D1F] transition-colors"
          title="View proof"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="12" height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
        </a>
      )}
    </div>
  );
}

// ── Payment Log Table ─────────────────────────────────────────────────────────

const PAGE_SIZE = 5;

function PaymentLogTable({ records }: { records: SubscriptionRow[] }) {
  const [page, setPage] = useState(0);
  const visible = records.slice(0, (page + 1) * PAGE_SIZE);
  const hasMore = visible.length < records.length;

  return (
    <div className="w-full flex flex-col mt-2 mb-2">
      <h2 className="text-[16px] font-extrabold text-[#385E31] mb-3 text-center">
        Payment Log
      </h2>
      <div className="w-full bg-[#FFFCEB] rounded-[8px] border border-[#385E31] flex flex-col overflow-hidden shadow-sm">
        <div className="w-full grid grid-cols-[1fr_1fr_1fr_1fr_1fr] bg-[#385E31] px-4 py-2.5">
          {["Billing Period", "Amount", "Paid", "Status", "Submission"].map((h) => (
            <div
              key={h}
              className="text-[#FFFCEB] text-[12px] font-bold text-center first:text-left"
            >
              {h}
            </div>
          ))}
        </div>

        {visible.length === 0 && (
          <div className="px-4 py-6 text-center text-[#385E31]/50 text-[13px] italic">
            No payment records found.
          </div>
        )}

        {visible.map((row, idx) => {
          let displayStatus = row.payment_status;
          if (
            displayStatus === "Paid" &&
            row.days_late !== null &&
            row.days_late > 0
          ) {
            displayStatus = "Late";
          }

          return (
            <div
              key={row.subscription_id}
              className={`w-full grid grid-cols-[1fr_1fr_1fr_1fr_1fr] px-4 py-2.5 items-center ${
                idx < visible.length - 1 ? "border-b border-[#385E31]/20" : ""
              }`}
            >
              <div className="text-left text-[#3A6131] text-[11px] font-bold">
                {formatMonth(row.billing_period)}
              </div>
              <div className="text-center text-[#3A6131] text-[11px] font-bold">
                {formatCurrency(row.amount)}
              </div>
              <div className="text-center text-[#3A6131] text-[11px] font-bold">
                {row.amount_paid > 0 ? formatCurrency(row.amount_paid) : "—"}
              </div>
              <div className="flex justify-center">
                <StatusPill status={displayStatus} />
              </div>
              <div className="flex justify-center">
                <SubmissionBadge
                  submissionStatus={row.latest_submission_status}
                  proofUrl={row.latest_proof_url}
                />
              </div>
            </div>
          );
        })}
      </div>

      {hasMore && (
        <div className="w-full flex justify-end mt-3">
          <button
            onClick={() => setPage((p) => p + 1)}
            className="bg-[#F7B71D] text-[#385E31] text-[12px] font-bold px-7 py-1.5 rounded-[40px] shadow-sm hover:opacity-90 transition-opacity"
          >
            Load More
          </button>
        </div>
      )}
    </div>
  );
}

// ── Spinner ───────────────────────────────────────────────────────────────────

function Spinner() {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <svg
        className="animate-spin"
        xmlns="http://www.w3.org/2000/svg"
        width="28" height="28"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#385E31"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
      </svg>
      <p className="text-[#385E31] text-sm font-semibold animate-pulse">
        Loading payment history…
      </p>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function PaymentHistoryTab({ tenantId }: PaymentHistoryTabProps) {
  const [stats,   setStats]   = useState<PaymentHistoryStats | null>(null);
  const [records, setRecords] = useState<SubscriptionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  const fetchData = useCallback(async () => {
    // ── Hard guard: never fire with an empty/undefined tenantId ──────────────
    const id = tenantId?.trim();
    if (!id) {
      setError("No tenant selected.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res    = await fetch(
        `/api/superadmin/tenant/${encodeURIComponent(id)}/payment-history`
      );
      const result = await res.json();

      if (!res.ok || !result.success) {
        throw new Error(result.error ?? "Failed to load payment history.");
      }

      setStats(result.stats);
      setRecords(result.records ?? []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unknown error.");
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── Derived stat card display values ──────────────────────────────────────

  const totalPaidDisplay = stats
    ? stats.total_paid_amount >= 1_000_000
      ? `${(stats.total_paid_amount / 1_000_000).toFixed(1)}M`
      : stats.total_paid_amount >= 1_000
      ? `${(stats.total_paid_amount / 1_000).toFixed(1)}k`
      : stats.total_paid_amount.toString()
    : "—";

  const paidSubtext    = stats ? `${stats.paid_count} of ${stats.total_records} months` : "—";
  const lateSubtext    = stats
    ? stats.avg_days_late > 0
      ? `Avg. ${stats.avg_days_late} days late`
      : "No late payments"
    : "—";
  const missedSubtext  = stats
    ? stats.missed_count > 0
      ? `As of ${new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}`
      : "None recorded"
    : "—";

  // ── Render ─────────────────────────────────────────────────────────────────

  if (loading) return <Spinner />;

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm font-medium mt-4 flex items-center gap-3">
        <span>{error}</span>
        <button onClick={fetchData} className="underline font-bold shrink-0">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 py-2">
      {/* Stat Cards */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard
          title="Total Paid"
          value={totalPaidDisplay}
          trendText={paidSubtext}
          svgName="SA-rev-stat"
        />
        <StatCard
          title="Late Payments"
          value={stats?.late_count ?? "—"}
          trendText={lateSubtext}
          svgName="SA-late-payments"
        />
        <StatCard
          title="Missed Payments"
          value={stats?.missed_count ?? "—"}
          trendText={missedSubtext}
          svgName="SA-missed-payments"
        />
      </div>

      {/* Revenue Chart */}
      {records.length > 0 && <TotalRevenueChart records={records} />}

      {/* Payment Log */}
      <PaymentLogTable records={records} />
    </div>
  );
}