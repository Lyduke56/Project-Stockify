"use client";

import type { SectionKey } from "@/app/[businessName]/administrator/dashboard/page";

interface NavbarAdminProps {
  setActiveSection: (section: SectionKey) => void;
  openProfile: () => void;
  openNotifs: () => void;
  openSettings: () => void;
}

export default function NavbarAdmin({ 
  setActiveSection, 
  openProfile, 
  openNotifs,
  openSettings
}: NavbarAdminProps) {

  return (
    <nav className="relative w-full h-[48px] px-4 md:px-12 bg-[#F7B71D] rounded-[50px] shadow-[2px_4px_4px_0px_rgba(43,88,12,0.70)] flex items-center justify-between z-[100]">
      
      {/* LEFT SIDE: Logo and Brand Name */}
      <div 
        className="flex items-center gap-1.5 cursor-pointer select-none" 
        onClick={() => setActiveSection("dashboard")}
      >
        <div className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center">
          <img
            src="/stockify-logo-1.svg"
            alt="Stockify Icon"
            className="h-7 md:h-9 w-auto"
          />
        </div>
        <div className="text-[#385E31] text-xl md:text-3xl font-bold font-fredoka">
          STOCKIFY
        </div>
      </div>

      {/* RIGHT SIDE: Navigation Icons */}
      <div className="flex items-center gap-4 md:gap-8">
        
        {/* Home Icon */}
        <button
          onClick={() => setActiveSection("dashboard")} 
          className="w-7 h-7 md:w-8 md:h-8 flex items-center justify-center hover:opacity-75 hover:scale-105 transition-all cursor-pointer"
          title="Home"
        >
          <img 
            src="/navbar-home.svg" 
            alt="Home" 
            className="w-full h-full object-contain" 
          />
        </button>

        {/* Notifications Icon */}
        <div className="relative flex items-center justify-center">
          <button
            onClick={openNotifs} 
            className="w-7 h-7 md:w-8 md:h-8 flex items-center justify-center hover:opacity-75 hover:scale-105 transition-all cursor-pointer"
            title="Notifications"
          >
            <img 
              src="/navbar-notif.svg" 
              alt="Notifications" 
              className="w-full h-full object-contain" 
            />
          </button>
          {/* Notification Red Dot */}
          <div className="absolute -top-1 -right-1 w-2 md:w-2.5 h-2 md:h-2.5 bg-red-600 rounded-full border border-white" />
        </div>

        {/* Profile Settings Icon */}
        <button
          onClick={openProfile} 
          className="w-7 h-7 md:w-8 md:h-8 flex items-center justify-center hover:opacity-75 hover:scale-105 transition-all cursor-pointer"
          title="Profile Settings"
        >
          <img 
            src="/navbar-profile-settings.svg" 
            alt="Profile Settings" 
            className="w-full h-full object-contain" 
          />
        </button>

      </div>
    </nav>
  );
}