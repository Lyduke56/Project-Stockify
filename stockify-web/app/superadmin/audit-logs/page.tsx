"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import NavbarApp from "@/components/navbars/navbar-superadmin";
import SidebarSuperAdmin from "@/components/navbars/sidebar-superadmin";
import NotificationModal from "@/components/modals/notification-modal";
import ClientProfileModal from "@/components/modals/client-profile-modal";

// ─── Types ────────────────────────────────────────────────────────────────────
interface AuditLog {
  id:            string;
  performed_by:  string;
  tenant_id:     string | null;
  business_name: string | null;
  event_type:    string;
  description:   string;
  metadata:      Record<string, unknown> | null;
  created_at:    string;
}

interface AuditLogsResponse {
  data:       AuditLog[];
  total:      number;
  page:       number;
  pageSize:   number;
  totalPages: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const ALL_EVENT_TYPES = [
  "TenantCreated",
  "TenantSuspended",
  "TenantRestored",
  "TenantTerminated",
  "PaymentRecorded",
  "InvoiceGenerated",
  "TrialConverted",
  "NotificationSent",
  "TrialReminderSent",
  "OverdueNoticeSent",
  "GracePeriodStarted",
  "SuspensionNoticeSent",
] as const;

const PAGE_SIZE = 15;

// ─── Event type badge styling ─────────────────────────────────────────────────
function getEventBadgeStyle(eventType: string): { bg: string; text: string } {
  switch (eventType) {
    case "TenantCreated":
      return { bg: "#DCFCE7", text: "#166534" };
    case "TenantSuspended":
      return { bg: "#FEF3C7", text: "#92400E" };
    case "TenantRestored":
      return { bg: "#DBEAFE", text: "#1E40AF" };
    case "TenantTerminated":
      return { bg: "#FEE2E2", text: "#991B1B" };
    case "PaymentRecorded":
      return { bg: "#D1FAE5", text: "#065F46" };
    case "InvoiceGenerated":
      return { bg: "#EDE9FE", text: "#4C1D95" };
    case "TrialConverted":
      return { bg: "#E0F2FE", text: "#0C4A6E" };
    case "NotificationSent":
    case "TrialReminderSent":
    case "OverdueNoticeSent":
    case "SuspensionNoticeSent":
      return { bg: "#F3F4F6", text: "#374151" };
    case "GracePeriodStarted":
      return { bg: "#FFF7ED", text: "#9A3412" };
    default:
      return { bg: "#E2E8F0", text: "#475569" };
  }
}

// ─── Format date ──────────────────────────────────────────────────────────────
function formatDate(iso: string): string {
  const d = new Date(iso);
  const date = d.toLocaleDateString("en-US", {
    month: "2-digit",
    day:   "2-digit",
    year:  "numeric",
  });
  const time = d.toLocaleTimeString("en-US", {
    hour:   "2-digit",
    minute: "2-digit",
    hour12: true,
  });
  return `${date} ${time}`;
}

// ─── SVG Icons ────────────────────────────────────────────────────────────────
const SearchIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const ChevronDown = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const CalendarIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const XIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

// ─── Skeleton row ─────────────────────────────────────────────────────────────
const SkeletonRow = ({ idx }: { idx: number }) => (
  <div
    className="w-full flex px-6 py-4 items-center gap-4 border-b border-[#385E31]/10"
    style={{ animationDelay: `${idx * 60}ms` }}
  >
    <div className="w-[150px] shrink-0 h-3.5 bg-[#385E31]/10 rounded-full animate-pulse" />
    <div className="w-[160px] shrink-0 h-3.5 bg-[#385E31]/10 rounded-full animate-pulse" style={{ animationDelay: "80ms" }} />
    <div className="w-[130px] shrink-0 h-3.5 bg-[#385E31]/10 rounded-full animate-pulse" style={{ animationDelay: "120ms" }} />
    <div className="w-[140px] shrink-0 h-5 bg-[#385E31]/10 rounded-md animate-pulse" style={{ animationDelay: "160ms" }} />
    <div className="flex-1 h-3.5 bg-[#385E31]/10 rounded-full animate-pulse" style={{ animationDelay: "200ms" }} />
  </div>
);

// ─── Empty state ──────────────────────────────────────────────────────────────
const EmptyState = () => (
  <div className="w-full flex flex-col items-center justify-center py-20 gap-3">
    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24"
      fill="none" stroke="#385E31" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"
      className="opacity-30">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
    <p className="text-[#385E31]/40 text-[13px] font-semibold">No audit logs found</p>
    <p className="text-[#385E31]/30 text-[12px]">Try adjusting your filters</p>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AuditLogs() {
  const [isNotifsOpen,  setIsNotifsOpen]  = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // ── Filter state ────────────────────────────────────────────────────────────
  const [search,    setSearch]    = useState("");
  const [eventType, setEventType] = useState("");
  const [dateFrom,  setDateFrom]  = useState("");
  const [dateTo,    setDateTo]    = useState("");

  // ── Data state ──────────────────────────────────────────────────────────────
  const [logs,        setLogs]        = useState<AuditLog[]>([]);
  const [total,       setTotal]       = useState(0);
  const [totalPages,  setTotalPages]  = useState(1);
  const [page,        setPage]        = useState(1);
  const [loading,     setLoading]     = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error,       setError]       = useState<string | null>(null);

  // Debounce search
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedSearch(search), 350);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [search]);

  // ── Fetch function ──────────────────────────────────────────────────────────
  const fetchLogs = useCallback(async (targetPage: number, append: boolean) => {
    if (append) setLoadingMore(true);
    else        setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page:     String(targetPage),
        pageSize: String(PAGE_SIZE),
      });
      if (debouncedSearch.trim()) params.set("search",    debouncedSearch.trim());
      if (eventType.trim())        params.set("eventType", eventType.trim());
      if (dateFrom.trim())         params.set("from",      dateFrom.trim());
      if (dateTo.trim())           params.set("to",        dateTo.trim());

      const res = await fetch(`/api/superadmin/audit-logs?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load audit logs.");

      const json: AuditLogsResponse = await res.json();

      setLogs(prev => append ? [...prev, ...json.data] : json.data);
      setTotal(json.total);
      setTotalPages(json.totalPages);
      setPage(targetPage);
    } catch (err: any) {
      setError(err.message ?? "Something went wrong.");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [debouncedSearch, eventType, dateFrom, dateTo]);

  // Reset + refetch when filters change
  useEffect(() => {
    fetchLogs(1, false);
  }, [debouncedSearch, eventType, dateFrom, dateTo, fetchLogs]);

  const handleLoadMore = () => fetchLogs(page + 1, true);

  const hasActiveFilters = debouncedSearch || eventType || dateFrom || dateTo;

  const clearFilters = () => {
    setSearch("");
    setEventType("");
    setDateFrom("");
    setDateTo("");
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-screen w-full bg-[#FFFCEB] overflow-hidden font-['Inter']">

      {/* Sidebar */}
      <SidebarSuperAdmin />

      {/* Main content */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="flex-1 flex flex-col h-full overflow-y-auto px-10 md:px-20 pt-5 pb-12"
      >
        <NavbarApp
          onHome={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        />

        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="w-full flex flex-col items-center mt-10 mb-10 gap-2"
        >
          <h1 className="text-[#385E31] text-[30px] font-extrabold tracking-wide uppercase">
            AUDIT LOGS
          </h1>
          <div className="w-full max-w-[900px] h-1.5 bg-[#F7B71D] rounded-full" />
        </motion.div>

        {/* Filters + Table */}
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
                placeholder="From"
              />
              {dateFrom && (
                <button
                  onClick={() => setDateFrom("")}
                  className="absolute right-3 text-[#385E31]/50 hover:text-[#385E31] transition-colors"
                >
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
                placeholder="To"
              />
              {dateTo && (
                <button
                  onClick={() => setDateTo("")}
                  className="absolute right-3 text-[#385E31]/50 hover:text-[#385E31] transition-colors"
                >
                  <XIcon />
                </button>
              )}
            </div>

            {/* Event Type */}
            <div className="relative">
              <select
                value={eventType}
                onChange={e => setEventType(e.target.value)}
                className="appearance-none border border-[#385E31] rounded-full pl-5 pr-9 py-2.5 bg-transparent text-[#385E31] outline-none font-semibold text-[12px] cursor-pointer w-[210px]"
              >
                <option value="">All Event Types</option>
                {ALL_EVENT_TYPES.map(et => (
                  <option key={et} value={et}>{et}</option>
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
                placeholder="Search by business name or performed by…"
                className="w-full border border-[#385E31] rounded-full px-5 pr-10 py-2.5 bg-transparent text-[#385E31] placeholder-[#385E31]/40 outline-none font-semibold text-[12px]"
              />
              <div className="absolute right-4 top-[10px] text-[#385E31]/50">
                <SearchIcon />
              </div>
            </div>

            {/* Clear filters */}
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

          {/* ── Table ── */}
          <div className="w-full bg-[#FFFCEB] rounded-[10px] border border-[#385E31] flex flex-col overflow-visible shadow-sm">

            {/* Header */}
            <div className="w-full flex bg-[#385E31] px-6 py-3 rounded-t-[8px] gap-4">
              <div className="w-[150px] shrink-0 text-left text-[#FFFCEB] text-[13px] font-bold tracking-wide">DATE & TIME</div>
              <div className="w-[160px] shrink-0 text-left text-[#FFFCEB] text-[13px] font-bold tracking-wide">PERFORMED BY</div>
              <div className="w-[130px] shrink-0 text-left text-[#FFFCEB] text-[13px] font-bold tracking-wide">BUSINESS NAME</div>
              <div className="w-[175px] shrink-0 text-left text-[#FFFCEB] text-[13px] font-bold tracking-wide">EVENT TYPE</div>
              <div className="flex-1   text-left text-[#FFFCEB] text-[13px] font-bold tracking-wide">DESCRIPTION / NOTES</div>
            </div>

            {/* Body */}
            <div className="flex flex-col w-full py-1 min-h-[120px]">

              {/* Loading skeleton */}
              {loading && (
                Array.from({ length: PAGE_SIZE }).map((_, i) => (
                  <SkeletonRow key={i} idx={i} />
                ))
              )}

              {/* Error */}
              {!loading && error && (
                <div className="w-full flex flex-col items-center justify-center py-16 gap-3">
                  <p className="text-red-500/70 text-[13px] font-semibold">{error}</p>
                  <button
                    onClick={() => fetchLogs(1, false)}
                    className="text-[12px] font-bold text-[#385E31] underline underline-offset-2"
                  >
                    Retry
                  </button>
                </div>
              )}

              {/* Empty */}
              {!loading && !error && logs.length === 0 && <EmptyState />}

              {/* Rows */}
              {!loading && !error && logs.map((row, idx) => {
                const isLast  = idx === logs.length - 1;
                const badge   = getEventBadgeStyle(row.event_type);
                return (
                  <motion.div
                    key={row.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: Math.min(idx * 0.025, 0.3) }}
                    className={`w-full flex px-6 py-4 items-start gap-4 hover:bg-[#385E31]/[0.04] transition-colors ${!isLast ? "border-b border-[#385E31]/15" : ""}`}
                  >
                    {/* Date */}
                    <div className="w-[150px] shrink-0 text-[#3A6131] text-[12px] font-medium pt-0.5 leading-relaxed">
                      {formatDate(row.created_at)}
                    </div>

                    {/* Performed by */}
                    <div className="w-[160px] shrink-0 text-[#3A6131] text-[12px] font-medium pt-0.5 leading-relaxed">
                      {row.performed_by}
                    </div>

                    {/* Business name */}
                    <div className="w-[130px] shrink-0 text-[#3A6131] text-[12px] font-bold pt-0.5 truncate">
                      {row.business_name ?? (
                        <span className="text-[#385E31]/30 font-normal italic">—</span>
                      )}
                    </div>

                    {/* Event type badge */}
                    <div className="w-[175px] shrink-0 flex items-start pt-0.5">
                      <span
                        className="font-mono text-[11px] px-2.5 py-1 rounded-md font-semibold whitespace-nowrap"
                        style={{ backgroundColor: badge.bg, color: badge.text }}
                      >
                        {row.event_type}
                      </span>
                    </div>

                    {/* Description */}
                    <div className="flex-1 text-[#3A6131] text-[12px] leading-relaxed pt-0.5">
                      {row.description}
                    </div>
                  </motion.div>
                );
              })}

              {/* Load More skeleton rows */}
              {loadingMore && (
                Array.from({ length: 5 }).map((_, i) => (
                  <SkeletonRow key={`more-${i}`} idx={i} />
                ))
              )}
            </div>
          </div>

          {/* ── Footer: count + Load More ── */}
          <div className="w-full flex justify-between items-center mt-5">

            {/* Showing X of Y */}
            <p className="text-[#385E31]/40 text-[12px] font-medium">
              {!loading && !error && logs.length > 0
                ? `Showing ${logs.length} of ${total.toLocaleString()}`
                : ""}
            </p>

            {/* Load More */}
            {!loading && !error && page < totalPages && (
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="bg-[#F7B71D] text-[#385E31] text-[13px] font-bold px-10 py-2.5 rounded-[40px] shadow-sm hover:opacity-90 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loadingMore ? (
                  <>
                    <svg className="animate-spin" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
                      fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                    </svg>
                    Loading…
                  </>
                ) : "Load More"}
              </motion.button>
            )}

            {/* All loaded indicator */}
            {!loading && !error && logs.length > 0 && page >= totalPages && total > PAGE_SIZE && (
              <p className="text-[#385E31]/30 text-[12px] font-medium italic">
                All {total.toLocaleString()} entries loaded
              </p>
            )}
          </div>

        </motion.div>
      </motion.div>

      {/* Modals */}
      <NotificationModal  isOpen={isNotifsOpen}  onClose={() => setIsNotifsOpen(false)} />
      <ClientProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
    </div>
  );
}