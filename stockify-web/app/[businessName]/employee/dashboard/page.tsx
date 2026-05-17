"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client"; // Added to fetch user tenant data context
import NavbarEmployee from "@/components/navbars/navbar-employee";
import SidebarEmployee from "@/components/navbars/sidebar-employee";

import DashboardSection from "@/components/sections/employee/dashboard-home-employee";
import AuditLogsSection from "@/components/sections/employee/audit-logs";
import ProductsSection from "@/components/sections/employee/products";
import OrdersSection from "@/components/sections/employee/orders";
import TransactionsSection from "@/components/sections/employee/transactions";  
import SettingsSection from "@/components/sections/employee/store-settings";
import IngredientsSection from "@/components/sections/employee/ingredients";
import NotificationModal from "@/components/modals/notification-modal"; // Make sure this path points to your updated modal file!

export type SectionKey =
  | "dashboard"
  | "audit-logs"
  | "products"
  | "ingredients"
  | "orders"
  | "transactions"
  | "analytics"
  | "store-settings";

const SECTIONS: Record<SectionKey, React.ReactNode> = {
  "dashboard":     <DashboardSection />,
  "audit-logs":    <AuditLogsSection />,
  "products":      <ProductsSection />,
  "ingredients":   <IngredientsSection />,
  "orders":        <OrdersSection />,
  "transactions":  <TransactionsSection />,
  "analytics":     <div />, 
  "store-settings": <SettingsSection />
};

export default function EmployeeDashboard() {
  const searchParams = useSearchParams();
  const supabase = createClient();
  const [activeSection, setActiveSection] = useState<SectionKey>("dashboard");
  const [tenantId, setTenantId] = useState<string | null>(null); // Track employee's store link context

  // Fetch the current user profile metadata safely on component mount
  useEffect(() => {
    const getEmployeeProfileContext = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("users")
        .select("tenant_id")
        .eq("user_id", user.id)
        .single();

      if (profile?.tenant_id) {
        setTenantId(profile.tenant_id);
      }
    };
    getEmployeeProfileContext();
  }, [supabase]);

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
    <div className="flex min-h-screen bg-[#FFFCEB]">
      <SidebarEmployee activeSection={activeSection} setActiveSection={handleSetSection} />

      <div className="flex-1 flex flex-col h-full overflow-y-auto px-0 pb-10 px-15 pt-5">
        <NavbarEmployee
         setActiveSection={setActiveSection}
         openProfile={handleOpenProfile} 
         openNotifs={handleOpenNotifs}
         openSettings={handleOpenSettings}
        />

        <main className="px-5 pt-10">
          {SECTIONS[activeSection]}
        </main>
      </div>

      {/* UNCOMMENTED & ACTIVATED YOUR NOTIFICATION MODAL LAYER PORTAL */}
      <NotificationModal 
        isOpen={isNotifsOpen} 
        onClose={() => setIsNotifsOpen(false)} 
        role="employee"
        tenantId={tenantId}
      />

      {/* Keep these commented out or uncomment them once their modal files exist */}
      {/* <EmployeeProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} /> */}
      {/* <EmployeeSettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} /> */}
    </div>
  );
}