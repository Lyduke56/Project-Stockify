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

export default function StoreSettingsSection() {
  const [codEnabled, setCodEnabled] = useState(true);
  const [qrEnabled, setQrEnabled] = useState(true);

  const businessInfo = [
    { label: "Business Name", placeholder: "e.g., Green Earth Grocery" },
    { label: "Contact Number", placeholder: "e.g., +1 (555) 123-4567" },
    { label: "Operating Hours", placeholder: "e.g., Mon-Fri, 9AM - 6PM" },
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
          Store Settings
        </h1>
        <div className="w-full max-w-[900px] h-1.5 bg-[#F7B71D] rounded-full opacity-60" />
      </motion.header>

      <motion.div variants={itemVariants} className="flex flex-col gap-8 w-full max-w-5xl mx-auto">
        
        {/* BUSINESS INFORMATION SECTION */}
        <div className="flex flex-col gap-6 p-8 w-full bg-[#FFFCEB] rounded-[10px] border border-[#385E31] shadow-sm">
          <div className="flex flex-col gap-1">
            <h3 className="text-[#385E31] text-[18px] font-extrabold uppercase">
              Business Information
            </h3>
            <p className="text-[#385E31]/70 text-sm font-medium">
              Update your core business details visible to customers.
            </p>
          </div>
          
          <div className="flex flex-col gap-5">
            {businessInfo.map((item) => (
              <div key={item.label} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                <label className="text-[#385E31] font-bold text-sm sm:w-40 shrink-0">
                  {item.label}
                </label>
                <input
                  type="text"
                  placeholder={item.placeholder}
                  className="flex-1 border border-[#385E31] rounded-full px-5 py-2.5 bg-transparent text-[#385E31] placeholder-[#385E31]/50 outline-none font-medium text-sm transition-all focus:ring-1 focus:ring-[#385E31]"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* PAYMENT METHODS SECTION */}
          <div className="flex flex-col gap-6 p-8 w-full bg-[#FFFCEB] rounded-[10px] border border-[#385E31] shadow-sm">
            <div className="flex flex-col gap-1 mb-2">
              <h3 className="text-[#385E31] text-[18px] font-extrabold uppercase">
                Payment Methods
              </h3>
              <p className="text-[#385E31]/70 text-sm font-medium">
                Select which checkout options are available.
              </p>
            </div>

            <div className="flex flex-col gap-5">
              <div 
                className="flex items-center justify-between p-4 rounded-xl border border-[#385E31]/20 hover:bg-[#385E31]/5 transition-colors cursor-pointer"
                onClick={() => setCodEnabled(!codEnabled)}
              >
                <span className="text-[#385E31] font-bold text-sm">Enable Cash-on-Delivery (COD)</span>
                <div className={`w-12 h-6 rounded-full relative transition-colors duration-300 ${codEnabled ? 'bg-[#385E31]' : 'bg-[#385E31]/30'}`}>
                  <motion.div 
                    layout
                    className="absolute top-1 w-4 h-4 bg-[#FFFCEB] rounded-full shadow-sm"
                    initial={false}
                    animate={{ 
                      x: codEnabled ? 28 : 4 
                    }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                </div>
              </div>

              <div 
                className="flex items-center justify-between p-4 rounded-xl border border-[#385E31]/20 hover:bg-[#385E31]/5 transition-colors cursor-pointer"
                onClick={() => setQrEnabled(!qrEnabled)}
              >
                <span className="text-[#385E31] font-bold text-sm">Enable QR Code Payment</span>
                <div className={`w-12 h-6 rounded-full relative transition-colors duration-300 ${qrEnabled ? 'bg-[#385E31]' : 'bg-[#385E31]/30'}`}>
                  <motion.div 
                    layout
                    className="absolute top-1 w-4 h-4 bg-[#FFFCEB] rounded-full shadow-sm"
                    initial={false}
                    animate={{ 
                      x: qrEnabled ? 28 : 4 
                    }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* IN-HOUSE QR CODE SECTION */}
          <div className="flex flex-col gap-6 p-8 w-full bg-[#FFFCEB] rounded-[10px] border border-[#385E31] shadow-sm">
             <div className="flex flex-col gap-1 mb-2">
              <h3 className="text-[#385E31] text-[18px] font-extrabold uppercase">
                In-House QR Code
              </h3>
              <p className="text-[#385E31]/70 text-sm font-medium">
                Manage your store's primary payment QR token.
              </p>
            </div>

            <div className="flex flex-col items-center justify-center gap-6 h-full">
              <div className="w-32 h-32 bg-white rounded-xl border-2 border-[#385E31] shadow-sm flex items-center justify-center p-2">
                <img 
                  src="/api/placeholder/150/150" 
                  alt="QR Code Placeholder" 
                  className="w-full h-full object-cover opacity-80 mix-blend-multiply" 
                />
              </div>
              
              <div className="flex flex-col gap-4 w-full items-center">
                <div className="text-center bg-[#385E31]/5 py-2 px-6 rounded-lg border border-[#385E31]/10 w-full">
                  <p className="text-[#385E31] text-[11px] font-bold uppercase tracking-wider mb-1">Active Token</p>
                  <p className="text-[#385E31] font-mono text-sm opacity-80 break-all">
                    a1b2c3d4e5f6g7h8i9j0
                  </p>
                </div>
                
                <button
                  className="w-full whitespace-nowrap px-6 py-3 rounded-[40px] font-bold text-[13px] transition-all hover:brightness-105 active:scale-95 shadow-sm"
                  style={{ backgroundColor: "#385E31", color: "#FFFCEB" }}
                >
                  Generate New QR Code
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}