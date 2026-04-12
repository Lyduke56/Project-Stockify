"use client";

import StatCard from "@/components/cards/stat-cards";
import { useState, useMemo } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type TransactionStatus = "SUCCESS" | "FAILED" | "PENDING";

interface Transaction {
  transactionId: string;
  date: string;
  orderId: string;
  amount: number;
  status: TransactionStatus;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_TRANSACTIONS: Transaction[] = [
  { transactionId: "INV-2026-001", date: "March 01, 2026", orderId: "1101121", amount: 1250.00, status: "SUCCESS" },
  { transactionId: "INV-2026-002", date: "March 01, 2026", orderId: "1101122", amount: 850.50,  status: "SUCCESS" },
  { transactionId: "INV-2026-003", date: "March 02, 2026", orderId: "1101123", amount: 3400.00, status: "FAILED"  },
  { transactionId: "INV-2026-004", date: "March 02, 2026", orderId: "1101124", amount: 620.75,  status: "SUCCESS" },
  { transactionId: "INV-2026-005", date: "March 03, 2026", orderId: "1101125", amount: 980.00,  status: "PENDING" },
  { transactionId: "INV-2026-006", date: "March 04, 2026", orderId: "1101126", amount: 2100.00, status: "SUCCESS" },
  { transactionId: "INV-2026-007", date: "March 05, 2026", orderId: "1101127", amount: 450.25,  status: "FAILED"  },
  { transactionId: "INV-2026-008", date: "March 06, 2026", orderId: "1101128", amount: 1870.00, status: "SUCCESS" },
  { transactionId: "INV-2026-009", date: "March 07, 2026", orderId: "1101129", amount: 390.00,  status: "SUCCESS" },
  { transactionId: "INV-2026-010", date: "March 08, 2026", orderId: "1101130", amount: 5600.00, status: "PENDING" },
  { transactionId: "INV-2026-011", date: "March 09, 2026", orderId: "1101131", amount: 720.00,  status: "SUCCESS" },
  { transactionId: "INV-2026-012", date: "March 10, 2026", orderId: "1101132", amount: 3200.50, status: "FAILED"  },
];

const DATE_RANGES = ["All Time", "Today", "Last 7 Days", "Last 30 Days", "Last 90 Days"];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function filterByDateRange(transactions: Transaction[], range: string): Transaction[] {
  if (range === "All Time") return transactions;
  const now = new Date("2026-03-10");
  const cutoffs: Record<string, number> = {
    "Today": 0, "Last 7 Days": 7, "Last 30 Days": 30, "Last 90 Days": 90,
  };
  const days = cutoffs[range] ?? 30;
  return transactions.filter((t) => {
    const diff = (now.getTime() - new Date(t.date).getTime()) / (1000 * 60 * 60 * 24);
    return diff <= days;
  });
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<TransactionStatus, string> = {
  SUCCESS: "bg-[#4CAF50] text-white",
  FAILED:  "bg-[#E53935] text-white",
  PENDING: "bg-[#F7B71D] text-[#385E31]",
};

function StatusBadge({ status }: { status: TransactionStatus }) {
  return (
    <span className={`inline-block px-3 py-0.5 rounded-full text-xs font-bold ${STATUS_STYLES[status]}`}>
      {status}
    </span>
  );
}

// ─── Review Modal ─────────────────────────────────────────────────────────────

function ReviewModal({ tx, onClose }: { tx: Transaction; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-[#385E31] text-xl font-extrabold mb-5">Transaction Review</h3>
        <div className="flex flex-col gap-3 text-sm">
          {([
            ["Transaction ID", tx.transactionId],
            ["Date",           tx.date],
            ["Order ID",       tx.orderId],
            ["Amount",         `₱${tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`],
            ["Status",         tx.status],
          ] as [string, string][]).map(([label, value]) => (
            <div key={label} className="flex justify-between border-b border-gray-100 pb-2">
              <span className="text-gray-400 font-semibold">{label}</span>
              <span className="text-[#385E31] font-bold">
                {label === "Status" ? <StatusBadge status={value as TransactionStatus} /> : value}
              </span>
            </div>
          ))}
        </div>
        <button
          onClick={onClose}
          className="mt-6 w-full bg-[#385E31] text-white font-bold py-2.5 rounded-xl hover:bg-[#2e4e28] transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Transactions() {
  const [search,     setSearch]     = useState("");
  const [dateRange,  setDateRange]  = useState("All Time");
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  const dateFiltered = useMemo(() => filterByDateRange(MOCK_TRANSACTIONS, dateRange), [dateRange]);

  const filtered = useMemo(() => {
    if (!search.trim()) return dateFiltered;
    const q = search.toLowerCase();
    return dateFiltered.filter(
      (t) => t.transactionId.toLowerCase().includes(q) || t.orderId.toLowerCase().includes(q)
    );
  }, [search, dateFiltered]);

  // ── Derived stats — reactive to all active filters ──
  const totalTransactions = filtered.length;
  const successCount      = filtered.filter((t) => t.status === "SUCCESS").length;
  const failedCount       = filtered.filter((t) => t.status === "FAILED").length;
  const totalRevenue      = filtered
    .filter((t) => t.status === "SUCCESS")
    .reduce((s, t) => s + t.amount, 0);

  return (
    <div className="w-full flex flex-col gap-6">

      {/* ── Search + Date Range ── */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <input
            type="text"
            placeholder="Search by Transaction ID"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border border-[#385E31] rounded-lg pl-9 pr-10 py-2 text-sm text-[#385E31] placeholder-[#a8c8a0] bg-white focus:outline-none focus:ring-2 focus:ring-[#F7B71D] transition"
          />
          <img
            src="/search.svg"
            alt="search"
            className="absolute left-3 top-1/2 -translate-y-1/2 w-[18px] h-[18px] opacity-60 pointer-events-none"
            />
        </div>
        <select
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
          className="ml-auto border border-[#385E31] rounded-lg px-4 py-2 text-sm text-[#385E31] bg-white font-medium focus:outline-none focus:ring-2 focus:ring-[#F7B71D] cursor-pointer"
        >
          {DATE_RANGES.map((d) => <option key={d}>{d}</option>)}
        </select>
      </div>

      {/* ── Stat Cards ── */}
      <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Transaction"
          value={totalTransactions}
          trendText={`↑ 5% this month (January)`}
          svgName="employee-icons/orders"
          className="w-full"
        />
        <StatCard
          title="Success Transaction"
          value={successCount}
          trendText={`↑ 5% this month (January)`}
          svgName="employee-icons/topseller"
          className="w-full"
        />
        <StatCard
          title="Failed Transaction"
          value={failedCount}
          trendText={`↑ 5% this month (January)`}
          svgName="employee-icons/orders"
          className="w-full"
        />
        <StatCard
          title="Total Revenue"
          value={`₱${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
          trendText={`↑ 5% this month (January)`}
          svgName="employee-icons/piggybank"
          className="w-full"
        />
      </div>

      {/* ── Table ── */}
      <div className="w-full overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              {["Transaction ID", "Date", "Order ID", "Amount", "Status", "Actions"].map((col) => (
                <th
                  key={col}
                  className="bg-[#385E31] text-white font-bold px-5 py-3 text-center first:rounded-tl-xl last:rounded-tr-xl whitespace-nowrap"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-12 text-[#a8c8a0] font-semibold bg-white">
                  No transactions found.
                </td>
              </tr>
            ) : (
              filtered.map((tx, idx) => (
                <tr
                  key={`${tx.transactionId}-${idx}`}
                  className={`border-b border-[#e9e9d8] transition-colors duration-100 ${
                    idx % 2 === 0 ? "bg-[#FFFCEB]" : "bg-[#FFFCEB]"
                  }  hover:bg-[#F7B71D]/10`}
                >
                  <td className="px-5 py-3 text-center font-semibold text-[#385E31] whitespace-nowrap">{tx.transactionId}</td>
                  <td className="px-5 py-3 text-center text-[#385E31] whitespace-nowrap">{tx.date}</td>
                  <td className="px-5 py-3 text-center text-[#385E31]">{tx.orderId}</td>
                  <td className="px-5 py-3 text-center text-[#385E31] font-semibold">
                    ₱{tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-5 py-3 text-center">
                    <StatusBadge status={tx.status} />
                  </td>
                  <td className="px-5 py-3 text-center">
                    <button
                      onClick={() => setSelectedTx(tx)}
                      className="bg-[#385E31] hover:bg-[#2e4e28] text-white text-xs font-bold px-4 py-1.5 rounded-lg transition-colors duration-150"
                    >
                      Review
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── Record Count ── */}
      <p className="text-xs text-[#a8c8a0] font-medium">
        Showing {filtered.length} of {MOCK_TRANSACTIONS.length} transactions
      </p>

      {/* ── Review Modal ── */}
      {selectedTx && <ReviewModal tx={selectedTx} onClose={() => setSelectedTx(null)} />}
    </div>
  );
}
