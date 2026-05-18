"use client";

import Transactions from "@/components/tables/transactions-table";

export default function EmployeeTransactions() {
  return (
    // 1. Changed h-screen to min-h-screen and removed overflow-hidden.
    // This allows the background color to stretch downward indefinitely.
    <div className="flex min-h-screen w-full bg-[#FFFCEB] font-['Inter']">
    
          {/* RIGHT SIDE: Main Content */}
          {/* 2. Removed h-full and overflow-y-auto to stop trapping the scrollbar.
              Changed px-20 to px-10 to match your other updated screens. */}
          <div className="flex-1 flex flex-col w-full font-['Inter']">
            
            {/* Header */}
            <div className="w-full flex flex-col items-center mt-2 mb-10">
              <h1 className="text-primary text-[30px] font-extrabold tracking-wide uppercase">
                Transactions
              </h1>
              <div className="w-[900px] max-w-full h-1.5 bg-accent mt-1 rounded-full"></div>
            </div>

            <Transactions />
            
          </div>

    </div>
  );
}