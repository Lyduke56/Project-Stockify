"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import ConfirmActionModal from "@/components/modals/confirm-tenant-action-modal";

// ── Types ─────────────────────────────────────────────────────────────────────

interface ActiveTenant {
  tenant_id: string;
  business_name: string;
  owner_full_name: string;
  created_at: string;
  subscription_status: string;
  balance: string;
}

// ── SVG helpers ───────────────────────────────────────────────────────────────

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

// ── Status pill ───────────────────────────────────────────────────────────────

const getPillStyles = (status: string) => {
  switch (status) {
    case "Active":    return { bg: "bg-[#385E31]", text: "text-[#FFFCEB]" };
    case "Overdue":   return { bg: "bg-[#FFD980]",  text: "text-[#385E31]" };
    case "Suspended": return { bg: "bg-[#E91F22]",  text: "text-[#FFFCEB]" };
    default:          return { bg: "bg-[#385E31]",  text: "text-[#FFFCEB]" };
  }
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function ActiveTenantsTab() {
  const router = useRouter();

  const [tenants,  setTenants]  = useState<ActiveTenant[]>([]);
  const [filtered, setFiltered] = useState<ActiveTenant[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState("");

  const [search,         setSearch]         = useState("");
  const [filterStatus,   setFilterStatus]   = useState("All");
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  // Modal state
  const [selectedTenant,     setSelectedTenant]     = useState<ActiveTenant | null>(null);
  const [showSuspendModal,   setShowSuspendModal]   = useState(false);
  const [showTerminateModal, setShowTerminateModal] = useState(false);
  const [actionLoading,      setActionLoading]      = useState(false);
  const [actionError,        setActionError]        = useState("");
  const [successMsg,         setSuccessMsg]         = useState("");

  // Close dropdown on outside click
  const tableRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (tableRef.current && !tableRef.current.contains(e.target as Node)) {
        setOpenDropdownId(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Fetch ───────────────────────────────────────────────────────────────────

  useEffect(() => { fetchTenants(); }, []);

  const fetchTenants = async () => {
    setLoading(true);
    setError("");
    try {
      const res    = await fetch("/api/superadmin/active-tenants");
      const result = await res.json();
      if (result.error) throw new Error(result.error);
      setTenants(result.data  ?? []);
      setFiltered(result.data ?? []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load tenants.");
    } finally {
      setLoading(false);
    }
  };

  // ── Search + filter ─────────────────────────────────────────────────────────

  useEffect(() => {
    let list = tenants;
    if (filterStatus !== "All") {
      list = list.filter((t) => t.subscription_status === filterStatus);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (t) =>
          t.business_name.toLowerCase().includes(q) ||
          t.owner_full_name?.toLowerCase().includes(q),
      );
    }
    setFiltered(list);
  }, [search, filterStatus, tenants]);

  // ── Actions ─────────────────────────────────────────────────────────────────

  const withAction = async (fn: () => Promise<void>) => {
    setActionLoading(true);
    setActionError("");
    try {
      await fn();
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : "Action failed.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSuspend = () =>
    withAction(async () => {
      if (!selectedTenant) return;
      const res    = await fetch("/api/superadmin/suspend", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId: selectedTenant.tenant_id }),
      });
      const result = await res.json();
      if (!result.success) throw new Error(result.error ?? "Suspend failed.");

      setTenants((prev) => prev.filter((t) => t.tenant_id !== selectedTenant.tenant_id));
      setShowSuspendModal(false);
      setSelectedTenant(null);
      setSuccessMsg(`${selectedTenant.business_name} has been suspended.`);
      setTimeout(() => setSuccessMsg(""), 4000);
    });

  const handleTerminate = () =>
    withAction(async () => {
      if (!selectedTenant) return;
      const res    = await fetch("/api/superadmin/terminate", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId: selectedTenant.tenant_id }),
      });
      const result = await res.json();
      if (!result.success) throw new Error(result.error ?? "Terminate failed.");

      setTenants((prev) => prev.filter((t) => t.tenant_id !== selectedTenant.tenant_id));
      setShowTerminateModal(false);
      setSelectedTenant(null);
      setSuccessMsg(`${selectedTenant.business_name} has been terminated.`);
      setTimeout(() => setSuccessMsg(""), 4000);
    });

  const handleSendNotification = async (tenant: ActiveTenant) => {
    setOpenDropdownId(null);
    try {
      const res    = await fetch("/api/superadmin/notify", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId: tenant.tenant_id }),
      });
      const result = await res.json();
      if (!result.success) throw new Error(result.error ?? "Notification failed.");
      setSuccessMsg(`Notification sent to ${tenant.business_name}.`);
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : "Failed to send notification.");
    }
  };

  // ── Date formatter ──────────────────────────────────────────────────────────

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-PH", {
      month: "2-digit", day: "2-digit", year: "numeric",
    });

  // ── Render ──────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="w-full flex justify-center py-16 text-[#385E31] font-bold text-lg">
        Loading active tenants…
      </div>
    );
  }

  return (
    <>
      {/* Feedback banners */}
      {error && (
        <p className="w-full text-red-600 bg-red-100 border border-red-300 px-4 py-2 rounded mb-4 text-sm font-medium">
          {error}
        </p>
      )}
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

      {/* Search + filter */}
      <div className="w-full flex justify-between items-center mb-4 gap-4">
        <div className="relative flex-1 max-w-[60%]">
          <input
            type="text"
            placeholder="Search by business or owner…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border border-[#385E31] rounded-full px-5 py-2 bg-transparent text-[#385E31] placeholder-[#385E31] outline-none font-medium"
          />
          <div className="absolute right-4 top-2.5 text-[#385E31]"><SearchIcon /></div>
        </div>

        <div className="relative w-[200px]">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full appearance-none border border-[#385E31] rounded-full px-5 py-2 bg-transparent text-[#385E31] outline-none font-medium cursor-pointer"
          >
            <option value="All">Filter By</option>
            <option value="Active">Active</option>
            <option value="Overdue">Overdue</option>
          </select>
          <div className="absolute right-4 top-3.5 text-[#385E31] pointer-events-none"><ChevronDown /></div>
        </div>
      </div>

      {/* Table */}
      <div
        ref={tableRef}
        className="w-full bg-[#FFFCEB] rounded-[10px] border border-[#385E31] flex flex-col overflow-visible shadow-sm"
      >
        {/* Header */}
        <div className="w-full flex bg-[#385E31] px-4 py-3 rounded-t-[8px]">
          {["Business Name", "Owner", "Reg. Date", "Subscription", "Balance", "Actions"].map((col) => (
            <div key={col} className="flex-1 text-center text-[#FFFCEB] text-[15px] font-bold">{col}</div>
          ))}
        </div>

        {/* Rows */}
        {filtered.length === 0 ? (
          <div className="w-full text-center py-10 text-[#385E31] font-semibold text-sm">
            No active tenants found.
          </div>
        ) : (
          filtered.map((row, idx) => {
            const isLast = idx === filtered.length - 1;
            const isOpen = openDropdownId === row.tenant_id;
            const pill   = getPillStyles(row.subscription_status);

            return (
              <div
                key={row.tenant_id}
                className={`w-full flex px-4 py-[14px] items-center ${!isLast ? "border-b border-[#385E31]/20" : ""}`}
              >
                {/* Business Name */}
                <div className="flex-1 text-center text-[#3A6131] text-[13px] font-bold">
                  <span
                    onClick={() => router.push(`/superadmin/tenant-profile/${row.tenant_id}`)}
                    className="cursor-pointer hover:text-[#E5AD24] hover:underline transition-colors"
                  >
                    {row.business_name}
                  </span>
                </div>

                {/* Owner */}
                <div className="flex-1 text-center text-[#3A6131] text-[13px] font-bold">
                  {row.owner_full_name}
                </div>

                {/* Reg. Date */}
                <div className="flex-1 text-center text-[#3A6131] text-[13px] font-bold">
                  {formatDate(row.created_at)}
                </div>

                {/* Subscription pill */}
                <div className="flex-1 flex justify-center items-center">
                  <div className={`w-[75px] py-[3px] rounded-[40px] flex justify-center items-center ${pill.bg}`}>
                    <span className={`${pill.text} text-[10px] font-bold leading-3`}>
                      {row.subscription_status}
                    </span>
                  </div>
                </div>

                {/* Balance */}
                <div className="flex-1 text-center text-[#3A6131] text-[13px] font-bold">
                  {row.balance || "—"}
                </div>

                {/* Actions dropdown */}
                <div className="flex-1 flex justify-center items-center relative">
                  <button
                    onClick={() =>
                      setOpenDropdownId((prev) => prev === row.tenant_id ? null : row.tenant_id)
                    }
                    className={`border border-[#385E31] rounded-full px-3 py-1 text-[11px] font-bold flex items-center gap-1 transition-colors ${
                      isOpen ? "bg-[#385E31] text-[#FFFCEB]" : "text-[#385E31] hover:bg-[#385E31]/10"
                    }`}
                  >
                    Action <ChevronDown />
                  </button>

                  {isOpen && (
                    <div className="absolute top-8 right-[50%] translate-x-1/2 w-[150px] bg-[#FFFCEB] border border-[#385E31] shadow-lg rounded-[4px] z-10 py-1 overflow-hidden text-[#385E31] text-[11px] font-semibold flex flex-col text-left">
                      <button
                        onClick={() => {
                          setOpenDropdownId(null);
                          router.push(`/superadmin/tenant-profile/${row.tenant_id}`);
                        }}
                        className="px-3 py-1.5 hover:bg-[#E5AD24] text-left transition-colors"
                      >
                        View Tenant
                      </button>

                      <button
                        onClick={() => handleSendNotification(row)}
                        className="px-3 py-1.5 hover:bg-[#E5AD24] text-left transition-colors"
                      >
                        Send Notification
                      </button>

                      <button
                        onClick={() => {
                          setSelectedTenant(row);
                          setOpenDropdownId(null);
                          setShowSuspendModal(true);
                        }}
                        className="px-3 py-1.5 hover:bg-[#E5AD24] text-left transition-colors"
                      >
                        Suspend Tenant
                      </button>

                      <button
                        onClick={() => {
                          setSelectedTenant(row);
                          setOpenDropdownId(null);
                          setShowTerminateModal(true);
                        }}
                        className="px-3 py-1.5 hover:bg-[#E5AD24] text-left transition-colors"
                      >
                        Terminate Tenant
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Load More */}
      <div className="w-full flex justify-end mt-6">
        <button className="bg-[#F7B71D] text-[#385E31] text-[15px] font-bold font-['Inter'] px-10 py-2.5 rounded-[40px] shadow-sm hover:opacity-90 transition-opacity">
          Load More
        </button>
      </div>

      {/* ── Confirm modals ── */}
      <ConfirmActionModal
        isOpen={showSuspendModal}
        actionType="suspend"
        tenantName={selectedTenant?.business_name ?? ""}
        isLoading={actionLoading}
        onConfirm={handleSuspend}
        onClose={() => {
          setShowSuspendModal(false);
          setSelectedTenant(null);
          setActionError("");
        }}
      />

      <ConfirmActionModal
        isOpen={showTerminateModal}
        actionType="terminate"
        tenantName={selectedTenant?.business_name ?? ""}
        isLoading={actionLoading}
        onConfirm={handleTerminate}
        onClose={() => {
          setShowTerminateModal(false);
          setSelectedTenant(null);
          setActionError("");
        }}
      />
    </>
  );
}