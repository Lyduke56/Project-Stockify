"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import NavbarAdmin from "@/components/navbars/navbar-admin";
import SidebarAdmin from "@/components/navbars/sidebar-admin";

import DashboardSection from "@/components/sections/admin/dashboard-home";
import UserAdminSection from "@/components/sections/admin/user-admin";
import StorefrontSection from "@/components/sections/admin/storefront";
import StoreSettingsSection from "@/components/sections/admin/store-settings";
import AdminSettingsSection from "@/components/sections/admin/client-settings";
import ClientProfileModal from "@/components/modals/client-profile-modal";
import NotificationModal from "@/components/modals/notification-modal";
import ClientSettingsModal from "@/components/modals/client-settings-modal";

export type SectionKey =
  | "dashboard"
  | "user-admin"
  | "storefront"
  | "store-settings"
  | "admin-settings";

// Removed static SECTIONS to allow passing props in the render method

export default function AdminDashboard() {
  const searchParams = useSearchParams();
  const [activeSection, setActiveSection] = useState<SectionKey>("dashboard");
  
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotifsOpen, setIsNotifsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => {
    const querySection = searchParams.get("section") as SectionKey;
    const validSections: SectionKey[] = ["dashboard", "user-admin", "storefront", "store-settings", "admin-settings"];
    if (querySection && validSections.includes(querySection) && querySection !== activeSection) {
      setActiveSection(querySection);
    }
  }, [searchParams, activeSection]);

  const handleSetSection = (section: SectionKey) => {
    setActiveSection(section); 
    window.history.pushState(null, "", `?section=${section}`); 
  };

  return (
    <div className="flex min-h-screen bg-[#FFFCF0]">
      <SidebarAdmin activeSection={activeSection} setActiveSection={handleSetSection} />
      
      <div className="flex-1 flex flex-col h-full overflow-y-auto px-14 pt-5 pb-12">
        <NavbarAdmin 
          setActiveSection={handleSetSection}
          openProfile={() => setIsProfileOpen(true)}
          openNotifs={() => setIsNotifsOpen(true)}
          openSettings={() => setIsSettingsOpen(true)}
        />
        
        <main className="p-5">
          {activeSection === "dashboard" && (
            <DashboardSection onManageShop={() => handleSetSection("store-settings")} />
          )}
          {activeSection === "user-admin" && <UserAdminSection />}
          {activeSection === "storefront" && <StorefrontSection />}
          {activeSection === "store-settings" && <StoreSettingsSection />}
          {activeSection === "admin-settings" && <AdminSettingsSection />}
        </main>
      </div>

      <ClientProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
      <NotificationModal isOpen={isNotifsOpen} onClose={() => setIsNotifsOpen(false)} />
      <ClientSettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  );
}