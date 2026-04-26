"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

// --- Supabase Client Init ---
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// --- Types ---
interface SuspendedTenant {
  id: string;
  tenant_id: string;
  business_name: string;
  owner_name: string;
  suspended_at: string;
  reason?: string;
  // This would come from a join or be manually assigned
  subscription?: string; 
}

// --- SVG helpers ---
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

export default function SuspendedTenantsTab() {
  const router = useRouter();

  const [tenants, setTenants] = useState<SuspendedTenant[]>([]);
  const [filtered, setFiltered] = useState<SuspendedTenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  // --- Fetch from Supabase ---
  useEffect(() => {
    const fetchSuspended = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("suspended_tenants")
        .select("*") 
        .order("suspended_at", { ascending: false });

      if (error) {
        console.error("Error fetching suspended tenants:", error);
      } else {
        setTenants(data || []);
        setFiltered(data || []);
      }
      setLoading(false);
    };

    fetchSuspended();
  }, []);

  // --- Search Logic ---
  useEffect(() => {
    const q = search.toLowerCase();
    const list = tenants.filter(
      (t) =>
        t.business_name.toLowerCase().includes(q) ||
        t.owner_name.toLowerCase().includes(q)
    );
    setFiltered(list);
  }, [search, tenants]);

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

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-PH", {
      month: "2-digit", day: "2-digit", year: "numeric",
    });

  if (loading) return <div className="py-20 text-center text-[#385E31] font-bold">Loading Suspended Database...</div>;

  return (
    <>
      {/* Search Section */}
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
      </div>

      {/* Table Container */}
      <div ref={tableRef} className="w-full bg-[#FFFCEB] rounded-[10px] border border-[#385E31] flex flex-col overflow-visible shadow-sm">
        {/* Table Header */}
        <div className="w-full flex bg-[#385E31] px-4 py-3 rounded-t-[8px]">
          {["Business Name", "Owner", "Date of Suspension", "Actions"].map((col) => (
            <div key={col} className="flex-1 text-center text-[#FFFCEB] text-[14px] font-bold">{col}</div>
          ))}
        </div>

        {/* Table Body */}
        {filtered.length === 0 ? (
          <div className="w-full text-center py-10 text-[#385E31] font-semibold text-sm">
            No suspended records found.
          </div>
        ) : (
          filtered.map((row, idx) => {
            const isLast = idx === filtered.length - 1;
            const isOpen = openDropdownId === row.id;

            return (
              <div key={row.id} className={`w-full flex px-4 py-[14px] items-center ${!isLast ? "border-b border-[#385E31]/20" : ""}`}>
                <div className="flex-1 text-center text-[#3A6131] text-[13px] font-bold">
                  {row.business_name}
                </div>
                <div className="flex-1 text-center text-[#3A6131] text-[13px] font-bold">
                  {row.owner_name}
                </div>
                <div className="flex-1 text-center text-[#3A6131] text-[13px] font-bold">
                  {formatDate(row.suspended_at)}
                </div>

                {/* Actions Dropdown */}
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
                    <div className="absolute top-8 right-[50%] translate-x-1/2 w-[160px] bg-[#FFFCEB] border border-[#385E31] shadow-lg rounded-[4px] z-50 py-1 overflow-hidden text-[#385E31] text-[11px] font-semibold flex flex-col text-left">
                      <button
                        onClick={() => {
                          setOpenDropdownId(null);
                          router.push(`/superadmin/tenant-profile/${row.tenant_id}`);
                        }}
                        className="px-3 py-1.5 hover:bg-[#E5AD24] text-left transition-colors"
                      >
                        View Tenant
                      </button>
                      <button className="px-3 py-1.5 opacity-50 cursor-not-allowed text-left">Send Notification</button>
                      <button className="px-3 py-1.5 opacity-50 cursor-not-allowed text-left">Restore Tenant</button>
                      <button className="px-3 py-1.5 opacity-50 cursor-not-allowed text-left text-red-600">Terminate Tenant</button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination Footer */}
      <div className="w-full flex justify-end mt-6">
        <button className="bg-[#F7B71D] text-[#385E31] text-[15px] font-bold px-10 py-2.5 rounded-[40px] shadow-sm hover:opacity-90 transition-opacity">
          Load More
        </button>
      </div>
    </>
  );
}