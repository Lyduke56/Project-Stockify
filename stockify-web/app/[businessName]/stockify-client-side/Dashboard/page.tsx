"use client";

import { motion, Variants } from "framer-motion";
import SidebarClient from "@/components/navbars/sidebar-client";
import NavbarClient from "@/components/navbars/navbar-client";

// Animation variants for the container to stagger its children
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

// Add the `: Variants` type annotation to the items
const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: "easeOut",
    },
  },
};

export default function ClientDashboardPage() {
  return (
    <div className="min-h-screen bg-slate-50/50 flex overflow-x-hidden font-['Inter']">
      <SidebarClient active="dashboard" />

      <main className="ml-0 lg:ml-64 flex-1 px-4 py-6 sm:px-6 sm:py-8">
        <motion.div 
          className="mx-auto w-full max-w-6xl space-y-8"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* TOP BAR */}
          <motion.div variants={itemVariants}>
            <NavbarClient />
          </motion.div>

          {/* GREETING + SHOP NAME */}
          <motion.header variants={itemVariants} className="flex flex-col gap-1">
            <h1 className="text-lime-900 text-3xl font-extrabold leading-tight tracking-tight pl-2 mt-4">
              Hello, Client!
            </h1>
            <p className="text-lime-800/70 text-sm font-medium pl-2">
              Shop Name Corporation, Inc.
            </p>
          </motion.header>

          {/* KPI CARDS */}
          <motion.section variants={itemVariants} className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            
            {/* KPI 1: Active New Customers */}
            <div className="w-full h-full p-5 bg-white border border-lime-950 rounded-[20px] flex flex-col gap-3 shadow-md">
              <div className="text-lime-950 text-[18px] font-bold">
                Active New Customers
              </div>
              <div className="w-full flex-1 pt-6 pb-5 bg-lime-950 rounded-xl flex flex-col items-center justify-center">
                <div className="flex items-center justify-center gap-4">
                  <div className="w-16 h-16 text-lime-800 shrink-0 flex items-center justify-center">
                    {/* YOUR SVG HERE */}
                    <img 
                      src="/client-active-customers.svg" 
                      alt="Customers Icon" 
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="text-[#F7B71D] text-[3.6rem] leading-none font-black tracking-tight">
                    58
                  </div>
                </div>
                <div className="mt-1 text-[#F7B71D] text-[13px] font-semibold px-3 py-1 rounded-full">
                  + 10% from previous month
                </div>
              </div>
            </div>

            {/* KPI 2: Monthly Revenue */}
            <div className="w-full h-full p-5 bg-white border border-lime-950 rounded-[20px] flex flex-col gap-3 shadow-md">
              <div className="text-lime-950 text-[18px] font-bold">
                Monthly Revenue
              </div>
              <div className="w-full flex-1 pt-6 pb-5 bg-lime-950 rounded-xl flex flex-col items-center justify-center">
                <div className="flex items-center justify-center gap-4">
                  <div className="w-14 h-14 text-lime-800 shrink-0 flex items-center justify-center">
                    {/* YOUR SVG HERE */}
                    <img 
                      src="/client-montly-rev.svg" 
                      alt="Revenue Icon" 
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="text-[#F7B71D] text-[3.6rem] leading-none font-black tracking-tight">
                    48.5k
                  </div>
                </div>
                <div className="mt-1 text-[#F7B71D] text-[13px] font-semibold px-3 py-1 rounded-full">
                  + 8.56% from previous month
                </div>
              </div>
            </div>

            {/* KPI 3: Total Orders */}
            <div className="w-full h-full p-5 bg-white border border-lime-950 rounded-[20px] flex flex-col gap-3 shadow-md">
              <div className="text-lime-950 text-[18px] font-bold">
                Total Orders
              </div>
              <div className="w-full flex-1 pt-6 pb-5 bg-lime-950 rounded-xl flex flex-col items-center justify-center">
                <div className="flex items-center justify-center gap-4">
                  <div className="w-14 h-14 text-lime-800 shrink-0 flex items-center justify-center">
                    {/* YOUR SVG HERE */}
                    <img 
                      src="/client-total-order.svg" 
                      alt="Orders Icon" 
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="text-[#F7B71D] text-[3.6rem] leading-none font-black tracking-tight">
                    124
                  </div>
                </div>
                <div className="mt-1 text-[#F7B71D] text-[13px] font-semibold px-3 py-1 rounded-full">
                  + 5% from previous month
                </div>
              </div>
            </div>

          </motion.section>

          {/* ALERTS + STATUS */}
          <motion.section variants={itemVariants}>
            <div className="w-full bg-orange-50 rounded-2xl border border-orange-200 p-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between shadow-sm">
              <div>
                <h3 className="text-orange-900 text-sm font-bold tracking-wide uppercase mb-1">
                  Action Required
                </h3>
                <p className="text-orange-800 text-base font-medium">
                  10 days left before your subscription expires!
                </p>
              </div>
              <button
                type="button"
                className="h-10 px-6 rounded-xl bg-amber-400 shadow-md shadow-amber-400/20 hover:bg-amber-500 hover:-translate-y-0.5 active:translate-y-0 transition-all text-lime-950 text-sm font-bold whitespace-nowrap"
              >
                Renew Here
              </button>
            </div>
          </motion.section>

          {/* SHOP STATUS SECTION */}
          <motion.section variants={itemVariants} className="bg-white rounded-3xl border border-lime-800/10 p-6 shadow-sm">
            <header className="mb-6">
              <h2 className="text-lime-950 text-lg font-bold">Shop Status</h2>
              <p className="text-lime-800/60 text-sm font-medium mt-1">
                Overview of your current inventory and performance
              </p>
            </header>

            {/* Shop Row */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 p-5 rounded-2xl border border-lime-800/10 bg-lime-50/30">
              {/* Left: Shop Info */}
              <div className="flex flex-col gap-3">
                <div>
                  <h3 className="text-lime-950 text-lg font-bold">Coffee Shop</h3>
                  <span className="inline-block mt-1 px-2.5 py-1 bg-lime-100 text-lime-800 text-xs font-bold rounded-md uppercase tracking-wider">
                    Food & Beverage
                  </span>
                </div>
                
                <div className="flex items-center gap-4 mt-1">
                  <div className="text-lime-800/70 text-sm font-medium">
                    <span className="font-bold text-lime-900">245</span> items total
                  </div>
                  <div className="flex items-center gap-1.5 text-orange-600 text-sm font-semibold">
                    <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
                    12 low stock
                  </div>
                </div>
              </div>

              {/* Right: Stats & Action */}
              <div className="flex flex-wrap lg:flex-nowrap items-center gap-6 sm:gap-8">
                <div className="flex flex-col items-start lg:items-end">
                  <span className="text-lime-800/50 text-xs font-bold uppercase tracking-wider mb-0.5">
                    Revenue
                  </span>
                  <span className="text-lime-950 text-2xl font-black">
                    ₱48.5K
                  </span>
                </div>
                
                <div className="w-px h-10 bg-lime-800/10 hidden sm:block"></div>
                
                <div className="flex flex-col items-start lg:items-end">
                  <span className="text-lime-800/50 text-xs font-bold uppercase tracking-wider mb-0.5">
                    Orders
                  </span>
                  <span className="text-lime-950 text-2xl font-black">
                    124
                  </span>
                </div>

                <button
                  type="button"
                  className="mt-4 lg:mt-0 ml-auto h-10 px-5 rounded-xl bg-amber-400 shadow-md shadow-amber-400/20 hover:bg-amber-500 hover:-translate-y-0.5 active:translate-y-0 transition-all text-lime-950 text-sm font-bold"
                >
                  Manage Shop
                </button>
              </div>
            </div>
          </motion.section>

        </motion.div>
      </main>
    </div>
  );
}