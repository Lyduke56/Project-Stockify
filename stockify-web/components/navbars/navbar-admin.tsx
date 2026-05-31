"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { SectionKey } from "@/app/[businessName]/administrator/dashboard/page";

interface NavbarAdminProps {
  setActiveSection: (section: SectionKey) => void;
  openProfile: () => void;
  openNotifs: () => void;
  setResetNotificationBadge?: (fn: () => void) => void; 
}

export default function NavbarAdmin({ 
  setActiveSection, 
  openProfile, 
  openNotifs,
  setResetNotificationBadge
}: NavbarAdminProps) {
  const supabase = createClient();
  const [notifCount, setNotifCount] = useState<number>(0);
  const [tenantId, setTenantId] = useState<string | null>(null);
  
  const [hasDismissedCurrentNotifs, setHasDismissedCurrentNotifs] = useState<boolean>(false);

  // ── BRAND STATES ────────────────────────────────────────────────────────────
  const [businessName, setBusinessName] = useState<string>("STOCKIFY");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  const fetchNotificationCount = useCallback(async (tid: string) => {
    try {
      let dismissed: string[] = [];
      try {
        const stored = localStorage.getItem("stockify_dismissed_alerts");
        dismissed = stored ? JSON.parse(stored) : [];
        if (!Array.isArray(dismissed)) dismissed = [];
      } catch {
        dismissed = [];
      }

      let totalCount = 0;

      const { data: billingData } = await supabase
        .from("billing_notifications")
        .select("id")
        .eq("tenant_id", tid);

      if (billingData) {
        billingData.forEach((notif: any) => {
          if (!dismissed.includes(notif.id)) totalCount += 1;
        });
      }

      const { data: tenantRow } = await supabase
        .from("tenants")
        .select("is_suspended, subscription_status, trial_ends_at")
        .eq("tenant_id", tid)
        .single();
      
      if (tenantRow) {
        if (tenantRow.is_suspended && !dismissed.includes(`suspension-${tid}`)) {
          totalCount += 1;
        }

        if (tenantRow.subscription_status === "Trial" && tenantRow.trial_ends_at) {
          const trialEnd = new Date(tenantRow.trial_ends_at);
          const now = new Date();
          const diffTime = trialEnd.getTime() - now.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          if (diffDays <= 0 && !dismissed.includes(`trial-expired-${tid}`)) {
            totalCount += 1;
          } else if (diffDays > 0 && diffDays <= 2 && !dismissed.includes(`trial-ending-${tid}-${diffDays}`)) {
            totalCount += 1;
          }
        }
      }

      const { data: subData } = await supabase
        .from("subscription_records")
        .select("subscription_id, payment_status, overdue_at")
        .eq("tenant_id", tid)
        .in("payment_status", ["Pending", "Overdue", "Missed"]);

      if (subData) {
        const now = new Date();
        subData.forEach((record: any) => {
          if (record.payment_status === "Overdue" && !dismissed.includes(`sub-overdue-${record.subscription_id}`)) {
            totalCount += 1;
          } else if (record.payment_status === "Missed" && !dismissed.includes(`sub-missed-${record.subscription_id}`)) {
            totalCount += 1;
          } else if (record.payment_status === "Pending" && record.overdue_at) {
            const overdueDate = new Date(record.overdue_at);
            const diffTime = overdueDate.getTime() - now.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            if (diffDays >= 0 && diffDays <= 3 && !dismissed.includes(`sub-pending-warning-${record.subscription_id}`)) {
              totalCount += 1;
            }
          }
        });
      }

      setNotifCount(totalCount);
    } catch (e) {
      console.error(e);
    }
  }, [supabase]);

  const clearBadgeStateLocally = useCallback(() => {
    setNotifCount(0);
    setHasDismissedCurrentNotifs(true);
    if (tenantId) {
      localStorage.setItem(`admin_dismissed_notifs_${tenantId}`, "true");
    }
  }, [tenantId]);

  useEffect(() => {
    if (setResetNotificationBadge) {
      setResetNotificationBadge(clearBadgeStateLocally);
    }
  }, [setResetNotificationBadge, clearBadgeStateLocally]);

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

        const wasDismissed = localStorage.getItem(`admin_dismissed_notifs_${tid}`) === "true";
        setHasDismissedCurrentNotifs(wasDismissed);

        // ── FETCH BRAND AND STOREFRONT CONFIG ───────────────────
        const { data: tenantBrand } = await supabase
          .from("tenants")
          .select("business_name, logo_url")
          .eq("tenant_id", tid)
          .single();

        const { data: sfConfig } = await supabase
          .from("tenant_storefront")
          .select("logo_url")
          .eq("tenant_id", tid)
          .single();

        if (tenantBrand?.business_name) {
          setBusinessName(tenantBrand.business_name.toUpperCase());
        }
        
        // FIX: Force the navbar to prioritize the Storefront Config logo
        setLogoUrl(sfConfig?.logo_url || tenantBrand?.logo_url || null);
      }
    };

    initNotifications();
  }, [fetchNotificationCount, supabase]);

  // ── REALTIME LISTENERS ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!tenantId) return;

    const channel1 = supabase
      .channel("realtime-admin-billing")
      .on("postgres_changes", { event: "*", schema: "public", table: "billing_notifications", filter: `tenant_id=eq.${tenantId}` }, () => {
        setHasDismissedCurrentNotifs(false);
        localStorage.removeItem(`admin_dismissed_notifs_${tenantId}`);
        fetchNotificationCount(tenantId);
      })
      .subscribe();

    const channel2 = supabase
      .channel("realtime-admin-subscriptions")
      .on("postgres_changes", { event: "*", schema: "public", table: "subscription_records", filter: `tenant_id=eq.${tenantId}` }, () => {
        setHasDismissedCurrentNotifs(false);
        localStorage.removeItem(`admin_dismissed_notifs_${tenantId}`);
        fetchNotificationCount(tenantId);
      })
      .subscribe();

    const channel3 = supabase
      .channel("realtime-admin-tenants")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "tenants", filter: `tenant_id=eq.${tenantId}` }, 
        (payload: { new: { business_name?: string; logo_url?: string | null } }) => {
          setHasDismissedCurrentNotifs(false);
          localStorage.removeItem(`admin_dismissed_notifs_${tenantId}`);
          fetchNotificationCount(tenantId);
          
          if (payload.new?.business_name) {
            setBusinessName(payload.new.business_name.toUpperCase());
          }
      })
      .subscribe();

    // FIX: Add listener for the Storefront Config table to instantly catch logo updates
    const channel4 = supabase
      .channel("realtime-admin-storefront")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "tenant_storefront", filter: `tenant_id=eq.${tenantId}` }, 
        (payload: { new: { logo_url?: string | null } }) => {
          if (payload.new && payload.new.logo_url !== undefined) {
            setLogoUrl(payload.new.logo_url);
          }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel1);
      supabase.removeChannel(channel2);
      supabase.removeChannel(channel3);
      supabase.removeChannel(channel4);
    };
  }, [tenantId, fetchNotificationCount, supabase]);

  const handleNotifClick = () => {
    setHasDismissedCurrentNotifs(true);
    if (tenantId) {
      localStorage.setItem(`admin_dismissed_notifs_${tenantId}`, "true");
    }
    openNotifs();
  };

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
            className="h-full w-full object-cover" 
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

        <div className="relative flex items-center justify-center">
          <button
            onClick={handleNotifClick} 
            className="w-7 h-7 md:w-8 md:h-8 flex items-center justify-center hover:opacity-75 hover:scale-105 transition-all cursor-pointer p-0.5 bg-transparent border-0 focus:outline-none"
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
          
          {notifCount > 0 && !hasDismissedCurrentNotifs && (
            <div className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1.5 bg-red-600 rounded-full border border-white text-white text-[10px] font-bold flex items-center justify-center shadow-sm pointer-events-none transition-opacity duration-300">
              {notifCount > 9 ? "9+" : notifCount}
            </div>
          )}
        </div>

        <button
          onClick={openProfile} 
          className="w-7 h-7 md:w-8 md:h-8 flex items-center justify-center hover:opacity-75 hover:scale-105 transition-all cursor-pointer"
          title="Profile Settings"
        >
          <div className="w-7 h-7 md:w-8 md:h-8 rounded-full border border-primary p-0.5 flex items-center justify-center">
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