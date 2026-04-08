"use client";

import { useState } from "react";
import NavbarAdmin from "@/components/navbars/navbar-admin";
import SidebarAdmin from "@/components/navbars/sidebar-admin";

// Section components
import DashboardSection from "@/components/sections/admin/dashboard-home";

export type SectionKey =
  | "dashboard"

const SECTIONS: Record<SectionKey, React.ReactNode> = {
  "dashboard": <DashboardSection />
};

export default function AdminDashboard() {
  const [activeSection, setActiveSection] = useState<SectionKey>("dashboard");

  return (
    <div className="flex min-h-screen bg-[#FFFCF0]">
      <SidebarAdmin
        activeSection={activeSection}
        setActiveSection={setActiveSection}
      />
      <div className="flex-1 flex flex-col h-full overflow-y-auto px-20 pt-5 pb-12">
        <NavbarAdmin
          activeSection={activeSection}
          setActiveSection={setActiveSection}
        />
        <main className="p-10">
          {SECTIONS[activeSection]}
        </main>
      </div>
    </div>
  );
}