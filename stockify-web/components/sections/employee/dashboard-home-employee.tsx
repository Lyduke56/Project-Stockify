"use client";

import AlertsCard from "@/components/cards/employee/alerts-card";
import SalesForecastCard from "@/components/cards/employee/sales-forecast-card";
import StatCard from "@/components/cards/stat-cards";

// Renamed from EmployeeDashboard to DashboardSection to avoid import conflicts!
export default function DashboardSection() {
  return (
    // REMOVED: h-screen, h-full, overflow-y-auto, overflow-hidden, and the extra background color
    // This is now just a clean, flexible column that lets the parent handle the scrolling!
    <div className="w-full flex flex-col font-['Inter']">
      
        {/* Header */}
        <div className="w-full flex flex-col items-center mt-2 mb-10">
          <h1 className="text-[#385E31] text-[30px] font-extrabold tracking-wide uppercase">
            Employee Dashboard
          </h1>
          <div className="w-[900px] max-w-full h-1.5 bg-[#F7B71D] mt-1 rounded-full"></div>
        </div>

        {/* stat cards */}
        <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <StatCard title="Total Revenue" value="₱ 32k" trendText="Total revenue as of mm/yy" className="w-full" svgName="employee-icons/piggybank" />
            <StatCard title="Total Orders" value="395" trendText="Total revenue as of today" className="w-full" svgName="employee-icons/orders" />
            <StatCard title="Top Selling Product" value="124" trendText="Total revenue as of mm/yy" className="w-full" svgName="employee-icons/topseller" />
        </div>  
        

        {/* Bottom Contents */}
        <div className="w-full grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6 mt-8">
          <AlertsCard />
          <SalesForecastCard />
        </div>

    </div>
  );
}