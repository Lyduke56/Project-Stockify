"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { 
  X, 
  Loader2, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Unlock, 
  UserX, 
  PauseCircle 
} from "lucide-react";

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
    description:   (name: string) => React.ReactNode;
    warning?:      React.ReactNode;
    inputLabel?:   string;
    inputHint?:    string;
    confirmLabel:  string;
    icon:          React.ElementType;
    // Theme classes
    headerClass:   string;
    headerText:    string;
    iconClass:     string;
    confirmClass:  string;
    borderClass:   string;
    warningClass?: string;
  }
> = {

  suspend: {
    title:        "Suspend Tenant",
    description:  (name) => (
      <>You are about to temporarily suspend <span className="font-bold text-[#3A6131]">{name}</span>. Their access will be blocked and they will be emailed immediately.</>
    ),
    warning:      <><span className="font-bold">Note:</span> The tenant will have <strong>7 days</strong> to settle their balance before their account is automatically terminated.</>,
    inputLabel:   "Suspension Reason",
    inputHint:    "Shown in the suspension email. Leave blank to use default.",
    confirmLabel: "Yes, Suspend",
    icon:         PauseCircle,
    headerClass:  "bg-[#E5AD24]",
    headerText:   "text-[#3A6131]",
    iconClass:    "bg-yellow-100 text-[#D19D1F]",
    confirmClass: "bg-[#E5AD24] text-[#3A6131] hover:bg-[#D19D1F]",
    borderClass:  "border-[#E5AD24]/30",
    warningClass: "bg-yellow-50 border-yellow-200 text-yellow-800",
  },

  terminate: {
    title:        "Terminate Tenant",
    description:  (name) => (
      <>You are about to permanently terminate <span className="font-bold text-red-600">{name}</span>. This action cannot be undone and the owner will be notified.</>
    ),
    warning:      <><span className="font-bold">Warning:</span> All user accounts, subscription records, and data linked to this tenant will be permanently deleted.</>,
    inputLabel:   "Termination Remarks",
    inputHint:    "Included in the termination email. Leave blank to use default.",
    confirmLabel: "Yes, Terminate",
    icon:         UserX,
    headerClass:  "bg-red-600",
    headerText:   "text-white",
    iconClass:    "bg-red-100 text-red-600",
    confirmClass: "bg-red-600 text-white hover:bg-red-700",
    borderClass:  "border-red-200",
    warningClass: "bg-red-50 border-red-100 text-red-600",
  },

  restore: {
    title:        "Restore Tenant",
    description:  (name) => (
      <>You are about to restore <span className="font-bold text-[#3A6131]">{name}</span>. Their account will be reactivated and access reinstated.</>
    ),
    confirmLabel: "Yes, Restore",
    icon:         Unlock,
    headerClass:  "bg-[#3A6131]",
    headerText:   "text-[#FFFCEB]",
    iconClass:    "bg-emerald-100 text-emerald-600",
    confirmClass: "bg-[#3A6131] text-[#FFFCEB] hover:bg-[#3A6131]/90",
    borderClass:  "border-[#3A6131]/20",
  },

  approve: {
    title:        "Approve Application",
    description:  (name) => (
      <>You are about to approve the application for <span className="font-bold text-[#3A6131]">{name}</span>. Their account will be activated immediately.</>
    ),
    confirmLabel: "Yes, Approve",
    icon:         CheckCircle2,
    headerClass:  "bg-[#3A6131]",
    headerText:   "text-[#FFFCEB]",
    iconClass:    "bg-emerald-100 text-emerald-600",
    confirmClass: "bg-[#3A6131] text-[#FFFCEB] hover:bg-[#3A6131]/90",
    borderClass:  "border-[#3A6131]/20",
  },

  decline: {
    title:        "Decline Application",
    description:  (name) => (
      <>You are about to decline the application for <span className="font-bold text-red-600">{name}</span>. The applicant will be notified.</>
    ),
    confirmLabel: "Yes, Decline",
    icon:         XCircle,
    headerClass:  "bg-red-600",
    headerText:   "text-white",
    iconClass:    "bg-red-100 text-red-600",
    confirmClass: "bg-red-600 text-white hover:bg-red-700",
    borderClass:  "border-red-200",
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
  const IconComponent = cfg.icon;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center font-['Inter']">
          
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/20 backdrop-blur-sm"
            onClick={!isLoading ? onClose : undefined}
          />

          {/* Modal card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: "spring", stiffness: 320, damping: 26 }}
            className={`relative z-10 bg-[#FFFCEB] rounded-[24px] shadow-2xl w-[440px] max-w-[95vw] overflow-hidden border ${cfg.borderClass}`}
          >
            {/* Header */}
            <div className={`${cfg.headerClass} px-6 py-4 flex items-center justify-between`}>
              <div className={`flex items-center gap-2 ${cfg.headerText}`}>
                <IconComponent size={18} strokeWidth={2.5} />
                <h2 className="font-bold text-lg tracking-wide">{cfg.title}</h2>
              </div>
              <button
                onClick={onClose}
                disabled={isLoading}
                className={`${cfg.headerText} opacity-70 hover:opacity-100 transition-opacity disabled:opacity-50`}
              >
                <X size={20} strokeWidth={2.5} />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 flex flex-col items-center text-center gap-4">
              
              {/* Icon Bubble */}
              <div className={`w-16 h-16 rounded-full flex items-center justify-center shadow-sm ${cfg.iconClass}`}>
                <IconComponent size={32} />
              </div>

              {/* Text */}
              <div>
                <p className="text-[#3A6131] font-bold text-lg">Are you sure?</p>
                <p className="text-gray-500 text-[13.5px] mt-1 leading-relaxed px-2">
                  {cfg.description(tenantName)}
                </p>
              </div>

              {/* Input Area */}
              {hasInput && (
                <div className="w-full text-left mt-2">
                  <label className="block text-[12px] font-bold text-[#3A6131] mb-1.5 ml-1">
                    {cfg.inputLabel} <span className="text-gray-400 font-normal">(Optional)</span>
                  </label>
                  <textarea
                    value={inputVal}
                    onChange={(e) => setInputVal(e.target.value)}
                    disabled={isLoading}
                    rows={3}
                    placeholder="Enter additional remarks here..."
                    className="w-full border-[1.5px] border-[#3A6131]/20 rounded-xl px-4 py-3 bg-white text-[#3A6131] text-sm outline-none focus:border-[#F7B71D] focus:ring-2 focus:ring-[#F7B71D]/20 transition-all resize-none placeholder:text-gray-300 disabled:opacity-50"
                  />
                  {cfg.inputHint && (
                    <p className="text-[11px] text-[#3A6131]/50 mt-1.5 font-medium px-1 flex items-start gap-1">
                      {cfg.inputHint}
                    </p>
                  )}
                </div>
              )}

              {/* Warning Box */}
              {cfg.warning && (
                <div className={`w-full p-3.5 rounded-xl border text-left mt-1 flex items-start gap-2.5 ${cfg.warningClass}`}>
                  <AlertTriangle size={16} className="shrink-0 mt-[1px]" />
                  <p className="text-xs font-medium leading-relaxed">
                    {cfg.warning}
                  </p>
                </div>
              )}

            </div>

            {/* Footer */}
            <div className="px-6 pb-6 flex gap-3">
              <button
                onClick={onClose}
                disabled={isLoading}
                className="flex-1 py-2.5 border-2 border-[#3A6131] text-[#3A6131] font-bold rounded-xl hover:bg-[#3A6131]/5 transition-colors disabled:opacity-50"
              >
                Go Back
              </button>
              <button
                onClick={() => onConfirm(inputVal.trim() || undefined)}
                disabled={isLoading}
                className={`flex-1 py-2.5 font-bold rounded-xl shadow-md transition-colors flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed ${cfg.confirmClass}`}
              >
                {isLoading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Processing...
                  </>
                ) : (
                  cfg.confirmLabel
                )}
              </button>
            </div>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}