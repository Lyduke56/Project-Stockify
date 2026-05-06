"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import NavbarEmployee from "@/components/navbars/navbar-employee";
import SidebarEmployee from "@/components/navbars/sidebar-employee";

import DashboardSection from "@/components/sections/employee/dashboard-home-employee";
import AnalyticsReportsSection from "@/components/sections/employee/analytics";
import AuditLogsSection from "@/components/sections/employee/audit-logs";
import ProductsSection from "@/components/sections/employee/products";
import OrdersSection from "@/components/sections/employee/orders";
import StockNotificationsSection from "@/components/sections/employee/stock-notifications";
import TransactionsSection from "@/components/sections/employee/transactions";  
import SettingsSection from "@/components/sections/employee/store-settings";
import IngredientsSection from "@/components/sections/employee/ingredients";

// Removed the import type { SectionKey } from... line above! 
// This file is the "source of truth" for this type.
export type SectionKey =
  | "dashboard"
  | "analytics"
  | "audit-logs"
  | "products"
  | "ingredients"
  | "orders"
  | "stock-notifications"
  | "transactions"
  | "store-settings";

const SECTIONS: Record<SectionKey, React.ReactNode> = {
  "dashboard": <DashboardSection />,
  "analytics": <AnalyticsReportsSection />,
  "audit-logs": <AuditLogsSection />,
  "products": <ProductsSection />,
  "ingredients": <IngredientsSection />,
  "orders": <OrdersSection />,
  "stock-notifications": <StockNotificationsSection />,
  "transactions": <TransactionsSection />,
  "store-settings": <SettingsSection />
};

export default function EmployeeDashboard() {
  const searchParams = useSearchParams();
  const [activeSection, setActiveSection] = useState<SectionKey>("dashboard");

  useEffect(() => {
    const handlePopState = () => {
      // Look at the URL and update our state to match
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
        // If the page is being loaded from the browser cache (back button)
        // reload the window to trigger a middleware session check
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

  // --- ADDED THESE MISSING FUNCTIONS ---
  // These connect your Navbar buttons to your modal state!
  const handleOpenProfile = () => setIsProfileOpen(true);
  const handleOpenNotifs = () => setIsNotifsOpen(true);
  const handleOpenSettings = () => setIsSettingsOpen(true);

  return (
    <div className="flex min-h-screen bg-[#FFFCEB]">
      <SidebarEmployee activeSection={activeSection} setActiveSection={handleSetSection} />

      <div className="flex-1 flex flex-col h-full overflow-y-auto px-0 pt-5 pb-12">
        <NavbarEmployee
         setActiveSection={setActiveSection}
         openProfile={handleOpenProfile} 
         openNotifs={handleOpenNotifs}
         openSettings={handleOpenSettings}
        />

        <main className="py-10 px-20">
          {SECTIONS[activeSection]}
        </main>
      </div>

      {/* MODALS RENDER HERE */}
      {/* Once you uncomment these, the Navbar buttons will make them pop up! */}
      {/* <EmployeeProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} /> */}
      {/* <NotificationModal isOpen={isNotifsOpen} onClose={() => setIsNotifsOpen(false)} /> */}
      {/* <EmployeeSettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} /> */}
    </div>
  );
}