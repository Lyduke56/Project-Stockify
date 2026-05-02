"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import NavbarApp from "@/components/navbars/navbar-superadmin";
import SidebarSuperAdmin from "@/components/navbars/sidebar-superadmin";

// Modals — swap for your actual superadmin modal components
import NotificationModal from "@/components/modals/notification-modal";
import ClientProfileModal from "@/components/modals/client-profile-modal";

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

// --- MOCK DATA FOR AUDIT LOGS ---
const auditLogsData = [
  {
    id: 1,
    date: "04/27/2026 10:15 AM",
    performedBy: "Superadmin (Axziel)",
    businessName: "Cafe Cebu",
    eventType: "PaymentRecorded",
    description: "Logged manual GCash payment for April 2026 billing cycle. Status set to Paid.",
  },
  {
    id: 2,
    date: "04/26/2026 09:00 AM",
    performedBy: "Automated System",
    businessName: "Tech Hub IT",
    eventType: "NotificationSent",
    description: "Automated 3-day payment reminder dispatched to owner's email.",
  },
  {
    id: 3,
    date: "04/25/2026 04:30 PM",
    performedBy: "Superadmin (Benideck)",
    businessName: "Ness LALAt",
    eventType: "TenantSuspended",
    description: "Automatic suspension triggered. Reason: 7 days past due on billing grace period.",
  },
  {
    id: 4,
    date: "04/25/2026 11:20 AM",
    performedBy: "Superadmin (Axziel)",
    businessName: "Apex Dynamics",
    eventType: "TenantSuspended",
    description: "Automatic Suspension triggered. Reason: 3 days past due on billing grace period.",
  },
  {
    id: 5,
    date: "04/24/2026 02:15 PM",
    performedBy: "Automated System",
    businessName: "Horizon Media",
    eventType: "NotificationSent",
    description: "Automated 3-day payment reminder dispatched to owner's email.",
  },
  {
    id: 6,
    date: "04/24/2026 09:45 AM",
    performedBy: "Superadmin (Benideck)",
    businessName: "Pioneer Foods",
    eventType: "TenantCreated",
    description: "Approved application and provisioned new tenant environment.",
  },
  {
    id: 7,
    date: "04/23/2026 03:10 PM",
    performedBy: "Superadmin (Axziel)",
    businessName: "Summit Finance",
    eventType: "NotificationSent",
    description: "Automated 3-day payment reminder dispatched to owner's email.",
  },
  {
    id: 8,
    date: "04/22/2026 10:05 AM",
    performedBy: "Automated System",
    businessName: "Vanguard Tech",
    eventType: "TenantCreated",
    description: "Approved application and provisioned new tenant environment.",
  },
  {
    id: 9,
    date: "04/21/2026 04:50 PM",
    performedBy: "Superadmin (Benideck)",
    businessName: "Quantum Retail",
    eventType: "TenantRestored",
    description: "Lifted suspension after verifying delayed wire transfer payment.",
  },
  {
    id: 10,
    date: "04/20/2026 01:30 PM",
    performedBy: "Automated System",
    businessName: "Nexus Health",
    eventType: "TenantTerminated",
    description: "Automatic Termination triggered. Reason: 30 days past due on billing grace period."
  },
  {
    id: 11,
    date: "04/19/2026 11:15 AM",
    performedBy: "Superadmin (Axziel)",
    businessName: "Global Logistics",
    eventType: "TenantRestored",
    description: "Lifted suspension after verifying delayed wire transfer payment.",
  },
  {
    id: 12,
    date: "04/18/2026 08:45 AM",
    performedBy: "Superadmin (Benideck)",
    businessName: "City Bakery",
    eventType: "TenantRestored",
    description: "Lifted suspension after verifying delayed wire transfer payment.",
  },
  {
    id: 13,
    date: "04/17/2026 05:20 PM",
    performedBy: "Automated System",
    businessName: "Urban Decor",
    eventType: "PaymentRecorded",
    description: "Logged manual GCash payment for April 2026 billing cycle. Status set to Paid.",
  },
  {
    id: 14,
    date: "04/16/2026 02:00 PM",
    performedBy: "Superadmin (Axziel)",
    businessName: "Metro Clinics",
    eventType: "PaymentRecorded",
    description: "Logged manual GCash payment for April 2026 billing cycle. Status set to Paid.",
  },
  {
    id: 15,
    date: "04/15/2026 10:30 AM",
    performedBy: "Superadmin (Benideck)",
    businessName: "Alpha Studios",
    eventType: "PaymentRecorded",
    description: "Logged manual GCash payment for April 2026 billing cycle. Status set to Paid.",
  },
];

// --- MAIN COMPONENT ---
export default function AuditLogs() {
  const [isNotifsOpen,  setIsNotifsOpen]  = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  return (
    <div className="flex h-screen w-full bg-[#FFFCEB] overflow-hidden font-['Inter']">
      
      {/* LEFT SIDE: Fixed Sidebar */}
      <SidebarSuperAdmin />

      {/* RIGHT SIDE: Main Content Wrapper with Slide/Fade-in */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="flex-1 flex flex-col h-full overflow-y-auto px-10 md:px-20 pt-5 pb-12"
      >
        
        <NavbarApp
          onHome={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          openNotifs={() => setIsNotifsOpen(true)}
          openProfile={() => setIsProfileOpen(true)}
        />

        {/* Page Header */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="w-full flex flex-col items-center mt-10 mb-10 gap-2"
        >
          <h1 className="text-[#385E31] text-[30px] font-extrabold tracking-wide uppercase">
            AUDIT LOGS
          </h1>
          <div className="w-full max-w-[900px] h-1.5 bg-[#F7B71D] rounded-full" />
        </motion.div>

        {/* --- FILTERS & TABLE SECTION --- */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 25, delay: 0.2 }}
          className="w-full flex flex-col items-center"
        >
          
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
          <div className="w-full bg-[#FFFCEB] rounded-[10px] border border-[#385E31] flex flex-col overflow-visible shadow-sm">
            
            {/* Header Row */}
            <div className="w-full flex bg-[#385E31] px-6 py-3 rounded-t-[8px] gap-4">
              <div className="w-[150px] shrink-0 text-left text-[#FFFCEB] text-[13px] font-bold">Date & Time</div>
              <div className="w-[160px] shrink-0 text-left text-[#FFFCEB] text-[13px] font-bold">Performed By</div>
              <div className="w-[140px] shrink-0 text-left text-[#FFFCEB] text-[13px] font-bold">Business Name</div>
              <div className="w-[180px] shrink-0 text-left text-[#FFFCEB] text-[13px] font-bold">Event Type</div>
              <div className="flex-1 text-left text-[#FFFCEB] text-[13px] font-bold">Description/Notes</div>
            </div>

            {/* Data Rows */}
            <div className="flex flex-col w-full py-2">
              {auditLogsData.map((row, idx) => {
                const isLast = idx === auditLogsData.length - 1;
                return (
                  <div key={row.id} className={`w-full flex px-6 py-4 items-start gap-4 hover:bg-[#385E31]/5 transition-colors ${!isLast ? "border-b border-[#385E31]/20" : ""}`}>
                    <div className="w-[150px] shrink-0 text-[#3A6131] text-[13px] font-medium pt-0.5">{row.date}</div>
                    <div className="w-[160px] shrink-0 text-[#3A6131] text-[13px] font-medium pt-0.5">{row.performedBy}</div>
                    <div className="w-[140px] shrink-0 text-[#3A6131] text-[13px] font-bold pt-0.5">{row.businessName}</div>
                    <div className="w-[180px] shrink-0 flex items-start">
                      <span className="bg-[#E2E8F0] text-[#475569] font-mono text-[11px] px-2.5 py-1 rounded-md">
                        {row.eventType}
                      </span>
                    </div>
                    <div className="flex-1 text-[#3A6131] text-[13px] leading-relaxed pt-0.5">{row.description}</div>
                  </div>
                );
              })}
            </div>

          </div>

          {/* Load More Button */}
          <div className="w-full flex justify-end mt-6">
            <button className="bg-[#F7B71D] text-[#385E31] text-[14px] font-bold font-['Inter'] px-10 py-2.5 rounded-[40px] shadow-sm hover:opacity-90 transition-opacity">
              Load More
            </button>
          </div>

          {/* ── Modals ── */}
          <NotificationModal  isOpen={isNotifsOpen}  onClose={() => setIsNotifsOpen(false)}  />
          <ClientProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />

        </motion.div>
      </motion.div>
    </div>
  );
}