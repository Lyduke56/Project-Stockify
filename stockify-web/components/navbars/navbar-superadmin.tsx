"use client";

import { useEffect, useState, useCallback } from "react"; 
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import SuperadminProfileModal from "../modals/superadmin/superadmin-profile/modal";

interface NavbarSuperAdminProps {
  onHome?: () => void; 
  openNotifs: () => void;
}

export default function NavbarApp({ onHome, openNotifs }: NavbarSuperAdminProps) {
  const router = useRouter(); 
  const supabase = createClient();
  
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [systemAlertCount, setSystemAlertCount] = useState<number>(0);

  const checkGlobalPlatformIssues = useCallback(async () => {
    // Query tenants across global application context scope
    const { data, error } = await supabase
      .from("tenants")
      .select("tenant_id")
      .or("subscription_status.eq.Pending,is_suspended.eq.true");

    if (!error && data) {
      setSystemAlertCount(data.length);
    }
  }, [supabase]);

  useEffect(() => {
    checkGlobalPlatformIssues();

    // Listen to changes globally across all tenants
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
  }, [checkGlobalPlatformIssues]);

  const handleHomeClick = () => {
    router.push("/superadmin/dashboard");
    if (onHome) onHome();
  };

  return (
    <>
      <nav className="relative w-full h-[60px] px-12 bg-[#F7B71D] rounded-[50px] shadow-[2px_4px_4px_0px_rgba(43,88,12,0.70)] flex items-center justify-between z-[50]">

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

          {/* Notifications with Real-time Count */}
          <div className="relative flex items-center justify-center">
            <button 
              onClick={openNotifs} 
              className="w-8 h-8 flex items-center justify-center hover:opacity-75 hover:scale-105 transition-all cursor-pointer"
              title="Notifications"
            >
              <img src="/navbar-notif.svg" alt="Notifications" className="w-full h-full object-contain" />
            </button>
            
            {systemAlertCount > 0 && (
              <div className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1.5 bg-red-600 rounded-full border border-white text-white text-[10px] font-bold flex items-center justify-center shadow-sm">
                {systemAlertCount}
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

      <SuperadminProfileModal 
        isOpen={isProfileModalOpen} 
        onClose={() => setIsProfileModalOpen(false)} 
      />
    </>
  );
}