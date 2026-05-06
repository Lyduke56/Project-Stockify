"use client";

import AuditLogs from "@/components/tables/audit-logs-table";

export default function EmployeeAuditLogs() {
  return (
    // 1. Changed h-screen to min-h-screen and removed overflow-hidden.
    // This allows the background to stretch downwards indefinitely.
    <div className="flex min-h-screen w-full bg-[#FFFCEB] font-['Inter']">
    
          {/* RIGHT SIDE: Main Content */}
          {/* 2. Added flex-1 and padding (px-10 pt-5 pb-12) so it looks clean */}
          <div className="flex-1 flex flex-col w-full font-['Inter']">
    
            {/* Header */}
            {/* Reduced mt-10 to mt-2 to match your other screens */}
            <div className="w-full flex flex-col items-center mt-2 mb-10">
              <h1 className="text-[#385E31] text-[30px] font-extrabold tracking-wide uppercase">
                Audit Logs
              </h1>
              {/* Added max-w-full here to prevent horizontal scrolling on small screens */}
              <div className="w-[900px] max-w-full h-1.5 bg-[#F7B71D] mt-1 rounded-full"></div>
            </div>

            <AuditLogs />
            
          </div>

    </div>
  );
}