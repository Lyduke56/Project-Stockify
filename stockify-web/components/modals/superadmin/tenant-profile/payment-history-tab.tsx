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

// ── Simplified Stats Section ──────────────────────────────────────────────────

interface StatsOverviewProps {
  totalPaidDisplay: string;
  paidSubtext: string;
  lateCount: number | string;
  lateSubtext: string;
  missedCount: number | string;
  missedSubtext: string;
}

function StatsOverview({
  totalPaidDisplay,
  paidSubtext,
  lateCount,
  lateSubtext,
  missedCount,
  missedSubtext,
}: StatsOverviewProps) {
  return (
    <div className="flex items-center justify-between bg-white/60 backdrop-blur-sm border border-[#385E31]/10 rounded-[20px] p-6 shadow-sm">
      {/* Total Paid */}
      <div className="flex flex-col gap-1 w-1/3 text-center border-r border-[#385E31]/10">
        <span className="text-[#385E31]/60 text-[10px] font-extrabold uppercase tracking-widest">
          Total Paid
        </span>
        <span className="text-[#385E31] text-4xl font-black my-1">
          {totalPaidDisplay}
        </span>
        <span className="text-[#385E31]/60 text-[11px] font-medium">
          {paidSubtext}
        </span>
      </div>

      {/* Late Payments */}
      <div className="flex flex-col gap-1 w-1/3 text-center border-r border-[#385E31]/10">
        <span className="text-[#E5AD24] text-[10px] font-extrabold uppercase tracking-widest">
          Late Payments
        </span>
        <span className="text-[#E5AD24] text-4xl font-black my-1">
          {lateCount}
        </span>
        <span className="text-[#E5AD24]/70 text-[11px] font-medium">
          {lateSubtext}
        </span>
      </div>

      {/* Missed Payments */}
      <div className="flex flex-col gap-1 w-1/3 text-center">
        <span className="text-[#E91F22] text-[10px] font-extrabold uppercase tracking-widest">
          Missed Payments
        </span>
        <span className="text-[#E91F22] text-4xl font-black my-1">
          {missedCount}
        </span>
        <span className="text-[#E91F22]/70 text-[11px] font-medium">
          {missedSubtext}
        </span>
      </div>
    </div>
  );
}

// ── Revenue Bar Chart ─────────────────────────────────────────────────────────

function RevenueBarChart({ records }: { records: SubscriptionRow[] }) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const statusColors: Record<string, string> = {
    Paid: "bg-[#385E31]",
    Late: "bg-[#E5AD24]",
    Overdue: "bg-[#E5AD24]",
    Missed: "bg-[#E91F22]",
    Pending: "bg-[#D4D4D4]",
  };

  const sorted = [...records]
    .sort((a, b) => a.billing_period.localeCompare(b.billing_period))
    .slice(-12);

  if (sorted.length === 0) return null;

  const chartData = sorted.map((r) => ({
    month: formatMonth(r.billing_period),
    amount: r.amount_paid,
    display: formatCurrency(r.amount_paid),
    status: r.payment_status,
  }));

  // Find max amount for bar scaling, default to 1000 if 0 to avoid division by zero
  const maxAmount = Math.max(...chartData.map((d) => d.amount), 1000);

  return (
    <div className="w-full flex flex-col mt-4">
      <h2 className="text-[15px] font-extrabold text-[#385E31] mb-3 pl-2">
        Monthly Revenue
      </h2>
      
      <div className="relative w-full h-[220px] bg-white/40 border border-[#385E31]/10 rounded-[16px] p-6 pt-10 shadow-sm flex items-end justify-between gap-2">
        {/* Y-axis grid lines */}
        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none py-6 z-0">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="w-full border-b border-[#385E31]/5" />
          ))}
        </div>

        {/* Bars */}
        {chartData.map((data, index) => {
          const heightPercent = (data.amount / maxAmount) * 100;
          const colorClass = statusColors[data.status] ?? statusColors.Pending;
          
          return (
            <div
              key={index}
              className="relative flex-1 flex flex-col items-center justify-end h-full group z-10"
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              {hoveredIndex === index && (
                <div className="absolute -top-16 bg-[#385E31] text-[#FFFCEB] text-[10px] px-3 py-2 rounded-[8px] shadow-lg whitespace-nowrap z-30 flex flex-col gap-0.5 items-center">
                  <span className="font-bold text-[#F7B71D]">{data.month}</span>
                  <span className="font-black text-[12px]">{data.display}</span>
                  <span className="font-medium text-[9px] uppercase tracking-widest opacity-80 mt-0.5">
                    {data.status}
                  </span>
                  {/* Tooltip Triangle pointer */}
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-[#385E31]" />
                </div>
              )}
              {/* Bar filling */}
              <div
                className={`w-full max-w-[36px] rounded-t-[6px] transition-all duration-300 cursor-pointer ${colorClass} group-hover:opacity-80`}
                style={{ height: `${Math.max(heightPercent, 2)}%` }}
              />
              {/* X-axis Label */}
              <span className="absolute -bottom-6 text-[10px] font-bold text-[#385E31]/60 whitespace-nowrap">
                {data.month.split(" ")[0]}
              </span>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex justify-end gap-5 mt-9 text-[11px] font-bold text-[#385E31]/70 pr-2">
        {(["Paid", "Overdue", "Missed"] as const).map((key) => {
          const hexMap: Record<string, string> = {
            Paid: "#385E31",
            Overdue: "#E5AD24",
            Missed: "#E91F22",
          };
          return (
            <div key={key} className="flex items-center gap-2">
              <div
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: hexMap[key] }}
              />
              <span className="uppercase tracking-wider text-[9px]">{key}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Status Pill ───────────────────────────────────────────────────────────────

function StatusPill({ status }: { status: string }) {
  const map: Record<string, { bg: string; text: string }> = {
    Paid: { bg: "bg-[#385E31]/10", text: "text-[#385E31]" },
    Late: { bg: "bg-[#E5AD24]/10", text: "text-[#E5AD24]" },
    Missed: { bg: "bg-[#E91F22]/10", text: "text-[#E91F22]" },
    Overdue: { bg: "bg-[#E5AD24]/10", text: "text-[#E5AD24]" },
    Pending: { bg: "bg-gray-100", text: "text-gray-500" },
  };
  const { bg, text } = map[status] ?? map.Pending;
  
  return (
    <div className={`px-3 py-1 rounded-[40px] flex justify-center items-center w-max mx-auto ${bg}`}>
      <span className={`${text} text-[10px] font-extrabold uppercase tracking-widest`}>
        {status}
      </span>
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
    return <span className="text-[#385E31]/30 font-medium text-[11px]">—</span>;

  const colorMap: Record<string, string> = {
    Pending: "text-[#E5AD24]",
    Accepted: "text-[#385E31]",
    Approved: "text-[#385E31]",
    Rejected: "text-[#E91F22]",
  };

  return (
    <div className="flex items-center justify-center gap-1.5">
      <span className={`text-[11px] font-bold ${colorMap[submissionStatus] ?? ""}`}>
        {submissionStatus}
      </span>
      {proofUrl && (
        <a
          href={proofUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#E5AD24] hover:text-[#D19D1F] hover:scale-110 transition-all"
          title="View proof"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
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
    <div className="w-full flex flex-col mt-4 mb-2">
      <h2 className="text-[15px] font-extrabold text-[#385E31] mb-3 pl-2">
        Payment Records
      </h2>
      
      <div className="w-full bg-white/60 backdrop-blur-sm rounded-[16px] border border-[#385E31]/10 flex flex-col overflow-hidden shadow-sm">
        {/* Table Header */}
        <div className="w-full grid grid-cols-[1.5fr_1fr_1fr_1fr_1fr] bg-[#385E31]/5 px-6 py-4 border-b border-[#385E31]/10">
          {["Billing Period", "Amount", "Paid", "Status", "Submission"].map((h) => (
            <div
              key={h}
              className="text-[#385E31]/70 text-[10px] font-extrabold uppercase tracking-widest text-center first:text-left"
            >
              {h}
            </div>
          ))}
        </div>

        {/* Empty State */}
        {visible.length === 0 && (
          <div className="px-6 py-10 text-center text-[#385E31]/50 text-[13px] font-medium">
            No payment records found.
          </div>
        )}

        {/* Table Rows */}
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
              className={`w-full grid grid-cols-[1.5fr_1fr_1fr_1fr_1fr] px-6 py-4 items-center transition-colors hover:bg-[#385E31]/[0.03] ${
                idx < visible.length - 1 ? "border-b border-[#385E31]/10" : ""
              }`}
            >
              <div className="text-left text-[#3A6131] text-[12px] font-bold">
                {formatMonth(row.billing_period)}
              </div>
              <div className="text-center text-[#3A6131] text-[12px] font-bold">
                {formatCurrency(row.amount)}
              </div>
              <div className="text-center text-[#3A6131] text-[12px] font-bold">
                {row.amount_paid > 0 ? formatCurrency(row.amount_paid) : <span className="text-[#3A6131]/30">—</span>}
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
        <div className="w-full flex justify-end mt-4">
          <button
            onClick={() => setPage((p) => p + 1)}
            className="bg-[#F7B71D] text-[#385E31] text-[12px] font-bold px-7 py-2 rounded-[40px] shadow-sm hover:scale-105 transition-all"
          >
            Load More Records
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
    const id = tenantId?.trim();
    if (!id) {
      setError("No tenant selected.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch(
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

  const paidSubtext = stats ? `${stats.paid_count} of ${stats.total_records} months` : "—";
  
  const lateSubtext = stats
    ? stats.avg_days_late > 0
      ? `Avg. ${stats.avg_days_late} days late`
      : "No late payments"
    : "—";
    
  const missedSubtext = stats
    ? stats.missed_count > 0
      ? `As of ${new Date().toLocaleDateString("en-US", { month: "short", year: "numeric" })}`
      : "None recorded"
    : "—";

  // ── Render ─────────────────────────────────────────────────────────────────

  if (loading) return <Spinner />;

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-5 py-4 rounded-xl text-sm font-medium mt-4 flex items-center justify-between shadow-sm">
        <span>{error}</span>
        <button onClick={fetchData} className="underline font-bold shrink-0 hover:text-red-800">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 py-2">
      {/* Beautified Stats Section */}
      <StatsOverview
        totalPaidDisplay={totalPaidDisplay}
        paidSubtext={paidSubtext}
        lateCount={stats?.late_count ?? "0"}
        lateSubtext={lateSubtext}
        missedCount={stats?.missed_count ?? "0"}
        missedSubtext={missedSubtext}
      />

      {/* Bar Chart */}
      {records.length > 0 && <RevenueBarChart records={records} />}

      {/* Cleaned-up Data Table */}
      <PaymentLogTable records={records} />
    </div>
  );
}