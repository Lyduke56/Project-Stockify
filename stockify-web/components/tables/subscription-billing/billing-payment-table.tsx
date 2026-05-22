"use client";

// components/superadmin/billing-payment-table.tsx

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import SendNotificationModal from "@/components/modals/superadmin/send-notification-modal";
import ConfirmActionModal    from "@/components/modals/confirm-tenant-action-modal";
import RecordPaymentModal   from "@/components/modals/superadmin/subscription-billing/record-payment-modal";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface BillingRow {
  tenant_id:           string;
  business_name:       string;
  owner_full_name:     string;
  owner_email:         string;
  subscription_status: string;
  display_status:      "Pending" | "Paid" | "Overdue" | "Missed";
  billing_period:      string | null;
  due_date:            string | null;
  grace_ends_at:       string | null;
  last_paid_at:        string | null;
  balance:             number;
  subscription_id:     string | null;
  next_billing_date:   string | null;
}

interface Props {
  rows:      BillingRow[];
  onRefresh: () => void;
  isLoading?: boolean;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const TABS = ["Overall", "Pending", "Paid", "Overdue", "Missed"] as const;
type BillingTab = typeof TABS[number];

const COLUMNS = [
  "BUSINESS NAME",
  "OWNER",
  "BILLING PERIOD",
  "DUE DATE",
  "LAST PAID",
  "PAYMENT STATUS",
  "BALANCE",
  "ACTIONS",
];

// ── Style helpers ─────────────────────────────────────────────────────────────

const getTabConfig = (tab: string) => {
  switch (tab) {
    case "Overall": return { bg: "bg-[#385E31]", text: "text-[#FFFCEB]" };
    case "Pending": return { bg: "bg-[#E5AD24]", text: "text-[#385E31]" };
    case "Paid":    return { bg: "bg-[#2D7A1E]", text: "text-[#FFFCEB]" };
    case "Overdue": return { bg: "bg-[#D97706]", text: "text-[#FFFCEB]" };
    case "Missed":  return { bg: "bg-[#CE0000]", text: "text-[#FFFCEB]" };
    default:        return { bg: "bg-[#385E31]", text: "text-[#FFFCEB]" };
  }
};

const getPillStyles = (status: string) => {
  switch (status) {
    case "Paid":    return { bg: "bg-[#385E31]", text: "text-[#FFFCEB]" };
    case "Pending": return { bg: "bg-[#E5AD24]", text: "text-[#385E31]" };
    case "Overdue": return { bg: "bg-[#FFD980]", text: "text-[#385E31]" };
    case "Missed":  return { bg: "bg-[#E91F22]", text: "text-[#FFFCEB]" };
    default:        return { bg: "bg-[#E2E8F0]", text: "text-[#475569]" };
  }
};

// ── Formatters ────────────────────────────────────────────────────────────────

const fmtDate = (iso: string | null) => {
  if (!iso) return "—";
  const d = iso.includes("T") ? new Date(iso) : new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-PH", { month: "2-digit", day: "2-digit", year: "numeric" });
};

const fmtPeriod = (iso: string | null) => {
  if (!iso) return "—";
  return new Date(iso + "T00:00:00").toLocaleDateString("en-PH", { month: "short", year: "numeric" });
};

const fmtPHP = (n: number) =>
  n === 0 ? "₱0.00" : "₱" + n.toLocaleString("en-PH", { minimumFractionDigits: 2 });

// ── SVG helpers ───────────────────────────────────────────────────────────────

const SearchIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);

const ChevronDown = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9"/>
  </svg>
);

// ── Skeleton Loader ───────────────────────────────────────────────────────────

const SkeletonRow = () => (
  <div
    className="w-full grid px-4 py-[13px] items-center border-b border-[#385E31]/10"
    style={{ gridTemplateColumns: "2fr 1.5fr 1.2fr 1.2fr 1.2fr 1.1fr 1.1fr 1fr" }}
  >
    <div className="px-1"><div className="h-4 bg-[#385E31]/10 rounded-full animate-pulse w-[80%]" style={{ animationDelay: "0ms" }} /></div>
    <div className="px-1"><div className="h-4 bg-[#385E31]/10 rounded-full animate-pulse w-[80%] mx-auto" style={{ animationDelay: "100ms" }} /></div>
    <div><div className="h-4 bg-[#385E31]/10 rounded-full animate-pulse w-[80%] mx-auto" style={{ animationDelay: "200ms" }} /></div>
    <div><div className="h-4 bg-[#385E31]/10 rounded-full animate-pulse w-[80%] mx-auto" style={{ animationDelay: "300ms" }} /></div>
    <div><div className="h-4 bg-[#385E31]/10 rounded-full animate-pulse w-[80%] mx-auto" style={{ animationDelay: "400ms" }} /></div>
    <div className="flex justify-center"><div className="h-[22px] bg-[#385E31]/10 rounded-[40px] animate-pulse w-[68px]" style={{ animationDelay: "500ms" }} /></div>
    <div><div className="h-4 bg-[#385E31]/10 rounded-full animate-pulse w-[80%] mx-auto" style={{ animationDelay: "600ms" }} /></div>
    <div className="flex justify-center"><div className="h-6 bg-[#385E31]/10 rounded-full animate-pulse w-[60px]" style={{ animationDelay: "700ms" }} /></div>
  </div>
);

// ── Component ─────────────────────────────────────────────────────────────────

export default function BillingPaymentTable({ rows, onRefresh, isLoading = false }: Props) {
  const router = useRouter();

  const [activeTab,      setActiveTab]      = useState<BillingTab>("Overall");
  const [search,         setSearch]         = useState("");
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [actionLoading,  setActionLoading]  = useState(false);
  const [actionError,    setActionError]    = useState("");
  const [successMsg,     setSuccessMsg]     = useState("");

  // Pagination limit
  const [visibleCount, setVisibleCount] = useState(10);

  // Selected tenant for modals
  const [selectedRow, setSelectedRow] = useState<BillingRow | null>(null);

  // Modal visibility
  const [showNotifyModal,  setShowNotifyModal]  = useState(false);
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const tableRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (tableRef.current && !tableRef.current.contains(e.target as Node)) {
        setOpenDropdownId(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Client-side filtering ──────────────────────────────────────────────────

  const filtered = rows
    .filter((r) => activeTab === "Overall" || r.display_status === activeTab)
    .filter((r) => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        r.business_name?.toLowerCase().includes(q) ||
        r.owner_full_name?.toLowerCase().includes(q)
      );
    });

  // Reset pagination on search or tab change
  useEffect(() => {
    setVisibleCount(10);
  }, [search, activeTab]);

  const visibleRows = filtered.slice(0, visibleCount);

  // ── Flash helper ───────────────────────────────────────────────────────────

  const flash = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(""), 4500);
  };

  // ── Action handlers ────────────────────────────────────────────────────────

  const withAction = async (fn: () => Promise<void>) => {
    setActionLoading(true);
    setActionError("");
    try { await fn(); }
    catch (e: any) { setActionError(e.message ?? "Action failed."); }
    finally { setActionLoading(false); }
  };

  const handleSendNotification = async (fields: {
    title: string; header: string; about: string; body: string; description: string;
  }) => {
    if (!selectedRow) return;
    await withAction(async () => {
      const res    = await fetch("/api/superadmin/notify", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ tenantId: selectedRow.tenant_id, ...fields }),
      });
      const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result.error ?? "Notification failed.");
      setShowNotifyModal(false);
      setSelectedRow(null);
      flash(`Notification sent to ${selectedRow.business_name}.`);
      onRefresh();
    });
  };

  const handleSuspend = async (reason?: string) => {
    if (!selectedRow) return;
    await withAction(async () => {
      const res    = await fetch("/api/superadmin/suspend", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          tenantId: selectedRow.tenant_id,
          reason:   reason?.trim() || "Overdue subscription payment",
        }),
      });
      const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result.error ?? "Suspend failed.");
      setShowSuspendModal(false);
      setSelectedRow(null);
      flash(`${selectedRow.business_name} has been suspended.`);
      onRefresh();
    });
  };

  // ── Tab counts ─────────────────────────────────────────────────────────────

  const tabCount = (tab: BillingTab) =>
    tab === "Overall" ? rows.length : rows.filter((r) => r.display_status === tab).length;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      {/* Feedback banners */}
      {actionError && (
        <p className="w-full text-red-600 bg-red-50 border border-red-200 px-4 py-2 rounded-[8px] mb-4 text-sm font-medium">
          {actionError}
        </p>
      )}
      {successMsg && (
        <p className="w-full text-[#385E31] bg-[#e8f5e2] border border-[#385E31]/30 px-4 py-2 rounded-[8px] mb-4 text-sm font-medium">
          ✓ {successMsg}
        </p>
      )}

      {/* ── 5-Tab Navigator ─────────────────────────────────────────────────── */}
      <div className="w-full flex justify-center mb-8">
        <div className="relative flex w-full max-w-[900px] h-[45px] items-center my-2">
          
          {/* Outer border */}
          <div className="absolute inset-0 border-2 border-[#385E31] rounded-[8px] pointer-events-none" />

          {/* Sliding pill */}
          <div
            className={`absolute top-[-2px] bottom-[-2px] rounded-[8px] transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] z-10 ${getTabConfig(activeTab).bg}`}
            style={{
              width: "calc(20% + 4px)",
              left:  `calc(${TABS.indexOf(activeTab) * 20}% - 2px)`,
            }}
          />

          {/* Tab buttons */}
          {TABS.map((tab) => {
            const isActive = activeTab === tab;
            const count    = tabCount(tab);
            return (
              <button
                key={tab}
                onClick={() => { setActiveTab(tab); setOpenDropdownId(null); }}
                className={`flex-1 h-full z-20 text-center font-bold text-[16px] transition-colors duration-300 flex items-center justify-center gap-1.5 cursor-pointer ${
                  isActive ? getTabConfig(tab).text : "text-[#385E31]"
                }`}
              >
                <span>{tab}</span>
                {tab !== "Overall" && count > 0 && (
                  <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-full ${
                    isActive
                      ? "bg-white/20"
                      : "bg-[#385E31]/10"
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Search + Filter ──────────────────────────────────────────────────── */}
      <div className="w-full flex justify-between items-center mb-4 gap-4">
        <div className="relative flex-1 max-w-[60%]">
          <input
            type="text"
            placeholder="Search by business or owner name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border border-[#385E31] rounded-full px-5 py-2 bg-transparent text-[#385E31] placeholder-[#385E31]/50 outline-none font-medium text-[14px]"
          />
          <div className="absolute right-4 top-2.5 text-[#385E31]"><SearchIcon /></div>
        </div>
        <div className="text-[#385E31] text-[13px] font-semibold opacity-60">
          {filtered.length} record{filtered.length !== 1 ? "s" : ""}
        </div>
      </div>

      {/* ── Data Table ───────────────────────────────────────────────────────── */}
      <div
        ref={tableRef}
        className="w-full bg-[#FFFCEB] rounded-[10px] border border-[#385E31] flex flex-col shadow-sm"
      >
        {/* Header */}
        <div className="w-full grid px-4 py-3 rounded-t-[8px] bg-[#385E31]"
          style={{ gridTemplateColumns: "2fr 1.5fr 1.2fr 1.2fr 1.2fr 1.1fr 1.1fr 1fr" }}>
          {COLUMNS.map((col) => (
            <div key={col} className="text-center text-[#FFFCEB] text-[12px] font-bold">
              {col}
            </div>
          ))}
        </div>

        {/* Rows */}
        {isLoading ? (
           Array.from({ length: 10 }).map((_, idx) => <SkeletonRow key={idx} />)
        ) : filtered.length === 0 ? (
          <div className="w-full text-center py-12 text-[#385E31]/50 font-semibold text-sm">
            {search ? "No results match your search." : `No ${activeTab === "Overall" ? "" : activeTab.toLowerCase() + " "}records found.`}
          </div>
        ) : (
          visibleRows.map((row, idx) => {
            const { bg, text } = getPillStyles(row.display_status);
            const isLast = idx === visibleRows.length - 1;
            const rowKey = row.subscription_id ?? `${row.tenant_id}-${idx}`;
            const isOpen = openDropdownId === rowKey;

            // Grace window warning
            const inGrace = row.grace_ends_at && row.display_status === "Overdue";
            const graceDaysLeft = inGrace
              ? Math.ceil(
                  (new Date(row.grace_ends_at!).getTime() - Date.now()) / 86_400_000
                )
              : null;

            return (
              <div
                key={row.subscription_id || `${row.tenant_id}-${idx}`}
                className={`w-full grid px-4 py-[13px] items-center transition-colors hover:bg-[#385E31]/[0.02] ${
                  !isLast ? "border-b border-[#385E31]/15" : ""
                }`}
                style={{ gridTemplateColumns: "2fr 1.5fr 1.2fr 1.2fr 1.2fr 1.1fr 1.1fr 1fr" }}
              >
                {/* Business Name */}
                <div className="text-center px-1">
                  <span
                    onClick={() => router.push(`/superadmin/tenant-profile/${row.tenant_id}`)}
                    className="text-[#3A6131] text-[12px] font-bold cursor-pointer hover:text-[#E5AD24] hover:underline transition-colors"
                  >
                    {row.business_name}
                  </span>
                  {inGrace && graceDaysLeft !== null && graceDaysLeft <= 3 && (
                    <p className="text-[#E91F22] text-[9px] font-bold mt-0.5">
                      ⚠ {graceDaysLeft <= 0 ? "Grace expired!" : `${graceDaysLeft}d grace left`}
                    </p>
                  )}
                </div>

                {/* Owner */}
                <div className="text-center text-[#3A6131] text-[12px] font-bold px-1">
                  {row.owner_full_name}
                </div>

                {/* Billing Period */}
                <div className="text-center text-[#3A6131] text-[12px] font-bold">
                  {fmtPeriod(row.billing_period)}
                </div>

                {/* Due Date */}
                <div className={`text-center text-[12px] font-bold ${
                  row.display_status === "Overdue" || row.display_status === "Missed"
                    ? "text-[#E91F22]"
                    : "text-[#3A6131]"
                }`}>
                  {fmtDate(row.due_date)}
                </div>

                {/* Last Paid */}
                <div className="text-center text-[#3A6131] text-[12px] font-bold">
                  {fmtDate(row.last_paid_at)}
                </div>

                {/* Status pill */}
                <div className="flex justify-center items-center">
                  <div className={`w-[68px] py-[4px] rounded-[40px] flex justify-center items-center ${bg}`}>
                    <span className={`${text} text-[10px] font-bold leading-tight`}>
                      {row.display_status}
                    </span>
                  </div>
                </div>

                {/* Balance */}
                <div className={`text-center text-[12px] font-bold ${
                  row.balance > 0 ? "text-[#E91F22]" : "text-[#3A6131]"
                }`}>
                  {fmtPHP(row.balance)}
                </div>

                {/* Actions dropdown */}
                <div className="flex justify-center items-center relative">
                  <button
                    onClick={() => setOpenDropdownId((p) => (p === rowKey ? null : rowKey))}
                    className={`border border-[#385E31] rounded-full px-3 py-1 text-[10px] font-bold flex items-center gap-1 transition-colors ${
                      isOpen
                        ? "bg-[#385E31] text-[#FFFCEB]"
                        : "text-[#385E31] hover:bg-[#385E31]/10"
                    }`}
                  >
                    Action <ChevronDown />
                  </button>

                  {isOpen && (
                    <div className="absolute top-8 right-0 w-[172px] bg-[#FFFCEB] border border-[#385E31] shadow-lg rounded-[6px] z-30 py-1 overflow-hidden text-[#385E31] text-[11px] font-semibold flex flex-col">

                      {/* Record Payment — always shown */}
                      <button
                        onClick={() => {
                          setSelectedRow(row);
                          setOpenDropdownId(null);
                          setShowPaymentModal(true);
                        }}
                        className="px-3 py-2 hover:bg-[#E5AD24] text-left transition-colors flex items-center gap-2"
                      >
                        {row.display_status === "Paid" ? (
                          <>
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24"
                              fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="12" cy="12" r="10"/>
                              <polyline points="12 6 12 12 16 14"/>
                            </svg>
                            Billing History
                          </>
                        ) : (
                          <>
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24"
                              fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <rect x="2" y="5" width="20" height="14" rx="2"/>
                              <line x1="2" y1="10" x2="22" y2="10"/>
                            </svg>
                            Record Payment
                          </>
                        )}
                      </button>

                      {/* Send Notification — all except Paid */}
                      {row.display_status !== "Paid" && (
                        <button
                          onClick={() => {
                            setSelectedRow(row);
                            setOpenDropdownId(null);
                            setShowNotifyModal(true);
                          }}
                          className="px-3 py-2 hover:bg-[#E5AD24] text-left transition-colors flex items-center gap-2"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24"
                            fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                          </svg>
                          Send Notification
                        </button>
                      )}

                      {/* Trigger Suspension — only Overdue */}
                      {row.display_status === "Overdue" && (
                        <button
                          onClick={() => {
                            setSelectedRow(row);
                            setOpenDropdownId(null);
                            setShowSuspendModal(true);
                          }}
                          className="px-3 py-2 hover:bg-[#E5AD24] text-left transition-colors flex items-center gap-2 text-[#D97706]"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24"
                            fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10"/>
                            <line x1="10" y1="15" x2="10" y2="9"/>
                            <line x1="14" y1="15" x2="14" y2="9"/>
                          </svg>
                          Trigger Suspension
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination Controls */}
      <div className="w-full flex justify-end mt-6 gap-3">
        {visibleCount > 10 && (
          <button 
            onClick={() => setVisibleCount(10)}
            className="border border-[#385E31] text-[#385E31] text-[15px] font-bold px-10 py-2.5 rounded-[40px] hover:bg-[#385E31]/5 transition-colors"
          >
            Show Less
          </button>
        )}
        {visibleCount < filtered.length && (
          <button 
            onClick={() => setVisibleCount(prev => prev + 10)}
            className="bg-[#F7B71D] text-[#385E31] text-[15px] font-bold px-10 py-2.5 rounded-[40px] shadow-sm hover:opacity-90 transition-opacity"
          >
            Load More
          </button>
        )}
      </div>

      {/* ── Modals ───────────────────────────────────────────────────────────── */}

      {/* Record Payment */}
      <RecordPaymentModal
        isOpen={showPaymentModal}
        tenantId={selectedRow?.tenant_id ?? null}
        onClose={() => { setShowPaymentModal(false); setSelectedRow(null); }}
        onPaid={() => {
          onRefresh();
          flash(`Payment recorded for ${selectedRow?.business_name ?? "tenant"}.`);
        }}
      />

      {/* Send Notification */}
      <SendNotificationModal
        isOpen={showNotifyModal}
        tenantName={selectedRow?.business_name ?? ""}
        nextBillingDate={selectedRow?.next_billing_date ?? null}
        isLoading={actionLoading}
        onConfirm={handleSendNotification}
        onClose={() => { setShowNotifyModal(false); setSelectedRow(null); setActionError(""); }}
      />

      {/* Trigger Suspension */}
      <ConfirmActionModal
        isOpen={showSuspendModal}
        actionType="suspend"
        tenantName={selectedRow?.business_name ?? ""}
        isLoading={actionLoading}
        onConfirm={handleSuspend}
        onClose={() => { setShowSuspendModal(false); setSelectedRow(null); setActionError(""); }}
      />
    </>
  );
}