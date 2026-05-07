"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ─── Types ────────────────────────────────────────────────────────────────────

type ActionType = "Update" | "Create" | "Delete" | "View";

interface AuditLog {
  id: string;
  performedBy: string;
  action: ActionType;
  remarks: string;
  target: string;
  timestamp: string;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_LOGS: AuditLog[] = [
  { id: "#1001", performedBy: "Benideck Longakit", action: "Update", remarks: "Changed price from ₱120 to ₱150", target: "Mocha Latte", timestamp: "03/19/2026 13:05" },
  { id: "#1002", performedBy: "Axziel Bartolabac", action: "Create", remarks: "Added new product", target: "Espresso Beans", timestamp: "03/19/2026 14:10" },
  { id: "#1003", performedBy: "Elle Bernante",     action: "Delete", remarks: "Removed discontinued item", target: "Matcha Powder", timestamp: "03/20/2026 09:14" },
  { id: "#1004", performedBy: "Christopher Rubio", action: "Update", remarks: "Restocked +50 units", target: "Paper Cups", timestamp: "03/20/2026 10:30" },
  { id: "#1005", performedBy: "Benideck Longakit", action: "Create", remarks: "Created new category", target: "Pastries", timestamp: "03/21/2026 08:00" },
  { id: "#1006", performedBy: "Axziel Bartolabac", action: "Update", remarks: "Changed reorder threshold to 20", target: "Almond Milk", timestamp: "03/21/2026 11:45" },
  { id: "#1007", performedBy: "Elle Bernante",     action: "Delete", remarks: "Deleted duplicate category", target: "Snacks", timestamp: "03/22/2026 15:00" },
  { id: "#1008", performedBy: "Christopher Rubio", action: "Update", remarks: "Changed storefront visibility to Hidden", target: "Seasonal Syrup", timestamp: "03/23/2026 09:05" },
];

const FILTER_OPTIONS = ["All", "Update", "Create", "Delete", "View"] as const;

// ─── Badges & Icons ───────────────────────────────────────────────────────────

const ACTION_STYLES: Record<ActionType, { bg: string; text: string }> = {
  Update: { bg: "#F7B71D", text: "#385E31" },
  Create: { bg: "#DCFCE7", text: "#166534" },
  Delete: { bg: "#FEE2E2", text: "#991B1B" },
  View:   { bg: "#DBEAFE", text: "#1E40AF" },
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

const CalendarIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const XIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

// ─── Modals ───────────────────────────────────────────────────────────────────

function LogDetailModal({ log, onClose }: { log: AuditLog; onClose: () => void }) {
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
          Log Details
        </h3>
        <div className="flex flex-col gap-4 text-[13px]">
          {(
            [
              ["Transaction ID", log.id],
              ["Performed By", log.performedBy],
              ["Action", log.action],
              ["Details", log.remarks],
              ["Target", log.target],
              ["Timestamp", log.timestamp],
            ] as [string, string][]
          ).map(([label, value]) => (
            <div key={label} className="flex justify-between border-b border-[#385E31]/10 pb-2.5">
              <span className="text-[#385E31]/60 font-bold w-1/3">{label}</span>
              <span className="text-[#385E31] font-bold text-right w-2/3">
                {label === "Action" ? (
                  <span
                    className="font-mono text-[11px] px-2.5 py-1 rounded-md font-semibold whitespace-nowrap"
                    style={{ backgroundColor: ACTION_STYLES[value as ActionType].bg, color: ACTION_STYLES[value as ActionType].text }}
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
    <p className="text-[#385E31]/40 text-[13px] font-semibold">No audit logs found</p>
    <p className="text-[#385E31]/30 text-[12px]">Try adjusting your search or filters</p>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AuditLogs() {
  const [search, setSearch] = useState("");
  const [filterAction, setFilterAction] = useState<string>("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const filtered = useMemo(() => {
    return MOCK_LOGS.filter((log) => {
      const q = search.toLowerCase();
      const matchesSearch = !q || log.id.toLowerCase().includes(q) || log.performedBy.toLowerCase().includes(q) || log.target.toLowerCase().includes(q) || log.remarks.toLowerCase().includes(q);
      const matchesAction = !filterAction || filterAction === "All" || log.action === filterAction;
      
      let matchesDate = true;
      if (dateFrom || dateTo) {
        const logDate = new Date(log.timestamp);
        if (dateFrom) {
          const from = new Date(dateFrom);
          if (logDate < from) matchesDate = false;
        }
        if (dateTo) {
          const to = new Date(dateTo);
          to.setHours(23, 59, 59, 999);
          if (logDate > to) matchesDate = false;
        }
      }

      return matchesSearch && matchesAction && matchesDate;
    });
  }, [search, filterAction, dateFrom, dateTo]);

  const hasActiveFilters = search || filterAction || dateFrom || dateTo;

  const clearFilters = () => {
    setSearch("");
    setFilterAction("");
    setDateFrom("");
    setDateTo("");
  };

  return (
    <div className="w-full font-['Inter'] flex flex-col items-center">

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 25, delay: 0.2 }}
        className="w-full flex flex-col items-center"
      >
        {/* ── Filter Row ── */}
        <div className="w-full flex flex-wrap items-center gap-3 mb-4">
          {/* Date From */}
          <div className="relative flex items-center">
            <div className="absolute left-4 text-[#385E31] pointer-events-none">
              <CalendarIcon />
            </div>
            <input
              type="date"
              value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
              max={dateTo || undefined}
              className="appearance-none border border-[#385E31] rounded-full pl-9 pr-4 py-2.5 bg-transparent text-[#385E31] outline-none font-semibold text-[12px] cursor-pointer w-[165px]"
              style={{ colorScheme: "light" }}
            />
            {dateFrom && (
              <button onClick={() => setDateFrom("")} className="absolute right-3 text-[#385E31]/50 hover:text-[#385E31] transition-colors">
                <XIcon />
              </button>
            )}
          </div>

          {/* Date To */}
          <div className="relative flex items-center">
            <div className="absolute left-4 text-[#385E31] pointer-events-none">
              <CalendarIcon />
            </div>
            <input
              type="date"
              value={dateTo}
              onChange={e => setDateTo(e.target.value)}
              min={dateFrom || undefined}
              className="appearance-none border border-[#385E31] rounded-full pl-9 pr-4 py-2.5 bg-transparent text-[#385E31] outline-none font-semibold text-[12px] cursor-pointer w-[165px]"
              style={{ colorScheme: "light" }}
            />
            {dateTo && (
              <button onClick={() => setDateTo("")} className="absolute right-3 text-[#385E31]/50 hover:text-[#385E31] transition-colors">
                <XIcon />
              </button>
            )}
          </div>

          {/* Action Type Dropdown */}
          <div className="relative">
            <select
              value={filterAction}
              onChange={e => setFilterAction(e.target.value)}
              className="appearance-none border border-[#385E31] rounded-full pl-5 pr-9 py-2.5 bg-transparent text-[#385E31] outline-none font-semibold text-[12px] cursor-pointer w-[180px]"
            >
              <option value="">All Actions</option>
              {FILTER_OPTIONS.filter(o => o !== "All").map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
            <div className="absolute right-3.5 top-[11px] text-[#385E31] pointer-events-none">
              <ChevronDown />
            </div>
          </div>

          {/* Search */}
          <div className="relative flex-1 min-w-[220px]">
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search user, target, or details..."
              className="w-full border border-[#385E31] rounded-full px-5 pr-10 py-2.5 bg-transparent text-[#385E31] placeholder-[#385E31]/40 outline-none font-semibold text-[12px]"
            />
            <div className="absolute right-4 top-[10px] text-[#385E31]/50">
              <SearchIcon />
            </div>
          </div>

          {/* Clear Filters */}
          <AnimatePresence>
            {hasActiveFilters && (
              <motion.button
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85 }}
                transition={{ duration: 0.15 }}
                onClick={clearFilters}
                className="flex items-center gap-1.5 text-[#385E31]/60 hover:text-[#385E31] text-[12px] font-semibold transition-colors border border-[#385E31]/30 rounded-full px-4 py-2.5 hover:border-[#385E31]/60"
              >
                <XIcon />
                Clear
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {/* ── Table Container ── */}
        <div className="w-full bg-[#FFFCEB] rounded-[10px] border border-[#385E31] flex flex-col overflow-visible shadow-sm">
          {/* Header */}
          <div className="w-full flex bg-[#385E31] px-6 py-3 rounded-t-[8px] gap-4">
            <div className="w-[120px] shrink-0 text-left text-[#FFFCEB] text-[12px] font-bold tracking-wide">Date & Time</div>
            <div className="w-[80px] shrink-0 text-left text-[#FFFCEB] text-[12px] font-bold tracking-wide">Log ID</div>
            <div className="w-[140px] shrink-0 text-left text-[#FFFCEB] text-[12px] font-bold tracking-wide">Performed By</div>
            <div className="w-[90px] shrink-0 text-left text-[#FFFCEB] text-[12px] font-bold tracking-wide">Action</div>
            {/* Flex-1 handles taking up the remaining whitespace smoothly */}
            <div className="flex-1 text-left text-[#FFFCEB] text-[12px] font-bold tracking-wide">Details</div> 
            {/* Center aligned header for Target buttons */}
            <div className="w-[160px] shrink-0 text-center text-[#FFFCEB] text-[12px] font-bold tracking-wide">Target</div>
          </div>

          {/* Body */}
          <div className="flex flex-col w-full py-1 min-h-[120px]">
            {filtered.length === 0 ? (
              <EmptyState />
            ) : (
              filtered.map((row, idx) => {
                const isLast = idx === filtered.length - 1;
                const badge = ACTION_STYLES[row.action];
                return (
                  <motion.div
                    key={`${row.id}-${idx}`}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: Math.min(idx * 0.025, 0.3) }}
                    className={`w-full flex px-6 py-3.5 items-center gap-4 hover:bg-[#385E31]/[0.04] transition-colors ${!isLast ? "border-b border-[#385E31]/15" : ""}`}
                  >
                    <div className="w-[120px] shrink-0 text-[#3A6131] text-[12px] font-medium leading-relaxed">
                      {row.timestamp}
                    </div>
                    <div className="w-[80px] shrink-0 text-[#3A6131] text-[12px] font-bold">
                      {row.id}
                    </div>
                    {/* Removed truncate, allowed to wrap normally */}
                    <div className="w-[140px] shrink-0 text-[#3A6131] text-[12px] font-medium leading-snug">
                      {row.performedBy}
                    </div>
                    <div className="w-[90px] shrink-0 flex items-start">
                      <span
                        className="font-mono text-[11px] px-2.5 py-1 rounded-md font-semibold whitespace-nowrap"
                        style={{ backgroundColor: badge.bg, color: badge.text }}
                      >
                        {row.action}
                      </span>
                    </div>
                    {/* Flexible space column, wrapping instead of truncating */}
                    <div className="flex-1 text-[#3A6131] text-[12px] font-medium pr-4 break-words leading-snug">
                      {row.remarks}
                    </div>
                    {/* Fixed right column width with horizontally and vertically centered wrapping content */}
                    <div className="w-[160px] shrink-0 flex justify-center">
                      <button
                        onClick={() => setSelectedLog(row)}
                        className="bg-[#F7B71D] hover:bg-[#e0a519] text-[#385E31] text-[11px] font-bold px-3 py-2 rounded-xl transition-colors duration-150 flex flex-wrap items-center justify-center gap-1.5 w-full text-center leading-tight shadow-sm hover:shadow"
                      >
                        <span>View</span>
                        <span className="opacity-80 break-words">{row.target}</span>
                      </button>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </div>
      </motion.div>

      {/* Modal Render */}
      <AnimatePresence>
        {selectedLog && (
          <LogDetailModal log={selectedLog} onClose={() => setSelectedLog(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}