"use client";

import React from "react";
import StockifyButton from "@/components/buttons/button-get-started";

interface ShopStatusProps {
  shopName?: string;
  clientName?: string;
  itemCount?: number;
  lowStockCount?: number;
  revenue?: string;
  orders?: number;
  onManageShop?: () => void;
}

export default function ShopStatus({
  shopName = "Coffee Shop",
  clientName = "Shop Name",
  itemCount = 245,
  lowStockCount = 12,
  revenue = "$48.5K",
  orders = 124,
  onManageShop,
}: ShopStatusProps) {
  return (
    <div className="w-full px-5 py-5 rounded-xl border-[3px] border-lime-900/50 flex flex-col gap-4">
      
      {/* Header */}
      <p className="text-lime-800 text-base font-medium font-['Inter']">Shop Status</p>
      <p className="text-gray-500 text-sm font-normal font-['Inter']">Overview of your shop status</p>

      {/* Row */}
      <div className="flex items-center justify-between">

        {/* LEFT: Shop identity */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            {/* Shop icon */}
            <img src="/icon-storefront.svg" alt="shop" className="w-4 h-4" />
            <span className="text-lime-800 text-sm font-semibold font-['Inter']">{clientName}</span>
            <span className="px-1.5 py-0.5 rounded-md border border-lime-800/30 text-neutral-950 text-[10px] font-medium font-['Inter']">
              {shopName}
            </span>
          </div>
          <div className="flex items-center gap-3 pl-0.5">
            {/* Item count */}
            <div className="flex items-center gap-1">
              <img src="/icon-store-settings.svg" alt="items" className="w-3.5 h-3.5 opacity-70" />
              <span className="text-lime-800/70 text-xs font-['Inter']">{itemCount} items</span>
            </div>
            {/* Low stock warning */}
            <div className="flex items-center gap-1">
              <span className="text-orange-600 text-xs font-['Inter']">⚠ {lowStockCount} low stock</span>
            </div>
          </div>
        </div>

        {/* RIGHT: Stats + button */}
        <div className="flex items-center gap-6">
          <div className="flex flex-col items-center">
            <span className="text-lime-800 text-xl font-bold font-['Inter']">{revenue}</span>
            <span className="text-lime-800/50 text-[10px] font-['Inter']">Revenue</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-lime-800 text-xl font-bold font-['Inter']">{orders}</span>
            <span className="text-lime-800/50 text-[10px] font-['Inter']">Orders</span>
          </div>
          <StockifyButton
            label="Manage Shop"
            onClick={onManageShop}
            variant="primary"
            className="!w-auto !h-auto px-6 py-1.5 !text-xs !rounded-xl !shadow-sm"
          />
        </div>

      </div>
    </div>
  );
}