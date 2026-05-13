"use client";

import { useRouter, useParams, usePathname } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

import LogoutModal from "../modals/logout-modal";
// Removed SettingsModal import!

type SidebarClientProps = {
  active?: "dashboard" | "billing" | "settings";
};

interface NavItemProps {
  label: string;
  iconFileName: string;
  isActive: boolean;
  onClick: () => void;
}

// ── Reusable NavItem Component ──────────────────────────────
function NavItem({ label, iconFileName, isActive, onClick }: NavItemProps) {
  return (
    <div
      onClick={onClick}
      className={`w-full h-14 pl-6 pr-4 flex items-center gap-4 cursor-pointer transition-all duration-200 ${
        isActive
          ? "bg-lime-950 text-amber-400 shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)] font-bold"
          : "bg-transparent text-lime-900 hover:bg-amber-300 font-semibold"
      }`}
    >
      <div className="w-8 h-8 flex items-center justify-center shrink-0">
        <img
          src={`/${iconFileName}.svg`}
          alt={label}
          className="w-full h-full object-contain"
          style={
            isActive
              // Perfect hex match for Tailwind's amber-400 (#fbbf24)
              ? { filter: "brightness(0) saturate(100%) invert(80%) sepia(35%) saturate(1210%) hue-rotate(344deg) brightness(101%) contrast(97%)" }
              // Perfect hex match for Tailwind's lime-900 (#365314)
              : { filter: "brightness(0) saturate(100%) invert(26%) sepia(16%) saturate(1759%) hue-rotate(50deg) brightness(95%) contrast(89%)" }
          }
        />
      </div>
      <div className="text-base font-['Inter'] whitespace-nowrap">{label}</div>
    </div>
  );
}

// ── Main Sidebar Component ──────────────────────────────────────────────────
export default function SidebarClient({ active = "dashboard" }: SidebarClientProps) {
  const router = useRouter();
  const params = useParams();
  const pathname = usePathname();
  const supabase = createClient();

  const [showLogoutModal, setShowLogoutModal] = useState(false);
  // Removed showSettingsModal state!

  // Fallback: extract shopName from the URL path if params doesn't resolve it
  const shopName = (params?.shopName as string) || pathname?.split("/")[1];

  const clientNavItems = [
    { id: "dashboard", label: "Dashboard",            iconFileName: "icon-dashboard",            path: `/${shopName}/stockify-client-side/Dashboard` },
    { id: "billing",   label: "Subscription Billing", iconFileName: "icon-subscription-billing", path: `/${shopName}/stockify-client-side/billing` },
  ];

  const bottomItems = [
    // Added the path route for the new settings page based on your file structure
    { id: "settings", label: "Settings", iconFileName: "icon-settings", path: `/${shopName}/stockify-client-side/settings` },
    { id: "logout",   label: "Logout",   iconFileName: "icon-logout" },
  ];

  const handleNavigation = (id: string, path?: string) => {
    if (id === "logout") {
      setShowLogoutModal(true);
      return;
    }
    // Removed the "settings" intercept block so it falls through to router.push()
    if (path) {
      router.push(path);
    }
  };

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
    <div className="w-64 h-screen fixed left-0 top-0 pt-20 pb-8 bg-amber-400 shadow-[2px_4px_18px_0px_rgba(0,0,0,0.25)] flex flex-col justify-between shrink-0 overflow-y-auto z-40">
      
      {/* Top Navigation Links */}
      <div className="w-full flex flex-col gap-1 mt-2">
        {clientNavItems.map((item) => (
          <NavItem
            key={item.id}
            label={item.label}
            iconFileName={item.iconFileName}
            isActive={active === item.id}
            onClick={() => handleNavigation(item.id, item.path)}
          />
        ))}
      </div>

      {/* Bottom Navigation & Divider */}
      <div className="w-full flex flex-col items-center gap-4 mt-10">
        <div className="w-48 h-[2px] bg-lime-950/10 rounded-full" />
        
        <div className="w-full flex flex-col gap-1">
          {bottomItems.map((item) => (
            <NavItem
              key={item.id}
              label={item.label}
              iconFileName={item.iconFileName}
              isActive={active === item.id}
              // Make sure to pass item.path here so handleNavigation receives it!
              onClick={() => handleNavigation(item.id, item.path)}
            />
          ))}
        </div>
      </div>

      {/* Modals */}
      <LogoutModal
        isOpen={showLogoutModal}
        onCancel={() => setShowLogoutModal(false)}
        onConfirm={handleLogout}
      />
      {/* Removed SettingsModal component! */}
    </div>
  );
}