"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";

import BusinessDetailsTab, { TenantDetail } from "./business-details-tab";
import PaymentHistoryTab from "./payment-history-tab";
import ConfirmActionModal from "@/components/modals/confirm-tenant-action-modal";

// ── Types ─────────────────────────────────────────────────────────────────────

type ActionType = "suspend" | "terminate";
type TabId      = "details" | "payments";

interface TenantProfileModalProps {
  isOpen:    boolean;
  tenantId:  string | null;
  onClose:   () => void;
  onSuccess?: (tenantId: string, action: ActionType) => void;
}

// ── Icons ─────────────────────────────────────────────────────────────────────

const XIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const LoaderIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
    className="animate-spin">
    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
  </svg>
);

const StoreIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
    <polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
);

const ReceiptIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1-2-1Z"/>
    <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/>
    <path d="M12 17.5v-11"/>
  </svg>
);

const AlertTriangleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
    <line x1="12" y1="9" x2="12" y2="13"/>
    <line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);

const ShieldAlertIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    <line x1="12" y1="8" x2="12" y2="12"/>
    <line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
);

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string | undefined) {
  if (!iso) return "N/A";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day:   "numeric",
    year:  "numeric",
  });
}

function getPill(status: string | undefined) {
  switch (status) {
    case "Active":    return { bg: "bg-[#3A6131]", text: "text-[#FFFCEB]" };
    case "Pending":   return { bg: "bg-[#F7B71D]", text: "text-[#3A6131]" };
    case "Overdue":   return { bg: "bg-[#FFD980]", text: "text-[#3A6131]" };
    case "Suspended": return { bg: "bg-[#E91F22]", text: "text-[#FFFCEB]" };
    default:          return { bg: "bg-white/20",  text: "text-white" };
  }
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function TenantProfileModal({
  isOpen,
  tenantId,
  onClose,
  onSuccess,
}: TenantProfileModalProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); return () => setMounted(false); }, []);

  const [activeTab,      setActiveTab]      = useState<TabId>("details");
  const [tenant,         setTenant]         = useState<TenantDetail | null>(null);
  const [loading,        setLoading]        = useState(false);
  const [fetchError,     setFetchError]     = useState("");

  // Action modal state
  const [activeAction,   setActiveAction]   = useState<ActionType | null>(null);
  const [actionLoading,  setActionLoading]  = useState(false);
  const [actionError,    setActionError]    = useState("");
  const [successMsg,     setSuccessMsg]     = useState("");

  const TABS: { id: TabId; label: string; Icon: React.FC }[] = [
    { id: "details",  label: "Business Details", Icon: StoreIcon },
    { id: "payments", label: "Payment History",  Icon: ReceiptIcon },
  ];

  // ── Fetch tenant on open ────────────────────────────────────────────────────

  useEffect(() => {
    if (!isOpen || !tenantId) {
      // Reset when closing
      setTenant(null);
      setFetchError("");
      setActiveTab("details");
      setActiveAction(null);
      setActionError("");
      setSuccessMsg("");
      return;
    }

    const fetchTenant = async () => {
      setLoading(true);
      setFetchError("");
      try {
        const res = await fetch(`/api/superadmin/tenant/${tenantId}`);
        const result = await res.json();
        if (!res.ok || result.error) throw new Error(result.error ?? "Failed to load tenant.");
        setTenant(result.data ?? result);
      } catch (err: unknown) {
        setFetchError(err instanceof Error ? err.message : "Failed to load tenant.");
      } finally {
        setLoading(false);
      }
    };

    fetchTenant();
  }, [isOpen, tenantId]);

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleSuspend = async (reason?: string) => {
    if (!tenant) return;
    setActionLoading(true);
    setActionError("");
    try {
      const res    = await fetch("/api/superadmin/suspend", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          tenantId: tenant.tenant_id,
          reason:   reason?.trim() || "Overdue subscription payment",
        }),
      });
      const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result.error ?? "Suspend failed.");

      setActiveAction(null);
      flash("Tenant has been suspended successfully.");
      onSuccess?.(tenant.tenant_id, "suspend");
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : "Action failed.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleTerminate = async (remarks?: string) => {
    if (!tenant) return;
    setActionLoading(true);
    setActionError("");
    try {
      const res    = await fetch("/api/superadmin/terminate", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          tenantId: tenant.tenant_id,
          remarks:  remarks?.trim() || "Administrative decision — please contact support for details.",
        }),
      });
      const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result.error ?? "Termination failed.");

      setActiveAction(null);
      flash("Tenant has been permanently terminated.");
      onSuccess?.(tenant.tenant_id, "terminate");

      // Close the profile modal after a short delay
      setTimeout(onClose, 1800);
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : "Action failed.");
    } finally {
      setActionLoading(false);
    }
  };

  const flash = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(""), 4000);
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        onClick={!actionLoading ? onClose : undefined}
      />

      {/* Modal Container */}
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="w-full max-w-[1000px] bg-[#FFFCEB] rounded-[32px] overflow-hidden border-[1.5px] border-[#F7B71D]/20 shadow-[0_32px_80px_rgba(58,97,49,0.2)] flex flex-col md:flex-row h-[700px] font-['Inter'] relative z-10"
      >
        {/* LEFT SIDEBAR */}
        <div className="w-full md:w-[340px] bg-[#3A6131] p-10 flex flex-col relative overflow-hidden shrink-0">
          <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-[#F7B71D]/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 flex flex-col h-full">
            <div className="bg-[#F7B71D] w-12 h-1 rounded-full mb-8" />
            
            {/* Tenant Meta Info */}
            <div className="mb-10">
              <div className="w-20 h-20 rounded-[20px] bg-white/10 border border-white/20 p-1 mb-5 relative shrink-0 shadow-lg">
                {tenant?.logo_url ? (
                  <img
                    src={tenant.logo_url}
                    alt="Logo"
                    className="w-full h-full object-cover rounded-[16px]"
                  />
                ) : (
                  <div className="w-full h-full bg-[#3A6131] rounded-[16px] flex items-center justify-center">
                    <StoreIcon />
                  </div>
                )}
              </div>

              {loading ? (
                <div className="space-y-2">
                  <div className="h-6 w-3/4 bg-white/20 rounded animate-pulse" />
                  <div className="h-4 w-1/2 bg-white/10 rounded animate-pulse" />
                </div>
              ) : (
                <>
                  <h2 className="text-[#FFFCEB] text-2xl font-black leading-tight tracking-wide font-['Raleway'] mb-1">
                    {tenant?.business_name ?? "—"}
                  </h2>
                  <p className="text-[#FFFCEB]/70 text-[13px] font-medium mb-4">
                    {tenant?.owner_full_name ?? "—"}
                  </p>
                  
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between text-[11px] font-bold border-b border-white/10 pb-2">
                      <span className="text-white/50 uppercase tracking-widest">Status</span>
                      <span className={`px-2 py-0.5 rounded-full ${getPill(tenant?.subscription_status).bg} ${getPill(tenant?.subscription_status).text}`}>
                        {tenant?.subscription_status || "—"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] font-bold pt-1">
                      <span className="text-white/50 uppercase tracking-widest">Registered</span>
                      <span className="text-white/90">{formatDate(tenant?.created_at)}</span>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Navigation Tabs */}
            <nav className="flex flex-col gap-4 mt-4">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={`flex items-center gap-4 transition-all duration-300 w-full text-left outline-none ${
                    activeTab === t.id ? "translate-x-2" : "opacity-40 hover:opacity-70"
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                      activeTab === t.id
                        ? "bg-[#F7B71D] text-[#3A6131] shadow-lg shadow-[#F7B71D]/20"
                        : "bg-white/10 text-white"
                    }`}
                  >
                    <t.Icon />
                  </div>
                  <span
                    className={`text-[13px] font-bold tracking-wide ${
                      activeTab === t.id ? "text-[#FFFCEB]" : "text-white"
                    }`}
                  >
                    {t.label}
                  </span>
                </button>
              ))}
            </nav>

            <div className="mt-auto pt-8">
              <div className="flex gap-2">
                {TABS.map((t) => (
                  <div
                    key={t.id}
                    className={`h-1.5 rounded-full transition-all duration-500 ${
                      activeTab === t.id ? "w-8 bg-[#F7B71D]" : "w-2 bg-white/20"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT CONTENT */}
        <div className="flex-1 flex flex-col relative bg-white/50 backdrop-blur-sm overflow-hidden">
          <button
            onClick={onClose}
            className="absolute top-6 right-6 w-10 h-10 rounded-full bg-[#FFFCEB] border border-[#3A6131]/10 flex items-center justify-center text-[#3A6131] hover:bg-[#3A6131] hover:text-[#FFFCEB] transition-all z-20"
          >
            <XIcon />
          </button>

          <div className="flex-1 overflow-y-auto p-10 [&::-webkit-scrollbar]:w-[5px] [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[#3A6131]/15 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-[#3A6131]/25">
            
            {/* Header */}
            <div className="mb-6">
              <span className="bg-[#F7B71D]/15 text-[#3A6131] text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest flex items-center gap-2 w-max">
                {activeTab === "details" ? <StoreIcon /> : <ReceiptIcon />}
                {activeTab === "details" ? "Overview" : "Records"}
              </span>
              <h3 className="text-2xl font-black text-[#3A6131] mt-3 italic font-['Raleway']">
                {activeTab === "details" ? "Business Details" : "Payment History"}
              </h3>
            </div>

            {/* Feedback Banners */}
            <AnimatePresence>
              {fetchError && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                  <div className="mb-6 px-4 py-3 bg-red-50 border border-red-200 rounded-2xl text-red-600 text-xs font-semibold">
                    ✕ {fetchError}
                  </div>
                </motion.div>
              )}
              {actionError && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                  <div className="mb-6 px-4 py-3 bg-red-50 border border-red-200 rounded-2xl text-red-600 text-xs font-semibold">
                    ✕ {actionError}
                  </div>
                </motion.div>
              )}
              {successMsg && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                  <div className="mb-6 px-4 py-3 bg-[#3A6131]/10 border border-[#3A6131]/20 rounded-2xl text-[#3A6131] text-xs font-semibold">
                    ✓ {successMsg}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Tab Content */}
            <div className="w-full">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                  <LoaderIcon />
                  <p className="text-[#3A6131]/60 text-sm font-semibold animate-pulse">
                    Fetching records…
                  </p>
                </div>
              ) : tenant ? (
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    {activeTab === "details"  && <BusinessDetailsTab tenant={tenant} />}
                    {activeTab === "payments" && <PaymentHistoryTab tenantId={tenant.tenant_id} />}
                  </motion.div>
                </AnimatePresence>
              ) : null}
            </div>
          </div>

          {/* Sticky Footer for Actions */}
          <div className="px-8 py-5 border-t border-[#3A6131]/10 bg-white/80 flex justify-between items-center z-20 shrink-0 gap-3">
            <div className="text-[11px] font-bold text-[#3A6131]/40 uppercase tracking-widest">
              Administrative Actions
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setActiveAction("suspend")}
                disabled={!tenant || loading || actionLoading}
                className="bg-white border-2 border-[#E5AD24] text-[#E5AD24] px-6 py-2.5 rounded-xl text-[12px] font-bold flex items-center justify-center gap-2 hover:bg-[#E5AD24]/10 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <AlertTriangleIcon />
                Suspend Tenant
              </button>
              <button
                onClick={() => setActiveAction("terminate")}
                disabled={!tenant || loading || actionLoading}
                className="bg-[#E91F22] text-white px-6 py-2.5 rounded-xl text-[12px] font-bold flex items-center justify-center gap-2 hover:bg-[#C01A1D] transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ShieldAlertIcon />
                Terminate Tenant
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Action Modals (Portaled over everything) ── */}
      <ConfirmActionModal
        key="suspend-modal"
        isOpen={activeAction === "suspend"}
        actionType="suspend"
        tenantName={tenant?.business_name ?? "this tenant"}
        isLoading={actionLoading}
        onConfirm={handleSuspend}
        onClose={() => {
          if (!actionLoading) {
            setActiveAction(null);
            setActionError("");
          }
        }}
      />

      <ConfirmActionModal
        key="terminate-modal"
        isOpen={activeAction === "terminate"}
        actionType="terminate"
        tenantName={tenant?.business_name ?? "this tenant"}
        isLoading={actionLoading}
        onConfirm={handleTerminate}
        onClose={() => {
          if (!actionLoading) {
            setActiveAction(null);
            setActionError("");
          }
        }}
      />
    </div>,
    document.body
  );
}