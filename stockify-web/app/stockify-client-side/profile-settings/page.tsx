"use client";

import SidebarClient from "@/components/navbars/sidebar-client";
import NavbarClient from "@/components/navbars/navbar-client";
import { motion } from "framer-motion";
import { useState } from "react";

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

export default function ClientProfileSettings() {
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
    <div className="min-h-screen bg-white flex overflow-x-hidden">
      <SidebarClient active="dashboard" />

      <main className="ml-64 flex-1 px-4 py-6 sm:px-6 sm:py-8">
        <div className="mx-auto w-full max-w-6xl space-y-6">
          {/* TOP BAR */}
          <NavbarClient />

          {/* TAB HEADER */}
          <section className="w-full h-12 inline-flex flex-col justify-start items-start gap-[3.23px]">
            <div className="self-stretch h-7 relative">
              <div className="left-5 top-[-1.62px] absolute justify-start text-lime-800 text-2xl font-bold font-['Inter'] leading-7">Profile </div>
            </div>
            <div className="self-stretch h-5 relative">
              <div className="left-5 top-[-1.62px] absolute justify-start text-lime-800/70 text-xs font-normal font-['Inter'] leading-5">Manage and update client and business information</div>
            </div>
          </section>

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
        </div>

          {/* Help Section */}
            <section className="w-[965.42px] h-10 relative">
            <div className="w-4 h-4 left-0 top-[1.62px] absolute overflow-hidden">
                <div className="w-3.5 h-3.5 left-[1.35px] top-[1.35px] absolute outline outline-[1.35px] outline-offset-[-0.67px] outline-blue-600" />
                <div className="w-0 h-[2.70px] left-[8.09px] top-[5.39px] absolute outline outline-[1.35px] outline-offset-[-0.67px] outline-blue-600" />
                <div className="w-[0.01px] h-0 left-[8.09px] top-[10.78px] absolute outline outline-[1.35px] outline-offset-[-0.67px] outline-blue-600" />
            </div>
            <div className="w-96 h-10 left-[25.88px] top-0 absolute inline-flex flex-col justify-start items-start gap-[3.23px]">
                <div className="self-stretch h-5 relative">
                <div className="left-0 top-[-1.62px] absolute justify-start text-blue-900 text-xs font-medium font-['Inter'] leading-5">Need help with billing?</div>
                </div>
                <div className="self-stretch h-4 inline-flex justify-start items-start">
                <div className="justify-start"><span className="text-blue-700 text-xs font-normal font-['Inter'] leading-4">Contact our support team at </span><span className="text-blue-700 text-xs font-normal font-['Inter'] underline leading-4">billing@stockify.com</span><span className="text-blue-700 text-xs font-normal font-['Inter'] leading-4">.</span></div>
                </div>
            </div>
            </section>
          
        </div>
      </main>
    </div>
  );
}

