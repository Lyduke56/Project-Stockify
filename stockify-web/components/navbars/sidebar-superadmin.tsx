"use client";

import { useState } from "react";

// --- Types ---
interface NavItemProps {
  label: string;
  iconFileName: string;
  isActive: boolean;
  onClick: () => void;
}

// --- NavItem Component ---
function NavItem({ label, iconFileName, isActive, onClick }: NavItemProps) {
  return (
    <div
      onClick={onClick}
      className={`w-full h-14 pl-6 pr-4 flex items-center gap-4 cursor-pointer transition-all duration-200 ${
        isActive
          ? "bg-[#E5AD24] text-[#385E31] shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)] font-bold"
          : "bg-transparent text-[#FFF9D7] hover:bg-[#368028] font-semibold"
      }`}
    >
      <div className="w-8 h-8 flex items-center justify-center shrink-0">
        <img
          // Note: Using encodeURI handles the space in "icon-subscription billing"
          src={`/Dashboard Icons/${encodeURI(iconFileName)}.svg`}
          alt={label}
          className="w-full h-full object-contain"
          /* Tip: If your SVGs are strictly white and you want them to turn 
            green (#385E31) when clicked, you can apply a CSS filter here 
            based on the isActive state, or use an inline SVG. 
          */
          style={
            isActive
              ? { filter: "brightness(0) saturate(100%) invert(32%) sepia(16%) saturate(1553%) hue-rotate(69deg) brightness(97%) contrast(85%)" }
              : {}
          }
        />
      </div>
      <div className="text-base font-['Inter'] whitespace-nowrap">
        {label}
      </div>
    </div>
  );
}

// --- Main Sidebar Component ---
export default function Sidebar() {
  // Track which menu item is currently clicked
  const [activeItem, setActiveItem] = useState("Dashboard");

  // Top Section Navigation Links
  const mainNavItems = [
    { label: "Dashboard", iconFileName: "icon-dashboard" },
    { label: "Store Settings", iconFileName: "icon-store-settings" },
    { label: "Tenant Management", iconFileName: "icon-tenant-management" },
    { label: "Subscription Billing", iconFileName: "icon-subscription-billing" },
    { label: "Audit Logs", iconFileName: "icon-audit-logs" },
  ];

  // Bottom Section Links (Assuming you name your settings/logout icons similarly)
  const bottomItems = [
    { label: "Settings", iconFileName: "icon-settings" }, 
    { label: "Logout", iconFileName: "icon-logout" },
  ];

  return (
    <div className="w-64 h-screen pt-12 pb-8 bg-[#385E31] shadow-[2px_4px_18px_0px_rgba(0,0,0,0.25)] flex flex-col justify-between shrink-0 overflow-y-auto">
      
      {/* Top Navigation */}
      <div className="w-full flex flex-col gap-1">
        {mainNavItems.map((item) => (
          <NavItem
            key={item.label}
            label={item.label}
            iconFileName={item.iconFileName}
            isActive={activeItem === item.label}
            onClick={() => setActiveItem(item.label)}
          />
        ))}
      </div>

      {/* Bottom Navigation & Divider */}
      <div className="w-full flex flex-col items-center gap-4 mt-10">
        
        {/* Divider matching Figma's outline-stone-600/20 */}
        <div className="w-48 h-px bg-white/10"></div>
        
        <div className="w-full flex flex-col gap-1">
          {bottomItems.map((item) => (
            <NavItem
              key={item.label}
              label={item.label}
              iconFileName={item.iconFileName}
              isActive={activeItem === item.label}
              onClick={() => setActiveItem(item.label)}
            />
          ))}
        </div>
      </div>

    </div>
  );
}