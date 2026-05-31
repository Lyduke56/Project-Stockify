"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  X,
  Mail,
  AlertCircle,
  Calendar,
  FileText,
  CreditCard,
  Building2,
  Clock
} from "lucide-react";
import {
  SuspendedTenant,
  BillingRecord,
  formatDate,
  formatMonth,
  daysUntilExpiry,
} from "./../../types";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ─── Styles ───────────────────────────────────────────────────────────────────

const labelStyle = "text-[11px] font-black uppercase tracking-[0.12em] text-[#3A6131]/50 mb-2 block";
const readOnlyBoxStyle = "w-full bg-white border-[1.5px] border-[#3A6131]/10 rounded-2xl px-4 py-3 text-sm text-[#3A6131] font-medium flex items-center gap-3";

// ─── Info Field Component ─────────────────────────────────────────────────────

function InfoField({ label, value, icon: Icon, className = "" }: { label: string; value: string; icon: React.ElementType; className?: string }) {
  return (
    <div className={className}>
      <label className={labelStyle}>{label}</label>
      <div className={readOnlyBoxStyle}>
        <Icon size={18} className="text-[#3A6131]/40 shrink-0" />
        <span className="truncate">{value}</span>
      </div>
    </div>
  );
}

// ─── Payment Status Badge ─────────────────────────────────────────────────────

function PaymentStatusBadge({ status }: { status: BillingRecord["payment_status"] }) {
  const config = {
    Paid: {
      bg: "bg-emerald-50",
      border: "border-emerald-200",
      text: "text-emerald-700",
      dot: "bg-emerald-500",
    },
    Pending: {
      bg: "bg-yellow-50",
      border: "border-yellow-200",
      text: "text-yellow-800",
      dot: "bg-yellow-500",
    },
    Overdue: {
      bg: "bg-red-50",
      border: "border-red-200",
      text: "text-red-700",
      dot: "bg-red-500",
    },
  }[status];

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${config.bg} ${config.border} ${config.text}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {status}
    </span>
  );
}

// ─── Billing Records Panel ────────────────────────────────────────────────────

function BillingPanel({
  records,
  loading,
}: {
  records: BillingRecord[];
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="rounded-2xl border-[1.5px] border-[#3A6131]/10 bg-white px-5 py-5 flex items-center justify-center min-h-[120px]">
        <div className="flex items-center gap-2 text-[#3A6131]/50 font-semibold text-sm animate-pulse">
          <CreditCard size={18} />
          Loading billing history...
        </div>
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div className="rounded-2xl border-[1.5px] border-[#3A6131]/10 bg-white px-5 py-5 flex flex-col items-center justify-center min-h-[120px] text-center">
        <CreditCard size={24} className="text-[#3A6131]/30 mb-2" />
        <p className="text-[#3A6131] font-bold text-sm">No Records</p>
        <p className="text-xs text-[#3A6131]/60 mt-1">No billing history found for this tenant.</p>
      </div>
    );
  }

  const latest = records[0];
  const hasPaid = latest.payment_status === "Paid";
  const hasOutstanding = ["Overdue", "Pending"].includes(latest.payment_status);

  return (
    <div className="rounded-2xl border-[1.5px] border-[#3A6131]/10 bg-white p-5 space-y-4 shadow-sm">
      <div className="flex items-center justify-between border-b border-[#3A6131]/10 pb-3">
        <div className="flex items-center gap-2 text-[#3A6131] font-bold text-sm">
          <CreditCard size={16} />
          Billing Records
        </div>
        {hasPaid ? (
          <span className="text-[11px] text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 rounded-full px-3 py-1">
            ✓ Good Standing
          </span>
        ) : (
          <span className="text-[11px] text-red-700 font-bold bg-red-50 border border-red-200 rounded-full px-3 py-1">
            ✗ Outstanding Balance
          </span>
        )}
      </div>

      {/* Latest billing record */}
      <div
        className={`rounded-xl px-4 py-3 border-[1.5px] transition-colors ${
          hasPaid
            ? "bg-emerald-50/40 border-emerald-200"
            : hasOutstanding
            ? "bg-red-50/40 border-red-200"
            : "bg-yellow-50/40 border-yellow-200"
        }`}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-[#3A6131]/60 font-black mb-1">
              Latest Period
            </p>
            <p className="text-sm font-bold text-[#3A6131]">{formatMonth(latest.billing_period)}</p>
            {latest.paid_at && (
              <p className="text-[11px] text-emerald-600 mt-1 font-medium">
                Paid on {formatDate(latest.paid_at)}
              </p>
            )}
          </div>
          <div className="text-right space-y-1.5 flex flex-col items-end">
            <PaymentStatusBadge status={latest.payment_status} />
            <p
              className={`text-xl font-black ${
                hasPaid ? "text-emerald-700" : "text-red-600"
              }`}
            >
              ₱{Number(latest.amount).toLocaleString("en-PH", { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      </div>

      {/* Prior records */}
      {records.length > 1 && (
        <div className="space-y-2 pt-2">
          {records.slice(1, 3).map((rec) => (
            <div
              key={rec.billing_period}
              className="flex items-center justify-between px-2 py-2 rounded-lg hover:bg-[#3A6131]/5 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Clock size={14} className="text-[#3A6131]/40" />
                <p className="text-xs font-semibold text-[#3A6131]/80">{formatMonth(rec.billing_period)}</p>
              </div>
              <div className="flex items-center gap-4">
                <PaymentStatusBadge status={rec.payment_status} />
                <p className="text-xs font-bold text-[#3A6131] min-w-[70px] text-right">
                  ₱{Number(rec.amount).toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Modal ───────────────────────────────────────────────────────────────

export function ViewSuspendModal({
  tenant,
  onClose,
}: {
  tenant: SuspendedTenant;
  onClose: () => void;
}) {
  const [records, setRecords] = useState<BillingRecord[]>([]);
  const [loadingRecords, setLoadingRecords] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoadingRecords(true);
      const { data } = await supabase
        .from("subscription_records")
        .select("amount, billing_period, payment_status, paid_at")
        .eq("tenant_id", tenant.tenant_id)
        .order("billing_period", { ascending: false })
        .limit(5);
      setRecords((data as BillingRecord[]) || []);
      setLoadingRecords(false);
    };
    load();
  }, [tenant.tenant_id]);

  const daysLeft = daysUntilExpiry(tenant.suspension_expires_at);
  const isExpiringSoon = daysLeft !== null && daysLeft <= 3 && daysLeft >= 0;
  const isExpired = daysLeft !== null && daysLeft < 0;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          key="suspend-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/40 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal Container */}
        <motion.div
          key="suspend-modal"
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          transition={{ duration: 0.3, type: "spring", bounce: 0.25 }}
          className="w-full max-w-[920px] bg-[#FFFCEB] rounded-[32px] overflow-hidden border-[1.5px] border-[#F7B71D]/20 shadow-[0_32px_80px_rgba(58,97,49,0.2)] flex flex-col md:flex-row h-[600px] font-inter relative z-10"
        >
          {/* LEFT SIDEBAR */}
          <div className="w-full md:w-[320px] bg-[#3A6131] p-10 flex flex-col relative overflow-hidden shrink-0">
            <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-[#F7B71D]/10 rounded-full blur-3xl" />
            <div className="relative z-10">
              <div className="bg-[#F7B71D] w-12 h-1 rounded-full mb-8" />
              <h2 className="text-[#FFFCEB] font-raleway text-3xl font-black leading-tight mb-2 truncate">
                {tenant.business_name}
              </h2>
              <p className="text-[#FFFCEB]/60 text-xs font-medium leading-relaxed mb-12">
                Review tenant suspension details, policy timelines, and billing history.
              </p>
              
              {/* Summary Points replacing visual 'steps' */}
              <nav className="flex flex-col gap-8">
                <div className="flex items-center gap-4 transition-all duration-300">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[#F7B71D] text-[#385E31] shadow-lg shadow-[#F7B71D]/20">
                    <Building2 size={18} strokeWidth={2.5} />
                  </div>
                  <span className="text-sm font-bold tracking-wide text-[#FFFCEB]">Tenant Profile</span>
                </div>
              </nav>
            </div>
            
            <div className="mt-auto relative z-10">
               <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/20 border border-red-500/30 text-red-200 text-xs font-bold">
                 <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
                 Account Suspended
               </div>
            </div>
          </div>

          {/* RIGHT CONTENT */}
          <div className="flex-1 flex flex-col relative bg-white/50 backdrop-blur-sm">
            <button
              onClick={onClose}
              className="absolute top-6 right-6 w-10 h-10 rounded-full bg-[#FFFCEB] border border-[#3A6131]/10 flex items-center justify-center text-[#3A6131] hover:bg-[#3A6131] hover:text-[#FFFCEB] transition-all z-20"
            >
              <X size={20} strokeWidth={2.5} />
            </button>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-10 [&::-webkit-scrollbar]:w-[5px] [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[#3A6131]/15 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-[#3A6131]/25">
              
              {/* Header Title inside scroll for flow */}
              <div className="mb-8">
                <span className="bg-red-500/10 text-red-600 border border-red-500/20 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
                  Action Required
                </span>
                <h3 className="text-2xl font-black text-[#3A6131] mt-3 font-raleway italic">
                  Suspension Overview
                </h3>
              </div>

              <div className="space-y-6">
                {/* Expiry Warning Banner */}
                {(isExpiringSoon || isExpired) && (
                  <div
                    className={`px-4 py-4 border rounded-2xl flex items-start gap-3 shadow-sm ${
                      isExpired
                        ? "bg-red-50 border-red-200"
                        : "bg-yellow-50 border-[#F7B71D]/40"
                    }`}
                  >
                    <AlertCircle
                      size={20}
                      className={`shrink-0 mt-0.5 ${
                        isExpired ? "text-red-500" : "text-yellow-600"
                      }`}
                    />
                    <div>
                      <p className={`text-[13px] font-bold ${isExpired ? "text-red-800" : "text-yellow-800"}`}>
                        {isExpired ? "Suspension Expired" : "Expiring Soon"}
                      </p>
                      <p className={`text-xs mt-1 font-medium ${isExpired ? "text-red-700" : "text-yellow-700"}`}>
                        {isExpired
                          ? "The suspension period has expired. This tenant should be reviewed immediately for termination."
                          : `Only ${daysLeft} day${daysLeft === 1 ? "" : "s"} remaining before auto-termination eligibility.`}
                      </p>
                    </div>
                  </div>
                )}

                {/* Info Grid */}
                <div className="grid grid-cols-2 gap-5">
                  <InfoField label="Account Owner" value={tenant.owner_name} icon={User} />
                  <InfoField label="Email Address" value={tenant.owner_email || "N/A"} icon={Mail} />
                  <InfoField label="Suspended On" value={formatDate(tenant.suspended_at)} icon={Calendar} />
                  <InfoField
                    label="Suspension Expires"
                    value={
                      tenant.suspension_expires_at
                        ? `${formatDate(tenant.suspension_expires_at)}${
                            daysLeft !== null
                              ? ` (${daysLeft > 0 ? `${daysLeft}d left` : "Expired"})`
                              : ""
                          }`
                        : "Indefinite"
                    }
                    icon={Clock}
                  />
                  <InfoField
                    label="Reason for Suspension"
                    value={tenant.reason || "No reason provided."}
                    icon={FileText}
                    className="col-span-2"
                  />
                </div>

                {/* Billing Panel Component */}
                <div className="pt-2">
                  <BillingPanel records={records} loading={loadingRecords} />
                </div>

                {/* Policy Notice Box */}
                <div className="mt-6 p-5 rounded-2xl bg-[#3A6131]/5 border border-[#3A6131]/10 flex gap-3 items-start">
                  <FileText size={18} className="text-[#3A6131] shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[12px] font-bold text-[#3A6131] block mb-1">System Policy Reminder</span>
                    <span className="text-[13px] text-[#3A6131]/70 font-medium leading-relaxed">
                      Tenants suspended for non-payment are automatically eligible for termination after 
                      <strong className="text-[#3A6131] mx-1">7 days</strong> 
                      if the outstanding balance remains unresolved. Use <em>Send Notification</em> to issue a warning.
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="px-8 py-5 border-t border-[#3A6131]/10 bg-white/80 flex justify-end items-center z-20 shrink-0">
              <button
                onClick={onClose}
                className="bg-[#3A6131] text-[#FFFCEB] px-8 py-3 rounded-2xl text-sm font-bold flex items-center gap-2 hover:opacity-90 transition-opacity shadow-md"
              >
                Acknowledge & Close
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}