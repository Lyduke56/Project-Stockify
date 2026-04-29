"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { SuspendedTenant, daysUntilExpiry } from "./../../types";

import {RestoreModal} from "@/components/modals/superadmin/restore-modal";
import ConfirmActionModal from "@/components/modals/confirm-tenant-action-modal";
import { ViewSuspendModal } from "@/components/modals/superadmin/viewSuspendTenant";
import { SendSuspendNotificationModal } from "@/components/modals/superadmin/sendSuspendNotification";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ─── Icons ────────────────────────────────────────────────────────────────────

const SearchIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const ChevronDown = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-PH", { month: "2-digit", day: "2-digit", year: "numeric" });

// ─── Types ────────────────────────────────────────────────────────────────────


type ActiveModal =
  | { type: "view";      tenant: SuspendedTenant }
  | { type: "notify";    tenant: SuspendedTenant }
  | { type: "restore";   tenant: SuspendedTenant }
  | { type: "terminate"; tenant: SuspendedTenant }
  | null;

// ─── Main Component ───────────────────────────────────────────────────────────

export default function SuspendedTenantsTab() {
  const [tenants,        setTenants]        = useState<SuspendedTenant[]>([]);
  const [filtered,       setFiltered]       = useState<SuspendedTenant[]>([]);
  const [loading,        setLoading]        = useState(true);
  const [search,         setSearch]         = useState("");
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [activeModal,    setActiveModal]    = useState<ActiveModal>(null);

  // Shared state for ConfirmActionModal (terminate)
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError,   setActionError]   = useState("");
  const [successMsg,    setSuccessMsg]    = useState("");

  const tableRef = useRef<HTMLDivElement>(null);

  // ── Fetch ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchSuspended = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("suspended_tenants")
        .select("*")
        .order("suspended_at", { ascending: false });
      if (!error) {
        setTenants(data || []);
        setFiltered(data || []);
      }
      setLoading(false);
    };
    fetchSuspended();
  }, []);

  // ── Search filter ─────────────────────────────────────────────────────────
  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(
      tenants.filter(
        (t) =>
          t.business_name.toLowerCase().includes(q) ||
          t.owner_name.toLowerCase().includes(q)
      )
    );
  }, [search, tenants]);

  // ── Close dropdown on outside click ──────────────────────────────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (tableRef.current && !tableRef.current.contains(e.target as Node)) {
        setOpenDropdownId(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Flash success banner ──────────────────────────────────────────────────
  const flash = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(""), 4500);
  };

  // ── Remove row after a successful action ──────────────────────────────────
  const removeRow = (id: string) => {
    setTenants((prev) => prev.filter((t) => t.id !== id));
    setActiveModal(null);
  };

  // ── Open modal helper ─────────────────────────────────────────────────────
  const openModal = (
  type: NonNullable<ActiveModal>["type"],
  tenant: SuspendedTenant
  ) => {
    setOpenDropdownId(null);
    setActionError("");
    setActiveModal({ type, tenant } as ActiveModal);
  };

  // ── Terminate (called by ConfirmActionModal) ──────────────────────────────
  const handleTerminate = async (remarks?: string) => {
    if (activeModal?.type !== "terminate") return;
    const tenant = activeModal.tenant;

    setActionLoading(true);
    setActionError("");
    try {
      const res = await fetch("/api/superadmin/terminate", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId:       tenant.tenant_id,
          suspendedRowId: tenant.id,
          remarks:
            remarks?.trim() ||
            "Administrative decision — please contact support for details.",
        }),
      });
      const result = await res.json();
      if (!res.ok || !result.success)
        throw new Error(result.error ?? "Termination failed.");

      removeRow(tenant.id);
      flash(`${tenant.business_name} has been permanently terminated.`);
    } catch (e: any) {
      setActionError(e.message);
    } finally {
      setActionLoading(false);
    }
  };

  // ── Restore success (called by RestoreModal's onSuccess) ──────────────────
  const handleRestoreSuccess = (id: string) => {
    const tenant = tenants.find((t) => t.id === id);
    removeRow(id);
    if (tenant) flash(`${tenant.business_name} has been restored successfully.`);
  };

  // ─────────────────────────────────────────────────────────────────────────
  if (loading)
    return (
      <div className="py-20 text-center text-[#385E31] font-bold">
        Loading Suspended Database...
      </div>
    );

  return (
    <>
      {/* ── Feedback banners ──────────────────────────────────────────────── */}
      {actionError && (
        <p className="w-full text-red-600 bg-red-100 border border-red-300 px-4 py-2 rounded mb-4 text-sm font-medium">
          {actionError}
        </p>
      )}
      {successMsg && (
        <p className="w-full text-[#385E31] bg-[#e8f5e2] border border-[#385E31]/30 px-4 py-2 rounded mb-4 text-sm font-medium">
          ✓ {successMsg}
        </p>
      )}

      {/* ── Modals ───────────────────────────────────────────────────────── */}

      {/* View — custom: shows billing history, expiry countdown */}
      {activeModal?.type === "view" && (
        <ViewSuspendModal tenant={activeModal.tenant} onClose={() => setActiveModal(null)} />
      )}

      {/* Notify — custom: suspension-specific email preview */}
      {activeModal?.type === "notify" && (
        <SendSuspendNotificationModal tenant={activeModal.tenant} onClose={() => setActiveModal(null)} />
      )}

      {/* Restore — custom: remarks textarea + sends restoration email */}
      {activeModal?.type === "restore" && (
        <RestoreModal
          tenant={activeModal.tenant}
          onClose={() => setActiveModal(null)}
          onSuccess={handleRestoreSuccess}
        />
      )}

      {/* Terminate — reuses shared ConfirmActionModal (remarks textarea + warning box built-in) */}
      <ConfirmActionModal
        isOpen={activeModal?.type === "terminate"}
        actionType="terminate"
        tenantName={activeModal?.type === "terminate" ? activeModal.tenant.business_name : ""}
        isLoading={actionLoading}
        onConfirm={handleTerminate}
        onClose={() => {
          setActiveModal(null);
          setActionError("");
        }}
      />

      {/* ── Search ───────────────────────────────────────────────────────── */}
      <div className="w-full flex justify-between items-center mb-4 gap-4">
        <div className="relative flex-1 max-w-[60%]">
          <input
            type="text"
            placeholder="Search suspended database..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border border-[#385E31] rounded-full px-5 py-2 bg-transparent text-[#385E31] placeholder-[#385E31]/50 outline-none font-medium"
          />
          <div className="absolute right-4 top-2.5 text-[#385E31]"><SearchIcon /></div>
        </div>
        <div className="text-xs text-[#385E31]/60 font-semibold">
          {filtered.length} record{filtered.length !== 1 ? "s" : ""}
        </div>
      </div>

      {/* ── Table ────────────────────────────────────────────────────────── */}
      <div
        ref={tableRef}
        className="w-full bg-[#FFFCEB] rounded-[10px] border border-[#385E31] flex flex-col overflow-visible shadow-sm"
      >
        <div className="w-full flex bg-[#385E31] px-4 py-3 rounded-t-[8px]">
          {["Business Name", "Owner", "Date of Suspension", "Remarks", "Actions"].map((col) => (
            <div key={col} className="flex-1 text-center text-[#FFFCEB] text-[14px] font-bold">
              {col}
            </div>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="w-full text-center py-10 text-[#385E31] font-semibold text-sm">
            No suspended records found.
          </div>
        ) : (
          filtered.map((row, idx) => {
            const isLast   = idx === filtered.length - 1;
            const isOpen   = openDropdownId === row.id;
            const daysLeft = daysUntilExpiry(row.suspension_expires_at);
            const isUrgent = daysLeft !== null && daysLeft <= 2;

            return (
              <div
                key={row.id}
                className={`w-full flex px-4 py-[14px] items-center transition-colors ${
                  !isLast ? "border-b border-[#385E31]/20" : ""
                } ${isUrgent ? "bg-red-50/40" : "hover:bg-[#385E31]/5"}`}
              >
                <div className="flex-1 text-center text-[13px] font-bold text-[#3A6131]">
                  {row.business_name}
                  {isUrgent && (
                    <span className="ml-2 text-[10px] bg-red-100 text-red-600 border border-red-300 rounded-full px-2 py-0.5 font-bold">
                      {daysLeft! <= 0 ? "Expired" : `${daysLeft}d left`}
                    </span>
                  )}
                </div>

                <div className="flex-1 text-center text-[#3A6131] text-[13px] font-bold">
                  {row.owner_name}
                </div>

                <div className="flex-1 text-center text-[#3A6131] text-[13px] font-bold">
                  {formatDate(row.suspended_at)}
                </div>

                <div className="flex-1 text-center text-[#3A6131] text-[13px] font-bold">
                  {row.reason || "N/A"}
                </div>

                <div className="flex-1 flex justify-center items-center relative">
                  <button
                    onClick={() => setOpenDropdownId(isOpen ? null : row.id)}
                    className={`border border-[#385E31] rounded-full px-3 py-1 text-[11px] font-bold flex items-center gap-1 transition-colors ${
                      isOpen ? "bg-[#385E31] text-[#FFFCEB]" : "text-[#385E31] hover:bg-[#385E31]/10"
                    }`}
                  >
                    Action <ChevronDown />
                  </button>

                  {isOpen && (
                    <div className="absolute top-8 right-[50%] translate-x-1/2 w-[200px] bg-[#FFFCEB] border border-[#385E31] shadow-lg rounded-[4px] z-50 py-1 overflow-hidden text-[#385E31] text-[11px] font-semibold flex flex-col">
                      <button
                        onClick={() => openModal("view", row)}
                        className="px-3 py-1.5 hover:bg-[#E5AD24] text-left transition-colors"
                      >
                        View Suspension Details
                      </button>
                      <button
                        onClick={() => openModal("notify", row)}
                        className="px-3 py-1.5 hover:bg-[#E5AD24] text-left transition-colors"
                      >
                        Send Notification
                      </button>
                      <hr className="border-[#385E31]/20 mx-2" />
                      <button
                        onClick={() => openModal("restore", row)}
                        className="px-3 py-1.5 hover:bg-[#E5AD24] text-left transition-colors text-emerald-700"
                      >
                        ✓ Restore Tenant
                      </button>
                      <button
                        onClick={() => openModal("terminate", row)}
                        className="px-3 py-1.5 hover:bg-[#E5AD24] text-left transition-colors text-red-600"
                      >
                        ✗ Terminate Tenant
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      <div className="w-full flex justify-end mt-6">
        <button className="bg-[#F7B71D] text-[#385E31] text-[15px] font-bold px-10 py-2.5 rounded-[40px] shadow-sm hover:opacity-90 transition-opacity">
          Load More
        </button>
      </div>
    </>
  );
}