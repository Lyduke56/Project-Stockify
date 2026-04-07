"use client";

import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { getBusinessNameByUserId } from "@/backend/hooks/getTenantBName";
import { createClient } from "@/lib/supabase/client";

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
          src={`/${iconFileName}.svg`}
          alt={label}
          className="w-full h-full object-contain"
        />
      </div>
      <div className="text-base whitespace-nowrap">{label}</div>
    </div>
  );
}

// --- Main Admin Sidebar Component ---
export default function SidebarAdmin() {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  const [shopName, setShopName] = useState<string | null>(null);

  useEffect(() => {
    const fetchBusinessName = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const name = await getBusinessNameByUserId(user.id);
      setShopName(name);
    };

    fetchBusinessName();
  }, []);

  const adminNavItems = [
    { label: "Dashboard", iconFileName: "icon-dashboard", path: shopName ? `/${shopName}/administrator/dashboard` : null },
    { label: "User Administration", iconFileName: "icon-user-admin", path: shopName ? `/${shopName}/administrator/user-admin` : null },
    { label: "Storefront", iconFileName: "icon-storefront", path: shopName ? `/${shopName}/administrator/storefront` : null },
    { label: "Store Settings", iconFileName: "icon-store-settings", path: shopName ? `/${shopName}/administrator/store-settings` : null },
    { label: "Subscription Billing", iconFileName: "icon-subscription-billing", path: shopName ? `/${shopName}/administrator/subscription-billing` : null },
  ];

  const bottomItems = [
    { label: "Settings", iconFileName: "icon-settings", path: "/superadmin/profile-settings" },
    { label: "Logout", iconFileName: "icon-logout", path: "/logout" },
  ];

  const handleNavigation = (path: string | null) => {
    if (path && path !== "#") router.push(path);
  };

  return (
    <div className="w-64 h-screen pt-12 pb-8 bg-[#385E31] shadow-lg flex flex-col justify-between sticky top-0 overflow-y-auto">

      {/* Top Navigation */}
      <div className="flex flex-col gap-1">
        {adminNavItems.map((item) => (
          <NavItem
            key={item.label}
            label={item.label}
            iconFileName={item.iconFileName}
            isActive={pathname === item.path}
            onClick={() => handleNavigation(item.path)}
          />
        ))}
      </div>

      {/* Bottom */}
      <div className="flex flex-col items-center gap-4 mt-10">
        <div className="w-48 h-px bg-white/10"></div>
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