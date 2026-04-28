"use client";

import { useEffect, useState } from "react";
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

// ── Component ─────────────────────────────────────────────────────────────────

export default function SendNotificationModal({
  isOpen,
  tenantName,
  nextBillingDate,
  isLoading = false,
  onConfirm,
  onClose,
}: SendNotificationModalProps) {
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
            className="relative z-10 w-full max-w-[540px] mx-4 bg-[#FFFCEB] rounded-[14px] shadow-2xl border border-[#385E31]/15 overflow-hidden max-h-[90vh] flex flex-col"
          >
            {/* Accent bar */}
            <div className="h-[5px] w-full bg-[#385E31] shrink-0" />

            {/* Scrollable body */}
            <div className="overflow-y-auto flex-1 px-7 pt-6 pb-2">

              {/* Icon + Title */}
              <div className="flex items-center gap-3 mb-5">
                <div className="w-[48px] h-[48px] rounded-full bg-[#385E31]/8 border border-[#385E31]/12 flex items-center justify-center shrink-0">
                  {/* Bell icon */}
                  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24"
                    fill="none" stroke="#385E31" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-[#385E31] text-[18px] font-extrabold leading-tight">
                    Send Notification
                  </h3>
                  <p className="text-[#385E31]/60 text-[12px] font-medium mt-0.5">
                    Customise the email that will be sent to{" "}
                    <strong className="text-[#385E31]/80">{tenantName}</strong>
                  </p>
                </div>
              </div>

              {/* Billing date badge */}
              {nextBillingDate && (
                <div className="flex items-center gap-2 bg-[#FFD980]/40 border border-[#E5AD24]/50 rounded-[8px] px-4 py-2.5 mb-5">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
                    fill="none" stroke="#385E31" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                  <p className="text-[#385E31] text-[12px] font-bold">
                    Next Billing Date:&nbsp;
                    <span className="font-extrabold">{dueDateLabel}</span>
                  </p>
                </div>
              )}

              {/* Fields */}
              <div className="flex flex-col gap-4 mb-5">
                {FIELDS.map(({ key, label, hint, multiline, rows }) => (
                  <div key={key} className="flex flex-col gap-1">
                    <label className="text-[#385E31] text-[11px] font-bold uppercase tracking-wider">
                      {label}
                    </label>
                    <p className="text-[#385E31]/50 text-[11px] font-medium leading-snug -mt-0.5 mb-1">
                      {hint}
                    </p>
                    {multiline ? (
                      <textarea
                        value={fields[key]}
                        onChange={set(key)}
                        rows={rows ?? 3}
                        disabled={isLoading}
                        className="w-full bg-white/60 border border-[#385E31]/20 rounded-[10px] px-3 py-2 text-[13px] text-[#385E31] outline-none focus:border-[#385E31]/50 focus:bg-white transition-all resize-none disabled:opacity-50"
                      />
                    ) : (
                      <input
                        type="text"
                        value={fields[key]}
                        onChange={set(key)}
                        disabled={isLoading}
                        className="w-full bg-white/60 border border-[#385E31]/20 rounded-[10px] px-3 py-2 text-[13px] text-[#385E31] outline-none focus:border-[#385E31]/50 focus:bg-white transition-all disabled:opacity-50"
                      />
                    )}
                  </div>
                ))}
              </div>

            </div>

            {/* Sticky footer */}
            <div className="px-7 py-5 border-t border-[#385E31]/10 bg-[#FFFCEB] shrink-0 flex gap-3">
              <button
                onClick={onClose}
                disabled={isLoading}
                className="flex-1 border-2 border-[#385E31] text-[#385E31] font-bold text-[14px] py-[10px] rounded-[40px] hover:bg-[#385E31]/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={isLoading}
                className="flex-1 bg-[#385E31] text-[#FFFCEB] font-bold text-[14px] py-[10px] rounded-[40px] hover:bg-[#2D4B24] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin" xmlns="http://www.w3.org/2000/svg" width="14" height="14"
                      viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                      strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                    </svg>
                    Sending…
                  </span>
                ) : (
                  "Send Notification"
                )}
              </button>
            </div>

          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}