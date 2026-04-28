"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Sidebar from "@/components/navbars/sidebar-superadmin";
import NavbarApp from "@/components/navbars/navbar-superadmin";
import ClientProfileModal from "@/components/modals/client-profile-modal";
import NotificationModal from "@/components/modals/notification-modal";

// ── Inline Confirmation Modal ─────────────────────────────────────────────────

type ActionType = "approve" | "decline" | "suspend" | "terminate";

interface ConfirmModalProps {
  isOpen: boolean;
  actionType: ActionType;
  tenantName: string;
  isLoading: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

const ACTION_CONFIG: Record<
  ActionType,
  {
    title: string;
    description: (name: string) => string;
    confirmLabel: string;
    confirmStyle: string;
    icon: React.ReactNode;
  }
> = {
  approve: {
    title: "Approve Application",
    description: (name) =>
      `You're about to approve the application for "${name}". Their account will be activated immediately.`,
    confirmLabel: "Yes, Approve",
    confirmStyle: "bg-[#385E31] text-[#FFFCEB] hover:bg-[#2D4B24]",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24"
        fill="none" stroke="#385E31" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
      </svg>
    ),
  },
  decline: {
    title: "Decline Application",
    description: (name) =>
      `You're about to decline the application for "${name}". This action will notify the applicant.`,
    confirmLabel: "Yes, Decline",
    confirmStyle: "bg-[#E91F22] text-[#FFFCEB] hover:bg-[#C41A1D]",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24"
        fill="none" stroke="#E91F22" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="15" y1="9" x2="9" y2="15" />
        <line x1="9" y1="9" x2="15" y2="15" />
      </svg>
    ),
  },
  suspend: {
    title: "Suspend Tenant",
    description: (name) =>
      `You're about to temporarily suspend "${name}". Their access will be blocked until restored. This can be undone.`,
    confirmLabel: "Yes, Suspend",
    confirmStyle: "bg-[#E5AD24] text-[#385E31] hover:bg-[#D19D1F]",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24"
        fill="none" stroke="#E5AD24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="10" y1="15" x2="10" y2="9" />
        <line x1="14" y1="15" x2="14" y2="9" />
      </svg>
    ),
  },
  terminate: {
    title: "Terminate Tenant",
    description: (name) =>
      `You're about to permanently terminate "${name}". All data associated with this account will be deleted and cannot be recovered.`,
    confirmLabel: "Yes, Terminate",
    confirmStyle: "bg-[#E91F22] text-[#FFFCEB] hover:bg-[#C41A1D]",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24"
        fill="none" stroke="#E91F22" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="3 6 5 6 21 6" />
        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
        <path d="M10 11v6" />
        <path d="M14 11v6" />
        <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
      </svg>
    ),
  },
};

function ConfirmModal({ isOpen, actionType, tenantName, isLoading, onConfirm, onClose }: ConfirmModalProps) {
  const cfg = ACTION_CONFIG[actionType];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={!isLoading ? onClose : undefined}
          />

          {/* Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 16 }}
            transition={{ type: "spring", stiffness: 320, damping: 26 }}
            className="relative z-10 w-full max-w-[420px] mx-4 bg-[#FFFCEB] rounded-[14px] shadow-2xl border border-[#385E31]/20 overflow-hidden"
          >
            {/* Top accent bar */}
            <div
              className={`h-1.5 w-full ${
                actionType === "approve"
                  ? "bg-[#385E31]"
                  : actionType === "suspend"
                  ? "bg-[#E5AD24]"
                  : "bg-[#E91F22]"
              }`}
            />

            <div className="p-7 flex flex-col items-center gap-5">
              {/* Icon */}
              <div className="w-16 h-16 rounded-full bg-[#385E31]/5 border border-[#385E31]/10 flex items-center justify-center">
                {cfg.icon}
              </div>

              {/* Text */}
              <div className="text-center flex flex-col gap-2">
                <h3 className="text-[#385E31] text-[20px] font-extrabold">{cfg.title}</h3>
                <p className="text-[#385E31]/75 text-[13px] font-medium leading-relaxed">
                  {cfg.description(tenantName)}
                </p>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 w-full mt-1">
                <button
                  onClick={onClose}
                  disabled={isLoading}
                  className="flex-1 border-2 border-[#385E31] text-[#385E31] font-bold text-[14px] py-2.5 rounded-[40px] hover:bg-[#385E31]/5 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={onConfirm}
                  disabled={isLoading}
                  className={`flex-1 font-bold text-[14px] py-2.5 rounded-[40px] transition-colors disabled:opacity-60 ${cfg.confirmStyle}`}
                >
                  {isLoading ? "Processing…" : cfg.confirmLabel}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── Reusable UI pieces ────────────────────────────────────────────────────────

function SectionCard({
  iconPath,
  title,
  children,
  delay = 0,
}: {
  iconPath: string;
  title: string;
  children: React.ReactNode;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 25, delay }}
      className="w-full px-6 sm:px-8 pt-4 pb-5 bg-[#385E31] rounded-[10px] shadow-[2px_4px_18px_0px_rgba(0,0,0,0.25)] flex flex-col gap-3"
    >
      <div className="flex justify-start items-center gap-3">
        <div className="w-8 h-8 flex justify-center items-center">
          <img src={iconPath} alt={title} className="w-full h-full object-contain" />
        </div>
        <div className="flex-1 text-[#FFF9D7] text-[22px] sm:text-[26px] font-bold font-['Inter']">
          {title}
        </div>
      </div>
      <div className="w-full p-4 sm:p-5 bg-[#FFF9D7] rounded-[5px] flex flex-col gap-4">
        {children}
      </div>
    </motion.div>
  );
}

function ReadOnlyField({
  placeholder,
  value,
  className = "",
}: {
  placeholder: string;
  value: string;
  className?: string;
}) {
  return (
    <input
      type="text"
      placeholder={placeholder}
      value={value}
      readOnly
      className={`bg-[#FFD980] placeholder-[#3A6131]/70 text-[#3A6131] font-semibold text-[14px] px-4 py-2 rounded-[5px] outline outline-1 outline-offset-[-1px] outline-[#3A6131]/40 w-full cursor-default ${className}`}
    />
  );
}

function DocumentField({ label, fileName }: { label: string; fileName: string }) {
  return (
    <div className="flex items-center gap-2 w-full h-full relative">
      <input
        value={fileName}
        readOnly
        placeholder={label}
        className="bg-[#FFD980] placeholder-[#3A6131]/70 text-[#3A6131] font-semibold text-[14px] px-4 py-2 rounded-[5px] outline outline-1 outline-offset-[-1px] outline-[#3A6131]/40 w-full truncate cursor-default pr-24"
      />
      <button
        type="button"
        className="absolute right-2 shrink-0 bg-[#385E31] text-[#FFD980] font-bold text-[11px] px-4 py-1 rounded-[12px] hover:bg-[#2D4B24] transition shadow-sm"
      >
        View
      </button>
    </div>
  );
}

// ── Toast banner ──────────────────────────────────────────────────────────────

function Toast({ msg, type }: { msg: string; type: "success" | "error" }) {
  return (
    <AnimatePresence>
      {msg && (
        <motion.p
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className={`w-full px-4 py-2 rounded text-sm font-medium mb-4 ${
            type === "success"
              ? "bg-[#e8f5e2] border border-[#385E31]/30 text-[#385E31]"
              : "bg-red-100 border border-red-300 text-red-700"
          }`}
        >
          {msg}
        </motion.p>
      )}
    </AnimatePresence>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function TenantReview() {
  const params = useParams();
  const router = useRouter();
  const tenantId = params?.tenantId as string;

  // Mock data — replace with real fetch using tenantId
  const [reviewData] = useState({
    ownerFullName:      "Benideck M. Longakit",
    gender:             "Male",
    email:              "benideck@example.com",
    citizenship:        "Filipino",
    contactNumber:      "+63 912 345 6789",
    address:            "123 Mango Avenue, Cebu City",
    businessName:       "Tech IT Hub",
    businessType:       "Non-Food & Beverage",
    businessPermitName: "tech_it_hub_permit_2026.pdf",
    ownerValidIdName:   "benideck_id.pdf",
    warehouseAddress:   "456 IT Park Blvd, Cebu City",
  });

  // Modal state
  const [activeAction,  setActiveAction]  = useState<ActionType | null>(null);
  const [isLoading,     setIsLoading]     = useState(false);
  const [successMsg,    setSuccessMsg]    = useState("");
  const [errorMsg,      setErrorMsg]      = useState("");

  // Navbar modals
  const [isNotifsOpen,  setIsNotifsOpen]  = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // ── Action handler ──────────────────────────────────────────────────────────

  const handleConfirm = async () => {
    if (!activeAction) return;
    setIsLoading(true);
    setErrorMsg("");

    try {
      let endpoint = "";
      let body: Record<string, unknown> = {};

      switch (activeAction) {
        case "approve":
          endpoint = "/api/superadmin/approve";
          body     = { tenantId, action: "approve" };
          break;
        case "decline":
          endpoint = "/api/superadmin/approve";
          body     = { tenantId, action: "reject" };
          break;
        case "suspend":
          endpoint = "/api/superadmin/suspend";
          body     = { tenantId };
          break;
        case "terminate":
          endpoint = "/api/superadmin/terminate";
          body     = { tenantId };
          break;
      }

      const res    = await fetch(endpoint, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(body),
      });
      const result = await res.json();
      if (!result.success) throw new Error(result.error ?? "Action failed.");

      setActiveAction(null);
      setSuccessMsg(
        activeAction === "approve"
          ? "Tenant approved successfully."
          : activeAction === "decline"
          ? "Application declined."
          : activeAction === "suspend"
          ? `${reviewData.businessName} has been suspended.`
          : `${reviewData.businessName} has been terminated.`,
      );
      setTimeout(() => setSuccessMsg(""), 4000);

      // Redirect back after destructive actions
      if (activeAction === "terminate" || activeAction === "decline") {
        setTimeout(() => router.push("/superadmin/tenant-management"), 1500);
      }
    } catch (err: unknown) {
      setActiveAction(null);
      setErrorMsg(err instanceof Error ? err.message : "Action failed.");
    } finally {
      setIsLoading(false);
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="flex h-screen w-full bg-[#FFFCEB] overflow-hidden font-['Inter']">

      <Sidebar />

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="flex-1 flex flex-col h-full overflow-y-auto px-10 md:px-20 pt-5 pb-12"
      >
        <NavbarApp
          onHome={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          openNotifs={() => setIsNotifsOpen(true)}
          openProfile={() => setIsProfileOpen(true)}
        />

        {/* Page header */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="w-full flex flex-col items-center mt-10 mb-8 gap-2"
        >
          <h1 className="text-[#385E31] text-[30px] font-extrabold tracking-wide uppercase">
            TENANT REVIEW
          </h1>
          <div className="w-full max-w-[900px] h-1.5 bg-[#F7B71D] rounded-full" />
        </motion.div>

        {/* Feedback banners */}
        <div className="w-full max-w-5xl mx-auto">
          <Toast msg={successMsg} type="success" />
          <Toast msg={errorMsg}   type="error"   />
        </div>

        {/* Form */}
        <div className="w-full max-w-5xl mx-auto flex flex-col gap-8">

          {/* Section 1: Business Owner */}
          <SectionCard iconPath="/business-owner.svg" title="Business Owner's Information" delay={0.2}>
            <div className="flex flex-col md:flex-row gap-5 items-stretch w-full">
              <div className="w-full md:w-[180px] shrink-0">
                <div className="relative w-full aspect-square bg-[#FFD980] rounded-[5px] outline outline-1 outline-[#3A6131]/40 flex items-center justify-center overflow-hidden">
                  <img src="/business-owner.svg" alt="Owner" className="w-24 h-24 object-contain opacity-70" />
                </div>
              </div>
              <div className="flex-1 flex flex-col justify-between gap-3">
                <ReadOnlyField placeholder="Full Name *"           value={reviewData.ownerFullName}  />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <ReadOnlyField placeholder="Gender *"            value={reviewData.gender}         />
                  <ReadOnlyField placeholder="Email Address *"     value={reviewData.email}          />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <ReadOnlyField placeholder="Citizenship *"       value={reviewData.citizenship}    />
                  <ReadOnlyField placeholder="Contact No. *"       value={reviewData.contactNumber}  />
                </div>
                <ReadOnlyField placeholder="Permanent Address *"   value={reviewData.address}        />
              </div>
            </div>
          </SectionCard>

          {/* Section 2: Business Details */}
          <SectionCard iconPath="/business-details.svg" title="Business Details" delay={0.3}>
            <div className="flex flex-col md:flex-row gap-5 items-stretch w-full">
              <div className="w-full md:w-[180px] shrink-0">
                <div className="relative w-full aspect-square bg-[#FFD980] rounded-[5px] outline outline-1 outline-[#3A6131]/40 flex items-center justify-center overflow-hidden">
                  <img src="/business-details.svg" alt="Logo" className="w-24 h-24 object-contain opacity-70" />
                </div>
              </div>
              <div className="flex-1 flex flex-col justify-between gap-3">
                <ReadOnlyField placeholder="Business Name *"                       value={reviewData.businessName}      />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <ReadOnlyField placeholder="Business Type *"                     value={reviewData.businessType}      />
                  <ReadOnlyField placeholder="Owner Full Name (as on permit) *"    value={reviewData.ownerFullName}     />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <DocumentField label="Owner's Valid ID *"   fileName={reviewData.ownerValidIdName}   />
                  <DocumentField label="Business Permit *"    fileName={reviewData.businessPermitName} />
                </div>
                <ReadOnlyField placeholder="Business/Warehouse Address *"          value={reviewData.warehouseAddress}  />
              </div>
            </div>
          </SectionCard>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 25, delay: 0.4 }}
            className="flex flex-wrap justify-center items-center gap-4 mt-2"
          >
            {/* Primary: Approve / Decline */}
            <button
              onClick={() => setActiveAction("approve")}
              className="bg-[#F7B71D] text-[#385E31] font-bold text-[18px] px-14 py-2.5 rounded-[40px] hover:opacity-90 transition-opacity shadow-md"
            >
              Approve
            </button>
            <button
              onClick={() => setActiveAction("decline")}
              className="bg-[#385E31] text-[#FFFCEB] font-bold text-[18px] px-14 py-2.5 rounded-[40px] hover:opacity-90 transition-opacity shadow-md"
            >
              Decline
            </button>

            {/* Divider */}
            <div className="w-px h-8 bg-[#385E31]/20 hidden sm:block" />

            {/* Secondary: Suspend / Terminate */}
            <button
              onClick={() => setActiveAction("suspend")}
              className="border-2 border-[#E5AD24] text-[#E5AD24] font-bold text-[15px] px-10 py-2.5 rounded-[40px] hover:bg-[#E5AD24]/10 transition-colors shadow-sm"
            >
              Suspend
            </button>
            <button
              onClick={() => setActiveAction("terminate")}
              className="border-2 border-[#E91F22] text-[#E91F22] font-bold text-[15px] px-10 py-2.5 rounded-[40px] hover:bg-[#E91F22]/10 transition-colors shadow-sm"
            >
              Terminate
            </button>
          </motion.div>

        </div>
      </motion.div>

      {/* Confirm Modal */}
      {activeAction && (
        <ConfirmModal
          isOpen={!!activeAction}
          actionType={activeAction}
          tenantName={reviewData.businessName}
          isLoading={isLoading}
          onConfirm={handleConfirm}
          onClose={() => !isLoading && setActiveAction(null)}
        />
      )}

      {/* Navbar modals */}
      <NotificationModal  isOpen={isNotifsOpen}  onClose={() => setIsNotifsOpen(false)}  />
      <ClientProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
    </div>
  );
}