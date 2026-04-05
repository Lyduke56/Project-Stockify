"use client";

import { useRouter } from "next/navigation";

export default function NavbarApp() {
  const router = useRouter();

  return (
    <div className="w-full h-[60px] px-12 bg-[#F7B71D] rounded-[50px] shadow-[2px_4px_4px_0px_rgba(43,88,12,0.70)] flex items-center justify-between">
      
      {/* LEFT SIDE: Logo and Brand Name */}
      <div 
        className="flex items-center gap-1.5 cursor-pointer select-none" 
        onClick={() => router.push("/")}
      >
        <div className="w-12 h-12 flex items-center justify-center">
          <img
            src="/stockify-logo-1.svg"
            alt="Stockify Icon"
            className="h-9 w-auto"
          />
        </div>
        <div className="text-[#385E31] text-3xl font-bold font-fredoka">
          STOCKIFY
        </div>
      </div>

      {/* RIGHT SIDE: Navigation Icons */}
      <div className="flex items-center gap-8">
        
        {/* Home Icon */}
        <button
          onClick={() => router.push("/dashboard")} 
          className="w-8 h-8 flex items-center justify-center hover:opacity-75 hover:scale-105 transition-all cursor-pointer"
          title="Home"
        >
          <img 
            src="/navbar-home.svg" 
            alt="Home" 
            className="w-full h-full object-contain" 
          />
        </button>

        {/* Notifications Icon */}
        <button
          onClick={() => router.push("/notifications")} // Change to your actual notif route
          className="w-8 h-8 flex items-center justify-center hover:opacity-75 hover:scale-105 transition-all cursor-pointer"
          title="Notifications"
        >
          <img 
            src="/navbar-notif.svg" 
            alt="Notifications" 
            className="w-full h-full object-contain" 
          />
        </button>

        {/* Profile Settings Icon */}
        <button
          onClick={() => router.push("/settings")} // Change to your actual settings route
          className="w-8 h-8 flex items-center justify-center hover:opacity-75 hover:scale-105 transition-all cursor-pointer"
          title="Profile Settings"
        >
          <img 
            src="/navbar-profile-settings.svg" 
            alt="Profile Settings" 
            className="w-full h-full object-contain" 
          />
        </button>

      </div>
    </div>
  );
}