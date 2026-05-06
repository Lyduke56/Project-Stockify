// components/modals/superadmin/subscription-billing/record-payment-modal.tsx
// Full-featured payment modal with:
//   Tab 1 — Payment Submissions (proof screenshots from tenant, Accept / Reject)
//   Tab 2 — Billing Records     (existing records, manual mark-as-paid)

"use client";

import { useEffect, useState } from "react";
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
    case "Paid":     return { bg: "bg-[#385E31]", text: "text-[#FFFCEB]" };
    case "Pending":  return { bg: "bg-[#E5AD24]", text: "text-[#385E31]" };
    case "Overdue":  return { bg: "bg-[#FFD980]", text: "text-[#385E31]" };
    case "Accepted": return { bg: "bg-[#385E31]", text: "text-[#FFFCEB]" };
    case "Rejected": return { bg: "bg-[#E91F22]", text: "text-[#FFFCEB]" };
    default:         return { bg: "bg-[#E2E8F0]", text: "text-[#475569]" };
  }
};

// ── Proof Image Lightbox ──────────────────────────────────────────────────────

function ProofImageViewer({ url }: { url: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-[#385E31] text-[11px] font-bold underline underline-offset-2 hover:text-[#E5AD24] transition-colors"
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
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              onClick={(e) => e.stopPropagation()}
              className="relative bg-white rounded-[14px] p-3 shadow-2xl max-w-[88vw] max-h-[88vh] overflow-auto"
            >
              {/* Close button */}
              <button
                onClick={() => setOpen(false)}
                className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-black/10 flex items-center justify-center hover:bg-black/20 transition-colors z-10"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24"
                  fill="none" stroke="#333" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>

              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt="Proof of Payment"
                className="max-w-[80vw] max-h-[80vh] object-contain rounded-[8px]"
              />
              <p className="text-center text-[11px] text-gray-400 mt-2 font-medium">
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

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-50 flex items-center justify-center"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 18 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 18 }}
            transition={{ type: "spring", stiffness: 320, damping: 26 }}
            className="relative z-10 w-full max-w-2xl mx-4 bg-[#FFFCEB] rounded-[14px] shadow-2xl border border-[#385E31]/15 overflow-hidden max-h-[92vh] flex flex-col"
          >
            {/* Top accent bar */}
            <div className="h-[5px] w-full bg-[#385E31] shrink-0" />

            {/* ── Header ─────────────────────────────────────────────────── */}
            <div className="px-7 pt-5 pb-0 shrink-0">
              <div className="flex items-center justify-between mb-4">
                {/* Icon + title */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#385E31]/10 border border-[#385E31]/15 flex items-center justify-center shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" width="19" height="19" viewBox="0 0 24 24"
                      fill="none" stroke="#385E31" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14 2 14 8 20 8"/>
                      <line x1="16" y1="13" x2="8" y2="13"/>
                      <line x1="16" y1="17" x2="8" y2="17"/>
                      <polyline points="10 9 9 9 8 9"/>
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-[#385E31] text-[17px] font-extrabold leading-tight">
                      Payment Records
                    </h3>
                    {tenant && (
                      <p className="text-[#385E31]/55 text-[12px] font-medium mt-0.5">
                        {tenant.business_name} · {tenant.owner_full_name}
                      </p>
                    )}
                  </div>
                </div>

                {/* Balance badge + close */}
                <div className="flex items-center gap-4">
                  {!loading && unpaidCount > 0 && (
                    <div className="flex flex-col items-end">
                      <span className="text-[#E91F22] text-[18px] font-black leading-tight">
                        {fmtPHP(totalBalance)}
                      </span>
                      <span className="text-[#E91F22]/60 text-[11px] font-semibold">
                        {unpaidCount} unpaid record{unpaidCount !== 1 ? "s" : ""}
                      </span>
                    </div>
                  )}
                  <button
                    onClick={onClose}
                    className="w-7 h-7 rounded-full bg-[#385E31]/10 flex items-center justify-center hover:bg-[#385E31]/20 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24"
                      fill="none" stroke="#385E31" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"/>
                      <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                </div>
              </div>

              {/* Tab switcher */}
              <div className="flex gap-1 border-b border-[#385E31]/10 pb-0">
                {(["submissions", "records"] as ModalTab[]).map((tab) => {
                  const labels: Record<ModalTab, string> = {
                    submissions: "Payment Submissions",
                    records:     "Billing Records",
                  };
                  const isActive = activeTab === tab;
                  const badge    = tab === "submissions" ? pendingSubCount : 0;

                  return (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`relative flex items-center gap-1.5 px-4 py-2.5 text-[12px] font-bold transition-all rounded-t-[6px] ${
                        isActive
                          ? "text-[#385E31] bg-[#385E31]/8"
                          : "text-[#385E31]/50 hover:text-[#385E31] hover:bg-[#385E31]/5"
                      }`}
                    >
                      {labels[tab]}
                      {badge > 0 && (
                        <span className="bg-[#E91F22] text-white text-[9px] px-1.5 py-0.5 rounded-full font-extrabold">
                          {badge}
                        </span>
                      )}
                      {isActive && (
                        <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#385E31] rounded-t-full" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ── Scrollable body ─────────────────────────────────────────── */}
            <div className="overflow-y-auto flex-1 px-7 py-5">

              {/* Feedback banners */}
              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
                  className="text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-[8px] text-[12px] font-medium mb-4"
                >
                  ✕ {error}
                </motion.p>
              )}
              {success && (
                <motion.p
                  initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
                  className="text-[#385E31] bg-[#e8f5e2] border border-[#385E31]/30 px-3 py-2 rounded-[8px] text-[12px] font-medium mb-4"
                >
                  ✓ {success}
                </motion.p>
              )}

              {/* ════════════════════════════════════════════════════════════
                  TAB: Payment Submissions
              ════════════════════════════════════════════════════════════ */}
              {activeTab === "submissions" && (
                <>
                  {submissions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-14 gap-3 text-center">
                      <div className="w-12 h-12 rounded-full bg-[#385E31]/8 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24"
                          fill="none" stroke="#385E31" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="2" y="5" width="20" height="14" rx="2"/>
                          <line x1="2" y1="10" x2="22" y2="10"/>
                        </svg>
                      </div>
                      <p className="text-[#385E31]/40 text-[13px] font-semibold">
                        No payment submissions from this tenant yet.
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3">
                      {submissions.map((sub) => {
                        const { bg, text } = getPill(sub.status);
                        const isPending    = sub.status === "Pending";
                        const isTarget     = reviewTarget?.submission_id === sub.submission_id;

                        return (
                          <div
                            key={sub.submission_id}
                            className={`rounded-[10px] border p-4 transition-all ${
                              isPending
                                ? "border-[#E5AD24]/50 bg-[#FFFDE7]"
                                : sub.status === "Accepted"
                                ? "border-[#385E31]/20 bg-white/40"
                                : "border-[#E91F22]/20 bg-red-50/40"
                            }`}
                          >
                            {/* Submission row header */}
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <p className="text-[#385E31] text-[12px] font-extrabold">
                                  Submitted {fmtDate(sub.created_at)}
                                </p>
                                {sub.amount_declared != null && (
                                  <p className="text-[#385E31]/60 text-[11px] font-bold mt-0.5">
                                    Declared amount: {fmtPHP(sub.amount_declared)}
                                  </p>
                                )}
                              </div>
                              <div className={`px-3 py-[3px] rounded-[40px] ${bg}`}>
                                <span className={`${text} text-[10px] font-bold`}>{sub.status}</span>
                              </div>
                            </div>

                            {/* Detail grid */}
                            <div className="grid grid-cols-2 gap-3 mb-3 text-[11px]">
                              <div>
                                <p className="text-[#385E31]/45 font-bold uppercase tracking-wide mb-1">
                                  Proof of Payment
                                </p>
                                <ProofImageViewer url={sub.proof_url} />
                              </div>

                              {sub.remarks_tenant && (
                                <div>
                                  <p className="text-[#385E31]/45 font-bold uppercase tracking-wide mb-1">
                                    Tenant Note
                                  </p>
                                  <p className="text-[#385E31] font-medium leading-relaxed">
                                    {sub.remarks_tenant}
                                  </p>
                                </div>
                              )}

                              {!isPending && sub.remarks_admin && (
                                <div className="col-span-2 pt-2 border-t border-[#385E31]/10 mt-1">
                                  <p className="text-[#385E31]/45 font-bold uppercase tracking-wide mb-1">
                                    Admin Remarks
                                  </p>
                                  <p className={`font-semibold text-[12px] ${
                                    sub.status === "Rejected" ? "text-[#E91F22]" : "text-[#385E31]"
                                  }`}>
                                    {sub.remarks_admin}
                                  </p>
                                </div>
                              )}

                              {!isPending && sub.reviewed_at && (
                                <div className="col-span-2">
                                  <p className="text-[#385E31]/45 font-bold uppercase tracking-wide mb-0.5">
                                    Reviewed
                                  </p>
                                  <p className="text-[#385E31]/60 font-semibold">
                                    {fmtDate(sub.reviewed_at)}
                                  </p>
                                </div>
                              )}
                            </div>

                            {/* Action buttons — only for Pending */}
                            {isPending && !isTarget && (
                              <div className="flex gap-2 mt-2">
                                <button
                                  onClick={() => {
                                    setReviewTarget(sub);
                                    setReviewAction("accept");
                                    setRemarksAdmin("");
                                    setAmountOverride(
                                      sub.amount_declared != null
                                        ? sub.amount_declared.toString()
                                        : ""
                                    );
                                  }}
                                  className="flex-1 bg-[#385E31] text-[#FFFCEB] text-[11px] font-bold py-[8px] rounded-[40px] hover:bg-[#2D4B24] transition-colors flex items-center justify-center gap-1.5"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24"
                                    fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="20 6 9 17 4 12"/>
                                  </svg>
                                  Accept Payment
                                </button>
                                <button
                                  onClick={() => {
                                    setReviewTarget(sub);
                                    setReviewAction("reject");
                                    setRemarksAdmin("");
                                    setAmountOverride("");
                                  }}
                                  className="flex-1 bg-[#E91F22]/90 text-white text-[11px] font-bold py-[8px] rounded-[40px] hover:bg-[#C01A1D] transition-colors flex items-center justify-center gap-1.5"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24"
                                    fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="18" y1="6" x2="6" y2="18"/>
                                    <line x1="6" y1="6" x2="18" y2="18"/>
                                  </svg>
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
                                className="mt-3 border-t border-[#385E31]/10 pt-3 flex flex-col gap-3 overflow-hidden"
                              >
                                {/* Review heading */}
                                <div className={`flex items-center gap-2 text-[12px] font-extrabold ${
                                  reviewAction === "accept" ? "text-[#385E31]" : "text-[#E91F22]"
                                }`}>
                                  {reviewAction === "accept" ? (
                                    <>
                                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
                                        fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="20 6 9 17 4 12"/>
                                      </svg>
                                      Confirm Acceptance
                                    </>
                                  ) : (
                                    <>
                                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
                                        fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="18" y1="6" x2="6" y2="18"/>
                                        <line x1="6" y1="6" x2="18" y2="18"/>
                                      </svg>
                                      Confirm Rejection
                                    </>
                                  )}
                                </div>

                                {/* Confirmed amount (accept only) */}
                                {reviewAction === "accept" && (
                                  <div>
                                    <label className="block text-[10px] font-bold text-[#385E31]/60 uppercase tracking-wide mb-1">
                                      Confirmed Amount (₱)
                                    </label>
                                    <input
                                      type="number"
                                      min="0"
                                      step="0.01"
                                      placeholder="e.g. 1000.00"
                                      value={amountOverride}
                                      onChange={(e) => setAmountOverride(e.target.value)}
                                      className="w-full border border-[#385E31]/30 rounded-[6px] px-3 py-2 text-[12px] text-[#385E31] bg-white placeholder-[#385E31]/30 outline-none focus:border-[#385E31] transition-colors"
                                    />
                                    <p className="text-[10px] text-[#385E31]/40 mt-1">
                                      Leave empty to use the default billing amount.
                                    </p>
                                  </div>
                                )}

                                {/* Admin remarks */}
                                <div>
                                  <label className="block text-[10px] font-bold text-[#385E31]/60 uppercase tracking-wide mb-1">
                                    {reviewAction === "reject"
                                      ? "Rejection Reason *"
                                      : "Admin Remarks (optional)"}
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
                                    className="w-full border border-[#385E31]/30 rounded-[6px] px-3 py-2 text-[12px] text-[#385E31] bg-white placeholder-[#385E31]/30 outline-none focus:border-[#385E31] transition-colors resize-none"
                                  />
                                </div>

                                {/* Confirm / Cancel */}
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => {
                                      setReviewTarget(null);
                                      setReviewAction(null);
                                      setRemarksAdmin("");
                                      setAmountOverride("");
                                    }}
                                    disabled={reviewing}
                                    className="flex-1 border border-[#385E31] text-[#385E31] text-[11px] font-bold py-[8px] rounded-[40px] hover:bg-[#385E31]/5 transition-colors disabled:opacity-50"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    onClick={handleReview}
                                    disabled={reviewing}
                                    className={`flex-1 text-[11px] font-bold py-[8px] rounded-[40px] transition-colors disabled:opacity-60 ${
                                      reviewAction === "accept"
                                        ? "bg-[#385E31] text-[#FFFCEB] hover:bg-[#2D4B24]"
                                        : "bg-[#E91F22] text-white hover:bg-[#C01A1D]"
                                    }`}
                                  >
                                    {reviewing ? (
                                      <span className="flex items-center justify-center gap-2">
                                        <svg className="animate-spin" xmlns="http://www.w3.org/2000/svg" width="11" height="11"
                                          viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                                          strokeLinecap="round" strokeLinejoin="round">
                                          <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                                        </svg>
                                        Processing…
                                      </span>
                                    ) : reviewAction === "accept"
                                      ? "Confirm Acceptance"
                                      : "Confirm Rejection"}
                                  </button>
                                </div>
                              </motion.div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}

              {/* ════════════════════════════════════════════════════════════
                  TAB: Billing Records (manual entry)
              ════════════════════════════════════════════════════════════ */}
              {activeTab === "records" && (
                <>
                  {/* Inline confirm panel */}
                  {confirm && (
                    <div className="bg-[#FFFCEB] border border-[#E5AD24]/60 rounded-[10px] p-4 mb-5 flex flex-col gap-3 shadow-sm">
                      <div className="flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
                          fill="none" stroke="#E5AD24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10"/>
                          <line x1="12" y1="8" x2="12" y2="12"/>
                          <line x1="12" y1="16" x2="12.01" y2="16"/>
                        </svg>
                        <p className="text-[#385E31] text-[13px] font-bold">
                          Manually record payment for{" "}
                          <span className="text-[#E5AD24]">{fmtPeriod(confirm.billing_period)}</span>?
                        </p>
                      </div>

                      {/* Amount input */}
                      <div>
                        <label className="block text-[10px] font-bold text-[#385E31]/60 uppercase tracking-wide mb-1">
                          Amount Paid (₱) — leave blank for default
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder={`Default: ${fmtPHP(Number(confirm.amount))}`}
                          value={manualAmount}
                          onChange={(e) => setManualAmount(e.target.value)}
                          className="w-full border border-[#385E31]/30 rounded-[6px] px-3 py-2 text-[12px] text-[#385E31] bg-white placeholder-[#385E31]/30 outline-none focus:border-[#385E31] transition-colors"
                        />
                      </div>

                      <p className="text-[#385E31]/55 text-[11px] leading-relaxed">
                        This marks the record as <strong>Paid</strong> directly. Use only for
                        in-person or otherwise verified cash payments — not for screenshot proofs.
                      </p>

                      <div className="flex gap-2">
                        <button
                          onClick={() => { setConfirm(null); setManualAmount(""); }}
                          disabled={!!paying}
                          className="flex-1 border border-[#385E31] text-[#385E31] text-[12px] font-bold py-[8px] rounded-[40px] hover:bg-[#385E31]/5 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleMarkPaid(confirm)}
                          disabled={!!paying}
                          className="flex-1 bg-[#385E31] text-[#FFFCEB] text-[12px] font-bold py-[8px] rounded-[40px] hover:bg-[#2D4B24] transition-colors disabled:opacity-60"
                        >
                          {paying ? (
                            <span className="flex items-center justify-center gap-2">
                              <svg className="animate-spin" xmlns="http://www.w3.org/2000/svg" width="12" height="12"
                                viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                                strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                              </svg>
                              Recording…
                            </span>
                          ) : "Confirm Payment"}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Records list */}
                  {loading ? (
                    <div className="text-center py-12 text-[#385E31] font-semibold text-sm">
                      Loading payment records…
                    </div>
                  ) : records.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-14 gap-3 text-center">
                      <div className="w-12 h-12 rounded-full bg-[#385E31]/8 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24"
                          fill="none" stroke="#385E31" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                          <polyline points="14 2 14 8 20 8"/>
                        </svg>
                      </div>
                      <p className="text-[#385E31]/40 text-[13px] font-semibold">
                        No subscription records found for this tenant.
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3">
                      {records.map((record) => {
                        const { bg, text } = getPill(record.payment_status);
                        const isPaid       = record.payment_status === "Paid";
                        const isConfirming = confirm?.subscription_id === record.subscription_id;

                        return (
                          <div
                            key={record.subscription_id}
                            className={`rounded-[10px] border p-4 transition-all ${
                              isPaid
                                ? "border-[#385E31]/12 bg-white/30"
                                : record.payment_status === "Overdue"
                                ? "border-[#E5AD24]/40 bg-[#FFD980]/10"
                                : "border-[#385E31]/20 bg-white/20"
                            }`}
                          >
                            {/* Row header */}
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-[#385E31] text-[13px] font-extrabold">
                                {fmtPeriod(record.billing_period)}
                              </span>
                              <div className={`px-3 py-[3px] rounded-[40px] ${bg}`}>
                                <span className={`${text} text-[10px] font-bold`}>
                                  {record.payment_status}
                                </span>
                              </div>
                            </div>

                            {/* Detail grid */}
                            <div className="grid grid-cols-3 gap-x-4 gap-y-2 text-[11px] mb-3">
                              <div>
                                <p className="text-[#385E31]/45 font-bold uppercase tracking-wide mb-0.5">Amount</p>
                                <p className={`font-extrabold ${isPaid ? "text-[#385E31]" : "text-[#E91F22]"}`}>
                                  {fmtPHP(Number(record.amount))}
                                </p>
                              </div>
                              <div>
                                <p className="text-[#385E31]/45 font-bold uppercase tracking-wide mb-0.5">Due Date</p>
                                <p className={`font-bold ${record.payment_status === "Overdue" ? "text-[#E91F22]" : "text-[#385E31]"}`}>
                                  {fmtDate(record.overdue_at)}
                                </p>
                              </div>
                              <div>
                                <p className="text-[#385E31]/45 font-bold uppercase tracking-wide mb-0.5">Paid At</p>
                                <p className="text-[#385E31] font-bold">{fmtDate(record.paid_at)}</p>
                              </div>
                              {record.grace_ends_at && !isPaid && (
                                <div className="col-span-3 pt-1 border-t border-[#E5AD24]/20 mt-1">
                                  <p className="text-[#385E31]/45 font-bold uppercase tracking-wide mb-0.5">
                                    Grace Period Ends
                                  </p>
                                  <p className="text-[#E5AD24] font-extrabold">
                                    {fmtDate(record.grace_ends_at)}
                                  </p>
                                </div>
                              )}
                            </div>

                            {/* Manual mark paid button */}
                            {!isPaid && !isConfirming && (
                              <button
                                onClick={() => { setConfirm(record); setError(""); }}
                                disabled={!!paying || !!confirm}
                                className="w-full bg-[#385E31] text-[#FFFCEB] text-[11px] font-bold py-[7px] rounded-[40px] hover:bg-[#2D4B24] transition-colors disabled:opacity-40"
                              >
                                Manually Mark as Paid
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* ── Footer ─────────────────────────────────────────────────── */}
            <div className="px-7 py-4 border-t border-[#385E31]/10 bg-[#FFFCEB] shrink-0">
              <button
                onClick={onClose}
                className="w-full border-2 border-[#385E31] text-[#385E31] font-bold text-[14px] py-[10px] rounded-[40px] hover:bg-[#385E31]/5 transition-colors"
              >
                Close
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}