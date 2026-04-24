"use client";

import { useEffect, useState } from "react";
import { useTenantDetails } from "@/backend/hooks/useTenantDetails";

interface PendingTenantReviewModalProps {
  tenantId: string | null;
  onClose: () => void;
  onApprove: (tenantId: string) => Promise<void>;
  onReject: (tenantId: string) => Promise<void>;
}

// ── Icons ────────────────────────────────────────────────────────────────────

const XIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const ExternalLinkIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    <polyline points="15 3 21 3 21 9" />
    <line x1="10" y1="14" x2="21" y2="3" />
  </svg>
);

const SpinnerIcon = () => (
  <svg className="animate-spin" xmlns="http://www.w3.org/2000/svg" width="28" height="28"
    viewBox="0 0 24 24" fill="none" stroke="#385E31" strokeWidth="2.5"
    strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </svg>
);

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-PH", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] uppercase tracking-widest text-[#385E31]/50 font-bold">
        {label}
      </span>
      <span className="text-[13px] text-[#2D4B24] font-semibold">
        {value || <span className="italic text-[#385E31]/40 font-normal">Not provided</span>}
      </span>
    </div>
  );
}

function DocLink({ label, url }: { label: string; url?: string | null }) {
  return (
    <a
      href={url ?? "#"}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold border transition-all ${
        url
          ? "border-[#385E31] text-[#385E31] hover:bg-[#385E31] hover:text-[#FFFCEB]"
          : "border-[#385E31]/20 text-[#385E31]/30 cursor-not-allowed pointer-events-none"
      }`}
    >
      {label}
      {url && <ExternalLinkIcon />}
    </a>
  );
}

// ── Section divider ───────────────────────────────────────────────────────────

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span className="text-[11px] uppercase tracking-[0.15em] text-[#385E31]/60 font-extrabold">
        {children}
      </span>
      <div className="flex-1 h-px bg-[#385E31]/15" />
    </div>
  );
}

// ── Confirm sub-modal ─────────────────────────────────────────────────────────

function ConfirmDialog({
  action,
  businessName,
  onConfirm,
  onCancel,
  isLoading,
}: {
  action: "approve" | "reject";
  businessName: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading: boolean;
}) {
  return (
    <div
      className="absolute inset-0 z-10 flex items-center justify-center rounded-[12px] bg-black/30 backdrop-blur-[2px]"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div className="bg-[#FFF9D7] rounded-[8px] px-8 py-6 max-w-sm w-full mx-4 border border-[#385E31]/20 text-center shadow-xl">
        <h3 className="text-[#385E31] text-[18px] font-extrabold mb-2">
          {action === "approve" ? "APPROVE APPLICATION" : "REJECT APPLICATION"}
        </h3>
        <p className="text-[#3A6131] text-[13px] leading-relaxed mb-5">
          {action === "approve" ? (
            <>This will activate the account for <strong>{businessName}</strong>.</>
          ) : (
            <>This will permanently reject <strong>{businessName}</strong> and remove it from the system.</>
          )}
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="px-5 py-2 rounded-full border-2 border-[#385E31] text-[#385E31] font-bold text-sm hover:bg-[#385E31]/10 transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-5 py-2 rounded-full font-bold text-sm text-white transition disabled:opacity-70 ${
              action === "approve"
                ? "bg-[#385E31] hover:bg-[#2D4B24]"
                : "bg-[#E91F22] hover:bg-red-700"
            }`}
          >
            {isLoading
              ? "Processing..."
              : action === "approve"
              ? "Yes, Approve"
              : "Yes, Reject"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Modal ────────────────────────────────────────────────────────────────

export default function PendingTenantReviewModal({
  tenantId,
  onClose,
  onApprove,
  onReject,
}: PendingTenantReviewModalProps) {
  const { tenant, loading, error, fetchTenant, reset } = useTenantDetails();
  const [confirmAction, setConfirmAction] = useState<"approve" | "reject" | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (tenantId) {
      fetchTenant(tenantId);
    } else {
      reset();
    }
  }, [tenantId, fetchTenant, reset]);

  if (!tenantId) return null;

  const handleConfirm = async () => {
    if (!confirmAction || !tenantId) return;
    setActionLoading(true);
    try {
      if (confirmAction === "approve") await onApprove(tenantId);
      else await onReject(tenantId);
      onClose();
    } finally {
      setActionLoading(false);
      setConfirmAction(null);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget && !confirmAction) onClose();
      }}
    >
      <div className="relative bg-[#FFFCEB] rounded-[12px] w-full max-w-2xl max-h-[90vh] flex flex-col border border-[#385E31]/30 shadow-2xl overflow-hidden">

        {/* ── Header ── */}
        <div className="bg-[#385E31] px-6 py-4 flex items-center justify-between flex-shrink-0">
          <div>
            <p className="text-[#FFFCEB]/60 text-[10px] uppercase tracking-widest font-bold">
              Pending Application
            </p>
            <h2 className="text-[#FFFCEB] text-[18px] font-extrabold leading-tight">
              {loading ? "Loading..." : tenant?.business_name ?? "Review Tenant"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-[#FFFCEB]/70 hover:text-[#FFFCEB] transition-colors p-1 rounded-full hover:bg-white/10"
          >
            <XIcon />
          </button>
        </div>

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto px-6 py-5">

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
          {!loading && error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm font-medium">
              {error}
            </div>
          )}

          {/* Content */}
          {!loading && !error && tenant && (
            <div className="flex flex-col gap-5">

              {/* Logo + quick stats */}
              <div className="flex items-center gap-4">
                {tenant.logo_url ? (
                  <img
                    src={tenant.logo_url}
                    alt="Business Logo"
                    className="w-16 h-16 rounded-[8px] object-cover border border-[#385E31]/20 flex-shrink-0"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-[8px] bg-[#385E31]/10 border border-[#385E31]/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-[#385E31]/30 text-[22px] font-extrabold select-none">
                      {tenant.business_name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <div>
                  <p className="text-[#2D4B24] text-[16px] font-extrabold leading-tight">
                    {tenant.business_name}
                  </p>
                  <p className="text-[#385E31]/60 text-[12px] font-semibold mt-0.5">
                    {tenant.business_type ?? "Business Type not specified"}
                  </p>
                  <p className="text-[#385E31]/50 text-[11px] mt-1">
                    Registered {formatDate(tenant.created_at)}
                  </p>
                </div>
              </div>

              {/* Business Info */}
              <div>
                <SectionTitle>Business Information</SectionTitle>
                <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                  <InfoRow label="Business Name" value={tenant.business_name} />
                  <InfoRow label="Business Type" value={tenant.business_type} />
                  <div className="col-span-2">
                    <InfoRow label="Warehouse / Address" value={tenant.business_warehouse_address} />
                  </div>
                </div>
              </div>

              {/* Owner Info */}
              <div>
                <SectionTitle>Owner Information</SectionTitle>
                <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                  <InfoRow label="Full Name" value={tenant.owner_full_name} />
                  <InfoRow label="Email Address" value={tenant.owner_email} />
                  <InfoRow label="Contact Number" value={tenant.contact_number} />
                  <InfoRow label="Gender" value={tenant.gender} />
                  <InfoRow label="Citizenship" value={tenant.citizenship} />
                  <div className="col-span-2">
                    <InfoRow label="Home Address" value={tenant.address} />
                  </div>
                </div>
              </div>

              {/* Documents */}
              <div>
                <SectionTitle>Submitted Documents</SectionTitle>
                <div className="flex flex-wrap gap-2">
                  <DocLink label="Owner Valid ID" url={tenant.owner_valid_id_url} />
                  <DocLink label="Business Permit" url={tenant.business_permit_url} />
                </div>
              </div>

            </div>
          )}
        </div>

        {/* ── Footer ── */}
        {!loading && !error && tenant && (
          <div className="flex-shrink-0 px-6 py-4 border-t border-[#385E31]/15 bg-[#FFFCEB] flex justify-end gap-2">
            <button
              onClick={() => setConfirmAction("reject")}
              className="px-5 py-2 rounded-full border-2 border-[#E91F22] text-[#E91F22] font-bold text-sm hover:bg-[#E91F22] hover:text-white transition-all"
            >
              Reject
            </button>
            <button
              onClick={() => setConfirmAction("approve")}
              className="px-5 py-2 rounded-full bg-[#385E31] text-[#FFFCEB] font-bold text-sm hover:bg-[#2D4B24] transition-all"
            >
              Approve
            </button>
          </div>
        )}

        {/* ── Confirm overlay ── */}
        {confirmAction && tenant && (
          <ConfirmDialog
            action={confirmAction}
            businessName={tenant.business_name}
            onConfirm={handleConfirm}
            onCancel={() => setConfirmAction(null)}
            isLoading={actionLoading}
          />
        )}
      </div>
    </div>
  );
}
