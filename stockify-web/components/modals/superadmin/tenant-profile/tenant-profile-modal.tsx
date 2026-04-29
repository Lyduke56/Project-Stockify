"use client";

import React, { useEffect, useState } from "react";
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

// ── Spinner ───────────────────────────────────────────────────────────────────

const SpinnerIcon = () => (
  <svg
    className="animate-spin"
    xmlns="http://www.w3.org/2000/svg"
    width="28" height="28"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#385E31"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </svg>
);

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string | undefined) {
  if (!iso) return "N/A";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "2-digit",
    day:   "2-digit",
    year:  "numeric",
  });
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function TenantProfileModal({
  isOpen,
  tenantId,
  onClose,
  onSuccess,
}: TenantProfileModalProps) {

  const [activeTab,     setActiveTab]     = useState<TabId>("details");
  const [tenant,        setTenant]        = useState<TenantDetail | null>(null);
  const [loading,       setLoading]       = useState(false);
  const [fetchError,    setFetchError]    = useState("");

  // Action modal state
  const [activeAction,    setActiveAction]    = useState<ActionType | null>(null);
  const [actionLoading,   setActionLoading]   = useState(false);
  const [actionError,     setActionError]     = useState("");
  const [successMsg,      setSuccessMsg]      = useState("");

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

  // ── Suspend handler (passed to ConfirmActionModal) ──────────────────────────

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

  // ── Terminate handler (passed to ConfirmActionModal) ────────────────────────

  const handleTerminate = async (remarks?: string) => {
    if (!tenant) return;
    setActionLoading(true);
    setActionError("");
    try {
      const res    = await fetch("/app/api/superadmin/terminate", {
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

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="feedback-banner" 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={!actionLoading ? onClose : undefined}
          />

          {/* Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 20 }}
            animate={{ opacity: 1, scale: 1,    y: 0  }}
            exit={{    opacity: 0, scale: 0.94, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            className="relative z-10 w-full max-w-[780px] mx-4 bg-[#FFFCEB] rounded-[14px] shadow-2xl border border-[#385E31]/20 overflow-hidden flex flex-col"
            style={{ maxHeight: "90vh" }}
          >
            {/* ── Top accent bar ── */}
            <div className="h-1.5 w-full bg-[#385E31] shrink-0" />

            {/* ── Header banner ── */}
            <div className="bg-[#385E31] px-6 py-5 flex items-center justify-between gap-6 shrink-0">
              <div className="flex items-center gap-5">
                {/* Logo */}
                <div className="w-16 h-16 relative shrink-0">
                  <div className="absolute inset-0 bg-[#FFD980] rounded-[6px] border border-lime-800/40" />
                  <div className="absolute inset-0 flex items-center justify-center p-2">
                    {tenant?.logo_url ? (
                      <img
                        src={tenant.logo_url}
                        alt="Business Logo"
                        className="w-full h-full object-cover rounded"
                      />
                    ) : (
                      <img
                        src="/business-details.svg"
                        alt="Business"
                        className="w-full h-full object-contain"
                      />
                    )}
                  </div>
                </div>

                {/* Name + meta */}
                <div className="flex flex-col gap-1">
                  {loading ? (
                    <div className="h-6 w-48 bg-white/20 rounded animate-pulse" />
                  ) : (
                    <h1 className="text-orange-100 text-[20px] font-bold leading-tight">
                      {tenant?.business_name ?? "—"} &nbsp;|&nbsp; Tenant Profile
                    </h1>
                  )}
                  <span className="text-orange-100/80 text-[13px] font-medium">
                    Owner: {tenant?.owner_full_name ?? "—"}
                  </span>
                  <span className="text-orange-100/80 text-[13px] font-medium">
                    Registered: {formatDate(tenant?.created_at)}
                  </span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex flex-col gap-2 shrink-0">
                <button
                  onClick={() => setActiveAction("suspend")}
                  disabled={!tenant || loading}
                  className="border-2 border-[#E5AD24] text-[#E5AD24] font-bold text-[12px] px-5 py-1.5 rounded-[40px] hover:bg-[#E5AD24]/15 transition-colors disabled:opacity-40 whitespace-nowrap"
                >
                  Suspend Tenant
                </button>
                <button
                  onClick={() => setActiveAction("terminate")}
                  disabled={!tenant || loading}
                  className="border-2 border-[#E91F22] text-[#E91F22] font-bold text-[12px] px-5 py-1.5 rounded-[40px] hover:bg-[#E91F22]/15 transition-colors disabled:opacity-40 whitespace-nowrap"
                >
                  Terminate Tenant
                </button>
              </div>

              {/* Close ✕ */}
              <button
                onClick={onClose}
                disabled={actionLoading}
                className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors disabled:opacity-40"
                aria-label="Close"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
                  fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6"  y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* ── Feedback banners ── */}
            <AnimatePresence>
              {(successMsg || actionError) && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{    opacity: 0, height: 0     }}
                  className="px-6 pt-3 shrink-0"
                >
                  {successMsg && (
                    <p className="bg-[#e8f5e2] border border-[#385E31]/30 text-[#385E31] px-4 py-2 rounded text-[13px] font-medium">
                      ✓ {successMsg}
                    </p>
                  )}
                  {actionError && (
                    <p className="bg-red-100 border border-red-300 text-red-700 px-4 py-2 rounded text-[13px] font-medium">
                      {actionError}
                    </p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Tab bar ── */}
            <div className="flex gap-1 px-6 pt-4 shrink-0">
              {([
                { id: "details",  label: "Business Details"  },
                { id: "payments", label: "Payment History"   },
              ] as { id: TabId; label: string }[]).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-5 py-2 text-[13px] font-bold rounded-t-[6px] border-b-2 transition-all ${
                    activeTab === tab.id
                      ? "bg-[#385E31] text-[#FFFCEB] border-[#385E31]"
                      : "text-[#385E31]/60 border-transparent hover:text-[#385E31] hover:bg-[#385E31]/5"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
              <div className="flex-1 border-b-2 border-[#385E31]/10" />
            </div>

            {/* ── Scrollable body ── */}
            <div className="flex-1 overflow-y-auto px-6 pb-6 min-h-0">
              {/* Loading state */}
              {loading && (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <SpinnerIcon />
                  <p className="text-[#385E31] text-sm font-semibold animate-pulse">
                    Fetching tenant details…
                  </p>
                </div>
              )}

              {/* Error state */}
              {!loading && fetchError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm font-medium mt-4">
                  {fetchError}
                </div>
              )}

              {/* Content */}
              {!loading && !fetchError && tenant && (
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{    opacity: 0, y: 8 }}
                    transition={{ duration: 0.18 }}
                  >
                    {activeTab === "details"  && <BusinessDetailsTab tenant={tenant} />}
                    {activeTab === "payments" && <PaymentHistoryTab />}
                  </motion.div>
                </AnimatePresence>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* ── Suspend Modal ── */}
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

      {/* ── Terminate Modal ── */}
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
    </AnimatePresence>
  );
}