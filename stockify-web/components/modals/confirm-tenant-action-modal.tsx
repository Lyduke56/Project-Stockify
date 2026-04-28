"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

// ── Types ─────────────────────────────────────────────────────────────────────

export type ConfirmActionType = "suspend" | "terminate" | "restore" | "approve" | "decline";

export interface ConfirmActionModalProps {
  isOpen:      boolean;
  actionType:  ConfirmActionType;
  tenantName:  string;
  isLoading?:  boolean;
  onConfirm:   (value?: string) => void;
  onClose:     () => void;
}

// ── Per-action config ─────────────────────────────────────────────────────────

const CONFIG: Record<
  ConfirmActionType,
  {
    title:         string;
    description:   (name: string) => string;
    warning?:      string;
    inputLabel?:   string;
    inputHint?:    string;
    accentBar:     string;
    confirmLabel:  string;
    confirmClass:  string;
    icon:          React.ReactNode;
  }
> = {

  suspend: {
    title:       "Suspend Tenant",
    description: (name) =>
      `You're about to temporarily suspend "${name}". Their access will be blocked and they will be emailed immediately.`,
    inputLabel:  "Suspension Reason",
    inputHint:   "Shown in the suspension email sent to the tenant owner. Leave blank to use the default.",
    accentBar:   "bg-[#E5AD24]",
    confirmLabel:"Yes, Suspend",
    confirmClass:"bg-[#E5AD24] text-[#385E31] hover:bg-[#D19D1F]",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="34" height="34" viewBox="0 0 24 24"
        fill="none" stroke="#E5AD24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="10" y1="15" x2="10" y2="9" />
        <line x1="14" y1="15" x2="14" y2="9" />
      </svg>
    ),
  },

  terminate: {
    title:       "Terminate Tenant",
    description: (name) =>
      `You're about to permanently terminate "${name}". This action cannot be undone and the owner will be notified via email.`,
    warning:
      "All user accounts, subscription records, and data linked to this tenant will be permanently deleted.",
    inputLabel:  "Termination Remarks",
    inputHint:   "Included in the termination email. Leave blank to use the default.",
    accentBar:   "bg-[#E91F22]",
    confirmLabel:"Yes, Terminate",
    confirmClass:"bg-[#E91F22] text-[#FFFCEB] hover:bg-[#C41A1D]",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="34" height="34" viewBox="0 0 24 24"
        fill="none" stroke="#E91F22" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="3 6 5 6 21 6" />
        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
        <path d="M10 11v6" /><path d="M14 11v6" />
        <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
      </svg>
    ),
  },

  restore: {
    title:       "Restore Tenant",
    description: (name) =>
      `You're about to restore "${name}". Their account will be reactivated and access reinstated.`,
    accentBar:   "bg-[#385E31]",
    confirmLabel:"Yes, Restore",
    confirmClass:"bg-[#385E31] text-[#FFFCEB] hover:bg-[#2D4B24]",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="34" height="34" viewBox="0 0 24 24"
        fill="none" stroke="#385E31" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="1 4 1 10 7 10" />
        <path d="M3.51 15a9 9 0 1 0 .49-3.51" />
      </svg>
    ),
  },

  approve: {
    title:       "Approve Application",
    description: (name) =>
      `You're about to approve the application for "${name}". Their account will be activated immediately.`,
    accentBar:   "bg-[#385E31]",
    confirmLabel:"Yes, Approve",
    confirmClass:"bg-[#385E31] text-[#FFFCEB] hover:bg-[#2D4B24]",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="34" height="34" viewBox="0 0 24 24"
        fill="none" stroke="#385E31" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
      </svg>
    ),
  },

  decline: {
    title:       "Decline Application",
    description: (name) =>
      `You're about to decline the application for "${name}". The applicant will be notified.`,
    accentBar:   "bg-[#E91F22]",
    confirmLabel:"Yes, Decline",
    confirmClass:"bg-[#E91F22] text-[#FFFCEB] hover:bg-[#C41A1D]",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="34" height="34" viewBox="0 0 24 24"
        fill="none" stroke="#E91F22" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="15" y1="9" x2="9" y2="15" />
        <line x1="9" y1="9" x2="15" y2="15" />
      </svg>
    ),
  },
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function ConfirmActionModal({
  isOpen,
  actionType,
  tenantName,
  isLoading = false,
  onConfirm,
  onClose,
}: ConfirmActionModalProps) {
  const [inputVal, setInputVal] = useState("");
  const cfg = CONFIG[actionType];

  // Reset input whenever the modal (re-)opens
  useEffect(() => {
    if (isOpen) setInputVal("");
  }, [isOpen]);

  const hasInput = !!cfg.inputLabel;

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
            onClick={!isLoading ? onClose : undefined}
          />

          {/* Modal card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 18 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 18 }}
            transition={{ type: "spring", stiffness: 320, damping: 26 }}
            className="relative z-10 w-[500px] max-w-[90vw] mx-4 bg-[#FFFCEB] rounded-[14px] shadow-2xl border border-[#385E31]/15"
          >
            {/* Accent bar */}
            <div className={`h-[5px] w-full ${cfg.accentBar}`} />

            <div className="px-7 pt-6 pb-7 flex flex-col items-center gap-5">

              {/* Icon bubble */}
              <div className="w-[62px] h-[62px] rounded-full bg-[#385E31]/6 border border-[#385E31]/12 flex items-center justify-center shrink-0">
                {cfg.icon}
              </div>

              {/* Title + description */}
              <div className="text-center flex flex-col gap-2">
                <h3 className="text-[#385E31] text-[19px] font-extrabold leading-tight">
                  {cfg.title}
                </h3>
                <p className="text-[#385E31]/70 text-[13px] font-medium leading-relaxed">
                  {cfg.description(tenantName)}
                </p>
              </div>

              {/* Suspension / termination info box */}
              {actionType === "suspend" && (
                <div className="w-full flex items-start gap-2.5 bg-[#FFD980]/30 border border-[#E5AD24]/40 rounded-[8px] px-4 py-3">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
                    fill="none" stroke="#E5AD24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                    className="shrink-0 mt-[1px]">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <p className="text-[#6B5000] text-[12px] font-semibold leading-relaxed">
                    The tenant will have <strong>7 days</strong> to settle their balance before their
                    account is automatically terminated.
                  </p>
                </div>
              )}

              {/* Reason / Remarks textarea */}
              {hasInput && (
                <div className="w-full flex flex-col gap-1.5">
                  <label className="text-[#385E31] text-[11px] font-bold uppercase tracking-wider opacity-70">
                    {cfg.inputLabel} <span className="font-medium normal-case opacity-60">(Optional)</span>
                  </label>
                  {cfg.inputHint && (
                    <p className="text-[#385E31]/45 text-[11px] font-medium leading-snug -mt-0.5">
                      {cfg.inputHint}
                    </p>
                  )}
                  <textarea
                    value={inputVal}
                    onChange={(e) => setInputVal(e.target.value)}
                    placeholder={`Enter details for the owner of ${tenantName}…`}
                    disabled={isLoading}
                    rows={3}
                    className="w-full bg-white/50 border border-[#385E31]/20 rounded-[10px] px-3 py-2 text-[13px] text-[#385E31] outline-none focus:border-[#385E31]/50 focus:bg-white transition-all resize-none disabled:opacity-50"
                  />
                </div>
              )}

              {/* Warning box (terminate only) */}
              {cfg.warning && (
                <div className="w-full flex items-start gap-2.5 bg-[#E91F22]/6 border border-[#E91F22]/20 rounded-[8px] px-4 py-3">
                  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24"
                    fill="none" stroke="#E91F22" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                    className="shrink-0 mt-[1px]">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                  <p className="text-[#E91F22] text-[12px] font-semibold leading-relaxed">
                    {cfg.warning}
                  </p>
                </div>
              )}

              {/* Divider */}
              <div className="w-full h-px bg-[#385E31]/10" />

              {/* Buttons */}
              <div className="flex gap-3 w-full">
                <button
                  onClick={onClose}
                  disabled={isLoading}
                  className="flex-1 border-2 border-[#385E31] text-[#385E31] font-bold text-[14px] py-[10px] rounded-[40px] hover:bg-[#385E31]/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={() => onConfirm(inputVal.trim() || undefined)}
                  disabled={isLoading}
                  className={`flex-1 font-bold text-[14px] py-[10px] rounded-[40px] transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${cfg.confirmClass}`}
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin" xmlns="http://www.w3.org/2000/svg" width="14" height="14"
                        viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                        strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                      </svg>
                      Processing…
                    </span>
                  ) : (
                    cfg.confirmLabel
                  )}
                </button>
              </div>

            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
