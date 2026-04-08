"use client";

import { useRouter } from "next/navigation";
import type { SectionKey } from "@/app/[businessName]/administrator/dashboard/page"; // adjust import path

interface NavbarAdminProps {
  activeSection: SectionKey;
  setActiveSection: (section: SectionKey) => void;
}

export default function NavbarAdmin({ activeSection, setActiveSection }: NavbarAdminProps) {
  const router = useRouter();

  return (
    <nav className="w-full h-[60px] px-8 bg-[#F7B71D] rounded-[50px] shadow-[2px_4px_4px_0px_rgba(43,88,12,0.70)] flex items-center justify-between">

      {/* LEFT: Logo */}
      <div
        className="flex items-center gap-2 cursor-pointer select-none"
        onClick={() => setActiveSection("dashboard")}
      >
        <div className="w-10 h-10 flex items-center justify-center">
          <img src="/stockify-logo-1.svg" alt="Stockify Logo" className="h-8 w-auto" />
        </div>
        <div className="text-[#385E31] text-2xl font-bold font-['Inter'] tracking-tight">
          STOCKIFY
        </div>
      </div>

      {/* RIGHT: Quick Actions */}
      <div className="flex items-center gap-6">

        {/* Home — goes back to dashboard section */}
        <button
          onClick={() => setActiveSection("dashboard")}
          className="w-6 h-6 hover:opacity-75 transition-opacity"
          title="Home"
        >
          <img src="/navbar-home.svg" alt="Home" className="w-full h-full object-contain" />
        </button>

        {/* Notifications — still a real route */}
        <button
          onClick={() => router.push("/notifications")}
          className="w-6 h-6 hover:opacity-75 transition-opacity"
          title="Notifications"
        >
          <img src="/navbar-notif.svg" alt="Notifications" className="w-full h-full object-contain" />
        </button>

        {/* Profile Settings — still a real route */}
        <button
          onClick={() => router.push("/settings")}
          className="w-6 h-6 hover:opacity-75 transition-opacity"
          title="Profile Settings"
        >
          <img src="/navbar-profile-settings.svg" alt="Profile Settings" className="w-full h-full object-contain" />
        </button>

      </div>
    </nav>
  );
}