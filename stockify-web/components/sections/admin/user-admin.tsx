"use client";
import { useState } from "react";
import NewEmployeeModal from "@/components/modals/new-employee-modal";

export default function UserAdminSection() {
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* ... previous header code ... */}

      <div className="flex justify-between items-end mb-2">
        <div className="space-y-1">
          <h3 className="text-[#385E31] font-black text-xl uppercase tracking-tighter">Staff Accounts</h3>
          <p className="text-[#385E31] text-[10px] font-bold opacity-60">CAPACITY: 3 / 3 Employees Provisioned</p>
        </div>
        <button 
          onClick={() => setIsEmployeeModalOpen(true)}
          className="bg-[#F7B71D] text-[#385E31] px-8 py-3 rounded-full font-black text-xs shadow-md hover:scale-105 transition-all"
        >
          + New Employee
        </button>
      </div>

      {/* Render the Modal */}
      <NewEmployeeModal 
        isOpen={isEmployeeModalOpen} 
        onClose={() => setIsEmployeeModalOpen(false)} 
      />

      {/* ... rest of your tables ... */}
    </div>
  );
}