"use client";

import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { getBusinessNameByUserId } from "@/backend/hooks/getTenantBName";
import { getUserData } from "@/backend/hooks/getUserData";
import { createClient } from "@/lib/supabase/client";

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
        <img src={`/${iconFileName}.svg`} alt={label} className="w-full h-full object-contain" />
      </div>
      <div className="text-base whitespace-nowrap">{label}</div>
    </div>
  );
}

// Items visible to Managers (and above)
const MANAGER_ONLY_LABELS = new Set([
  "Analytics & Orders",
  "Audit Logs",
  "Transactions",
]);

export default function SidebarEmployee() {
  const router   = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  const [shopName, setShopName] = useState<string | null>(null);
  const [role, setRole]         = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/access-denied");
        return;
      }

      const [name, userRole] = await Promise.all([
        getBusinessNameByUserId(user.id),
        getUserData(user.id),
      ]);

      const normalized = userRole?.toLowerCase();

      // Redirect if role is unrecognized
      if (!normalized || !["employee", "manager"].includes(normalized)) {
        router.push("/access-denied");
        return;
      }

      setShopName(name);
      setRole(userRole);
    };

    init();
  }, []);

  const isEmployee = role?.toLowerCase() === "employee";

  const allNavItems = [
    { label: "Dashboard",          iconFileName: "icon-dashboard",           path: shopName ? `/${shopName}/employee/dashboard`           : null },
    { label: "Inventory",          iconFileName: "icon-inventory",            path: shopName ? `/${shopName}/employee/inventory`            : null },
    { label: "Orders",             iconFileName: "icon-orders",               path: shopName ? `/${shopName}/employee/orders`               : null },
    { label: "Analytics & Orders", iconFileName: "icon-chart2",              path: shopName ? `/${shopName}/employee/analytics`            : null },
    { label: "Stock Notifications",iconFileName: "icon-stocknotifications",   path: shopName ? `/${shopName}/employee/stock-notifications`  : null },
    { label: "Audit Logs",         iconFileName: "icon-audit-logs",           path: shopName ? `/${shopName}/employee/audit-logs`           : null },
    { label: "Transactions",       iconFileName: "icon-transactions",         path: shopName ? `/${shopName}/employee/transactions`         : null },
  ];

  // Employees only see Orders, Inventory, Stock Notifications
  const navItems = isEmployee
    ? allNavItems.filter((item) => !MANAGER_ONLY_LABELS.has(item.label))
    : allNavItems;

  const bottomItems = [
    { label: "Settings", iconFileName: "icon-settings", path: "/superadmin/profile-settings" },
    { label: "Logout",   iconFileName: "icon-logout",   path: "/logout" },
  ];

  const handleNavigation = (path: string | null) => {
    if (path) router.push(path);
  };
    if (role === null) return null;
  return (
    <div className="w-64 h-screen pt-12 pb-8 bg-[#385E31] shadow-lg flex flex-col justify-between sticky top-0 overflow-y-auto">

      <div className="flex flex-col gap-1">
        {navItems.map((item) => (
          <NavItem
            key={item.label}
            label={item.label}
            iconFileName={item.iconFileName}
            isActive={pathname === item.path}
            onClick={() => handleNavigation(item.path)}
          />
        ))}
      </div>

      <div className="flex flex-col items-center gap-4 mt-10">
        <div className="w-48 h-px bg-white/10" />
        <div className="w-full flex flex-col gap-1">
          {bottomItems.map((item) => (
            <NavItem
              key={item.label}
              label={item.label}
              iconFileName={item.iconFileName}
              isActive={pathname === item.path}
              onClick={() => handleNavigation(item.path)}
            />
          ))}
        </div>
      </div>

    </div>
  );
}