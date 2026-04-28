"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";

// Animation Variants
const containerVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
};

export default function AdminSettingsSection() {
  const [toggles, setToggles] = useState({
    notifications: true,
    lowStock: true,
    orderNotifications: true,
    weeklyReports: true,
  });

  const toggle = (key: keyof typeof toggles) =>
    setToggles((prev) => ({ ...prev, [key]: !prev[key] }));

  const settings: { key: keyof typeof toggles; label: string; desc: string }[] = [
    { key: "notifications", label: "Global Notifications", desc: "Receive notifications for important platform updates" },
    { key: "lowStock", label: "Low Stock Alerts", desc: "Get notified when inventory items drop below the threshold" },
    { key: "orderNotifications", label: "Order Notifications", desc: "Receive real-time alerts for new orders and status updates" },
    { key: "weeklyReports", label: "Weekly Reports", desc: "Get a weekly summary of your business performance to your inbox" },
  ];

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="flex flex-col w-full min-h-screen bg-[#FFFCEB] font-['Inter'] pt-5 pb-12"
    >
      {/* PAGE HEADER */}
      <motion.header variants={itemVariants} className="w-full flex flex-col items-center mb-12 gap-2">
        <h1 className="text-[#385E31] text-[30px] font-extrabold uppercase tracking-tight">
          Client Settings
        </h1>
        <div className="w-full max-w-[900px] h-1.5 bg-[#F7B71D] rounded-full opacity-60" />
      </motion.header>

      {/* MAIN CONTENT AREA */}
      <motion.div variants={itemVariants} className="flex flex-col gap-8 w-full max-w-5xl mx-auto px-4 sm:px-8">
        
        {/* SETTINGS CARD */}
        <div className="flex flex-col gap-6 p-8 w-full bg-[#FFFCEB] rounded-[10px] border border-[#385E31] shadow-sm">
          
          {/* Card Header */}
          <div className="flex flex-col gap-1 mb-2">
            <h3 className="text-[#385E31] text-[18px] font-extrabold uppercase">
              Notification Preferences
            </h3>
            <p className="text-[#385E31]/70 text-sm font-medium">
              Choose exactly what alerts and reports you want to receive.
            </p>
          </div>

          {/* Toggle List */}
          <div className="flex flex-col">
            {settings.map((s, i) => (
              <div key={s.key} className="flex flex-col">
                <div 
                  className="flex justify-between items-center py-4 rounded-xl hover:bg-[#385E31]/5 transition-colors cursor-pointer px-2 sm:px-4 -mx-2 sm:-mx-4"
                  onClick={() => toggle(s.key)}
                >
                  <div className="flex flex-col gap-1 pr-6">
                    <span className="text-[#385E31] text-sm font-bold">{s.label}</span>
                    <span className="text-[#385E31]/70 text-xs font-medium leading-relaxed">{s.desc}</span>
                  </div>
                  
                  {/* Framer Motion Animated Toggle */}
                  <div className={`shrink-0 w-12 h-6 rounded-full relative transition-colors duration-300 ${toggles[s.key] ? 'bg-[#385E31]' : 'bg-[#385E31]/30'}`}>
                    <motion.div 
                      layout
                      className="absolute top-1 w-4 h-4 bg-[#FFFCEB] rounded-full shadow-sm"
                      initial={false}
                      animate={{ 
                        x: toggles[s.key] ? 28 : 4 
                      }}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  </div>
                </div>
                
                {/* Divider (skip on last item) */}
                {i < settings.length - 1 && (
                  <div className="w-full h-px bg-[#385E31]/10 my-1" />
                )}
              </div>
            ))}
          </div>
          
        </div>
      </motion.div>
    </motion.div>
  );
}