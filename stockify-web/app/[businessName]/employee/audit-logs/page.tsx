"use client";

import { useState } from "react";
import NavbarEmployee from "@/components/navbars/navbar-employee";
import SidebarEmployee from "@/components/navbars/sidebar-employee";
import AuditLogs from "@/components/tables/audit-logs-table";
import type { SectionKey } from "@/app/[businessName]/employee/dashboard/page";

export default function EmployeeAuditLogs() {
    // Changed the default to "audit-logs" so the sidebar highlights correctly
    const [activeSection, setActiveSection] = useState<SectionKey>("audit-logs"); 
    const handleOpenProfile = () => console.log("Open Profile Modal");
    const handleOpenNotifs = () => console.log("Open Notifications Modal");
    const handleOpenSettings = () => console.log("Open Settings Modal");

  return (
    <div className="flex h-screen w-full bg-[#FFFCEB] overflow-hidden font-['Inter']">
    
          {/* LEFT SIDE: Fixed Sidebar */}
          {/* Passed the props here */}
          <SidebarEmployee 
            activeSection={activeSection}
            setActiveSection={setActiveSection}
          />
    
          {/* RIGHT SIDE: Main Content */}
          <div className="flex-1 flex flex-col h-full overflow-y-auto px-20 pt-5 pb-12">
            
            {/* Passed the props here */}
            <NavbarEmployee 
              setActiveSection={setActiveSection}
              openProfile={handleOpenProfile}
              openNotifs={handleOpenNotifs}
              openSettings={handleOpenSettings}
            />
    
            {/* Header */}
            <div className="w-full flex flex-col items-center mt-10 mb-10">
              <h1 className="text-[#385E31] text-[30px] font-extrabold tracking-wide uppercase">
                Audit Logs
              </h1>
              <div className="w-[900px] h-1.5 bg-[#F7B71D] mt-1 rounded-full"></div>
            </div>

            <AuditLogs />
          </div>

    </div>
  );
}