"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { motion } from "framer-motion"; // Added for animations

import NewEmployeeModal from "@/components/modals/admin/new-employee-modal";
import StaffAdminTable from "@/components/tables/user-admin-staff";
import CustomerAdminTable from "@/components/tables/user-admin-customers";

const supabase = createClient();

// Custom Search Icon to match reference
const SearchIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"></circle>
    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
  </svg>
);

export default function UserAdminSection() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [tableKey, setTableKey] = useState(0);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id ?? null);
    });
  }, []);

  function handleEmployeeCreated() {
    setTableKey((k) => k + 1);
    setIsModalOpen(false);
  }

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
          User Administration
        </h1>
        <div className="w-full max-w-[900px] h-1.5 bg-[#F7B71D] rounded-full opacity-60" />
      </motion.header>

      {/* STAFF ACCOUNTS SECTION */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex flex-col gap-6"
      >
        <div className="flex items-end justify-between">
          <div className="flex flex-col gap-1">
            <h2 className="text-[#385E31] text-[26px] font-extrabold uppercase">
              Staff Accounts
            </h2>
          </div>
          
        </div>

        {/* NEW: Flex container to hold Search and Button on the same line */}
        <div className="flex items-center justify-between w-full gap-4">
          {/* Styled Search Bar */}
          <div className="relative w-full max-w-[500px]">
            <input 
              type="text" 
              placeholder="Search employees..." 
              className="w-full border border-[#385E31] rounded-full px-5 py-2.5 bg-transparent text-[#385E31] placeholder-[#385E31]/60 outline-none font-medium text-sm" 
            />
            <div className="absolute right-4 top-3 text-[#385E31]">
              <SearchIcon />
            </div>
          </div>

          {/* Add Button - now positioned at the farthest right */}
          <button
            onClick={() => setIsModalOpen(true)}
            className="whitespace-nowrap px-8 py-2.5 rounded-[40px] font-bold text-[14px] transition-all hover:brightness-105 active:scale-95 shadow-sm"
            style={{ backgroundColor: "#E5AC24", color: "#24481F" }}
          >
            + Add Employee
          </button>
        </div>

        {/* Table Container */}
        <div className="w-full bg-[#FFFCEB] rounded-[10px] border border-[#385E31] overflow-hidden shadow-sm">
          <StaffAdminTable key={tableKey} userId={userId ?? ""} />
        </div>
      </motion.div>

      {/* SEPARATOR */}
      <div className="w-full h-[2px] bg-[#385E31]/20 rounded-full my-12" />

      {/* REGISTERED CUSTOMERS SECTION */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="flex flex-col gap-6"
      >
        <h2 className="text-[#385E31] text-[26px] font-extrabold uppercase">
          Registered Customers
        </h2>

        <div className="relative w-full max-w-[600px]">
          <input 
            type="text" 
            placeholder="Search customers..." 
            className="w-full border border-[#385E31] rounded-full px-5 py-2.5 bg-transparent text-[#385E31] placeholder-[#385E31]/60 outline-none font-medium text-sm" 
          />
          <div className="absolute right-4 top-3 text-[#385E31]">
            <SearchIcon />
          </div>
        </div>

        <div className="w-full bg-[#FFFCEB] rounded-[10px] border border-[#385E31] overflow-hidden shadow-sm">
          <CustomerAdminTable />
        </div>
      </motion.div>

      {/* MODAL */}
      <NewEmployeeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleEmployeeCreated}
      />
    </motion.div>
  );
}