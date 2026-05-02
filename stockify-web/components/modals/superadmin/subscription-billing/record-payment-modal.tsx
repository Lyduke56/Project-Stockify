"use client";

// components/modals/superadmin/record-payment-modal.tsx

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

// ── Types ─────────────────────────────────────────────────────────────────────

interface PaymentRecord {
  subscription_id:  string;
  billing_period:   string;
  payment_status:   "Pending" | "Paid" | "Overdue";
  amount:           number;
  paid_at:          string | null;
  overdue_at:       string | null;
  grace_ends_at:    string | null;
  notification_sent_at: string | null;
}

interface TenantInfo {
  tenant_id:           string;
  business_name:       string;
  owner_full_name:     string;
  owner_email:         string;
  subscription_status: string;
}

export interface RecordPaymentModalProps {
  isOpen:   boolean;
  tenantId: string | null;
  onClose:  () => void;
  onPaid?:  () => void;
}

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
    case "Paid":    return { bg: "bg-[#385E31]", text: "text-[#FFFCEB]" };
    case "Pending": return { bg: "bg-[#E5AD24]", text: "text-[#385E31]" };
    case "Overdue": return { bg: "bg-[#FFD980]", text: "text-[#385E31]" };
    default:        return { bg: "bg-[#E2E8F0]", text: "text-[#475569]" };
  }
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function RecordPaymentModal({
  isOpen,
  tenantId,
  onClose,
  onPaid,
}: RecordPaymentModalProps) {
  const [tenant,  setTenant]  = useState<TenantInfo | null>(null);
  const [records, setRecords] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [paying,  setPaying]  = useState<string | null>(null);
  const [confirm, setConfirm] = useState<PaymentRecord | null>(null);
  const [error,   setError]   = useState("");
  const [success, setSuccess] = useState("");

  const fetchRecords = async () => {
    if (!tenantId) return;
    setLoading(true);
    setError("");
    try {
      const res  = await fetch(`/api/cron/billing/records?tenantId=${tenantId}`);
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setTenant(json.tenant);
      setRecords(json.records);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && tenantId) {
      setSuccess("");
      setConfirm(null);
      setError("");
      fetchRecords();
    }
  }, [isOpen, tenantId]);

  const handleMarkPaid = async (record: PaymentRecord) => {
    setPaying(record.subscription_id);
    setError("");
    try {
      const res  = await fetch("/api/cron/billing", {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ subscriptionId: record.subscription_id, tenantId }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error ?? "Failed to record payment.");

      setSuccess(`Payment for ${fmtPeriod(record.billing_period)} recorded successfully.`);
      setConfirm(null);
      await fetchRecords();
      onPaid?.();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setPaying(null);
    }
  };

  const unpaidCount = records.filter((r) => r.payment_status !== "Paid").length;
  const totalBalance = records
    .filter((r) => r.payment_status !== "Paid")
    .reduce((s, r) => s + Number(r.amount), 0);

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

          {/* Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 18 }}
            animate={{ opacity: 1, scale: 1,    y: 0  }}
            exit={{ opacity: 0, scale: 0.92, y: 18 }}
            transition={{ type: "spring", stiffness: 320, damping: 26 }}
            className="relative z-10 w-full max-w-2xl mx-4 bg-[#FFFCEB] rounded-[14px] shadow-2xl border border-[#385E31]/15 overflow-hidden max-h-[90vh] flex flex-col"
          >
            {/* Accent bar */}
            <div className="h-[5px] w-full bg-[#385E31] shrink-0" />

            {/* Header */}
            <div className="px-7 pt-6 pb-4 shrink-0 border-b border-[#385E31]/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#385E31]/10 border border-[#385E31]/15 flex items-center justify-center shrink-0">
                    {/* Receipt icon */}
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

                {/* Balance badge */}
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
              </div>
            </div>

            {/* Scrollable body */}
            <div className="overflow-y-auto flex-1 px-7 py-5">

              {/* Feedback banners */}
              {error && (
                <p className="text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-[8px] text-[12px] font-medium mb-4">
                  {error}
                </p>
              )}
              {success && (
                <p className="text-[#385E31] bg-[#e8f5e2] border border-[#385E31]/30 px-3 py-2 rounded-[8px] text-[12px] font-medium mb-4">
                  ✓ {success}
                </p>
              )}

              {/* Inline confirm */}
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
                      Confirm payment for{" "}
                      <span className="text-[#E5AD24]">{fmtPeriod(confirm.billing_period)}</span>?
                    </p>
                  </div>
                  <p className="text-[#385E31]/60 text-[12px] leading-relaxed">
                    Amount:{" "}
                    <strong className="text-[#385E31]">{fmtPHP(Number(confirm.amount))}</strong>
                    {" — "}This will mark the billing record as <strong>Paid</strong> and cannot easily be undone.
                    {confirm.payment_status === "Overdue" &&
                      " The record is currently overdue — recording payment will clear the balance."}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setConfirm(null)}
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
                <div className="text-center py-12 text-[#385E31]/50 text-sm">
                  No subscription records found for this tenant.
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {records.map((record) => {
                    const { bg, text } = getPill(record.payment_status);
                    const isPaid     = record.payment_status === "Paid";
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
                              <p className="text-[#385E31]/45 font-bold uppercase tracking-wide mb-0.5">Grace Period Ends</p>
                              <p className="text-[#E5AD24] font-extrabold">{fmtDate(record.grace_ends_at)}</p>
                            </div>
                          )}
                        </div>

                        {/* Mark as paid button */}
                        {!isPaid && !isConfirming && (
                          <button
                            onClick={() => { setConfirm(record); setError(""); }}
                            disabled={!!paying || !!confirm}
                            className="w-full bg-[#385E31] text-[#FFFCEB] text-[11px] font-bold py-[7px] rounded-[40px] hover:bg-[#2D4B24] transition-colors disabled:opacity-40"
                          >
                            Mark as Paid
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
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