"use client";

import React, { useState } from "react";
import NavbarApp from "@/components/navbars/navbar-superadmin";
import SidebarSuperAdmin from "@/components/navbars/sidebar-superadmin";

// --- MOCK DATA & HELPERS FOR SYSTEM UPTIME ---
type StatusType = 'outage' | 'partial' | 'normal';

const uptimeStatus: Record<string, StatusType> = {
  'Jan-12': 'outage',
  'Jan-24': 'outage',
  'Feb-21': 'partial', // Adjusted dates to match heatmap pattern visually
  'Mar-21': 'partial',
  'Apr-21': 'partial',
  'May-24': 'partial',
  'Aug-11': 'partial',
};

const getHeatmapStatusClass = (monthAbbr: string, day: number): string => {
  const key = `${monthAbbr}-${day}`;
  const status = uptimeStatus[key];
  if (status === 'outage') return "bg-[#EF4444]"; 
  if (status === 'partial') return "bg-[#F59E0B]"; 
  return "bg-[#22C55E]"; 
};

const months = [
  { name: "January", abbr: "Jan", days: 31 },
  { name: "February", abbr: "Feb", days: 29 }, 
  { name: "March", abbr: "Mar", days: 31 },
  { name: "April", abbr: "Apr", days: 30 },
  { name: "May", abbr: "May", days: 31 },
  { name: "June", abbr: "Jun", days: 30 },
  { name: "July", abbr: "Jul", days: 31 },
  { name: "August", abbr: "Aug", days: 31 },
  { name: "September", abbr: "Sep", days: 30 },
  { name: "October", abbr: "Oct", days: 31 },
  { name: "November", abbr: "Nov", days: 30 },
  { name: "December", abbr: "Dec", days: 31 },
];

// --- CUSTOM SVG COMPONENTS ---
const SearchIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"></circle>
    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
  </svg>
);

const ChevronDown = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9"></polyline>
  </svg>
);

// --- MAIN COMPONENT ---
export default function AuditLogs() {
  // Generate mock array for the 12 "Body" rows shown in the design
  const mockTableRows = Array.from({ length: 12 }).map((_, i) => ({ id: i }));

  return (
    <div className="flex h-screen w-full bg-[#FFFCEB] overflow-hidden font-['Inter']">
      
      {/* LEFT SIDE: Fixed Sidebar */}
      <SidebarSuperAdmin />

      {/* RIGHT SIDE: Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-y-auto px-10 md:px-20 pt-5 pb-12">
        
        <NavbarApp />

        {/* Page Header */}
        <div className="w-full flex flex-col items-center mt-10 mb-8 gap-2">
          <h1 className="text-[#385E31] text-[30px] font-extrabold tracking-wide uppercase">
            AUDIT LOGS
          </h1>
          <div className="w-full max-w-[900px] h-1.5 bg-[#F7B71D] rounded-full" />
        </div>

        {/* --- SYSTEM UPTIME COMPONENT --- */}
        <div className="w-full p-6 bg-[#385E31] rounded-[10px] flex flex-col gap-4 mb-12 shadow-sm">
          <div className="w-full text-[#FFFCEB] text-[20px] font-bold font-['Inter'] tracking-wide">
            System Uptime
          </div>
          <div className="flex w-full gap-5">
            <div className="w-[280px] bg-[#FFFCEB] rounded-[8px] flex flex-col justify-center items-center px-6 py-10 shrink-0">
              <div className="text-[#3A6131] text-[64px] font-black tracking-tight leading-none mb-4">
                99.98%
              </div>
              <p className="text-center text-[#3A6131] text-[12px] font-medium leading-relaxed">
                All systems, including the multi-tenant SaaS inventory engine and database, are fully functional.
              </p>
            </div>
            <div className="flex-1 bg-[#FFFCEB] rounded-[8px] px-6 py-6 flex flex-col justify-between overflow-x-auto">
              <div className="grid grid-cols-[30px_repeat(31,minmax(0,1fr))] gap-x-[2px] gap-y-[3px] w-full min-w-[600px]">
                {months.map((month) => (
                  <React.Fragment key={month.abbr}>
                    <div className="text-[#3A6131] text-[10px] font-bold self-center pr-2 text-right">
                      {month.abbr}
                    </div>
                    {[...Array(31)].map((_, i) => {
                      const day = i + 1;
                      const isHidden = day > month.days;
                      return (
                        <div 
                          key={day} 
                          className={`w-full aspect-square max-w-[14px] max-h-[14px] rounded-[2px] mx-auto ${isHidden ? 'invisible' : getHeatmapStatusClass(month.abbr, day)}`}
                          title={isHidden ? undefined : `${month.name} ${day}`}
                        />
                      );
                    })}
                  </React.Fragment>
                ))}
                <div className="col-start-1"></div>
                {[...Array(31)].map((_, i) => (
                  <div key={i} className="text-[#3A6131] text-[9px] font-bold text-center mt-1">
                    {i + 1}
                  </div>
                ))}
              </div>
              <div className="w-full flex items-center justify-center gap-6 mt-4 text-[#3A6131] text-[10px] font-bold">
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-[2px] bg-[#22C55E]"></div>100%</div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-[2px] bg-[#F59E0B]"></div>Partial Degradation</div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-[2px] bg-[#EF4444]"></div>Service Outage</div>
              </div>
            </div>
          </div>
        </div>

        {/* --- FILTERS & TABLE SECTION --- */}
        <div className="w-full flex flex-col items-center">
          
          {/* Search and Filter Row */}
          <div className="w-full flex justify-between items-center mb-4 gap-4">
            
            {/* Date Range Dropdown */}
            <div className="relative flex-1 max-w-[280px]">
              <select className="w-full appearance-none border border-[#385E31] rounded-full px-5 py-2.5 bg-transparent text-[#385E31] outline-none font-semibold text-[13px] cursor-pointer">
                <option>Date Range</option>
              </select>
              <div className="absolute right-4 top-[10px] text-[#385E31] pointer-events-none">
                <ChevronDown />
              </div>
            </div>

            {/* Event Type Dropdown */}
            <div className="relative flex-1 max-w-[280px]">
              <select className="w-full appearance-none border border-[#385E31] rounded-full px-5 py-2.5 bg-transparent text-[#385E31] outline-none font-semibold text-[13px] cursor-pointer">
                <option>Event Type</option>
              </select>
              <div className="absolute right-4 top-[10px] text-[#385E31] pointer-events-none">
                <ChevronDown />
              </div>
            </div>

            {/* Search Input */}
            <div className="relative flex-[2]">
              <input 
                type="text" 
                placeholder="Search by Business Name" 
                className="w-full border border-[#385E31] rounded-full px-5 py-2.5 bg-transparent text-[#385E31] placeholder-[#385E31] outline-none font-semibold text-[13px]" 
              />
              <div className="absolute right-4 top-[10px] text-[#385E31]">
                <SearchIcon />
              </div>
            </div>
            
          </div>

          {/* Data Table */}
          <div className="w-full bg-[#FFFCEB] rounded-[10px] border border-[#385E31] flex flex-col overflow-hidden shadow-sm">
            
            {/* Header Row */}
            <div className="w-full flex bg-[#385E31] px-4 py-3">
              <div className="flex-1 text-center text-[#FFFCEB] text-[14px] font-bold">Date & Time</div>
              <div className="flex-1 text-center text-[#FFFCEB] text-[14px] font-bold">Business Name</div>
              <div className="flex-1 text-center text-[#FFFCEB] text-[14px] font-bold">Event Type</div>
              <div className="flex-1 text-center text-[#FFFCEB] text-[14px] font-bold">Description/Notes</div>
            </div>

            {/* Data Rows */}
            <div className="flex flex-col w-full py-4">
              {mockTableRows.map((row) => (
                <div key={row.id} className="w-full flex px-4 py-[14px] items-center">
                  <div className="flex-1 text-center text-[#3A6131] text-[13px] font-bold">Body</div>
                  <div className="flex-1 text-center text-[#3A6131] text-[13px] font-bold">Body</div>
                  <div className="flex-1 text-center text-[#3A6131] text-[13px] font-bold">Body</div>
                  <div className="flex-1 text-center text-[#3A6131] text-[13px] font-bold">Body</div>
                </div>
              ))}
            </div>

          </div>

          {/* Load More Button */}
          <div className="w-full flex justify-end mt-6">
            <button className="bg-[#F7B71D] text-[#385E31] text-[14px] font-bold font-['Inter'] px-10 py-2.5 rounded-[40px] shadow-sm hover:opacity-90 transition-opacity">
              Load More
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}