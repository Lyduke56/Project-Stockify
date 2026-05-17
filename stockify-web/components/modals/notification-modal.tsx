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
  business_name: string; // Changed from 'name' to match your SQL schema exactly
  subscription_status: string;
  is_suspended: boolean;
  created_at: string;
}

export default function NotificationModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const supabase = createClient();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const fetchLiveSystemAlerts = useCallback(async (showLoadingState = false) => {
    if (showLoadingState) setLoading(true);
    try {
      const { data, error } = await supabase
        .from("tenants")
        // Swapped 'name' for 'business_name' in the SQL query string
        .select("tenant_id, business_name, subscription_status, is_suspended, created_at")
        .or("subscription_status.eq.Pending,is_suspended.eq.true")
        .order("created_at", { ascending: false });

      if (!error && data) {
        const formattedAlerts: NotificationItem[] = (data as TenantAlert[]).map((tenant: TenantAlert) => {
          const dateString = new Date(tenant.created_at).toLocaleString("en-US", {
            month: "2-digit",
            day: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          });

          if (tenant.is_suspended) {
            return {
              title: "Platform Suspended - Compliance Alert",
              // Accessing tenant.business_name safely now
              body: `The tenant account organization entity "${tenant.business_name}" has been flagged as suspended.`,
              timestamp: dateString,
              isRead: false,
            };
          } else {
            return {
              title: "New Registration Pending Approval",
              // Accessing tenant.business_name safely now
              body: `The tenant enterprise profile registration request for "${tenant.business_name}" is awaiting access authorization.`,
              timestamp: dateString,
              isRead: false,
            };
          }
        });

        setNotifications(formattedAlerts);
      }
    } catch (err) {
      console.error("Failed executing superadmin real-time compliance modal sync:", err);
    } finally {
      if (showLoadingState) setLoading(false);
    }
  }, [supabase]);

  // Initial fetch trigger when opened
  useEffect(() => {
    if (isOpen) {
      fetchLiveSystemAlerts(true);
    }
  }, [isOpen, fetchLiveSystemAlerts]);

  // Live snapshot updates inside the modal container view
  useEffect(() => {
    if (!isOpen) return;

    const channel = supabase
      .channel("modal-system-compliance")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tenants" },
        () => {
          fetchLiveSystemAlerts(false);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isOpen, supabase, fetchLiveSystemAlerts]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-[600px] rounded-2xl shadow-2xl overflow-hidden"
        style={{ backgroundColor: "#FFFCF0" }}
      >
        {/* Header */}
        <header
          className="px-8 py-5 flex justify-between items-center"
          style={{ borderBottom: "1px solid rgba(56,94,49,0.15)" }}
        >
          <h2
            className="text-2xl font-bold uppercase tracking-widest font-['Inter']"
            style={{ color: "#385E31" }}
          >
            Notifications
          </h2>
          <button
            onClick={onClose}
            className="text-lg font-bold hover:scale-110 transition-transform"
            style={{ color: "#385E31" }}
          >
            ✕
          </button>
        </header>

        {/* Notification list */}
        <div className="flex flex-col max-h-[440px] overflow-y-auto">
          {loading ? (
            <div 
              className="px-8 py-12 text-center text-sm font-medium font-['Inter']"
              style={{ color: "#385E31", opacity: 0.6 }}
            >
              Syncing live system metrics...
            </div>
          ) : notifications.length === 0 ? (
            <div 
              className="px-8 py-16 text-center flex flex-col gap-1.5 items-center justify-center font-['Inter']"
              style={{ color: "#385E31" }}
            >
              <span className="text-base font-semibold">All Caught Up!</span>
              <span className="text-sm font-normal opacity-60">No pending infrastructure setup tasks found.</span>
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
                {/* Left: title + body */}
                <div className="flex flex-col gap-1 flex-1 pr-8">
                  <span
                    className="text-base font-semibold font-['Inter']"
                    style={{ color: "#385E31" }}
                  >
                    {notif.title}
                  </span>
                  <span
                    className="text-sm font-normal font-['Inter']"
                    style={{ color: "#385E31", opacity: 0.6 }}
                  >
                    {notif.body}
                  </span>
                </div>

                {/* Right: timestamp */}
                <span
                  className="text-sm font-normal font-['Inter'] shrink-0"
                  style={{ color: "#385E31", opacity: 0.6 }}
                >
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