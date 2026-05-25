"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

// Admin UI Shell Elements
import NavbarAdmin from "@/components/navbars/navbar-admin";
import SidebarAdmin from "@/components/navbars/sidebar-admin";
import LoadingScreen from "@/app/loading-screen/loading";

// Main Content Component
import SalesForecastDashboard from "@/components/cards/admin/forecast-card";

// Admin Modals
import AdminSettingsModal from "@/components/sections/admin/client-settings"; 
import ClientProfileModal from "@/components/modals/client/profile/modal";
import NotificationModal from "@/components/modals/notification-modal";

// Backend & Configuration Core
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
  
  // State Layout Flags
  const [activeSection, setActiveSection] = useState<SectionKey>("dashboard");
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotifsOpen, setIsNotifsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // Data State Context
  const [config, setConfig] = useState<StorefrontConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [tenantId, setTenantId] = useState<string | null>(null);

  // 1. Core Platform Hydration Loop
  useEffect(() => {
    const loadAll = async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: userData } = await supabase
          .from("users")
          .select("tenant_id")
          .eq("user_id", user.id)
          .single();

        if (userData?.tenant_id) {
          setTenantId(userData.tenant_id);
          
          // Parallel resolve config properties
          const [cfg] = await Promise.all([
            fetchStorefrontConfig(userData.tenant_id),
          ]);
          setConfig(cfg);
        }
      } catch (err) {
        console.error("Failed to load admin context:", err);
      } finally {
        setIsLoading(false);
      }
    };
    loadAll();
  }, []);

  // 2. Synchronization Loop for Direct Parameters Links
  useEffect(() => {
    const querySection = searchParams.get("section") as SectionKey;
    const validSections: SectionKey[] = ["dashboard", "user-admin", "storefront", "store-settings", "admin-settings"];
    
    if (querySection && validSections.includes(querySection)) {
      if (querySection === "admin-settings") {
        setIsSettingsOpen(true);
      } else if (querySection !== activeSection) {
        setActiveSection(querySection);
      }
    }
  }, [searchParams, activeSection]);

  // 3. Routing Action Proxies
  const handleSetSection = (section: SectionKey) => {
    if (section === "admin-settings") {
      setIsSettingsOpen(true);
    } else {
      setActiveSection(section); 
    }
    window.history.pushState(null, "", `?section=${section}`); 
  };

  const handleCloseSettings = () => {
    setIsSettingsOpen(false);
    window.history.pushState(null, "", `?section=${activeSection}`);
  };

  if (isLoading) return <LoadingScreen />;

 // 4. Component Injection Map (Mocked for immediate Demo)
  const SECTIONS: Record<SectionKey, React.ReactNode> = {
    "dashboard":      <SalesForecastDashboard data={{} as any} colors={config || undefined} />,
    "user-admin":     <SalesForecastDashboard data={{} as any} colors={config || undefined} />, 
    "storefront":     <SalesForecastDashboard data={{} as any} colors={config || undefined} />, 
    "store-settings": <SalesForecastDashboard data={{} as any} colors={config || undefined} />, 
    "admin-settings": <div />,
  };

  return (
    <div
      className="flex min-h-screen"
      style={{
        backgroundColor:        config?.color_background  ?? "#FFFCF0",
        "--color-primary":      config?.color_primary      ?? "#385E31",
        "--color-secondary":    config?.color_secondary    ?? "#2A4725",
        "--color-accent":       config?.color_accent       ?? "#F7B71D",
        "--color-text":         config?.color_text         ?? "#3A6131",
        "--color-sidebar-text": config?.color_sidebar_text ?? "#FFF9D7",
        "--color-background":   config?.color_background   ?? "#FFFCEB",
        "--color-navbar-text":  config?.color_navbar_text  ?? "#385E31",
      } as React.CSSProperties}
    >
      {/* Sidebar navigation mount */}
      <motion.div
        initial={{ opacity: 0, x: -32 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.45, ease: [0.25, 0.1, 0.25, 1] }}
      >
        <SidebarAdmin
          activeSection={activeSection}
          setActiveSection={handleSetSection}
          openSettings={() => handleSetSection("admin-settings")}
          colors={config || undefined}
        />
      </motion.div>

      {/* Primary viewport track */}
      <div className="flex-1 flex flex-col h-full overflow-y-auto px-14 pt-5 pb-12">

        {/* Global application navbar */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1], delay: 0.15 }}
        >
          <NavbarAdmin
            setActiveSection={handleSetSection}
            openProfile={() => setIsProfileOpen(true)}
            openNotifs={() => setIsNotifsOpen(true)}
          />
        </motion.div>

        {/* Workspace panel frame */}
        <motion.main
          className="p-5"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.25, 0.1, 0.25, 1], delay: 0.25 }}
        >
          {/* AnimatePresence orchestrator for smooth view transition swaps */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
            >
              {SECTIONS[activeSection]}
            </motion.div>
          </AnimatePresence>
        </motion.main>
      </div>

      {/* Layer overlays declaration block */}
      <ClientProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} isAdmin={true} colors={config || undefined} />
      <NotificationModal isOpen={isNotifsOpen} onClose={() => setIsNotifsOpen(false)} role="admin" tenantId={tenantId} colors={config || undefined} />
      <AdminSettingsModal isOpen={isSettingsOpen} onClose={handleCloseSettings} colors={config || undefined} />
    </div>
  );
}