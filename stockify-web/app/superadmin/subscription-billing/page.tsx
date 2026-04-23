"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation"; 
import { motion } from "framer-motion"; 
import Sidebar from "@/components/navbars/sidebar-superadmin";
import NavbarApp from "@/components/navbars/navbar-superadmin";

// MOCK DATA RA NIIIIIIIIII
const billingData = [
  { id: 1, name: "Cafe Cebu", owner: "Clyde Justine Rosal", date: "02/21/2026", status: "Active", balance: "₱3,000.00" },
  { id: 2, name: "Tech Hub IT", owner: "Christopher John Rubio", date: "02/01/2026", status: "Late", balance: "₱5,000.00" },
  { id: 3, name: "Fully Booked", owner: "Axziel Jay Bartolabac", date: "01/21/2026", status: "Active", balance: "₱8,000.00" },
  { id: 4, name: "National Book Store", owner: "Axziel Jay Bartolabac", date: "02/21/2025", status: "Late", balance: "₱8,000.00" },
  { id: 5, name: "TAMBAY Cafe", owner: "Benideck Longakit", date: "02/21/2026", status: "Active", balance: "₱3,000.00" },
  { id: 6, name: "Uncle Brew", owner: "Nesserain De la Cruz", date: "02/21/2026", status: "Active", balance: "₱3,000.00" },
  { id: 7, name: "Elle's Boutique", owner: "Elle Bernante", date: "02/21/2026", status: "Missed", balance: "₱3,000.00" },
  { id: 8, name: "Manok na Chicken", owner: "Tweetie Zapanta", date: "02/21/2026", status: "Active", balance: "₱3,000.00" },
];

const tabs = ["Overall", "Overdue", "Missed"];

// HELPERS HEH
const getPillStyles = (status: string) => {
  switch (status) {
    case 'Active': return { bg: 'bg-[#385E31]', text: 'text-[#FFFCEB]' };
    case 'Late': return { bg: 'bg-[#FFD980]', text: 'text-[#385E31]' }; 
    case 'Missed': return { bg: 'bg-[#E91F22]', text: 'text-[#FFFCEB]' }; 
    default: return { bg: 'bg-[#385E31]', text: 'text-[#FFFCEB]' };
  }
};

const getTabConfig = (tab: string) => {
  switch (tab) {
    case "Overall": return { bg: "bg-[#385E31]", text: "text-[#FFFCEB]" };
    case "Overdue": return { bg: "bg-[#E53333]", text: "text-[#FFFCEB]" };
    case "Missed": return { bg: "bg-[#CE0000]", text: "text-[#FFFCEB]" };
    default: return { bg: "bg-[#385E31]", text: "text-[#FFFCEB]" };
  }
};

// CUSTOM SVG COMPONENTS 
const SearchIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"></circle>
    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
  </svg>
);

const ChevronDown = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9"></polyline>
  </svg>
);

// STAT CARD COMPONENT (Updated with framer-motion and delay prop)
interface StatCardProps {
  title: string;
  value: string | number;
  trendText: string;
  className?: string;
  svgName: string;
  delay?: number;
}

function StatCard({ title, value, trendText, className = "", svgName, delay = 0 }: StatCardProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 25, delay: delay }}
      className={`bg-[#385E31] rounded-[8px] p-4 flex flex-col shadow-md border-2 border-[#385E31] ${className}`}
    >
      <h3 className="text-[#FFFCEB] text-[18px] font-bold mb-3">{title}</h3>
      <div className="bg-[#FFFCEB] rounded-[6px] flex flex-col items-center justify-center py-5 flex-1 relative">
        <div className="flex items-center justify-center gap-3">
          <img 
            src={`/${svgName}.svg`} 
            alt={`${title} Icon`} 
            className="w-15 h-15 object-contain" 
          />
          <span className="text-[#385E31] text-[3.5rem] font-black leading-none">{value}</span>
        </div>
        <p className="text-[#385E31] text-[11px] mt-2 font-bold">{trendText}</p>
      </div>
    </motion.div>
  );
}

// MAIN COMPONENT 
export default function SubscriptionBilling() {
  const router = useRouter(); 

  const [activeTab, setActiveTab] = useState("Overall");
  const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);

  const toggleDropdown = (id: number) => {
    setOpenDropdownId(prevId => (prevId === id ? null : id));
  };

  const handleAction = (tenantId: number) => {
    console.log(`Action triggered for ${tenantId}`);
    setOpenDropdownId(null);
  };

  // Filter data based on active tab
  const getFilteredData = () => {
    if (activeTab === "Overdue") return billingData.filter(d => d.status === "Late");
    if (activeTab === "Missed") return billingData.filter(d => d.status === "Missed");
    return billingData; // "Overall"
  };

  const currentData = getFilteredData();

  return (
    <div className="flex h-screen w-full bg-[#FFFCEB] overflow-hidden font-['Inter']">
      
      <Sidebar />

      {/* Main Content Wrapper with Slide/Fade-in */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="flex-1 flex flex-col h-full overflow-y-auto px-10 md:px-20 pt-5 pb-12"
      >
        
        <NavbarApp />

        {/* Page Header - Slight delay to trail the main wrapper */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="w-full flex flex-col items-center mt-10 mb-8 gap-2"
        >
          <h1 className="text-[#385E31] text-[30px] font-extrabold tracking-wide uppercase">
            SUBSCRIPTION BILLING
          </h1>
          <div className="w-full max-w-[900px] h-1.5 bg-[#F7B71D] rounded-full flex justify-center">
          </div>
        </motion.div>

        {/* Top Stat Cards Row - Staggered Delays */}
        <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <StatCard 
            title="Total Paid" 
            value="790k" 
            trendText="4 of 12 months" 
            svgName="SA-rev-stat" 
            delay={0.15}
          />
          <StatCard 
            title="Late Payments" 
            value="73" 
            trendText="Avg. 24.8 days late" 
            svgName="SA-late-payments" 
            delay={0.25}
          />
          <StatCard 
            title="Missed Payments" 
            value="49" 
            trendText="As of September 2026" 
            svgName="SA-missed-payments" 
            delay={0.35}
          />
        </div>

        {/* NAVIGATION TABS - Pops in after cards */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 25, delay: 0.45 }}
          className="w-full flex justify-center mb-6"
        >
          <div className="relative flex w-full max-w-[600px] h-[45px] items-center my-2">
            
            {/* Background Outline */}
            <div className="absolute inset-0 border-2 border-[#385E31] rounded-[8px] pointer-events-none" />

            {/* Static Vertical Dividers */}
            <div className="absolute inset-0 flex pointer-events-none">
              <div className="flex-1 border-r-2 border-[#385E31]" />
              <div className="flex-1 border-r-2 border-[#385E31]" />
              <div className="flex-1" />
            </div>

            {/* Sliding Colored Box */}
            <div
              className={`absolute top-[-2px] bottom-[-2px] rounded-[8px] transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] z-10 ${getTabConfig(activeTab).bg}`}
              style={{
                width: 'calc(33.333% + 4px)',
                left: `calc(${tabs.indexOf(activeTab) * 33.333}% - 2px)`,
              }}
            />

            {/* Clickable Text Overlays */}
            {tabs.map((tab) => {
              const isActive = activeTab === tab;
              return (
                <button
                  key={tab}
                  onClick={() => {
                    setActiveTab(tab);
                    setOpenDropdownId(null); 
                  }}
                  className={`flex-1 h-full z-20 text-center font-bold text-[18px] transition-colors duration-300 cursor-pointer ${
                    isActive ? getTabConfig(tab).text : "text-[#385E31]"
                  }`}
                >
                  {tab}
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* Database Section - Slides in last */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 25, delay: 0.55 }}
          className="w-full flex flex-col items-center"
        >
          
          {/* Subheader */}
          <h2 className="text-[#385E31] text-[26px] font-extrabold font-['Inter'] mb-6">
            Payment Tracker
          </h2>

          {/* Search and Filter Row */}
          <div className="w-full flex justify-between items-center mb-4 gap-4">
            <div className="relative flex-1 max-w-[60%]">
              <input 
                type="text" 
                placeholder="Search" 
                className="w-full border border-[#385E31] rounded-full px-5 py-2 bg-transparent text-[#385E31] placeholder-[#385E31] outline-none font-medium" 
              />
              <div className="absolute right-4 top-2.5 text-[#385E31]">
                <SearchIcon />
              </div>
            </div>
            <div className="relative w-[200px]">
              <select className="w-full appearance-none border border-[#385E31] rounded-full px-5 py-2 bg-transparent text-[#385E31] outline-none font-medium cursor-pointer">
                <option>Filter By</option>
              </select>
              <div className="absolute right-4 top-3.5 text-[#385E31] pointer-events-none">
                <ChevronDown />
              </div>
            </div>
          </div>

          {/* Data Table */}
          <div className="w-full bg-[#FFFCEB] rounded-[10px] border border-[#385E31] flex flex-col overflow-visible shadow-sm">
            
            {/* Header Row */}
            <div className="w-full flex bg-[#385E31] px-4 py-3 rounded-t-[8px]">
              <div className="flex-1 text-center text-[#FFFCEB] text-[15px] font-bold">Business Name</div>
              <div className="flex-1 text-center text-[#FFFCEB] text-[15px] font-bold">Owner</div>
              <div className="flex-1 text-center text-[#FFFCEB] text-[15px] font-bold">Reg. Date</div>
              <div className="flex-1 text-center text-[#FFFCEB] text-[15px] font-bold">Subscription</div>
              <div className="flex-1 text-center text-[#FFFCEB] text-[15px] font-bold">Balance</div>
              <div className="flex-1 text-center text-[#FFFCEB] text-[15px] font-bold">Actions</div>
            </div>

            {/* Data Rows */}
            <div className="flex flex-col w-full">
              {currentData.map((row, idx) => {
                const { bg, text } = getPillStyles(row.status);
                const isLast = idx === currentData.length - 1;
                const isDropdownOpen = openDropdownId === row.id;
                
                return (
                  <div key={row.id} className={`w-full flex px-4 py-[14px] items-center ${!isLast ? 'border-b border-[#385E31]/20' : ''}`}>
                    <div className="flex-1 text-center text-[#3A6131] text-[13px] font-bold">
                      {/* --- NEW CLICKABLE BUSINESS NAME LOGIC HERE --- */}
                      <span 
                        onClick={() => router.push(`/superadmin/tenant-profile/${row.id}`)}
                        className="cursor-pointer hover:text-[#E5AD24] hover:underline transition-colors"
                      >
                        {row.name}
                      </span>
                    </div>
                    <div className="flex-1 text-center text-[#3A6131] text-[13px] font-bold">{row.owner}</div>
                    <div className="flex-1 text-center text-[#3A6131] text-[13px] font-bold">{row.date}</div>
                    
                    <div className="flex-1 flex justify-center items-center">
                      <div className={`w-[75px] py-[4px] rounded-[40px] flex justify-center items-center ${bg}`}>
                        <span className={`${text} text-[10px] font-bold leading-3`}>{row.status}</span>
                      </div>
                    </div>

                    <div className="flex-1 text-center text-[#3A6131] text-[13px] font-bold">{row.balance}</div>
                    
                    <div className="flex-1 flex justify-center items-center relative">
                      <button 
                        onClick={() => toggleDropdown(row.id)}
                        className={`border border-[#385E31] rounded-full px-4 py-1 text-[11px] font-bold flex items-center gap-1 transition-colors ${
                          isDropdownOpen ? "bg-[#385E31] text-[#FFFCEB]" : "text-[#385E31] hover:bg-[#385E31]/10"
                        }`}
                      >
                        Action <ChevronDown />
                      </button>

                      {isDropdownOpen && (
                        <div className="absolute top-8 right-[50%] translate-x-1/2 w-[140px] bg-[#FFFCEB] border border-[#385E31] shadow-lg rounded-[4px] z-10 py-1 overflow-hidden text-[#385E31] text-[11px] font-semibold flex flex-col text-left">
                          <button 
                            onClick={() => handleAction(row.id)}
                            className="px-3 py-1.5 hover:bg-[#E5AD24] text-left transition-colors"
                          >
                            View Invoice
                          </button>
                          <button 
                            onClick={() => handleAction(row.id)}
                            className="px-3 py-1.5 hover:bg-[#E5AD24] text-left transition-colors"
                          >
                            Send Reminder
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Load More Button */}
          <div className="w-full flex justify-end mt-6">
            <button className="bg-[#F7B71D] text-[#385E31] text-[15px] font-bold font-['Inter'] px-10 py-2.5 rounded-[40px] shadow-sm hover:opacity-90 transition-opacity">
              Load More
            </button>
          </div>

        </motion.div>
      </motion.div>
    </div>
  );
}