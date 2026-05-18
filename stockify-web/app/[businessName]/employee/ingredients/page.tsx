"use client"

import { useState } from "react";
import NavbarEmployee from "@/components/navbars/navbar-employee";
import SidebarEmployee from "@/components/navbars/sidebar-employee";
import type { SectionKey } from "@/app/[businessName]/employee/dashboard/page";

// Import our modular child screens
import ProductsSection from "@/components/sections/employee/products";
import IngredientsSection from "@/components/sections/employee/ingredients";

export default function EmployeeInventory() {
  const [activeSection, setActiveSection] = useState<SectionKey>("products"); 
  
  // Placeholder functions
  const handleOpenProfile = () => console.log("Open Profile Modal");
  const handleOpenNotifs = () => console.log("Open Notifications Modal");
  const handleOpenSettings = () => console.log("Open Settings Modal");

  return (
    <div className="flex h-screen w-full bg-[#FFFCEB] overflow-hidden font-['Inter']">
      
      {/* LEFT SIDE: Fixed Sidebar */}
      <SidebarEmployee 
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        onOpenSettings={() => console.log("Open settings clicked")}
      />

      {/* RIGHT SIDE: Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-y-auto px-20 pt-5 pb-12">
        <NavbarEmployee 
          setActiveSection={setActiveSection}
          openProfile={handleOpenProfile}
          openNotifs={handleOpenNotifs}
          openSettings={handleOpenSettings}
        />

        {/* ── Conditional Rendering of Child Screens ── */}
        {/* Render Products when 'inventory' is selected */}
        {activeSection === "products" && <ProductsSection />}

        {/* Render Ingredients when 'ingredients' is selected */}
        {activeSection === "ingredients" && <IngredientsSection />}

        {/* Add more sections here as needed (e.g., activeSection === "orders") */}
      </div>
    </div>
  );
}