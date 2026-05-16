"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import ClientProfileModal from "../modals/client/profile/modal";

interface NavbarClientProps {
  onHome?: () => void;
  openNotifs?: () => void;
}

export default function NavbarClient({ onHome, openNotifs }: NavbarClientProps = {}) {
  const router = useRouter();
  const supabase = createClient();

  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [notifCount, setNotifCount] = useState<number>(0);
  const [tenantId, setTenantId] = useState<string | null>(null);

  useEffect(() => {
    const initNotifications = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Resolve tenant mapping via user metadata or profile lookup
      const { data: userProfile } = await supabase
        .from("users")
        .select("tenant_id")
        .eq("user_id", user.id)
        .single();

      if (userProfile?.tenant_id) {
        setTenantId(userProfile.tenant_id);

        // Fetch initial billing alerts count
        const { count, error } = await supabase
          .from("billing_notifications")
          .select("*", { count: "exact", head: true })
          .eq("tenant_id", userProfile.tenant_id);

        if (!error && count !== null) {
          setNotifCount(count);
        }
      }
    };

    initNotifications();
  }, []);

  // Listen to incoming billing logs in real-time
  useEffect(() => {
    if (!tenantId) return;

    const channel = supabase
      .channel("realtime-client-billing")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "billing_notifications",
          filter: `tenant_id=eq.${tenantId}`,
        },
        () => {
          setNotifCount((prev) => prev + 1);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tenantId]);

  const handleHomeClick = () => {
    router.push("/dashboard"); 
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

          {/* Notifications with Dynamic Counter */}
          <div className="relative flex items-center justify-center">
            <button 
              onClick={() => {
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

          {/* Profile Button - Opens Modal */}
          <button
            onClick={() => setIsProfileModalOpen(true)}
            className="w-8 h-8 flex items-center justify-center hover:opacity-75 hover:scale-105 transition-all cursor-pointer"
            title="Profile Settings"
          >
            <img src="/navbar-profile-settings.svg" alt="Profile Settings" className="w-full h-full object-contain rounded-full border border-[#385E31]" />
          </button>
        </div>
      </nav>

      {/* Render the Modal outside of the <nav> element */}
      <ClientProfileModal 
        isOpen={isProfileModalOpen} 
        onClose={() => setIsProfileModalOpen(false)} 
      /> 
    </>
  );
}