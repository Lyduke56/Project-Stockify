"use client";

import React from "react";
import { motion } from "framer-motion";

export default function StorefrontSection() {
  const colorSettings = [
    { label: "Primary Color", val: "#FF7272" },
    { label: "Accents", val: "#FF7272" },
    { label: "Secondary Color", val: "#FF7272" },
    { label: "Background", val: "#FFFCEB" },
    { label: "Tertiary Color", val: "#FF7272" },
  ];

  const layoutSettings = [
    { label: "Typography", val: "Inter" },
    { label: "Highlighted Product", val: "Carousel Layout" },
    { label: "Other Product", val: "Card Layout" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="flex flex-col w-full min-h-screen bg-[#FFFCEB] font-['Inter'] pt-5 pb-12"
    >
      {/* PAGE HEADER */}
      <motion.header
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="w-full flex flex-col items-center mb-12 gap-2"
      >
        <h1 className="text-[#385E31] text-[30px] font-extrabold uppercase">
          Storefront Configuration
        </h1>
        <div className="w-full max-w-[900px] h-1.5 bg-[#F7B71D] rounded-full opacity-60" />
      </motion.header>

      {/* WELCOME SECTION */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex flex-col gap-1 mb-8"
      >
        <h2 className="text-[#385E31] text-[26px] font-extrabold uppercase">
          Welcome to the storefront, Client!
        </h2>
        <p className="text-[#385E31]/70 text-sm font-medium">
          Utilize the parameters below to give life to your store.
        </p>
      </motion.div>

      {/* CONFIGURATION GRIDS */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="flex flex-col gap-8 w-full"
      >
        {/* Media Assets Container */}
        <div className="flex flex-col gap-4 p-6 w-full bg-[#FFFCEB] rounded-[10px] border border-[#385E31] shadow-sm">
          <h3 className="text-[#385E31] text-[16px] font-extrabold uppercase mb-2">Media Assets</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="flex items-center gap-4">
              <label className="text-[#385E31] font-bold text-sm w-28 shrink-0">Shop Logo</label>
              <div className="flex-1 flex gap-2">
                <input
                  type="text"
                  placeholder="filename.png"
                  readOnly
                  className="w-full border border-[#385E31] rounded-full px-5 py-2 bg-transparent text-[#385E31] placeholder-[#385E31]/60 outline-none font-medium text-sm"
                />
                <button
                  className="whitespace-nowrap px-6 py-2 rounded-[40px] font-bold text-[13px] transition-all hover:brightness-105 active:scale-95 shadow-sm"
                  style={{ backgroundColor: "#385E31", color: "#FFFCEB" }}
                >
                  Upload
                </button>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <label className="text-[#385E31] font-bold text-sm w-28 shrink-0">Banner Image</label>
              <div className="flex-1 flex gap-2">
                <input
                  type="text"
                  placeholder="filename.png"
                  readOnly
                  className="w-full border border-[#385E31] rounded-full px-5 py-2 bg-transparent text-[#385E31] placeholder-[#385E31]/60 outline-none font-medium text-sm"
                />
                <button
                  className="whitespace-nowrap px-6 py-2 rounded-[40px] font-bold text-[13px] transition-all hover:brightness-105 active:scale-95 shadow-sm"
                  style={{ backgroundColor: "#385E31", color: "#FFFCEB" }}
                >
                  Upload
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Brand Styles Container */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Colors */}
          <div className="flex flex-col gap-4 p-6 w-full bg-[#FFFCEB] rounded-[10px] border border-[#385E31] shadow-sm">
            <h3 className="text-[#385E31] text-[16px] font-extrabold uppercase mb-2">Brand Colors</h3>
            <div className="flex flex-col gap-4">
              {colorSettings.map((item) => (
                <div key={item.label} className="flex items-center gap-4">
                  <label className="text-[#385E31] font-bold text-sm w-32 shrink-0">{item.label}</label>
                  <div className="flex-1 flex items-center gap-3">
                    <input
                      type="text"
                      defaultValue={item.val}
                      className="w-full border border-[#385E31] rounded-full px-5 py-2 bg-transparent text-[#385E31] outline-none font-medium text-sm uppercase"
                    />
                    <div 
                      className="w-9 h-9 rounded-full shrink-0 border border-[#385E31] shadow-inner"
                      style={{ backgroundColor: item.val }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Layout Preferences */}
          <div className="flex flex-col gap-4 p-6 w-full bg-[#FFFCEB] rounded-[10px] border border-[#385E31] shadow-sm">
            <h3 className="text-[#385E31] text-[16px] font-extrabold uppercase mb-2">Layout & Typography</h3>
            <div className="flex flex-col gap-4">
              {layoutSettings.map((item) => (
                <div key={item.label} className="flex items-center gap-4">
                  <label className="text-[#385E31] font-bold text-sm w-36 shrink-0">{item.label}</label>
                  <div className="relative w-full">
                    <select className="w-full border border-[#385E31] rounded-full px-5 py-2 bg-transparent text-[#385E31] outline-none font-medium text-sm appearance-none cursor-pointer">
                      <option>{item.val}</option>
                    </select>
                    {/* Custom Dropdown Chevron */}
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#385E31]">
                      <svg width="12" height="8" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* SEPARATOR */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="w-full h-[2px] bg-[#385E31]/20 rounded-full my-12" 
      />

      {/* LIVE PREVIEW */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="flex flex-col gap-6"
      >
        <h2 className="text-[#385E31] text-[26px] font-extrabold uppercase">
          Live Preview
        </h2>
        
        <div className="rounded-[10px] border border-[#385E31] overflow-hidden shadow-md bg-white aspect-video relative group">
          <div className="absolute inset-0 bg-[#385E31]/5 group-hover:bg-transparent transition-colors z-10" />
          <img
            src="/api/placeholder/1200/675"
            alt="Storefront Preview"
            className="w-full h-full object-cover opacity-90 transition-opacity group-hover:opacity-100"
          />
          <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
            <span 
              className="px-6 py-2.5 rounded-full text-[12px] font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0 shadow-lg backdrop-blur-sm"
              style={{ backgroundColor: "rgba(56, 94, 49, 0.9)", color: "#FFFCEB" }}
            >
              Interactive Preview Mode
            </span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}