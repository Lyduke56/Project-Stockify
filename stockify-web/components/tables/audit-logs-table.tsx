"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, RefreshCw, Loader2, ShieldCheck,
  X, FileText, User, Tag, Calendar, Hash, Info,
} from "lucide-react";
import { fetchAuditLogs, type AuditLog } from "@/lib/employee/order-actions";
import { createClient } from "@/lib/supabase/client";

// ─── Color maps ───────────────────────────────────────────────────────────────

const ENTITY_COLORS: Record<string, string> = {
  product:    "bg-blue-100 text-blue-700",
  ingredient: "bg-orange-100 text-orange-700",
  order:      "bg-purple-100 text-purple-700",
  variant:    "bg-pink-100 text-pink-700",
  inventory:  "bg-yellow-100 text-yellow-700",
  user:       "bg-green-100 text-green-700",
};

const ACTION_COLORS: Record<string, string> = {
  CREATE:   "bg-green-100 text-green-700",
  UPDATE:   "bg-blue-100 text-blue-700",
  DELETE:   "bg-red-100 text-red-700",
  CANCEL:   "bg-red-100 text-red-600",
  RESTOCK:  "bg-amber-100 text-amber-700",
  COMPLETE: "bg-[#385E31]/10 text-[#385E31]",
  STATUS:   "bg-purple-100 text-purple-700",
};

const ACTION_LABELS: Record<string, string> = {
  CREATE:   "Created",
  UPDATE:   "Updated",
  DELETE:   "Deleted",
  CANCEL:   "Cancelled",
  RESTOCK:  "Restocked",
  COMPLETE: "Completed",
  STATUS_PENDING:     "→ Pending",
  STATUS_PROCESSING:  "→ Processing",
  STATUS_DISPATCHED:  "→ Dispatched",
  STATUS_RECEIVED:    "→ Received",
  STATUS_CANCELLED:   "→ Cancelled",
};

function getActionColor(action: string): string {
  const key = Object.keys(ACTION_COLORS).find((k) => action.toUpperCase().startsWith(k));
  return key ? ACTION_COLORS[key] : "bg-gray-100 text-gray-600";
}
function getEntityColor(type: string): string {
  return ENTITY_COLORS[type.toLowerCase()] ?? "bg-gray-100 text-gray-600";
}
function getActionLabel(action: string): string {
  return ACTION_LABELS[action.toUpperCase()] ?? action;
}

// ─── Detail Modal ─────────────────────────────────────────────────────────────

function DetailModal({ log, onClose }: { log: AuditLog; onClose: () => void }) {
  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return {
      date: d.toLocaleDateString("en-PH", { month: "long", day: "numeric", year: "numeric" }),
      time: d.toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
    };
  };

  const { date, time } = formatDate(log.created_at);

  // Prettify the details object into human-readable rows
  const detailEntries = log.details
    ? Object.entries(log.details).map(([k, v]) => ({
        key: k.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
        value: typeof v === "object" ? JSON.stringify(v, null, 2) : String(v),
        raw: v,
      }))
    : [];

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        key="detail-backdrop"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[300]"
        onClick={onClose}
      />

      {/* Modal */}
      <motion.div
        key="detail-modal"
        initial={{ opacity: 0, scale: 0.94, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 20 }}
        transition={{ type: "spring", stiffness: 360, damping: 30 }}
        className="fixed inset-0 z-[301] flex items-center justify-center p-4 pointer-events-none"
      >
        <div className="bg-[#FFFCEB] rounded-[24px] w-full max-w-[500px] shadow-2xl pointer-events-auto overflow-hidden max-h-[88dvh] flex flex-col">

          {/* Header */}
          <div className="bg-[#385E31] px-6 py-5 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
                <FileText size={17} className="text-[#F7B71D]" />
              </div>
              <div>
                <h2 className="text-white font-black text-[15px]">Activity Details</h2>
                <p className="text-white/60 text-[11px] font-medium mt-0.5">
                  {date} · {time}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-4">

            {/* Action + entity type badges */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`px-3 py-1 rounded-full text-[12px] font-black ${getActionColor(log.action)}`}>
                {getActionLabel(log.action)}
              </span>
              <span className={`px-3 py-1 rounded-full text-[12px] font-bold capitalize ${getEntityColor(log.entity_type)}`}>
                {log.entity_type}
              </span>
            </div>

            {/* Core fields */}
            <div className="bg-white border border-[#385E31]/10 rounded-2xl overflow-hidden divide-y divide-[#385E31]/8">

              {/* Entity name */}
              <div className="flex items-start gap-3 px-4 py-3">
                <Tag size={14} className="text-[#385E31]/50 mt-0.5 shrink-0" />
                <div>
                  <p className="text-[10px] font-black text-[#385E31]/40 uppercase tracking-wider">Entity</p>
                  <p className="text-[#385E31] font-bold text-[13px] mt-0.5">
                    {log.entity_name ?? "—"}
                  </p>
                </div>
              </div>

              {/* User */}
              <div className="flex items-start gap-3 px-4 py-3">
                <User size={14} className="text-[#385E31]/50 mt-0.5 shrink-0" />
                <div>
                  <p className="text-[10px] font-black text-[#385E31]/40 uppercase tracking-wider">Performed By</p>
                  <p className="text-[#385E31] font-bold text-[13px] mt-0.5">
                    {log.user_name || "System"}
                  </p>
                </div>
              </div>

              {/* Date / Time */}
              <div className="flex items-start gap-3 px-4 py-3">
                <Calendar size={14} className="text-[#385E31]/50 mt-0.5 shrink-0" />
                <div>
                  <p className="text-[10px] font-black text-[#385E31]/40 uppercase tracking-wider">Timestamp</p>
                  <p className="text-[#385E31] font-bold text-[13px] mt-0.5">{date}</p>
                  <p className="text-[#385E31]/60 text-[11px] font-medium">{time}</p>
                </div>
              </div>

              {/* Entity ID */}
              {log.entity_id && (
                <div className="flex items-start gap-3 px-4 py-3">
                  <Hash size={14} className="text-[#385E31]/50 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[10px] font-black text-[#385E31]/40 uppercase tracking-wider">Entity ID</p>
                    <p className="text-[#385E31]/60 font-mono text-[11px] mt-0.5 break-all">
                      {log.entity_id}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Details section */}
            {detailEntries.length > 0 && (
              <>
                <div className="flex items-center gap-2">
                  <Info size={13} className="text-[#385E31]/50" />
                  <p className="text-[11px] font-black uppercase tracking-wider text-[#385E31]/50">
                    Additional Details
                  </p>
                </div>

                <div className="bg-white border border-[#385E31]/10 rounded-2xl overflow-hidden divide-y divide-[#385E31]/8">
                  {detailEntries.map(({ key, value, raw }) => (
                    <div key={key} className="flex items-start justify-between gap-4 px-4 py-3">
                      <p className="text-[#385E31]/50 text-[11px] font-bold uppercase tracking-wide shrink-0">
                        {key}
                      </p>
                      <p className={`text-right text-[13px] font-black break-all ${
                        typeof raw === "number"
                          ? "text-[#385E31]"
                          : raw === null
                          ? "text-[#385E31]/30 italic font-medium"
                          : "text-[#385E31]"
                      }`}>
                        {raw === null ? "none" : typeof raw === "object" ? (
                          <span className="font-mono text-[11px] font-normal text-[#385E31]/60 whitespace-pre-wrap text-left block">
                            {value}
                          </span>
                        ) : value}
                      </p>
                    </div>
                  ))}
                </div>
              </>
            )}

            {detailEntries.length === 0 && (
              <div className="flex flex-col items-center justify-center py-6 text-[#385E31]/30 gap-2">
                <Info size={24} strokeWidth={1.5} />
                <p className="text-[12px] font-medium">No additional details recorded.</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 pb-6 pt-4 border-t border-[#385E31]/10 shrink-0">
            <button
              onClick={onClose}
              className="w-full py-3 rounded-2xl bg-[#385E31] text-[#F7B71D] font-black text-[13px] hover:opacity-90 transition-opacity"
            >
              Close
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// ─── Table Row ────────────────────────────────────────────────────────────────

function LogRow({
  log, isLast, onViewDetails,
}: {
  log: AuditLog;
  isLast: boolean;
  onViewDetails: (log: AuditLog) => void;
}) {
  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return (
      d.toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" }) +
      " " +
      d.toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" })
    );
  };

  return (
    <div
      className={`w-full grid grid-cols-6 px-4 py-[13px] items-center hover:bg-[#3A6131]/[0.03] transition-colors ${
        !isLast ? "border-b border-[#385E31]/10" : ""
      }`}
    >
      {/* Date */}
      <div className="text-center text-[#3A6131]/70 text-[11px] font-medium">
        {formatDate(log.created_at)}
      </div>

      {/* User */}
      <div className="text-center text-[#3A6131] text-[12px] font-bold truncate px-1">
        {log.user_name || "System"}
      </div>

      {/* Action */}
      <div className="flex justify-center">
        <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${getActionColor(log.action)}`}>
          {getActionLabel(log.action)}
        </span>
      </div>

      {/* Entity Type */}
      <div className="flex justify-center">
        <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full capitalize ${getEntityColor(log.entity_type)}`}>
          {log.entity_type}
        </span>
      </div>

      {/* Entity Name */}
      <div className="text-center text-[#3A6131] text-[12px] font-medium truncate px-1">
        {log.entity_name ?? log.entity_id?.slice(0, 8).toUpperCase() ?? "—"}
      </div>

      {/* Details button */}
      <div className="flex justify-center">
        {log.details && Object.keys(log.details).length > 0 ? (
          <button
            onClick={() => onViewDetails(log)}
            className="px-3 py-1.5 rounded-full bg-[#385E31] text-[#F7B71D] text-[10px] font-black hover:opacity-80 active:scale-95 transition-all flex items-center gap-1.5"
          >
            <FileText size={11} />
            View
          </button>
        ) : (
          <span className="text-[#3A6131]/25 text-[11px]">—</span>
        )}
      </div>
    </div>
  );
}

// ─── Column defs ──────────────────────────────────────────────────────────────

const COLUMNS = ["Date & Time", "User", "Action", "Entity Type", "Entity Name", "Details"];

// ─── Main component ───────────────────────────────────────────────────────────

export default function AuditLogsTable() {
  const [tenantId,  setTenantId]  = useState("");
  const [logs,      setLogs]      = useState<AuditLog[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [refreshing,setRefreshing]= useState(false);
  const [search,    setSearch]    = useState("");
  const [filterType,setFilterType]= useState("all");
  const [activeLog, setActiveLog] = useState<AuditLog | null>(null);

  const loadLogs = useCallback(async (tid: string) => {
    const data = await fetchAuditLogs(tid);
    setLogs(data);
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    const init = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: u } = await supabase.from("users").select("tenant_id").eq("user_id", user.id).single();
      if (!u?.tenant_id) return;
      setTenantId(u.tenant_id);
      loadLogs(u.tenant_id);
    };
    init();
  }, [loadLogs]);

  const handleRefresh = () => { if (!tenantId) return; setRefreshing(true); loadLogs(tenantId); };

  const entityTypes = ["all", ...Array.from(new Set(logs.map((l) => l.entity_type)))];

  const filtered = logs.filter((l) => {
    const q = search.toLowerCase();
    const matchSearch =
      l.action.toLowerCase().includes(q) ||
      l.entity_name?.toLowerCase().includes(q) ||
      l.user_name.toLowerCase().includes(q) ||
      l.entity_type.toLowerCase().includes(q);
    const matchType = filterType === "all" || l.entity_type === filterType;
    return matchSearch && matchType;
  });

  return (
    <div className="w-full flex flex-col font-['Inter'] px-6">

      {/* Toolbar */}
      <div className="w-full flex flex-col lg:flex-row justify-between items-center mb-4 gap-4">
        <div className="relative flex-1 max-w-[400px]">
          <input
            type="text"
            placeholder="Search by action, user, or entity…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border border-[#385E31] rounded-full px-5 py-2.5 bg-transparent text-[#385E31] placeholder-[#385E31]/70 outline-none font-medium text-[13px]"
          />
          <div className="absolute right-4 top-3 text-[#385E31]"><Search size={16} /></div>
        </div>
        <div className="flex items-center gap-3 flex-wrap justify-end">
          {entityTypes.map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-4 py-2 rounded-full text-[12px] font-bold border transition-all capitalize ${
                filterType === type
                  ? "bg-[#385E31] text-white border-transparent"
                  : "border-[#385E31] text-[#385E31] hover:bg-[#385E31]/5"
              }`}
            >
              {type}
            </button>
          ))}
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2.5 rounded-full border border-[#385E31] text-[#385E31] hover:bg-[#385E31]/10 transition-all disabled:opacity-50"
          >
            <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="w-full bg-[#FFFCEB] rounded-[10px] border border-[#385E31] flex flex-col overflow-hidden shadow-sm">
        <div className="w-full grid grid-cols-6 bg-[#385E31] px-4 py-3 rounded-t-[8px]">
          {COLUMNS.map((col) => (
            <div key={col} className="text-center text-[#FFFCEB] text-[13px] font-bold">{col}</div>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-[#3A6131]/40 gap-3">
            <Loader2 size={22} className="animate-spin" /> Loading audit logs…
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-[#385E31]/40 gap-3">
            <ShieldCheck size={40} strokeWidth={1} />
            <p className="font-medium text-[14px]">
              {search || filterType !== "all" ? "No matching log entries." : "No audit logs yet."}
            </p>
          </div>
        ) : (
          filtered.map((log, idx) => (
            <LogRow
              key={log.log_id}
              log={log}
              isLast={idx === filtered.length - 1}
              onViewDetails={setActiveLog}
            />
          ))
        )}
      </div>

      <p className="text-center text-[#3A6131]/30 text-[11px] font-medium mt-3">
        Showing {filtered.length} of {logs.length} entries (last 500)
      </p>

      {/* Detail modal */}
      {activeLog && (
        <DetailModal log={activeLog} onClose={() => setActiveLog(null)} />
      )}
    </div>
  );
}