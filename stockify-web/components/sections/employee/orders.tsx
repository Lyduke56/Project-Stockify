"use client";

import OrdersTable from "@/components/tables/order-table";

export default function OrdersSection() {
  return (
    <div className="w-full flex flex-col font-['Inter'] pb-30">

      {/* Header */}
      <div className="w-full flex flex-col items-center mt-2 mb-10">
        <h1 className="text-[#385E31] text-[30px] font-extrabold tracking-wide uppercase">
          Orders
        </h1>
        <div className="w-[900px] max-w-full h-1.5 bg-[#F7B71D] mt-1 rounded-full"></div>
      </div>

      {/* Table Component */}
      <OrdersTable />

    </div>
  );
}