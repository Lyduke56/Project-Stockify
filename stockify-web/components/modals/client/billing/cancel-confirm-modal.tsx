// components/modals/client/billing/cancel-confirm-modal.tsx
// Client-admin cancels their subscription.
// Sends a cancellation request — superadmin reviews it.
// Does NOT immediately suspend; logs the intent and notifies the superadmin.

"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

interface Props {
  isOpen:      boolean;
  tenantId:    string | null;
  onClose:     () => void;
  onConfirmed: () => void;
}

export default function CancelConfirmModal({
  isOpen,
  tenantId,
  onClose,
  onConfirmed,
}: Props) {
  const [reason,      setReason]      = useState("");
  const [submitting,  setSubmitting]  = useState(false);
  const [error,       setError]       = useState("");
  const [step,        setStep]        = useState<"confirm" | "done">("confirm");

  const handleClose = () => {
    setReason(""); setError(""); setStep("confirm"); setSubmitting(false);
    onClose();
  };

  const handleSubmit = async () => {
    if (!tenantId) { setError("Session error. Please refresh."); return; }
    setSubmitting(true);
    setError("");
    try {
      const res  = await fetch("/api/client/cancel-subscription", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ tenantId, reason: reason.trim() }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error ?? "Request failed.");
      setStep("done");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

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
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={handleClose} />

          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 18 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 18 }}
            transition={{ type: "spring", stiffness: 300, damping: 26 }}
            className="relative z-10 w-full max-w-sm mx-4 bg-white rounded-2xl shadow-2xl border border-red-100 overflow-hidden"
          >
            {/* Accent bar */}
            <div className="h-1.5 w-full bg-red-700 shrink-0" />

            <div className="p-6">
              {step === "confirm" ? (
                <>
                  {/* Icon */}
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-10 h-10 rounded-full bg-red-50 border border-red-100 flex items-center justify-center shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
                        fill="none" stroke="#c0392b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="10" y1="15" x2="10" y2="9"/>
                        <line x1="14" y1="15" x2="14" y2="9"/>
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-gray-900 text-base font-bold font-['Inter'] leading-tight">
                        Cancel Subscription
                      </h3>
                      <p className="text-gray-400 text-xs font-['Inter'] mt-0.5">
                        This will send a request to our team.
                      </p>
                    </div>
                  </div>

                  {/* Warning */}
                  <div className="bg-red-50 border border-red-100 rounded-xl p-3.5 mb-4">
                    <p className="text-red-700 text-xs font-medium leading-relaxed font-['Inter']">
                      Cancelling will end your subscription at the end of your current billing period.
                      You will lose access to all Stockify features. This action cannot be undone automatically.
                    </p>
                  </div>

                  {/* Reason */}
                  <div className="mb-4">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 font-['Inter']">
                      Reason for cancellation (optional)
                    </label>
                    <textarea
                      rows={2}
                      placeholder="e.g. Switching to another service, business closed, etc."
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-700 font-['Inter'] placeholder-gray-300 outline-none focus:border-red-300 transition-colors resize-none"
                    />
                  </div>

                  {error && (
                    <p className="text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-lg text-xs font-medium mb-4">
                      {error}
                    </p>
                  )}

                  <div className="flex gap-2.5">
                    <button
                      onClick={handleClose}
                      disabled={submitting}
                      className="flex-1 border-2 border-gray-200 text-gray-700 font-bold text-sm py-2.5 rounded-xl hover:bg-gray-50 transition-colors font-['Inter']"
                    >
                      Keep Subscription
                    </button>
                    <button
                      onClick={handleSubmit}
                      disabled={submitting}
                      className="flex-1 bg-red-700 text-white font-bold text-sm py-2.5 rounded-xl hover:bg-red-800 transition-colors disabled:opacity-60 flex items-center justify-center gap-2 font-['Inter']"
                    >
                      {submitting ? (
                        <>
                          <svg className="animate-spin" xmlns="http://www.w3.org/2000/svg" width="13" height="13"
                            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                            strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                          </svg>
                          Sending…
                        </>
                      ) : "Yes, Cancel"}
                    </button>
                  </div>
                </>
              ) : (
                /* Done state */
                <div className="flex flex-col items-center text-center gap-4 py-4">
                  <div className="w-14 h-14 rounded-full bg-green-50 border border-green-100 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
                      fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-gray-900 text-base font-bold font-['Inter'] mb-1">
                      Request Sent
                    </h3>
                    <p className="text-gray-500 text-sm font-['Inter'] leading-relaxed">
                      Your cancellation request has been sent to our team. We&apos;ll get in touch
                      with you shortly.
                    </p>
                  </div>
                  <button
                    onClick={() => { setStep("confirm"); onConfirmed(); }}
                    className="w-full bg-lime-800 text-white font-bold text-sm py-2.5 rounded-xl hover:bg-lime-700 transition-colors font-['Inter']"
                  >
                    Close
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}