"use client";

import SidebarClient from "@/components/navbars/sidebar-client";
import NavbarClient from "@/components/navbars/navbar-client";

export default function ClientNotifications() {

  return (
    <div className="min-h-screen bg-white flex overflow-x-hidden">
      <SidebarClient active="dashboard" />

      <main className="flex-1 px-4 py-6 sm:px-6 sm:py-8">
        <div className="mx-auto w-full max-w-6xl space-y-6">
          {/* TOP BAR */}
          <NavbarClient />

          {/* TAB HEADER */}
          <section className="w-full h-12 inline-flex flex-col justify-start items-start gap-[3.23px]">
            <div className="self-stretch h-7 relative">
              <div className="left-5 top-[-1.62px] absolute justify-start text-lime-800 text-2xl font-bold font-['Inter'] leading-7">Notifications </div>
            </div>
            <div className="self-stretch h-5 relative">
              <div className="left-5 top-[-1.62px] absolute justify-start text-lime-800/70 text-xs font-normal font-['Inter'] leading-5">Stay updated with the latest notifications</div>
            </div>
          </section>


        </div>
      </main>
    </div>
  );
}

