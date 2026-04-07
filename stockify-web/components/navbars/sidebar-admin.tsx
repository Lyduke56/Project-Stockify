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
          ? "bg-[#E5AD24] text-[#385E31] shadow-md font-bold"
          : "bg-transparent text-[#FFF9D7] hover:bg-[#368028] font-semibold"
      }`}
    >
      <div className="w-8 h-8 flex items-center justify-center shrink-0">
        <img
          src={`/Dashboard Icons/${encodeURI(iconFileName)}.svg`}
          alt={label}
          className="w-full h-full object-contain"
        />
      </div>
      <div className="text-base font-['Inter'] whitespace-nowrap">
        {label}
      </div>
    </div>
  );
}

// --- Main Admin Sidebar Component ---
export default function SidebarAdmin() {
  const router = useRouter();
  const pathname = usePathname();

  // Admin-specific navigation links
  const adminNavItems = [
    { label: "Dashboard", iconFileName: "icon-dashboard", path: "/administrator/dashboard" },
    { label: "User Administration", iconFileName: "icon-user-admin", path: "/administrator/user-admin" },
    { label: "Storefront", iconFileName: "icon-storefront", path: "/administrator/storefront" },
    { label: "Store Settings", iconFileName: "icon-store-settings", path: "/administrator/store-settings" },
    { label: "Subscription Billing", iconFileName: "icon-subscription-billing", path: "/administrator/subscription-billing" },
  ];

  const bottomItems = [
    { label: "Settings", iconFileName: "icon-settings", path: "/admin/profile-settings" },
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
            isActive={pathname === item.path}
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