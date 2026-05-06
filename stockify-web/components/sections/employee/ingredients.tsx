"use client";

import IngredientsTable from "@/components/tables/ingredients-table";

export default function IngredientsSection() {
  return (
    <div className="w-full flex flex-col font-['Inter']">
        {/* Header */}
        <div className="w-full flex flex-col items-center mt-2 mb-10">
          <h1 className="text-[#385E31] text-[30px] font-extrabold tracking-wide uppercase">
            Stock Inventory
          </h1>
          <div className="w-[900px] max-w-full h-1.5 bg-[#F7B71D] mt-1 rounded-full"></div>
        </div>
        
        {/* Table Component */}
        <IngredientsTable />
    </div>
  );
}