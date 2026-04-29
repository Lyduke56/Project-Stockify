"use client";

import { useState } from "react";
import { SuspendedTenant, daysUntilExpiry, AlertIcon } from "../../types";

export function SendSuspendNotificationModal({
  tenant,
  onClose,
}: {
  tenant: SuspendedTenant;
  onClose: () => void;
}) {
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const daysLeft = daysUntilExpiry(tenant.suspension_expires_at);

  const handleSend = async () => {
    if (!tenant.owner_email) return;
    setSending(true);
    setError(null);
    try {
      const res = await fetch("/api/superadmin/send-suspension-notification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId: tenant.tenant_id }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Failed to send notification.");
      }
      setDone(true);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-[#FFFCEB] border border-[#385E31] rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="bg-[#385E31] px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-[#FFFCEB] font-bold text-lg">Send Notification</h2>
            <p className="text-[#FFFCEB]/60 text-xs mt-0.5">{tenant.business_name}</p>
          </div>
          <button
            onClick={onClose}
            className="text-[#FFFCEB]/70 hover:text-[#FFFCEB] transition-colors text-xl leading-none"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {done ? (
            <div className="text-center py-6">
              <div className="text-4xl mb-3">✅</div>
              <p className="text-[#385E31] font-bold text-base">Notification Sent!</p>
              <p className="text-[#385E31]/60 text-sm mt-1">
                An email reminder has been sent to{" "}
                <strong>{tenant.owner_email || tenant.owner_name}</strong>.
              </p>
            </div>
          ) : (
            <>
              {/* Preview box */}
              <div className="bg-yellow-50 border border-[#E5AD24] rounded-lg px-4 py-3 text-sm text-[#385E31] leading-relaxed">
                <strong>Warning Email Preview:</strong>
                <br />
                This will notify <strong>{tenant.owner_name}</strong> that their account is
                currently suspended
                {tenant.reason ? ` due to: "${tenant.reason}"` : ""}.
                {daysLeft !== null && daysLeft > 0 && (
                  <>
                    {" "}
                    They have{" "}
                    <strong>
                      {daysLeft} day{daysLeft === 1 ? "" : "s"}
                    </strong>{" "}
                    to resolve the issue before automatic termination.
                  </>
                )}
                {daysLeft !== null && daysLeft <= 0 && (
                  <>
                    {" "}
                    Their suspension period has already <strong>expired</strong>.
                  </>
                )}
              </div>

              {/* No-email warning */}
              {!tenant.owner_email && (
                <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
                  <span className="mt-0.5 flex-shrink-0">
                    <AlertIcon />
                  </span>
                  <span>
                    No email address is on record for this tenant. Notification cannot be sent.
                  </span>
                </div>
              )}

              <div className="text-xs text-[#385E31]/60">
                <span className="font-bold">Recipient:</span>{" "}
                {tenant.owner_email || "No email on record"}
              </div>

              {error && <p className="text-red-600 text-xs font-semibold">{error}</p>}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 pb-5 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-full border border-[#385E31] text-[#385E31] text-sm font-bold hover:bg-[#385E31]/10 transition-colors"
          >
            {done ? "Close" : "Cancel"}
          </button>
          {!done && (
            <button
              onClick={handleSend}
              disabled={sending || !tenant.owner_email}
              className="px-5 py-2 rounded-full bg-[#E5AD24] text-[#385E31] text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sending ? "Sending…" : "Send Email"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}