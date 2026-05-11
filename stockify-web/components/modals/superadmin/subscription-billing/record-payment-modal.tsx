"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";

// ── Types ─────────────────────────────────────────────────────────────────────

interface PaymentRecord {
  subscription_id:      string;
  billing_period:       string;
  payment_status:       "Pending" | "Paid" | "Overdue";
  amount:               number;
  paid_at:              string | null;
  overdue_at:           string | null;
  grace_ends_at:        string | null;
  notification_sent_at: string | null;
}

interface TenantInfo {
  tenant_id:           string;
  business_name:       string;
  owner_full_name:     string;
  owner_email:         string;
  subscription_status: string;
}

export interface PaymentSubmission {
  submission_id:   string;
  tenant_id:       string;
  subscription_id: string | null;
  proof_url:       string;
  amount_declared: number | null;
  remarks_tenant:  string | null;
  remarks_admin:   string | null;
  status:          "Pending" | "Accepted" | "Rejected";
  reviewed_at:     string | null;
  created_at:      string;
}

export interface RecordPaymentModalProps {
  isOpen:   boolean;
  tenantId: string | null;
  onClose:  () => void;
  onPaid?:  () => void;
}

type ModalTab = "submissions" | "records";

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmtDate = (iso: string | null) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-PH", {
    month: "short", day: "numeric", year: "numeric",
  });
};

const fmtPeriod = (iso: string) =>
  new Date(iso + "T00:00:00").toLocaleDateString("en-PH", {
    month: "long", year: "numeric",
  });

const fmtPHP = (n: number) =>
  "₱" + n.toLocaleString("en-PH", { minimumFractionDigits: 2 });

const getPill = (status: string) => {
  switch (status) {
    case "Paid":     return { bg: "bg-[#3A6131]", text: "text-[#FFFCEB]" };
    case "Pending":  return { bg: "bg-[#F7B71D]", text: "text-[#3A6131]" };
    case "Overdue":  return { bg: "bg-[#FFD980]", text: "text-[#3A6131]" };
    case "Accepted": return { bg: "bg-[#3A6131]", text: "text-[#FFFCEB]" };
    case "Rejected": return { bg: "bg-[#E91F22]", text: "text-[#FFFCEB]" };
    default:         return { bg: "bg-[#E2E8F0]", text: "text-[#475569]" };
  }
};

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

const InboxIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/>
    <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>
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

// ── Proof Image Lightbox ──────────────────────────────────────────────────────

function ProofImageViewer({ url }: { url: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-[#3A6131] text-[11px] font-bold underline underline-offset-2 hover:text-[#F7B71D] transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
          <circle cx="8.5" cy="8.5" r="1.5"/>
          <polyline points="21 15 16 10 5 21"/>
        </svg>
        View Proof Screenshot
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/80 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              onClick={(e) => e.stopPropagation()}
              className="relative bg-white rounded-[24px] p-4 shadow-2xl max-w-[88vw] max-h-[88vh] overflow-auto flex flex-col items-center"
            >
              <button
                onClick={() => setOpen(false)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/5 flex items-center justify-center hover:bg-black/10 transition-colors z-10"
              >
                <XIcon />
              </button>

              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt="Proof of Payment"
                className="max-w-[80vw] max-h-[75vh] object-contain rounded-[12px]"
              />
              <p className="text-center text-[12px] text-gray-400 mt-4 font-semibold">
                Proof of Payment · Click outside to close
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function RecordPaymentModal({
  isOpen,
  tenantId,
  onClose,
  onPaid,
}: RecordPaymentModalProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); return () => setMounted(false); }, []);

  const [activeTab,    setActiveTab]    = useState<ModalTab>("submissions");
  const [tenant,       setTenant]       = useState<TenantInfo | null>(null);
  const [records,      setRecords]      = useState<PaymentRecord[]>([]);
  const [submissions,  setSubmissions]  = useState<PaymentSubmission[]>([]);
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState("");
  const [success,      setSuccess]      = useState("");

  // Manual mark-paid flow
  const [confirm,      setConfirm]      = useState<PaymentRecord | null>(null);
  const [paying,       setPaying]       = useState<string | null>(null);
  const [manualAmount, setManualAmount] = useState("");

  // Accept / Reject flow
  const [reviewTarget,   setReviewTarget]   = useState<PaymentSubmission | null>(null);
  const [reviewAction,   setReviewAction]   = useState<"accept" | "reject" | null>(null);
  const [remarksAdmin,   setRemarksAdmin]   = useState("");
  const [amountOverride, setAmountOverride] = useState("");
  const [reviewing,      setReviewing]      = useState(false);

  // ── Flash helpers ──────────────────────────────────────────────────────────

  const flashSuccess = (msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(""), 5000);
  };
  const flashError = (msg: string) => {
    setError(msg);
    setTimeout(() => setError(""), 5000);
  };

  // ── Fetch data ─────────────────────────────────────────────────────────────

  const fetchRecords = async () => {
    if (!tenantId) return;
    setLoading(true);
    try {
      const res  = await fetch(`/api/cron/billing/records?tenantId=${tenantId}`);
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setTenant(json.tenant);
      setRecords(json.records ?? []);
    } catch (e: any) {
      flashError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubmissions = async () => {
    if (!tenantId) return;
    try {
      const res  = await fetch(`/api/superadmin/payment-submissions?tenantId=${tenantId}`);
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setSubmissions(json.submissions ?? []);
    } catch (e: any) {
      flashError(e.message);
    }
  };

  useEffect(() => {
    if (isOpen && tenantId) {
      setSuccess(""); setError("");
      setConfirm(null); setManualAmount("");
      setReviewTarget(null); setReviewAction(null);
      setRemarksAdmin(""); setAmountOverride("");
      setActiveTab("submissions");
      fetchRecords();
      fetchSubmissions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, tenantId]);

  // ── Manual mark-paid ───────────────────────────────────────────────────────

  const handleMarkPaid = async (record: PaymentRecord) => {
    setPaying(record.subscription_id);
    setError("");
    try {
      const res  = await fetch("/api/cron/billing", {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          subscriptionId: record.subscription_id,
          tenantId,
          ...(manualAmount ? { amountOverride: parseFloat(manualAmount) } : {}),
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error ?? "Failed to record payment.");
      flashSuccess(`Payment for ${fmtPeriod(record.billing_period)} recorded successfully.`);
      setConfirm(null); setManualAmount("");
      await fetchRecords();
      onPaid?.();
    } catch (e: any) {
      flashError(e.message);
    } finally {
      setPaying(null);
    }
  };

  // ── Accept / Reject submission ─────────────────────────────────────────────

  const handleReview = async () => {
    if (!reviewTarget || !reviewAction) return;
    if (reviewAction === "reject" && !remarksAdmin.trim()) {
      flashError("Please provide a reason for rejection.");
      return;
    }
    setReviewing(true);
    setError("");
    try {
      const endpoint = `/api/superadmin/payment-submissions/${reviewTarget.submission_id}/${reviewAction}`;
      const res = await fetch(endpoint, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          remarksAdmin:   remarksAdmin.trim() || null,
          amountOverride: amountOverride ? parseFloat(amountOverride) : undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error ?? "Action failed.");

      flashSuccess(
        reviewAction === "accept"
          ? "Payment submission accepted and recorded successfully."
          : "Payment submission rejected."
      );
      setReviewTarget(null); setReviewAction(null);
      setRemarksAdmin(""); setAmountOverride("");
      await fetchSubmissions();
      await fetchRecords();
      if (reviewAction === "accept") onPaid?.();
    } catch (e: any) {
      flashError(e.message);
    } finally {
      setReviewing(false);
    }
  };

  // ── Derived values ─────────────────────────────────────────────────────────

  const unpaidCount     = records.filter((r) => r.payment_status !== "Paid").length;
  const totalBalance    = records
    .filter((r) => r.payment_status !== "Paid")
    .reduce((s, r) => s + Number(r.amount), 0);
  const pendingSubCount = submissions.filter((s) => s.status === "Pending").length;

  const TABS: { key: ModalTab; label: string; Icon: React.FC; badge: number }[] = [
    { key: "submissions", label: "Submissions", Icon: InboxIcon, badge: pendingSubCount },
    { key: "records", label: "Billing Records", Icon: ReceiptIcon, badge: unpaidCount },
  ];

  // ── Styles ─────────────────────────────────────────────────────────────────
  const labelStyle = "text-[11px] font-black uppercase tracking-[0.12em] text-[#3A6131]/50 mb-2 block";
  const inputStyle = "w-full bg-white border-[1.5px] border-[#3A6131]/10 rounded-2xl px-4 py-3 text-sm text-[#3A6131] font-medium focus:outline-none focus:border-[#F7B71D] focus:ring-4 focus:ring-[#F7B71D]/10 transition-all placeholder:text-gray-300";

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        onClick={onClose}
      />

      {/* Modal Container */}
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        className="w-full max-w-[920px] bg-[#FFFCEB] rounded-[32px] overflow-hidden border-[1.5px] border-[#F7B71D]/20 shadow-[0_32px_80px_rgba(58,97,49,0.2)] flex flex-col md:flex-row h-[650px] font-['Inter'] relative z-10"
      >
        {/* LEFT SIDEBAR */}
        <div className="w-full md:w-[320px] bg-[#3A6131] p-10 flex flex-col relative overflow-hidden shrink-0">
          <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-[#F7B71D]/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10">
            <div className="bg-[#F7B71D] w-12 h-1 rounded-full mb-8" />
            <h2 className="text-[#FFFCEB] text-3xl font-black leading-tight mb-2 tracking-wide uppercase font-['Raleway']">
              Payments
            </h2>
            {tenant ? (
              <p className="text-[#FFFCEB]/70 text-[13px] font-medium leading-relaxed mb-8">
                {tenant.business_name} <br/> 
                <span className="opacity-75">{tenant.owner_full_name}</span>
              </p>
            ) : (
              <div className="h-10 mb-8" /> // placeholder
            )}

            {/* Total Due Badge */}
            {!loading && unpaidCount > 0 && (
              <div className="mb-8 p-5 bg-red-500/20 border border-red-500/30 rounded-2xl shadow-inner">
                <p className="text-red-200 text-[10px] font-black uppercase tracking-widest mb-1">
                  Total Due ({unpaidCount} unpaid)
                </p>
                <p className="text-white text-3xl font-black tracking-tight">
                  {fmtPHP(totalBalance)}
                </p>
              </div>
            )}

            <nav className="flex flex-col gap-6">
              {TABS.map((t) => (
                <button
                  key={t.key}
                  onClick={() => {
                    setActiveTab(t.key);
                    setConfirm(null);
                    setReviewTarget(null);
                    setReviewAction(null);
                  }}
                  className={`flex items-center gap-4 transition-all duration-300 w-full text-left outline-none ${
                    activeTab === t.key ? "translate-x-2" : "opacity-40 hover:opacity-70"
                  }`}
                >
                  <div
                    className={`relative w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                      activeTab === t.key
                        ? "bg-[#F7B71D] text-[#3A6131] shadow-lg shadow-[#F7B71D]/20"
                        : "bg-white/10 text-white"
                    }`}
                  >
                    <t.Icon />
                    {/* Notification Badge */}
                    {t.badge > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 bg-[#E91F22] text-white text-[9px] w-4 h-4 flex items-center justify-center rounded-full font-extrabold border border-[#3A6131]">
                        {t.badge}
                      </span>
                    )}
                  </div>
                  <span
                    className={`text-sm font-bold tracking-wide ${
                      activeTab === t.key ? "text-[#FFFCEB]" : "text-white"
                    }`}
                  >
                    {t.label}
                  </span>
                </button>
              ))}
            </nav>
          </div>
          <div className="mt-auto relative z-10">
            <div className="flex gap-2">
              {TABS.map((t) => (
                <div
                  key={t.key}
                  className={`h-1.5 rounded-full transition-all duration-500 ${
                    activeTab === t.key ? "w-8 bg-[#F7B71D]" : "w-2 bg-white/20"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT CONTENT */}
        <div className="flex-1 flex flex-col relative bg-white/50 backdrop-blur-sm">
          <button
            onClick={onClose}
            className="absolute top-6 right-6 w-10 h-10 rounded-full bg-[#FFFCEB] border border-[#3A6131]/10 flex items-center justify-center text-[#3A6131] hover:bg-[#3A6131] hover:text-[#FFFCEB] transition-all z-20"
          >
            <XIcon />
          </button>

          <div className="flex-1 overflow-y-auto p-10 [&::-webkit-scrollbar]:w-[5px] [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[#3A6131]/15 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-[#3A6131]/25">
            
            {/* Feedback Banners */}
            {error && (
              <div className="mb-6 px-4 py-3 bg-red-50 border border-red-200 rounded-2xl text-red-600 text-xs font-semibold">
                ✕ {error}
              </div>
            )}
            {success && (
              <div className="mb-6 px-4 py-3 bg-[#3A6131]/10 border border-[#3A6131]/20 rounded-2xl text-[#3A6131] text-xs font-semibold">
                ✓ {success}
              </div>
            )}

            <AnimatePresence mode="wait">
              {/* ════════════════════════════════════════════════════════════
                  TAB: Payment Submissions
              ════════════════════════════════════════════════════════════ */}
              {activeTab === "submissions" && (
                <motion.div
                  key="submissions"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="mb-8">
                    <h3 className="text-2xl font-black text-[#3A6131] mt-2 italic font-['Raleway']">
                      Payment Submissions
                    </h3>
                    <p className="text-[12px] text-[#3A6131]/60 font-medium leading-relaxed mt-2">
                      Review proof of payments submitted by the tenant. Accepting a payment will automatically clear the balance for the targeted billing period.
                    </p>
                  </div>

                  {submissions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-14 gap-3 text-center">
                      <div className="w-12 h-12 rounded-full bg-[#3A6131]/8 flex items-center justify-center">
                        <InboxIcon />
                      </div>
                      <p className="text-[#3A6131]/40 text-[13px] font-semibold">
                        No payment submissions from this tenant yet.
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-4">
                      {submissions.map((sub) => {
                        const { bg, text } = getPill(sub.status);
                        const isPending    = sub.status === "Pending";
                        const isTarget     = reviewTarget?.submission_id === sub.submission_id;

                        return (
                          <div
                            key={sub.submission_id}
                            className={`rounded-[20px] border-[1.5px] p-5 transition-all ${
                              isPending
                                ? "border-[#F7B71D]/40 bg-[#FFFCEB]"
                                : sub.status === "Accepted"
                                ? "border-[#3A6131]/10 bg-white"
                                : "border-[#E91F22]/20 bg-red-50/50"
                            }`}
                          >
                            {/* Submission row header */}
                            <div className="flex items-start justify-between mb-4">
                              <div>
                                <p className="text-[#3A6131] text-[13px] font-extrabold">
                                  Submitted {fmtDate(sub.created_at)}
                                </p>
                                {sub.amount_declared != null && (
                                  <p className="text-[#3A6131]/60 text-[11px] font-bold mt-1">
                                    Declared amount: <span className="text-[#3A6131]">{fmtPHP(sub.amount_declared)}</span>
                                  </p>
                                )}
                              </div>
                              <div className={`px-3 pb-1 rounded-[40px] ${bg}`}>
                                <span className={`${text} text-[10px] font-bold`}>{sub.status}</span>
                              </div>
                            </div>

                            {/* Detail grid */}
                            <div className="grid grid-cols-2 gap-4 mb-4 text-[12px]">
                              <div>
                                <p className="text-[#3A6131]/45 font-bold uppercase tracking-wide mb-1.5 text-[10px]">
                                  Proof of Payment
                                </p>
                                <ProofImageViewer url={sub.proof_url} />
                              </div>

                              {sub.remarks_tenant && (
                                <div>
                                  <p className="text-[#3A6131]/45 font-bold uppercase tracking-wide mb-1.5 text-[10px]">
                                    Tenant Note
                                  </p>
                                  <p className="text-[#3A6131] font-medium leading-relaxed bg-white/50 p-2 rounded-lg">
                                    {sub.remarks_tenant}
                                  </p>
                                </div>
                              )}

                              {!isPending && sub.remarks_admin && (
                                <div className="col-span-2 pt-3 border-t border-[#3A6131]/10 mt-2">
                                  <p className="text-[#3A6131]/45 font-bold uppercase tracking-wide mb-1.5 text-[10px]">
                                    Admin Remarks
                                  </p>
                                  <p className={`font-semibold ${
                                    sub.status === "Rejected" ? "text-[#E91F22]" : "text-[#3A6131]"
                                  }`}>
                                    {sub.remarks_admin}
                                  </p>
                                </div>
                              )}

                              {!isPending && sub.reviewed_at && (
                                <div className="col-span-2">
                                  <p className="text-[#3A6131]/45 font-bold uppercase tracking-wide mb-1 text-[10px]">
                                    Reviewed At
                                  </p>
                                  <p className="text-[#3A6131] font-semibold">
                                    {fmtDate(sub.reviewed_at)}
                                  </p>
                                </div>
                              )}
                            </div>

                            {/* Action buttons — only for Pending */}
                            {isPending && !isTarget && (
                              <div className="flex gap-3 mt-4 pt-4 border-t border-[#3A6131]/10">
                                <button
                                  onClick={() => {
                                    setReviewTarget(sub);
                                    setReviewAction("accept");
                                    setRemarksAdmin("");
                                    setAmountOverride(
                                      sub.amount_declared != null ? sub.amount_declared.toString() : ""
                                    );
                                  }}
                                  className="flex-1 bg-[#3A6131] text-[#FFFCEB] text-[12px] font-bold py-2.5 rounded-xl hover:bg-[#2D4B24] transition-colors shadow-sm"
                                >
                                  Accept Payment
                                </button>
                                <button
                                  onClick={() => {
                                    setReviewTarget(sub);
                                    setReviewAction("reject");
                                    setRemarksAdmin("");
                                    setAmountOverride("");
                                  }}
                                  className="flex-1 bg-white border border-[#E91F22]/50 text-[#E91F22] text-[12px] font-bold py-2.5 rounded-xl hover:bg-red-50 transition-colors shadow-sm"
                                >
                                  Reject Payment
                                </button>
                              </div>
                            )}

                            {/* Expanded review form */}
                            {isTarget && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                transition={{ duration: 0.2 }}
                                className="mt-4 border-t border-[#3A6131]/10 pt-4 flex flex-col gap-4 overflow-hidden"
                              >
                                <div className={`flex items-center gap-2 text-[14px] font-black ${
                                  reviewAction === "accept" ? "text-[#3A6131]" : "text-[#E91F22]"
                                }`}>
                                  {reviewAction === "accept" ? "Confirm Acceptance" : "Confirm Rejection"}
                                </div>

                                {reviewAction === "accept" && (
                                  <div>
                                    <label className={labelStyle}>Confirmed Amount (₱)</label>
                                    <input
                                      type="number" min="0" step="0.01"
                                      placeholder="e.g. 1000.00"
                                      value={amountOverride}
                                      onChange={(e) => setAmountOverride(e.target.value)}
                                      className={inputStyle}
                                    />
                                  </div>
                                )}

                                <div>
                                  <label className={labelStyle}>
                                    {reviewAction === "reject" ? "Rejection Reason *" : "Admin Remarks (optional)"}
                                  </label>
                                  <textarea
                                    rows={2}
                                    placeholder={
                                      reviewAction === "reject"
                                        ? "e.g. Screenshot is blurry, incorrect amount shown, or wrong reference number."
                                        : "e.g. Verified via GCash reference #XXXXXX."
                                    }
                                    value={remarksAdmin}
                                    onChange={(e) => setRemarksAdmin(e.target.value)}
                                    className={`${inputStyle} resize-none`}
                                  />
                                </div>

                                <div className="flex gap-3 pt-2">
                                  <button
                                    onClick={() => {
                                      setReviewTarget(null);
                                      setReviewAction(null);
                                    }}
                                    disabled={reviewing}
                                    className="flex-1 bg-white border border-[#3A6131]/30 text-[#3A6131] text-[12px] font-bold py-2.5 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    onClick={handleReview}
                                    disabled={reviewing}
                                    className={`flex-1 text-[12px] font-bold py-2.5 rounded-xl transition-colors disabled:opacity-60 flex items-center justify-center gap-2 ${
                                      reviewAction === "accept"
                                        ? "bg-[#3A6131] text-[#FFFCEB] hover:bg-[#2D4B24]"
                                        : "bg-[#E91F22] text-white hover:bg-[#C01A1D]"
                                    }`}
                                  >
                                    {reviewing ? (
                                      <><LoaderIcon /> Processing…</>
                                    ) : reviewAction === "accept" ? "Confirm & Record" : "Confirm Rejection"}
                                  </button>
                                </div>
                              </motion.div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </motion.div>
              )}

              {/* ════════════════════════════════════════════════════════════
                  TAB: Billing Records (manual entry)
              ════════════════════════════════════════════════════════════ */}
              {activeTab === "records" && (
                <motion.div
                  key="records"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="mb-8">
                    <h3 className="text-2xl font-black text-[#3A6131] mt-2 italic font-['Raleway']">
                      Billing Records
                    </h3>
                    <p className="text-[12px] text-[#3A6131]/60 font-medium leading-relaxed mt-2">
                      View all past and current billing periods. Use this tab to manually mark a period as paid if the payment was received outside the platform (e.g., in-person cash).
                    </p>
                  </div>

                  {/* Inline confirm panel */}
                  {confirm && (
                    <div className="bg-[#F7B71D]/10 border border-[#F7B71D]/50 rounded-[20px] p-6 mb-6 flex flex-col gap-4 shadow-sm">
                      <h4 className="text-[#3A6131] text-[15px] font-black flex items-center gap-2">
                        Mark {fmtPeriod(confirm.billing_period)} as Paid
                      </h4>
                      <div>
                        <label className={labelStyle}>Amount Paid (₱) — leave blank for default</label>
                        <input
                          type="number" min="0" step="0.01"
                          placeholder={`Default: ${fmtPHP(Number(confirm.amount))}`}
                          value={manualAmount}
                          onChange={(e) => setManualAmount(e.target.value)}
                          className={inputStyle}
                        />
                      </div>
                      <p className="text-[#3A6131]/60 text-[11px] font-medium leading-relaxed">
                        This marks the record as <strong>Paid</strong> directly. Use only for in-person or otherwise verified cash payments — not for screenshot proofs.
                      </p>
                      <div className="flex gap-3 pt-2">
                        <button
                          onClick={() => { setConfirm(null); setManualAmount(""); }}
                          disabled={!!paying}
                          className="flex-1 bg-white border border-[#3A6131]/30 text-[#3A6131] text-[12px] font-bold py-2.5 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleMarkPaid(confirm)}
                          disabled={!!paying}
                          className="flex-1 bg-[#3A6131] text-[#FFFCEB] text-[12px] font-bold py-2.5 rounded-xl hover:bg-[#2D4B24] transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                        >
                          {paying ? <><LoaderIcon /> Recording…</> : "Confirm Payment"}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Records list */}
                  {loading ? (
                    <div className="text-center py-12 text-[#3A6131] font-semibold text-sm flex items-center justify-center gap-2">
                      <LoaderIcon /> Loading records...
                    </div>
                  ) : records.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-14 gap-3 text-center">
                      <div className="w-12 h-12 rounded-full bg-[#3A6131]/8 flex items-center justify-center">
                        <ReceiptIcon />
                      </div>
                      <p className="text-[#3A6131]/40 text-[13px] font-semibold">
                        No subscription records found for this tenant.
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-4">
                      {records.map((record) => {
                        const { bg, text } = getPill(record.payment_status);
                        const isPaid       = record.payment_status === "Paid";
                        const isConfirming = confirm?.subscription_id === record.subscription_id;

                        return (
                          <div
                            key={record.subscription_id}
                            className={`rounded-[20px] border-[1.5px] p-5 transition-all ${
                              isPaid
                                ? "border-[#3A6131]/10 bg-white"
                                : record.payment_status === "Overdue"
                                ? "border-[#F7B71D]/40 bg-[#FFFCEB]"
                                : "border-[#3A6131]/20 bg-[#3A6131]/5"
                            }`}
                          >
                            <div className="flex items-center justify-between mb-4">
                              <span className="text-[#3A6131] text-[14px] font-black">
                                {fmtPeriod(record.billing_period)}
                              </span>
                              <div className={`px-3 pb-1 rounded-[40px] ${bg}`}>
                                <span className={`${text} text-[10px] font-bold`}>
                                  {record.payment_status}
                                </span>
                              </div>
                            </div>

                            <div className="grid grid-cols-3 gap-x-4 gap-y-4 text-[12px] mb-4">
                              <div>
                                <p className="text-[#3A6131]/45 font-bold uppercase tracking-wide mb-1 text-[10px]">Amount</p>
                                <p className={`font-extrabold text-[14px] ${isPaid ? "text-[#3A6131]" : "text-[#E91F22]"}`}>
                                  {fmtPHP(Number(record.amount))}
                                </p>
                              </div>
                              <div>
                                <p className="text-[#3A6131]/45 font-bold uppercase tracking-wide mb-1 text-[10px]">Due Date</p>
                                <p className={`font-bold ${record.payment_status === "Overdue" ? "text-[#E91F22]" : "text-[#3A6131]"}`}>
                                  {fmtDate(record.overdue_at)}
                                </p>
                              </div>
                              <div>
                                <p className="text-[#3A6131]/45 font-bold uppercase tracking-wide mb-1 text-[10px]">Paid At</p>
                                <p className="text-[#3A6131] font-bold">{fmtDate(record.paid_at)}</p>
                              </div>
                              {record.grace_ends_at && !isPaid && (
                                <div className="col-span-3 pt-3 border-t border-[#F7B71D]/30 mt-1">
                                  <p className="text-[#3A6131]/45 font-bold uppercase tracking-wide mb-1 text-[10px]">
                                    Grace Period Ends
                                  </p>
                                  <p className="text-[#E91F22] font-black">
                                    {fmtDate(record.grace_ends_at)}
                                  </p>
                                </div>
                              )}
                            </div>

                            {!isPaid && !isConfirming && (
                              <button
                                onClick={() => { setConfirm(record); setError(""); }}
                                disabled={!!paying || !!confirm}
                                className="w-full bg-white border border-[#3A6131]/20 text-[#3A6131] text-[12px] font-bold py-2.5 rounded-xl hover:bg-[#3A6131] hover:text-[#FFFCEB] transition-colors shadow-sm disabled:opacity-40"
                              >
                                Manually Mark as Paid
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          
        </div>
      </motion.div>
    </div>,
    document.body
  );
}