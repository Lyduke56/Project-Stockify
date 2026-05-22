"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import NavbarEmployee from "@/components/navbars/navbar-employee";
import SidebarEmployee from "@/components/navbars/sidebar-employee";

import DashboardSection from "@/components/sections/employee/dashboard-home-employee";
import AuditLogsSection from "@/components/sections/employee/audit-logs";
import ProductsSection from "@/components/sections/employee/products";
import OrdersSection from "@/components/sections/employee/orders";
import TransactionsSection from "@/components/sections/employee/transactions";
import IngredientsSection from "@/components/sections/employee/ingredients";
import { fetchStorefrontConfig, type StorefrontConfig } from "@/lib/admin/storefront-actions";

import NotificationModal from "@/components/modals/notification-modal";
import EmployeeProfileModal from "@/components/modals/new-employee-modal";
import EmployeeSettingsModal from "@/components/modals/navbar-modals/settings";

export type SectionKey =
  | "dashboard"
  | "audit-logs"
  | "products"
  | "ingredients"
  | "orders"
  | "transactions"
  | "analytics";

const SECTIONS: Record<SectionKey, React.ReactNode> = {
  "dashboard": <DashboardSection />,
  "audit-logs": <AuditLogsSection />,
  "products": <ProductsSection />,
  "ingredients": <IngredientsSection />,
  "orders": <OrdersSection />,
  "transactions": <TransactionsSection />,
  "analytics": <div />,
};

export default function EmployeeDashboard() {
  const searchParams = useSearchParams();
  const supabase = createClient();
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<SectionKey>("dashboard");
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
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const section = params.get("section") as SectionKey;
      if (section && SECTIONS[section]) {
        setActiveSection(section);
      } else {
        setActiveSection("dashboard");
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        window.location.reload();
      }
    };
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, []);

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotifsOpen, setIsNotifsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => {
    const querySection = searchParams.get("section") as SectionKey;
    if (querySection && Object.keys(SECTIONS).includes(querySection)) {
      setActiveSection(querySection);
    }
  }, [searchParams]);

  const handleSetSection = (section: SectionKey) => {
    setActiveSection(section);
    window.history.replaceState(null, "", `?section=${section}`);
  };

  const handleOpenProfile = () => setIsProfileOpen(true);
  const handleOpenNotifs = () => setIsNotifsOpen(true);
  const handleOpenSettings = () => setIsSettingsOpen(true);

  return (
    <div className="flex min-h-screen" style={{
      backgroundColor: config?.color_background ?? "#FFFCEB",
      '--color-primary': config?.color_primary ?? "#385E31",
      '--color-secondary': config?.color_secondary ?? "#2A4725",
      '--color-accent': config?.color_accent ?? "#F7B71D",
      '--color-text': config?.color_text ?? "#3A6131",
      '--color-sidebar-text': config?.color_sidebar_text ?? "#FFF9D7",
    } as React.CSSProperties}>
      <SidebarEmployee activeSection={activeSection} setActiveSection={handleSetSection} onOpenSettings={() => console.log("Open settings clicked")} />

      <div className="flex-1 flex flex-col h-full overflow-y-auto px-0 pb-10 px-15 pt-5">
        <NavbarEmployee
          setActiveSection={handleSetSection}
          openProfile={handleOpenProfile}
          openNotifs={handleOpenNotifs}
          openSettings={handleOpenSettings}
        />

        <main className="px-5 pt-10">
          {SECTIONS[activeSection]}
        </main>
      </div>

      {/*  WORKING PROFILE MODAL LAYER */}
      <EmployeeProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
      />

      {/*  WORKING NOTIFICATION MODAL LAYER */}
      <NotificationModal
        isOpen={isNotifsOpen}
        onClose={() => setIsNotifsOpen(false)}
        role="employee"
        tenantId={tenantId}
      />

      {/*  WIRED UP UNIFIED SETTINGS MODAL OVERLAY */}
      <EmployeeSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
}