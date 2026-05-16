"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { SectionKey } from "@/app/[businessName]/administrator/dashboard/page";

interface NavbarAdminProps {
  setActiveSection: (section: SectionKey) => void;
  openProfile: () => void;
  openNotifs: () => void;
  openSettings: () => void;
}

export default function NavbarAdmin({ 
  setActiveSection, 
  openProfile, 
  openNotifs,
  openSettings
}: NavbarAdminProps) {
  const supabase = createClient();
  const [notifCount, setNotifCount] = useState<number>(0);
  const [tenantId, setTenantId] = useState<string | null>(null);

  useEffect(() => {
    const initNotifications = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Resolve tenant mapping via user metadata or profile lookup
      const { data: userProfile } = await supabase
        .from("users")
        .select("tenant_id")
        .eq("user_id", user.id)
        .single();

      if (userProfile?.tenant_id) {
        setTenantId(userProfile.tenant_id);

        // Fetch initial billing alerts count
        const { count, error } = await supabase
          .from("billing_notifications")
          .select("*", { count: "exact", head: true })
          .eq("tenant_id", userProfile.tenant_id);

        if (!error && count !== null) {
          setNotifCount(count);
        }
      }
    };

    initNotifications();
  }, []);

  // Listen to incoming billing logs in real-time
  useEffect(() => {
    if (!tenantId) return;

    const channel = supabase
      .channel("realtime-admin-billing")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "billing_notifications",
          filter: `tenant_id=eq.${tenantId}`,
        },
        () => {
          setNotifCount((prev) => prev + 1);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tenantId]);

  return (
    <nav className="relative w-full h-[48px] px-4 md:px-12 bg-[#F7B71D] rounded-[50px] shadow-[2px_4px_4px_0px_rgba(43,88,12,0.70)] flex items-center justify-between z-[100]">
      {/* LEFT SIDE: Logo and Brand */}
      <div 
        className="flex items-center gap-1.5 cursor-pointer select-none" 
        onClick={() => setActiveSection("dashboard")}
      >
        <div className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center">
          <img src="/stockify-logo-1.svg" alt="Stockify Icon" className="h-7 md:h-9 w-auto" />
        </div>
        <div className="text-[#385E31] text-xl md:text-3xl font-bold font-fredoka">
          STOCKIFY
        </div>
      </div>

      {/* RIGHT SIDE: Navigation Icons */}
      <div className="flex items-center gap-4 md:gap-8">
        <button
          onClick={() => setActiveSection("dashboard")} 
          className="w-7 h-7 md:w-8 md:h-8 flex items-center justify-center hover:opacity-75 hover:scale-105 transition-all cursor-pointer"
          title="Home"
        >
          <img src="/navbar-home.svg" alt="Home" className="w-full h-full object-contain" />
        </button>

        {/* Notifications Icon */}
        <div className="relative flex items-center justify-center">
          <button
            onClick={() => {
              openNotifs();
              setNotifCount(0); // Clear visual indicator badge counter when opened
            }} 
            className="w-7 h-7 md:w-8 md:h-8 flex items-center justify-center hover:opacity-75 hover:scale-105 transition-all cursor-pointer"
            title="Notifications"
          >
            <img src="/navbar-notif.svg" alt="Notifications" className="w-full h-full object-contain" />
          </button>
          
          {notifCount > 0 && (
            <div className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1.5 bg-red-600 rounded-full border border-white text-white text-[10px] font-bold flex items-center justify-center shadow-sm">
              {notifCount > 9 ? "9+" : notifCount}
            </div>
          )}
        </div>

        <button
          onClick={openProfile} 
          className="w-7 h-7 md:w-8 md:h-8 flex items-center justify-center hover:opacity-75 hover:scale-105 transition-all cursor-pointer"
          title="Profile Settings"
        >
          <img src="/navbar-profile-settings.svg" alt="Profile Settings" className="w-full h-full object-contain" />
        </button>
      </div>
    </nav>
  );
}