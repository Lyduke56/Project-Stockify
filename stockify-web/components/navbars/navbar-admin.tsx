"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { SectionKey } from "@/app/[businessName]/administrator/dashboard/page";

interface NavbarAdminProps {
  setActiveSection: (section: SectionKey) => void;
  openProfile: () => void;
  openNotifs: () => void;
}

export default function NavbarAdmin({ 
  setActiveSection, 
  openProfile, 
  openNotifs
}: NavbarAdminProps) {
  const supabase = createClient();
  const [notifCount, setNotifCount] = useState<number>(0);
  const [tenantId, setTenantId] = useState<string | null>(null);

  const fetchNotificationCount = async (tid: string) => {
    try {
      // 1. Fetch billing notifications count
      const { count, error } = await supabase
        .from("billing_notifications")
        .select("*", { count: "exact", head: true })
        .eq("tenant_id", tid);

      let totalCount = !error && count !== null ? count : 0;

      // 2. Fetch tenant status for suspension
      const { data: tenantRow } = await supabase
        .from("tenants")
        .select("is_suspended")
        .eq("tenant_id", tid)
        .single();
      
      if (tenantRow?.is_suspended) {
        totalCount += 1;
      }

      // 3. Fetch pending, overdue, or missed subscription records
      const { data: subData } = await supabase
        .from("subscription_records")
        .select("payment_status, overdue_at")
        .eq("tenant_id", tid)
        .in("payment_status", ["Pending", "Overdue", "Missed"]);

      if (subData) {
        const now = new Date();
        subData.forEach((record: any) => {
          if (record.payment_status === "Overdue" || record.payment_status === "Missed") {
            totalCount += 1;
          } else if (record.payment_status === "Pending" && record.overdue_at) {
            const overdueDate = new Date(record.overdue_at);
            const diffTime = overdueDate.getTime() - now.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            if (diffDays >= 0 && diffDays <= 3) {
              totalCount += 1;
            }
          }
        });
      }

      setNotifCount(totalCount);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    const initNotifications = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: userProfile } = await supabase
        .from("users")
        .select("tenant_id")
        .eq("user_id", user.id)
        .single();

      if (userProfile?.tenant_id) {
        setTenantId(userProfile.tenant_id);
        fetchNotificationCount(userProfile.tenant_id);
      }
    };

    initNotifications();
  }, []);

  // Listen to incoming billing logs, subscriptions, and tenant details in real-time
  useEffect(() => {
    if (!tenantId) return;

    const channel1 = supabase
      .channel("realtime-admin-billing")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "billing_notifications",
          filter: `tenant_id=eq.${tenantId}`,
        },
        () => {
          fetchNotificationCount(tenantId);
        }
      )
      .subscribe();

    const channel2 = supabase
      .channel("realtime-admin-subscriptions")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "subscription_records",
          filter: `tenant_id=eq.${tenantId}`,
        },
        () => {
          fetchNotificationCount(tenantId);
        }
      )
      .subscribe();

    const channel3 = supabase
      .channel("realtime-admin-tenants")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tenants",
          filter: `tenant_id=eq.${tenantId}`,
        },
        () => {
          fetchNotificationCount(tenantId);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel1);
      supabase.removeChannel(channel2);
      supabase.removeChannel(channel3);
    };
  }, [tenantId]);

  return (
    <nav className="relative w-full h-[48px] px-4 md:px-12 bg-accent rounded-[50px] shadow-[2px_4px_4px_0px_rgba(43,88,12,0.70)] flex items-center justify-between z-[100]">
      
      {/* LEFT SIDE: Logo and Brand Name */}
      <div 
        className="flex items-center gap-1.5 cursor-pointer select-none" 
        onClick={() => setActiveSection("dashboard")}
      >
        <div className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center">
          <img src="/stockify-logo-1.svg" alt="Stockify Icon" className="h-7 md:h-9 w-auto" />
        </div>
        <div className="text-primary text-xl md:text-3xl font-bold font-fredoka">
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
              setNotifCount(0);
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

        {/* Profile Settings Icon */}
        <button
          onClick={openProfile} 
          className="w-7 h-7 md:w-8 md:h-8 flex items-center justify-center hover:opacity-75 hover:scale-105 transition-all cursor-pointer"
          title="Profile Settings"
        >
          <img src="/navbar-profile-settings.svg" alt="Profile Settings" className="w-full h-full object-contain rounded-full border border-[#385E31]" />
        </button>
      </div>
    </nav>
  );
}