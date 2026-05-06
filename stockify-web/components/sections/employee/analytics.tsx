"use client";

import AnalyticsReports from "@/components/sections/employee/AnalyticsReports";

export default function EmployeeAnalytics() {
  return (
    // 1. Changed h-screen to min-h-screen and removed overflow-hidden.
    // This allows the background to stretch downward as far as the content needs.
    <div className="flex min-h-screen w-full bg-[#FFFCEB] font-['Inter']">
    
          {/* RIGHT SIDE: Main Content */}
          {/* 2. Removed min-h-0 and overflow-y-auto. 
              The content will now push the page down naturally! */}
          <div className="flex-1 flex flex-col w-full font-['Inter']">
            <AnalyticsReports />
          </div>

    </div>
  );
}