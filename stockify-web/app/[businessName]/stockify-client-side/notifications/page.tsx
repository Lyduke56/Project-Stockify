"use client";

import { useState } from "react";
import { motion, Variants } from "framer-motion";
import SidebarClient from "@/components/navbars/sidebar-client";
import NavbarClient from "@/components/navbars/navbar-client";

// FIXED ALIAS PATH: Pointing exactly to components/navbars/ where it sits in your tree
import NotificationModal from "@/components/modals/notification-modal";

// ── Animations with Strict Typing ──────────────────────────────────────────

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
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

// ── Page Component ──────────────────────────────────────────────────────────

export default function ClientNotifications() {
  const [isNotifModalOpen, setIsNotifModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#FFFFFF] flex overflow-x-hidden font-['Inter']">
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
            <NavbarClient openNotifs={() => setIsNotifModalOpen(true)} />
          </motion.div>

          {/* TAB HEADER */}
          <motion.header variants={itemVariants} className="flex flex-col gap-1 pl-2 mt-4">
            <h1 className="text-lime-900 text-3xl font-extrabold leading-tight tracking-tight">
              Notifications
            </h1>
            <p className="text-lime-800/70 text-sm font-medium pl-1">
              Stay updated with the latest system and business alerts
            </p>
          </motion.header>

          {/* FALLBACK INFO CANVAS BLOCK */}
          <motion.div 
            variants={itemVariants}
            className="w-full py-24 bg-white rounded-3xl border border-lime-800/10 shadow-sm flex flex-col items-center justify-center text-center px-6"
          >
            <div className="w-16 h-16 bg-lime-50 rounded-full flex items-center justify-center mb-4 border border-lime-100">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#385E31" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
            </div>
            <h3 className="text-lime-950 font-bold text-lg tracking-tight">
              Click the Bell Icon Above
            </h3>
            <p className="text-lime-800/60 text-sm font-medium mt-2 max-w-md leading-relaxed">
              Your real-time system alerts panel will instantly open inside a custom structured overlay matching your core profile tools!
            </p>
          </motion.div>

        </motion.div>
      </main>

      {/* Rendered Notification Overlay Window */}
      <NotificationModal 
        isOpen={isNotifModalOpen}
        onClose={() => setIsNotifModalOpen(false)}
      />
    </div>
  );
}