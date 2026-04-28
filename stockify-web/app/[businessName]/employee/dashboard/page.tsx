"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import NavbarEmployee from "@/components/navbars/navbar-employee";
import SidebarEmployee from "@/components/navbars/sidebar-employee";

import DashboardSection from "@/components/sections/employee/dashboard-home-employee";
import AnalyticsReportsSection from "@/components/sections/employee/analytics";
import AuditLogsSection from "@/components/sections/employee/audit-logs";
import InventorySection from "@/components/sections/employee/inventory";
import OrdersSection from "@/components/sections/employee/orders";
import StockNotificationsSection from "@/components/sections/employee/stock-notifications";
import TransactionsSection from "@/components/sections/employee/transactions";  
import SettingsSection from "@/components/sections/employee/store-settings";

export type SectionKey =
  | "dashboard"
  | "analytics"
  | "audit-logs"
  | "inventory"
  | "orders"
  | "stock-notifications"
  | "transactions"
  | "store-settings";

const SECTIONS: Record<SectionKey, React.ReactNode> = {
  "dashboard": <DashboardSection />,
  "analytics": <AnalyticsReportsSection />,
  "audit-logs": <AuditLogsSection />,
  "inventory": <InventorySection />,
  "orders": <OrdersSection />,
  "stock-notifications": <StockNotificationsSection />,
  "transactions": <TransactionsSection />,
  "store-settings": <SettingsSection />
};

export default function EmployeeDashboard() {
  const searchParams = useSearchParams();
  const [activeSection, setActiveSection] = useState<SectionKey>("dashboard");

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
    window.history.pushState(null, "", `?section=${section}`);
  };

  return (
    <div className="flex min-h-screen bg-[#FFFCEB]">
      <SidebarEmployee activeSection={activeSection} setActiveSection={handleSetSection} />

      <div className="flex-1 flex flex-col h-full overflow-y-auto px-20 pt-5 pb-12">
        <NavbarEmployee
          setActiveSection={handleSetSection}
          openProfile={() => setIsProfileOpen(true)}
          openNotifs={() => setIsNotifsOpen(true)}
          openSettings={() => setIsSettingsOpen(true)}
        />

        <main className="p-10">
          {SECTIONS[activeSection]}
        </main>
      </div>

      {/* MODALS RENDER HERE */}
      {/* <EmployeeProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} /> */}
      {/* <NotificationModal isOpen={isNotifsOpen} onClose={() => setIsNotifsOpen(false)} /> */}
      {/* <EmployeeSettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} /> */}
    </div>
  );
}