"use client";

import { useEffect, useState } from "react";
import PendingTenantReviewModal from "@/components/modals/superadmin/PendingTenantReviewModal";

interface PendingTenant {
  tenant_id: string;
  business_name: string;
  owner_full_name: string;
  created_at: string;
  owner_email: string;
  business_type: string;
}

export default function PendingTenantsTab() {
  const [pendingData, setPendingData] = useState<PendingTenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [reviewingId, setReviewingId] = useState<string | null>(null);

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

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleApprove = async (tenantId: string) => {
    const res = await fetch("/api/superadmin/approve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tenantId, action: "approve" }),
    });
    const result = await res.json();
    if (!result.success) throw new Error(result.error || "Approve failed.");
    setPendingData((prev) => prev.filter((t) => t.tenant_id !== tenantId));
  };

  const handleReject = async (tenantId: string) => {
    const res = await fetch("/api/superadmin/approve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tenantId, action: "reject" }),
    });
    const result = await res.json();
    if (!result.success) throw new Error(result.error || "Reject failed.");
    setPendingData((prev) => prev.filter((t) => t.tenant_id !== tenantId));
  };

  // ── Helpers ───────────────────────────────────────────────────────────────

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-PH", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
    });

  /**
   * Truncates email at the "@" symbol.
   * e.g. "benideck@cit.edu" -> "benideck@..."
   */
  const truncateEmail = (email: string) => {
    const parts = email.split("@");
    if (parts.length < 2) return email;
    return `${parts[0]}@...`;
  };

  // ── Render ────────────────────────────────────────────────────────────────

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
        {/* Table header */}
        <div className="w-full flex bg-[#385E31] px-4 py-3 rounded-t-[8px]">
          <div className="flex-1 text-center text-[#FFFCEB] text-[15px] font-bold">Business Name</div>
          <div className="flex-1 text-center text-[#FFFCEB] text-[15px] font-bold">Owner</div>
          <div className="flex-1 text-center text-[#FFFCEB] text-[15px] font-bold">Reg. Date</div>
          <div className="flex-1 text-center text-[#FFFCEB] text-[15px] font-bold">Business Type</div>
          <div className="flex-1 text-center text-[#FFFCEB] text-[15px] font-bold">Contact Email</div>
          <div className="flex-1 text-center text-[#FFFCEB] text-[15px] font-bold">Action</div>
        </div>

        {pendingData.length === 0 ? (
          <div className="w-full text-center py-10 text-[#385E31] font-semibold text-sm">
            No pending applications.
          </div>
        ) : (
          pendingData.map((row, idx) => {
            const isLast = idx === pendingData.length - 1;

            return (
              <div
                key={row.tenant_id}
                className={`w-full flex px-4 py-[14px] items-center ${
                  !isLast ? "border-b border-[#385E31]/20" : ""
                }`}
              >
                <div className="flex-1 text-center text-[#3A6131] text-[13px] font-bold">
                  <span
                    onClick={() => setReviewingId(row.tenant_id)}
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

                <div className="flex-1 text-center text-[#3A6131] text-[13px] font-bold">
                  {row.business_type}
                </div>

                {/* Email Column with Truncation + Hover */}
                <div className="flex-1 text-center text-[#3A6131] text-[13px] font-bold">
                  <span 
                    title={row.owner_email} 
                    className="cursor-help hover:text-[#385E31]/70 transition-colors"
                  >
                    {truncateEmail(row.owner_email)}
                  </span>
                </div>

                <div className="flex-1 flex justify-center items-center">
                  <button
                    onClick={() => setReviewingId(row.tenant_id)}
                    className="bg-[#385E31] text-[#FFFCEB] px-5 py-1.5 rounded-full text-[10px] font-bold hover:bg-[#385E31]/80 transition-colors"
                  >
                    Review
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      <PendingTenantReviewModal
        tenantId={reviewingId}
        onClose={() => setReviewingId(null)}
        onApprove={handleApprove}
        onReject={handleReject}
      />
    </>
  );
}