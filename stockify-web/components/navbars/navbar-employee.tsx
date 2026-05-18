"use client";

import { useRouter } from "next/navigation";
import type { SectionKey } from "@/app/[businessName]/employee/dashboard/page";

interface NavbarEmployeeProps {
  setActiveSection: (section: SectionKey) => void;
  openProfile: () => void;
  openNotifs: () => void;
  openSettings: () => void;
}

export default function NavbarEmployee({ 
  setActiveSection,
  openProfile, 
  openNotifs, 
  openSettings 
}: NavbarEmployeeProps) {
  const router = useRouter();

  return (
    <nav className="relative w-full h-[55px] px-12 bg-[var(--color-accent)] rounded-[50px] shadow-[2px_4px_4px_0px_rgba(43,88,12,0.70)] flex items-center justify-between z-[50]">
      
      {/* LEFT SIDE: Logo & Brand */}
      <div 
        className="flex items-center gap-1.5 cursor-pointer select-none" 
        onClick={() => setActiveSection("dashboard")}
      >
        <div className="w-12 h-12 flex items-center justify-center">
          <img
            src="/stockify-logo-1.svg"
            alt="Stockify Logo"
            className="h-9 w-auto"
          />
        </div>
        <div className="text-[var(--color-primary)] text-3xl font-bold font-fredoka tracking-tight">
          STOCKIFY
        </div>
      </div>

      {/* RIGHT SIDE: Quick Actions */}
      <div className="flex items-center gap-8">
        
        {/* Home Icon */}
        <button
          onClick={() => setActiveSection("dashboard")}
          className="w-8 h-8 flex items-center justify-center hover:opacity-75 hover:scale-105 transition-all cursor-pointer"
          title="Home"
        >
          <img src="/navbar-home.svg" alt="Home" className="w-full h-full object-contain" />
        </button>

        {/* Notifications Icon */}
        <div className="relative">
          <button
            onClick={openNotifs}
            className="w-8 h-8 flex items-center justify-center hover:opacity-75 hover:scale-105 transition-all cursor-pointer"
            title="Notifications"
          >
            <img src="/navbar-notif.svg" alt="Notifications" className="w-full h-full object-contain" />
            <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-600 rounded-full border border-white" />
          </button>
        </div>

        {/* Profile Settings Icon */}
        <button
          onClick={openProfile}
          className="w-8 h-8 flex items-center justify-center hover:opacity-75 hover:scale-105 transition-all cursor-pointer"
          title="Profile Settings"
        >
          <img src="/navbar-profile-settings.svg" alt="Profile Settings" className="w-full h-full object-contain rounded-full border border-[#385E31]" />
        </button>

      </div>
    </nav>
  );
}