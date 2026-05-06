"use client";

import InventoryTable from "@/components/tables/inventory-table";

// Renamed from EmployeeInventory to InventorySection to match your parent file!
export default function ProductsSection() {
  return (
    // REMOVED: h-screen, bg-[#FFFCEB], overflow-y-auto, and all the extra padding
    // This is now a clean, flexible container that sits perfectly inside your main layout.
    <div className="w-full flex flex-col font-['Inter']">
    
        {/* Header */}
        <div className="w-full flex flex-col items-center mt-2 mb-10">
          <h1 className="text-[#385E31] text-[30px] font-extrabold tracking-wide uppercase">
            Products Inventory
          </h1>
          {/* Added max-w-full here just to ensure it doesn't break on smaller screens */}
          <div className="w-[900px] max-w-full h-1.5 bg-[#F7B71D] mt-1 rounded-full"></div>
        </div>
        
        {/* Table Component */}
        <InventoryTable />
        
    </div>
  );
}