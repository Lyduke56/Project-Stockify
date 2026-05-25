"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import NavbarEmployee from "@/components/navbars/navbar-employee";
import SidebarEmployee from "@/components/navbars/sidebar-employee";
import AnalyticsReports from "@/components/sections/employee/AnalyticsReports";
import LoadingScreen from "@/app/loading-screen/loading";
import type { SectionKey, SidebarData } from "@/app/[businessName]/employee/dashboard/page";

export default function EmployeeAnalytics() {
  const [activeSection, setActiveSection] = useState<SectionKey>("analytics");
  const [sidebarData, setSidebarData] = useState<SidebarData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadAll = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: userData } = await supabase
        .from("users")
        .select(`
          role,
          tenant_id,
          tenants (
            business_name,
            business_type
          )
        `)
        .eq("user_id", user.id)
        .single();

      if (!userData) return;

      const tenant = userData.tenants as any;
      setSidebarData({
        role:         userData.role ?? "",
        businessType: tenant?.business_type ?? "",
        businessName: tenant?.business_name ?? "",
      });
    };

    loadAll().finally(() => setIsLoading(false));
  }, []);

  if (isLoading) return <LoadingScreen />;

  return (
    <div className="flex min-h-screen w-full bg-[#FFFCEB] font-['Inter']">

      {/* LEFT SIDE: Fixed Sidebar */}
      <SidebarEmployee
        activeSection={activeSection}
        onOpenSettings={() => console.log("Open settings clicked")}
        setActiveSection={setActiveSection}
        sidebarData={sidebarData!}
      />

      {/* RIGHT SIDE: Main Column */}
      <div className="flex-1 flex flex-col w-full">

        <div className="shrink-0">
          <NavbarEmployee
            setActiveSection={setActiveSection}
            openProfile={() => console.log("Open Profile Modal")}
            openNotifs={() => console.log("Open Notifications Modal")}
            openSettings={() => console.log("Open Settings Modal")}
          />
        </div>

        <div className="px-10 pt-5 pb-12">
          <AnalyticsReports />
        </div>

      </div>
    </div>
  );
}