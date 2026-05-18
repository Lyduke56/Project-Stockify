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
import { fetchStorefrontConfig, type StorefrontConfig } from "@/lib/admin/storefront-actions";
import { createClient } from "@/lib/supabase/client";

export type SectionKey =
  | "dashboard"
  | "user-admin"
  | "storefront"
  | "store-settings"
  | "admin-settings";

export default function AdminDashboard() {
  const searchParams = useSearchParams();
  const [activeSection, setActiveSection] = useState<SectionKey>("dashboard");
  
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
    if (querySection && validSections.includes(querySection) && querySection !== activeSection) {
      setActiveSection(querySection);
    }
  }, [searchParams, activeSection]);

  const handleSetSection = (section: SectionKey) => {
    setActiveSection(section); 
    window.history.pushState(null, "", `?section=${section}`); 
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