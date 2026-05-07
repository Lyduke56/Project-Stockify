"use client";
import { useRouter, useParams, usePathname } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

// Note: Adjust these import paths if your file structure for the client sidebar differs from the superadmin one
import LogoutModal from "../modals/logout-modal";
import SettingsModal from "../modals/navbar-modals/settings";

type SidebarClientProps = {
  active?: "dashboard" | "billing" | "settings";
};

export default function SidebarClient({ active = "dashboard" }: SidebarClientProps) {
  const router = useRouter();
  const params = useParams();
  const pathname = usePathname();
  const supabase = createClient();

  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Fallback: extract shopName from the URL path if params doesn't resolve it
  const shopName = (params?.shopName as string) || pathname?.split("/")[1];

  const go = (href: string) => router.push(href);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem("token");
    
    setShowLogoutModal(false);

    // Replace the current history entry with the home page first
    router.replace("/");

    // Then force a hard reload to ensure all state is wiped
    setTimeout(() => {
      window.location.href = "/";
    }, 100);
  };

  // This filter approximates the amber-400 color when the item is active. 
  // You can adjust the hex-to-filter values if you need a slightly different shade.
  const activeIconStyle = { 
    filter: "brightness(0) saturate(100%) invert(74%) sepia(85%) saturate(3783%) hue-rotate(348deg) brightness(101%) contrast(104%)" 
  };

  return (
    <div className="w-64 h-screen fixed left-0 pt-20 pb-2.5 bg-amber-400 shadow-[2px_4px_18px_0px_rgba(0,0,0,0.25)] flex flex-col justify-start items-center gap-7 overflow-hidden">
        <div data-showaccounts="true" data-showanalytics="true" data-showaudit="false" data-showdashboard="true" data-showinventory="false" data-showorders="false" data-showrestockalert="false" data-showstockifyhub="false" data-showstorefront="false" data-showstoresettings="false" data-showsubscriptionbilling="true" data-showtenantmanagement="false" data-showuseradmin="false" className="self-stretch h-[563px] flex flex-col justify-start items-center gap-2.5 overflow-hidden">
            <button
              type="button"
              onClick={() => go(`/${shopName}/stockify-client-side/Dashboard`)}
              data-icon="true"
              data-property-1={active === "dashboard" ? "Hover" : "Main"}
              className={
                active === "dashboard"
                  ? "w-64 h-14 pl-5 pr-12 py-6 bg-lime-950 shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)] inline-flex justify-start items-center gap-2.5"
                  : "w-64 h-14 pl-5 pr-12 py-6 bg-amber-400 inline-flex justify-start items-center gap-2.5"
              }
            >
            <div className="w-10 h-10 flex items-center justify-center shrink-0">
                <img
                  src="/icon-dashboard.svg"
                  alt="Dashboard"
                  className="w-full h-full object-contain"
                  style={active === "dashboard" ? activeIconStyle : {}}
                />
            </div>
            <div data-property-1="x1" className="w-16 h-9 relative">
                <div
                  className={
                    active === "dashboard"
                      ? "left-0 top-[10px] absolute justify-center text-amber-400 text-base font-bold font-['Inter']"
                      : "left-0 top-[10px] absolute justify-center text-lime-900 text-base font-semibold font-['Inter']"
                  }
                >
                  Dashboard
                </div>
            </div>
            </button>
            
            <button
              type="button"
              onClick={() => go(`/${shopName}/stockify-client-side/billing`)}
              data-icon="true"
              data-property-1={active === "billing" ? "Hover" : "Main"}
              className={
                active === "billing"
                  ? "w-64 h-14 pl-5 pr-12 py-6 bg-lime-950 shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)] inline-flex justify-start items-center gap-2.5"
                  : "w-64 h-14 pl-5 pr-12 py-6 bg-amber-400 inline-flex justify-start items-center gap-2.5"
              }
            >
            <div className="w-10 h-10 flex items-center justify-center shrink-0">
                <img
                  src="/icon-subscription-billing.svg"
                  alt="Subscription Billing"
                  className="w-full h-full object-contain"
                  style={active === "billing" ? activeIconStyle : {}}
                />
            </div>
            <div data-property-1="x1" className="w-16 h-9 relative">
                <div
                  className={
                    active === "billing"
                      ? "left-0 top-[10px] absolute justify-center text-amber-400 text-base font-bold font-['Inter']"
                      : "left-0 top-[10px] absolute justify-center text-lime-900 text-base font-semibold font-['Inter']"
                  }
                >
                  Subscription Billing
                </div>
            </div>
            </button>
            
        </div>
        <div className="w-60 h-0 outline outline-[3px] outline-offset-[-1.50px] outline-green-950/20" />
        <div className="w-32 flex flex-col justify-center items-center gap-2.5">
            <div 
              data-showicon="true" 
              onClick={() => setShowSettingsModal(true)}
              className="self-stretch h-10 inline-flex justify-start items-start gap-2.5 cursor-pointer"
            >
            <div className="w-9 h-9 flex items-center justify-center shrink-0">
                <img
                  src="/icon-settings.svg"
                  alt="Settings"
                  className="w-full h-full object-contain"
                />
            </div>
            <div data-property-1="x2" className="w-16 h-9 relative">
                <div className="left-0 top-[10px] absolute justify-center text-lime-900 text-base font-semibold font-['Inter']">Settings</div>
            </div>
            </div>
            
            <div 
              data-showicon="true" 
              onClick={() => setShowLogoutModal(true)}
              className="self-stretch h-10 inline-flex justify-start items-start gap-2.5 cursor-pointer"
            >
            <div className="w-9 h-9 flex items-center justify-center shrink-0">
                <img
                  src="/icon-logout.svg"
                  alt="Logout"
                  className="w-full h-full object-contain"
                />
            </div>
            <div data-property-1="x2" className="w-16 h-9 relative">
                <div className="left-0 top-[10px] absolute justify-center text-lime-900 text-base font-semibold font-['Inter']">Logout</div>
            </div>
            </div>
        </div>

        {/* Modals */}
        <LogoutModal
          isOpen={showLogoutModal}
          onCancel={() => setShowLogoutModal(false)}
          onConfirm={handleLogout}
        />
        <SettingsModal 
          isOpen={showSettingsModal}
          onClose={() => setShowSettingsModal(false)}
        />
    </div>
  );
}