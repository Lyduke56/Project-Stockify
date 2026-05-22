"use client";

import { useState } from "react";
import { X, Unlock, AlertTriangle, Loader2 } from "lucide-react";
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
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#385E31]/40 backdrop-blur-sm">
      <div className="bg-[#FFFCEB] rounded-2xl shadow-2xl w-[420px] max-w-[95vw] overflow-hidden border border-[#385E31]/20 font-['Inter']">
        
        {/* Header */}
        <div className="bg-[#385E31] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[#FFFCEB]">
            <Unlock size={18} strokeWidth={2.5} />
            <h2 className="font-bold text-lg tracking-wide">Restore Tenant</h2>
          </div>

          <button
            onClick={onClose}
            disabled={loading}
            className="text-[#FFFCEB]/70 hover:text-[#FFFCEB] transition-colors disabled:opacity-50"
          >
            <X size={20} strokeWidth={2.5} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 flex flex-col items-center text-center gap-4">
          
          <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shadow-sm">
            <Unlock size={32} />
          </div>

          <div>
            <p className="text-[#385E31] font-bold text-lg">Are you sure?</p>
            <p className="text-gray-500 text-sm mt-1 leading-relaxed">
              You are about to restore the account for{" "}
              <span className="font-bold text-[#385E31]">{tenant.business_name}</span>.
            </p>
          </div>

          {/* Remarks Textarea */}
          <div className="w-full text-left mt-1">
            <label className="block text-[12px] font-bold text-[#385E31] mb-1.5 ml-1">
              Remarks <span className="text-gray-400 font-normal">(Optional)</span>
            </label>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              disabled={loading}
              rows={3}
              placeholder="e.g. Account reinstated per owner request..."
              className="w-full border-[1.5px] border-[#385E31]/20 rounded-xl px-4 py-3 bg-white text-[#385E31] text-sm outline-none focus:border-[#385E31] focus:ring-2 focus:ring-[#385E31]/10 transition-all resize-none placeholder:text-gray-300"
            />
          </div>

          {/* Error Notice */}
          {error && (
            <div className="w-full p-3 bg-red-50 rounded-xl border border-red-100 text-left flex items-start gap-2">
              <AlertTriangle size={16} className="text-red-600 shrink-0 mt-0.5" />
              <p className="text-xs text-red-600 font-medium leading-relaxed">{error}</p>
            </div>
          )}

          {/* Information Note */}
          <div className="w-full p-3 bg-emerald-50 rounded-xl border border-emerald-100 text-left mt-1">
            <p className="text-xs text-emerald-700 font-medium leading-relaxed">
              <span className="font-bold">Note:</span> Restoring this account will immediately lift the suspension and re-activate full access. A confirmation email will be sent to the owner.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-2.5 border-2 border-[#385E31] text-[#385E31] font-semibold rounded-xl hover:bg-[#385E31]/5 transition-colors disabled:opacity-50"
          >
            Go Back
          </button>

          <button
            onClick={handleRestore}
            disabled={loading}
            className="flex-1 py-2.5 bg-[#385E31] text-[#FFFCEB] font-bold rounded-xl hover:bg-[#385E31]/90 transition-colors shadow-md flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              "Confirm Restore"
            )}
          </button>
        </div>

      </div>
    </div>
  );
}