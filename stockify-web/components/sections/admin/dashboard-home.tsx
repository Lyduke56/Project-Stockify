import React from 'react';

import StatCard from "@/components/cards/stat-cards";
import ShopStatus from "@/components/cards/admin/shop-status";

export default function DashboardHome() {
  return (
    <>
      <header className="mb-8 text-center">
        <h1 className="text-[#385E31] text-3xl font-bold font-['Inter'] uppercase tracking-widest">
          Admin Dashboard
        </h1>
        <div className="w-full h-1 bg-[#F7B71D] mt-2 rounded-full opacity-50" />
      </header>

      <div className="flex flex-col gap-6">
        <h2 className="text-[#385E31] text-4xl font-bold font-['Inter']">
          Hello, Client!
        </h2>
        <p className="text-stone-400 font-medium">Shop Name Corporation, Inc.</p>

        <div className="flex justify-center">
          <div className="justify-center align-center grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl">
          <StatCard 
           title="Active New Customers"
           value="58"
           trendText="↑ 12% from last month"
           svgName="SalesIcon"
           icon="📊"
           className = ""
          />
          <StatCard 
           title="Monthly Revenue"
           value="62.3k"
           trendText="↑ 5% from last month"
           svgName="CustomersIcon"
           icon="👥"
           className = ""
          />
          <StatCard 
           title="Total Orders"
           value="143"
           trendText="↓ 2% from last month"
           svgName="ProductsIcon" 
           icon="📦"
           className = ""
          />
          </div>
        </div>

        <div className="w-full h-[3px] bg-lime-900/50 rounded-full" />
        
        <ShopStatus
          shopName="Coffee Shop"
          clientName="Shop Name"
          itemCount={245}
          lowStockCount={12}
          revenue="$48.5K"
          orders={124}
          onManageShop={() => console.log("manage shop clicked")}
        />

      </div>
    </>
  );
}