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
}

export default function NavbarApp({ onHome }: NavbarSuperAdminProps) {
  const router = useRouter(); 
  const supabase = createClient();
  
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isNotifModalOpen, setIsNotifModalOpen] = useState(false); 
  
  // Explicitly typing state arrays to keep TypeScript happy 🚀
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [readNotifIds, setReadNotifIds] = useState<string[]>([]);
  const [removedNotifIds, setRemovedNotifIds] = useState<string[]>([]);

  const checkGlobalPlatformIssues = useCallback(async () => {
    const { data, error } = await supabase
      .from("tenants")
      .select("tenant_id, company_name, subscription_status, is_suspended")
      .or("subscription_status.eq.Pending,is_suspended.eq.true");

    if (!error && data) {
      const mappedNotifs: NotificationItem[] = data
        .map((tenant: {
          tenant_id: any;
          company_name: string | null;
          subscription_status: string | null;
          is_suspended: boolean | null;
        }) => {
          const idStr = tenant.tenant_id.toString();
          const isPending = tenant.subscription_status === "Pending";
          
          return {
            id: idStr,
            title: isPending ? "Pending Registration" : "Account Suspended",
            description: isPending 
              ? `${tenant.company_name || "A new tenant"} is waiting for subscription verification.`
              : `${tenant.company_name || "A tenant account"} has been temporarily suspended from the platform.`,
            time: "Just Now",
            isUnread: !readNotifIds.includes(idStr), 
            type: isPending ? "tenant" : "alert",
          };
        })
        // Added explicit type parsing inside loop checks to remove any residual bugs
        .filter((n: NotificationItem) => !removedNotifIds.includes(n.id));

      setNotifications(mappedNotifs);
    }
  }, [supabase, readNotifIds, removedNotifIds]);

  useEffect(() => {
    checkGlobalPlatformIssues();

    const channel = supabase
      .channel("global-system-compliance")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tenants" },
        () => {
          checkGlobalPlatformIssues();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [checkGlobalPlatformIssues, supabase]);

  // ── Action Handlers ──
  const handleRemoveNotif = (id: string) => {
    setRemovedNotifIds((prev) => [...prev, id]);
    setNotifications((prev) => prev.filter((n: NotificationItem) => n.id !== id));
  };

  const handleClearAllNotifs = () => {
    const allIds = notifications.map((n: NotificationItem) => n.id);
    setReadNotifIds((prev) => Array.from(new Set([...prev, ...allIds])));
    setRemovedNotifIds((prev) => Array.from(new Set([...prev, ...allIds])));
    setNotifications([]);
  };

  const handleMarkAsRead = (id: string) => {
    setReadNotifIds((prev) => [...prev, id]);
    setNotifications((prev) =>
      prev.map((n: NotificationItem) => (n.id === id ? { ...n, isUnread: false } : n))
    );
  };

  // 🌟 FIX: Explicitly typed 'n' as NotificationItem to fix line 64 parameter rule
  const systemAlertCount = notifications.filter((n: NotificationItem) => n.isUnread).length;

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
            <button onClick={() => setIsNotifModalOpen(true)} className="w-8 h-8 flex items-center justify-center hover:opacity-75 hover:scale-105 transition-all cursor-pointer" title="Notifications">
              <img src="/navbar-notif.svg" alt="Notifications" className="w-full h-full object-contain" />
            </button>
            
            {systemAlertCount > 0 && (
              <div className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1.5 bg-red-600 rounded-full border border-white text-white text-[10px] font-bold flex items-center justify-center shadow-sm pointer-events-none">
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