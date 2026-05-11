"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface SendNotificationModalProps {
  isOpen:          boolean;
  tenantName:      string;
  nextBillingDate: string | null; // ISO date string YYYY-MM-DD
  isLoading?:      boolean;
  onConfirm: (fields: {
    title:       string;
    header:      string;
    about:       string;
    body:        string;
    description: string;
  }) => void;
  onClose: () => void;
}

interface NotifFields {
  title:       string;
  header:      string;
  about:       string;
  body:        string;
  description: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const formatDate = (iso: string | null): string => {
  if (!iso) return "your upcoming billing date";
  return new Date(iso + "T00:00:00").toLocaleDateString("en-PH", {
    month: "long", day: "numeric", year: "numeric",
  });
};

const buildDefaults = (tenantName: string, nextBillingDate: string | null): NotifFields => {
  const dueDateLabel = formatDate(nextBillingDate);
  return {
    title:       `[Action Required] Subscription Payment Due — ${tenantName}`,
    header:      "Subscription Payment Reminder",
    about:       `Your monthly subscription for ${tenantName} requires attention.`,
    body:        `Your monthly subscription fee of ₱1,000.00 is due on ${dueDateLabel}. You have a 7-day grace period from your billing date to complete your payment before your account is marked Overdue.`,
    description: "Failure to pay within the grace period will result in your account being marked Overdue, and further non-payment may lead to temporary suspension. Please log in to your Stockify dashboard to settle your balance.",
  };
};

// ── Field config ──────────────────────────────────────────────────────────────

const FIELDS: {
  key:         keyof NotifFields;
  label:       string;
  hint:        string;
  multiline?:  boolean;
  rows?:       number;
}[] = [
  {
    key:   "title",
    label: "Email Subject / Title",
    hint:  "Shown as the email subject line in the recipient's inbox.",
  },
  {
    key:   "header",
    label: "Header",
    hint:  "Large heading shown at the top of the email body.",
  },
  {
    key:   "about",
    label: "About",
    hint:  "One-line subtitle shown below the header.",
  },
  {
    key:       "body",
    label:     "Body",
    hint:      "Main message content — billing date, amount, and grace period.",
    multiline: true,
    rows:      4,
  },
  {
    key:       "description",
    label:     "Description",
    hint:      "Footer note — consequences and next steps.",
    multiline: true,
    rows:      3,
  },
];

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

const MailIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="2" ry="2"/>
    <path d="m2 4 10 8 10-8"/>
  </svg>
);

// ── Component ─────────────────────────────────────────────────────────────────

export default function SendNotificationModal({
  isOpen,
  tenantName,
  nextBillingDate,
  isLoading = false,
  onConfirm,
  onClose,
}: SendNotificationModalProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); return () => setMounted(false); }, []);

  const [fields, setFields] = useState<NotifFields>(() =>
    buildDefaults(tenantName, nextBillingDate)
  );

  // Re-seed defaults whenever the modal opens for a (potentially different) tenant
  useEffect(() => {
    if (isOpen) {
      setFields(buildDefaults(tenantName, nextBillingDate));
    }
  }, [isOpen, tenantName, nextBillingDate]);

  const set = (key: keyof NotifFields) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => setFields((prev) => ({ ...prev, [key]: e.target.value }));

  const handleConfirm = () => {
    if (isLoading) return;
    onConfirm(fields);
  };

  const dueDateLabel = formatDate(nextBillingDate);

  // ── Styles ──────────────────────────────────────────────────────────────────
  const labelStyle = "text-[11px] font-black uppercase tracking-[0.12em] text-[#3A6131]/50 mb-1 block";
  const inputStyle = "w-full bg-white border-[1.5px] border-[#3A6131]/10 rounded-2xl px-4 py-3 text-sm text-[#3A6131] font-medium focus:outline-none focus:border-[#F7B71D] focus:ring-4 focus:ring-[#F7B71D]/10 transition-all placeholder:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed";

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        onClick={!isLoading ? onClose : undefined}
      />

      {/* Modal Container */}
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="w-full max-w-[920px] bg-[#FFFCEB] rounded-[32px] overflow-hidden border-[1.5px] border-[#F7B71D]/20 shadow-[0_32px_80px_rgba(58,97,49,0.2)] flex flex-col md:flex-row h-[650px] font-['Inter'] relative z-10"
      >
        {/* LEFT SIDEBAR */}
        <div className="w-full md:w-[320px] bg-[#3A6131] p-10 flex flex-col relative overflow-hidden shrink-0">
          <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-[#F7B71D]/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10">
            <div className="bg-[#F7B71D] w-12 h-1 rounded-full mb-8" />
            <h2 className="text-[#FFFCEB] text-3xl font-black leading-tight mb-2 tracking-wide uppercase font-['Raleway']">
              Notify
            </h2>
            <p className="text-[#FFFCEB]/70 text-[13px] font-medium leading-relaxed mb-8">
              Review and customize the email notification going out to <span className="font-bold text-[#F7B71D]">{tenantName}</span>.
            </p>

            {/* Context Badges */}
            <div className="flex flex-col gap-4">
              <div className="bg-[#F7B71D]/10 border border-[#F7B71D]/30 rounded-2xl p-4">
                <p className="text-[#F7B71D] text-[10px] font-black uppercase tracking-widest mb-1">
                  Recipient
                </p>
                <p className="text-white text-[14px] font-bold">
                  {tenantName}
                </p>
              </div>

              {nextBillingDate && (
                <div className="bg-[#FFFCEB]/10 border border-[#FFFCEB]/20 rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
                      fill="none" stroke="#FFFCEB" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                    <p className="text-[#FFFCEB] text-[10px] font-black uppercase tracking-widest">
                      Next Billing Date
                    </p>
                  </div>
                  <p className="text-white text-[14px] font-bold">
                    {dueDateLabel}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT CONTENT */}
        <div className="flex-1 flex flex-col relative bg-white/50 backdrop-blur-sm">
          <button
            onClick={!isLoading ? onClose : undefined}
            className="absolute top-6 right-6 w-10 h-10 rounded-full bg-[#FFFCEB] border border-[#3A6131]/10 flex items-center justify-center text-[#3A6131] hover:bg-[#3A6131] hover:text-[#FFFCEB] transition-all z-20"
          >
            <XIcon />
          </button>

          {/* Scrollable Form */}
          <div className="flex-1 overflow-y-auto p-10 [&::-webkit-scrollbar]:w-[5px] [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[#3A6131]/15 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-[#3A6131]/25">
            <div className="mb-8">
              <span className="bg-[#F7B71D]/15 text-[#3A6131] text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest flex items-center gap-2 w-max">
                <MailIcon />
                Email Content
              </span>
              <h3 className="text-2xl font-black text-[#3A6131] mt-3 italic font-['Raleway']">
                Compose Message
              </h3>
            </div>

            <div className="flex flex-col gap-6">
              {FIELDS.map(({ key, label, hint, multiline, rows }) => (
                <div key={key} className="flex flex-col gap-1">
                  <label className={labelStyle}>
                    {label}
                  </label>
                  <p className="text-[#3A6131]/60 text-[11px] font-semibold leading-snug mb-2 -mt-1">
                    {hint}
                  </p>
                  {multiline ? (
                    <textarea
                      value={fields[key]}
                      onChange={set(key)}
                      rows={rows ?? 3}
                      disabled={isLoading}
                      className={`${inputStyle} resize-none leading-relaxed`}
                    />
                  ) : (
                    <input
                      type="text"
                      value={fields[key]}
                      onChange={set(key)}
                      disabled={isLoading}
                      className={inputStyle}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Sticky Footer */}
          <div className="px-8 py-5 border-t border-[#3A6131]/10 bg-white/80 flex justify-end items-center z-20 shrink-0 gap-3">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="px-6 py-3 rounded-2xl text-sm font-bold text-[#3A6131]/60 hover:text-[#3A6131] transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={isLoading}
              className="bg-[#3A6131] text-[#FFFCEB] px-8 py-3 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity shadow-md disabled:opacity-60 disabled:cursor-not-allowed min-w-[180px]"
            >
              {isLoading ? (
                <>
                  <LoaderIcon /> Sending...
                </>
              ) : (
                "Send Notification"
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>,
    document.body
  );
}