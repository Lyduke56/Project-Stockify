"use client";

import React, { useState } from "react";
import Sidebar from "@/components/navbars/sidebar-superadmin";
import NavbarApp from "@/components/navbars/navbar-superadmin";

// --- REUSABLE UI COMPONENTS ---

function SectionCard({
  iconPath,
  title,
  children,
}: {
  iconPath: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="w-full px-6 sm:px-9 pt-5 pb-9 bg-[#385E31] rounded-[10px] shadow-[2px_4px_18px_0px_rgba(0,0,0,0.25)] flex flex-col gap-4">
      <div className="flex justify-start items-center gap-4">
        <div className="w-10 h-10 flex justify-center items-center">
          <img src={iconPath} alt={title} className="w-full h-full object-contain" />
        </div>
        <div className="flex-1 text-[#FFFCEB] text-2xl sm:text-3xl font-bold font-['Inter']">
          {title}
        </div>
      </div>
      <div className="w-full p-6 bg-[#FFFCEB] rounded-[5px] flex flex-col gap-7">
        {children}
      </div>
    </div>
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
      className={`bg-[#FFD980] placeholder-[#3A6131]/70 text-[#3A6131] font-semibold text-[15px] px-5 py-2.5 rounded-[5px] outline outline-1 outline-offset-[-1px] outline-[#3A6131]/40 w-full cursor-default ${className}`}
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
        className="bg-[#FFD980] placeholder-[#3A6131]/70 text-[#3A6131] font-semibold text-[15px] px-5 py-2.5 rounded-[5px] outline outline-1 outline-offset-[-1px] outline-[#3A6131]/40 w-full truncate cursor-default pr-24"
      />
      <button
        type="button"
        className="absolute right-2 shrink-0 bg-[#385E31] text-[#FFD980] font-bold text-[11px] px-4 py-1.5 rounded-[12px] hover:bg-[#2D4B24] transition shadow-sm"
      >
        View
      </button>
    </div>
  );
}

// --- MAIN PAGE COMPONENT ---
export default function TenantReview() {
  // Mock data updated: Removed separate name fields and combined into ownerFullName
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

      {/* RIGHT SIDE: Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-y-auto px-10 md:px-20 pt-5 pb-12">
        
        <NavbarApp />

        {/* Page Header */}
        <div className="w-full flex flex-col items-center mt-10 mb-8 gap-2">
          <h1 className="text-[#385E31] text-[30px] font-extrabold tracking-wide uppercase">
            TENANT REVIEW
          </h1>
          <div className="w-full max-w-[900px] h-1.5 bg-[#F7B71D] rounded-full" />
        </div>

        {/* Form Container */}
        <div className="w-full max-w-5xl mx-auto flex flex-col gap-10">
          
          {/* Section 1: Business Owner */}
          <SectionCard 
            iconPath="/business-owner.svg" 
            title="Business Owner’s Information"
          >
            <div className="flex flex-col md:flex-row gap-5 items-stretch w-full">
              
              {/* Left Column: Profile Picture Box */}
              <div className="w-full md:w-[220px] shrink-0 relative">
                <div className="relative w-full aspect-square bg-[#FFD980] rounded-[5px] outline outline-1 outline-[#3A6131]/40 flex flex-col items-center justify-center overflow-hidden">
                   <div className="w-full h-full flex items-center justify-center">
                     <img src="/business-owner.svg" alt="Owner Picture" className="w-32 h-32 object-contain opacity-70" />
                   </div>
                </div>
              </div>

              {/* Right Column: 4 Rows of Details */}
              <div className="flex-1 flex flex-col justify-between gap-4">
                <div className="w-full">
                  <ReadOnlyField placeholder="Full Name *" value={reviewData.ownerFullName} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <ReadOnlyField placeholder="Gender *" value={reviewData.gender} />
                  <ReadOnlyField placeholder="Email Address *" value={reviewData.email} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
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
          >
            <div className="flex flex-col md:flex-row gap-5 items-stretch w-full">
              
              {/* Logo Box */}
              <div className="w-full md:w-[220px] shrink-0 relative">
                <div className="relative w-full aspect-square bg-[#FFD980] rounded-[5px] outline outline-1 outline-[#3A6131]/40 flex flex-col items-center justify-center overflow-hidden">
                  <div className="w-full h-full flex items-center justify-center">
                    <img src="/business-details.svg" alt="Business Logo" className="w-32 h-32 object-contain opacity-70" />
                  </div>
                </div>
              </div>

              {/* Right Column: 4 Rows of Details */}
              <div className="flex-1 w-full flex flex-col justify-between gap-4">
                <div className="w-full">
                  <ReadOnlyField placeholder="Business Name *" value={reviewData.businessName} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <ReadOnlyField placeholder="Business Type *" value={reviewData.businessType} />
                  <ReadOnlyField placeholder="Owner Full Name (as on permit) *" value={reviewData.ownerFullName} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
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
          <div className="flex justify-center items-center gap-6 mt-4">
            <button className="bg-[#F7B71D] text-[#385E31] font-bold text-[20px] px-20 py-3 rounded-[40px] hover:opacity-90 transition-opacity shadow-md">
              Approve
            </button>
            <button className="bg-[#385E31] text-[#FFFCEB] font-bold text-[20px] px-20 py-3 rounded-[40px] hover:opacity-90 transition-opacity shadow-md">
              Decline
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}