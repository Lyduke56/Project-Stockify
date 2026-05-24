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
import { fetchDashboardData, type DashboardData } from "@/lib/employee/dashboard-stats";

import NotificationModal from "@/components/modals/notification-modal";
import EmployeeProfileModal from "@/components/modals/new-employee-modal";
import EmployeeSettingsModal from "@/components/modals/navbar-modals/settings";
import LoadingScreen from "@/app/loading-screen/loading";

export type SectionKey =
  | "dashboard"
  | "audit-logs"
  | "products"
  | "ingredients"
  | "orders"
  | "transactions"
  | "analytics";

export type SidebarData = {
  role:         string;
  businessType: string;
  businessName: string;
};


export default function EmployeeDashboard() {
  const searchParams = useSearchParams();

  const [activeSection, setActiveSection] = useState<SectionKey>("dashboard");
  const [config, setConfig] = useState<StorefrontConfig | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [sidebarData, setSidebarData] = useState<SidebarData | null>(null);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotifsOpen, setIsNotifsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => {
    const loadAll = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Single query to get everything we need from users + tenants
      const { data: userData } = await supabase
        .from("users")
        .select(`
          role,
          tenant_id,
          tenants (
            business_name,
            business_type
          )
        `)
        .eq("user_id", user.id)
        .single();

      if (!userData?.tenant_id) return;

      const tenant = userData.tenants as any;
      const tid = userData.tenant_id;

      setTenantId(tid);
      setSidebarData({
        role: userData.role ?? "",
        businessType: tenant?.business_type ?? "",
        businessName: tenant?.business_name ?? "",
      });

      // Fetch everything else in parallel
      const [cfg, dash] = await Promise.all([
        fetchStorefrontConfig(tid),
        fetchDashboardData(tid),
      ]);

      setConfig(cfg);
      setDashboardData(dash);
    };

    loadAll().finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const section = params.get("section") as SectionKey;
      setActiveSection(section ?? "dashboard");
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) window.location.reload();
    };
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, []);

  useEffect(() => {
    const querySection = searchParams.get("section") as SectionKey;
    if (querySection) setActiveSection(querySection);
  }, [searchParams]);

  // Everything — sidebar, navbar, dashboard — waits here
  if (isLoading) return <LoadingScreen />;

  const handleSetSection = (section: SectionKey) => {
    setActiveSection(section);
    window.history.replaceState(null, "", `?section=${section}`);
  };

  const handleOpenProfile  = () => setIsProfileOpen(true);
  const handleOpenNotifs   = () => setIsNotifsOpen(true);
  const handleOpenSettings = () => setIsSettingsOpen(true);

  const SECTIONS: Record<SectionKey, React.ReactNode> = {
    "dashboard":    <DashboardSection initialData={dashboardData} tenantId={tenantId!} />,
    "audit-logs":   <AuditLogsSection />,
    "products":     <ProductsSection />,
    "ingredients":  <IngredientsSection />,
    "orders":       <OrdersSection />,
    "transactions": <TransactionsSection />,
    "analytics":    <div />,
  };

  return (
    <div className="flex min-h-screen" style={{
      backgroundColor: config?.color_background ?? "#FFFCEB",
      '--color-primary': config?.color_primary ?? "#385E31",
      '--color-secondary': config?.color_secondary ?? "#2A4725",
      '--color-accent': config?.color_accent ?? "#F7B71D",
      '--color-text': config?.color_text ?? "#3A6131",
      '--color-sidebar-text': config?.color_sidebar_text ?? "#FFF9D7",
    } as React.CSSProperties}>

      <SidebarEmployee
        activeSection={activeSection}
        setActiveSection={handleSetSection}
        onOpenSettings={handleOpenSettings}
        sidebarData={sidebarData!}
      />

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