"use client";

interface NavbarSuperAdminProps {
  onHome: () => void;
  openNotifs: () => void;
  openProfile: () => void;
}

export default function NavbarApp({ onHome, openNotifs, openProfile }: NavbarSuperAdminProps) {
  return (
    <nav className="relative w-full h-[60px] px-12 bg-[#F7B71D] rounded-[50px] shadow-[2px_4px_4px_0px_rgba(43,88,12,0.70)] flex items-center justify-between z-[0]">

      {/* LEFT: Logo + Brand */}
      <div
        className="flex items-center gap-1.5 cursor-pointer select-none"
        onClick={onHome}
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

        {/* Home */}
        <button
          onClick={onHome}
          className="w-8 h-8 flex items-center justify-center hover:opacity-75 hover:scale-105 transition-all cursor-pointer"
          title="Home"
        >
          <img src="/navbar-home.svg" alt="Home" className="w-full h-full object-contain" />
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={openNotifs}
            className="w-8 h-8 flex items-center justify-center hover:opacity-75 hover:scale-105 transition-all cursor-pointer"
            title="Notifications"
          >
            <img src="/navbar-notif.svg" alt="Notifications" className="w-full h-full object-contain" />
            <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-600 rounded-full border border-white" />
          </button>
        </div>

        {/* Profile */}
        <button
          onClick={openProfile}
          className="w-8 h-8 flex items-center justify-center hover:opacity-75 hover:scale-105 transition-all cursor-pointer"
          title="Profile Settings"
        >
          <img
            src="/navbar-profile-settings.svg"
            alt="Profile Settings"
            className="w-full h-full object-contain rounded-full border border-[#385E31]"
          />
        </button>

      </div>
    </nav>
  );
}