"use client";

import NavbarAdmin from "@/components/navbars/navbar-admin";
import SidebarAdmin from "@/components/navbars/sidebar-admin";

export default function AdminDashboard() {
  return (
    <div className="flex min-h-screen bg-[#FFFCF0]">
      {/* 1. Sidebar on the left */}
      <SidebarAdmin />

      {/* 2. Main content area on the right */}
      <div className="flex-1 flex flex-col h-full overflow-y-auto px-20 pt-5 pb-12">
        {/* Navbar at the top */}
        <NavbarAdmin />

        {/* Dashboard Content */}
        <main className="p-10">
          <header className="mb-8 text-center">
            <h1 className="text-[#385E31] text-3xl font-bold font-['Inter'] uppercase tracking-widest">
              Admin Dashboard
            </h1>
            <div className="w-full h-1 bg-[#F7B71D] mt-2 rounded-full opacity-50" />
          </header>

          <div className="flex flex-col gap-6">
            <h2 className="text-[#385E31] text-4xl font-bold font-['Inter']">
              Hello, Client!
            </h2>
            <p className="text-stone-400 font-medium">Shop Name Corporation, Inc.</p>
            
            {/* You can start building your Stats Cards here next! */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
               {/* Stats Cards Placeholder */}
               <div className="h-40 bg-[#385E31] rounded-xl shadow-lg border-b-8 border-[#F7B71D]"></div>
               <div className="h-40 bg-[#385E31] rounded-xl shadow-lg border-b-8 border-[#F7B71D]"></div>
               <div className="h-40 bg-[#385E31] rounded-xl shadow-lg border-b-8 border-[#F7B71D]"></div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}