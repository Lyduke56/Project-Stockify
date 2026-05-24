"use client";

// app/superadmin/subscription-billing/page.tsx

import { useCallback, useEffect, useState } from "react";
import { createClient }   from "@supabase/supabase-js";
import { motion }         from "framer-motion";

import Sidebar    from "@/components/navbars/sidebar-superadmin";
import NavbarApp  from "@/components/navbars/navbar-superadmin";
import NotificationModal  from "@/components/modals/notification-modal";
import ClientProfileModal from "@/components/modals/client-profile-modal";

import BillingPaymentTable, { BillingRow } from "@/components/tables/subscription-billing/billing-payment-table";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Stats {
  total_paid:    number;
  overdue_count: number;
  missed_count:  number;
  avg_days_late: number;
}

// ── Stat Card ─────────────────────────────────────────────────────────────────

interface StatCardProps {
  title:     string;
  value:     string | number;
  trendText: string;
  svgName:   string;
  delay?:    number;
}

function StatCard({ title, value, trendText, svgName, delay = 0 }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1,    y: 0  }}
      transition={{ type: "spring", stiffness: 300, damping: 25, delay }}
      className="bg-[#385E31] rounded-[8px] p-4 flex flex-col shadow-md border-2 border-[#385E31]"
    >
      <h3 className="text-[#FFFCEB] text-[17px] font-bold mb-3">{title}</h3>
      <div className="bg-[#FFFCEB] rounded-[6px] flex flex-col items-center justify-center py-5 flex-1">
        <div className="flex items-center justify-center gap-3">
          <img src={`/${svgName}.svg`} alt={title} className="w-14 h-14 object-contain" />
          <span className="text-[#385E31] text-[3.8rem] font-black leading-none">{value}</span>
        </div>
        <p className="text-[#385E31] text-[11px] mt-2 font-bold">{trendText}</p>
      </div>
    </motion.div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatStatValue(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${Math.round(n / 1_000)}k`;
  return `₱${n.toLocaleString("en-PH", { minimumFractionDigits: 0 })}`;
}

// ── Supabase browser client (for real-time) ───────────────────────────────────
// Requires NEXT_PUBLIC_SUPABASE_ANON_KEY in your env vars.

const supabaseBrowser = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ── Page ──────────────────────────────────────────────────────────────────────

export default function SubscriptionBilling() {
  const [rows,         setRows]         = useState<BillingRow[]>([]);
  const [stats,        setStats]        = useState<Stats | null>(null);
  const [loading,      setLoading]      = useState(true);
  const [isNotifsOpen, setIsNotifsOpen] = useState(false);
  const [isProfileOpen,setIsProfileOpen]= useState(false);

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchData = useCallback(async () => {
    try {
      const res  = await fetch("/api/cron/billing");
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setRows(json.data   ?? []);
      setStats(json.stats ?? null);
    } catch (e) {
      console.error("[SubscriptionBilling] fetch error:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── Real-time subscriptions ────────────────────────────────────────────────

  useEffect(() => {
    const channel = supabaseBrowser
      .channel("billing-realtime")
      .on("postgres_changes",
        { event: "*", schema: "public", table: "subscription_records" },
        () => { fetchData(); }
      )
      .on("postgres_changes",
        { event: "*", schema: "public", table: "tenants" },
        () => { fetchData(); }
      )
      .on("postgres_changes",
        { event: "*", schema: "public", table: "suspended_tenants" },
        () => { fetchData(); }
      )
      .subscribe();

    return () => { supabaseBrowser.removeChannel(channel); };
  }, [fetchData]);

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex h-screen w-full bg-[#FFFCEB] overflow-hidden font-['Inter']">
      <Sidebar />

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="flex-1 flex flex-col h-full overflow-y-auto px-10 md:px-20 pt-5 pb-12"
      >
        {/* Navbar */}
        <NavbarApp
          onHome={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          openNotifs={() => setIsNotifsOpen(true)}
        />

        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="w-full flex flex-col items-center mt-10 mb-8 gap-2"
        >
          <h1 className="text-[#385E31] text-[30px] font-extrabold tracking-wide uppercase">
            SUBSCRIPTION BILLING
          </h1>
          <div className="w-full max-w-[900px] h-1.5 bg-[#F7B71D] rounded-full" />
        </motion.div>

        {/* Stat Cards */}
        {loading ? (
          <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            {[0, 1, 2].map((i) => (
              <div key={i} className="bg-[#385E31]/20 rounded-[8px] h-[140px] animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            <StatCard
              title="Total Paid"
              value={stats ? formatStatValue(stats.total_paid) : "—"}
              trendText={`Current year (${new Date().getFullYear()})`}
              svgName="SA-rev-stat"
              delay={0.15}
            />
            <StatCard
              title="Late Payments"
              value={stats?.overdue_count ?? 0}
              trendText={
                stats?.avg_days_late
                  ? `Avg. ${stats.avg_days_late} days late`
                  : "No overdue accounts"
              }
              svgName="SA-late-payments"
              delay={0.25}
            />
            <StatCard
              title="Missed Payments"
              value={stats?.missed_count ?? 0}
              trendText="Currently suspended"
              svgName="SA-missed-payments"
              delay={0.35}
            />
          </div>
        )}

        {/* Payment Tracker header */}
        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-[#385E31] text-[24px] font-extrabold mb-2 text-center"
        >
          Payment Tracker
        </motion.h2>

        {/* Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 25, delay: 0.45 }}
          className="w-full flex flex-col"
        >
          {loading ? (
            <div className="w-full text-center py-16 text-[#385E31] font-bold text-lg">
              Loading billing data…
            </div>
          ) : (
            <BillingPaymentTable rows={rows} onRefresh={fetchData} />
          )}

        </motion.div>
          
        {/* Modals */}
        <NotificationModal  isOpen={isNotifsOpen}  onClose={() => setIsNotifsOpen(false)} role="superadmin" />
        <ClientProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
      </motion.div>
    </div>
  );
}