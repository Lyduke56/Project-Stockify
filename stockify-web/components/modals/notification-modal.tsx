"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

interface NotificationItem {
  id: string; 
  title: string;
  body: string; // Map "message" column from Supabase into this for compatibility
  timestamp: string;
  isRead?: boolean;
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
  tenantId = null,
}: NotificationModalProps) {
  const supabase = createClient();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // Store lists of explicitly deleted notification IDs to keep them hidden locally
  const [deletedIds, setDeletedIds] = useState<string[]>([]);
  // Keep track of which notification IDs have been read locally
  const [readIds, setReadIds] = useState<string[]>([]);

  const fetchLiveBillingAlerts = useCallback(async (showLoadingState = false) => {
    if (!tenantId) return;
    if (showLoadingState) setLoading(true);
    
    try {
      // Querying your requested billing_notifications table directly
      const { data, error } = await supabase
        .from("billing_notifications")
        .select("id, title, message, created_at")
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false });

      if (!error && data) {
        const collectedAlerts: NotificationItem[] = [];

        data.forEach((item: { id: any; title: string; message: string; created_at: string }) => {
          const stringId = String(item.id);
          
          // Only render if it hasn't been added to the deletedIds array
          if (!deletedIds.includes(stringId)) {
            collectedAlerts.push({
              id: stringId,
              title: item.title || "💳 Billing Notification",
              body: item.message || "No message content provided.",
              timestamp: new Date(item.created_at).toLocaleString("en-US", { 
                month: "2-digit", 
                day: "2-digit", 
                hour: "2-digit", 
                minute: "2-digit", 
                hour12: true 
              }),
              isRead: readIds.includes(stringId), // Retain current read selection status
            });
          }
        });

        setNotifications(collectedAlerts);
      }
    } catch (err) {
      console.error("Failed executing real-time billing notifications fetch:", err);
    } finally {
      if (showLoadingState) setLoading(false);
    }
  }, [supabase, tenantId, deletedIds, readIds]);

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
    setDeletedIds(prev => [...prev, id]);
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // Mass action to clear out the active lists immediately
  const handleClearAll = () => {
    const currentIds = notifications.map(n => n.id);
    setDeletedIds(prev => [...prev, ...currentIds]);
    setNotifications([]);
  };

  useEffect(() => {
    if (isOpen) {
      fetchLiveBillingAlerts(true);
    }
  }, [isOpen, fetchLiveBillingAlerts]);

  // Real-time postgres pipeline listener setup targeted at the billing table
  useEffect(() => {
    if (!isOpen || !tenantId) return;

    const channel = supabase
      .channel("modal-live-billing-table-sync")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "billing_notifications", filter: `tenant_id=eq.${tenantId}` },
        () => fetchLiveBillingAlerts(false)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isOpen, supabase, fetchLiveBillingAlerts, tenantId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-[600px] rounded-2xl shadow-2xl overflow-hidden" style={{ backgroundColor: "#FFFCF0" }}>
        
        {/* Header Section */}
        <header className="px-8 py-5 flex justify-between items-center" style={{ borderBottom: "1px solid rgba(56,94,49,0.15)" }}>
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-bold uppercase tracking-widest font-['Inter']" style={{ color: "#385E31" }}>
              Notifications
            </h2>
            {notifications.length > 0 && (
              <button 
                onClick={handleClearAll}
                className="text-xs font-bold font-['Inter'] px-2.5 py-1 rounded-md bg-red-50 hover:bg-red-100/80 transition-all border border-red-200/50"
                style={{ color: "#DC2626" }}
              >
                Clear All
              </button>
            )}
          </div>
          <button onClick={onClose} className="text-lg font-bold hover:scale-110 transition-transform" style={{ color: "#385E31" }}>
            ✕
          </button>
        </header>

        {/* List View */}
        <div className="flex flex-col max-h-[440px] overflow-y-auto">
          {loading ? (
            <div className="px-8 py-12 text-center text-sm font-medium font-['Inter']" style={{ color: "#385E31", opacity: 0.6 }}>
              Syncing live billing metrics...
            </div>
          ) : notifications.length === 0 ? (
            <div className="px-8 py-16 text-center flex flex-col gap-1.5 items-center justify-center font-['Inter']" style={{ color: "#385E31" }}>
              <span className="text-base font-semibold">All Caught Up!</span>
              <span className="text-sm font-normal opacity-60">
                No billing statements or subscription updates found.
              </span>
            </div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => handleToggleRead(notif.id)}
                className="flex items-start justify-between px-8 py-5 cursor-pointer group transition-all duration-150 relative"
                style={{
                  backgroundColor: notif.isRead ? "transparent" : "rgba(56,94,49,0.06)",
                  borderBottom: "1px solid rgba(56,94,49,0.10)",
                }}
              >
                {/* Unread amber indicator dot (FB style) */}
                {!notif.isRead && (
                  <div className="absolute left-3.5 top-7 w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                )}

                <div className="flex items-start gap-3 flex-1 pr-24">
                  <div className="flex flex-col gap-1 pl-1">
                    <span className={`text-base font-['Inter'] ${notif.isRead ? "font-medium text-gray-600" : "font-bold text-lime-900"}`} style={{ color: notif.isRead ? undefined : "#264220" }}>
                      {notif.title}
                    </span>
                    <span className="text-sm font-normal font-['Inter']" style={{ color: "#385E31", opacity: notif.isRead ? 0.5 : 0.8 }}>
                      {notif.body}
                    </span>
                  </div>
                </div>

                {/* Timestamps and Deletions Column */}
                <div className="flex flex-col items-end gap-3 shrink-0">
                  <span className="text-sm font-normal font-['Inter']" style={{ color: "#385E31", opacity: 0.5 }}>
                    {notif.timestamp}
                  </span>
                  
                  <button
                    onClick={(e) => handleDeleteNotification(notif.id, e)}
                    className="text-xs font-semibold px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 transition-all duration-150"
                  >
                    Delete this notification
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}