"use client";

import { useState } from "react";
import { useRouter, useParams, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { SectionKey, SidebarData } from "@/app/[businessName]/employee/dashboard/page";
import LogoutModal from "../modals/logout-modal";

interface SidebarEmployeeProps {
  activeSection:    SectionKey;
  setActiveSection: (section: SectionKey) => void;
  onOpenSettings:   () => void;
  sidebarData?:     SidebarData;
  colors?: {
    color_primary?: string;
    color_background?: string;
    color_secondary?: string;
    color_accent?: string;
    color_text?: string;
    color_sidebar_text?: string;
  };
}

export default function SidebarEmployee({ 
  activeSection, 
  setActiveSection, 
  onOpenSettings, 
  sidebarData = { role: "Employee", businessType: "", businessName: "" },
  colors,
}: SidebarEmployeeProps) {
  const router = useRouter();
  const params = useParams();
  const pathname = usePathname();
  const businessNameSlug = (params?.businessName as string) || pathname?.split("/")[1];
  const supabase = createClient();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const { role = "", businessType = "", businessName = "" } = sidebarData ?? {};

  const cleanType  = businessType?.toLowerCase().trim() || "";
  const isFnb      = cleanType === "food & beverage";
  const isEmployee = role?.toLowerCase() === "employee";

  const allNavItems = [
    { label: "Dashboard",       iconFileName: "icon-dashboard",    section: "dashboard"    },
    { label: "Products",        iconFileName: "icon-inventory",    section: "products"     },
    { label: "Stock Inventory", iconFileName: "icon-ingredients",  section: "ingredients"  },
    { label: "Orders",          iconFileName: "icon-orders",       section: "orders"       },
    { label: "Audit Logs",      iconFileName: "icon-audit-logs",   section: "audit-logs"   },
    { label: "Transactions",    iconFileName: "icon-transactions", section: "transactions" },
  ];

  const navItems = allNavItems.filter((item) => {
    if (isEmployee && (item.section === "audit-logs" || item.section === "transactions")) return false;
    if (item.section === "ingredients" && !isFnb) return false;
    return true;
  });

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      localStorage.clear();
      sessionStorage.clear();
      setShowLogoutModal(false);
      const targetPath = businessNameSlug ? `/${businessNameSlug}/login` : "/";
      window.location.href = targetPath;
    } catch (error) {
      console.error("Logout execution error:", error);
      setShowLogoutModal(false);
    }
  };

  const sidebarStyles = {
    "--color-primary": colors?.color_primary || "#385E31",
    "--color-background": colors?.color_background || "#FFFCEB",
    "--color-secondary": colors?.color_secondary || "#2A4725",
    "--color-accent": colors?.color_accent || "#E5AC24",
    "--color-sidebar-text": colors?.color_sidebar_text || "#FFF9D7",
  } as React.CSSProperties;

  return (
    <div style={sidebarStyles} className="w-64 h-screen pt-6 pb-8 bg-primary shadow-lg flex flex-col justify-between sticky top-0 overflow-y-auto">

      <div className="flex flex-col gap-1">
        {navItems.map((item) => (
          <div
            key={item.label}
            onClick={() => setActiveSection(item.section as SectionKey)}
            className={`w-full h-14 pl-6 pr-4 flex items-center gap-4 cursor-pointer transition-all duration-200 ${
              activeSection === item.section
                ? "bg-accent text-primary shadow-md font-bold"
                : "bg-transparent text-sidebar-text hover:bg-secondary font-semibold"
            }`}
          >
            <div className="w-8 h-8 flex items-center justify-center shrink-0">
              <div
                className="w-full h-full bg-current"
                style={{
                  WebkitMaskImage: `url(/${item.iconFileName}.svg)`,
                  maskImage: `url(/${item.iconFileName}.svg)`,
                  WebkitMaskSize: "contain",
                  maskSize: "contain",
                  WebkitMaskRepeat: "no-repeat",
                  maskRepeat: "no-repeat",
                  WebkitMaskPosition: "center",
                  maskPosition: "center",
                }}
                role="img"
                aria-label={item.label}
              />
            </div>
            <div className="text-base whitespace-nowrap">{item.label}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-col items-center gap-4 mt-10">
        <div className="w-48 h-px bg-white/10" />
        <div className="w-full flex flex-col gap-1">
          {/* Settings Tab */}
          <button
            onClick={onOpenSettings}
            className="w-full h-14 pl-6 pr-4 flex items-center gap-4 cursor-pointer text-sidebar-text hover:bg-secondary font-semibold"
          >
            <div className="w-8 h-8 flex items-center justify-center shrink-0">
              <div
                className="w-full h-full bg-current"
                style={{
                  WebkitMaskImage: "url(/icon-settings.svg)",
                  maskImage: "url(/icon-settings.svg)",
                  WebkitMaskSize: "contain",
                  maskSize: "contain",
                  WebkitMaskRepeat: "no-repeat",
                  maskRepeat: "no-repeat",
                  WebkitMaskPosition: "center",
                  maskPosition: "center",
                }}
                role="img"
                aria-label="Settings"
              />
            </div>
            <span className="text-base">Settings</span>
          </button>

          {/* Logout Button */}
          <button
            onClick={() => setShowLogoutModal(true)}
            className="w-full h-14 pl-6 pr-4 flex items-center gap-4 cursor-pointer text-sidebar-text hover:bg-secondary font-semibold"
          >
            <div className="w-8 h-8 flex items-center justify-center shrink-0">
              <div
                className="w-full h-full bg-current"
                style={{
                  WebkitMaskImage: "url(/icon-logout.svg)",
                  maskImage: "url(/icon-logout.svg)",
                  WebkitMaskSize: "contain",
                  maskSize: "contain",
                  WebkitMaskRepeat: "no-repeat",
                  maskRepeat: "no-repeat",
                  WebkitMaskPosition: "center",
                  maskPosition: "center",
                }}
                role="img"
                aria-label="Logout"
              />
            </div>
            <span className="text-base">Logout</span>
          </button>
        </div>
      </div>

      {/* Logout Modal */}
      <LogoutModal
        isOpen={showLogoutModal}
        onCancel={() => setShowLogoutModal(false)}
        onConfirm={handleLogout}
        colors={colors}
      />
    </div>
  );
}