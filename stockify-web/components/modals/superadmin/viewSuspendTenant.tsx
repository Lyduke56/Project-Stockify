"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import {
  SuspendedTenant,
  BillingRecord,
  formatDate,
  formatMonth,
  daysUntilExpiry,
  AlertIcon,
  InfoBlock,
  ModalShell,
} from "./../../types";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ─── Payment Status Badge ─────────────────────────────────────────────────────

function PaymentStatusBadge({ status }: { status: BillingRecord["payment_status"] }) {
  const config = {
    Paid: {
      bg: "bg-emerald-50",
      border: "border-emerald-300",
      text: "text-emerald-700",
      dot: "bg-emerald-500",
      label: "Paid",
    },
    Pending: {
      bg: "bg-yellow-50",
      border: "border-yellow-300",
      text: "text-yellow-800",
      dot: "bg-yellow-400",
      label: "Pending",
    },
    Overdue: {
      bg: "bg-red-50",
      border: "border-red-300",
      text: "text-red-700",
      dot: "bg-red-500",
      label: "Overdue",
    },
  }[status];

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${config.bg} ${config.border} ${config.text}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.label}
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
      <div className="rounded-xl border border-[#385E31]/30 bg-white px-5 py-4">
        <p className="text-[#385E31] font-bold text-sm mb-2">Billing Records</p>
        <p className="text-xs text-[#385E31]/50 animate-pulse">Loading billing history...</p>
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div className="rounded-xl border border-[#385E31]/30 bg-white px-5 py-4">
        <p className="text-[#385E31] font-bold text-sm mb-2">Billing Records</p>
        <p className="text-sm text-[#385E31]/60 italic">No billing records found.</p>
      </div>
    );
  }

  // Latest record (most recent billing period)
  const latest = records[0];
  const hasPaid = latest.payment_status === "Paid";
  const hasOutstanding = ["Overdue", "Pending"].includes(latest.payment_status);

  return (
    <div className="rounded-xl border border-[#385E31]/30 bg-white px-5 py-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-[#385E31] font-bold text-sm">Billing Records</p>
        {/* Overall standing indicator */}
        {hasPaid ? (
          <span className="text-xs text-emerald-600 font-bold bg-emerald-50 border border-emerald-200 rounded-full px-3 py-0.5">
            ✓ Account in Good Standing
          </span>
        ) : (
          <span className="text-xs text-red-600 font-bold bg-red-50 border border-red-200 rounded-full px-3 py-0.5">
            ✗ Has Outstanding Balance
          </span>
        )}
      </div>

      {/* Latest billing record — prominent */}
      <div
        className={`rounded-lg px-4 py-3 border ${
          hasPaid
            ? "bg-emerald-50/60 border-emerald-200"
            : hasOutstanding
            ? "bg-red-50/60 border-red-200"
            : "bg-yellow-50/60 border-yellow-200"
        }`}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-[#385E31]/50 font-bold mb-0.5">
              Latest Billing Period
            </p>
            <p className="text-sm font-bold text-[#385E31]">{formatMonth(latest.billing_period)}</p>
            {latest.paid_at && (
              <p className="text-[11px] text-emerald-600 mt-0.5">
                Paid on {formatDate(latest.paid_at)}
              </p>
            )}
          </div>
          <div className="text-right space-y-1">
            <PaymentStatusBadge status={latest.payment_status} />
            <p
              className={`text-2xl font-black block ${
                hasPaid ? "text-emerald-600" : "text-red-600"
              }`}
            >
              ₱{Number(latest.amount).toLocaleString("en-PH", { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      </div>

      {/* Prior records (up to 2 more) */}
      {records.slice(1, 3).map((rec) => (
        <div
          key={rec.billing_period}
          className="flex items-center justify-between px-1 py-1 border-b border-[#385E31]/10 last:border-0"
        >
          <p className="text-xs text-[#385E31]/70">{formatMonth(rec.billing_period)}</p>
          <div className="flex items-center gap-3">
            <PaymentStatusBadge status={rec.payment_status} />
            <p className="text-xs font-bold text-[#385E31]">
              ₱{Number(rec.amount).toLocaleString("en-PH", { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── View Modal ───────────────────────────────────────────────────────────────

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
        .limit(5); // fetch last 5 for history
      setRecords((data as BillingRecord[]) || []);
      setLoadingRecords(false);
    };
    load();
  }, [tenant.tenant_id]);

  const daysLeft = daysUntilExpiry(tenant.suspension_expires_at);
  const isExpiringSoon = daysLeft !== null && daysLeft <= 3 && daysLeft >= 0;
  const isExpired = daysLeft !== null && daysLeft < 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-[#FFFCEB] border border-[#385E31] rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="bg-[#385E31] px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-[#FFFCEB] font-bold text-lg leading-tight">
              {tenant.business_name}
            </h2>
            <p className="text-[#FFFCEB]/60 text-xs mt-0.5">Suspension Details</p>
          </div>
          <button
            onClick={onClose}
            className="text-[#FFFCEB]/70 hover:text-[#FFFCEB] transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Scrollable body */}
        <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Expiry warning banner */}
          {(isExpiringSoon || isExpired) && (
            <div
              className={`flex items-start gap-2 rounded-lg px-4 py-3 text-sm font-semibold ${
                isExpired
                  ? "bg-red-50 border border-red-300 text-red-700"
                  : "bg-yellow-50 border border-[#E5AD24] text-yellow-800"
              }`}
            >
              <span className="mt-0.5 flex-shrink-0">
                <AlertIcon />
              </span>
              <span>
                {isExpired
                  ? "⚠️ Suspension period has expired. This tenant should be reviewed immediately."
                  : `⚠️ Only ${daysLeft} day${daysLeft === 1 ? "" : "s"} remaining before auto-termination.`}
              </span>
            </div>
          )}

          {/* Info grid */}
          <div className="grid grid-cols-2 gap-4">
            <InfoBlock label="Owner" value={tenant.owner_name} />
            <InfoBlock label="Email" value={tenant.owner_email || "N/A"} />
            <InfoBlock label="Suspended On" value={formatDate(tenant.suspended_at)} />
            <InfoBlock
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
            />
            <InfoBlock
              label="Suspension Reason"
              value={tenant.reason || "N/A"}
              className="col-span-2"
            />
          </div>

          {/* Billing records with status */}
          <BillingPanel records={records} loading={loadingRecords} />

          {/* Policy note */}
          <div className="bg-[#385E31]/5 border border-[#385E31]/20 rounded-lg px-4 py-3 text-xs text-[#385E31]/70 leading-relaxed">
            <strong className="text-[#385E31]">Policy Reminder:</strong> Tenants suspended for
            non-payment are automatically eligible for termination after{" "}
            <strong>7 days</strong> if the outstanding balance remains unresolved. Use{" "}
            <em>Send Notification</em> to issue a warning, or{" "}
            <em>Terminate Tenant</em> to proceed.
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-5 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-full border border-[#385E31] text-[#385E31] text-sm font-bold hover:bg-[#385E31]/10 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}