"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Search, RefreshCw, Loader2, ShieldCheck, FileText, ChevronDown, ChevronUp
} from "lucide-react";
import { fetchAuditLogs, type AuditLog } from "@/lib/employee/order-actions";
import { createClient } from "@/lib/supabase/client";
import DetailModal from "../modals/employee/audit-logs-modal/modal";

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
  COMPLETE: "bg-[#3A6131]/10 text-[#3A6131]",
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
      className={`w-full grid grid-cols-6 px-4 py-[13px] items-center hover:bg-[#3A6131]/5 transition-colors ${
        !isLast ? "border-b border-[#3A6131]/10" : ""
      }`}
    >
      <div className="text-center text-[#3A6131]/70 text-[11px] font-medium">
        {formatDate(log.created_at)}
      </div>

      <div className="text-center text-[#3A6131] text-[12px] font-bold truncate px-1">
        {log.user_name || "System"}
      </div>

      <div className="flex justify-center">
        <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${getActionColor(log.action)}`}>
          {getActionLabel(log.action)}
        </span>
      </div>

      <div className="flex justify-center">
        <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full capitalize ${getEntityColor(log.entity_type)}`}>
          {log.entity_type}
        </span>
      </div>

      <div className="text-center text-[#3A6131] text-[12px] font-medium truncate px-1">
        {log.entity_name ?? log.entity_id?.slice(0, 8).toUpperCase() ?? "—"}
      </div>

      <div className="flex justify-center">
        {log.details && Object.keys(log.details).length > 0 ? (
          <button
            onClick={() => onViewDetails(log)}
            // Improved the view button with Gold/Dark Green Theme 
            className="px-4 py-1.5 rounded-full bg-[#F7B71D] text-[#385E31] text-[11px] font-black hover:bg-[#e5a91a] active:scale-95 transition-all flex items-center gap-1.5 shadow-sm"
          >
            <FileText size={12} strokeWidth={2.5} />
            View
          </button>
        ) : (
          <span className="text-[#3A6131]/25 text-[11px]">—</span>
        )}
      </div>
    </div>
  );
}

const COLUMNS = ["DATE & TIME", "USER", "ACTION", "ENTITY TYPE", "ENTITY NAME", "DETAILS"];

// ─── Main component ───────────────────────────────────────────────────────────
export default function AuditLogsTable() {
  const [tenantId,  setTenantId]  = useState("");
  const [logs,      setLogs]      = useState<AuditLog[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [refreshing,setRefreshing]= useState(false);
  const [search,    setSearch]    = useState("");
  const [filterType,setFilterType]= useState("all");
  const [activeLog, setActiveLog] = useState<AuditLog | null>(null);

  // Pagination state
  const ITEMS_PER_LOAD = 15;
  const [visibleRows, setVisibleRows] = useState(ITEMS_PER_LOAD);

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

  // Reset pagination when searching or filtering
  useEffect(() => {
    setVisibleRows(ITEMS_PER_LOAD);
  }, [search, filterType]);

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

  // Calculate items to display based on visibleRows state
  const displayedLogs = filtered.slice(0, visibleRows);
  const hasMore = visibleRows < filtered.length;
  const hasLess = visibleRows > ITEMS_PER_LOAD;

  return (
    <div className="w-full flex flex-col font-['Inter'] px-6 pb-12">
      {/* Toolbar */}
      <div className="w-full flex flex-col lg:flex-row justify-between items-center mb-4 gap-4">
        <div className="relative flex-1 max-w-[400px]">
          <input
            type="text"
            placeholder="Search by action, user, or entity…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border border-[#3A6131] rounded-full px-5 py-2.5 bg-transparent text-[#3A6131] placeholder-[#3A6131]/70 outline-none font-medium text-[13px]"
          />
          <div className="absolute right-4 top-3 text-[#3A6131]"><Search size={16} /></div>
        </div>
        <div className="flex items-center gap-3 flex-wrap justify-end">
          {entityTypes.map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-4 py-2 rounded-full text-[12px] font-bold border transition-all capitalize ${
                filterType === type
                  ? "bg-[#3A6131] text-[#FFFCEB] border-transparent shadow-sm"
                  : "border-[#3A6131] text-[#3A6131] hover:bg-[#3A6131]/5"
              }`}
            >
              {type}
            </button>
          ))}
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2.5 rounded-full border border-[#3A6131] text-[#3A6131] hover:bg-[#3A6131]/10 transition-all disabled:opacity-50"
          >
            <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="w-full bg-transparent rounded-[10px] border border-[#3A6131]/30 flex flex-col overflow-hidden shadow-sm">
        <div className="w-full grid grid-cols-6 bg-[#3A6131] px-4 py-3 rounded-t-[8px]">
          {COLUMNS.map((col) => (
            <div key={col} className="text-center text-[#FFFCEB] text-[12px] font-bold">{col}</div>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-[#3A6131]/40 gap-3">
            <Loader2 size={22} className="animate-spin" /> Loading audit logs…
          </div>
        ) : displayedLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-[#3A6131]/40 gap-3">
            <ShieldCheck size={40} strokeWidth={1} />
            <p className="font-medium text-[14px]">
              {search || filterType !== "all" ? "No matching log entries." : "No audit logs yet."}
            </p>
          </div>
        ) : (
          displayedLogs.map((log, idx) => (
            <LogRow
              key={log.log_id}
              log={log}
              isLast={idx === displayedLogs.length - 1}
              onViewDetails={setActiveLog}
            />
          ))
        )}
      </div>

      {/* Pagination Controls */}
      {!loading && filtered.length > 0 && (
        <div className="flex flex-col items-center mt-6 gap-4">
          <p className="text-center text-[#3A6131]/50 text-[12px] font-semibold">
            Showing {displayedLogs.length} of {filtered.length} entries
          </p>
          
          <div className="flex items-center gap-3">
            {hasLess && (
               <button 
                 onClick={() => setVisibleRows(ITEMS_PER_LOAD)}
                 className="px-6 py-2.5 rounded-full border-[1.5px] border-[#3A6131] text-[#3A6131] font-bold text-[13px] hover:bg-[#3A6131]/5 transition-colors flex items-center gap-2"
               >
                 <ChevronUp size={16} /> Show Less
               </button>
            )}
            
            {hasMore && (
              <button 
                onClick={() => setVisibleRows((prev) => prev + ITEMS_PER_LOAD)}
                className="px-6 py-2.5 rounded-full bg-[#3A6131] text-[#FFFCEB] font-bold text-[13px] hover:opacity-90 shadow-sm transition-all flex items-center gap-2"
              >
                Load More <ChevronDown size={16} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Detail modal */}
      {activeLog && (
        <DetailModal log={activeLog} onClose={() => setActiveLog(null)} />
      )}
    </div>
  );
}