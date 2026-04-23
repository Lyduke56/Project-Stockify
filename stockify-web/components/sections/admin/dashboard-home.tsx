"use client";

import React from 'react';
import { motion } from "framer-motion";
import StatCard from "@/components/cards/stat-cards";
import ShopStatus from "@/components/cards/admin/shop-status";

export default function DashboardHome() {
  return (
    <div className="flex-1 flex flex-col h-full w-full font-['Inter']">
      
      {/* Header - Fades in first */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="w-full flex flex-col items-center mb-8 gap-2"
      >
        <h1 className="text-[#385E31] text-[30px] font-extrabold tracking-wide uppercase text-center mt-5">
          Admin Dashboard
        </h1>
        <div className="w-full max-w-[900px] h-1.5 bg-[#F7B71D] rounded-full" />
      </motion.div>

      {/* Main Content Area */}
      <div className="flex flex-col w-full">
        
        {/* Greeting - Fades in right after header */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut", delay: 0.15 }}
          className="mb-6"
        >
          <h2 className="text-[#385E31] text-4xl font-bold">
            Hello, Client!
          </h2>
          <p className="text-stone-400 font-medium mt-1">
            Shop Name Corporation, Inc.
          </p>
        </motion.div>

        {/* Stat Cards - Staggered Spring Animation */}
        <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ type: "spring", stiffness: 300, damping: 25, delay: 0.25 }}>
            <StatCard 
              title="Active New Customers" 
              value="58" 
              svgName="AC_active"
              className="w-full pb-5 h-full [&_.shrink-0]:!w-20 [&_.shrink-0]:!h-20 [&_.font-black]:!text-[4rem]" 
            />
          </motion.div>
          
          <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ type: "spring", stiffness: 300, damping: 25, delay: 0.35 }}>
            <StatCard 
              title="Monthly Revenue" 
              value="62.3k" 
              svgName="AC_peso"
              className="w-full pb-5 h-full [&_.shrink-0]:!w-20 [&_.shrink-0]:!h-20 [&_.font-black]:!text-[3.8rem]" 
            />
          </motion.div>
          
          <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ type: "spring", stiffness: 300, damping: 25, delay: 0.45 }}>
            <StatCard 
              title="Total Orders" 
              value="143" 
              svgName="AC_orders"
              className="w-full pb-5 h-full [&_.shrink-0]:!w-20 [&_.shrink-0]:!h-20 [&_.font-black]:!text-[4rem]" 
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
          <div className="w-full h-[3px] bg-[#385E31]/20 rounded-full" />
          
          <ShopStatus
            shopName="Coffee Shop" 
            clientName="Shop Name"
            itemCount={245}
            lowStockCount={12}
            revenue="$48.5K"
            orders={124}
            onManageShop={() => console.log("manage shop clicked")}
          />
        </motion.div>

      </div>
    </div>
  );
}