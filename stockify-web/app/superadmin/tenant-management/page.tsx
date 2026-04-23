"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation"; 
import Sidebar from "@/components/navbars/sidebar-superadmin";
import NavbarApp from "@/components/navbars/navbar-superadmin";
import TenantActionModal from "@/components/modals/confimation-modal";
import PendingTenantsTab from "@/components/sections/superadmin/pending-tenants-tab";

// --- MOCK DATA ---
const tenantData = [
  { id: 1, name: "Cafe Cebu", owner: "Clyde Justine Rosal", date: "02/21/2026", status: "Active", balance: "₱3,000.00" },
  { id: 2, name: "Tech Hub IT", owner: "Christopher John Rubio", date: "02/01/2026", status: "Overdue", balance: "₱5,000.00" },
  { id: 3, name: "Fully Booked", owner: "Axziel Jay Bartolabac", date: "01/21/2026", status: "Active", balance: "₱8,000.00" },
  { id: 4, name: "National Book Store", owner: "Axziel Jay Bartolabac", date: "02/21/2025", status: "Overdue", balance: "₱8,000.00" },
  { id: 5, name: "TAMBAY Cafe", owner: "Benideck Longakit", date: "02/21/2026", status: "Active", balance: "₱3,000.00" },
  { id: 6, name: "Uncle Brew", owner: "Nesserain De la Cruz", date: "02/21/2026", status: "Active", balance: "₱3,000.00" },
  { id: 7, name: "Elle's Boutique", owner: "Elle Bernante", date: "02/21/2026", status: "Overdue", balance: "₱3,000.00" },
  { id: 8, name: "Manok na Chicken", owner: "Tweetie Zapanta", date: "02/21/2026", status: "Active", balance: "₱3,000.00" },
];

const suspendedData = [
  { id: 201, name: "Late Payers Co.", owner: "John Doe", date: "01/15/2026" },
  { id: 202, name: "Rule Breakers Inc.", owner: "Jane Smith", date: "12/10/2025" },
  { id: 203, name: "Ghost Town Shop", owner: "Casper Ghost", date: "11/05/2025" },
  { id: 204, name: "Policy Violators", owner: "Arthur Dent", date: "02/28/2026" },
  { id: 205, name: "Spammy Goods", owner: "Clark Kent", date: "03/01/2026" },
  { id: 206, name: "Non-Compliant Ltd.", owner: "Bruce Wayne", date: "03/15/2026" },
  { id: 207, name: "Strike Three Store", owner: "Peter Parker", date: "03/20/2026" },
  { id: 208, name: "Frozen Assets", owner: "Tony Stark", date: "04/01/2026" },
];

const terminatedData = [
  { id: 301, name: "Closed For Good", owner: "Walter White", date: "08/10/2025" },
  { id: 302, name: "Bankrupt Bros", owner: "Saul Goodman", date: "09/15/2025" },
  { id: 303, name: "Banned Books", owner: "Jesse Pinkman", date: "10/20/2025" },
  { id: 304, name: "End of the Line", owner: "Hank Schrader", date: "11/25/2025" },
  { id: 305, name: "No More Business", owner: "Skyler White", date: "12/30/2025" },
  { id: 306, name: "Final Chapter", owner: "Gus Fring", date: "01/05/2026" },
  { id: 307, name: "Done Deal", owner: "Mike Ehrmantraut", date: "02/10/2026" },
  { id: 308, name: "Terminated Tech", owner: "Tuco Salamanca", date: "03/15/2026" },
];

const tabs = ["Active", "Pending", "Suspended", "Terminated"];

// --- HELPERS ---
const getPillStyles = (status: string) => {
  switch (status) {
    case "Active":    return { bg: "bg-[#385E31]", text: "text-[#FFFCEB]" };
    case "Pending":   return { bg: "bg-[#E5AD24]", text: "text-[#385E31]" };
    case "Suspended": return { bg: "bg-[#E91F22]", text: "text-[#FFFCEB]" };
    case "Overdue":   return { bg: "bg-[#FFD980]",  text: "text-[#385E31]" };
    default:          return { bg: "bg-[#385E31]", text: "text-[#FFFCEB]" };
  }
};

const getTabConfig = (tab: string) => {
  switch (tab) {
    case "Active":     return { bg: "bg-[#385E31]", text: "text-[#FFFCEB]" };
    case "Pending":    return { bg: "bg-[#E5AD24]", text: "text-[#385E31]" };
    case "Suspended":  return { bg: "bg-[#E91F22]", text: "text-[#FFFCEB]" };
    case "Terminated": return { bg: "bg-[#E91F22]", text: "text-[#F7B71D]" };
    default:           return { bg: "bg-[#385E31]", text: "text-[#FFFCEB]" };
  }
};

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

// --- STAT CARD COMPONENT ---
interface StatCardProps {
  title: string;
  value: string | number;
  trendText: string;
  className?: string;
  svgName: string;
}

function StatCard({ title, value, trendText, className = "", svgName }: StatCardProps) {
  return (
    <div className={`bg-[#385E31] rounded-[8px] p-4 flex flex-col shadow-md border-2 border-[#385E31] ${className}`}>
      <h3 className="text-[#FFFCEB] text-[18px] font-bold mb-3">{title}</h3>
      <div className="bg-[#FFFCEB] rounded-[6px] flex flex-col items-center justify-center py-3 flex-1 relative">
        <div className="flex items-center justify-center gap-3">
          <img src={`/${svgName}.svg`} alt={`${title} Icon`} className="w-12 h-12 object-contain" />
          <span className="text-[#385E31] text-[3.5rem] font-black leading-none">{value}</span>
        </div>
        <p className="text-[#385E31] text-[11px] mt-1 font-medium">{trendText}</p>
      </div>
    </div>
  );
}

// --- MAIN COMPONENT ---
export default function TenantManagement() {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState("Active");
  const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);
  const [selectedTenant, setSelectedTenant] = useState<any>(null);
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [showTerminateModal, setShowTerminateModal] = useState(false);

  const toggleDropdown = (id: number) => {
    setOpenDropdownId((prevId) => (prevId === id ? null : id));
  };

  const handleViewTenant = (tenantId: number) => {
    router.push(`/superadmin/tenant-review/${tenantId}`);
  };

  const handleSuspendClick = (tenant: any) => {
    setSelectedTenant(tenant);
    setOpenDropdownId(null);
    setShowSuspendModal(true);
  };

  const handleTerminateClick = (tenant: any) => {
    setSelectedTenant(tenant);
    setOpenDropdownId(null);
    setShowTerminateModal(true);
  };

  const handleConfirmSuspend = () => {
    console.log(`Suspending tenant: ${selectedTenant?.name}`);
    // TODO: add API call
    setShowSuspendModal(false);
    setSelectedTenant(null);
  };

  const handleConfirmTerminate = () => {
    console.log(`Terminating tenant: ${selectedTenant?.name}`);
    // TODO: add API call
    setShowTerminateModal(false);
    setSelectedTenant(null);
  };

  const handleCloseModal = () => {
    setShowSuspendModal(false);
    setShowTerminateModal(false);
    setSelectedTenant(null);
  };

  return (
    <div className="flex h-screen w-full bg-[#FFFCEB] overflow-hidden font-['Inter']">

      {/* LEFT SIDE: Fixed Sidebar */}
      <Sidebar />

      {/* RIGHT SIDE: Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-y-auto px-10 md:px-20 pt-5 pb-12">

        <NavbarApp />

        {/* Page Header */}
        <div className="w-full flex flex-col items-center mt-10 mb-8 gap-2">
          <h1 className="text-[#385E31] text-[30px] font-extrabold tracking-wide uppercase">
            TENANT MANAGEMENT
          </h1>
          <div className="w-full max-w-[900px] h-1.5 bg-[#F7B71D] rounded-full" />
        </div>

        {/* Top Stat Cards Row */}
        <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <StatCard title="Active Tenants"        value="43" trendText="↑ 3% this month (January)"           svgName="SA-active-tenants"    />
          <StatCard title="Pending Applications"  value="39" trendText="39 new applications await review"    svgName="SA-pending-app"       />
          <StatCard title="Suspended Tenants"     value="12" trendText="12 tenants temporarily suspended"    svgName="SA-suspended-tenants" />
          <StatCard title="Terminated Tenants"    value="9"  trendText="9 tenants were terminated"           svgName="SA-terminated-tenants"/>
        </div>

        {/* --- ANIMATED NAVIGATION TABS --- */}
        <div className="w-full flex justify-center mb-8">
          <div className="relative flex w-full max-w-[800px] h-[45px] items-center my-2">

            {/* Background Outline */}
            <div className="absolute inset-0 border-2 border-[#385E31] rounded-[8px] pointer-events-none" />

            {/* Static Vertical Dividers */}
            <div className="absolute inset-0 flex pointer-events-none">
              <div className="flex-1 border-r-2 border-[#385E31]" />
              <div className="flex-1 border-r-2 border-[#385E31]" />
              <div className="flex-1 border-r-2 border-[#385E31]" />
              <div className="flex-1" />
            </div>

            {/* Sliding Colored Box */}
            <div
              className={`absolute top-[-2px] bottom-[-2px] rounded-[8px] transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] z-10 ${getTabConfig(activeTab).bg}`}
              style={{
                width: "calc(25% + 4px)",
                left: `calc(${tabs.indexOf(activeTab) * 25}% - 2px)`,
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
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* Database Section                                                    */}
        {/* ------------------------------------------------------------------ */}
        <div className="w-full flex flex-col items-center">

          {/* Dynamic Title */}
          <h2 className="text-[#385E31] text-[26px] font-extrabold font-['Inter'] mb-4">
            {activeTab === "Pending"
              ? "Pending Applications Database"
              : `${activeTab} Tenants Database`}
          </h2>

          {/* ── PENDING: renders its own self-contained table ── */}
          {activeTab === "Pending" && <PendingTenantsTab />}

          {/* ── ALL OTHER TABS: shared search + table wrapper ── */}
          {activeTab !== "Pending" && (
            <>
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

                {/* --- DYNAMIC HEADER ROW --- */}
                <div className="w-full flex bg-[#385E31] px-4 py-3 rounded-t-[8px]">
                  <div className="flex-1 text-center text-[#FFFCEB] text-[15px] font-bold">Business Name</div>
                  <div className="flex-1 text-center text-[#FFFCEB] text-[15px] font-bold">Owner</div>
                  <div className="flex-1 text-center text-[#FFFCEB] text-[15px] font-bold">Reg. Date</div>

                  {activeTab === "Active" && (
                    <>
                      <div className="flex-1 text-center text-[#FFFCEB] text-[15px] font-bold">Subscription</div>
                      <div className="flex-1 text-center text-[#FFFCEB] text-[15px] font-bold">Balance</div>
                      <div className="flex-1 text-center text-[#FFFCEB] text-[15px] font-bold">Actions</div>
                    </>
                  )}

                  {activeTab === "Suspended" && (
                    <div className="flex-1 text-center text-[#FFFCEB] text-[15px] font-bold">Actions</div>
                  )}

                  {/* Terminated: no extra columns */}
                </div>

                {/* --- DYNAMIC DATA ROWS --- */}
                <div className="flex flex-col w-full">

                  {/* ACTIVE TAB ROWS */}
                  {activeTab === "Active" &&
                    tenantData.map((row, idx) => {
                      const { bg, text } = getPillStyles(row.status);
                      const isLast = idx === tenantData.length - 1;
                      const isDropdownOpen = openDropdownId === row.id;

                      return (
                        <div
                          key={row.id}
                          className={`w-full flex px-4 py-[14px] items-center ${!isLast ? "border-b border-[#385E31]/20" : ""}`}
                        >
                          <div className="flex-1 text-center text-[#3A6131] text-[13px] font-bold">
                            <span
                              onClick={() => handleViewTenant(row.id)}
                              className="cursor-pointer hover:text-[#E5AD24] hover:underline transition-colors"
                            >
                              {row.name}
                            </span>
                          </div>
                          <div className="flex-1 text-center text-[#3A6131] text-[13px] font-bold">{row.owner}</div>
                          <div className="flex-1 text-center text-[#3A6131] text-[13px] font-bold">{row.date}</div>

                          <div className="flex-1 flex justify-center items-center">
                            <div className={`w-[75px] py-[3px] rounded-[40px] flex justify-center items-center ${bg}`}>
                              <span className={`${text} text-[10px] font-bold leading-3`}>{row.status}</span>
                            </div>
                          </div>

                          <div className="flex-1 text-center text-[#3A6131] text-[13px] font-bold">{row.balance}</div>

                          <div className="flex-1 flex justify-center items-center relative">
                            <button
                              onClick={() => toggleDropdown(row.id)}
                              className={`border border-[#385E31] rounded-full px-3 py-1 text-[11px] font-bold flex items-center gap-1 transition-colors ${
                                isDropdownOpen
                                  ? "bg-[#385E31] text-[#FFFCEB]"
                                  : "text-[#385E31] hover:bg-[#385E31]/10"
                              }`}
                            >
                              Action <ChevronDown />
                            </button>

                            {isDropdownOpen && (
                              <div className="absolute top-8 right-[50%] translate-x-1/2 w-[140px] bg-[#FFFCEB] border border-[#385E31] shadow-lg rounded-[4px] z-10 py-1 overflow-hidden text-[#385E31] text-[11px] font-semibold flex flex-col text-left">
                                <button
                                  onClick={() => handleViewTenant(row.id)}
                                  className="px-3 py-1.5 hover:bg-[#E5AD24] text-left transition-colors"
                                >
                                  View Tenant
                                </button>
                                <button className="px-3 py-1.5 hover:bg-[#E5AD24] text-left transition-colors">
                                  Send Notification
                                </button>
                                <button
                                  onClick={() => handleSuspendClick(row)}
                                  className="px-3 py-1.5 hover:bg-[#E5AD24] text-left transition-colors"
                                >
                                  Suspend Tenant
                                </button>
                                <button
                                  onClick={() => handleTerminateClick(row)}
                                  className="px-3 py-1.5 hover:bg-[#E5AD24] text-left transition-colors"
                                >
                                  Terminate Tenant
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}

                  {/* SUSPENDED TAB ROWS */}
                  {activeTab === "Suspended" &&
                    suspendedData.map((row, idx) => {
                      const isLast = idx === suspendedData.length - 1;
                      const isDropdownOpen = openDropdownId === row.id;

                      return (
                        <div
                          key={row.id}
                          className={`w-full flex px-4 py-[14px] items-center ${!isLast ? "border-b border-[#385E31]/20" : ""}`}
                        >
                          <div className="flex-1 text-center text-[#3A6131] text-[13px] font-bold">
                            <span
                              onClick={() => handleViewTenant(row.id)}
                              className="cursor-pointer hover:text-[#E5AD24] hover:underline transition-colors"
                            >
                              {row.name}
                            </span>
                          </div>
                          <div className="flex-1 text-center text-[#3A6131] text-[13px] font-bold">{row.owner}</div>
                          <div className="flex-1 text-center text-[#3A6131] text-[13px] font-bold">{row.date}</div>

                          <div className="flex-1 flex justify-center items-center relative">
                            <button
                              onClick={() => toggleDropdown(row.id)}
                              className={`border border-[#385E31] rounded-full px-4 py-1 text-[11px] font-bold flex items-center gap-1 transition-colors ${
                                isDropdownOpen
                                  ? "bg-[#385E31] text-[#FFFCEB]"
                                  : "text-[#385E31] hover:bg-[#385E31]/10"
                              }`}
                            >
                              Action <ChevronDown />
                            </button>

                            {isDropdownOpen && (
                              <div className="absolute top-8 right-[50%] translate-x-1/2 w-[140px] bg-[#FFFCEB] border border-[#385E31] shadow-lg rounded-[4px] z-10 py-1 overflow-hidden text-[#385E31] text-[11px] font-semibold flex flex-col text-left">
                                <button
                                  onClick={() => handleViewTenant(row.id)}
                                  className="px-3 py-1.5 hover:bg-[#E5AD24] text-left transition-colors"
                                >
                                  View Tenant
                                </button>
                                <button className="px-3 py-1.5 hover:bg-[#E5AD24] text-left transition-colors">
                                  Send Notification
                                </button>
                                <button className="px-3 py-1.5 hover:bg-[#E5AD24] text-left transition-colors">
                                  Restore Tenant
                                </button>
                                <button className="px-3 py-1.5 hover:bg-[#E5AD24] text-left transition-colors">
                                  Terminate Tenant
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}

                  {/* TERMINATED TAB ROWS */}
                  {activeTab === "Terminated" &&
                    terminatedData.map((row, idx) => {
                      const isLast = idx === terminatedData.length - 1;

                      return (
                        <div
                          key={row.id}
                          className={`w-full flex px-4 py-[14px] items-center ${!isLast ? "border-b border-[#385E31]/20" : ""}`}
                        >
                          <div className="flex-1 text-center text-[#3A6131] text-[13px] font-bold">
                            <span
                              onClick={() => handleViewTenant(row.id)}
                              className="cursor-pointer hover:text-[#E5AD24] hover:underline transition-colors"
                            >
                              {row.name}
                            </span>
                          </div>
                          <div className="flex-1 text-center text-[#3A6131] text-[13px] font-bold">{row.owner}</div>
                          <div className="flex-1 text-center text-[#3A6131] text-[13px] font-bold">{row.date}</div>
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
            </>
          )}

        </div>
      </div>

      {/* MODALS */}
      <TenantActionModal
        isOpen={showSuspendModal}
        onClose={handleCloseModal}
        onConfirm={handleConfirmSuspend}
        tenantName={selectedTenant?.name || ""}
        actionType="suspend"
      />

      <TenantActionModal
        isOpen={showTerminateModal}
        onClose={handleCloseModal}
        onConfirm={handleConfirmTerminate}
        tenantName={selectedTenant?.name || ""}
        actionType="terminate"
      />
    </div>
  );
}
