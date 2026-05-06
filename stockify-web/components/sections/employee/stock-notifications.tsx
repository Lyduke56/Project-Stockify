"use client";

import StockNotifications from "@/components/tables/stock-notifications-table";

// Renamed to match the SECTIONS dictionary in your EmployeeDashboard
export default function StockNotificationsSection() {
  return (
    // REMOVED: h-screen, bg-[#FFFCEB], overflow-hidden, overflow-y-auto, and extra padding
    // This is now a clean flex column ready to be rendered inside your main layout
    <div className="w-full flex flex-col font-['Inter']">

      {/* Header */}
      <div className="w-full flex flex-col items-center mt-2 mb-10">
        <h1 className="text-[#385E31] text-[30px] font-extrabold tracking-wide uppercase">
          Stock Notifications
        </h1>
        {/* Added max-w-full to prevent horizontal scrolling on smaller screens */}
        <div className="w-[900px] max-w-full h-1.5 bg-[#F7B71D] mt-1 rounded-full"></div>
      </div>

      {/* Table Component */}
      <StockNotifications />

    </div>
  );
}