"use client";

import { useState } from "react";
import NavbarEmployee from "@/components/navbars/navbar-employee";
import SidebarEmployee from "@/components/navbars/sidebar-employee";
import AnalyticsReports from "@/components/sections/employee/AnalyticsReports";
import type { SectionKey } from "@/app/[businessName]/employee/dashboard/page";

export default function EmployeeAnalytics() {
  const [activeSection, setActiveSection] = useState<SectionKey>("analytics"); 

  const handleOpenProfile = () => console.log("Open Profile Modal");
  const handleOpenNotifs = () => console.log("Open Notifications Modal");
  const handleOpenSettings = () => console.log("Open Settings Modal");

  return (
    // 1. Removed h-screen and overflow-hidden. Changed to min-h-screen.
    <div className="flex min-h-screen w-full bg-[#FFFCEB] font-['Inter']">
    
          {/* LEFT SIDE: Fixed Sidebar */}
          <SidebarEmployee 
            activeSection={activeSection}
            setActiveSection={setActiveSection}
          />
    
          {/* RIGHT SIDE: Main Column */}
          {/* 2. Removed h-screen, min-h-0, and overflow-y-auto. It now grows naturally! */}
          <div className="flex-1 flex flex-col w-full">
            
            <div className="shrink-0">
              <NavbarEmployee 
                setActiveSection={setActiveSection}
                openProfile={handleOpenProfile}
                openNotifs={handleOpenNotifs}
                openSettings={handleOpenSettings}
              />
            </div>

            <div className="px-10 pt-5 pb-12">
              <AnalyticsReports />
            </div>

          </div>
    </div>
  );
}