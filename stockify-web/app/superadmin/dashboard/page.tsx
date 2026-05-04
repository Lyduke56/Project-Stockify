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

// Modals
import NotificationModal from "@/components/modals/notification-modal";
import ClientProfileModal from "@/components/modals/client-profile-modal";

// 1. ADD 'export' to fix the import error in navbar-superadmin.tsx
export type SectionKey = "dashboard" | "inventory" | "reports" | "users" | "profile";

// Singleton Supabase client
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

// MRR Chart Data
const mrrData = [
  { month: "Jan", revenue: 45000 },
  { month: "Feb", revenue: 52000 },
  { month: "Mar", revenue: 48000 },
  { month: "Apr", revenue: 61000 },
  { month: "May", revenue: 68000 },
  { month: "Jun", revenue: 75000 },
];

interface AuditLog {
  id: string;
  created_at: string;
  performed_by: string;
  business_name: string | null;
  event_type: string;
  description: string;
}

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

export default function SuperadminDashboard() {
  const [activeSection, setActiveSection] = useState<SectionKey>("dashboard");
  const [isNotifsOpen, setIsNotifsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const [stats, setStats] = useState({
    active: 0,
    pending: 0,
  });

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(true);

  // Fetch audit logs
  useEffect(() => {
    const fetchAuditLogs = async () => {
      try {
        const { data, error } = await supabase
          .from("audit_logs")
          .select("id, created_at, performed_by, business_name, event_type, description")
          .order("created_at", { ascending: false })
          .limit(15);

        if (error) throw error;
        setAuditLogs(data ?? []);
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

  // Fetch stat counts
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [activeRes, pendingRes, suspendedRes] = await Promise.all([
          supabase.from("tenants").select("*", { count: "exact", head: true }).eq("is_active", true),
          supabase.from("tenants").select("*", { count: "exact", head: true }).eq("is_active", false),
          supabase.from("suspended_tenants").select("*", { count: "exact", head: true }),
        ]);

        const totalActiveVerified = activeRes.count || 0;
        const totalSuspended = suspendedRes.count || 0;

        setStats({
          active: totalActiveVerified - totalSuspended,
          pending: pendingRes.count || 0,
        });
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex h-screen w-full bg-[#FFFCEB] overflow-hidden font-['Inter']">
      <SidebarSuperAdmin />

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="flex-1 flex flex-col h-full overflow-y-auto px-16 pt-4 pb-10"
      >
        {/* FIX: Props changed from onHome to setActiveSection to match the Navbar interface */}
        <NavbarApp
          setActiveSection={(section) => {
            if (section === "dashboard") {
              window.scrollTo({ top: 0, behavior: "smooth" });
            }
            setActiveSection(section);
          }}
          openNotifs={() => setIsNotifsOpen(true)}
          openProfile={() => setIsProfileOpen(true)}
        />

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

        {/* Stat Cards */}
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
            <StatCard title="Pending Invoices" value="124" trendText="Review their payment status and take action" className="w-full pb-5 h-full" svgName="SA-late-payments" />
          </motion.div>
        </div>

        {/* MRR Chart */}
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

        {/* Activity Log */}
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
            <div className="w-full flex bg-[#385E31] px-6 py-3 rounded-t-[8px] gap-4">
              <div className="w-[150px] shrink-0 text-left text-[#FFFCEB] text-[13px] font-bold">Date & Time</div>
              <div className="w-[160px] shrink-0 text-left text-[#FFFCEB] text-[13px] font-bold">Performed By</div>
              <div className="w-[140px] shrink-0 text-left text-[#FFFCEB] text-[13px] font-bold">Business Name</div>
              <div className="w-[180px] shrink-0 text-left text-[#FFFCEB] text-[13px] font-bold">Event Type</div>
              <div className="flex-1 text-left text-[#FFFCEB] text-[13px] font-bold">Description/Notes</div>
            </div>

            <div className="flex flex-col w-full">
              {logsLoading ? (
                <div className="w-full flex items-center justify-center py-10 text-[#385E31] text-[14px] font-medium">
                  Loading activity logs…
                </div>
              ) : auditLogs.length === 0 ? (
                <div className="w-full flex items-center justify-center py-10 text-[#385E31] text-[14px] font-medium">
                  No activity logs found.
                </div>
              ) : (
                auditLogs.map((row, idx) => {
                  const isLast = idx === auditLogs.length - 1;
                  const formattedDate = new Date(row.created_at).toLocaleString("en-US", {
                    month: "2-digit", day: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: true,
                  });
                  return (
                    <div key={row.id} className={`w-full flex px-6 py-4 items-start gap-4 hover:bg-[#385E31]/5 transition-colors ${!isLast ? "border-b border-[#385E31]/20" : ""}`}>
                      <div className="w-[150px] shrink-0 text-[#3A6131] text-[13px] font-medium pt-0.5">{formattedDate}</div>
                      <div className="w-[160px] shrink-0 text-[#3A6131] text-[13px] font-medium pt-0.5">{row.performed_by}</div>
                      <div className="w-[140px] shrink-0 text-[#3A6131] text-[13px] font-bold pt-0.5">{row.business_name ?? "—"}</div>
                      <div className="w-[180px] shrink-0 flex items-start">
                        <span className="bg-[#E2E8F0] text-[#475569] font-mono text-[11px] px-2.5 py-1 rounded-md">
                          {row.event_type}
                        </span>
                      </div>
                      <div className="flex-1 text-[#3A6131] text-[13px] leading-relaxed pt-0.5">{row.description}</div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>

      <NotificationModal isOpen={isNotifsOpen} onClose={() => setIsNotifsOpen(false)} />
      <ClientProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
    </div>
  );
}