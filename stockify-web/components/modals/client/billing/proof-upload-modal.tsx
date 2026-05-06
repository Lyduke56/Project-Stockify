// components/modals/client/billing/proof-upload-modal.tsx
// Client-admin uploads their GCash / e-wallet screenshot as proof of payment.
// Submits to /api/client/payment-submit via multipart/form-data.

"use client";

import { useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

interface SubscriptionRecord {
  subscription_id: string;
  billing_period:  string;
  amount:          number;
  payment_status:  string;
}

interface Props {
  isOpen:        boolean;
  tenantId:      string | null;
  userId:        string | null;
  latestRecord:  SubscriptionRecord | null;
  onClose:       () => void;
  onSubmitted:   () => void;
}

const fmtPHP = (n: number) =>
  "₱" + n.toLocaleString("en-PH", { minimumFractionDigits: 2 });

const fmtPeriod = (iso: string | null) => {
  if (!iso) return "—";
  return new Date(iso + "T00:00:00").toLocaleDateString("en-PH", {
    month: "long", year: "numeric",
  });
};

export default function ProofUploadModal({
  isOpen,
  tenantId,
  userId,
  latestRecord,
  onClose,
  onSubmitted,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file,           setFile]           = useState<File | null>(null);
  const [preview,        setPreview]        = useState<string | null>(null);
  const [amountDeclared, setAmountDeclared] = useState(
    latestRecord ? String(latestRecord.amount) : ""
  );
  const [remarksTenant,  setRemarksTenant]  = useState("");
  const [submitting,     setSubmitting]     = useState(false);
  const [error,          setError]          = useState("");
  const [dragOver,       setDragOver]       = useState(false);

  const reset = () => {
    setFile(null);
    setPreview(null);
    setAmountDeclared(latestRecord ? String(latestRecord.amount) : "");
    setRemarksTenant("");
    setError("");
    setSubmitting(false);
    setDragOver(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleFile = (selected: File) => {
    if (!selected.type.startsWith("image/")) {
      setError("Only image files (PNG, JPG, WEBP) are accepted.");
      return;
    }
    if (selected.size > 10 * 1024 * 1024) {
      setError("File must be under 10 MB.");
      return;
    }
    setFile(selected);
    setError("");
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(selected);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) handleFile(dropped);
  };

  const handleSubmit = async () => {
    if (!file)     { setError("Please upload your proof of payment screenshot."); return; }
    if (!tenantId) { setError("Session error: tenant not found. Please refresh."); return; }

    setSubmitting(true);
    setError("");
    try {
      const form = new FormData();
      form.append("proofImage",     file);
      form.append("tenantId",       tenantId);
      if (userId)            form.append("submittedBy",    userId);
      if (amountDeclared)    form.append("amountDeclared", amountDeclared);
      if (remarksTenant)     form.append("remarksTenant",  remarksTenant);
      if (latestRecord)      form.append("subscriptionId", latestRecord.subscription_id);

      const res  = await fetch("/api/client/payment-submit", { method: "POST", body: form });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error ?? "Submission failed.");

      reset();
      onSubmitted();
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
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 18 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 18 }}
            transition={{ type: "spring", stiffness: 300, damping: 26 }}
            className="relative z-10 w-full max-w-md mx-4 bg-white rounded-2xl shadow-2xl border border-lime-800/10 overflow-hidden max-h-[92vh] flex flex-col"
          >
            {/* Accent bar */}
            <div className="h-1.5 w-full bg-lime-800 shrink-0" />

            {/* Header */}
            <div className="px-6 pt-5 pb-4 border-b border-lime-800/10 shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-lime-50 border border-lime-800/15 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24"
                      fill="none" stroke="#1a4d1a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                      <polyline points="17 8 12 3 7 8"/>
                      <line x1="12" y1="3" x2="12" y2="15"/>
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lime-900 text-base font-bold leading-tight font-['Inter']">
                      Upload Proof of Payment
                    </h3>
                    <p className="text-gray-400 text-xs mt-0.5 font-['Inter']">
                      Submit your GCash or e-wallet screenshot
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleClose}
                  className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24"
                    fill="none" stroke="#555" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>
            </div>

            {/* Scrollable body */}
            <div className="overflow-y-auto flex-1 px-6 py-5 flex flex-col gap-4">

              {/* Current billing period info */}
              {latestRecord && latestRecord.payment_status !== "Paid" && (
                <div className="bg-lime-50 border border-lime-800/15 rounded-xl p-3.5 flex items-center justify-between">
                  <div>
                    <p className="text-lime-800 text-[10px] font-bold uppercase tracking-wide mb-0.5">
                      Current Billing Period
                    </p>
                    <p className="text-lime-900 text-sm font-bold font-['Inter']">
                      {fmtPeriod(latestRecord.billing_period)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lime-800 text-[10px] font-bold uppercase tracking-wide mb-0.5">
                      Amount Due
                    </p>
                    <p className="text-lime-900 text-base font-extrabold font-['Inter']">
                      {fmtPHP(Number(latestRecord.amount))}
                    </p>
                  </div>
                </div>
              )}

              {/* Error */}
              {error && (
                <p className="text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-lg text-xs font-medium">
                  {error}
                </p>
              )}

              {/* File drop zone */}
              <div>
                <label className="block text-xs font-bold text-lime-900/70 uppercase tracking-wide mb-1.5 font-['Inter']">
                  Payment Screenshot *
                </label>
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`relative w-full min-h-[160px] rounded-xl border-2 border-dashed cursor-pointer flex flex-col items-center justify-center gap-2 transition-all ${
                    dragOver
                      ? "border-lime-600 bg-lime-50"
                      : preview
                      ? "border-lime-600 bg-lime-50/30"
                      : "border-lime-800/20 hover:border-lime-800/40 hover:bg-lime-50/30"
                  }`}
                >
                  {preview ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={preview}
                        alt="Preview"
                        className="max-h-[140px] max-w-full object-contain rounded-lg"
                      />
                      <p className="text-lime-700 text-[11px] font-medium">
                        {file?.name} · Click to change
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="w-10 h-10 rounded-full bg-lime-50 border border-lime-800/15 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
                          fill="none" stroke="#1a4d1a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                          <circle cx="8.5" cy="8.5" r="1.5"/>
                          <polyline points="21 15 16 10 5 21"/>
                        </svg>
                      </div>
                      <p className="text-lime-900 text-xs font-semibold font-['Inter']">
                        Drop your screenshot here
                      </p>
                      <p className="text-gray-400 text-[11px] font-['Inter']">
                        or click to browse — PNG, JPG, WEBP up to 10MB
                      </p>
                    </>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFile(f);
                    e.target.value = "";
                  }}
                />
              </div>

              {/* Amount declared */}
              <div>
                <label className="block text-xs font-bold text-lime-900/70 uppercase tracking-wide mb-1.5 font-['Inter']">
                  Amount Paid (₱)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder={latestRecord ? `Default: ${fmtPHP(Number(latestRecord.amount))}` : "e.g. 1000.00"}
                  value={amountDeclared}
                  onChange={(e) => setAmountDeclared(e.target.value)}
                  className="w-full border border-lime-800/20 rounded-xl px-4 py-2.5 text-sm text-lime-900 font-['Inter'] placeholder-gray-300 outline-none focus:border-lime-700 transition-colors bg-white"
                />
              </div>

              {/* Optional note */}
              <div>
                <label className="block text-xs font-bold text-lime-900/70 uppercase tracking-wide mb-1.5 font-['Inter']">
                  Note to Admin (optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. GCash reference #XXXXXX, paid via Palawan, etc."
                  value={remarksTenant}
                  onChange={(e) => setRemarksTenant(e.target.value)}
                  className="w-full border border-lime-800/20 rounded-xl px-4 py-2.5 text-sm text-lime-900 font-['Inter'] placeholder-gray-300 outline-none focus:border-lime-700 transition-colors bg-white resize-none"
                />
              </div>

              {/* Info note */}
              <div className="flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-xl px-3 py-2.5">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
                  fill="none" stroke="#1d4ed8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
                  className="mt-0.5 shrink-0">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <p className="text-blue-700 text-[11px] leading-relaxed font-['Inter']">
                  Your submission will be reviewed by our team. You&apos;ll be notified once
                  it&apos;s accepted or if additional information is needed.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-lime-800/10 bg-white shrink-0 flex gap-2.5">
              <button
                onClick={handleClose}
                disabled={submitting}
                className="flex-1 border-2 border-lime-800/20 text-lime-900 font-bold text-sm py-2.5 rounded-xl hover:bg-lime-50 transition-colors disabled:opacity-50 font-['Inter']"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting || !file}
                className="flex-1 bg-lime-800 text-white font-bold text-sm py-2.5 rounded-xl hover:bg-lime-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 font-['Inter']"
              >
                {submitting ? (
                  <>
                    <svg className="animate-spin" xmlns="http://www.w3.org/2000/svg" width="14" height="14"
                      viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                      strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                    </svg>
                    Submitting…
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
                      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                      <polyline points="17 8 12 3 7 8"/>
                      <line x1="12" y1="3" x2="12" y2="15"/>
                    </svg>
                    Submit Payment Proof
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}