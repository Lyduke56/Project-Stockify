"use client";

import { useState, useMemo } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type ActionType = "Update" | "Create" | "Delete" | "View";

interface AuditLog {
  id: string;
  userId: string;
  action: ActionType;
  remarks: string;
  target: string;
  timestamp: string;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_LOGS: AuditLog[] = [
  { id: "#1001", userId: "110212331", action: "Update", remarks: "Processed", target: "Inventory", timestamp: "03/19/2026 13:05" },
  { id: "#1001", userId: "110212331", action: "Create", remarks: "Processed", target: "Order",     timestamp: "03/19/2026 13:05" },
  { id: "#1002", userId: "220341442", action: "Delete", remarks: "Flagged",   target: "Product",   timestamp: "03/20/2026 09:14" },
  { id: "#1003", userId: "330456553", action: "View",   remarks: "Processed", target: "Report",    timestamp: "03/20/2026 10:30" },
  { id: "#1004", userId: "110212331", action: "Create", remarks: "Processed", target: "Order",     timestamp: "03/21/2026 08:00" },
  { id: "#1005", userId: "440567664", action: "Update", remarks: "Pending",   target: "Inventory", timestamp: "03/21/2026 11:45" },
  { id: "#1006", userId: "220341442", action: "View",   remarks: "Processed", target: "Audit Log", timestamp: "03/22/2026 14:22" },
  { id: "#1007", userId: "550678775", action: "Delete", remarks: "Flagged",   target: "User",      timestamp: "03/22/2026 15:00" },
  { id: "#1008", userId: "330456553", action: "Update", remarks: "Processed", target: "Order",     timestamp: "03/23/2026 09:05" },
  { id: "#1009", userId: "110212331", action: "Create", remarks: "Pending",   target: "Product",   timestamp: "03/23/2026 16:30" },
];

const FILTER_OPTIONS = ["All", "Update", "Create", "Delete", "View"] as const;

// ─── Action Badge ─────────────────────────────────────────────────────────────

const ACTION_STYLES: Record<ActionType, string> = {
  Update: "bg-[#F7B71D] text-[#385E31]",
  Create: "bg-[#4CAF50] text-white",
  Delete: "bg-[#E53935] text-white",
  View:   "bg-[#1E88E5] text-white",
};

function ActionBadge({ action }: { action: ActionType }) {
  return (
    <span
      className={`inline-block px-4 py-0.5 rounded-full text-xs font-bold ${ACTION_STYLES[action]}`}
    >
      {action}
    </span>
  );
}

// ─── Target Button ────────────────────────────────────────────────────────────

function TargetButton({ target, onClick }: { target: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="bg-[#F7B71D] hover:bg-[#e0a519] text-[#385E31] text-xs font-bold px-4 py-0.5 rounded-full transition-colors duration-150"
    >
      View
    </button>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────

function LogDetailModal({ log, onClose }: { log: AuditLog; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-[#385E31] text-xl font-extrabold mb-5">Log Details</h3>
        <div className="flex flex-col gap-3 text-sm">
          {(
            [
              ["ID", log.id],
              ["User ID", log.userId],
              ["Action", log.action],
              ["Remarks", log.remarks],
              ["Target", log.target],
              ["Timestamp", log.timestamp],
            ] as [string, string][]
          ).map(([label, value]) => (
            <div key={label} className="flex justify-between border-b border-gray-100 pb-2">
              <span className="text-gray-400 font-semibold">{label}</span>
              <span className="text-[#385E31] font-bold">
                {label === "Action" ? (
                  <ActionBadge action={value as ActionType} />
                ) : (
                  value
                )}
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

export default function AuditLogs() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string>("All");
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const filtered = useMemo(() => {
    return MOCK_LOGS.filter((log) => {
      const matchesFilter = filter === "All" || log.action === filter;
      const q = search.toLowerCase();
      const matchesSearch =
        !q ||
        log.id.toLowerCase().includes(q) ||
        log.userId.toLowerCase().includes(q) ||
        log.action.toLowerCase().includes(q) ||
        log.remarks.toLowerCase().includes(q) ||
        log.target.toLowerCase().includes(q) ||
        log.timestamp.includes(q);
      return matchesFilter && matchesSearch;
    });
  }, [search, filter]);

  return (
    <div className="w-full flex flex-col gap-5">
      {/* ── Controls ── */}
      <div className="flex items-center gap-10">
        {/* Search */}
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

        {/* Filter */}
        <div className="flex items-center gap-2 ml-auto">
          <span className="text-[#385E31] text-sm font-semibold whitespace-nowrap">
            Filter by:
          </span>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="border border-[#385E31] rounded-lg px-3 py-2 text-sm text-[#385E31] bg-white font-medium focus:outline-none focus:ring-2 focus:ring-[#F7B71D] cursor-pointer"
          >
            {FILTER_OPTIONS.map((o) => (
              <option key={o}>{o}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="w-full overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          {/* Head */}
          <thead>
            <tr>
              {["ID", "User ID", "Action", "Remarks", "Target", "Timestamp"].map((col) => (
                <th
                  key={col}
                  className="bg-[#385E31] text-white font-bold px-5 py-3 text-center first:rounded-tl-xl last:rounded-tr-xl"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>

          {/* Body */}
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-12 text-[#a8c8a0] font-semibold bg-white">
                  No audit logs found.
                </td>
              </tr>
            ) : (
              filtered.map((log, idx) => (
                <tr
                  key={`${log.id}-${idx}`}
                  className={`border-b border-[#e9e9d8] transition-colors duration-100 ${
                    idx % 2 === 0 ? "bg-[#FFFCEB]" : "bg-[#FFFCEB]"
                  } hover:bg-[#F7B71D]/10`}
                >
                  <td className="px-5 py-3 text-center font-semibold text-[#385E31]">{log.id}</td>
                  <td className="px-5 py-3 text-center text-[#385E31]">{log.userId}</td>
                  <td className="px-5 py-3 text-center">
                    <ActionBadge action={log.action} />
                  </td>
                  <td className="px-5 py-3 text-center text-[#385E31]">{log.remarks}</td>
                  <td className="px-5 py-3 text-center">
                    <TargetButton
                      target={log.target}
                      onClick={() => setSelectedLog(log)}
                    />
                  </td>
                  <td className="px-5 py-3 text-center text-[#385E31]">{log.timestamp}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── Record Count ── */}
      <p className="text-xs text-[#a8c8a0] font-medium">
        Showing {filtered.length} of {MOCK_LOGS.length} records
      </p>

      {/* ── Detail Modal ── */}
      {selectedLog && (
        <LogDetailModal log={selectedLog} onClose={() => setSelectedLog(null)} />
      )}
    </div>
  );
}
