"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, RefreshCw, Loader2, ShieldCheck, ChevronDown, ChevronUp } from "lucide-react";
import { fetchAuditLogs, type AuditLog } from "@/lib/employee/order-actions";
import { createClient } from "@/lib/supabase/client";

const ENTITY_COLORS: Record<string, string> = {
  product:     "bg-blue-100 text-blue-700",
  ingredient:  "bg-orange-100 text-orange-700",
  order:       "bg-purple-100 text-purple-700",
  variant:     "bg-pink-100 text-pink-700",
  inventory:   "bg-yellow-100 text-yellow-700",
  user:        "bg-green-100 text-green-700",
};

const ACTION_COLORS: Record<string, string> = {
  CREATE:   "bg-green-100 text-green-700",
  UPDATE:   "bg-blue-100 text-blue-700",
  DELETE:   "bg-red-100 text-red-700",
  CANCEL:   "bg-red-100 text-red-600",
  STATUS:   "bg-purple-100 text-purple-700",
  DISPATCH: "bg-indigo-100 text-indigo-700",
  COMPLETE: "bg-[#385E31]/10 text-[#385E31]",
};

function getActionColor(action: string): string {
  const key = Object.keys(ACTION_COLORS).find((k) => action.toUpperCase().startsWith(k));
  return key ? ACTION_COLORS[key] : "bg-gray-100 text-gray-600";
}

function getEntityColor(type: string): string {
  return ENTITY_COLORS[type.toLowerCase()] ?? "bg-gray-100 text-gray-600";
}

// ─── Detail Expandable Row ─────────────────────────────────────────────────────

function LogRow({ log, isLast }: { log: AuditLog; isLast: boolean }) {
  const [expanded, setExpanded] = useState(false);

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" }) +
      " " + d.toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  };

  return (
    <>
      <div
        className={`w-full grid grid-cols-6 px-4 py-[13px] items-center hover:bg-[#3A6131]/3 transition-colors cursor-pointer ${!isLast || expanded ? "border-b border-[#385E31]/10" : ""}`}
        onClick={() => setExpanded(!expanded)}
      >
        <div className="text-center text-[#3A6131]/70 text-[11px] font-medium">{formatDate(log.created_at)}</div>
        <div className="text-center text-[#3A6131] text-[12px] font-bold truncate px-1">{log.user_name || "System"}</div>
        <div className="flex justify-center">
          <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${getActionColor(log.action)}`}>
            {log.action}
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
        <div className="flex justify-center text-[#3A6131]/40">
          {log.details ? (expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />) : <span className="text-[11px]">—</span>}
        </div>
      </div>
      <AnimatePresence>
        {expanded && log.details && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className={`px-6 py-3 bg-[#3A6131]/3 ${!isLast ? "border-b border-[#385E31]/10" : ""}`}
          >
            <p className="text-[10px] font-black uppercase tracking-wider text-[#3A6131]/40 mb-2">Details</p>
            <pre className="text-[11px] text-[#3A6131]/70 font-mono whitespace-pre-wrap break-all">
              {JSON.stringify(log.details, null, 2)}
            </pre>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

const COLUMNS = ["Date & Time", "User", "Action", "Entity Type", "Entity Name", "Details"];

export default function AuditLogsTable() {
  const [tenantId, setTenantId]     = useState("");
  const [logs, setLogs]             = useState<AuditLog[]>([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch]         = useState("");
  const [filterType, setFilterType] = useState("all");

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
          <button onClick={handleRefresh} disabled={refreshing}
            className="p-2.5 rounded-full border border-[#385E31] text-[#385E31] hover:bg-[#385E31]/10 transition-all disabled:opacity-50">
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
            <LogRow key={log.log_id} log={log} isLast={idx === filtered.length - 1} />
          ))
        )}
      </div>

      <p className="text-center text-[#3A6131]/30 text-[11px] font-medium mt-3">
        Showing {filtered.length} of {logs.length} entries (last 500)
      </p>
    </div>
  );
}