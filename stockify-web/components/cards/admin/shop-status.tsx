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
  colors?: {
    primary?: string;
    background?: string;
  };
}

export default function ShopStatus({
  shopName = "Coffee Shop",
  clientName = "Shop Name",
  itemCount = 245,
  lowStockCount = 12,
  revenue = "$48.5K",
  orders = 124,
  onManageShop,
  colors,
}: ShopStatusProps) {
  const primary = colors?.primary ?? "#3A6131";
  const bg = colors?.background ?? "#FFFCEB";

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
  }) => {
    const valColor = valueClass === "text-[#3A6131]" ? undefined : valueClass;
    return (
      <div 
        className="flex items-center justify-between py-3 last:border-0"
        style={{ borderBottom: `1px solid ${primary}26` }}
      >
        <div className="flex items-center gap-3" style={{ color: `${primary}99` }}>
          <div className="w-8 h-8 rounded-[6px] flex items-center justify-center" style={{ backgroundColor: `${primary}1A` }}>
            <Icon size={16} style={{ color: primary }} />
          </div>
          <span className="text-sm font-medium font-['Inter']">{label}</span>
        </div>
        <div className="flex items-center gap-2">
          {badge}
          <span 
            className={`text-sm font-bold font-['Inter'] ${valColor ? valueClass : ""}`}
            style={!valColor ? { color: primary } : {}}
          >
            {value}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full rounded-[10px] overflow-hidden shadow-md">

      {/* Header band */}
      <div className="px-6 py-4 flex items-center justify-between" style={{ backgroundColor: primary }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-[8px] flex items-center justify-center" style={{ backgroundColor: `${bg}26` }}>
            <Activity size={18} style={{ color: bg }} />
          </div>
          <div>
            <h2 className="font-bold text-[18px] leading-tight font-['Inter']" style={{ color: bg }}>Shop Status</h2>
            <p className="text-xs mt-0.5 font-['Inter']" style={{ color: `${bg}99` }}>Real-time inventory & admin overview</p>
          </div>
        </div>
        <button
          onClick={onManageShop}
          className="flex items-center gap-1.5 text-sm font-semibold font-['Inter'] px-4 py-2 rounded-[8px] transition-colors hover:brightness-110"
          style={{ backgroundColor: `${bg}26`, color: bg }}
        >
          Manage Shop
          <ArrowUpRight size={15} />
        </button>
      </div>

      {/* 3-panel body */}
      <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-5" style={{ backgroundColor: bg }}>

        {/* Panel 1: Shop Identity */}
        <div 
          className="lg:col-span-1 rounded-[10px] p-5 flex flex-col justify-between border"
          style={{ backgroundColor: `${primary}0D`, borderColor: `${primary}1A` }}
        >
          <div>
            <div className="w-11 h-11 rounded-[8px] flex items-center justify-center mb-4" style={{ backgroundColor: primary }}>
              <ShoppingBag size={22} style={{ color: bg }} />
            </div>
            <h3 className="text-lg font-bold leading-tight font-['Inter']" style={{ color: primary }}>
              {clientName}
            </h3>
            <p className="text-sm mt-1 font-['Inter']" style={{ color: `${primary}80` }}>{shopName}</p>
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
        <div 
          className="lg:col-span-1 flex flex-col justify-between rounded-[10px] border px-5 py-2"
          style={{ backgroundColor: `${primary}0D`, borderColor: `${primary}1A` }}
        >
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
        <div className="lg:col-span-1 rounded-[10px] p-5 flex flex-col justify-between shadow-md" style={{ backgroundColor: primary }}>
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-[8px] flex items-center justify-center" style={{ backgroundColor: `${bg}26` }}>
              <TrendingUp size={18} style={{ color: bg }} />
            </div>
            <div className="flex items-center gap-1.5 rounded-full px-3 py-1" style={{ backgroundColor: `${bg}26` }}>
              <Sparkles size={11} style={{ color: `${bg}CC` }} />
              <span className="text-[11px] font-semibold font-['Inter']" style={{ color: `${bg}CC` }}>Revenue</span>
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider mb-1 font-['Inter']" style={{ color: `${bg}99` }}>
              Total Revenue
            </p>
            <p className="text-4xl font-black tracking-tight leading-none font-['Inter']" style={{ color: bg }}>
              {revenue}
            </p>
            <p className="text-xs mt-2 font-['Inter']" style={{ color: `${bg}80` }}>
              Cumulative shop earnings
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}