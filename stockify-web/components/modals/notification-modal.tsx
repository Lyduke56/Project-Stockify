"use client";

import { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { createClient } from "@/lib/supabase/client";

interface NotificationItem {
  id: string; 
  title: string;
  subject: string;
  body: string;
  timestamp: string;
  isRead?: boolean;
}

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  role?: "superadmin" | "employee" | "client" | "admin";
  tenantId?: string | null;
  onClear?: () => void; 
  colors?: {
    color_primary?: string;
    color_background?: string;
    color_secondary?: string;
    color_accent?: string;
  };
}

const getDetailedBody = (type: string, subject: string): string => {
  const lower = type.toLowerCase();
  if (lower === "reminder") {
    return "Your monthly subscription payment is pending. Please pay your fee of ₱1,000.00 to ensure your business remains active and uninterrupted.";
  }
  if (lower === "trial_started") {
    return "Welcome to Stockify! Your 7-day free trial has been successfully activated. You have full access to all inventory and sales features.";
  }
  if (lower === "trial_ending_reminder") {
    return "Your free trial is ending tomorrow. Please subscribe or configure your payment profile to prevent service interruptions.";
  }
  if (lower === "invoice_generated") {
    return "A new monthly invoice has been generated for your account. Please check the Subscription Billing page to pay your monthly dues.";
  }
  return subject;
};

export default function NotificationModal({
  isOpen,
  onClose,
  role = "client",
  tenantId = null,
  onClear, // Destructured properly here
  colors,
}: NotificationModalProps) {
  const supabase = createClient();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [mounted, setMounted] = useState(false);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Reset expanded index when modal opens/closes
  useEffect(() => {
    setExpandedIndex(null);
  }, [isOpen]);

  // Store lists of explicitly deleted notification IDs to keep them hidden locally
  const [deletedIds, setDeletedIds] = useState<string[]>([]);
  // Keep track of which notification IDs have been read locally
  const [readIds, setReadIds] = useState<string[]>([]);

  const applyNotifications = useCallback((collected: NotificationItem[]) => {
    let dismissed: string[] = [];
    try {
      const stored = localStorage.getItem("stockify_dismissed_alerts");
      dismissed = stored ? JSON.parse(stored) : [];
      if (!Array.isArray(dismissed)) dismissed = [];
    } catch {
      dismissed = [];
    }

    // Self-cleaning: only keep dismissed IDs that are still present in collected alerts
    const collectedIds = collected.map(c => c.id);
    const prunedDismissed = dismissed.filter(id => collectedIds.includes(id));
    try {
      localStorage.setItem("stockify_dismissed_alerts", JSON.stringify(prunedDismissed));
    } catch (e) {
      console.error(e);
    }

    const visibleNotifications = collected.filter(n => !prunedDismissed.includes(n.id));
    setNotifications(visibleNotifications);
  }, []);

  const fetchLiveBillingAlerts = useCallback(async (showLoadingState = false) => {
    if (!tenantId) return;
    if (showLoadingState) setLoading(true);
    
    try {
      // ── EMPLOYEE: operational alerts (inventory + orders) ──────────────────
      if (role === "employee") {
        const collectedAlerts: NotificationItem[] = [];

        const [fnbResult, nfbResult, orderResult] = await Promise.all([
          supabase.from("fnb_inventory_items").select("item_name, stock, alert_limit, created_at").eq("tenant_id", tenantId).eq("is_active", true),
          supabase.from("nfb_products").select("product_name, quantity, reorder_threshold, created_at").eq("tenant_id", tenantId).eq("is_active", true),
          supabase.from("orders").select("order_id, created_at, fulfillment_status").eq("tenant_id", tenantId).in("fulfillment_status", ["Pending", "Reported"])
        ]);

        // 1. Map Food and Beverage Low Stock alerts
        if (fnbResult.data) {
          fnbResult.data.forEach((item: { item_name: string; stock: any; alert_limit: any; created_at: string }) => {
            const currentStock = Number(item.stock || 0);
            const limit = Number(item.alert_limit || 0);

            if (currentStock <= 0 || currentStock <= limit) {
              const isOut = currentStock <= 0;
              collectedAlerts.push({
                id: `fnb-stock-${item.item_name}-${currentStock}`,
                title: "Inventory Alert",
                subject: isOut ? "⚠️ F&B Item Out of Stock" : "⚠️ Low F&B Stock Warning",
                body: isOut 
                  ? `Critical: "${item.item_name}" has run out completely. Reorder stock immediately.` 
                  : `Warning: "${item.item_name}" is running low (${currentStock} left). Please restock soon.`,
                timestamp: new Date(item.created_at || new Date()).toLocaleString("en-US", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: true }),
                isRead: false,
              });
            }
          });
        }

        // 2. Map Non-Food Products alerts
        if (nfbResult.data) {
          nfbResult.data.forEach((item: { product_name: string; quantity: any; reorder_threshold: any; created_at: string }) => {
            const currentQty = Number(item.quantity || 0);
            const threshold = Number(item.reorder_threshold || 0);

            if (currentQty <= 0 || currentQty <= threshold) {
              const isOut = currentQty <= 0;
              collectedAlerts.push({
                id: `nfb-stock-${item.product_name}-${currentQty}`,
                title: "Inventory Alert",
                subject: isOut ? "⚠️ Product Out of Stock" : "⚠️ Product Low Stock Warning",
                body: isOut 
                  ? `Critical: "${item.product_name}" has run out completely. Restock items.` 
                  : `Warning: "${item.product_name}" is running low (${currentQty} left).`,
                timestamp: new Date(item.created_at || new Date()).toLocaleString("en-US", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: true }),
                isRead: false,
              });
            }
          });
        }

        // 3. Map Pending and Reported Sales Orders
        if (orderResult.data) {
          orderResult.data.forEach((order: { order_id: string; created_at: string; fulfillment_status: string }) => {
            if (order.fulfillment_status === "Reported") {
              collectedAlerts.push({
                id: `order-reported-${order.order_id}`,
                title: "Reported Order",
                subject: "⚠️ Order Issue Reported",
                body: `Order #${order.order_id.slice(0, 8).toUpperCase()} has been reported by the customer. Please review the dispute details and comments.`,
                timestamp: new Date(order.created_at).toLocaleString("en-US", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: true }),
                isRead: false,
              });
            } else {
              collectedAlerts.push({
                id: `order-pending-${order.order_id}`,
                title: "Order Alert",
                subject: "📦 Pending Order Fulfillment",
                body: `Order #${order.order_id.slice(0, 8).toUpperCase()} requires immediate floor processing. Please coordinate packaging.`,
                timestamp: new Date(order.created_at).toLocaleString("en-US", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: true }),
                isRead: false,
              });
            }
          });
        }

        applyNotifications(collectedAlerts);
        return; // done for employee
      }

      // ── CLIENT / ADMIN: billing + subscription alerts ──────────────────────
      if (role === "client" || role === "admin") {
        if (!tenantId) return;
        const collectedAlerts: NotificationItem[] = [];

        // 1. Fetch tenant details (suspension & trial) from DB
        const { data: tenantRow } = await supabase
          .from("tenants")
          .select("is_suspended, subscription_status, trial_ends_at")
          .eq("tenant_id", tenantId)
          .single();

        if (tenantRow) {
          if (tenantRow.is_suspended) {
            collectedAlerts.push({
              id: `suspension-${tenantId}`,
              title: "Suspension Alert",
              subject: "⛔ Account Suspended by Superadmin",
              body: "Your business account has been suspended due to unresolved subscription billing or compliance issues. Please contact billing/support at support@stockify.com immediately to restore access.",
              timestamp: new Date().toLocaleString("en-US", {
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
              }),
              isRead: false,
            });
          }

          // Check if trial has ended or is ending soon
          if (tenantRow.subscription_status === "Trial" && tenantRow.trial_ends_at) {
            const trialEnd = new Date(tenantRow.trial_ends_at);
            const now = new Date();
            const diffTime = trialEnd.getTime() - now.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays <= 0) {
              collectedAlerts.push({
                id: `trial-expired-${tenantId}`,
                title: "Trial Expired",
                subject: "⚠️ Your Free Trial Has Expired",
                body: "Your 7-day free trial has expired. To continue using Stockify services and manage your shop floor, please subscribe to an active billing plan.",
                timestamp: trialEnd.toLocaleString("en-US", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: true }),
                isRead: false,
              });
            } else if (diffDays <= 2) {
              collectedAlerts.push({
                id: `trial-ending-${tenantId}-${diffDays}`,
                title: "Trial Alert",
                subject: `⏳ Free Trial Ends in ${diffDays} Day(s)`,
                body: `Your free trial period ends on ${trialEnd.toLocaleDateString()}. Subscribe soon to keep your shop dashboard active without interruptions.`,
                timestamp: trialEnd.toLocaleString("en-US", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: true }),
                isRead: false,
              });
            }
          }
        }

        // 2. Fetch billing notifications (sent by superadmin)
        const { data: billingData } = await supabase
          .from("billing_notifications")
          .select("id, notification_type, subject, sent_at")
          .eq("tenant_id", tenantId)
          .order("sent_at", { ascending: false });

        if (billingData) {
          billingData.forEach((notif: any) => {
            collectedAlerts.push({
              id: notif.id || `billing-notif-${notif.sent_at}`,
              title: notif.notification_type === "reminder" ? "Billing Reminder" : "Trial Started",
              subject: notif.subject || "Billing Notification",
              body: getDetailedBody(notif.notification_type || "", notif.subject || ""),
              timestamp: new Date(notif.sent_at).toLocaleString("en-US", {
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
              }),
              isRead: false,
            });
          });
        }

        // 3. Fetch subscription records for pending/overdue/missed warnings
        const { data: subData } = await supabase
          .from("subscription_records")
          .select("subscription_id, billing_period, payment_status, amount, overdue_at")
          .eq("tenant_id", tenantId)
          .in("payment_status", ["Pending", "Overdue", "Missed"]);

        if (subData) {
          const now = new Date();
          subData.forEach((record: any) => {
            if (record.payment_status === "Overdue") {
              const overdueDate = record.overdue_at ? new Date(record.overdue_at) : new Date();
              collectedAlerts.push({
                id: `sub-overdue-${record.subscription_id}`,
                title: "Overdue Alert",
                subject: "⛔ Subscription Payment Overdue",
                body: `Your subscription payment of ₱${record.amount} for period ending ${record.billing_period} is overdue. Please settle this immediately to avoid service interruption.`,
                timestamp: overdueDate.toLocaleString("en-US", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: true }),
                isRead: false,
              });
            } else if (record.payment_status === "Missed") {
              const overdueDate = record.overdue_at ? new Date(record.overdue_at) : new Date();
              collectedAlerts.push({
                id: `sub-missed-${record.subscription_id}`,
                title: "Missed Payment",
                subject: "⛔ Subscription Payment Missed",
                body: `Your monthly subscription payment of ₱${record.amount} for period ending ${record.billing_period} was missed. Please pay immediately to prevent account suspension.`,
                timestamp: overdueDate.toLocaleString("en-US", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: true }),
                isRead: false,
              });
            } else if (record.payment_status === "Pending" && record.overdue_at) {
              const overdueDate = new Date(record.overdue_at);
              const diffTime = overdueDate.getTime() - now.getTime();
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

              // Show warning if 2 or 3 days before overdue_at
              if (diffDays >= 0 && diffDays <= 3) {
                collectedAlerts.push({
                  id: `sub-pending-warning-${record.subscription_id}`,
                  title: "Billing Alert",
                  subject: "⚠️ Subscription Overdue Warning",
                  body: `Your subscription payment of ₱${record.amount} for period ending ${record.billing_period} is pending. Overdue in ${diffDays} day(s) on ${overdueDate.toLocaleDateString()}. Please settle this charge.`,
                  timestamp: overdueDate.toLocaleString("en-US", {
                    month: "2-digit",
                    day: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: true,
                  }),
                  isRead: false,
                });
              }
            }
          });
        }

        // Sort by date/timestamp desc
        collectedAlerts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        applyNotifications(collectedAlerts);
      } else {
        // === SUPERADMIN STRATEGY ===
        const collectedAlerts: NotificationItem[] = [];

        const [tenantsResult, subResult] = await Promise.all([
          supabase
            .from("tenants")
            .select("tenant_id, business_name, subscription_status, is_suspended, created_at")
            .or("subscription_status.eq.Pending,is_suspended.eq.true")
            .order("created_at", { ascending: false }),
          
          supabase
            .from("subscription_records")
            .select("subscription_id, billing_period, payment_status, amount, amount_paid, paid_at, overdue_at, tenants(business_name)")
            .or("payment_status.eq.Paid,payment_status.eq.Overdue,payment_status.eq.Missed")
        ]);

        // 1. Process pending and suspended tenants
        if (tenantsResult.data) {
          tenantsResult.data.forEach((tenant: any) => {
            const dateString = new Date(tenant.created_at).toLocaleString("en-US", {
              month: "2-digit", day: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: true,
            });

            if (tenant.is_suspended) {
              collectedAlerts.push({
                id: `sa-tenant-suspended-${tenant.tenant_id}`,
                title: "Tenant Suspended",
                subject: `Account suspended: ${tenant.business_name}`,
                body: `The tenant account organization entity "${tenant.business_name}" has been flagged as suspended by the system compliance rules.`,
                timestamp: dateString,
                isRead: false,
              });
            } else {
              collectedAlerts.push({
                id: `sa-tenant-pending-${tenant.tenant_id}`,
                title: "Pending Registration",
                subject: `New registration pending: ${tenant.business_name}`,
                body: `The tenant enterprise profile registration request for "${tenant.business_name}" is awaiting access authorization approval.`,
                timestamp: dateString,
                isRead: false,
              });
            }
          });
        }

        // 2. Process paid, overdue, and missed subscription records
        if (subResult.data) {
          subResult.data.forEach((record: any) => {
            const businessName = record.tenants?.business_name || "Unknown Tenant";
            const dateVal = record.payment_status === "Paid" ? record.paid_at : record.overdue_at;
            const dateString = dateVal 
              ? new Date(dateVal).toLocaleString("en-US", {
                  month: "2-digit", day: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: true,
                })
              : new Date().toLocaleString("en-US", {
                  month: "2-digit", day: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: true,
                });

            if (record.payment_status === "Paid") {
              collectedAlerts.push({
                id: `sa-sub-paid-${record.subscription_id}`,
                title: "Payment Recorded",
                subject: `Payment recorded: ${businessName}`,
                body: `A subscription payment of ₱${record.amount_paid || record.amount} has been successfully recorded for billing period ending ${record.billing_period}.`,
                timestamp: dateString,
                isRead: false,
              });
            } else if (record.payment_status === "Overdue") {
              collectedAlerts.push({
                id: `sa-sub-overdue-${record.subscription_id}`,
                title: "Overdue Warning",
                subject: `Payment overdue: ${businessName}`,
                body: `The monthly subscription fee of ₱${record.amount} for period ending ${record.billing_period} is currently overdue. Settle immediately.`,
                timestamp: dateString,
                isRead: false,
              });
            } else if (record.payment_status === "Missed") {
              collectedAlerts.push({
                id: `sa-sub-missed-${record.subscription_id}`,
                title: "Missed Payment",
                subject: `Payment missed: ${businessName}`,
                body: `The monthly subscription fee of ₱${record.amount} for period ending ${record.billing_period} has been missed. Please contact the tenant to resolve the payment issue.`,
                timestamp: dateString,
                isRead: false,
              });
            }
          });
        }

        // Sort combined list desc by timestamp date value
        collectedAlerts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        applyNotifications(collectedAlerts);
      }
    } catch (err) {
      console.error("Failed executing real-time billing notifications fetch:", err);
    } finally {
      if (showLoadingState) setLoading(false);
    }
  }, [supabase, tenantId, role, applyNotifications]);

  // Click handler to toggle read status (Facebook style background tint)
  const handleToggleRead = (id: string) => {
    setReadIds(prev => [...prev, id]);
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  // Delete a single notification element manually
  const handleDeleteNotification = (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Stops row click event from firing simultaneously
    let dismissed: string[] = [];
    try {
      const stored = localStorage.getItem("stockify_dismissed_alerts");
      dismissed = stored ? JSON.parse(stored) : [];
      if (!Array.isArray(dismissed)) dismissed = [];
    } catch {
      dismissed = [];
    }
    if (!dismissed.includes(id)) {
      dismissed.push(id);
      try {
        localStorage.setItem("stockify_dismissed_alerts", JSON.stringify(dismissed));
      } catch (err) {
        console.error(err);
      }
    }
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // Mass action to clear out the active lists immediately
  const handleClearAll = () => {
    const currentIds = notifications.map(n => n.id);
    let dismissed: string[] = [];
    try {
      const stored = localStorage.getItem("stockify_dismissed_alerts");
      dismissed = stored ? JSON.parse(stored) : [];
      if (!Array.isArray(dismissed)) dismissed = [];
    } catch {
      dismissed = [];
    }
    const updated = Array.from(new Set([...dismissed, ...currentIds]));
    try {
      localStorage.setItem("stockify_dismissed_alerts", JSON.stringify(updated));
    } catch (err) {
      console.error(err);
    }
    setNotifications([]);
    
    // Fire up the sync callback to reset the Navbar counter
    if (onClear) {
      onClear();
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchLiveBillingAlerts(true);
    }
  }, [isOpen, fetchLiveBillingAlerts]);

  // Real-time postgres pipeline listener setup targeted at the billing table
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
            () => fetchLiveBillingAlerts(false)
          )
          .subscribe();
      });

      return () => {
        channels.forEach((channel) => supabase.removeChannel(channel));
      };
    } else if (role === "client" || role === "admin") {
      if (!tenantId) return;
      const monitoredTables = ["billing_notifications", "subscription_records", "tenants"];
      const channels = monitoredTables.map((tableName) => {
        const filterStr = tableName === "tenants" ? `tenant_id=eq.${tenantId}` : `tenant_id=eq.${tenantId}`;
        return supabase
          .channel(`modal-live-${tableName}`)
          .on(
            "postgres_changes",
            { event: "*", schema: "public", table: tableName, filter: filterStr },
            () => fetchLiveBillingAlerts(false)
          )
          .subscribe();
      });

      return () => {
        channels.forEach((channel) => supabase.removeChannel(channel));
      };
    } else {
      const channel1 = supabase
        .channel("modal-system-tenants")
        .on("postgres_changes", { event: "*", schema: "public", table: "tenants" }, () => {
          fetchLiveBillingAlerts(false);
        })
        .subscribe();

      const channel2 = supabase
        .channel("modal-system-subscriptions")
        .on("postgres_changes", { event: "*", schema: "public", table: "subscription_records" }, () => {
          fetchLiveBillingAlerts(false);
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel1);
        supabase.removeChannel(channel2);
      };
    }
  }, [isOpen, supabase, fetchLiveBillingAlerts, role, tenantId]);

  if (!isOpen || !mounted) return null;

  const isClient = role === "client";
  const primaryColor = colors?.color_primary ?? (isClient ? "#F7B71D" : "#385E31");
  const modalBg = colors?.color_background ?? "#FFFCF0";
  const borderColor = isClient ? "rgba(247,183,29,0.15)" : `${primaryColor}26`;
  const itemBorderColor = isClient ? "rgba(247,183,29,0.10)" : `${primaryColor}1A`;
  const hoverBg = isClient ? "hover:bg-[#F7B71D]/[0.02]" : "hover:bg-black/[0.02]";

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-[600px] rounded-2xl shadow-2xl overflow-hidden flex flex-col" style={{ backgroundColor: modalBg }}>
        {/* Header */}
        <header className="px-8 py-5 flex justify-between items-center shrink-0" style={{ borderBottom: `1px solid ${borderColor}` }}>
          <h2 className="text-2xl font-bold uppercase tracking-widest font-['Inter']" style={{ color: primaryColor }}>
            Notifications
          </h2>
          <button onClick={onClose} className="text-lg font-bold hover:scale-110 transition-transform" style={{ color: primaryColor }}>
            ✕
          </button>
        </header>

        {/* Notification list view */}
        <div className="flex flex-col max-h-[440px] overflow-y-auto flex-1">
          {loading ? (
            <div className="px-8 py-12 text-center text-sm font-medium font-['Inter']" style={{ color: primaryColor, opacity: 0.6 }}>
              Syncing live system metrics...
            </div>
          ) : notifications.length === 0 ? (
            <div className="px-8 py-16 text-center flex flex-col gap-1.5 items-center justify-center font-['Inter']" style={{ color: primaryColor }}>
              <span className="text-base font-semibold">All Caught Up!</span>
              <span className="text-sm font-normal opacity-60">
                {role === "employee" 
                  ? "No low inventory or pending order tasks found." 
                  : (role === "client" || role === "admin")
                    ? "No billing, subscription, or suspension alerts." 
                    : "No pending registration, suspension, or billing alerts."}
              </span>
            </div>
          ) : (
            notifications.map((notif, i) => {
              const isExpanded = expandedIndex === i;
              const titleLower = notif.title.toLowerCase();
              const isRedAlert = titleLower.includes("suspended") || titleLower.includes("suspension") || titleLower.includes("missed") || titleLower.includes("expired");
              const isOrangeAlert = titleLower.includes("overdue") || titleLower.includes("warning") || titleLower.includes("limit") || titleLower.includes("low");
              
              let tagBg = isClient ? "rgba(247,183,29,0.10)" : `${primaryColor}1A`;
              let tagColor = primaryColor;
              let rowBg = "transparent";

              if (isRedAlert) {
                tagBg = "rgba(239,68,68,0.15)";
                tagColor = "#ef4444";
                rowBg = "rgba(239,68,68,0.04)";
              } else if (isOrangeAlert) {
                tagBg = "rgba(245,158,11,0.15)";
                tagColor = "#d97706";
                rowBg = "rgba(245,158,11,0.04)";
              } else if (!notif.isRead) {
                rowBg = isClient ? "rgba(247,183,29,0.04)" : `${primaryColor}0A`;
              }

              return (
                <div
                  key={i}
                  onClick={() => {
                    setExpandedIndex(isExpanded ? null : i);
                    if (!notif.isRead) handleToggleRead(notif.id);
                  }}
                  className={`flex flex-col px-8 py-5 cursor-pointer ${hoverBg} transition-colors`}
                  style={{
                    backgroundColor: rowBg,
                    borderBottom: `1px solid ${itemBorderColor}`,
                  }}
                >
                  <div className="flex items-start justify-between w-full gap-4">
                    <div className="flex flex-col gap-1 flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span 
                          className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded"
                          style={{
                            backgroundColor: tagBg,
                            color: tagColor
                          }}
                        >
                          {notif.title}
                        </span>
                      </div>
                      
                      <span className={`text-base font-semibold font-['Inter'] mt-1 ${isExpanded ? "" : "line-clamp-1"}`} style={{ color: primaryColor }}>
                        {notif.subject}
                      </span>
                      
                      {isExpanded && (
                        <span 
                          className="text-sm font-normal font-['Inter'] mt-2 leading-relaxed whitespace-pre-wrap" 
                          style={{ color: primaryColor, opacity: 0.8 }}
                        >
                          {notif.body}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <span className="text-sm font-normal font-['Inter']" style={{ color: primaryColor, opacity: 0.6 }}>
                        {notif.timestamp}
                      </span>
                      <span className="text-[10px] font-bold select-none" style={{ color: primaryColor, opacity: 0.4 }}>
                        {isExpanded ? "▲ Collapse" : "▼ Expand"}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Action Controls Footer */}
        {notifications.length > 0 && (
          <footer className="px-8 py-4 flex justify-end items-center shrink-0 bg-black/[0.01]" style={{ borderTop: `1px solid ${borderColor}` }}>
            <button 
              onClick={handleClearAll}
              className="text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-lg hover:bg-black/[0.04] active:scale-95 transition-all focus:outline-none"
              style={{ color: primaryColor }}
            >
              Clear All
            </button>
          </footer>
        )}
      </div>
    </div>,
    document.body
  );
}