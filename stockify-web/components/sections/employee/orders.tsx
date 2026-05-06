"use client";

import OrdersTable from "@/components/tables/order-table";

// Renamed from EmployeeOrders to OrdersSection to match your dashboard setup
export default function OrdersSection() {
  return (
    // REMOVED: h-screen, bg-[#FFFCEB], overflow-hidden, overflow-y-auto
    // The parent Dashboard layout now handles the scrolling and background
    <div className="w-full flex flex-col font-['Inter']">

      {/* Header */}
      <div className="w-full flex flex-col items-center mt-2 mb-10">
        <h1 className="text-[#385E31] text-[30px] font-extrabold tracking-wide uppercase">
          Orders
        </h1>
        {/* Added max-w-full to prevent horizontal scrolling on smaller screens */}
        <div className="w-[900px] max-w-full h-1.5 bg-[#F7B71D] mt-1 rounded-full"></div>
      </div>

      {/* Table Component */}
      <OrdersTable />

    </div>
  );
}