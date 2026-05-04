"use client";

import { useRouter } from "next/navigation"; // 1. Import useRouter

interface NavbarSuperAdminProps {
  onHome?: () => void; // Optional if you still want the scroll effect on the dashboard page
  openNotifs: () => void;
  openProfile: () => void;
}

export default function NavbarApp({ onHome, openNotifs, openProfile }: NavbarSuperAdminProps) {
  const router = useRouter(); // 2. Initialize router

  const handleHomeClick = () => {
    // 3. Logic to navigate back to the main dashboard
    router.push("/superadmin/dashboard");
    
    // Optional: if on the dashboard already, scroll to top
    if (onHome) onHome();
  };

  return (
    <nav className="relative w-full h-[60px] px-12 bg-[#F7B71D] rounded-[50px] shadow-[2px_4px_4px_0px_rgba(43,88,12,0.70)] flex items-center justify-between z-[50]">

      {/* LEFT: Logo + Brand */}
      <div
        className="flex items-center gap-1.5 cursor-pointer select-none"
        onClick={handleHomeClick} // Use the new navigation handler
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
          onClick={handleHomeClick} // Use the new navigation handler
          className="w-8 h-8 flex items-center justify-center hover:opacity-75 hover:scale-105 transition-all cursor-pointer"
          title="Home"
        >
          <img src="/navbar-home.svg" alt="Home" className="w-full h-full object-contain" />
        </button>

        {/* ... Rest of your UI (Notifications, Profile) remains untouched ... */}
        <div className="relative">
          <button onClick={openNotifs} className="w-8 h-8 flex items-center justify-center hover:opacity-75 hover:scale-105 transition-all cursor-pointer">
            <img src="/navbar-notif.svg" alt="Notifications" className="w-full h-full object-contain" />
            <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-600 rounded-full border border-white" />
          </button>
        </div>

        <button onClick={openProfile} className="w-8 h-8 flex items-center justify-center hover:opacity-75 hover:scale-105 transition-all cursor-pointer">
          <img src="/navbar-profile-settings.svg" alt="Profile Settings" className="w-full h-full object-contain rounded-full border border-[#385E31]" />
        </button>
      </div>
    </nav>
  );
}