"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { SectionKey } from "@/app/[businessName]/employee/dashboard/page";

interface NavbarEmployeeProps {
  setActiveSection: (section: SectionKey) => void;
  openProfile: () => void;
  openNotifs: () => void;
  openSettings: () => void;
}

export default function NavbarEmployee({ 
  setActiveSection,
  openProfile, 
  openNotifs, 
  openSettings 
}: NavbarEmployeeProps) {
  const router = useRouter();
  const supabase = createClient();
  const [operationalAlerts, setOperationalAlerts] = useState<number>(0);
  const [tenantId, setTenantId] = useState<string | null>(null);

  // Re-run aggregate calculation on structural real-time triggers
  const calculateOperationalMetrics = useCallback(async (tId: string) => {
    try {
      const [fnbResult, nfbResult, orderResult] = await Promise.all([
        supabase.from("fnb_inventory_items").select("item_id, stock, alert_limit").eq("tenant_id", tId).eq("is_active", true),
        supabase.from("nfb_products").select("product_id, quantity, reorder_threshold").eq("tenant_id", tId).eq("is_active", true),
        supabase.from("orders").select("order_id", { count: "exact", head: true }).eq("tenant_id", tId).eq("fulfillment_status", "Pending")
      ]);

      // Explicitly typed parameters to clear the TS7006 implicit 'any' error
      const lowFnbCount = fnbResult.data?.filter(
        (item: { stock: number; alert_limit: number }) => item.stock <= item.alert_limit
      ).length || 0;

      const lowNfbCount = nfbResult.data?.filter(
        (item: { quantity: number; reorder_threshold: number | null }) => 
          Number(item.quantity) <= Number(item.reorder_threshold)
      ).length || 0;

      const pendingOrdersCount = orderResult.count || 0;

      setOperationalAlerts(lowFnbCount + lowNfbCount + pendingOrdersCount);
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
        setTenantId(profile.tenant_id);
        calculateOperationalMetrics(profile.tenant_id);
      }
    };

    fetchTenantDetails();
  }, [calculateOperationalMetrics]);

  // Handle live updates to recount metrics cleanly
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
          }
        )
        .subscribe();
    });

    return () => {
      channels.forEach((channel) => supabase.removeChannel(channel));
    };
  }, [tenantId, calculateOperationalMetrics]);

  return (
    <nav className="relative w-full h-[55px] px-12 bg-[#F7B71D] rounded-[50px] shadow-[2px_4px_4px_0px_rgba(43,88,12,0.70)] flex items-center justify-between z-[50]">
      
      {/* LEFT SIDE: Logo & Brand */}
      <div 
        className="flex items-center gap-1.5 cursor-pointer select-none" 
        onClick={() => setActiveSection("dashboard")}
      >
        <div className="w-12 h-12 flex items-center justify-center">
          <img
            src="/stockify-logo-1.svg"
            alt="Stockify Logo"
            className="h-9 w-auto"
          />
        </div>
        <div className="text-[#385E31] text-3xl font-bold font-fredoka tracking-tight">
          STOCKIFY
        </div>
      </div>

      {/* RIGHT SIDE: Quick Actions */}
      <div className="flex items-center gap-8">
        
        {/* Home Icon */}
        <button
          onClick={() => setActiveSection("dashboard")}
          className="w-8 h-8 flex items-center justify-center hover:opacity-75 hover:scale-105 transition-all cursor-pointer"
          title="Home"
        >
          <img src="/navbar-home.svg" alt="Home" className="w-full h-full object-contain" />
        </button>

        {/* Notifications Icon with Dynamic Operational Counter */}
        <div className="relative flex items-center justify-center">
          <button
            onClick={openNotifs}
            className="w-8 h-8 flex items-center justify-center hover:opacity-75 hover:scale-105 transition-all cursor-pointer"
            title="Notifications"
          >
            <img src="/navbar-notif.svg" alt="Notifications" className="w-full h-full object-contain" />
          </button>
          
          {operationalAlerts > 0 && (
            <div className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1.5 bg-red-600 rounded-full border border-white text-white text-[10px] font-bold flex items-center justify-center shadow-sm">
              {operationalAlerts > 99 ? "99+" : operationalAlerts}
            </div>
          )}
        </div>

        {/* Profile Settings Icon */}
        <button
          onClick={openProfile}
          className="w-8 h-8 flex items-center justify-center hover:opacity-75 hover:scale-105 transition-all cursor-pointer"
          title="Profile Settings"
        >
          <img src="/navbar-profile-settings.svg" alt="Profile Settings" className="w-full h-full object-contain rounded-full border border-[#385E31]" />
        </button>

      </div>
    </nav>
  );
}