"use client";

import type { SectionKey } from "@/app/[businessName]/administrator/dashboard/page";

interface NavbarAdminProps {
  setActiveSection: (section: SectionKey) => void;
  openProfile: () => void;
  openNotifs: () => void;
  openSettings: () => void;
}

// Destructure the new modal props here
export default function NavbarAdmin({ 
  setActiveSection, 
  openProfile, 
  openNotifs,
  openSettings
}: NavbarAdminProps) {

  return (
    <nav className="relative w-full h-[60px] px-8 bg-[#F7B71D] rounded-[50px] shadow-[2px_4px_4px_0px_rgba(43,88,12,0.70)] flex items-center justify-between z-[100]">
      
      {/* LEFT: Logo */}
      <div 
        className="flex items-center gap-2 cursor-pointer select-none" 
        onClick={() => setActiveSection("dashboard")}
      >
        <img src="/stockify-logo-1.svg" alt="Logo" className="h-8 w-auto" />
        <div className="text-[#385E31] text-2xl font-bold font-['Inter']">STOCKIFY</div>
      </div>

      {/* RIGHT: Quick Actions */}
      <div className="flex items-center gap-6">
        {/* Home */}
        <button 
          onClick={() => setActiveSection("dashboard")} 
          className="hover:scale-110 transition-transform"
        >
          <img src="/navbar-home.svg" alt="Home" className="w-6 h-6" />
        </button>

        {/* Notifications Button - Now triggers the Modal */}
        <div className="relative">
          <button 
            onClick={openNotifs} 
            className="hover:scale-110 transition-transform"
          >
            <img src="/navbar-notif.svg" alt="Notifications" className="w-6 h-6" />
            <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-600 rounded-full border border-white" />
          </button>
        </div>

        {/* Profile Button - Now triggers the Profile Modal */}
        <div className="relative">
          <button 
            onClick={openProfile} 
            className="hover:scale-110 transition-transform"
          >
            <img 
              src="/navbar-profile-settings.svg" 
              alt="Profile" 
              className="w-8 h-8 rounded-full border border-[#385E31]" 
            />
          </button>
        </div>
      </div>
    </nav>
  );
}