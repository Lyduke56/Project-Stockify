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
  
  // ── NEW BRAND STATES ────────────────────────────────────────────────────────
  const [businessName, setBusinessName] = useState<string>("STOCKIFY");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

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
        const tid = userProfile.tenant_id;
        setTenantId(tid);
        fetchNotificationCount(tid);

        // ── FETCH BRAND INFORMATION FROM THE TENANTS TABLE ───────────────────
        const { data: tenantBrand } = await supabase
          .from("tenants")
          .select("business_name, logo_url")
          .eq("tenant_id", tid)
          .single();

        if (tenantBrand) {
          if (tenantBrand.business_name) {
            setBusinessName(tenantBrand.business_name.toUpperCase());
          }
          if (tenantBrand.logo_url) {
            setLogoUrl(tenantBrand.logo_url);
          }
        }
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
      
      // Real-time update for logo or business name adjustments
      supabase
        .from("tenants")
        .select("business_name, logo_url")
        .eq("tenant_id", tenantId)
        .single()
        .then(({ data }: { data: { business_name: string | null; logo_url: string | null } | null }) => {
          if (data) {
            if (data.business_name) setBusinessName(data.business_name.toUpperCase());
            if (data.logo_url) setLogoUrl(data.logo_url);
          }
        });
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
      
      {/* LEFT SIDE: Dynamic Logo and Brand Name */}
      <div 
        className="flex items-center gap-2 cursor-pointer select-none" 
        onClick={() => setActiveSection("dashboard")}
      >
        <div className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center rounded-full overflow-hidden bg-white/10 p-0.5">
          <img 
            src={logoUrl || "/stockify-logo-1.svg"} 
            alt={`${businessName} Logo`} 
            className="h-full w-full object-contain" 
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = "/stockify-logo-1.svg";
            }}
          />
        </div>
        <div className="text-primary text-xl md:text-2xl font-bold font-fredoka truncate max-w-[180px] md:max-w-[280px]">
          {businessName}
        </div>
      </div>

      {/* RIGHT SIDE: Navigation Icons */}
      <div className="flex items-center gap-4 md:gap-8 text-primary">
        <button
          onClick={() => setActiveSection("dashboard")} 
          className="w-7 h-7 md:w-8 md:h-8 flex items-center justify-center hover:opacity-75 hover:scale-105 transition-all cursor-pointer"
          title="Home"
        >
          <div
            className="w-full h-full bg-current"
            style={{
              WebkitMaskImage: "url(/navbar-home.svg)",
              maskImage: "url(/navbar-home.svg)",
              WebkitMaskSize: "contain",
              maskSize: "contain",
              WebkitMaskRepeat: "no-repeat",
              maskRepeat: "no-repeat",
              WebkitMaskPosition: "center",
              maskPosition: "center",
            }}
            role="img"
            aria-label="Home"
          />
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
            <div
              className="w-full h-full bg-current"
              style={{
                WebkitMaskImage: "url(/navbar-notif.svg)",
                maskImage: "url(/navbar-notif.svg)",
                WebkitMaskSize: "contain",
                maskSize: "contain",
                WebkitMaskRepeat: "no-repeat",
                maskRepeat: "no-repeat",
                WebkitMaskPosition: "center",
                maskPosition: "center",
              }}
              role="img"
              aria-label="Notifications"
            />
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
          <div
            className="w-7 h-7 md:w-8 md:h-8 rounded-full border border-primary p-0.5 flex items-center justify-center"
          >
            <div
              className="w-full h-full bg-current"
              style={{
                WebkitMaskImage: "url(/navbar-profile-settings.svg)",
                maskImage: "url(/navbar-profile-settings.svg)",
                WebkitMaskSize: "contain",
                maskSize: "contain",
                WebkitMaskRepeat: "no-repeat",
                maskRepeat: "no-repeat",
                WebkitMaskPosition: "center",
                maskPosition: "center",
              }}
              role="img"
              aria-label="Profile Settings"
            />
          </div>
        </button>
      </div>
    </nav>
  );
}