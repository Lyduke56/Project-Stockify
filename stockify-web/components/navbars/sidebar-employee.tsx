"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getBusinessNameByUserId } from "@/backend/hooks/getTenantBName";
import { getUserData } from "@/backend/hooks/getUserRole";
import { createClient } from "@/lib/supabase/client";
import type { SectionKey } from "@/app/[businessName]/employee/dashboard/page";

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
          ? "bg-[#E5AD24] text-[#385E31] shadow-md font-bold"
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
      <div className="text-base whitespace-nowrap">{label}</div>
    </div>
  );
}

// Labels only visible to Managers (and above)
const MANAGER_ONLY_SECTIONS = new Set<SectionKey>([
  "analytics",
  "audit-logs",
  "transactions",
]);

interface SidebarEmployeeProps {
  activeSection: SectionKey;
  setActiveSection: (section: SectionKey) => void;
}

export default function SidebarEmployee({ activeSection, setActiveSection }: SidebarEmployeeProps) {
  const router   = useRouter();
  const supabase = createClient();

  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        window.location.replace("/");
        return;
      }

      const [name, userRole] = await Promise.all([
        getBusinessNameByUserId(user.id),
        getUserData(user.id),
      ]);

      const normalized = userRole?.toLowerCase();

      if (!normalized || !["employee", "manager"].includes(normalized)) {
        window.location.replace("/access-denied");
        return;
      }

      setRole(userRole);
    };

    init();
  }, [router, supabase.auth]);

  const isEmployee = role?.toLowerCase() === "employee";

  const allNavItems: { label: string; iconFileName: string; section: SectionKey }[] = [
    { label: "Dashboard",           iconFileName: "icon-dashboard",          section: "dashboard"           },
    { label: "Products",            iconFileName: "icon-inventory",          section: "products"            },
    { label: "Stock Inventory",     iconFileName: "icon-ingredients",        section: "ingredients"         },
    { label: "Orders",              iconFileName: "icon-orders",             section: "orders"              },
    { label: "Analytics & Orders",  iconFileName: "icon-chart2",             section: "analytics"           },
    { label: "Stock Notifications", iconFileName: "icon-stocknotifications", section: "stock-notifications" },
    { label: "Audit Logs",          iconFileName: "icon-audit-logs",         section: "audit-logs"          },
    { label: "Transactions",        iconFileName: "icon-transactions",       section: "transactions"        },
  ];

  const navItems = isEmployee
    ? allNavItems.filter((item) => !MANAGER_ONLY_SECTIONS.has(item.section))
    : allNavItems;

  const bottomNavItems: { label: string; iconFileName: string; section: SectionKey }[] = [
    { label: "Settings", iconFileName: "icon-settings", section: "store-settings" },
  ];

  const bottomItems = [
    { label: "Logout", iconFileName: "icon-logout", path: "/logout" },
  ];

  if (role === null) return null;

  return (
    <div className="w-64 h-screen pt-12 pb-8 bg-[#385E31] shadow-lg flex flex-col justify-between sticky top-0 overflow-y-auto">

      {/* Top Navigation */}
      <div className="flex flex-col gap-1">
        {navItems.map((item) => (
          <NavItem
            key={item.label}
            label={item.label}
            iconFileName={item.iconFileName}
            isActive={activeSection === item.section}
            onClick={() => setActiveSection(item.section)}
          />
        ))}
      </div>

      {/* Bottom Navigation */}
      <div className="flex flex-col items-center gap-4 mt-10">
        <div className="w-48 h-px bg-white/10" />
        <div className="w-full flex flex-col gap-1">

          {bottomNavItems.map((item) => (
            <NavItem
              key={item.label}
              label={item.label}
              iconFileName={item.iconFileName}
              isActive={activeSection === item.section}
              onClick={() => setActiveSection(item.section)}
            />
          ))}

          {bottomItems.map((item) => (
  <NavItem
    key={item.label}
    label={item.label}
    iconFileName={item.iconFileName}
    isActive={false}
    onClick={async () => {
  if (item.label === "Logout") {
    const supabase = createClient();
    await supabase.auth.signOut();
    
    // 1. Wipe local storage if you use it (like in SuperAdmin)
    localStorage.removeItem("token");

    // 2. SuperAdmin Strategy: Replace history first
    router.replace("/");

    // 3. Force a hard reload to kill all remaining state/cache
    setTimeout(() => {
      window.location.href = "/";
    }, 100);
  }
}}
  />
))}

        </div>
      </div>

    </div>
  );
}