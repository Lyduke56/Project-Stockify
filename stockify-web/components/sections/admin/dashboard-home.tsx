"use client";

import React from 'react';
import { motion } from "framer-motion";
import StatCard from "@/components/cards/stat-cards";
import ShopStatus from "@/components/cards/admin/shop-status";
import type { ClientDashboardStats } from "@/lib/client/dashboard-stats";

interface DashboardHomeProps {
  data: ClientDashboardStats;
  onManageShop?: () => void;
}

const formatCurrency = (n: number) => {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return n.toString();
};

export default function DashboardHome({ data, onManageShop }: DashboardHomeProps) {
  return (
    <div className="flex-1 flex flex-col h-full w-full font-['Inter']">
      
      {/* Header */}
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

      {/* Main Content */}
      <div className="flex flex-col w-full">

        {/* Stat Cards */}
        <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ type: "spring", stiffness: 300, damping: 25, delay: 0.25 }}>
            <StatCard 
              title="Active New Customers" 
              value={data.activeNewCustomers.toString()}
              svgName="AC_active"
              className="w-full pb-5 h-full [&_.shrink-0]:!w-20 [&_.shrink-0]:!h-20 [&_.font-black]:!text-[4rem]" 
              trendText="Newly registered active users" 
            />
          </motion.div>
          
          <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ type: "spring", stiffness: 300, damping: 25, delay: 0.35 }}>
            <StatCard 
              title="Monthly Revenue" 
              value={formatCurrency(data.monthlyRevenue ?? 0)}
              svgName="AC_peso"
              className="w-full pb-5 h-full [&_.shrink-0]:!w-20 [&_.shrink-0]:!h-20 [&_.font-black]:!text-[3.8rem]" 
              trendText="Total revenue for the current month"
            />
          </motion.div>
          
          <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ type: "spring", stiffness: 300, damping: 25, delay: 0.45 }}>
            <StatCard 
              title="Total Success Transactions" 
              value={data.totalSuccessTransactions.toString() ?? "0"}
              svgName="AC_orders"
              className="w-full pb-5 h-full [&_.shrink-0]:!w-20 [&_.shrink-0]:!h-20 [&_.font-black]:!text-[4rem]" 
              trendText="Successfully completed orders"
            />
          </motion.div>
        </div>

        {/* Divider & Shop Status */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 25, delay: 0.55 }}
          className="w-full flex flex-col gap-6 mt-2"
        >
          <div className="w-full h-[3px] bg-primary/20 rounded-full" />
          <ShopStatus
            shopName="Administrator View" 
            clientName={data.shopStatus?.shopName ?? "My Shop"}
            itemCount={data.shopStatus?.itemCount ?? 0}
            lowStockCount={data.shopStatus?.lowStockCount ?? 0}
            revenue={`₱${formatCurrency(data.shopStatus?.revenue ?? 0)}`}
            orders={data.shopStatus?.orders ?? 0}
            onManageShop={onManageShop}
          />
        </motion.div>

      </div>
    </div>
  );
}