"use client";

import React from "react";
import { 
  Activity,
  TrendingUp,
  ShoppingBag,
  AlertTriangle,
  Box,
  ArrowUpRight,
  Sparkles,
  BarChart3
} from "lucide-react";

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

  const MetricRow = ({
    icon: Icon,
    label,
    value,
    valueClass = "text-[#3A6131]",
    badge,
  }: {
    icon: React.ElementType;
    label: string;
    value: React.ReactNode;
    valueClass?: string;
    badge?: React.ReactNode;
  }) => (
    <div className="flex items-center justify-between py-3 border-b border-[#3A6131] last:border-0">
      <div className="flex items-center gap-3 text-[#3A6131]/60">
        <div className="w-8 h-8 rounded-[6px] bg-[#3A6131]/10 flex items-center justify-center">
          <Icon size={16} className="text-[#3A6131]" />
        </div>
        <span className="text-sm font-medium font-['Inter']">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        {badge}
        <span className={`text-sm font-bold font-['Inter'] ${valueClass}`}>{value}</span>
      </div>
    </div>
  );

  return (
    <div className="w-full rounded-[10px] overflow-hidden shadow-md">

      {/* Header band */}
      <div className="bg-[#3A6131] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-[8px] bg-[#FFFCEB]/15 flex items-center justify-center">
            <Activity size={18} className="text-[#FFFCEB]" />
          </div>
          <div>
            <h2 className="text-[#FFFCEB] font-bold text-[18px] leading-tight font-['Inter']">Shop Status</h2>
            <p className="text-[#FFFCEB]/60 text-xs mt-0.5 font-['Inter']">Real-time inventory & admin overview</p>
          </div>
        </div>
        <button
          onClick={onManageShop}
          className="flex items-center gap-1.5 bg-[#FFFCEB]/15 hover:bg-[#FFFCEB]/25 text-[#FFFCEB] text-sm font-semibold font-['Inter'] px-4 py-2 rounded-[8px] transition-colors"
        >
          Manage Shop
          <ArrowUpRight size={15} />
        </button>
      </div>

      {/* 3-panel body */}
      <div className="bg-[#FFFCEB] p-6 grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Panel 1: Shop Identity */}
        <div className="lg:col-span-1 bg-[#F5F0D8] rounded-[10px] p-5 flex flex-col justify-between border border-[#3A6131]/10">
          <div>
            <div className="w-11 h-11 rounded-[8px] bg-[#3A6131] flex items-center justify-center mb-4">
              <ShoppingBag size={22} className="text-[#FFFCEB]" />
            </div>
            <h3 className="text-lg font-bold text-[#3A6131] leading-tight font-['Inter']">
              {clientName}
            </h3>
            <p className="text-[#3A6131]/50 text-sm mt-1 font-['Inter']">{shopName}</p>
          </div>
          <div className="mt-5 flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
            <span className="text-emerald-600 text-xs font-semibold tracking-wide uppercase font-['Inter']">
              Live & Active
            </span>
          </div>
        </div>

        {/* Panel 2: Key Metrics */}
        <div className="lg:col-span-1 flex flex-col justify-between bg-[#F5F0D8] rounded-[10px] border border-[#3A6131]/10 px-5 py-2">
          <MetricRow
            icon={Box}
            label="Total Items"
            value={itemCount}
          />
          <MetricRow
            icon={AlertTriangle}
            label="Low Stock Items"
            value={lowStockCount}
            valueClass={lowStockCount > 0 ? "text-orange-600" : "text-[#3A6131]"}
            badge={
              lowStockCount > 0 ? (
                <span className="text-[10px] font-bold bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full font-['Inter']">
                  Restock
                </span>
              ) : undefined
            }
          />
          <MetricRow
            icon={BarChart3}
            label="Total Orders"
            value={orders}
          />
        </div>

        {/* Panel 3: Revenue */}
        <div className="lg:col-span-1 bg-[#3A6131] rounded-[10px] p-5 flex flex-col justify-between shadow-md">
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-[8px] bg-[#FFFCEB]/15 flex items-center justify-center">
              <TrendingUp size={18} className="text-[#FFFCEB]" />
            </div>
            <div className="flex items-center gap-1.5 bg-[#FFFCEB]/15 rounded-full px-3 py-1">
              <Sparkles size={11} className="text-[#FFFCEB]/80" />
              <span className="text-[#FFFCEB]/80 text-[11px] font-semibold font-['Inter']">Revenue</span>
            </div>
          </div>
          <div>
            <p className="text-[#FFFCEB]/60 text-xs font-semibold uppercase tracking-wider mb-1 font-['Inter']">
              Total Revenue
            </p>
            <p className="text-[#FFFCEB] text-4xl font-black tracking-tight leading-none font-['Inter']">
              {revenue}
            </p>
            <p className="text-[#FFFCEB]/50 text-xs mt-2 font-['Inter']">
              Cumulative shop earnings
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}