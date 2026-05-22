"use client"

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import NavbarEmployee from "@/components/navbars/navbar-employee";
import SidebarEmployee from "@/components/navbars/sidebar-employee";
import type { SectionKey, SidebarData } from "@/app/[businessName]/employee/dashboard/page";
import LoadingScreen from "@/app/loading-screen/loading";

import ProductsSection from "@/components/sections/employee/products";
import IngredientsSection from "@/components/sections/employee/ingredients";

export default function EmployeeInventory() {
  const [activeSection, setActiveSection] = useState<SectionKey>("products");
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
        role: userData.role ?? "",
        businessType: tenant?.business_type ?? "",
        businessName: tenant?.business_name ?? "",
      });
    };

    loadAll().finally(() => setIsLoading(false));
  }, []);

  if (isLoading) return <LoadingScreen />;

  return (
    <div className="flex h-screen w-full bg-[#FFFCEB] overflow-hidden font-['Inter']">

      <SidebarEmployee
        onOpenSettings={() => console.log("Open settings clicked")}
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        sidebarData={sidebarData!}
      />

      <div className="flex-1 flex flex-col h-full overflow-y-auto px-20 pt-5 pb-12">
        <NavbarEmployee
          setActiveSection={setActiveSection}
          openProfile={() => console.log("Open Profile Modal")}
          openNotifs={() => console.log("Open Notifications Modal")}
          openSettings={() => console.log("Open Settings Modal")}
        />

        {activeSection === "products" && <ProductsSection />}
        {activeSection === "ingredients" && <IngredientsSection />}
      </div>
    </div>
  );
}