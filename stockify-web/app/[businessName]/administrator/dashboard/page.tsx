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
import ClientSettingsModal from "@/components/modals/client-settings-modal";
import { fetchStorefrontConfig, type StorefrontConfig } from "@/lib/admin/storefront-actions";
import { createClient } from "@/lib/supabase/client";

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
  const [config, setConfig] = useState<StorefrontConfig | null>(null);

  useEffect(() => {
    const loadConfig = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: userData } = await supabase
        .from("users")
        .select("tenant_id")
        .eq("user_id", user.id)
        .single();

      if (userData?.tenant_id) {
        const cfg = await fetchStorefrontConfig(userData.tenant_id);
        setConfig(cfg);
      }
    };
    loadConfig();
  }, []);

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
    <div className="flex min-h-screen" style={{
      backgroundColor: config?.color_background ?? "#FFFCF0",
      '--color-primary': config?.color_primary ?? "#385E31",
      '--color-secondary': config?.color_secondary ?? "#2A4725",
      '--color-accent': config?.color_accent ?? "#F7B71D",
      '--color-text': config?.color_text ?? "#3A6131",
      '--color-sidebar-text': config?.color_sidebar_text ?? "#FFF9D7",
    } as React.CSSProperties}>
      <SidebarAdmin activeSection={activeSection} setActiveSection={handleSetSection} openSettings={() => handleSetSection("admin-settings")} />
      
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