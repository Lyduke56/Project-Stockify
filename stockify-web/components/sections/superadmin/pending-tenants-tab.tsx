"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface PendingTenant {
  tenant_id: string;
  business_name: string;
  owner_full_name: string;
  created_at: string;
  owner_email: string;
}

// 1. Added the interface to receive the routing function
interface PendingTenantsTabProps {
  onViewTenant: (id: string) => void;
}

const ChevronDown = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9"></polyline>
  </svg>
);

// 2. Destructure onViewTenant from props
export default function PendingTenantsTab({ onViewTenant }: PendingTenantsTabProps) {
  const supabase = createClient();

  const [pendingData, setPendingData] = useState<PendingTenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState("");

  const [modal, setModal] = useState<{
    open: boolean;
    action: "approve" | "reject" | null;
    tenant: PendingTenant | null;
  }>({ open: false, action: null, tenant: null });

  useEffect(() => {
    fetchPending();
  }, []);

  const fetchPending = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/superadmin/approve");
      const result = await res.json();
      if (result.error) throw new Error(result.error);
      setPendingData(result.data || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load pending tenants.");
    } finally {
      setLoading(false);
    }
  };

  const openModal = (action: "approve" | "reject", tenant: PendingTenant) => {
    setModal({ open: true, action, tenant });
  };

  const closeModal = () => {
    setModal({ open: false, action: null, tenant: null });
  };

  const handleConfirm = async () => {
    if (!modal.tenant || !modal.action) return;
    setActionLoading(modal.tenant.tenant_id);
    closeModal();

    try {
      const res = await fetch("/api/superadmin/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId: modal.tenant.tenant_id,
          action: modal.action,
        }),
      });

      const result = await res.json();
      if (!result.success) throw new Error(result.error || "Action failed.");

      setPendingData((prev) =>
        prev.filter((t) => t.tenant_id !== modal.tenant!.tenant_id)
      );
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-PH", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
    });

  if (loading) {
    return (
      <div className="w-full flex justify-center py-16 text-[#385E31] font-bold text-lg">
        Loading pending applications...
      </div>
    );
  }

  return (
    <>
      {error && (
        <p className="text-red-600 bg-red-100 border border-red-300 px-4 py-2 rounded mb-4 text-sm font-medium">
          {error}
        </p>
      )}

      <div className="w-full bg-[#FFFCEB] rounded-[10px] border border-[#385E31] flex flex-col overflow-visible shadow-sm">
        
        <div className="w-full flex bg-[#385E31] px-4 py-3 rounded-t-[8px]">
          <div className="flex-1 text-center text-[#FFFCEB] text-[15px] font-bold">Business Name</div>
          <div className="flex-1 text-center text-[#FFFCEB] text-[15px] font-bold">Owner</div>
          <div className="flex-1 text-center text-[#FFFCEB] text-[15px] font-bold">Reg. Date</div>
          <div className="flex-1 text-center text-[#FFFCEB] text-[15px] font-bold">Actions</div>
        </div>

        {pendingData.length === 0 ? (
          <div className="w-full text-center py-10 text-[#385E31] font-semibold text-sm">
            No pending applications.
          </div>
        ) : (
          pendingData.map((row, idx) => {
            const isLast = idx === pendingData.length - 1;
            const isProcessing = actionLoading === row.tenant_id;

            return (
              <div
                key={row.tenant_id}
                className={`w-full flex px-4 py-[14px] items-center ${!isLast ? "border-b border-[#385E31]/20" : ""}`}
              >
                <div className="flex-1 text-center text-[#3A6131] text-[13px] font-bold">
                  {/* 3. Replaced router.push with onViewTenant */}
                  <span
                    onClick={() => onViewTenant(row.tenant_id)}
                    className="cursor-pointer hover:text-[#E5AD24] hover:underline transition-colors"
                  >
                    {row.business_name}
                  </span>
                </div>
                <div className="flex-1 text-center text-[#3A6131] text-[13px] font-bold">
                  {row.owner_full_name}
                </div>
                <div className="flex-1 text-center text-[#3A6131] text-[13px] font-bold">
                  {formatDate(row.created_at)}
                </div>
                <div className="flex-1 flex justify-center items-center gap-2">
                  {isProcessing ? (
                    <span className="text-[11px] text-[#385E31] font-semibold animate-pulse">
                      Processing...
                    </span>
                  ) : (
                    <>
                      {/* 4. Replaced router.push with onViewTenant */}
                      <button
                        onClick={() => onViewTenant(row.tenant_id)}
                        className="bg-[#385E31] text-[#FFFCEB] px-4 py-1.5 rounded-full text-[10px] font-bold hover:bg-[#385E31]/80 transition-colors"
                      >
                        Review
                      </button>
                      <button
                        onClick={() => openModal("approve", row)}
                        className="bg-[#E5AD24] text-[#385E31] px-4 py-1.5 rounded-full text-[10px] font-bold hover:opacity-80 transition-colors"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => openModal("reject", row)}
                        className="bg-[#E91F22] text-white px-4 py-1.5 rounded-full text-[10px] font-bold hover:opacity-80 transition-colors"
                      >
                        Reject
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {modal.open && modal.tenant && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={closeModal}
        >
          <div
           className="bg-[#FFF9D7] rounded-[6px] px-10 py-7 max-w-md w-full border border-[#385E31]/20 text-center"
          >
            <h2 className="text-[#385E31] text-[22px] font-extrabold mb-3">
              {modal.action === "approve" ? "APPROVE APPLICATION" : "REJECT APPLICATION"}
            </h2>

            <p className="text-[#3A6131] text-[14px] leading-relaxed mb-6">
              {modal.action === "approve"
                ? <>This will activate the account for <strong>{modal.tenant.business_name}</strong>.</>
                : <>This will permanently reject <strong>{modal.tenant.business_name}</strong> and remove it from the system.</>}
            </p>
            
            <div className="flex gap-3 justify-center">
              <button
                onClick={closeModal}
                className="px-6 py-2 rounded-full border-2 border-[#385E31] text-[#385E31] font-bold text-sm hover:bg-[#385E31]/10 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                className={`px-6 py-2 rounded-full font-bold text-sm text-white transition ${
                  modal.action === "approve"
                    ? "bg-[#385E31] hover:bg-[#2D4B24]"
                    : "bg-[#E91F22] hover:bg-red-700"
                }`}
              >
                {modal.action === "approve" ? "Yes, Approve" : "Yes, Reject"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}