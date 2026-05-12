"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getBusinessNameByUserId } from "@/backend/hooks/getTenantBName";
import { getUserData } from "@/backend/hooks/getUserRole";
import { createClient } from "@/lib/supabase/client";
import { getCurrentUserContext, type BusinessType } from "@/lib/employee/inventory";
import type { SectionKey } from "@/app/[businessName]/employee/dashboard/page";

// ── Permissions ──────────────────────────────────────────────

const MANAGER_ONLY_SECTIONS = new Set<SectionKey>([
  "audit-logs",
  "transactions",
]);

const FNB_ONLY_SECTIONS = new Set<SectionKey>([
  "ingredients", // This corresponds to "Stock Inventory"
]);

// ── Component ────────────────────────────────────────────────

interface SidebarEmployeeProps {
  activeSection:    SectionKey;
  setActiveSection: (section: SectionKey) => void;
}

export default function SidebarEmployee({ activeSection, setActiveSection }: SidebarEmployeeProps) {
  const router   = useRouter();
  const supabase = createClient();

  const [role,         setRole]         = useState<string | null>(null);
  const [businessType, setBusinessType] = useState<string | null>(null);
  const [loading,      setLoading]      = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          window.location.replace("/");
          return;
        }

        const [userRole, ctx] = await Promise.all([
          getUserData(user.id),
          getCurrentUserContext(),
        ]);

        console.log("DEBUG - Database Business Type:", ctx?.businessType);
        
        setRole(userRole);
        if (ctx) setBusinessType(ctx.businessType);
      } catch (err) {
        console.error("Sidebar init error:", err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [supabase.auth]);

  // ── Logic ──────────────────────────────────────────────────

  // We trim and lowercase to handle "Food and Beverage", "food and beverage", or "Food and Beverage "
  const cleanType = businessType?.toLowerCase().trim() || "";
  const isFnb = cleanType === "food & beverage";
  const isEmployee = role?.toLowerCase() === "employee";

  const allNavItems = [
    { label: "Dashboard",       iconFileName: "icon-dashboard",    section: "dashboard"    },
    { label: "Products",        iconFileName: "icon-inventory",    section: "products"     },
    { label: "Stock Inventory", iconFileName: "icon-ingredients",  section: "ingredients"  },
    { label: "Orders",          iconFileName: "icon-orders",       section: "orders"       },
    { label: "Audit Logs",      iconFileName: "icon-audit-logs",   section: "audit-logs"  },
    { label: "Transactions",    iconFileName: "icon-transactions", section: "transactions" },
  ];

  const navItems = allNavItems.filter((item) => {
    // 1. Hide manager sections from employees
    if (isEmployee && MANAGER_ONLY_SECTIONS.has(item.section as SectionKey)) return false;

    // 2. Hide "ingredients" if the tenant is NOT F&B
    if (FNB_ONLY_SECTIONS.has(item.section as SectionKey) && !isFnb) return false;

    return true;
  });

  // ── Render ─────────────────────────────────────────────────

  if (loading || role === null) return null;

  return (
    <div className="w-64 h-screen pt-6 pb-8 bg-[#385E31] shadow-lg flex flex-col justify-between sticky top-0 overflow-y-auto">

      <div className="flex flex-col gap-1">
        {navItems.map((item) => (
          <div
            key={item.label}
            onClick={() => setActiveSection(item.section as SectionKey)}
            className={`w-full h-14 pl-6 pr-4 flex items-center gap-4 cursor-pointer transition-all duration-200 ${
              activeSection === item.section
                ? "bg-[#E5AD24] text-[#385E31] shadow-md font-bold"
                : "bg-transparent text-[#FFF9D7] hover:bg-[#368028] font-semibold"
            }`}
          >
            <div className="w-8 h-8 flex items-center justify-center shrink-0">
              <img 
                src={`/${item.iconFileName}.svg`} 
                className="w-full h-full object-contain"
                style={activeSection === item.section ? { filter: "brightness(0) saturate(100%) invert(32%) sepia(16%) saturate(1553%) hue-rotate(69deg) brightness(97%) contrast(85%)" } : {}}
              />
            </div>
            <div className="text-base whitespace-nowrap">{item.label}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-col items-center gap-4 mt-10">
        <div className="w-48 h-px bg-white/10" />
        <div className="w-full flex flex-col gap-1">
          <div
            onClick={() => setActiveSection("store-settings")}
            className={`w-full h-14 pl-6 pr-4 flex items-center gap-4 cursor-pointer ${activeSection === "store-settings" ? "bg-[#E5AD24] text-[#385E31]" : "text-[#FFF9D7]"}`}
          >
            <img src="/icon-settings.svg" className="w-8 h-8" />
            <span className="font-semibold">Settings</span>
          </div>
          <div
            onClick={async () => {
              await supabase.auth.signOut();
              router.replace("/");
            }}
            className="w-full h-14 pl-6 pr-4 flex items-center gap-4 cursor-pointer text-[#FFF9D7] hover:bg-[#368028]"
          >
            <img src="/icon-logout.svg" className="w-8 h-8" />
            <span className="font-semibold">Logout</span>
          </div>
        </div>
      </div>
    </div>
  );
}