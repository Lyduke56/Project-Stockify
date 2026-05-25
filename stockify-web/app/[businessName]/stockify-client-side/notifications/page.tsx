"use client";

import { useEffect, useState } from "react";
import { motion, Variants } from "framer-motion";
import SidebarClient from "@/components/navbars/sidebar-client";
import NavbarClient from "@/components/navbars/navbar-client";
import { createClient } from "@/lib/supabase/client";
import { Loader2, Bell, AlertTriangle, Calendar, Mail } from "lucide-react";

interface BillingNotification {
  id: string;
  notification_type: string;
  recipient_email: string;
  subject: string;
  body: string;
  sent_at: string;
}

const getDetailedBody = (type: string, subject: string): string => {
  const lower = type.toLowerCase();
  if (lower === "reminder") {
    return "Your monthly subscription payment is pending. Please pay your fee of ₱1,000.00 to ensure your business remains active and uninterrupted.";
  }
  if (lower === "trial_started") {
    return "Welcome to Stockify! Your 7-day free trial has been successfully activated. You have full access to all inventory and sales features.";
  }
  return subject;
};

// FIXED ALIAS PATH: Pointing exactly to components/navbars/ where it sits in your tree
import NotificationModal from "@/components/modals/notification-modal";

// ── Animations with Strict Typing ──────────────────────────────────────────

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: "easeOut",
    },
  },
};

// ── Page Component ──────────────────────────────────────────────────────────

export default function ClientNotifications() {
  const supabase = createClient();
  const [notifications, setNotifications] = useState<BillingNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isNotifModalOpen, setIsNotifModalOpen] = useState(false);

  const fetchNotifications = async (tid: string) => {
    try {
      console.log("Fetching notifications for tenant_id:", tid);
      const collected: BillingNotification[] = [];

      // 1. Fetch suspension & trial status
      const { data: tenantRow } = await supabase
        .from("tenants")
        .select("is_suspended, subscription_status, trial_ends_at, created_at")
        .eq("tenant_id", tid)
        .single();

      if (tenantRow) {
        if (tenantRow.is_suspended) {
          collected.push({
            id: "suspension-alert",
            notification_type: "suspension",
            recipient_email: "",
            subject: "⛔ Account Suspended by Superadmin",
            body: "Your business account has been suspended due to unresolved subscription billing or compliance issues. Please contact billing/support at support@stockify.com immediately to restore access.",
            sent_at: new Date().toISOString(),
          });
        }

        // Check if trial has ended or is ending soon
        if (tenantRow.subscription_status === "Trial" && tenantRow.trial_ends_at) {
          const trialEnd = new Date(tenantRow.trial_ends_at);
          const now = new Date();
          const diffTime = trialEnd.getTime() - now.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          if (diffDays <= 0) {
            collected.push({
              id: "trial-expired-alert",
              notification_type: "trial_expired",
              recipient_email: "",
              subject: "⚠️ Your Free Trial Has Expired",
              body: "Your 7-day free trial has expired. To continue using Stockify services and manage your shop floor, please subscribe to an active billing plan.",
              sent_at: tenantRow.trial_ends_at,
            });
          } else if (diffDays <= 2) {
            collected.push({
              id: "trial-ending-soon-alert",
              notification_type: "trial_warning",
              recipient_email: "",
              subject: `⏳ Free Trial Ends in ${diffDays} Day(s)`,
              body: `Your free trial period ends on ${trialEnd.toLocaleDateString()}. Subscribe soon to keep your shop dashboard active without interruptions.`,
              sent_at: tenantRow.trial_ends_at,
            });
          }
        }
      }

      // 2. Fetch billing notifications
      const { data: billingData, error } = await supabase
        .from("billing_notifications")
        .select("id, notification_type, recipient_email, subject, sent_at")
        .eq("tenant_id", tid)
        .order("sent_at", { ascending: false });

      if (error) {
        console.error("Supabase error fetching billing notifications:", error);
      }

      if (billingData) {
        billingData.forEach((notif: any) => {
          collected.push({
            id: notif.id,
            notification_type: notif.notification_type || "reminder",
            recipient_email: notif.recipient_email || "",
            subject: notif.subject || "Billing Notification",
            body: getDetailedBody(notif.notification_type || "", notif.subject || ""),
            sent_at: notif.sent_at,
          });
        });
      }

      // 3. Fetch subscription records for pending/overdue/missed warnings
      const { data: subData } = await supabase
        .from("subscription_records")
        .select("billing_period, payment_status, amount, overdue_at")
        .eq("tenant_id", tid)
        .in("payment_status", ["Pending", "Overdue", "Missed"]);

      if (subData) {
        const now = new Date();
        subData.forEach((record: any, index: number) => {
          if (record.payment_status === "Overdue") {
            const overdueDate = record.overdue_at ? new Date(record.overdue_at) : new Date();
            collected.push({
              id: `sub-overdue-${index}`,
              notification_type: "suspension", // Red style
              recipient_email: "",
              subject: "⛔ Subscription Payment Overdue",
              body: `Your subscription payment of ₱${record.amount} for period ending ${record.billing_period} is overdue. Please settle this immediately to avoid service interruption.`,
              sent_at: overdueDate.toISOString(),
            });
          } else if (record.payment_status === "Missed") {
            const overdueDate = record.overdue_at ? new Date(record.overdue_at) : new Date();
            collected.push({
              id: `sub-missed-${index}`,
              notification_type: "suspension", // Red style
              recipient_email: "",
              subject: "⛔ Subscription Payment Missed",
              body: `Your monthly subscription payment of ₱${record.amount} for period ending ${record.billing_period} was missed. Please pay immediately to prevent account suspension.`,
              sent_at: overdueDate.toISOString(),
            });
          } else if (record.payment_status === "Pending" && record.overdue_at) {
            const overdueDate = new Date(record.overdue_at);
            const diffTime = overdueDate.getTime() - now.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays >= 0 && diffDays <= 3) {
              collected.push({
                id: `sub-pending-warning-${index}`,
                notification_type: "overdue_warning", // Orange style
                recipient_email: "",
                subject: "⚠️ Subscription Overdue Warning",
                body: `Your subscription payment of ₱${record.amount} for period ending ${record.billing_period} is pending. Overdue in ${diffDays} day(s) on ${overdueDate.toLocaleDateString()}. Please settle this charge.`,
                sent_at: record.overdue_at,
              });
            }
          }
        });
      }

      // Sort desc
      collected.sort((a, b) => new Date(b.sent_at).getTime() - new Date(a.sent_at).getTime());
      setNotifications(collected);
    } catch (e) {
      console.error("Failed to fetch notifications:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        console.log("Auth User:", user, "Error:", authError);
        if (!user) {
          setLoading(false);
          return;
        }

        const { data: profile, error: profileError } = await supabase
          .from("users")
          .select("tenant_id")
          .eq("user_id", user.id)
          .single();

        console.log("User Profile:", profile, "Error:", profileError);

        if (profile?.tenant_id) {
          setTenantId(profile.tenant_id);
          fetchNotifications(profile.tenant_id);
        } else {
          console.warn("No tenant_id found for user:", user.id);
          setLoading(false);
        }
      } catch (err) {
        console.error("Error in init:", err);
        setLoading(false);
      }
    };

    init();
  }, []);

  // Real-time listener for incoming billing notifications, subscription records, and tenant updates
  useEffect(() => {
    if (!tenantId) return;

    const channel1 = supabase
      .channel("page-realtime-billing")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "billing_notifications",
          filter: `tenant_id=eq.${tenantId}`,
        },
        () => {
          fetchNotifications(tenantId);
        }
      )
      .subscribe();

    const channel2 = supabase
      .channel("page-realtime-subscriptions")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "subscription_records",
          filter: `tenant_id=eq.${tenantId}`,
        },
        () => {
          fetchNotifications(tenantId);
        }
      )
      .subscribe();

    const channel3 = supabase
      .channel("page-realtime-tenants")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tenants",
          filter: `tenant_id=eq.${tenantId}`,
        },
        () => {
          fetchNotifications(tenantId);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel1);
      supabase.removeChannel(channel2);
      supabase.removeChannel(channel3);
    };
  }, [tenantId]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const getIcon = (type: string) => {
    const lower = type.toLowerCase();
    if (lower.includes("warning") || lower.includes("alert") || lower.includes("overdue") || lower.includes("suspension")) {
      return <AlertTriangle className="text-red-500 w-5 h-5" />;
    }
    if (lower.includes("billing") || lower.includes("payment") || lower.includes("reminder")) {
      return <Calendar className="text-amber-500 w-5 h-5" />;
    }
    return <Mail className="text-lime-700 w-5 h-5" />;
  };

  return (
    <div className="min-h-screen bg-white flex overflow-x-hidden font-['Inter']">
      <SidebarClient active="dashboard" />

      <main className="ml-0 lg:ml-64 flex-1 px-4 py-6 sm:px-6 sm:py-8">
        <div className="mx-auto w-full max-w-6xl space-y-6">
          {/* TOP BAR */}
          <motion.div variants={itemVariants}>
            <NavbarClient openNotifs={() => setIsNotifModalOpen(true)} />
          </motion.div>

          {/* TAB HEADER */}
          <section className="w-full inline-flex flex-col justify-start items-start gap-1 px-2 mt-4">
            <h1 className="text-lime-800 text-3xl font-extrabold leading-tight tracking-tight">
              Notifications
            </h1>
            <p className="text-lime-800/70 text-sm font-medium">
              Stay updated with the latest billing notices and system announcements
            </p>
          </section>

          {/* NOTIFICATION CONTENT CONTAINER */}
          <div className="w-full max-w-4xl mx-auto pt-4">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <Loader2 className="animate-spin text-lime-800 w-8 h-8" />
                <span className="text-lime-800/60 text-sm font-semibold">Loading notifications...</span>
              </div>
            ) : notifications.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full bg-[#FFFCEB] rounded-[24px] border border-lime-800/10 p-12 text-center flex flex-col items-center justify-center gap-4 shadow-sm"
              >
                <div className="w-16 h-16 bg-[#F7B71D]/15 rounded-full flex items-center justify-center text-[#F7B71D]">
                  <Bell className="w-8 h-8" />
                </div>
                <div className="flex flex-col gap-1">
                  <h3 className="text-lime-950 text-lg font-bold">All caught up!</h3>
                  <p className="text-lime-800/60 text-sm max-w-sm">
                    You have no new billing alerts or admin notifications at this time.
                  </p>
                </div>
              </motion.div>
            ) : (
              <div className="flex flex-col gap-4">
                {notifications.map((notif, index) => {
                  const isExpanded = expandedId === notif.id;
                  const isSuspension = notif.notification_type === "suspension";
                  return (
                    <motion.div
                      key={notif.id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => setExpandedId(isExpanded ? null : notif.id)}
                      className={`w-full rounded-[20px] border border-lime-800/10 p-5 flex items-start gap-4 shadow-sm transition-all cursor-pointer select-none ${
                        isSuspension 
                          ? "bg-red-50/50 hover:bg-red-50" 
                          : "bg-[#FFFCEB] hover:bg-[#fff9df]"
                      }`}
                    >
                      <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shrink-0 shadow-sm border border-lime-800/5">
                        {getIcon(notif.notification_type)}
                      </div>
                      
                      <div className="flex-1 min-w-0 flex flex-col gap-1">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span 
                            className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider"
                            style={{
                              backgroundColor: isSuspension ? "rgba(239,68,68,0.12)" : "rgba(56,94,49,0.10)",
                              color: isSuspension ? "#ef4444" : "#385E31"
                            }}
                          >
                            {notif.notification_type}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] text-lime-800/50 font-semibold">
                              {formatDate(notif.sent_at)}
                            </span>
                            <span className="text-[10px] font-bold text-lime-800/40 select-none">
                              {isExpanded ? "▲ Collapse" : "▼ Expand"}
                            </span>
                          </div>
                        </div>
                        
                        {/* Subject */}
                        <p className={`text-lime-950 text-sm font-semibold mt-1 leading-relaxed ${isExpanded ? "" : "line-clamp-1"}`}>
                          {notif.subject}
                        </p>
                        
                        {/* Detailed Body (Only shows when expanded) */}
                        {isExpanded && (
                          <p className="text-lime-800/80 text-sm font-medium mt-2 leading-relaxed whitespace-pre-line">
                            {notif.body}
                          </p>
                        )}
                        
                        {notif.recipient_email && isExpanded && (
                          <span className="text-[10px] text-lime-800/40 font-medium mt-2 block">
                            Sent to: {notif.recipient_email}
                          </span>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Rendered Notification Overlay Window */}
      <NotificationModal 
        isOpen={isNotifModalOpen}
        onClose={() => setIsNotifModalOpen(false)}
      />
    </div>
  );
}
