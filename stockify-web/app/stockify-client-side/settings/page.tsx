"use client";

import SidebarClient from "@/components/navbars/sidebar-client";
import NavbarClient from "@/components/navbars/navbar-client";

export default function ClientSettings() {

  return (
    <div className="min-h-screen bg-white flex overflow-x-hidden">
      <SidebarClient active="dashboard" />

      <main className="flex-1 px-4 py-6 sm:px-6 sm:py-8">
        <div className="mx-auto w-full max-w-6xl space-y-6">
          {/* TOP BAR */}
          <NavbarClient />

          
        </div>
      </main>
    </div>
  );
}

