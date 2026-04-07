"use client";

import { useRouter, usePathname } from "next/navigation";
import { useState } from "react";
import LogoutModal from "../modals/logout-modal";

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

export default function SidebarSuperAdmin() {
  const router = useRouter();
  const pathname = usePathname();

  // FIX: Updated all paths from "/admin/..." to "/superadmin/..." to match your folder structure
  const adminNavItems = [
    { label: "Dashboard", iconFileName: "icon-dashboard", path: "/superadmin/dashboard" },
    { label: "Tenant Management", iconFileName: "icon-tenant-management", path: "/superadmin/tenant-management" },
    { label: "Subscription Billing", iconFileName: "icon-subscription-billing", path: "/superadmin/billing" },
    { label: "Audit Logs", iconFileName: "icon-audit-logs", path: "/superadmin/audit-logs" },
  ];

  const bottomItems = [
    { label: "Settings", iconFileName: "icon-settings", path: "/superadmin/profile-settings" },
    { label: "Logout", iconFileName: "icon-logout", path: "/logout" },
  ];

    const handleNavigation = (label: string, path: string) => {
      if (label === "Logout") {
        setShowLogoutModal(true);
        return;
      }

      router.push(path);
    };

    const handleLogout = () => {
      localStorage.removeItem("token"); 
      setShowLogoutModal(false);
      router.push("/");
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
      
      <LogoutModal
          isOpen={showLogoutModal}
          onCancel={() => setShowLogoutModal(false)}
          onConfirm={handleLogout}
        />
    </div>
  );
}