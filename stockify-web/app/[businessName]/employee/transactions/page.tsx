"use client"

import { useState } from "react";
import NavbarEmployee from "@/components/navbars/navbar-employee";
import SidebarEmployee from "@/components/navbars/sidebar-employee";
import Transactions from "@/components/tables/transactions-table";
import type { SectionKey } from "@/app/[businessName]/employee/dashboard/page";

export default function EmployeeTransactions() {

  const [activeSection, setActiveSection] = useState<SectionKey>("products"); 
  
    // Placeholder functions
    const handleOpenProfile = () => console.log("Open Profile Modal");
    const handleOpenNotifs = () => console.log("Open Notifications Modal");
    const handleOpenSettings = () => console.log("Open Settings Modal")


  return (

    <div className="flex h-screen w-full bg-[#FFFCEB] overflow-hidden font-['Inter']">
    
          {/* LEFT SIDE: Fixed Sidebar */}
          <SidebarEmployee
            onOpenSettings={() => console.log("Open settings clicked")}
            activeSection={activeSection}
            setActiveSection={setActiveSection}
          />
          {/* RIGHT SIDE: Main Content */}
          <div className="flex-1 flex flex-col h-full overflow-y-auto px-20 pt-5 pb-12">
            <NavbarEmployee
              setActiveSection={setActiveSection}
              openProfile={handleOpenProfile}
              openNotifs={handleOpenNotifs}
              openSettings={handleOpenSettings}
            />

            <Transactions />
          </div>

    </div>

  );

}
