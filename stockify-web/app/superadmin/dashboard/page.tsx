"use client";

import React from "react";
import Sidebar from "@/components/navbars/sidebar-superadmin";
import NavbarApp from "@/components/navbars/navbar-superadmin";
import StatCard from "@/components/cards/stat-cards";

// Data for the Heatmap (MOCK RA NI HA)
type StatusType = 'outage' | 'partial' | 'normal';

const uptimeStatus: Record<string, StatusType> = {
  'Jan-12': 'outage',
  'Jan-24': 'outage',
  'Feb-31': 'partial', 
  'Mar-26': 'partial',
  'Apr-26': 'partial',
  'May-28': 'partial',
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

// Data & Helpers for the Recent Activities Table
const recentActivities = [
  { id: 1, status: "Active" },
  { id: 2, status: "Suspended" },
  { id: 3, status: "Active" },
  { id: 4, status: "Overdue" },
  { id: 5, status: "Active" },
  { id: 6, status: "Pending" },
  { id: 7, status: "Active" },
  { id: 8, status: "Active" },
  { id: 9, status: "Pending" },
  { id: 10, status: "Active" },
  { id: 11, status: "Active" },
  { id: 12, status: "Active" },
  { id: 13, status: "Overdue" },
];

// Status Indicators ni sha na pills
const getPillStyles = (status: string) => {
  switch (status) {
    case 'Active': return { bg: 'bg-[#385E31]', text: 'text-[#FFFCEB]' };
    case 'Pending': return { bg: 'bg-[#E5AD24]', text: 'text-[#385E31]' }; // Dark text on Golden Yellow
    case 'Suspended': return { bg: 'bg-[#E91F22]', text: 'text-[#FFFCEB]' }; // Cream text on Red
    case 'Overdue': return { bg: 'bg-[#FFD980]', text: 'text-[#385E31]' }; // Dark text on Light Yellow
    default: return { bg: 'bg-[#385E31]', text: 'text-[#FFFCEB]' };
  }
};

export default function SuperadminDashboard() {
  return (
    <div className="flex h-screen w-full bg-[#FFFCEB] overflow-hidden font-['Inter']">
      
      {/* LEFT SIDE: Fixed Sidebar */}
      <Sidebar />

      {/* RIGHT SIDE: Main Content ehey*/}
      <div className="flex-1 flex flex-col h-full overflow-y-auto px-20 pt-5 pb-12">
        
        <NavbarApp />

        {/* Header */}
        <div className="w-full flex flex-col items-center mt-10 mb-8">
          <h1 className="text-[#385E31] text-[30px] font-extrabold tracking-wide uppercase">
            Superadmin Dashboard
          </h1>
          <div className="w-[900px] h-1.5 bg-[#F7B71D] mt-1 rounded-full"></div>
        </div>

        {/* Stat Cards */}
        <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          <StatCard title="Active Tenants" value="1.24k" trendText="↑ 5% this month (January)" className="w-full" svgName="SA-active-tenants" />
          <StatCard title="Pending Applications" value="39" trendText="39 new applications await review" className="w-full" svgName="SA-pending-app" />
          <StatCard title="Revenue status" value="124" trendText="Review their payment status and take action" className="w-full" svgName="SA-rev-stat" />
        </div>

        {/* System Uptime */}
        <div className="w-full p-6 bg-[#385E31] rounded-[10px] flex flex-col gap-4 mb-8">
          <div className="w-full text-[#FFFCEB] text-[22px] font-bold font-['Inter'] tracking-wide">
            System Uptime
          </div>
          <div className="flex w-full gap-5">
            <div className="w-[280px] bg-[#FFFCEB] rounded-[8px] flex flex-col justify-center items-center px-6 py-10 shrink-0">
              <div className="text-[#3A6131] text-[64px] font-black tracking-tight leading-none mb-4">
                99.98%
              </div>
              <p className="text-center text-[#3A6131] text-[13px] font-medium leading-relaxed">
                All systems, including the multi-tenant SaaS inventory engine and database, are fully functional.
              </p>
            </div>
            <div className="flex-1 bg-[#FFFCEB] rounded-[8px] px-6 py-6 flex flex-col justify-between">
              <div className="grid grid-cols-[30px_repeat(31,minmax(0,1fr))] gap-x-[1px] gap-y-[2px] w-full">
                {months.map((month) => (
                  <React.Fragment key={month.abbr}>
                    <div className="text-[#3A6131] text-[11px] font-bold self-center pr-2 text-right">
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
              <div className="w-full flex items-center justify-end gap-6 mt-4 text-[#3A6131] text-[11px] font-bold">
                <div className="flex items-center gap-2"><div className="w-3.5 h-3.5 rounded-[2px] bg-[#22C55E]"></div>100%</div>
                <div className="flex items-center gap-2"><div className="w-3.5 h-3.5 rounded-[2px] bg-[#F59E0B]"></div>Partial Degradation</div>
                <div className="flex items-center gap-2"><div className="w-3.5 h-3.5 rounded-[2px] bg-[#EF4444]"></div>Service Outage</div>
              </div>
            </div>
          </div>
        </div>

        {/* Table Section */}
        <div className="w-full flex flex-col items-center">
          
          {/* Header */}
          <h2 className="text-center text-[#385E31] text-[32px] font-extrabold font-['Inter'] mb-5">
            Recent Activities
          </h2>

          {/* Table Container */}
          <div className="w-full bg-[#FFFCEB] rounded-[10px] border border-[#385E31] flex flex-col overflow-hidden">
            
            {/* Header Row */}
            <div className="w-full flex bg-[#385E31] px-4 py-4">
              <div className="flex-1 text-center text-[#FFFCEB] text-[17px] font-bold font-['Inter']">Business Name</div>
              <div className="flex-1 text-center text-[#FFFCEB] text-[17px] font-bold font-['Inter']">Owner</div>
              <div className="flex-1 text-center text-[#FFFCEB] text-[17px] font-bold font-['Inter']">Status</div>
              <div className="flex-1 text-center text-[#FFFCEB] text-[17px] font-bold font-['Inter']">Health/Resources</div>
            </div>

            {/* Data Rows */}
            <div className="flex flex-col w-full py-2">
              {recentActivities.map((row) => {
                const { bg, text } = getPillStyles(row.status);
                
                return (
                  <div key={row.id} className="w-full flex px-4 py-[13px] items-center">
                    
                    {/* Data Cells */}
                    <div className="flex-1 text-center text-[#3A6131] text-base font-semibold font-['Inter']">Body</div>
                    <div className="flex-1 text-center text-[#3A6131] text-base font-semibold font-['Inter']">Body</div>
                    
                    {/* Status Pill (Using exact Figma specs provided) */}
                    <div className="flex-1 flex justify-center items-center">
                      <div className={`w-20 h-5 px-[5px] py-[3px] rounded-[40px] inline-flex justify-center items-center gap-2.5 ${bg}`}>
                        <div className={`flex-1 text-center ${text} text-[9.70px] font-semibold font-['Inter'] leading-3`}>
                          {row.status}
                        </div>
                      </div>
                    </div>

                    <div className="flex-1 text-center text-[#3A6131] text-base font-semibold font-['Inter']">Body</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Load More Button */}
          <div className="w-full flex justify-end mt-6">
            <button className="bg-[#E5AD24] text-[#385E31] text-[15px] font-bold font-['Inter'] px-8 py-2.5 rounded-[40px] shadow-sm hover:opacity-90 transition-opacity">
              Load More
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}