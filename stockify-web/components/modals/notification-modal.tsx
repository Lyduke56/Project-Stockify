"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

interface NotificationItem {
  title: string;
  body: string;
  timestamp: string;
  isRead?: boolean;
}

interface TenantAlert {
  tenant_id: string;
  business_name: string;
  subscription_status: string;
  is_suspended: boolean;
  created_at: string;
}

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  role?: "superadmin" | "employee";
  tenantId?: string | null;
}

export default function NotificationModal({
  isOpen,
  onClose,
  role = "superadmin",
  tenantId = null,
}: NotificationModalProps) {
  const supabase = createClient();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const fetchLiveSystemAlerts = useCallback(async (showLoadingState = false) => {
    if (showLoadingState) setLoading(true);
    try {
      if (role === "employee") {
        if (!tenantId) return;

        // === EMPLOYEE WORKSPACE REAL-TIME ALERTS ===
        const collectedAlerts: NotificationItem[] = [];

        const [fnbResult, nfbResult, orderResult] = await Promise.all([
          supabase.from("fnb_inventory_items").select("item_name, stock, alert_limit, created_at").eq("tenant_id", tenantId).eq("is_active", true),
          supabase.from("nfb_products").select("product_name, quantity, reorder_threshold, created_at").eq("tenant_id", tenantId).eq("is_active", true),
          supabase.from("orders").select("order_id, created_at").eq("tenant_id", tenantId).eq("fulfillment_status", "Pending")
        ]);

        // 1. Map Food and Beverage Low Stock alerts (Typed 'item' parameter)
        if (fnbResult.data) {
  fnbResult.data.forEach((item: { item_name: string; stock: any; alert_limit: any; created_at: string }) => {
    const currentStock = Number(item.stock || 0);
    const limit = Number(item.alert_limit || 0);

    if (currentStock <= limit) {
      const isOut = currentStock <= 0;
      collectedAlerts.push({
        title: isOut ? "⚠️ F&B Item Out of Stock" : "⚠️ Low F&B Stock Warning",
        body: isOut 
          ? `Critical: "${item.item_name}" has run out completely.` 
          : `Warning: "${item.item_name}" is running low (${currentStock} left).`,
        timestamp: new Date(item.created_at || new Date()).toLocaleString("en-US", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: true }),
        isRead: false,
      });
    }
  });
}

        // 2. Map Non-Food Products alerts (Typed 'item' parameter)
        if (nfbResult.data) {
  nfbResult.data.forEach((item: { product_name: string; quantity: any; reorder_threshold: any; created_at: string }) => {
    const currentQty = Number(item.quantity || 0);
    const threshold = Number(item.reorder_threshold || 0);

    if (currentQty <= threshold) {
      const isOut = currentQty <= 0;
      collectedAlerts.push({
        title: isOut ? "⚠️ Product Out of Stock" : "⚠️ Product Low Stock Warning",
        body: isOut 
          ? `Critical: "${item.product_name}" has run out completely.` 
          : `Warning: "${item.product_name}" is running low (${currentQty} left).`,
        timestamp: new Date(item.created_at || new Date()).toLocaleString("en-US", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: true }),
        isRead: false,
      });
    }
  });
}

        // 3. Map Pending Sales Fulfillment Orders (Typed 'order' parameter)
        if (orderResult.data) {
          orderResult.data.forEach((order: { order_id: string; created_at: string }) => {
            collectedAlerts.push({
              title: "📦 Pending Order Fulfillment",
              body: `Order #${order.order_id.slice(0, 8).toUpperCase()} requires immediate floor processing.`,
              timestamp: new Date(order.created_at).toLocaleString("en-US", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: true }),
              isRead: false,
            });
          });
        }

        setNotifications(collectedAlerts);
      } else {
        // === SUPERADMIN STRATEGY ===
        const { data, error } = await supabase
          .from("tenants")
          .select("tenant_id, business_name, subscription_status, is_suspended, created_at")
          .or("subscription_status.eq.Pending,is_suspended.eq.true")
          .order("created_at", { ascending: false });

        if (!error && data) {
          const formattedAlerts = (data as TenantAlert[]).map((tenant: TenantAlert) => {
            const dateString = new Date(tenant.created_at).toLocaleString("en-US", {
              month: "2-digit", day: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: true,
            });

            if (tenant.is_suspended) {
              return {
                title: "Platform Suspended - Compliance Alert",
                body: `The tenant account organization entity "${tenant.business_name}" has been flagged as suspended.`,
                timestamp: dateString,
                isRead: false,
              };
            } else {
              return {
                title: "New Registration Pending Approval",
                body: `The tenant enterprise profile registration request for "${tenant.business_name}" is awaiting access authorization.`,
                timestamp: dateString,
                isRead: false,
              };
            }
          });
          setNotifications(formattedAlerts);
        }
      }
    } catch (err) {
      console.error("Failed executing real-time context notifications fetch:", err);
    } finally {
      if (showLoadingState) setLoading(false);
    }
  }, [supabase, role, tenantId]);

  // Initial fetch trigger when opened
  useEffect(() => {
    if (isOpen) {
      fetchLiveSystemAlerts(true);
    }
  }, [isOpen, fetchLiveSystemAlerts]);

  // Live real-time stream tracking rules matching workspace role conditions
  useEffect(() => {
    if (!isOpen) return;

    if (role === "employee") {
      if (!tenantId) return;
      const monitoredTables = ["fnb_inventory_items", "nfb_products", "orders"];
      const channels = monitoredTables.map((tableName) => {
        return supabase
          .channel(`modal-live-${tableName}`)
          .on(
            "postgres_changes",
            { event: "*", schema: "public", table: tableName, filter: `tenant_id=eq.${tenantId}` },
            () => fetchLiveSystemAlerts(false)
          )
          .subscribe();
      });

      return () => {
        channels.forEach((channel) => supabase.removeChannel(channel));
      };
    } else {
      const channel = supabase
        .channel("modal-system-compliance")
        .on("postgres_changes", { event: "*", schema: "public", table: "tenants" }, () => {
          fetchLiveSystemAlerts(false);
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [isOpen, supabase, fetchLiveSystemAlerts, role, tenantId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-[600px] rounded-2xl shadow-2xl overflow-hidden" style={{ backgroundColor: "#FFFCF0" }}>
        {/* Header */}
        <header className="px-8 py-5 flex justify-between items-center" style={{ borderBottom: "1px solid rgba(56,94,49,0.15)" }}>
          <h2 className="text-2xl font-bold uppercase tracking-widest font-['Inter']" style={{ color: "#385E31" }}>
            Notifications
          </h2>
          <button onClick={onClose} className="text-lg font-bold hover:scale-110 transition-transform" style={{ color: "#385E31" }}>
            ✕
          </button>
        </header>

        {/* Notification list view matching original UI design layout context definitions */}
        <div className="flex flex-col max-h-[440px] overflow-y-auto">
          {loading ? (
            <div className="px-8 py-12 text-center text-sm font-medium font-['Inter']" style={{ color: "#385E31", opacity: 0.6 }}>
              Syncing live system metrics...
            </div>
          ) : notifications.length === 0 ? (
            <div className="px-8 py-16 text-center flex flex-col gap-1.5 items-center justify-center font-['Inter']" style={{ color: "#385E31" }}>
              <span className="text-base font-semibold">All Caught Up!</span>
              <span className="text-sm font-normal opacity-60">
                {role === "employee" ? "No low inventory or pending order tasks found." : "No pending infrastructure setup tasks found."}
              </span>
            </div>
          ) : (
            notifications.map((notif, i) => (
              <div
                key={i}
                className="flex items-start justify-between px-8 py-5"
                style={{
                  backgroundColor: notif.isRead ? "transparent" : "rgba(56,94,49,0.07)",
                  borderBottom: "1px solid rgba(56,94,49,0.10)",
                }}
              >
                <div className="flex flex-col gap-1 flex-1 pr-8">
                  <span className="text-base font-semibold font-['Inter']" style={{ color: "#385E31" }}>
                    {notif.title}
                  </span>
                  <span className="text-sm font-normal font-['Inter']" style={{ color: "#385E31", opacity: 0.6 }}>
                    {notif.body}
                  </span>
                </div>
                <span className="text-sm font-normal font-['Inter'] shrink-0" style={{ color: "#385E31", opacity: 0.6 }}>
                  {notif.timestamp}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}