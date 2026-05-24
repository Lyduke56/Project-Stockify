"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

// Use the ANON key for client-side components to stay secure!
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ── Added the interface here! ─────────────────────────────────────────────────
interface TabProps {
  onReview: (id: string) => void;
}

// --- CUSTOM SVG COMPONENTS ---
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

interface TerminatedBusiness {
  id: string;
  business_name: string;
  owner_name: string;
  terminated_at: string;
  remarks: string;
}

// ── Skeleton Loader ───────────────────────────────────────────────────────────

const SkeletonRow = () => (
  <div className="w-full flex px-4 py-[14px] items-center gap-4 border-b border-[#385E31]/10">
    <div className="w-[200px] shrink-0 h-4 bg-[#385E31]/10 rounded-full animate-pulse mx-auto" style={{ animationDelay: "0ms" }} />
    <div className="w-[200px] shrink-0 h-4 bg-[#385E31]/10 rounded-full animate-pulse mx-auto" style={{ animationDelay: "100ms" }} />
    <div className="w-[150px] shrink-0 h-4 bg-[#385E31]/10 rounded-full animate-pulse mx-auto" style={{ animationDelay: "200ms" }} />
    <div className="flex-1 h-4 bg-[#385E31]/10 rounded-full animate-pulse" style={{ animationDelay: "300ms" }} />
  </div>
);

// ── Main Component ────────────────────────────────────────────────────────────

// ── Added the prop to the definition! ─────────────────────────────────────────
export default function TerminatedTenantsTab({ onReview }: TabProps) {
  const [data, setData] = useState<TerminatedBusiness[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Pagination limit
  const [visibleCount, setVisibleCount] = useState(10);

  useEffect(() => {
    fetchTerminatedTenants();
  }, []);

  const fetchTerminatedTenants = async () => {
    try {
      setLoading(true);
      const { data: terminatedData, error } = await supabase
        .from("terminated_business")
        .select("*")
        .order("terminated_at", { ascending: false });

      if (error) throw error;
      setData(terminatedData || []);
    } catch (error) {
      console.error("Error fetching terminated tenants:", error);
    } finally {
      setLoading(false);
    }
  };

  // Reset visible count when searching
  useEffect(() => {
    setVisibleCount(10);
  }, [searchTerm]);

  // ── Helper to format date (No library needed) ──────────────────
  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-PH", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
    });

  const filteredData = data.filter((item) =>
    item.business_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.owner_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const visibleData = filteredData.slice(0, visibleCount);

  return (
    <>
      {/* Search and Filter Row */}
      <div className="w-full flex justify-between items-center mb-4 gap-4">
        <div className="relative flex-1 max-w-[60%]">
          <input
            type="text"
            placeholder="Search by business or owner..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full border border-[#385E31] rounded-full px-5 py-2 bg-transparent text-[#385E31] placeholder-[#385E31] outline-none font-medium"
          />
          <div className="absolute right-4 top-2.5 text-[#385E31]">
            <SearchIcon />
          </div>
        </div>
        <div className="relative w-[200px]">
          <select className="w-full appearance-none border border-[#385E31] rounded-full px-5 py-2 bg-transparent text-[#385E31] outline-none font-medium cursor-pointer">
            <option>Recent First</option>
            <option>Oldest First</option>
          </select>
          <div className="absolute right-4 top-3.5 text-[#385E31] pointer-events-none">
            <ChevronDown />
          </div>
        </div>
      </div>

      <div className="w-full bg-[#FFFCEB] rounded-[10px] border border-[#385E31] flex flex-col overflow-visible shadow-sm">
        {/* Table Header */}
        <div className="w-full flex bg-[#385E31] px-4 py-3 rounded-t-[8px] gap-4">
          <div className="w-[200px] shrink-0 text-center text-[#FFFCEB] text-[13px] font-bold tracking-wide">BUSINESS NAME</div>
          <div className="w-[200px] shrink-0 text-center text-[#FFFCEB] text-[13px] font-bold tracking-wide">OWNER</div>
          <div className="w-[150px] shrink-0 text-center text-[#FFFCEB] text-[13px] font-bold tracking-wide">TERM. DATE</div>
          <div className="flex-1 text-left text-[#FFFCEB] text-[13px] font-bold tracking-wide">REMARKS</div>
        </div>

        {/* Table Body */}
        <div className="flex flex-col w-full min-h-[200px] py-1">
          {loading ? (
             Array.from({ length: 10 }).map((_, idx) => <SkeletonRow key={idx} />)
          ) : filteredData.length === 0 ? (
            <div className="py-10 text-center text-[#385E31] font-bold text-sm">No terminated records found.</div>
          ) : (
            visibleData.map((row, idx) => {
              const isLast = idx === visibleData.length - 1;
              return (
                <div
                  key={row.id}
                  className={`w-full flex px-4 py-[14px] items-start gap-4 hover:bg-[#385E31]/[0.04] transition-colors ${
                    !isLast ? "border-b border-[#385E31]/15" : ""
                  }`}
                >
                  <div className="w-[200px] shrink-0 text-center text-[#3A6131] text-[13px] font-bold pt-0.5">
                    {/* IF you ever want to add click-to-review, you would just wrap this in a span with onClick={() => onReview(row.id)} */}
                    {row.business_name}
                  </div>
                  <div className="w-[200px] shrink-0 text-center text-[#3A6131] text-[13px] font-bold pt-0.5">
                    {row.owner_name}
                  </div>
                  <div className="w-[150px] shrink-0 text-center text-[#3A6131] text-[13px] font-bold pt-0.5">
                    {formatDate(row.terminated_at)}
                  </div>
                  {/* Styled like Audit Logs Description */}
                  <div className="flex-1 text-left text-[#3A6131] text-[13px] leading-relaxed pt-0.5 font-medium">
                    {row.remarks || "—"}
                  </div>
                </div>
              );
            })
          )}
        </div>
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
        {visibleCount < filteredData.length && (
          <button 
            onClick={() => setVisibleCount(prev => prev + 10)}
            className="bg-[#F7B71D] text-[#385E31] text-[15px] font-bold px-10 py-2.5 rounded-[40px] shadow-sm hover:opacity-90 transition-opacity"
          >
            Load More
          </button>
        )}
      </div>
    </>
  );
}