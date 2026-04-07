"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";

// --- Types ---
interface NavItemProps {
  label: string;
  iconFileName: string;
  isActive: boolean;
  onClick: () => void;
}

// --- NavItem Component ---
function NavItem({ label, iconFileName, isActive, onClick }: NavItemProps) {
  return (
    <div
      onClick={onClick}
      className={`w-full h-14 pl-6 pr-4 flex items-center gap-4 cursor-pointer transition-all duration-200 ${
        isActive
          ? "bg-[#E5AD24] text-[#385E31] shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)] font-bold"
          : "bg-transparent text-[#FFF9D7] hover:bg-[#368028] font-semibold"
      }`}
    >
      <div className="w-8 h-8 flex items-center justify-center shrink-0">
        <img
          src={`/${iconFileName}.svg`}
          alt={label}
          className="w-full h-full object-contain"
          style={
            isActive
              ? { filter: "brightness(0) saturate(100%) invert(32%) sepia(16%) saturate(1553%) hue-rotate(69deg) brightness(97%) contrast(85%)" }
              : {}
          }
        />
      </div>
      <div className="text-base font-['Inter'] whitespace-nowrap">
        {label}
      </div>
    </div>
  );
}

// --- Main Admin Sidebar Component ---
export default function SidebarEmployee() {
  const router = useRouter();
  const pathname = usePathname();

  const adminNavItems = [
    { label: "Dashboard", iconFileName: "icon-dashboard", path: "/employee/dashboard" },
    { label: "Inventory", iconFileName: "icon-inventory", path: "/employee/inventory" },
    { label: "Orders", iconFileName: "icon-orders", path: "/employee/orders" },
    { label: "Analytics & Orders", iconFileName: "icon-chart2", path: "/employee/analytics" },
    { label: "Stock Notifications", iconFileName: "icon-stocknotifications", path: "/employee/stock-notifications" },
    { label: "Audit Logs", iconFileName: "icon-audit-logs", path: "/employee/audit-logs" },
    { label: "Transactions", iconFileName: "icon-transactions", path: "/employee/transactions" },
  ];

  const bottomItems = [
    { label: "Settings", iconFileName: "icon-settings", path: "/superadmin/profile-settings" },
    { label: "Logout", iconFileName: "icon-logout", path: "/logout" },
  ];

  const handleNavigation = (label: string, path: string) => {
    router.push(path);
  };

  return (
    <div className="w-64 h-screen pt-12 pb-8 bg-[#385E31] shadow-[2px_4px_18px_0px_rgba(0,0,0,0.25)] flex flex-col justify-between shrink-0 sticky top-0 overflow-y-auto">
      
      {/* Top Navigation */}
      <div className="w-full flex flex-col gap-1">
        {adminNavItems.map((item) => (
          <NavItem
            key={item.label}
            label={item.label}
            iconFileName={item.iconFileName}
            isActive={pathname === item.path} // This will now correctly match the current URL
            onClick={() => handleNavigation(item.label, item.path)}
          />
        ))}
      </div>

      {/* Bottom Navigation & Divider */}
      <div className="w-full flex flex-col items-center gap-4 mt-10">
        <div className="w-48 h-px bg-white/10"></div>
        <div className="w-full flex flex-col gap-1">
          {bottomItems.map((item) => (
            <NavItem
              key={item.label}
              label={item.label}
              iconFileName={item.iconFileName}
              isActive={pathname === item.path}
              onClick={() => handleNavigation(item.label, item.path)}
            />
          ))}
        </div>
      </div>

    </div>
  );
}