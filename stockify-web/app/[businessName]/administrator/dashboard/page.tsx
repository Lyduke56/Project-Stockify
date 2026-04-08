"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import NavbarAdmin from "@/components/navbars/navbar-admin";
import SidebarAdmin from "@/components/navbars/sidebar-admin";

import DashboardSection from "@/components/sections/admin/dashboard-home";
import UserAdminSection from "@/components/sections/admin/user-admin";
import StorefrontSection from "@/components/sections/admin/storefront";
import StoreSettingsSection from "@/components/sections/admin/store-settings";
import SubscriptionBillingSection from "@/components/sections/admin/subscription-billing";  

export type SectionKey =
  | "dashboard"
  | "user-admin"
  | "storefront"
  | "store-settings"
  | "subscription-billing";

const SECTIONS: Record<SectionKey, React.ReactNode> = {
  "dashboard": <DashboardSection />,
  "user-admin": <UserAdminSection />,
  "storefront": <StorefrontSection />,
  "store-settings": <StoreSettingsSection />,
  "subscription-billing": <SubscriptionBillingSection />
};

export default function AdminDashboard() {
  const searchParams = useSearchParams();

  // 1. We are back to using standard React state! 
  const [activeSection, setActiveSection] = useState<SectionKey>("dashboard");

  // 2. On first load ONLY: check if someone shared a link with a ?section= param
  useEffect(() => {
    const querySection = searchParams.get("section") as SectionKey;
    if (querySection && Object.keys(SECTIONS).includes(querySection)) {
      setActiveSection(querySection);
    }
  }, [searchParams]);

  // 3. Custom handler: Updates React state instantly, then silently updates the URL
  const handleSetSection = (section: SectionKey) => {
    setActiveSection(section); // Snap! Instant UI change
    window.history.pushState(null, '', `?section=${section}`); // Sneaky URL change without triggering a Next.js page reload
  };

  return (
    <div className="flex min-h-screen bg-[#FFFCF0]">
      <SidebarAdmin
        activeSection={activeSection}
        setActiveSection={handleSetSection} 
      />
      <div className="flex-1 flex flex-col h-full overflow-y-auto px-20 pt-5 pb-12">
        <NavbarAdmin
          activeSection={activeSection}
          setActiveSection={handleSetSection}
        />
        <main className="p-10">
          {SECTIONS[activeSection]}
        </main>
      </div>
    </div>
  );
}