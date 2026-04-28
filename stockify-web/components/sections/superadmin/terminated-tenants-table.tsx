"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

// Use the ANON key for client-side components to stay secure!
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

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
}

export default function TerminatedTenantsTab() {
  const [data, setData] = useState<TerminatedBusiness[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

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
        <div className="w-full flex bg-[#385E31] px-4 py-3 rounded-t-[8px]">
          <div className="flex-1 text-center text-[#FFFCEB] text-[15px] font-bold">Business Name</div>
          <div className="flex-1 text-center text-[#FFFCEB] text-[15px] font-bold">Owner</div>
          <div className="flex-1 text-center text-[#FFFCEB] text-[15px] font-bold">Term. Date</div>
          <div className="flex-1 text-center text-[#FFFCEB] text-[15px] font-bold">Remarks</div>
        </div>

        {/* Table Body */}
        <div className="flex flex-col w-full min-h-[200px]">
          {loading ? (
            <div className="py-10 text-center text-[#385E31] font-bold">Loading records...</div>
          ) : filteredData.length === 0 ? (
            <div className="py-10 text-center text-[#385E31] font-bold">No terminated records found.</div>
          ) : (
            filteredData.map((row, idx) => {
              const isLast = idx === filteredData.length - 1;
              return (
                <div
                  key={row.id}
                  className={`w-full flex px-4 py-[14px] items-center ${!isLast ? "border-b border-[#385E31]/20" : ""}`}
                >
                  <div className="flex-1 text-center text-[#3A6131] text-[13px] font-bold">
                    {row.business_name}
                  </div>
                  <div className="flex-1 text-center text-[#3A6131] text-[#3A6131] text-[13px] font-bold">
                    {row.owner_name}
                  </div>
                  <div className="flex-1 text-center text-[#3A6131] text-[13px] font-bold">
                    {formatDate(row.terminated_at)}
                  </div>
                  <div className="flex-1 text-center text-[#3A6131] text-[13px] font-bold">
                    {formatDate(row.terminated_at)}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="w-full flex justify-end mt-6">
        <button className="bg-[#F7B71D] text-[#385E31] text-[15px] font-bold font-['Inter'] px-10 py-2.5 rounded-[40px] shadow-sm hover:opacity-90 transition-opacity">
          Load More
        </button>
      </div>
    </>
  );
}