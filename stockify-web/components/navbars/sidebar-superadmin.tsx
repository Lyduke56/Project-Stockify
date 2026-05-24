"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client"; 
import LogoutModal from "../modals/logout-modal";
import SettingsModal from "../modals/navbar-modals/settings";

// ── IMPORT YOUR NEW TYPE FROM THE DASHBOARD ──
// Make sure this path points to your main dashboard page file
import type { SuperadminSectionKey } from "@/app/superadmin/dashboard/page"; 

interface NavItemProps {
  label: string;
  iconFileName: string;
  isActive: boolean;
  onClick: () => void;
}

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
      <div className="text-base font-['Inter'] whitespace-nowrap">{label}</div>
    </div>
  );
}

// ── ADD THE PROPS HERE ──
interface SidebarSuperAdminProps {
  activeSection: SuperadminSectionKey;
  setActiveSection: (section: SuperadminSectionKey) => void;
}

export default function SidebarSuperAdmin({
  activeSection,
  setActiveSection,
}: SidebarSuperAdminProps) {
  const router = useRouter(); // Kept for the logout redirect
  const supabase = createClient();

  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // ── MAP TO SECTIONS INSTEAD OF PATHS ──
  const adminNavItems: { label: string; iconFileName: string; section: SuperadminSectionKey }[] = [
    { label: "Dashboard",            iconFileName: "icon-dashboard",            section: "dashboard" },
    { label: "Tenant Management",    iconFileName: "icon-tenant-management",    section: "tenant-management" },
    { label: "Tenant Review",        iconFileName: "icon-storefront",           section: "tenant-review" },
    { label: "Subscription Billing", iconFileName: "icon-subscription-billing", section: "subscription-billing" },
    { label: "Audit Logs",           iconFileName: "icon-audit-logs",           section: "audit-logs" },
  ];

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem("token");
    
    setShowLogoutModal(false);

    // Replace the current history entry with the home page first
    router.replace("/");

    // Then force a hard reload to ensure all state is wiped
    setTimeout(() => {
      window.location.href = "/";
    }, 100);
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
            isActive={activeSection === item.section}
            onClick={() => setActiveSection(item.section)}
          />
        ))}
      </div>

      {/* Bottom Navigation & Divider */}
      <div className="w-full flex flex-col items-center gap-4 mt-10">
        <div className="w-48 h-px bg-white/10" />
        <div className="w-full flex flex-col gap-1">
          {/* Settings */}
          <NavItem
            label="Settings"
            iconFileName="icon-settings"
            isActive={false} // Settings opens a modal, so it doesn't need an active state
            onClick={() => setShowSettingsModal(true)}
          />
          {/* Logout */}
          <NavItem
            label="Logout"
            iconFileName="icon-logout"
            isActive={false}
            onClick={() => setShowLogoutModal(true)}
          />
        </div>
      </div>

      {/* Modals */}
      <LogoutModal
        isOpen={showLogoutModal}
        onCancel={() => setShowLogoutModal(false)}
        onConfirm={handleLogout}
      />
      <SettingsModal 
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
      />
    </div>
  );
}