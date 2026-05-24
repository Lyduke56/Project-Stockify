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
}

export default function SidebarEmployee({ 
  activeSection, 
  setActiveSection, 
  onOpenSettings, 
  sidebarData = { role: "Employee", businessType: "", businessName: "" } 
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

  return (
    <div className="w-64 h-screen pt-6 pb-8 bg-primary shadow-lg flex flex-col justify-between sticky top-0 overflow-y-auto">

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
              <img
                src={`/${item.iconFileName}.svg`}
                className="w-full h-full object-contain"
                style={activeSection === item.section
                  ? { filter: "brightness(0) saturate(100%) invert(32%) sepia(16%) saturate(1553%) hue-rotate(69deg) brightness(97%) contrast(85%)" }
                  : {}}
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
              <img src="/icon-settings.svg" className="w-full h-full object-contain" />
            </div>
            <span className="text-base">Settings</span>
          </button>

          {/* Logout Button */}
          <button
            onClick={() => setShowLogoutModal(true)}
            className="w-full h-14 pl-6 pr-4 flex items-center gap-4 cursor-pointer text-sidebar-text hover:bg-secondary font-semibold"
          >
            <div className="w-8 h-8 flex items-center justify-center shrink-0">
              <img src="/icon-logout.svg" className="w-full h-full object-contain" />
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
      />
    </div>
  );
}