"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

// ── Types ─────────────────────────────────────────────────────────────────────

interface TrialTenant {
  tenant_id:       string;
  business_name:   string;
  owner_full_name: string;
  owner_email:     string;
  business_type:   string;
  trial_ends_at:   string | null;
  trial_days_left: number;
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

// ── Column headers ────────────────────────────────────────────────────────────

const COLUMNS = [
  "Business Name",
  "Owner",
  "Business Type",
  "Trial Ends",
  "Days Left",
  "Actions",
];

// ── Trial days badge ──────────────────────────────────────────────────────────

function DaysBadge({ days }: { days: number }) {
  if (days <= 1)  return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[13px] font-bold bg-[#FFE0E0] text-[#B91C1C]">Expires today</span>;
  if (days <= 2)  return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[13px] font-bold bg-[#FFE0E0] text-[#B91C1C]">{days}d left</span>;
  if (days <= 4)  return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[13px] font-bold bg-[#FFD980] text-[#7A5500]">{days}d left</span>;
  return              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[13px] font-bold bg-[#E0EDFF] text-[#1D4ED8]">{days}d left</span>;
}

// ── End Trial Confirm Modal ───────────────────────────────────────────────────

function EndTrialModal({
  tenant,
  isLoading,
  onConfirm,
  onClose,
}: {
  tenant: TrialTenant;
  isLoading: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget && !isLoading) onClose(); }}
    >
      <div className="relative bg-[#FFFCEB] rounded-[14px] w-full max-w-[420px] shadow-2xl border border-[#385E31]/20 overflow-hidden">
        {/* Accent bar */}
        <div className="h-1.5 w-full bg-[#E5AD24]" />

        <div className="p-7 flex flex-col items-center gap-5">
          {/* Icon */}
          <div className="w-16 h-16 rounded-full bg-[#385E31]/5 border border-[#385E31]/10 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24"
              fill="none" stroke="#E5AD24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>

          {/* Text */}
          <div className="text-center flex flex-col gap-2">
            <h3 className="text-[#385E31] text-[20px] font-extrabold">End Free Trial</h3>
            <p className="text-[#385E31]/75 text-[13px] font-medium leading-relaxed">
              You're about to end the free trial for{" "}
              <strong>{tenant.business_name}</strong> early. Their account will move
              to <strong>Active</strong> billing immediately and a{" "}
              <strong>₱1,000 invoice</strong> will be generated for this month.
            </p>
          </div>

          {/* Info note */}
          <div className="w-full bg-[#E5AD24]/10 border border-[#E5AD24]/30 rounded-[8px] px-4 py-3 flex items-start gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
              fill="none" stroke="#E5AD24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
              className="shrink-0 mt-0.5">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <p className="text-[#385E31]/40 text-[12px] font-semibold leading-relaxed">
              The tenant will receive an email notification that their trial has ended
              and billing has started.
            </p>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 w-full mt-1">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 border-2 border-[#385E31] text-[#385E31] font-bold text-[14px] py-2.5 rounded-[40px] hover:bg-[#385E31]/5 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className="flex-1 bg-[#E5AD24] text-[#385E31] font-bold text-[14px] py-2.5 rounded-[40px] hover:bg-[#D19D1F] transition-colors disabled:opacity-60"
            >
              {isLoading ? "Processing…" : "Yes, End Trial"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function TrialTenantsTab() {
  const router = useRouter();

  const [tenants,  setTenants]  = useState<TrialTenant[]>([]);
  const [filtered, setFiltered] = useState<TrialTenant[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState("");

  const [search,         setSearch]         = useState("");
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  // Action state
  const [selectedTenant,  setSelectedTenant]  = useState<TrialTenant | null>(null);
  const [showEndTrialModal, setShowEndTrialModal] = useState(false);
  const [actionLoading,   setActionLoading]   = useState(false);
  const [actionError,     setActionError]     = useState("");
  const [successMsg,      setSuccessMsg]      = useState("");

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

  useEffect(() => { fetchTrialTenants(); }, []);

  const fetchTrialTenants = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/cron/billing");
      const result = await res.json();
      if (result.error) throw new Error(result.error);

      // Map billing API shape → TrialTenant
      const mapped: TrialTenant[] = (result.data ?? [])
        .filter((d: { is_in_trial: boolean }) => d.is_in_trial)
        .map((d: {
          tenant_id: string;
          business_name: string;
          owner_full_name: string;
          owner_email: string;
          business_type: string;
          trial_ends_at: string | null;
          trial_days_left: number;
        }) => ({
          tenant_id:       d.tenant_id,
          business_name:   d.business_name,
          owner_full_name: d.owner_full_name,
          owner_email:     d.owner_email,
          business_type:   d.business_type,
          trial_ends_at:   d.trial_ends_at,
          trial_days_left: d.trial_days_left,
        }));

      setTenants(mapped);
      setFiltered(mapped);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load trial tenants.");
    } finally {
      setLoading(false);
    }
  };

  // ── Search filter ───────────────────────────────────────────────────────────

  useEffect(() => {
    if (!search.trim()) { setFiltered(tenants); return; }
    const q = search.toLowerCase();
    setFiltered(
      tenants.filter(
        (t) =>
          t.business_name.toLowerCase().includes(q)   ||
          t.owner_full_name?.toLowerCase().includes(q) ||
          t.business_type?.toLowerCase().includes(q),
      )
    );
  }, [search, tenants]);

  // ── Handlers ────────────────────────────────────────────────────────────────

  const flash = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(""), 4500);
  };

  const handleEndTrial = async () => {
    if (!selectedTenant) return;
    setActionLoading(true);
    setActionError("");
    try {
      const res = await fetch("/api/cron/billing", {
            method:  "POST",
            headers: { "Content-Type": "application/json" },
            body:    JSON.stringify({ tenantId: selectedTenant.tenant_id }),
            });
      const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result.error ?? "Failed to end trial.");

      // Remove from list
      setTenants((prev) => prev.filter((t) => t.tenant_id !== selectedTenant.tenant_id));
      setShowEndTrialModal(false);
      setSelectedTenant(null);
      flash(`Free trial for ${selectedTenant.business_name} has ended. Billing is now active.`);
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : "Action failed.");
    } finally {
      setActionLoading(false);
    }
  };

  // ── Date formatter ──────────────────────────────────────────────────────────

  const formatDate = (iso: string | null) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("en-PH", {
      month: "2-digit", day: "2-digit", year: "numeric",
    });
  };

  // ── Loading ─────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="w-full flex justify-center py-16 text-[#385E31] font-bold text-lg">
        Loading trial tenants…
      </div>
    );
  }

  // ── Render ──────────────────────────────────────────────────────────────────

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

      {/* Search */}
      <div className="w-full flex justify-between items-center mb-4 gap-4 mt-5">
        <div className="relative flex-1 max-w-[60%]">
          <input
            type="text"
            placeholder="Search by business, owner, or type…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border border-[#385E31] rounded-full px-5 py-2 bg-transparent text-[#385E31] placeholder-[#385E31] outline-none font-medium"
          />
          <div className="absolute right-4 top-2.5 text-[#385E31]"><SearchIcon /></div>
        </div>

        {/* Trial count pill */}
        <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-[#385E31] bg-[#E0EDFF]">
          <span className="text-[#385E31] text-[12px] font-bold">
            {filtered.length} tenant{filtered.length !== 1 ? "s" : ""} on free trial
          </span>
        </div>
      </div>

      {/* Table */}
      <div
        ref={tableRef}
        className="w-full bg-[#FFFCEB] rounded-[10px] border border-[#385E31] flex flex-col overflow-visible shadow-sm"
      >
        {/* Header */}
        <div className="w-full flex bg-[#385E31] px-4 py-3 rounded-t-[8px]">
          {COLUMNS.map((col) => (
            <div key={col} className="flex-1 text-center text-[#FFFCEB] text-[13px] font-bold">
              {col}
            </div>
          ))}
        </div>

        {/* Rows */}
        {filtered.length === 0 ? (
          <div className="w-full text-center py-10 text-[#385E31] font-semibold text-sm">
            No tenants currently on a free trial.
          </div>
        ) : (
          filtered.map((row, idx) => {
            const isLast = idx === filtered.length - 1;
            const isOpen = openDropdownId === row.tenant_id;

            return (
              <div
                key={row.tenant_id}
                className={`w-full flex px-4 py-[14px] items-center ${
                  !isLast ? "border-b border-[#385E31]/20" : ""
                }`}
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

                {/* Business Type */}
                <div className="flex-1 text-center text-[#3A6131] text-[13px] font-bold">
                  {row.business_type || "—"}
                </div>

                {/* Trial Ends */}
                <div className="flex-1 text-center text-[13px] font-bold">
                  <span
                    className={
                      row.trial_days_left <= 2
                        ? "text-[#E91F22]"
                        : row.trial_days_left <= 4
                        ? "text-[#7A5500]"
                        : "text-[#3A6131]"
                    }
                  >
                    {formatDate(row.trial_ends_at)}
                  </span>
                </div>

                {/* Days Left */}
                <div className="flex-1 flex justify-center items-center text-[13px] text-[#3A6131]">
                  <DaysBadge days={row.trial_days_left} />
                </div>

                {/* Actions dropdown */}
                <div className="flex-1 flex justify-center items-center relative">
                  <button
                    onClick={() =>
                      setOpenDropdownId((prev) =>
                        prev === row.tenant_id ? null : row.tenant_id
                      )
                    }
                    className={`border border-[#385E31] rounded-full px-3 py-1 text-[11px] font-bold flex items-center gap-1 transition-colors ${
                      isOpen
                        ? "bg-[#385E31] text-[#FFFCEB]"
                        : "text-[#385E31] hover:bg-[#385E31]/10"
                    }`}
                  >
                    Action <ChevronDown />
                  </button>

                  {isOpen && (
                    <div className="absolute top-8 right-[50%] translate-x-1/2 w-[160px] bg-[#FFFCEB] border border-[#385E31] shadow-lg rounded-[4px] z-10 py-1 overflow-hidden text-[#385E31] text-[11px] font-semibold flex flex-col text-left">

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
                        onClick={() => {
                          setSelectedTenant(row);
                          setOpenDropdownId(null);
                          setShowEndTrialModal(true);
                        }}
                        className="px-3 py-1.5 hover:bg-[#E5AD24] text-left transition-colors"
                      >
                        End Trial Early
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

      {/* End Trial Modal */}
      {showEndTrialModal && selectedTenant && (
        <EndTrialModal
          tenant={selectedTenant}
          isLoading={actionLoading}
          onConfirm={handleEndTrial}
          onClose={() => {
            if (!actionLoading) {
              setShowEndTrialModal(false);
              setSelectedTenant(null);
              setActionError("");
            }
          }}
        />
      )}
    </>
  );
}