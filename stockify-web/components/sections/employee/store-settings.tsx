"use client";

// Note: You might want to swap this out for your actual Settings component later!
import OrdersTable from "@/components/tables/order-table"; 

// Renamed to SettingsSection to match your EmployeeDashboard SECTIONS dictionary
export default function SettingsSection() {
  return (
    // 1. Changed h-screen to min-h-screen and removed overflow-hidden.
    <div className="flex min-h-screen w-full bg-[#FFFCEB] font-['Inter']">
    
          {/* RIGHT SIDE: Main Content */}
          {/* 2. Removed h-full and overflow-y-auto to stop trapping the scrollbar.
              Changed px-20 to px-10 to keep the padding consistent with your other pages. */}
          <div className="flex-1 flex flex-col w-full font-['Inter']">

            {/* Header */}
            {/* Changed mt-10 to mt-2 for consistency */}
            <div className="w-full flex flex-col items-center mt-2 mb-10">
              <h1 className="text-[#385E31] text-[30px] font-extrabold tracking-wide uppercase">
                Store Settings
              </h1>
              {/* Added max-w-full to prevent horizontal scrolling on small screens */}
              <div className="w-[900px] max-w-full h-1.5 bg-[#F7B71D] mt-1 rounded-full"></div>
            </div>

            <OrdersTable />

          </div>
          
    </div>
  );
}