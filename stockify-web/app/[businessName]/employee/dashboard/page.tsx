"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
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
  const [resetBadgeFn, setResetBadgeFn] = useState<(() => void) | null>(null);

  useEffect(() => {
    const loadAll = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

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

  if (isLoading) return <LoadingScreen />;

  const handleSetSection = (section: SectionKey) => {
    setActiveSection(section);
    window.history.replaceState(null, "", `?section=${section}`);
  };

  const handleOpenProfile  = () => setIsProfileOpen(true);
  const handleOpenNotifs   = () => setIsNotifsOpen(true);
  const handleOpenSettings = () => setIsSettingsOpen(true);

  const SECTIONS: Record<SectionKey, React.ReactNode> = {
    "dashboard":    <DashboardSection initialData={dashboardData} tenantId={tenantId!} colors={config || undefined} />,
    "audit-logs":   <AuditLogsSection colors={config || undefined} />,
    "products":     <ProductsSection colors={config || undefined} />,
    "ingredients":  <IngredientsSection colors={config || undefined} />,
    "orders":       <OrdersSection colors={config || undefined} />,
    "transactions": <TransactionsSection colors={config || undefined} />,
    "analytics":    <div />,
  };

  return (
    <div className="flex" style={{
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
        colors={config || undefined}
      />

      {/* Main column */}
      <div className="flex-1 flex flex-col min-h-screen pb-10 px-15 pt-5">

        {/* Navbar — drops from top */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1], delay: 0.15 }}
        >
          <NavbarEmployee
            setActiveSection={handleSetSection}
            openProfile={handleOpenProfile}
            openNotifs={handleOpenNotifs}
            openSettings={handleOpenSettings}
            setResetNotificationBadge={setResetBadgeFn}
          />
        </motion.div>

        {/* Content — rises up */}
        <motion.main
          className="px-5 pt-10"  
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.25, 0.1, 0.25, 1], delay: 0.25 }}
        >
           <div className="">  {/* ← scroll lives here instead */}
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
          </div>
        </motion.main>
      </div>

      <EmployeeProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        colors={config || undefined}
      />
      <NotificationModal
        isOpen={isNotifsOpen}
        onClose={() => setIsNotifsOpen(false)}
        role="employee"
        tenantId={tenantId}
        colors={config || undefined}
        onClear={resetBadgeFn || undefined}
      />
      <EmployeeSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        colors={config || undefined}
      />
    </div>
  );
}