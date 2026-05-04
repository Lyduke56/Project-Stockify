"use client";

import type { SectionKey } from "@/app/superadmin/dashboard/page"; 

interface NavbarSuperAdminProps {
  setActiveSection: (section: SectionKey) => void;
  openNotifs: () => void;
  openProfile: () => void;
}

export default function NavbarSuperAdmin({ 
  setActiveSection, 
  openNotifs, 
  openProfile 
}: NavbarSuperAdminProps) {
  return (
    <nav className="relative w-full h-[48px] px-4 md:px-12 bg-[#F7B71D] rounded-[50px] shadow-[2px_4px_4px_0px_rgba(43,88,12,0.70)] flex items-center justify-between z-[100]">

      {/* Brand Click Redirects to Dashboard */}
      <div
        className="flex items-center gap-1.5 cursor-pointer select-none"
        onClick={() => setActiveSection("dashboard")}
      >
        <div className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center">
          <img src="/stockify-logo-1.svg" alt="Stockify Icon" className="h-7 md:h-9 w-auto" /> 
        </div>
        <div className="text-[#385E31] text-xl md:text-3xl font-bold font-fredoka uppercase">
          STOCKIFY
        </div>
      </div>

      <div className="flex items-center gap-4 md:gap-8">
        {/* Home Button */}
        <button
          onClick={() => setActiveSection("dashboard")}
          className="w-7 h-7 md:w-8 md:h-8 flex items-center justify-center hover:scale-110 transition-all cursor-pointer"
          title="Home"
        >
          <img src="/navbar-home.svg" alt="Home" className="w-full h-full object-contain" />
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={openNotifs}
            className="w-7 h-7 md:w-8 md:h-8 flex items-center justify-center hover:scale-110 transition-all cursor-pointer"
            title="Notifications"
          >
            <img src="/navbar-notif.svg" alt="Notifications" className="w-full h-full object-contain" />
            <div className="absolute -top-1 -right-1 w-2 md:w-2.5 h-2 md:h-2.5 bg-red-600 rounded-full border border-white" />
          </button>
        </div>

        {/* Profile */}
        <button
          onClick={openProfile}
          className="w-7 h-7 md:w-8 md:h-8 flex items-center justify-center hover:scale-110 transition-all cursor-pointer"
          title="Profile Settings"
        >
          <img src="/navbar-profile-settings.svg" alt="Profile Settings" className="w-full h-full object-contain" />
        </button>
      </div>
    </nav>
  );
}