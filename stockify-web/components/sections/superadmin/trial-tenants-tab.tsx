"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, X, Loader2, FastForward } from "lucide-react";
import TenantProfileModal from "@/components/modals/superadmin/tenant-profile/tenant-profile-modal";

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

interface TabProps {
  onReview?: (id: string) => void; // Made optional since the modal handles the review now
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
  "BUSINESS NAME",
  "OWNER",
  "BUSINESS TYPE",
  "TRIAL ENDS",
  "DAYS LEFT",
  "ACTIONS",
];

// ── Skeleton Loader ───────────────────────────────────────────────────────────

const SkeletonRow = () => (
  <div className="w-full flex px-4 py-[14px] items-center border-b border-[#385E31]/10">
    {Array.from({ length: COLUMNS.length }).map((_, i) => (
      <div key={i} className="flex-1 px-4">
        <div 
          className="h-4 bg-[#385E31]/10 rounded-full animate-pulse mx-auto" 
          style={{ 
            animationDelay: `${i * 100}ms`,
            width: i === 5 ? "80px" : i === 4 ? "65px" : "80%" 
          }} 
        />
      </div>
    ))}
  </div>
);

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
    <div className="fixed inset-0 z-[200] flex items-center justify-center font-['Inter']">
      
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-[#3A6131]/40 backdrop-blur-sm"
        onClick={!isLoading ? onClose : undefined}
      />

      {/* Modal card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ type: "spring", stiffness: 320, damping: 26 }}
        className="relative z-10 bg-[#FFFCEB] rounded-[24px] shadow-2xl w-[440px] max-w-[95vw] overflow-hidden border border-[#E5AD24]/30"
      >
        {/* Header */}
        <div className="bg-[#E5AD24] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[#3A6131]">
            <FastForward size={18} strokeWidth={2.5} />
            <h2 className="font-bold text-lg tracking-wide">End Free Trial</h2>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="text-[#3A6131] opacity-70 hover:opacity-100 transition-opacity disabled:opacity-50"
          >
            <X size={20} strokeWidth={2.5} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 flex flex-col items-center text-center gap-4">
          
          {/* Icon Bubble */}
          <div className="w-16 h-16 rounded-full flex items-center justify-center shadow-sm bg-yellow-100 text-[#D19D1F]">
            <FastForward size={32} />
          </div>

          {/* Text */}
          <div>
            <p className="text-[#3A6131] font-bold text-lg">Are you sure?</p>
            <p className="text-gray-500 text-[13.5px] mt-1 leading-relaxed px-2">
              You are about to end the free trial for <span className="font-bold text-[#3A6131]">{tenant.business_name}</span> early. Their account will move to <span className="font-bold text-[#3A6131]">Active</span> billing immediately and a <span className="font-bold text-[#3A6131]">₱1,000 invoice</span> will be generated.
            </p>
          </div>

          {/* Warning Box */}
          <div className="w-full p-3.5 rounded-xl border text-left mt-1 flex items-start gap-2.5 bg-yellow-50 border-yellow-200 text-yellow-800">
            <AlertTriangle size={16} className="shrink-0 mt-[1px]" />
            <p className="text-xs font-medium leading-relaxed">
              <span className="font-bold">Note:</span> The tenant will receive an email notification that their trial has ended and billing has started.
            </p>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 pb-6 flex gap-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 py-2.5 border-2 border-[#3A6131] text-[#3A6131] font-bold rounded-xl hover:bg-[#3A6131]/5 transition-colors disabled:opacity-50"
          >
            Go Back
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 py-2.5 font-bold rounded-xl shadow-md transition-colors flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed bg-[#E5AD24] text-[#3A6131] hover:bg-[#D19D1F]"
          >
            {isLoading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Processing...
              </>
            ) : (
              "End Trial Early"
            )}
          </button>
        </div>

      </motion.div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function TrialTenantsTab({ onReview }: TabProps) {
  const [tenants,  setTenants]  = useState<TrialTenant[]>([]);
  const [filtered, setFiltered] = useState<TrialTenant[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState("");

  const [search,         setSearch]         = useState("");
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  
  // Pagination limit
  const [visibleCount, setVisibleCount] = useState(10);

  // Action state
  const [selectedTenant,  setSelectedTenant]  = useState<TrialTenant | null>(null);
  const [showEndTrialModal, setShowEndTrialModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false); // Added profile modal state
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
      const res = await fetch("/api/cron/active-trial");
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
    if (!search.trim()) { setFiltered(tenants); setVisibleCount(10); return; }
    const q = search.toLowerCase();
    setFiltered(
      tenants.filter(
        (t) =>
          t.business_name.toLowerCase().includes(q)   ||
          t.owner_full_name?.toLowerCase().includes(q) ||
          t.business_type?.toLowerCase().includes(q),
      )
    );
    setVisibleCount(10);
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
      const res = await fetch("/api/cron/active-trial", {
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

  // ── Render ──────────────────────────────────────────────────────────────────

  const visibleTenants = filtered.slice(0, visibleCount);

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

        {/* Improved Trial count badge */}
        {!loading && (
          <div className="flex items-center gap-2 px-5 py-2 rounded-full border border-[#385E31]/40 bg-[#FFFCEB] shadow-sm">
            <div className="w-2 h-2 rounded-full bg-[#E5AD24] animate-pulse" />
            <span className="text-[#385E31] text-[12px] font-extrabold tracking-wide uppercase">
              {filtered.length} tenant{filtered.length !== 1 ? "s" : ""} on free trial
            </span>
          </div>
        )}
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
        {loading ? (
           Array.from({ length: 10 }).map((_, idx) => <SkeletonRow key={idx} />)
        ) : filtered.length === 0 ? (
          <div className="w-full text-center py-10 text-[#385E31] font-semibold text-sm">
            No tenants currently on a free trial.
          </div>
        ) : (
          visibleTenants.map((row, idx) => {
            const isLast = idx === visibleTenants.length - 1;
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
                    onClick={() => {
                      setSelectedTenant(row);
                      setShowProfileModal(true);
                    }}
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
                          setSelectedTenant(row);
                          setOpenDropdownId(null);
                          setShowProfileModal(true);
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

      {/* Pagination Controls */}
      <div className="w-full flex justify-end mt-6 gap-3">
        {visibleCount > 10 && (
          <button 
            onClick={() => setVisibleCount(10)}
            className="border border-[#385E31] text-[#385E31] text-[15px] font-bold px-10 py-2.5 rounded-[40px] hover:bg-[#385E31]/5 transition-colors"
          >
            Show Less
          </button>
        )}
        {visibleCount < filtered.length && (
          <button 
            onClick={() => setVisibleCount(prev => prev + 10)}
            className="bg-[#F7B71D] text-[#385E31] text-[15px] font-bold px-10 py-2.5 rounded-[40px] shadow-sm hover:opacity-90 transition-opacity"
          >
            Load More
          </button>
        )}
      </div>
      

      {/* Modals wrapped in AnimatePresence for smooth exits */}
      <AnimatePresence>
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
      </AnimatePresence>

      {/* Global Modals (Profile) */}
      <TenantProfileModal
        isOpen={showProfileModal}
        tenantId={selectedTenant?.tenant_id ?? null}
        onClose={() => {
          setShowProfileModal(false);
          setSelectedTenant(null);
        }}
        onSuccess={(tenantId, action) => {
          // If you ever add suspend/terminate logic inside the profile modal for trial tenants, this clears them from the UI.
          if (action === "suspend" || action === "terminate") {
            setTenants((prev) => prev.filter((t) => t.tenant_id !== tenantId));
          }
        }}
      />
      
    </>
  );
}