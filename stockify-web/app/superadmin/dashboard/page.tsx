"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
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

// ── Singleton Supabase client ─────────────────────────────────────────────────
let supabaseInstance: SupabaseClient | null = null;
const getSupabase = () => {
  if (!supabaseInstance) {
    supabaseInstance = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  return supabaseInstance;
};
const supabase = getSupabase();



// ─── Audit Log Type ───────────────────────────────────────────────────────────
interface AuditLog {
  id:            string;
  created_at:    string;
  performed_by:  string;
  business_name: string | null;
  event_type:    string;
  description:   string;
}

// ─── Event type badge styling ─────────────────────────────────────────────────
function getEventBadgeStyle(eventType: string): { bg: string; text: string } {
  switch (eventType) {
    case "TenantCreated":
      return { bg: "#DCFCE7", text: "#166534" };
    case "TenantSuspended":
      return { bg: "#FEF3C7", text: "#92400E" };
    case "TenantRestored":
      return { bg: "#DBEAFE", text: "#1E40AF" };
    case "TenantTerminated":
      return { bg: "#FEE2E2", text: "#991B1B" };
    case "PaymentRecorded":
      return { bg: "#D1FAE5", text: "#065F46" };
    case "InvoiceGenerated":
      return { bg: "#EDE9FE", text: "#4C1D95" };
    case "TrialConverted":
      return { bg: "#E0F2FE", text: "#0C4A6E" };
    case "NotificationSent":
    case "TrialReminderSent":
    case "OverdueNoticeSent":
    case "SuspensionNoticeSent":
      return { bg: "#F3F4F6", text: "#374151" };
    case "GracePeriodStarted":
      return { bg: "#FFF7ED", text: "#9A3412" };
    default:
      return { bg: "#E2E8F0", text: "#475569" };
  }
}

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

  const [stats, setStats] = useState({
    active:  0,
    pending: 0,
    suspended: 0,
  });

  const [mrrData, setMrrData] = useState<{ month: string; revenue: number }[]>([]);
  const [currentMrr, setCurrentMrr] = useState(0);

  const [auditLogs,    setAuditLogs]    = useState<AuditLog[]>([]);
  const [logsLoading,  setLogsLoading]  = useState(true);

  // ── Fetch audit logs ────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchAuditLogs = async () => {
      try {
        const res = await fetch("/api/superadmin/audit-logs?pageSize=10");
        const json = await res.json();
        if (json.error) throw new Error(json.error);
        setAuditLogs(json.data ?? []);
      } catch (error) {
        console.error("Error fetching audit logs:", error);
      } finally {
        setLogsLoading(false);
      }
    };

    fetchAuditLogs();
    const interval = setInterval(fetchAuditLogs, 10000);
    return () => clearInterval(interval);
  }, []);

  // ── Fetch stat counts & MRR ────────────────────────────────────────────────
  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        const res = await fetch("/api/superadmin/dashboard/stats");
        const data = await res.json();

        if (data.error) throw new Error(data.error);

        setStats(data.stats || { active: 0, pending: 0, suspended: 0 });
        
        if (data.mrrChartData && data.mrrChartData.length > 0) {
          setMrrData(data.mrrChartData);
          setCurrentMrr(data.mrrChartData[data.mrrChartData.length - 1].revenue);
        } else {
          setMrrData([{ month: "—", revenue: 0 }]);
        }
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
      }
    };

    fetchDashboardStats();
    const interval = setInterval(fetchDashboardStats, 10000);
    return () => clearInterval(interval);
  }, []);

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
            <StatCard
              title="Active Tenants"
              value={stats.active}
              trendText="Verified and operational"
              className="w-full pb-5 h-full"
              svgName="SA-active-tenants"
            />
          </motion.div>
          <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ type: "spring", stiffness: 300, damping: 25, delay: 0.25 }}>
            <StatCard
              title="Pending Applications"
              value={stats.pending}
              trendText={`${stats.pending} new applications await review`}
              className="w-full pb-5 h-full"
              svgName="SA-pending-app"
            />
          </motion.div>
          <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ type: "spring", stiffness: 300, damping: 25, delay: 0.35 }}>
            <StatCard 
              title="Suspended Tenants" 
              value={stats.suspended} 
              trendText="Total suspended tenants" 
              className="w-full pb-5 h-full" 
              svgName="SA-late-payments" 
            />
          </motion.div>
        </div>

       {/* ── MRR Chart ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 25, delay: 0.40 }}
          className="w-full flex flex-col mb-8 mt-2 bg-[#385E31] rounded-[16px] p-5 shadow-sm"
        >
          <h2 className="text-[#FFFCEB] text-[20px] font-extrabold mb-4 text-left px-2">
            Monthly Recurring Revenue (MRR)
          </h2>
          <div className="w-full h-[350px] bg-[#FFFCEB] rounded-[10px] p-6">
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
          <h2 className="text-[#385E31] text-[24px] font-extrabold mb-5 mt-2">
            Recent Activity Log
          </h2>

          <div className="w-full bg-[#FFFCEB] rounded-[10px] border border-[#385E31] flex flex-col overflow-visible shadow-sm mb-10">
            {/* Header Row */}
            <div className="w-full flex bg-[#385E31] px-6 py-3 rounded-t-[8px] gap-4">
              <div className="w-[150px] shrink-0 text-left text-[#FFFCEB] text-[12px] font-bold tracking-wide">Date & Time</div>
              <div className="w-[160px] shrink-0 text-left text-[#FFFCEB] text-[12px] font-bold tracking-wide">Performed By</div>
              <div className="w-[130px] shrink-0 text-left text-[#FFFCEB] text-[12px] font-bold tracking-wide">Business Name</div>
              <div className="w-[175px] shrink-0 text-left text-[#FFFCEB] text-[12px] font-bold tracking-wide">Event Type</div>
              <div className="flex-1 text-left text-[#FFFCEB] text-[12px] font-bold tracking-wide">Description / Notes</div>
            </div>

            {/* Data Rows */}
            <div className="flex flex-col w-full min-h-[120px] py-1">
              {logsLoading ? (
                <div className="w-full flex items-center justify-center py-10 text-[#385E31] text-[14px] font-medium">
                  Loading activity logs…
                </div>
              ) : auditLogs.length === 0 ? (
                <div className="w-full flex flex-col items-center justify-center py-10 gap-3">
                  <p className="text-[#385E31]/40 text-[13px] font-semibold">No activity logs found</p>
                </div>
              ) : (
                auditLogs.map((row, idx) => {
                  const isLast = idx === auditLogs.length - 1;
                  const formattedDate = new Date(row.created_at).toLocaleString("en-US", {
                    month:  "2-digit",
                    day:    "2-digit",
                    year:   "numeric",
                    hour:   "2-digit",
                    minute: "2-digit",
                    hour12: true,
                  });
                  const badge = getEventBadgeStyle(row.event_type);

                  return (
                    <motion.div
                      key={row.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: Math.min(idx * 0.025, 0.3) }}
                      className={`w-full flex px-6 py-4 items-start gap-4 hover:bg-[#385E31]/[0.04] transition-colors ${!isLast ? "border-b border-[#385E31]/15" : ""}`}
                    >
                      <div className="w-[150px] shrink-0 text-[#3A6131] text-[12px] font-medium pt-0.5 leading-relaxed">
                        {formattedDate}
                      </div>
                      <div className="w-[160px] shrink-0 text-[#3A6131] text-[12px] font-medium pt-0.5 leading-relaxed">
                        {row.performed_by}
                      </div>
                      <div className="w-[130px] shrink-0 text-[#3A6131] text-[12px] font-bold pt-0.5 truncate">
                        {row.business_name ?? (
                          <span className="text-[#385E31]/30 font-normal italic">—</span>
                        )}
                      </div>
                      <div className="w-[175px] shrink-0 flex items-start pt-0.5">
                        <span
                          className="font-mono text-[11px] px-2.5 py-1 rounded-md font-semibold whitespace-nowrap"
                          style={{ backgroundColor: badge.bg, color: badge.text }}
                        >
                          {row.event_type}
                        </span>
                      </div>
                      <div className="flex-1 text-[#3A6131] text-[12px] leading-relaxed pt-0.5">
                        {row.description}
                      </div>
                    </motion.div>
                  );
                })
              )}
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