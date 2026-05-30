"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface NavbarEmployeeProps {
  setActiveSection: (section: any) => void;
  openProfile: () => void;
  openNotifs: () => void;
  openSettings: () => void;
  setResetNotificationBadge?: (fn: () => void) => void; 
}

export default function NavbarEmployee({ 
  setActiveSection,
  openProfile, 
  openNotifs, 
  openSettings,
  setResetNotificationBadge
}: NavbarEmployeeProps) {
  const router = useRouter();
  const supabase = createClient();
  const [operationalAlerts, setOperationalAlerts] = useState<number>(0);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [hasSeenNotifs, setHasSeenNotifs] = useState<boolean>(false);

  // ── BRAND STATES ────────────────────────────────────────────────────────────
  const [businessName, setBusinessName] = useState<string>("STOCKIFY");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  // Function to build and fetch current live alert items from the database
  // Function to build and fetch current live alert items from the database
  const getLiveAlertIds = useCallback(async (tId: string) => {
    try {
      const [fnbResult, nfbResult, orderResult] = await Promise.all([
        supabase.from("fnb_inventory_items").select("item_name, stock, alert_limit").eq("tenant_id", tId).eq("is_active", true),
        supabase.from("nfb_products").select("product_name, quantity, reorder_threshold").eq("tenant_id", tId).eq("is_active", true),
        supabase.from("orders").select("order_id, fulfillment_status").eq("tenant_id", tId).in("fulfillment_status", ["Pending", "Reported"])
      ]);

      const ids: string[] = [];

      fnbResult.data?.forEach((item: { item_name: string; stock: number; alert_limit: number | null }) => {
        const isLow = item.stock <= 0 || (item.alert_limit !== null && item.stock <= item.alert_limit);
        if (isLow) ids.push(`fnb-stock-${item.item_name}-${item.stock}`);
      });

      nfbResult.data?.forEach((item: { product_name: string; quantity: number | string; reorder_threshold: any }) => {
        const isLow = Number(item.quantity) <= 0 || (item.reorder_threshold !== null && Number(item.quantity) <= Number(item.reorder_threshold));
        if (isLow) ids.push(`nfb-stock-${item.product_name}-${item.quantity}`);
      });

      orderResult.data?.forEach((order: { order_id: string; fulfillment_status: string }) => {
        const prefix = order.fulfillment_status === "Reported" ? "order-reported-" : "order-pending-";
        ids.push(`${prefix}${order.order_id}`);
      });

      return ids;
    } catch {
      return [];
    }
  }, [supabase]);

  // FIX: Clear All now securely commits active items to localStorage so they stay gone on refresh!
  const resetBadge = useCallback(async () => {
    setOperationalAlerts(0);
    setHasSeenNotifs(true);

    if (!tenantId) return;
    const activeAlertIds = await getLiveAlertIds(tenantId);

    if (activeAlertIds.length > 0) {
      let dismissed: string[] = [];
      try {
        const stored = localStorage.getItem("stockify_dismissed_alerts");
        dismissed = stored ? JSON.parse(stored) : [];
        if (!Array.isArray(dismissed)) dismissed = [];
      } catch {
        dismissed = [];
      }

      // Merge current active alerts with any previously dismissed items
      const updatedDismissed = Array.from(new Set([...dismissed, ...activeAlertIds]));
      localStorage.setItem("stockify_dismissed_alerts", JSON.stringify(updatedDismissed));
    }
  }, [tenantId, getLiveAlertIds]);

  useEffect(() => {
    if (setResetNotificationBadge) {
      setResetNotificationBadge(() => resetBadge);
    }
  }, [setResetNotificationBadge, resetBadge]);

  const calculateOperationalMetrics = useCallback(async (tId: string) => {
    try {
      const [fnbResult, nfbResult, orderResult] = await Promise.all([
        supabase.from("fnb_inventory_items").select("item_name, stock, alert_limit").eq("tenant_id", tId).eq("is_active", true),
        supabase.from("nfb_products").select("product_name, quantity, reorder_threshold").eq("tenant_id", tId).eq("is_active", true),
        supabase.from("orders").select("order_id, fulfillment_status").eq("tenant_id", tId).in("fulfillment_status", ["Pending", "Reported"])
      ]);

      let dismissed: string[] = [];
      try {
        const stored = localStorage.getItem("stockify_dismissed_alerts");
        dismissed = stored ? JSON.parse(stored) : [];
        if (!Array.isArray(dismissed)) dismissed = [];
      } catch {
        dismissed = [];
      }

      const activeLowFnb = fnbResult.data?.filter((item: { item_name: string; stock: number; alert_limit: number }) => {
        const isLow = item.stock <= 0 || (item.alert_limit !== null && item.stock <= item.alert_limit);
        if (!isLow) return false;
        const alertId = `fnb-stock-${item.item_name}-${item.stock}`;
        return !dismissed.includes(alertId);
      }) || [];

      const activeLowNfb = nfbResult.data?.filter((item: { product_name: string; quantity: number; reorder_threshold: any }) => {
        const isLow = Number(item.quantity) <= 0 || (item.reorder_threshold !== null && Number(item.quantity) <= Number(item.reorder_threshold));
        if (!isLow) return false;
        const alertId = `nfb-stock-${item.product_name}-${item.quantity}`;
        return !dismissed.includes(alertId);
      }) || [];

      const activeOrders = orderResult.data?.filter((order: { order_id: string; fulfillment_status: string }) => {
        const prefix = order.fulfillment_status === "Reported" ? "order-reported-" : "order-pending-";
        const alertId = `${prefix}${order.order_id}`;
        return !dismissed.includes(alertId);
      }) || [];

      setOperationalAlerts(activeLowFnb.length + activeLowNfb.length + activeOrders.length);
    } catch (err) {
      console.error("Failed calculating operational notification badge counts:", err);
    }
  }, [supabase]);

  useEffect(() => {
    const fetchTenantDetails = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("users")
        .select("tenant_id")
        .eq("user_id", user.id)
        .single();

      if (profile?.tenant_id) {
        const tid = profile.tenant_id;
        setTenantId(tid);
        calculateOperationalMetrics(tid);

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

    fetchTenantDetails();
  }, [calculateOperationalMetrics, supabase]);

  useEffect(() => {
    if (!tenantId) return;

    const monitoredTables = ["fnb_inventory_items", "nfb_products", "orders"];
    const channels = monitoredTables.map((tableName) => {
      return supabase
        .channel(`employee-ops-${tableName}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: tableName, filter: `tenant_id=eq.${tenantId}` },
          () => {
            calculateOperationalMetrics(tenantId);
            setHasSeenNotifs(false);
          }
        )
        .subscribe();
    });

    const brandChannel = supabase
      .channel("realtime-employee-brand")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tenants", filter: `tenant_id=eq.${tenantId}` },
        () => {
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
      channels.forEach((channel) => supabase.removeChannel(channel));
      supabase.removeChannel(brandChannel);
    };
  }, [tenantId, calculateOperationalMetrics, supabase]);

  const handleNotifClick = () => {
    openNotifs();
  };

  return (
    <nav className="relative w-full h-[55px] px-12 bg-[var(--color-accent)] rounded-[50px] shadow-[2px_4px_4px_0px_rgba(43,88,12,0.70)] flex items-center justify-between z-[50]">
      
      {/* Brand Group: Dynamic Logo + Brand Name */}
      <div className="flex items-center gap-2 cursor-pointer select-none" onClick={() => setActiveSection("dashboard")}>
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
        <div className="text-[var(--color-primary)] text-xl md:text-2xl font-bold font-fredoka truncate max-w-[180px] md:max-w-[280px]">
          {businessName}
        </div>
      </div>

      {/* RIGHT SIDE: Controls */}
      <div className="flex items-center gap-4 md:gap-8 text-primary">
        <button onClick={() => setActiveSection("dashboard")} className="w-8 h-8 flex items-center justify-center hover:opacity-75 hover:scale-105 transition-all cursor-pointer p-0.5 bg-transparent border-0 focus:outline-none" title="Home">
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
          <button onClick={handleNotifClick} className="w-8 h-8 flex items-center justify-center hover:opacity-75 hover:scale-105 transition-all cursor-pointer p-0.5 bg-transparent border-0 focus:outline-none" title="Notifications">
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
          
          {operationalAlerts > 0 && !hasSeenNotifs && (
            <div className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1.5 bg-red-600 rounded-full border border-white text-white text-[10px] font-bold flex items-center justify-center shadow-sm pointer-events-none transition-opacity duration-300">
              {operationalAlerts > 99 ? "99+" : operationalAlerts}
            </div>
          )}
        </div>

        <button onClick={(e) => { e.preventDefault(); openProfile(); }} className="w-9 h-9 relative flex items-center justify-center hover:scale-110 active:scale-95 transition-all cursor-pointer focus:outline-none rounded-full p-0 bg-transparent border-0 group" title="Profile Settings">
          <div className="w-8 h-8 rounded-full border border-primary p-0.5 flex items-center justify-center group-hover:brightness-95 pointer-events-none">
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