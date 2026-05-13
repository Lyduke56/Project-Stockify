"use client";

import { useState } from "react";
import { motion, Variants } from "framer-motion"; // <-- Added imports
import SidebarClient from "@/components/navbars/sidebar-client";
import NavbarClient from "@/components/navbars/navbar-client";

// ── Animations ────────────────────────────────────────────────────────────────

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1, // Delay between each section appearing
    },
  },
};

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

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ClientSettings() {
  // Added state to make the toggles actually interactive
  const [notifications, setNotifications] = useState({
    important: true,
    lowStock: true,
    orders: false,
    reports: true,
  });

  const toggle = (key: keyof typeof notifications) => {
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="min-h-screen bg-slate-50/50 flex overflow-x-hidden font-['Inter']">
      {/* Make sure active is set to "settings" to highlight it in the sidebar */}
      <SidebarClient active="settings" />

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

          {/* TAB HEADER */}
          <motion.header variants={itemVariants} className="flex flex-col gap-1">
            <h1 className="text-lime-900 text-3xl font-extrabold leading-tight tracking-tight pl-2 mt-4">
              Settings
            </h1>
            <p className="text-lime-800/70 text-sm font-medium pl-3">
              Manage your application preferences and notifications
            </p>
          </motion.header>

          {/* MAIN SETTINGS CARD */}
          <motion.section variants={itemVariants} className="w-full bg-white rounded-3xl border border-lime-800/10 shadow-sm flex flex-col overflow-hidden">
            
            {/* Settings Header */}
            <div className="px-6 sm:px-8 py-6 border-b border-lime-800/10 bg-slate-50/30">
              <h2 className="text-lime-950 text-lg font-bold tracking-tight">
                Notifications
              </h2>
              <p className="text-lime-800/60 text-sm font-medium mt-1">
                Choose what updates and alerts you want to receive.
              </p>
            </div>

            {/* Settings List */}
            <div className="flex flex-col px-6 sm:px-8 py-2">
              
              {/* Option 1: Important Updates */}
              <div className="py-5 flex items-center justify-between gap-6 border-b border-lime-800/5">
                <div className="flex flex-col gap-1 pr-4">
                  <span className="text-lime-950 text-sm font-bold">Important Updates</span>
                  <span className="text-lime-800/60 text-xs font-medium">
                    Receive notifications for critical system updates and announcements.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => toggle("important")}
                  className={`w-11 h-6 rounded-full transition-colors relative flex items-center shrink-0 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 ${
                    notifications.important ? "bg-amber-400" : "bg-gray-200"
                  }`}
                >
                  <div
                    className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform transform ${
                      notifications.important ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              {/* Option 2: Low Stock Alerts */}
              <div className="py-5 flex items-center justify-between gap-6 border-b border-lime-800/5">
                <div className="flex flex-col gap-1 pr-4">
                  <span className="text-lime-950 text-sm font-bold">Low Stock Alerts</span>
                  <span className="text-lime-800/60 text-xs font-medium">
                    Get notified immediately when inventory items are running low.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => toggle("lowStock")}
                  className={`w-11 h-6 rounded-full transition-colors relative flex items-center shrink-0 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 ${
                    notifications.lowStock ? "bg-amber-400" : "bg-gray-200"
                  }`}
                >
                  <div
                    className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform transform ${
                      notifications.lowStock ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              {/* Option 3: Order Notifications */}
              <div className="py-5 flex items-center justify-between gap-6 border-b border-lime-800/5">
                <div className="flex flex-col gap-1 pr-4">
                  <span className="text-lime-950 text-sm font-bold">Order Notifications</span>
                  <span className="text-lime-800/60 text-xs font-medium">
                    Receive alerts for new incoming orders and order status updates.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => toggle("orders")}
                  className={`w-11 h-6 rounded-full transition-colors relative flex items-center shrink-0 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 ${
                    notifications.orders ? "bg-amber-400" : "bg-gray-200"
                  }`}
                >
                  <div
                    className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform transform ${
                      notifications.orders ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              {/* Option 4: Weekly Reports */}
              <div className="py-5 flex items-center justify-between gap-6">
                <div className="flex flex-col gap-1 pr-4">
                  <span className="text-lime-950 text-sm font-bold">Weekly Reports</span>
                  <span className="text-lime-800/60 text-xs font-medium">
                    Get a weekly email summary of your business performance.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => toggle("reports")}
                  className={`w-11 h-6 rounded-full transition-colors relative flex items-center shrink-0 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 ${
                    notifications.reports ? "bg-amber-400" : "bg-gray-200"
                  }`}
                >
                  <div
                    className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform transform ${
                      notifications.reports ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

            </div>
          </motion.section>

          {/* HELP SECTION */}
          <motion.section variants={itemVariants} className="w-full mt-4 p-5 bg-blue-50/60 border border-blue-100 rounded-2xl flex items-start gap-3.5 shadow-sm">
            <div className="mt-0.5 shrink-0 bg-blue-100 p-2 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1d4ed8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-blue-900 text-sm font-bold tracking-wide">
                Need help?
              </span>
              <span className="text-blue-800/80 text-sm font-medium">
                Contact our support team at{" "}
                <a href="mailto:support@stockify.com" className="text-blue-600 hover:text-blue-800 hover:underline transition-colors font-semibold">
                  support@stockify.com
                </a>.
              </span>
            </div>
          </motion.section>

        </motion.div>
      </main>
    </div>
  );
}