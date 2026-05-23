"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTenantDetails } from "@/backend/hooks/useTenantDetails";
import {
  X,
  Building2,
  User,
  FileCheck,
  Mail,
  Phone,
  MapPin,
  FileText,
  ExternalLink,
  ShieldQuestion,
  Loader2,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock
} from "lucide-react";

interface PendingTenantReviewModalProps {
  tenantId: string | null;
  onClose: () => void;
  onApprove: (tenantId: string) => Promise<void>;
  onReject: (tenantId: string) => Promise<void>;
}

type TabType = "business" | "owner" | "docs";

const TABS: { id: TabType; label: string; icon: React.ElementType }[] = [
  { id: "business", label: "Business Profile", icon: Building2 },
  { id: "owner", label: "Owner Details", icon: User },
  { id: "docs", label: "Verification Docs", icon: FileCheck },
];

// ─── Styles ───────────────────────────────────────────────────────────────────

const labelStyle = "text-[11px] font-black uppercase tracking-[0.12em] text-[#3A6131]/50 mb-2 block";
const readOnlyBoxStyle = "w-full bg-white border-[1.5px] border-[#3A6131]/10 rounded-2xl px-4 py-3 text-sm text-[#3A6131] font-medium flex items-center gap-3";

// ─── Sub-Components ───────────────────────────────────────────────────────────

function InfoField({ label, value, icon: Icon, className = "" }: { label: string; value?: string | null; icon: React.ElementType; className?: string }) {
  return (
    <div className={className}>
      <label className={labelStyle}>{label}</label>
      <div className={readOnlyBoxStyle}>
        <Icon size={18} className="text-[#3A6131]/40 shrink-0" />
        <span className="truncate">
          {value || <span className="italic text-[#3A6131]/40 font-normal">Not provided</span>}
        </span>
      </div>
    </div>
  );
}

function DocLink({ label, url }: { label: string; url?: string | null }) {
  if (!url) {
    return (
      <div className="w-full bg-gray-50 border-[1.5px] border-gray-200 rounded-2xl px-4 py-4 text-sm text-gray-400 font-medium flex items-center justify-between cursor-not-allowed">
        <div className="flex items-center gap-3">
          <FileText size={18} className="opacity-40 shrink-0" />
          <span>{label} (Missing)</span>
        </div>
      </div>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="w-full bg-white hover:bg-[#3A6131]/5 border-[1.5px] border-[#3A6131]/20 hover:border-[#3A6131]/40 rounded-2xl px-4 py-4 text-sm text-[#3A6131] font-bold flex items-center justify-between transition-all group shadow-sm"
    >
      <div className="flex items-center gap-3">
        <FileCheck size={18} className="text-[#3A6131]/40 group-hover:text-[#3A6131] transition-colors shrink-0" />
        <span>{label}</span>
      </div>
      <ExternalLink size={16} className="text-[#3A6131]/40 group-hover:text-[#3A6131] transition-colors shrink-0" />
    </a>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <span className="text-[11px] uppercase tracking-[0.15em] text-[#3A6131] font-black bg-[#3A6131]/10 px-3 py-1.5 rounded-full">
        {children}
      </span>
      <div className="flex-1 h-[1.5px] bg-[#3A6131]/10 rounded-full" />
    </div>
  );
}

// ─── Confirm Dialog Overlay ───────────────────────────────────────────────────

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
  const isApprove = action === "approve";
  const config = isApprove
    ? {
        title: "Approve Application",
        desc: <>You are about to approve the application for <span className="font-bold text-[#3A6131]">{businessName}</span>. Their account will be activated immediately.</>,
        btnLabel: "Yes, Approve Tenant",
        btnClass: "bg-[#3A6131] text-[#FFFCEB] hover:bg-[#3A6131]/90",
        icon: CheckCircle2,
        headerClass: "bg-[#3A6131]",
        iconClass: "bg-emerald-100 text-emerald-600",
        borderClass: "border-[#3A6131]/20"
      }
    : {
        title: "Reject Application",
        desc: <>You are about to permanently reject <span className="font-bold text-red-600">{businessName}</span>. The application will be removed and the applicant notified.</>,
        btnLabel: "Yes, Reject Tenant",
        btnClass: "bg-red-600 text-white hover:bg-red-700",
        icon: XCircle,
        headerClass: "bg-red-600",
        iconClass: "bg-red-100 text-red-600",
        borderClass: "border-red-200"
      };

  const IconComponent = config.icon;

  return (
    <div className="absolute inset-0 z-[250] flex items-center justify-center font-['Inter']">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-[#3A6131]/60 backdrop-blur-sm rounded-[32px]"
        onClick={!isLoading ? onCancel : undefined}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ type: "spring", stiffness: 320, damping: 26 }}
        className={`relative z-10 bg-[#FFFCEB] rounded-[24px] shadow-2xl w-[440px] max-w-[95vw] overflow-hidden border ${config.borderClass}`}
      >
        <div className={`${config.headerClass} px-6 py-4 flex items-center justify-between`}>
          <div className="flex items-center gap-2 text-white">
            <IconComponent size={18} strokeWidth={2.5} />
            <h2 className="font-bold text-lg tracking-wide">{config.title}</h2>
          </div>
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="text-white/70 hover:text-white transition-opacity disabled:opacity-50"
          >
            <X size={20} strokeWidth={2.5} />
          </button>
        </div>

        <div className="p-6 flex flex-col items-center text-center gap-4">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center shadow-sm ${config.iconClass}`}>
            <IconComponent size={32} />
          </div>
          <div>
            <p className="text-[#3A6131] font-bold text-lg">Are you sure?</p>
            <p className="text-gray-500 text-[13.5px] mt-1 leading-relaxed px-2">
              {config.desc}
            </p>
          </div>
        </div>

        <div className="px-6 pb-6 flex gap-3">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 py-2.5 border-2 border-[#3A6131] text-[#3A6131] font-bold rounded-xl hover:bg-[#3A6131]/5 transition-colors disabled:opacity-50"
          >
            Go Back
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex-1 py-2.5 font-bold rounded-xl shadow-md transition-colors flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed ${config.btnClass}`}
          >
            {isLoading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Processing...
              </>
            ) : (
              config.btnLabel
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Main Modal ───────────────────────────────────────────────────────────────

export default function PendingTenantReviewModal({
  tenantId,
  onClose,
  onApprove,
  onReject,
}: PendingTenantReviewModalProps) {
  const { tenant, loading, error, fetchTenant, reset } = useTenantDetails();
  const [confirmAction, setConfirmAction] = useState<"approve" | "reject" | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Interactive Tab State
  const [activeTab, setActiveTab] = useState<TabType>("business");

  useEffect(() => {
    if (tenantId) {
      fetchTenant(tenantId);
      setActiveTab("business"); // Reset tab when opening a new tenant
    } else {
      reset();
    }
  }, [tenantId, fetchTenant, reset]);

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

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString("en-PH", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <AnimatePresence>
      {tenantId && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          
          {/* Backdrop */}
          <motion.div
            key="review-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#3A6131]/60 backdrop-blur-sm"
            onClick={() => !confirmAction && onClose()}
          />

          {/* Modal Container */}
          <motion.div
            key="review-modal"
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ duration: 0.3, type: "spring", bounce: 0.25 }}
            className="w-full max-w-[960px] bg-[#FFFCEB] rounded-[32px] border-[1.5px] border-[#F7B71D]/20 shadow-[0_32px_80px_rgba(58,97,49,0.2)] flex flex-col md:flex-row h-[680px] font-inter relative z-10"
          >
            {/* LEFT SIDEBAR (Tabs) */}
            <div className="w-full md:w-[320px] bg-[#3A6131] p-10 flex flex-col relative overflow-hidden shrink-0 rounded-l-[32px]">
              <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-[#F7B71D]/10 rounded-full blur-3xl pointer-events-none" />
              <div className="relative z-10">
                <div className="bg-[#F7B71D] w-12 h-1 rounded-full mb-8" />
                <h2 className="text-[#FFFCEB] font-raleway text-3xl font-black leading-tight mb-2 truncate">
                  {tenant?.business_name || "Application"}
                </h2>
                <p className="text-[#FFFCEB]/60 text-xs font-medium leading-relaxed mb-12">
                  Review the applicant's business information and submitted legal documents before making a decision.
                </p>

                {/* Tabbing Navigation */}
                <nav className="flex flex-col gap-8">
                  {TABS.map((tab) => {
                    const isActive = activeTab === tab.id;
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-4 transition-all duration-300 w-full text-left ${
                          isActive ? "translate-x-2" : "opacity-60 hover:opacity-100"
                        }`}
                      >
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                            isActive
                              ? "bg-[#F7B71D] text-[#385E31] shadow-lg shadow-[#F7B71D]/20"
                              : "bg-white/10 text-white"
                          }`}
                        >
                          <Icon size={18} strokeWidth={2.5} />
                        </div>
                        <span
                          className={`text-sm font-bold tracking-wide ${
                            isActive ? "text-[#FFFCEB]" : "text-white"
                          }`}
                        >
                          {tab.label}
                        </span>
                      </button>
                    );
                  })}
                </nav>
              </div>

              <div className="mt-auto relative z-10 pointer-events-none">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-500/20 border border-yellow-500/30 text-yellow-200 text-xs font-bold shadow-sm">
                  <Clock size={14} className="animate-pulse" />
                  Pending Review
                </div>
              </div>
            </div>

            {/* RIGHT CONTENT */}
            <div className="flex-1 flex flex-col relative bg-white/50 backdrop-blur-sm rounded-r-[32px]">
              <button
                onClick={onClose}
                className="absolute top-6 right-6 w-10 h-10 rounded-full bg-[#FFFCEB] border border-[#3A6131]/10 flex items-center justify-center text-[#3A6131] hover:bg-[#3A6131] hover:text-[#FFFCEB] transition-all z-20"
              >
                <X size={20} strokeWidth={2.5} />
              </button>

              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="px-10 pt-10 pb-6 flex-shrink-0">
                  {/* Header Title */}
                  <div className="mb-6">
                    <span className="bg-[#3A6131]/10 text-[#3A6131] border border-[#3A6131]/20 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
                      Application Overview
                    </span>
                    <h3 className="text-2xl font-black text-[#3A6131] mt-3 font-raleway italic">
                      Verify Details
                    </h3>
                  </div>

                  {/* Top Identity Block (Always Visible) */}
                  {!loading && !error && tenant && (
                    <div className="flex items-center gap-5 p-5 bg-white border-[1.5px] border-[#3A6131]/10 rounded-2xl shadow-sm">
                      {tenant.logo_url ? (
                        <img
                          src={tenant.logo_url}
                          alt="Logo"
                          className="w-16 h-16 rounded-xl object-cover border-[1.5px] border-[#3A6131]/10 flex-shrink-0"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-xl bg-[#3A6131]/5 border-[1.5px] border-[#3A6131]/10 flex items-center justify-center flex-shrink-0">
                          <span className="text-[#3A6131]/30 text-2xl font-black uppercase">
                            {tenant.business_name.charAt(0)}
                          </span>
                        </div>
                      )}
                      <div>
                        <p className="text-[#3A6131] text-lg font-black leading-tight">
                          {tenant.business_name}
                        </p>
                        <p className="text-[#3A6131]/60 text-[13px] font-bold mt-0.5">
                          {tenant.business_type || "Type not specified"}
                        </p>
                        <p className="text-[#3A6131]/50 text-xs font-medium mt-1">
                          Applied on {formatDate(tenant.created_at)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Tab Content Area (Scrollable) */}
                <div className="flex-1 overflow-y-auto px-10 pb-10 [&::-webkit-scrollbar]:w-[5px] [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[#3A6131]/15 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-[#3A6131]/25">
                  {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                      <Loader2 size={40} className="animate-spin text-[#F7B71D]" />
                      <p className="text-[#3A6131]/60 text-sm font-bold animate-pulse">
                        Retrieving application data…
                      </p>
                    </div>
                  ) : error ? (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-5 py-4 rounded-2xl text-sm font-semibold flex items-center gap-3">
                      <AlertCircle size={20} className="shrink-0" />
                      {error}
                    </div>
                  ) : tenant ? (
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        transition={{ duration: 0.2 }}
                      >
                        {/* Tab 1: Business Profile */}
                        {activeTab === "business" && (
                          <div>
                            <SectionTitle>Business Profile Information</SectionTitle>
                            <div className="grid grid-cols-2 gap-6">
                              <InfoField label="Business Name" value={tenant.business_name} icon={Building2} />
                              <InfoField label="Business Type" value={tenant.business_type} icon={Building2} />
                              <InfoField label="Warehouse / Address" value={tenant.business_warehouse_address} icon={MapPin} className="col-span-2" />
                            </div>
                          </div>
                        )}

                        {/* Tab 2: Owner Details */}
                        {activeTab === "owner" && (
                          <div>
                            <SectionTitle>Primary Owner Details</SectionTitle>
                            <div className="grid grid-cols-2 gap-6">
                              <InfoField label="Full Name" value={tenant.owner_full_name} icon={User} />
                              <InfoField label="Email Address" value={tenant.owner_email} icon={Mail} />
                              <InfoField label="Contact Number" value={tenant.contact_number} icon={Phone} />
                              <InfoField label="Citizenship" value={tenant.citizenship} icon={ShieldQuestion} />
                              <InfoField label="Home Address" value={tenant.address} icon={MapPin} className="col-span-2" />
                            </div>
                          </div>
                        )}

                        {/* Tab 3: Verification Docs */}
                        {activeTab === "docs" && (
                          <div>
                            <SectionTitle>Submitted Verification Documents</SectionTitle>
                            <div className="grid grid-cols-2 gap-6">
                              <DocLink label="Owner Valid ID" url={tenant.owner_valid_id_url} />
                              <DocLink label="Business Permit" url={tenant.business_permit_url} />
                            </div>
                          </div>
                        )}
                      </motion.div>
                    </AnimatePresence>
                  ) : null}
                </div>
              </div>

              {/* Footer Actions */}
              {!loading && !error && tenant && (
                <div className="px-8 py-5 border-t border-[#3A6131]/10 bg-white/80 flex justify-end items-center gap-3 z-20 shrink-0">
                  <button
                    onClick={() => setConfirmAction("reject")}
                    className="px-8 py-3 rounded-2xl border-2 border-red-500 text-red-600 font-bold text-sm hover:bg-red-50 transition-colors shadow-sm flex items-center gap-2"
                  >
                    <XCircle size={18} />
                    Decline
                  </button>
                  <button
                    onClick={() => setConfirmAction("approve")}
                    className="bg-[#3A6131] text-[#FFFCEB] px-8 py-3 rounded-2xl text-sm font-bold hover:bg-[#3A6131]/90 transition-opacity shadow-md flex items-center gap-2"
                  >
                    <CheckCircle2 size={18} />
                    Approve Application
                  </button>
                </div>
              )}
            </div>
          </motion.div>

          {/* Confirm Overlay Modal */}
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
      )}
    </AnimatePresence>
  );
}