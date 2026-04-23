"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import Sidebar from "@/components/navbars/sidebar-superadmin";
import NavbarApp from "@/components/navbars/navbar-superadmin";

// --- REUSABLE UI COMPONENTS ---

function SectionCard({
  iconPath,
  title,
  children,
  delay = 0,
}: {
  iconPath: string;
  title: string;
  children: React.ReactNode;
  delay?: number; 
}) {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 25, delay: delay }}
      className="w-full px-6 sm:px-8 pt-4 pb-5 bg-[#385E31] rounded-[10px] shadow-[2px_4px_18px_0px_rgba(0,0,0,0.25)] flex flex-col gap-3"
    >
      <div className="flex justify-start items-center gap-3">
        <div className="w-8 h-8 flex justify-center items-center">
          <img src={iconPath} alt={title} className="w-full h-full object-contain" />
        </div>
        <div className="flex-1 text-[#FFF9D7] text-[22px] sm:text-[26px] font-bold font-['Inter']">
          {title}
        </div>
      </div>
      <div className="w-full p-4 sm:p-5 bg-[#FFF9D7] rounded-[5px] flex flex-col gap-4">
        {children}
      </div>
    </motion.div>
  );
}

function ReadOnlyField({
  placeholder,
  value,
  className = "",
}: {
  placeholder: string;
  value: string;
  className?: string;
}) {
  return (
    <input
      type="text"
      placeholder={placeholder}
      value={value}
      readOnly
      className={`bg-[#FFD980] placeholder-[#3A6131]/70 text-[#3A6131] font-semibold text-[14px] px-4 py-2 rounded-[5px] outline outline-1 outline-offset-[-1px] outline-[#3A6131]/40 w-full cursor-default ${className}`}
    />
  );
}

function DocumentField({
  label,
  fileName,
}: {
  label: string;
  fileName: string;
}) {
  return (
    <div className="flex items-center gap-2 w-full h-full relative">
      <input
        value={fileName}
        readOnly
        placeholder={label}
        className="bg-[#FFD980] placeholder-[#3A6131]/70 text-[#3A6131] font-semibold text-[14px] px-4 py-2 rounded-[5px] outline outline-1 outline-offset-[-1px] outline-[#3A6131]/40 w-full truncate cursor-default pr-24"
      />
      <button
        type="button"
        className="absolute right-2 shrink-0 bg-[#385E31] text-[#FFD980] font-bold text-[11px] px-4 py-1 rounded-[12px] hover:bg-[#2D4B24] transition shadow-sm"
      >
        View
      </button>
    </div>
  );
}

// --- MAIN PAGE COMPONENT ---
export default function TenantReview() {
  const [reviewData] = useState({
    ownerFullName: "Benideck M. Longakit",
    gender: "Male",
    email: "benideck@example.com",
    citizenship: "Filipino",
    contactNumber: "+63 912 345 6789",
    address: "123 Mango Avenue, Cebu City",
    businessName: "Tech IT Hub",
    businessType: "Non-Food & Beverage",
    businessPermitName: "tech_it_hub_permit_2026.pdf",
    ownerValidIdName: "benideck_id.pdf",
    warehouseAddress: "456 IT Park Blvd, Cebu City",
  });

  return (
    <div className="flex h-screen w-full bg-[#FFFCEB] overflow-hidden font-['Inter']">
      
      {/* LEFT SIDE: Fixed Sidebar */}
      <Sidebar />

      {/* RIGHT SIDE: Main Content Wrapper with Slide/Fade-in */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="flex-1 flex flex-col h-full overflow-y-auto px-10 md:px-20 pt-5 pb-12"
      >
        
        <NavbarApp />

        {/* Page Header */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="w-full flex flex-col items-center mt-10 mb-8 gap-2"
        >
          <h1 className="text-[#385E31] text-[30px] font-extrabold tracking-wide uppercase">
            TENANT REVIEW
          </h1>
          <div className="w-full max-w-[900px] h-1.5 bg-[#F7B71D] rounded-full" />
        </motion.div>

        {/* Form Container */}
        <div className="w-full max-w-5xl mx-auto flex flex-col gap-8">
          
          {/* Section 1: Business Owner */}
          <SectionCard 
            iconPath="/business-owner.svg" 
            title="Business Owner’s Information"
            delay={0.2}
          >
            <div className="flex flex-col md:flex-row gap-5 items-stretch w-full">
              
              {/* Left Column: Scaled down Profile Picture Box */}
              <div className="w-full md:w-[180px] shrink-0 relative">
                <div className="relative w-full aspect-square bg-[#FFD980] rounded-[5px] outline outline-1 outline-[#3A6131]/40 flex flex-col items-center justify-center overflow-hidden">
                   <div className="w-full h-full flex items-center justify-center">
                     <img src="/business-owner.svg" alt="Owner Picture" className="w-24 h-24 object-contain opacity-70" />
                   </div>
                </div>
              </div>

              {/* Right Column: Tighter gap between rows */}
              <div className="flex-1 flex flex-col justify-between gap-3">
                <div className="w-full">
                  <ReadOnlyField placeholder="Full Name *" value={reviewData.ownerFullName} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <ReadOnlyField placeholder="Gender *" value={reviewData.gender} />
                  <ReadOnlyField placeholder="Email Address *" value={reviewData.email} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <ReadOnlyField placeholder="Citizenship *" value={reviewData.citizenship} />
                  <ReadOnlyField placeholder="Contact No. *" value={reviewData.contactNumber} />
                </div>
                <div className="w-full">
                  <ReadOnlyField placeholder="Permanent Address *" value={reviewData.address} />
                </div>
              </div>
            </div>
          </SectionCard>

          {/* Section 2: Business Details */}
          <SectionCard 
            iconPath="/business-details.svg" 
            title="Business Details"
            delay={0.3}
          >
            <div className="flex flex-col md:flex-row gap-5 items-stretch w-full">
              
              {/* Scaled down Logo Box */}
              <div className="w-full md:w-[180px] shrink-0 relative">
                <div className="relative w-full aspect-square bg-[#FFD980] rounded-[5px] outline outline-1 outline-[#3A6131]/40 flex flex-col items-center justify-center overflow-hidden">
                  <div className="w-full h-full flex items-center justify-center">
                    <img src="/business-details.svg" alt="Business Logo" className="w-24 h-24 object-contain opacity-70" />
                  </div>
                </div>
              </div>

              {/* Right Column: Tighter gap between rows */}
              <div className="flex-1 w-full flex flex-col justify-between gap-3">
                <div className="w-full">
                  <ReadOnlyField placeholder="Business Name *" value={reviewData.businessName} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <ReadOnlyField placeholder="Business Type *" value={reviewData.businessType} />
                  <ReadOnlyField placeholder="Owner Full Name (as on permit) *" value={reviewData.ownerFullName} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <DocumentField label="Owner's Valid ID *" fileName={reviewData.ownerValidIdName} />
                  <DocumentField label="Business Permit *" fileName={reviewData.businessPermitName} />
                </div>
                <div className="w-full">
                  <ReadOnlyField placeholder="Business/Warehouse Address *" value={reviewData.warehouseAddress} />
                </div>
              </div>
            </div>
          </SectionCard>

          {/* Action Buttons */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 25, delay: 0.4 }}
            className="flex justify-center items-center gap-6 mt-2"
          >
            <button className="bg-[#F7B71D] text-[#385E31] font-bold text-[18px] px-16 py-2.5 rounded-[40px] hover:opacity-90 transition-opacity shadow-md">
              Approve
            </button>
            <button className="bg-[#385E31] text-[#FFFCEB] font-bold text-[18px] px-16 py-2.5 rounded-[40px] hover:opacity-90 transition-opacity shadow-md">
              Decline
            </button>
          </motion.div>

        </div>
      </motion.div>
    </div>
  );
}