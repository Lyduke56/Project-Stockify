"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Tab Components
import PendingTenantsTab from "@/components/sections/superadmin/pending-tenants-tab";
import ActiveTenantsTab from "@/components/sections/superadmin/active-tenants-tab";
import TerminatedTenantsTab from "@/components/sections/superadmin/terminated-tenants-table";
import SuspendedTenantsTab from "@/components/sections/superadmin/supend-tenant-modal";
import TrialTenantsTab from "@/components/sections/superadmin/trial-tenants-tab";
import LoadingScreen from "@/app/loading-screen/loading";

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

// ── Tabs ──────────────────────────────────────────────────────────────────────
const tabs = ["Active", "Pending", "Suspended", "Terminated"];

// ── Helpers ───────────────────────────────────────────────────────────────────
const getTabConfig = (tab: string) => {
  switch (tab) {
    case "Active":     return { bg: "bg-[#385E31]", text: "text-[#FFFCEB]" };
    case "Pending":    return { bg: "bg-[#E5AD24]", text: "text-[#385E31]" };
    case "Suspended":  return { bg: "bg-[#E91F22]", text: "text-[#FFFCEB]" };
    case "Terminated": return { bg: "bg-[#E91F22]", text: "text-[#F7B71D]" };
    default:           return { bg: "bg-[#385E31]", text: "text-[#FFFCEB]" };
  }
};

// ── Stat Card ─────────────────────────────────────────────────────────────────
interface StatCardProps {
  title:      string;
  value:      string | number;
  trendText:  string;
  className?: string;
  svgName:    string;
  delay?:     number;
}

interface TenantManagementProps {
  onReviewTenant: (id: string) => void;
}

function StatCard({ title, value, trendText, className = "", svgName, delay = 0 }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 25, delay }}
      className={`bg-[#385E31] rounded-[8px] p-4 flex flex-col shadow-md border-2 border-[#385E31] ${className}`}
    >
      <h3 className="text-[#FFFCEB] text-[18px] font-bold mb-3">{title}</h3>
      <div className="bg-[#FFFCEB] rounded-[6px] flex flex-col items-center justify-center py-3 flex-1 relative">
        <div className="flex items-center justify-center gap-3">
          <img src={`/${svgName}.svg`} alt={`${title} Icon`} className="w-12 h-12 object-contain" />
          <span className="text-[#385E31] text-[3.5rem] font-black leading-none">{value}</span>
        </div>
        <p className="text-[#385E31] text-[11px] mt-1 font-medium">{trendText}</p>
      </div>
    </motion.div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function TenantManagementSection({ onReviewTenant }: TenantManagementProps) {
  const [activeTab, setActiveTab] = useState("Active");

  const [stats, setStats] = useState({
    active:     0,
    pending:    0,
    suspended:  0,
    terminated: 0,
  });

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAllStats = async () => {
      try {
        const [activeRes, pendingRes, suspendedRes, terminatedRes] = await Promise.all([
          supabase.from("tenants").select("*", { count: "exact", head: true }).eq("subscription_status", "Active"),
          supabase.from("tenants").select("*", { count: "exact", head: true }).eq("subscription_status", "Pending"),
          supabase.from("tenants").select("*", { count: "exact", head: true }).eq("subscription_status", "Suspended"),
          supabase.from("terminated_business").select("*", { count: "exact", head: true }),
        ]);

        setStats({
          active:     activeRes.count    || 0,
          pending:    pendingRes.count   || 0,
          suspended:  suspendedRes.count || 0,
          terminated: terminatedRes.count || 0,
        });
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
      } finally {
        // ── ADD THIS LINE ──
        setIsLoading(false); 
      }
    };
    // Initial fetch
    fetchAllStats();

    // Poll every 5 seconds
    const interval = setInterval(fetchAllStats, 5000);

    // Cleanup on unmount
    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return <LoadingScreen fullScreen={false} />; 
  }

  return (
    <div className="w-full flex flex-col items-center">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="w-full flex flex-col items-center mt-10 mb-8 gap-2"
      >
        <h1 className="text-[#385E31] text-[30px] font-extrabold tracking-wide uppercase">
          TENANT MANAGEMENT
        </h1>
        <div className="w-full max-w-[900px] h-1.5 bg-[#F7B71D] rounded-full" />
      </motion.div>

      {/* Stat Cards */}
      <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <StatCard title="Active Tenants" value={stats.active} trendText="Verified and operational" svgName="SA-active-tenants" delay={0.1} />
        <StatCard title="Pending Applications" value={stats.pending} trendText={`${stats.pending} awaiting review`} svgName="SA-pending-app" delay={0.2} />
        <StatCard title="Suspended Tenants" value={stats.suspended} trendText="Temporary access restrictions" svgName="SA-suspended-tenants" delay={0.3} />
        <StatCard title="Terminated Tenants" value={stats.terminated} trendText="Permanently closed accounts" svgName="SA-terminated-tenants" delay={0.4} />
      </div>

      {/* Tab navigation */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="w-full flex justify-center mb-8"
      >
        <div className="relative flex w-full max-w-[800px] h-[45px] items-center my-2">
          <div className="absolute inset-0 border-2 border-[#385E31] rounded-[8px] pointer-events-none" />

          <div
            className={`absolute top-[-2px] bottom-[-2px] rounded-[8px] transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] z-10 ${getTabConfig(activeTab).bg}`}
            style={{
              width: "calc(25% + 4px)",
              left:  `calc(${tabs.indexOf(activeTab) * 25}% - 2px)`,
            }}
          />

          {tabs.map((tab) => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
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

      {/* Tab content */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 25, delay: 0.4 }}
        className="w-full flex flex-col items-center"
      >
        <h2 className="text-[#385E31] text-[26px] font-extrabold font-['Inter'] mb-4">
          {activeTab === "Pending"
            ? "Pending Applications Database"
            : `${activeTab} Tenants Database`}
        </h2>

        {activeTab === "Active"     && (
          <>
            <ActiveTenantsTab onReview={onReviewTenant} />
            <TrialTenantsTab onReview={onReviewTenant} />
          </>
        )}
        {activeTab === "Pending"    && <PendingTenantsTab />}
        {activeTab === "Terminated" && <TerminatedTenantsTab onReview={onReviewTenant} />}
        {activeTab === "Suspended"  && <SuspendedTenantsTab onReview={onReviewTenant} />}
      </motion.div>
    </div>
  );
}