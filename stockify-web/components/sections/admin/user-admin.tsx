<<<<<<< Updated upstream
export default function UserAdmin() {
  return (
    <>
      <header className="mb-8 text-center">
=======
"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

import NewEmployeeModal from "@/components/modals/admin/new-employee-modal";
import StaffAdminTable from "@/components/tables/user-admin-staff";
import CustomerAdminTable from "@/components/tables/user-admin-customers";
import SearchBox from "@/components/inputs/searchbox";

const supabase = createClient();

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
    setTableKey((k) => k + 1); // remounts StaffAdminTable → triggers refetch
    setIsModalOpen(false);
  }

  return (
    <div className="flex flex-col">
      <header className="mb-8 text-center flex flex-col items-center justify-center">
>>>>>>> Stashed changes
        <h1 className="text-[#385E31] text-3xl font-bold font-['Inter'] uppercase tracking-widest">
          User Administration
        </h1>
        <div className="w-full h-1 bg-[#F7B71D] mt-2 rounded-full opacity-50" />
      </header>

<<<<<<< Updated upstream
      <div className="flex flex-col gap-6">
        <h2 className="text-[#385E31] text-4xl font-bold font-['Inter']">
          Hello, Client!
=======
      {/* Staff Accounts */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[#385E31] text-2xl font-bold font-['Inter'] uppercase tracking-widest">
              Staff Accounts
            </h2>
            <p className="text-[#385E31] text-sm font-medium font-['Inter']">
              CAPACITY: 3 / 3 Employees Provisioned
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 rounded-[10px] font-semibold font-['Inter'] text-sm transition-all hover:brightness-105 active:scale-95"
            style={{ backgroundColor: "#E5AC24", color: "#24481F" }}
          >
            + New Employee
          </button>
        </div>

        <SearchBox placeholder="Search" onChange={(val) => console.log(val)} />

        {/* key remounts the table after a new employee is added */}
        <StaffAdminTable key={tableKey} userId={userId ?? ""} />
      </div>

      <div className="w-full h-1 bg-[#385E31] rounded-full opacity-100 mb-4 mt-6" />

      {/* Registered Customers */}
      <div className="flex flex-col gap-4">
        <h2 className="text-[#385E31] text-2xl font-bold font-['Inter'] uppercase tracking-widest">
          Registered Customers
>>>>>>> Stashed changes
        </h2>
        <p className="text-stone-400 font-medium">Shop Name Corporation, Inc.</p>

<<<<<<< Updated upstream
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
          <div className="h-40 bg-[#385E31] rounded-xl shadow-lg border-b-8 border-[#F7B71D]" />
          <div className="h-40 bg-[#385E31] rounded-xl shadow-lg border-b-8 border-[#F7B71D]" />
          <div className="h-40 bg-[#385E31] rounded-xl shadow-lg border-b-8 border-[#F7B71D]" />
        </div>
      </div>
    </>
=======
        <SearchBox placeholder="Search" onChange={(val) => console.log(val)} />

        <CustomerAdminTable />
      </div>

      <NewEmployeeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleEmployeeCreated} 
      />
    </div>
>>>>>>> Stashed changes
  );
}