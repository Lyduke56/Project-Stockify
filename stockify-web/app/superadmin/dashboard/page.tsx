"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import NavbarApp from "@/components/navbars/navbar-superadmin";
import StatCard from "@/components/cards/stat-cards";
import SidebarSuperAdmin from "@/components/navbars/sidebar-superadmin";

// Modals — swap for your actual superadmin modal components
import NotificationModal from "@/components/modals/notification-modal";
import ClientProfileModal from "@/components/modals/client-profile-modal";

// ─── MRR Chart Data ──────────────────────────────────────────────────────────
const mrrData = [
  { month: "Jan", revenue: 45000 },
  { month: "Feb", revenue: 52000 },
  { month: "Mar", revenue: 48000 },
  { month: "Apr", revenue: 61000 },
  { month: "May", revenue: 68000 },
  { month: "Jun", revenue: 75000 },
];

// ─── Activity Log data (15 Items) ────────────────────────────────────────────
const activityLogData = [
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
    description: "Automatic Suspension triggered. Reason: 3 days past due on billing grace period. ",
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
    description: "Automatic Termination triggered. Reason: 3 days past due on billing grace period. "
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

// Custom Tooltip for the chart
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#FFFCEB] border border-[#385E31] p-3 rounded-[8px] shadow-md">
        <p className="text-[#385E31] font-bold mb-1">{label}</p>
        <p className="text-[#3A6131] text-[14px]">
          MRR: <span className="font-extrabold">₱{payload[0].value.toLocaleString()}</span>
        </p>
      </div>
    );
  }
  return null;
};

// ─── Page ────────────────────────────────────────────────────────────────────
export default function SuperadminDashboard() {
  const [isNotifsOpen,  setIsNotifsOpen]  = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  return (
    <div className="flex h-screen w-full bg-[#FFFCEB] overflow-hidden font-['Inter']">

      {/* Sidebar */}
      <SidebarSuperAdmin />

      {/* Main content */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="flex-1 flex flex-col h-full overflow-y-auto px-16 pt-4 pb-10"
      >
        {/* ── Navbar ── */}
        <NavbarApp
          onHome={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          openNotifs={() => setIsNotifsOpen(true)}
          openProfile={() => setIsProfileOpen(true)}
        />

        {/* ── Header ── */}
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

        {/* ── Stat Cards ── */}
        <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-5">
          <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ type: "spring", stiffness: 300, damping: 25, delay: 0.15 }}>
            <StatCard title="Active Tenants" value="1.24k" trendText="↑ 5% this month (January)" className="w-full pb-5 h-full" svgName="SA-active-tenants" />
          </motion.div>
          <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ type: "spring", stiffness: 300, damping: 25, delay: 0.25 }}>
            <StatCard title="Pending Applications" value="39" trendText="39 new applications await review" className="w-full pb-5 h-full" svgName="SA-pending-app" />
          </motion.div>
          <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ type: "spring", stiffness: 300, damping: 25, delay: 0.35 }}>
            <StatCard title="Pending Invoices" value="124" trendText="Review their payment status and take action" className="w-full pb-5 h-full" svgName="SA-late-payments" />
          </motion.div>
        </div>

        {/* ── MRR Chart ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 25, delay: 0.40 }}
          className="w-full flex flex-col mb-8 mt-2"
        >
          <h2 className="text-[#385E31] text-[24px] font-extrabold mb-3 text-center">
            Monthly Recurring Revenue (MRR)
          </h2>
          <div className="w-full h-[350px] bg-[#FFFCEB] rounded-[10px] border border-[#385E31] p-6 shadow-sm">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mrrData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#385E31" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#385E31" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#385E31" strokeOpacity={0.2} />
                <XAxis 
                  dataKey="month" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#385E31', fontWeight: 600, fontSize: 12 }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#385E31', fontWeight: 600, fontSize: 12 }}
                  tickFormatter={(value) => `₱${value / 1000}k`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#385E31" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorRevenue)" 
                  activeDot={{ r: 6, fill: "#F7B71D", stroke: "#385E31", strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* ── Activity Log ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 25, delay: 0.45 }}
          className="w-full flex flex-col items-center"
        >
          <h2 className="text-[#385E31] text-[24px] font-extrabold mb-3 mt-2">
            Recent Activity Log
          </h2>

          <div className="w-full bg-[#FFFCEB] rounded-[10px] border border-[#385E31] flex flex-col overflow-visible shadow-sm mb-10">
            {/* Header Row */}
            <div className="w-full flex bg-[#385E31] px-6 py-3 rounded-t-[8px] gap-4">
              <div className="w-[150px] shrink-0 text-left text-[#FFFCEB] text-[13px] font-bold">Date & Time</div>
              <div className="w-[160px] shrink-0 text-left text-[#FFFCEB] text-[13px] font-bold">Performed By</div>
              <div className="w-[140px] shrink-0 text-left text-[#FFFCEB] text-[13px] font-bold">Business Name</div>
              <div className="w-[180px] shrink-0 text-left text-[#FFFCEB] text-[13px] font-bold">Event Type</div>
              <div className="flex-1 text-left text-[#FFFCEB] text-[13px] font-bold">Description/Notes</div>
            </div>

            {/* Data Rows */}
            <div className="flex flex-col w-full">
              {activityLogData.map((row, idx) => {
                const isLast = idx === activityLogData.length - 1;
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
        </motion.div>

      </motion.div>

      {/* ── Modals ── */}
      <NotificationModal  isOpen={isNotifsOpen}  onClose={() => setIsNotifsOpen(false)}  />
      <ClientProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
    </div>
  );
}