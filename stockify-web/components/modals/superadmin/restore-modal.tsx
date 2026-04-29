"use client";

import { useState } from "react";
import { SuspendedTenant } from "./../../types";

export function RestoreModal({
  tenant,
  onClose,
  onSuccess,
}: {
  tenant: SuspendedTenant;
  onClose: () => void;
  onSuccess: (id: string) => void;
}) {
  const [remarks, setRemarks] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRestore = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/superadmin/restore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId: tenant.tenant_id,
          suspendedRowId: tenant.id,
          remarks: remarks.trim() || "Suspension lifted by administrator.",
        }),
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Restore failed.");
      }

      onSuccess(tenant.id);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-[#FFFCEB] border border-[#385E31] rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="bg-[#385E31] px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-[#FFFCEB] font-bold text-lg">Restore Tenant</h2>
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
          {/* Confirmation text */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3 text-sm text-[#385E31] leading-relaxed">
            You are about to restore{" "}
            <strong>{tenant.business_name}</strong>. This will:
            <ul className="mt-2 space-y-1 list-none">
              <li className="flex items-center gap-2">
                <span className="text-emerald-500 font-bold">✓</span>
                Lift the suspension on their account
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-500 font-bold">✓</span>
                Re-activate full access to Stockify
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-500 font-bold">✓</span>
                Remove them from the suspended tenants list
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-500 font-bold">✓</span>
                Send a restoration confirmation email to the owner
              </li>
            </ul>
          </div>

          {/* Remarks */}
          <div>
            <label className="block text-[11px] uppercase tracking-widest text-[#385E31]/60 font-bold mb-1.5">
              Restoration Remarks{" "}
              <span className="text-[#385E31]/40 normal-case tracking-normal font-normal">
                (optional)
              </span>
            </label>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              rows={3}
              placeholder="e.g. Balance settled in full. Account reinstated per owner request..."
              className="w-full border border-[#385E31]/40 rounded-xl px-4 py-2.5 bg-white text-[#385E31] text-sm outline-none focus:border-[#385E31] resize-none placeholder-[#385E31]/30"
            />
            <p className="text-[11px] text-[#385E31]/40 mt-1">
              This note will be included in the restoration email sent to{" "}
              <strong>{tenant.owner_email || tenant.owner_name}</strong>.
            </p>
          </div>

          {error && (
            <p className="text-red-600 text-xs font-semibold bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              ✗ {error}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 pb-5 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-full border border-[#385E31] text-[#385E31] text-sm font-bold hover:bg-[#385E31]/10 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleRestore}
            disabled={loading}
            className="px-5 py-2 rounded-full bg-[#385E31] text-[#FFFCEB] text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? "Restoring…" : "✓ Yes, Restore Tenant"}
          </button>
        </div>
      </div>
    </div>
  );
}