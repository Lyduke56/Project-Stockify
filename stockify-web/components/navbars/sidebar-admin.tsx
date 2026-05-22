"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getBusinessNameByUserId } from "@/backend/hooks/getTenantBName";
import { createClient } from "@/lib/supabase/client";
import type { SectionKey } from "@/app/[businessName]/administrator/dashboard/page";
import LogoutModal from "../modals/logout-modal";

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
          ? "bg-accent text-primary shadow-md font-bold"
          : "bg-transparent text-sidebar-text hover:bg-secondary font-semibold"
      }`}
    >
      <div className="w-8 h-8 flex items-center justify-center shrink-0">
        {/* Replaced <img> with a CSS mask div to inherit text color */}
        <div
          className="w-full h-full bg-current"
          style={{
            WebkitMaskImage: `url(/${iconFileName}.svg)`,
            maskImage: `url(/${iconFileName}.svg)`,
            WebkitMaskSize: "contain",
            maskSize: "contain",
            WebkitMaskRepeat: "no-repeat",
            maskRepeat: "no-repeat",
            WebkitMaskPosition: "center",
            maskPosition: "center",
          }}
          role="img"
          aria-label={label}
        />
      </div>
      <div className="text-base whitespace-nowrap">{label}</div>
    </div>
  );
}

interface SidebarAdminProps {
  activeSection: SectionKey;
  setActiveSection: (section: SectionKey) => void;
  openSettings: () => void;
}

export default function SidebarAdmin({
  activeSection,
  setActiveSection,
  openSettings, 
}: SidebarAdminProps) {
  const router = useRouter();
  const supabase = createClient();

  const [shopName, setShopName] = useState<string | null>(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  useEffect(() => {
    const fetchBusinessName = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const name = await getBusinessNameByUserId(user.id);
      setShopName(name?.business_name ?? null);
    };

    fetchBusinessName();
  }, [supabase]);

  const adminNavItems: {
    label: string;
    iconFileName: string;
    section: SectionKey;
  }[] = [
    {
      label: "Dashboard",
      iconFileName: "icon-dashboard",
      section: "dashboard",
    },
    {
      label: "User Administration",
      iconFileName: "icon-user-administration",
      section: "user-admin",
    },
    {
      label: "Storefront",
      iconFileName: "icon-storefront",
      section: "storefront",
    },
    {
      label: "Store Settings",
      iconFileName: "icon-store-settings",
      section: "store-settings",
    },
  ];

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setShowLogoutModal(false);
    router.push("/");
  };

  return (
    <div className="w-64 h-screen pt-12 pb-8 bg-primary shadow-lg flex flex-col justify-between sticky top-0 overflow-y-auto">
      {/* Top Navigation */}
      <div className="flex flex-col gap-1">
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

      {/* Bottom Section */}
      <div className="flex flex-col items-center gap-4 mt-10">
        <div className="w-48 h-px bg-white/10" />

        <div className="w-full flex flex-col gap-1">
          {/* Settings Tab */}
          <NavItem
            label="Settings"
            iconFileName="icon-settings"
            isActive={activeSection === ("admin-settings" as any)} 
            onClick={openSettings} 
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

      {/* Logout Modal */}
      <LogoutModal
        isOpen={showLogoutModal}
        onCancel={() => setShowLogoutModal(false)}
        onConfirm={handleLogout}
      />
    </div>
  );
}