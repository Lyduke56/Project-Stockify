"use client";

import React, { useState, useEffect } from 'react';
import { motion } from "framer-motion";
import StatCard from "@/components/cards/stat-cards";
import ShopStatus from "@/components/cards/admin/shop-status";
import { createClient } from "@/lib/supabase/client";
import { fetchClientDashboardData } from "@/lib/client/dashboard-stats";
import type { ClientDashboardStats } from "@/lib/client/dashboard-stats";
import { Loader2 } from "lucide-react";

interface DashboardHomeProps {
  onManageShop?: () => void;
}

export default function DashboardHome({ onManageShop }: DashboardHomeProps) {
  const [data, setData] = useState<ClientDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setLoading(false);
          return;
        }

        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("tenant_id")
          .eq("user_id", user.id)
          .single();

        if (userError) throw userError;

        if (userData?.tenant_id) {
          const stats = await fetchClientDashboardData(userData.tenant_id);
          setData(stats);
        }
      } catch (err) {
        console.error("Dashboard initialization failed:", err);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  const formatCurrency = (n: number) => {
    if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
    return n.toString();
  };

  return (
    <div className="flex-1 flex flex-col h-full w-full font-['Inter']">
      
      {/* Header - Fades in first */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="w-full flex flex-col items-center mb-8 gap-2"
      >
        <h1 className="text-primary text-[30px] font-extrabold tracking-wide uppercase text-center mt-5">
          Admin Dashboard
        </h1>
        <div className="w-full max-w-[900px] h-1.5 bg-accent rounded-full" />
      </motion.div>

      {/* Main Content Area */}
      <div className="flex flex-col w-full">

        {/* Stat Cards - Staggered Spring Animation */}
        <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ type: "spring", stiffness: 300, damping: 25, delay: 0.25 }}>
            <StatCard 
              title="Active New Customers" 
              value={loading ? <Loader2 className="animate-spin" size={32} /> : data?.activeNewCustomers.toString() ?? "0"} 
              svgName="AC_active"
              className="w-full pb-5 h-full [&_.shrink-0]:!w-20 [&_.shrink-0]:!h-20 [&_.font-black]:!text-[4rem]" 
              trendText="Newly registered active users" 
            />
          </motion.div>
          
          <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ type: "spring", stiffness: 300, damping: 25, delay: 0.35 }}>
            <StatCard 
              title="Monthly Revenue" 
              value={loading ? <Loader2 className="animate-spin" size={32} /> : formatCurrency(data?.monthlyRevenue ?? 0)} 
              svgName="AC_peso"
              className="w-full pb-5 h-full [&_.shrink-0]:!w-20 [&_.shrink-0]:!h-20 [&_.font-black]:!text-[3.8rem]" 
              trendText="Total revenue for the current month"
            />
          </motion.div>
          
          <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ type: "spring", stiffness: 300, damping: 25, delay: 0.45 }}>
            <StatCard 
              title="Total Success Transactions" 
              value={loading ? <Loader2 className="animate-spin" size={32} /> : data?.totalSuccessTransactions.toString() ?? "0"} 
              svgName="AC_orders"
              className="w-full pb-5 h-full [&_.shrink-0]:!w-20 [&_.shrink-0]:!h-20 [&_.font-black]:!text-[4rem]" 
              trendText="Successfully completed orders"
            />
          </motion.div>
        </div>

        {/* Divider & Shop Status - Slides in last */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 25, delay: 0.55 }}
          className="w-full flex flex-col gap-6 mt-2"
        >
          <div className="w-full h-[3px] bg-primary/20 rounded-full" />
          
          {loading ? (
            <div className="w-full flex justify-center py-10">
              <Loader2 className="animate-spin text-primary" size={40} />
            </div>
          ) : (
            <ShopStatus
              shopName="Administrator View" 
              clientName={data?.shopStatus?.shopName ?? "My Shop"}
              itemCount={data?.shopStatus?.itemCount ?? 0}
              lowStockCount={data?.shopStatus?.lowStockCount ?? 0}
              revenue={`₱${formatCurrency(data?.shopStatus?.revenue ?? 0)}`}
              orders={data?.shopStatus?.orders ?? 0}
              onManageShop={onManageShop}
            />
          )}
        </motion.div>

      </div>
    </div>
  );
}