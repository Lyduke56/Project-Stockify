"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import NavbarAdmin from "@/components/navbars/navbar-admin";
import SidebarAdmin from "@/components/navbars/sidebar-admin";

import DashboardSection from "@/components/sections/admin/dashboard-home";
import UserAdminSection from "@/components/sections/admin/user-admin";
import StorefrontSection from "@/components/sections/admin/storefront";
import StoreSettingsSection from "@/components/sections/admin/store-settings";
import AdminSettingsModal from "@/components/sections/admin/client-settings"; 
import ClientProfileModal from "@/components/modals/client-profile-modal";
import NotificationModal from "@/components/modals/notification-modal";

// 🟢 FIX 1: Keep "admin-settings" in SectionKey so SidebarAdmin and URL params don't break types
export type SectionKey =
  | "dashboard"
  | "user-admin"
  | "storefront"
  | "store-settings"
  | "admin-settings"; 

export default function AdminDashboard() {
  const searchParams = useSearchParams();
  
  // Track the underlying main workspace view background tab 
  const [activeSection, setActiveSection] = useState<SectionKey>("dashboard");
  
  // Controlling the visibility states of our interactive floating modals
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotifsOpen, setIsNotifsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false); 

  useEffect(() => {
    const querySection = searchParams.get("section") as SectionKey;
    const validSections: SectionKey[] = ["dashboard", "user-admin", "storefront", "store-settings", "admin-settings"];
    
    if (querySection && validSections.includes(querySection)) {
      if (querySection === "admin-settings") {
        // If the URL parameters trigger the settings view, open the overlay screen directly
        setIsSettingsOpen(true);
      } else if (querySection !== activeSection) {
        setActiveSection(querySection);
      }
    }
  }, [searchParams, activeSection]);

  const handleSetSection = (section: SectionKey) => {
    if (section === "admin-settings") {
      setIsSettingsOpen(true);
    } else {
      setActiveSection(section); 
    }
    window.history.pushState(null, "", `?section=${section}`); 
  };

  // Safe fallback to manage closing the modal overlay and restoring url path cleanups
  const handleCloseSettings = () => {
    setIsSettingsOpen(false);
    // Restore the browser url view parameters cleanly back to the underlying core panel state
    window.history.pushState(null, "", `?section=${activeSection}`);
  };

  return (
    <div className="flex min-h-screen bg-[#FFFCF0]">
      {/* 🟢 FIX 2: Explicitly pass your unified type tracking here, matching your existing sidebar component contract */}
      <SidebarAdmin 
        activeSection={isSettingsOpen ? "admin-settings" : activeSection} 
        setActiveSection={handleSetSection} 
        openSettings={() => handleSetSection("admin-settings")} 
      />
      
      <div className="flex-1 flex flex-col h-full overflow-y-auto px-14 pt-5 pb-12">
        <NavbarAdmin 
          setActiveSection={handleSetSection}
          openProfile={() => setIsProfileOpen(true)}
          openNotifs={() => setIsNotifsOpen(true)}
          openSettings={() => handleSetSection("admin-settings")}
        />
        
        {/* Underlay Dashboard Core Content Main View Grid Block */}
        <main className="p-5">
          {activeSection === "dashboard" && (
            <DashboardSection onManageShop={() => handleSetSection("store-settings")} />
          )}
          {activeSection === "user-admin" && <UserAdminSection />}
          {activeSection === "storefront" && <StorefrontSection />}
          {activeSection === "store-settings" && <StoreSettingsSection />}
        </main>
      </div>

      {/* Floating Application Overlay Screen Windows Layer Portal */}
      <ClientProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
      <NotificationModal isOpen={isNotifsOpen} onClose={() => setIsNotifsOpen(false)} />
      
      {/* Floating settings screen wrapper element */}
      <AdminSettingsModal isOpen={isSettingsOpen} onClose={handleCloseSettings} />
    </div>
  );
}