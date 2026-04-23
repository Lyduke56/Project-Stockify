"use client";

import React from "react";
import { motion } from "framer-motion";
import NavbarApp from "@/components/navbars/navbar-superadmin";
import StatCard from "@/components/cards/stat-cards";
import SidebarSuperAdmin from "@/components/navbars/sidebar-superadmin";

// Data for the Heatmap (MOCK RA NI HA)
type StatusType = 'outage' | 'partial' | 'normal';

const uptimeStatus: Record<string, StatusType> = {
  'Jan-12': 'outage',
  'Jan-24': 'outage',
  'Feb-28': 'partial', // Adjusted from 31 to a valid date
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
    case 'Pending': return { bg: 'bg-[#E5AD24]', text: 'text-[#385E31]' }; 
    case 'Suspended': return { bg: 'bg-[#E91F22]', text: 'text-[#FFFCEB]' }; 
    case 'Overdue': return { bg: 'bg-[#FFD980]', text: 'text-[#385E31]' }; 
    default: return { bg: 'bg-[#385E31]', text: 'text-[#FFFCEB]' };
  }
};

export default function SuperadminDashboard() {
  return (
    <div className="flex h-screen w-full bg-[#FFFCEB] overflow-hidden font-['Inter']">
      
      {/* LEFT SIDE: Fixed Sidebar */}
      <SidebarSuperAdmin />

      {/* RIGHT SIDE: Main Content ehey*/}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="flex-1 flex flex-col h-full overflow-y-auto px-16 pt-4 pb-10"
      >
        
        <NavbarApp />

        {/* Header - Fades in slightly after the main container */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="w-full flex flex-col items-center"
        >
          <div className="w-full flex flex-col items-center mt-10 mb-8 gap-2">
            <h1 className="text-[#385E31] text-[30px] font-extrabold tracking-wide uppercase">
              SUPERADMIN DASHBOARD
            </h1>
            <div className="w-full max-w-[900px] h-1.5 bg-[#F7B71D] rounded-full" />
          </div>
        </motion.div>

        {/* Stat Cards - Staggered Spring Animation */}
        <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-5">
          <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ type: "spring", stiffness: 300, damping: 25, delay: 0.15 }}>
            <StatCard title="Active Tenants" value="1.24k" trendText="↑ 5% this month (January)" className="w-full pb-5 h-full" svgName="SA-active-tenants" />
          </motion.div>
          <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ type: "spring", stiffness: 300, damping: 25, delay: 0.25 }}>
            <StatCard title="Pending Applications" value="39" trendText="39 new applications await review" className="w-full pb-5 h-full" svgName="SA-pending-app" />
          </motion.div>
          <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ type: "spring", stiffness: 300, damping: 25, delay: 0.35 }}>
            <StatCard title="Revenue status" value="124" trendText="Review their payment status and take action" className="w-full pb-5 h-full" svgName="SA-rev-stat" />
          </motion.div>
        </div>

        {/* System Uptime - Pops in after the Stat Cards */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 25, delay: 0.45 }}
          className="w-full p-4 bg-[#385E31] rounded-[10px] flex flex-col gap-3 mb-6"
        >
          <div className="w-full text-[#FFFCEB] text-[18px] font-bold font-['Inter'] tracking-wide">
            System Uptime
          </div>
          <div className="flex w-full gap-4">
            <div className="w-[240px] bg-[#FFFCEB] rounded-[8px] flex flex-col justify-center items-center px-4 py-6 shrink-0">
              <div className="text-[#3A6131] text-[48px] font-black tracking-tight leading-none mb-3">
                99.98%
              </div>
              <p className="text-center text-[#3A6131] text-[11px] font-medium leading-relaxed">
                All systems, including the multi-tenant SaaS inventory engine and database, are fully functional.
              </p>
            </div>
            
            <div className="flex-1 bg-[#FFFCEB] rounded-[8px] px-7 py-4 flex flex-col justify-between">
              {/* Scaled down squares to 10px and gaps to fit in a tighter vertical space */}
              <div className="grid grid-cols-[30px_repeat(31,minmax(0,1fr))] gap-x-[2px] gap-y-[2px] w-full items-center">
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
                          className={`w-full aspect-square max-w-[13px] max-h-[13px] rounded-[2px] mx-auto ${isHidden ? 'invisible' : getHeatmapStatusClass(month.abbr, day)}`}
                          title={isHidden ? undefined : `${month.name} ${day}`}
                        />
                      );
                    })}
                  </React.Fragment>
                ))}
                <div className="col-start-1"></div>
                {[...Array(31)].map((_, i) => (
                  <div key={i} className="text-[#3A6131] text-[8px] font-bold text-center mt-0.5">
                    {i + 1}
                  </div>
                ))}
              </div>
              <div className="w-full flex items-center justify-end gap-5 mt-3 text-[#3A6131] text-[10px] font-bold">
                <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-[2px] bg-[#22C55E]"></div>100%</div>
                <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-[2px] bg-[#F59E0B]"></div>Partial Degradation</div>
                <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-[2px] bg-[#EF4444]"></div>Service Outage</div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Table Section - Slides in last */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 25, delay: 0.55 }}
          className="w-full flex flex-col items-center"
        >
          
          <h2 className="text-[#385E31] text-[24px] font-extrabold font-['Inter'] mb-3">
            Recent Activities
          </h2>

          <div className="w-full bg-[#FFFCEB] rounded-[10px] border border-[#385E31] flex flex-col overflow-visible shadow-sm">
            
            <div className="w-full flex bg-[#385E31] px-4 py-2.5 rounded-t-[8px]">
              <div className="flex-1 text-center text-[#FFFCEB] text-[14px] font-bold">Business Name</div>
              <div className="flex-1 text-center text-[#FFFCEB] text-[14px] font-bold">Owner</div>
              <div className="flex-1 text-center text-[#FFFCEB] text-[14px] font-bold">Status</div>
              <div className="flex-1 text-center text-[#FFFCEB] text-[14px] font-bold">Health/Resources</div>
            </div>

            <div className="flex flex-col w-full">
              {recentActivities.map((row, idx) => {
                const { bg, text } = getPillStyles(row.status);
                const isLast = idx === recentActivities.length - 1;
                
                return (
                  <div key={row.id} className={`w-full flex px-4 py-[12px] items-center ${!isLast ? 'border-b border-[#385E31]/20' : ''}`}>
                    
                    <div className="flex-1 text-center text-[#3A6131] text-[12px] font-bold">Body</div>
                    <div className="flex-1 text-center text-[#3A6131] text-[12px] font-bold">Body</div>
                    
                    <div className="flex-1 flex justify-center items-center">
                      <div className={`w-[75px] py-[3px] rounded-[40px] flex justify-center items-center ${bg}`}>
                        <span className={`${text} text-[10px] font-bold leading-3`}>{row.status}</span>
                      </div>
                    </div>

                    <div className="flex-1 text-center text-[#3A6131] text-[12px] font-bold">Body</div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="w-full flex justify-end mt-4">
            <button className="bg-[#F7B71D] text-[#385E31] text-[14px] font-bold font-['Inter'] px-8 py-2 rounded-[40px] shadow-sm hover:opacity-90 transition-opacity">
              Load More
            </button>
          </div>

        </motion.div>

      </motion.div>
    </div>
  );
}