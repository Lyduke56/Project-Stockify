"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import StatCard from "@/components/cards/stat-cards";

// ─── Types ────────────────────────────────────────────────────────────────────

type TransactionStatus = "Confirmed" | "Pending" | "Failed" | "Cancelled";
type PaymentMethod = "QR Code" | "Cash-on-Delivery";

interface Transaction {
  orderId: string;
  date: string;
  customerName: string;
  paymentMethod: PaymentMethod;
  amount: number;
  status: TransactionStatus;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_TRANSACTIONS: Transaction[] = [
  { orderId: "1101121", date: "03/01/2026 09:15", customerName: "Alice Guo",       paymentMethod: "QR Code",          amount: 1250.00, status: "Confirmed" },
  { orderId: "1101122", date: "03/01/2026 10:30", customerName: "John Doe",        paymentMethod: "Cash-on-Delivery", amount: 850.50,  status: "Confirmed" },
  { orderId: "1101123", date: "03/02/2026 11:45", customerName: "Maria Clara",     paymentMethod: "QR Code",          amount: 3400.00, status: "Failed" },
  { orderId: "1101124", date: "03/02/2026 13:20", customerName: "Juan Dela Cruz",  paymentMethod: "QR Code",          amount: 620.75,  status: "Confirmed" },
  { orderId: "1101125", date: "03/03/2026 14:10", customerName: "Elena Cruz",      paymentMethod: "Cash-on-Delivery", amount: 980.00,  status: "Pending" },
  { orderId: "1101126", date: "03/04/2026 08:50", customerName: "Mark Bautista",   paymentMethod: "QR Code",          amount: 2100.00, status: "Confirmed" },
  { orderId: "1101127", date: "03/05/2026 09:30", customerName: "Sarah Geronimo",  paymentMethod: "Cash-on-Delivery", amount: 450.25,  status: "Cancelled" },
  { orderId: "1101128", date: "03/06/2026 10:15", customerName: "Gary Valenciano", paymentMethod: "QR Code",          amount: 1870.00, status: "Confirmed" },
  { orderId: "1101129", date: "03/07/2026 11:05", customerName: "Lea Salonga",     paymentMethod: "Cash-on-Delivery", amount: 390.00,  status: "Confirmed" },
  { orderId: "1101130", date: "03/08/2026 12:40", customerName: "Regine Velasquez",paymentMethod: "QR Code",          amount: 5600.00, status: "Pending" },
  { orderId: "1101131", date: "03/09/2026 15:20", customerName: "Martin Nievera",  paymentMethod: "QR Code",          amount: 720.00,  status: "Confirmed" },
  { orderId: "1101132", date: "03/10/2026 16:55", customerName: "Zsa Zsa Padilla", paymentMethod: "Cash-on-Delivery", amount: 3200.50, status: "Failed" },
];

const DATE_RANGES = ["All Time", "Today", "Last 7 Days", "Last 30 Days", "Last 90 Days"];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function filterByDateRange(transactions: Transaction[], range: string): Transaction[] {
  if (range === "All Time") return transactions;
  const now = new Date("2026-03-10T23:59:59"); 
  const cutoffs: Record<string, number> = {
    "Today": 0, "Last 7 Days": 7, "Last 30 Days": 30, "Last 90 Days": 90,
  };
  const days = cutoffs[range] ?? 30;
  
  return transactions.filter((t) => {
    const tDate = new Date(t.date); 
    const diff = (now.getTime() - tDate.getTime()) / (1000 * 60 * 60 * 24);
    return diff <= days;
  });
}

// ─── Badges & Icons ───────────────────────────────────────────────────────────

const STATUS_STYLES: Record<TransactionStatus, { bg: string; text: string }> = {
  Confirmed: { bg: "#DCFCE7", text: "#166534" },
  Failed:    { bg: "#FEE2E2", text: "#991B1B" },
  Pending:   { bg: "#FEF3C7", text: "#92400E" },
  Cancelled: { bg: "#F3F4F6", text: "#4B5563" }, 
};

const SearchIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const ChevronDown = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

// ─── Review Modal ─────────────────────────────────────────────────────────────

function ReviewModal({ tx, onClose }: { tx: Transaction; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 bg-[#385E31]/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="bg-[#FFFCEB] rounded-[20px] p-8 max-w-sm w-full shadow-2xl border border-[#385E31]/20"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-[#385E31] text-[22px] font-extrabold mb-6 tracking-wide uppercase">
          Transaction Details
        </h3>
        <div className="flex flex-col gap-4 text-[13px]">
          {(
            [
              ["Order ID", tx.orderId],
              ["Date & Time", tx.date],
              ["Customer", tx.customerName],
              ["Payment Method", tx.paymentMethod],
              ["Amount", `₱${tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`],
              ["Status", tx.status],
            ] as [string, string][]
          ).map(([label, value]) => (
            <div key={label} className="flex justify-between border-b border-[#385E31]/10 pb-2.5 items-center">
              <span className="text-[#385E31]/60 font-bold w-1/2">{label}</span>
              <span className="text-[#385E31] font-bold text-right w-1/2">
                {label === "Status" ? (
                  <span
                    className="font-mono text-[11px] px-2.5 py-1 rounded-md font-semibold whitespace-nowrap inline-block"
                    style={{ backgroundColor: STATUS_STYLES[value as TransactionStatus].bg, color: STATUS_STYLES[value as TransactionStatus].text }}
                  >
                    {value}
                  </span>
                ) : (
                  value
                )}
              </span>
            </div>
          ))}
        </div>
        <button
          onClick={onClose}
          className="mt-8 w-full bg-[#F7B71D] text-[#385E31] font-extrabold py-3 rounded-full shadow-sm hover:opacity-90 transition-opacity"
        >
          Close
        </button>
      </motion.div>
    </div>
  );
}

const EmptyState = () => (
  <div className="w-full flex flex-col items-center justify-center py-20 gap-3">
    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#385E31" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" className="opacity-30">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
    <p className="text-[#385E31]/40 text-[13px] font-semibold">No transactions found</p>
    <p className="text-[#385E31]/30 text-[12px]">Try adjusting your search or filters</p>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Transactions() {
  const [search, setSearch] = useState("");
  const [dateRange, setDateRange] = useState("All Time");
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  const dateFiltered = useMemo(() => filterByDateRange(MOCK_TRANSACTIONS, dateRange), [dateRange]);

  const filtered = useMemo(() => {
    if (!search.trim()) return dateFiltered;
    const q = search.toLowerCase();
    return dateFiltered.filter(
      (t) => t.orderId.toLowerCase().includes(q) || t.customerName.toLowerCase().includes(q)
    );
  }, [search, dateFiltered]);

  // ── Derived stats ──
  const totalTransactions = filtered.length;
  const successCount      = filtered.filter((t) => t.status === "Confirmed").length;
  const failedCount       = filtered.filter((t) => t.status === "Failed").length;
  const cancelledCount    = filtered.filter((t) => t.status === "Cancelled").length; 

  return (
    <div className="w-full font-['Inter'] flex flex-col items-center gap-6">

      {/* ── Filters + Content Container ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 25, delay: 0.2 }}
        className="w-full flex flex-col items-center gap-6"
      >
        {/* ── Search + Date Range Row ── */}
        <div className="w-full flex items-center justify-between gap-4 flex-wrap">
          <div className="relative flex-1 min-w-[250px] max-w-md">
            <input
              type="text"
              placeholder="Search by Order ID or Customer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border border-[#385E31] rounded-full px-5 pl-11 py-2.5 bg-transparent text-[#385E31] placeholder-[#385E31]/40 outline-none font-semibold text-[13px]"
            />
            <div className="absolute left-4 top-[11px] text-[#385E31]/50 pointer-events-none">
              <SearchIcon />
            </div>
          </div>
          
          <div className="relative">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="appearance-none border border-[#385E31] rounded-full pl-5 pr-10 py-2.5 bg-transparent text-[#385E31] outline-none font-semibold text-[13px] cursor-pointer w-[180px]"
            >
              {DATE_RANGES.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
            <div className="absolute right-4 top-[12px] text-[#385E31] pointer-events-none">
              <ChevronDown />
            </div>
          </div>
        </div>

        {/* ── Stat Cards ── */}
        <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Transaction"
            value={totalTransactions}
            trendText={`↑ 5% this month (January)`}
            svgName="employee-icons/orders"
            className="w-full shadow-sm"
          />
          <StatCard
            title="Success Transaction"
            value={successCount}
            trendText={`↑ 5% this month (January)`}
            svgName="employee-icons/topseller"
            className="w-full shadow-sm"
          />
          <StatCard
            title="Failed Transaction"
            value={failedCount}
            trendText={`↑ 5% this month (January)`}
            svgName="employee-icons/orders"
            className="w-full shadow-sm"
          />
          <StatCard
            title="Cancelled Transactions"
            value={cancelledCount}
            trendText={`↑ 5% this month (January)`}
            svgName="employee-icons/orders"
            className="w-full shadow-sm"
          />
        </div>

        {/* ── Table Container ── */}
        <div className="w-full bg-[#FFFCEB] rounded-[10px] border border-[#385E31] shadow-sm mt-2 overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap table-fixed">
            {/* Header */}
            <thead>
              <tr className="bg-[#385E31] border-b border-[#385E31]">
                <th className="w-[18%] px-6 py-4 text-[#FFFCEB] text-[12px] font-bold tracking-wide rounded-tl-[8px]">Date & Time</th>
                <th className="w-[12%] px-4 py-4 text-[#FFFCEB] text-[12px] font-bold tracking-wide">Order ID</th>
                <th className="w-[20%] px-4 py-4 text-[#FFFCEB] text-[12px] font-bold tracking-wide">Customer</th>
                <th className="w-[15%] px-4 py-4 text-[#FFFCEB] text-[12px] font-bold tracking-wide">Method</th>
                <th className="w-[12%] px-4 py-4 text-[#FFFCEB] text-[12px] font-bold tracking-wide">Amount</th>
                <th className="w-[11%] px-4 py-4 text-[#FFFCEB] text-[12px] font-bold tracking-wide text-center">Status</th>
                <th className="w-[12%] px-6 py-4 text-[#FFFCEB] text-[12px] font-bold tracking-wide text-center rounded-tr-[8px]">Action</th>
              </tr>
            </thead>

            {/* Body */}
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <EmptyState />
                  </td>
                </tr>
              ) : (
                filtered.map((tx, idx) => {
                  const isLast = idx === filtered.length - 1;
                  const badge = STATUS_STYLES[tx.status];
                  return (
                    <motion.tr
                      key={`${tx.orderId}-${idx}`}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: Math.min(idx * 0.025, 0.3) }}
                      className={`hover:bg-[#385E31]/[0.04] transition-colors ${!isLast ? "border-b border-[#385E31]/15" : ""}`}
                    >
                      <td className="px-6 py-4 text-[#3A6131] text-[12px] font-medium truncate">{tx.date}</td>
                      <td className="px-4 py-4 text-[#3A6131] text-[12px] font-bold truncate">{tx.orderId}</td>
                      <td className="px-4 py-4 text-[#3A6131] text-[12px] font-medium truncate pr-2">{tx.customerName}</td>
                      <td className="px-4 py-4 text-[#3A6131] text-[12px] font-medium truncate pr-2">{tx.paymentMethod}</td>
                      <td className="px-4 py-4 text-[#3A6131] text-[12px] font-bold truncate">
                        ₱{tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span
                          className="font-mono text-[11px] px-2.5 py-1 rounded-md font-semibold inline-block"
                          style={{ backgroundColor: badge.bg, color: badge.text }}
                        >
                          {tx.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => setSelectedTx(tx)}
                          className="bg-[#F7B71D] hover:bg-[#e0a519] text-[#385E31] text-[11px] font-bold px-5 py-1.5 rounded-full transition-colors duration-150 inline-flex items-center gap-1.5 justify-center"
                        >
                          Review
                        </button>
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ── Record Count ── */}
        <div className="w-full flex justify-between items-center px-1">
          <p className="text-xs text-[#385E31]/50 font-semibold">
            Showing {filtered.length} of {MOCK_TRANSACTIONS.length} transactions
          </p>
        </div>
      </motion.div>

      {/* ── Modal Render ── */}
      <AnimatePresence>
        {selectedTx && <ReviewModal tx={selectedTx} onClose={() => setSelectedTx(null)} />}
      </AnimatePresence>
    </div>
  );
}