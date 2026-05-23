"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// Separate components for distinct modal designs
import ClientProfileModal from "../modals/client/profile/modal";
import NotificationModal from "../modals/notification-modal";

interface NavbarClientProps {
  onHome?: () => void;
  openNotifs?: () => void;
}

export default function NavbarClient({ onHome, openNotifs }: NavbarClientProps = {}) {
  const router = useRouter();
  const params = useParams();
  const pathname = usePathname();
  const supabase = createClient();

  const businessName = (params?.businessName as string) || pathname?.split("/")[1];

  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isNotifModalOpen, setIsNotifModalOpen] = useState(false);
  const [notifCount, setNotifCount] = useState<number>(0);
  const [tenantId, setTenantId] = useState<string | null>(null);

  const fetchNotificationCount = async (tid: string) => {
    try {
      // 1. Fetch billing notifications count
      const { count, error } = await supabase
        .from("billing_notifications")
        .select("*", { count: "exact", head: true })
        .eq("tenant_id", tid);

      let totalCount = !error && count !== null ? count : 0;

      // 2. Fetch tenant status for suspension
      const { data: tenantRow } = await supabase
        .from("tenants")
        .select("is_suspended")
        .eq("tenant_id", tid)
        .single();
      
      if (tenantRow?.is_suspended) {
        totalCount += 1;
      }

      // 3. Fetch pending, overdue, or missed subscription records
      const { data: subData } = await supabase
        .from("subscription_records")
        .select("payment_status, overdue_at")
        .eq("tenant_id", tid)
        .in("payment_status", ["Pending", "Overdue", "Missed"]);

      if (subData) {
        const now = new Date();
        subData.forEach((record: any) => {
          if (record.payment_status === "Overdue" || record.payment_status === "Missed") {
            totalCount += 1;
          } else if (record.payment_status === "Pending" && record.overdue_at) {
            const overdueDate = new Date(record.overdue_at);
            const diffTime = overdueDate.getTime() - now.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            if (diffDays >= 0 && diffDays <= 3) {
              totalCount += 1;
            }
          }
        });
      }

      setNotifCount(totalCount);
    } catch (e) {
      console.error(e);
    }
  };

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
        setTenantId(userProfile.tenant_id);
        fetchNotificationCount(userProfile.tenant_id);
      }
    };

    initNotifications();
  }, []);

  // Listen to incoming billing notifications, subscription records, and tenant details in real-time
  useEffect(() => {
    if (!tenantId) return;

    const channel1 = supabase
      .channel("realtime-client-billing")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "billing_notifications",
          filter: `tenant_id=eq.${tenantId}`,
        },
        () => {
          fetchNotificationCount(tenantId);
        }
      )
      .subscribe();

    const channel2 = supabase
      .channel("realtime-client-subscriptions")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "subscription_records",
          filter: `tenant_id=eq.${tenantId}`,
        },
        () => {
          fetchNotificationCount(tenantId);
        }
      )
      .subscribe();

    const channel3 = supabase
      .channel("realtime-client-tenants")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tenants",
          filter: `tenant_id=eq.${tenantId}`,
        },
        () => {
          fetchNotificationCount(tenantId);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel1);
      supabase.removeChannel(channel2);
      supabase.removeChannel(channel3);
    };
  }, [tenantId]);

  const handleHomeClick = () => {
    router.push(`/${businessName}/stockify-client-side/Dashboard`); 
    if (onHome) onHome();
  };

  return (
    <>
      <nav className="relative w-full h-[50px] px-12 bg-[#F7B71D] rounded-[50px] shadow-[2px_4px_4px_0px_rgba(43,88,12,0.70)] flex items-center justify-between z-[50]">
        
        {/* LEFT: Logo + Brand */}
        <div
          className="flex items-center gap-1.5 cursor-pointer select-none"
          onClick={handleHomeClick}
        >
          <div className="w-12 h-12 flex items-center justify-center">
            <img src="/stockify-logo-1.svg" alt="Stockify Icon" className="h-9 w-auto" />
          </div>
          <div className="text-[#385E31] text-3xl font-bold font-fredoka">
            STOCKIFY
          </div>
        </div>

        {/* RIGHT: Nav Icons */}
        <div className="flex items-center gap-8">
          
          {/* Home Button */}
          <button
            onClick={handleHomeClick}
            className="w-8 h-8 flex items-center justify-center hover:opacity-75 hover:scale-105 transition-all cursor-pointer"
            title="Home"
          >
            <img src="/navbar-home.svg" alt="Home" className="w-full h-full object-contain" />
          </button>

          {/* Notifications Trigger */}
          <div className="relative flex items-center justify-center">
            <button 
              onClick={() => {
                setIsNotifModalOpen(true);
                if (openNotifs) openNotifs();
                setNotifCount(0); // Clear visual indicator badge counter when opened
              }} 
              className="w-8 h-8 flex items-center justify-center hover:opacity-75 hover:scale-105 transition-all cursor-pointer"
              title="Notifications"
            >
              <img src="/navbar-notif.svg" alt="Notifications" className="w-full h-full object-contain" />
            </button>
            
            {notifCount > 0 && (
              <div className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1.5 bg-red-600 rounded-full border border-white text-white text-[10px] font-bold flex items-center justify-center shadow-sm">
                {notifCount > 9 ? "9+" : notifCount}
              </div>
            )}
          </div>

          {/* Profile Button */}
          <button
            onClick={() => setIsProfileModalOpen(true)}
            className="w-8 h-8 flex items-center justify-center hover:opacity-75 hover:scale-105 transition-all cursor-pointer"
            title="Profile Settings"
          >
            <img src="/navbar-profile-settings.svg" alt="Profile Settings" className="w-full h-full object-contain rounded-full border border-[#385E31]" />
          </button>
        </div>
      </nav>

      {/* Render the Modals outside of the <nav> element */}
      <ClientProfileModal 
        isOpen={isProfileModalOpen} 
        onClose={() => setIsProfileModalOpen(false)} 
      /> 

      <NotificationModal
        isOpen={isNotifModalOpen}
        onClose={() => setIsNotifModalOpen(false)}
        role="client"
        tenantId={tenantId}
      />
    </>
  );
}