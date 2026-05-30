"use client";

import { useEffect, useState, useCallback } from "react"; 
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import SuperadminProfileModal from "../modals/superadmin/superadmin-profile/modal";
import SuperadminNotificationModal from "../modals/superadmin/superadmin-notifications/modal"; 

// ── Types ─────────────────────────────────────────────────────────────────────
export interface NotificationItem {
  id: string;
  title: string;
  description: string;
  time: string;
  isUnread: boolean;
  type: "tenant" | "alert" | "billing";
}

interface NavbarSuperAdminProps {
  onHome?: () => void; 
  openNotifs?: () => void;
}

export default function NavbarApp({ onHome, openNotifs }: NavbarSuperAdminProps) {
  const router = useRouter(); 
  const supabase = createClient();
  
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isNotifModalOpen, setIsNotifModalOpen] = useState(false); 
  const [systemAlertCount, setSystemAlertCount] = useState<number>(0);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  // Local persistent storage state identifiers to track deleted/read notifications across page refreshes
  const [readNotifIds, setReadNotifIds] = useState<string[]>([]);
  const [removedNotifIds, setRemovedNotifIds] = useState<string[]>([]);

  // Load persistence configurations on component mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedRead = localStorage.getItem("sa_read_notifs");
      const storedRemoved = localStorage.getItem("sa_removed_notifs");
      if (storedRead) setReadNotifIds(JSON.parse(storedRead));
      if (storedRemoved) setRemovedNotifIds(JSON.parse(storedRemoved));
    }
  }, []);

  const checkGlobalPlatformIssues = useCallback(async () => {
    // 1. Fetch data from DB tables
    const [tenantsRes, subRes] = await Promise.all([
      supabase
        .from("tenants")
        .select("tenant_id, business_name, subscription_status, is_suspended, created_at")
        .or("subscription_status.eq.Pending,is_suspended.eq.true"),
      supabase
        .from("subscription_records")
        .select("subscription_id, tenant_id, payment_status, overdue_at, paid_at")
        .or("payment_status.eq.Paid,payment_status.eq.Overdue,payment_status.eq.Missed")
    ]);

    // Read latest states from localStorage if available to ensure accurate real-time filtering
    const localRemoved = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("sa_removed_notifs") || "[]") : [];
    const localRead = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("sa_read_notifs") || "[]") : [];

    const builtNotifications: NotificationItem[] = [];

    // Map Applications & Suspensions
    // Map Applications & Suspensions
    if (!tenantsRes.error && tenantsRes.data) {
      tenantsRes.data.forEach((t: { tenant_id: string; business_name: string; subscription_status: string; is_suspended: boolean | null; created_at: string }) => {
        const notifId = `tenant-${t.tenant_id}`;
        if (localRemoved.includes(notifId)) return; // Skip if user removed it

        const isPending = t.subscription_status === "Pending";
        builtNotifications.push({
          id: notifId,
          title: isPending ? "New Tenancy Application" : "Tenant Suspended ⚠️",
          description: isPending 
            ? `${t.business_name || "A new organization"} applied for a system registration link.` 
            : `${t.business_name || "A tenant"} has been suspended on the platform system context.`,
          time: t.created_at ? new Date(t.created_at).toLocaleDateString() : "Recent",
          isUnread: !localRead.includes(notifId),
          type: isPending ? "tenant" : "alert"
        });
      });
    }

    // Build a map of tenant_id → business_name from the tenants query above
    const tenantMap = new Map<string, string>();
    if (!tenantsRes.error && tenantsRes.data) {
      tenantsRes.data.forEach((t: any) => tenantMap.set(t.tenant_id, t.business_name || "Unknown Tenant"));
    }

    // Map Payment Notifications & Term Failures
    if (!subRes.error && subRes.data) {
      // Fetch any remaining business names not already in tenantMap
      const missingIds = (subRes.data as any[])
        .map((s: any) => s.tenant_id)
        .filter((id: string) => !tenantMap.has(id));

      if (missingIds.length > 0) {
        const { data: extraTenants } = await supabase
          .from("tenants")
          .select("tenant_id, business_name")
          .in("tenant_id", missingIds);
        (extraTenants || []).forEach((t: any) => tenantMap.set(t.tenant_id, t.business_name || "Unknown Tenant"));
      }

      const subRecords = subRes.data as any[];
      subRecords.forEach((s: { subscription_id: string; tenant_id: string; payment_status: string; overdue_at: string | null; paid_at: string | null }) => {
        const notifId = `sub-${s.subscription_id}`;
        if (localRemoved.includes(notifId)) return; // Skip if user removed it

        let titleText = "Subscription Update";
        let descText = "";
        let notifType: "tenant" | "alert" | "billing" = "billing";

        if (s.payment_status === "Paid") {
          titleText = "Payment Received! 🎉";
          descText = `${tenantMap.get(s.tenant_id) || "A client"} has successfully posted their subscription payment invoice settlement.`;
          notifType = "billing";
        } else if (s.payment_status === "Overdue") {
          titleText = "Invoice Overdue ⚠️";
          descText = `The billing invoice allocation assigned to ${tenantMap.get(s.tenant_id) || "a client"} is overdue.`;
          notifType = "alert";
        } else if (s.payment_status === "Missed") {
          titleText = "Payment Term Missed ❌";
          descText = `${tenantMap.get(s.tenant_id) || "A client"} missed their payment cutoff grace period parameter windows.`;
          notifType = "alert";
        }

        // Use paid_at for paid records, overdue_at for overdue/missed
        const timeVal = s.payment_status === "Paid" ? s.paid_at : s.overdue_at;

        builtNotifications.push({
          id: notifId,
          title: titleText,
          description: descText,
          time: timeVal ? new Date(timeVal).toLocaleDateString() : "Recent",
          isUnread: !localRead.includes(notifId),
          type: notifType
        });
      });
    }

    // Badge count should only track actual notifications that are unread
    const activeUnreadCount = builtNotifications.filter(n => n.isUnread).length;

    setNotifications(builtNotifications);
    setSystemAlertCount(activeUnreadCount);
  }, [supabase]);

  useEffect(() => {
    checkGlobalPlatformIssues();

    // Listen to changes globally across all tenants
    const channelTenants = supabase
      .channel("global-system-tenants")
      .on("postgres_changes", { event: "*", schema: "public", table: "tenants" }, () => {
        checkGlobalPlatformIssues();
      })
      .subscribe();

    // Listen to changes globally across subscription records
    const channelSubs = supabase
      .channel("global-system-subs")
      .on("postgres_changes", { event: "*", schema: "public", table: "subscription_records" }, () => {
        checkGlobalPlatformIssues();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channelTenants);
      supabase.removeChannel(channelSubs);
    };
  }, [checkGlobalPlatformIssues, supabase]);

  // ── Action Handlers ──
  const handleRemoveNotif = (id: string) => {
    const updatedRemoved = Array.from(new Set([...removedNotifIds, id]));
    setRemovedNotifIds(updatedRemoved);
    localStorage.setItem("sa_removed_notifs", JSON.stringify(updatedRemoved));

    setNotifications((prev) => prev.filter((n) => n.id !== id));
    setSystemAlertCount((prev) => Math.max(0, prev - 1));
  };

  const handleClearAllNotifs = () => {
    const allIds = notifications.map((n) => n.id);
    
    const updatedRead = Array.from(new Set([...readNotifIds, ...allIds]));
    const updatedRemoved = Array.from(new Set([...removedNotifIds, ...allIds]));

    setReadNotifIds(updatedRead);
    setRemovedNotifIds(updatedRemoved);
    
    localStorage.setItem("sa_read_notifs", JSON.stringify(updatedRead));
    localStorage.setItem("sa_removed_notifs", JSON.stringify(updatedRemoved));

    setNotifications([]);
    setSystemAlertCount(0);
  };

  const handleMarkAsRead = (id: string) => {
    if (readNotifIds.includes(id)) return;

    const updatedRead = [...readNotifIds, id];
    setReadNotifIds(updatedRead);
    localStorage.setItem("sa_read_notifs", JSON.stringify(updatedRead));

    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isUnread: false } : n))
    );
    setSystemAlertCount((prev) => Math.max(0, prev - 1));
  };

  const handleHomeClick = () => {
    router.push("/superadmin/dashboard");
    if (onHome) onHome();
  };

  return (
    <>
      <nav className="relative w-full h-[60px] px-12 bg-[#F7B71D] rounded-[50px] shadow-[2px_4px_4px_0px_rgba(43,88,12,0.70)] flex items-center justify-between z-[50]">
        {/* LEFT: Logo + Brand */}
        <div className="flex items-center gap-1.5 cursor-pointer select-none" onClick={handleHomeClick}>
          <div className="w-12 h-12 flex items-center justify-center">
            <img src="/stockify-logo-1.svg" alt="Stockify Icon" className="h-9 w-auto" /> 
          </div>
          <div className="text-[#385E31] text-3xl font-bold font-fredoka">STOCKIFY</div>
        </div>

        {/* RIGHT: Nav Icons */}
        <div className="flex items-center gap-8">
          {/* Home Button */}
          <button onClick={handleHomeClick} className="w-8 h-8 flex items-center justify-center hover:opacity-75 hover:scale-105 transition-all cursor-pointer" title="Home">
            <img src="/navbar-home.svg" alt="Home" className="w-full h-full object-contain" />
          </button>

          {/* Notifications with Real-time Count */}
          <div className="relative flex items-center justify-center">
            <button 
              onClick={() => { if (openNotifs) openNotifs(); else setIsNotifModalOpen(true); }} 
              className="w-8 h-8 flex items-center justify-center hover:opacity-75 hover:scale-105 transition-all cursor-pointer p-0.5 bg-transparent border-0 focus:outline-none" 
              title="Notifications"
            >
              <div
                className="w-full h-full bg-[#385E31]"
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
            
            {systemAlertCount > 0 && (
              <div className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1.5 bg-red-600 rounded-full border border-white text-white text-[10px] font-bold flex items-center justify-center shadow-sm pointer-events-none transition-opacity duration-300">
                {systemAlertCount}
              </div>
            )}
          </div>

          {/* Profile Button */}
          <button onClick={() => setIsProfileModalOpen(true)} className="w-8 h-8 flex items-center justify-center hover:opacity-75 hover:scale-105 transition-all cursor-pointer" title="Profile Settings">
            <img src="/navbar-profile-settings.svg" alt="Profile Settings" className="w-full h-full object-contain rounded-full border border-[#385E31]" />
          </button>
        </div>
      </nav>

      <SuperadminProfileModal isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} />

      <SuperadminNotificationModal
        isOpen={isNotifModalOpen}
        onClose={() => setIsNotifModalOpen(false)}
        notifications={notifications}
        onRemove={handleRemoveNotif}
        onClearAll={handleClearAllNotifs}
        onMarkAsRead={handleMarkAsRead}
      />
    </>
  );
}