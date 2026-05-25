"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Loader2, AlertCircle, CheckCircle2,
  Package, Clock, Truck, Ban, RefreshCw
} from "lucide-react";
import {
  fetchOrders,
  type Order,
  type FulfillmentStatus,
} from "@/lib/employee/order-actions";
import { createClient } from "@/lib/supabase/client";
import ViewOrderModal from "./orders-modals/view-modal";
import { type StorefrontConfig } from "@/lib/admin/storefront-actions";

const TABS: FulfillmentStatus[] = ["Pending", "Processing", "Dispatched", "Received", "Reported", "Cancelled"];
const COLUMNS = ["ORDER ID", "DATE / TIME", "CUSTOMER", "TOTAL AMOUNT", "PAYMENT METHOD", "ACTIONS"];

const TAB_META: Record<FulfillmentStatus, { bg: string; text: string; badge: string; icon: React.ReactNode }> = {
  Pending:    { bg: "bg-accent",       text: "text-primary", badge: "bg-accent/20 text-[#8a6700]",      icon: <Clock size={12} />       },
  Processing: { bg: "bg-blue-500",     text: "text-white",   badge: "bg-blue-100 text-blue-700",         icon: <Package size={12} />     },
  Dispatched: { bg: "bg-purple-500",   text: "text-white",   badge: "bg-purple-100 text-purple-700",     icon: <Truck size={12} />       },
  Received:   { bg: "bg-primary",      text: "text-accent",  badge: "bg-primary/10 text-primary",        icon: <CheckCircle2 size={12} /> },
  Reported:   { bg: "bg-orange-500",   text: "text-white",   badge: "bg-orange-50 text-orange-600",      icon: <AlertCircle size={12} /> },
  Cancelled:  { bg: "bg-red-500",      text: "text-white",   badge: "bg-red-50 text-red-600",            icon: <Ban size={12} />         },
};

interface OrdersTableProps {
  onLoadComplete?: () => void;
  colors?: StorefrontConfig;
}

export default function OrdersTable({ onLoadComplete, colors }: OrdersTableProps) {
  const [tenantId,   setTenantId]   = useState("");
  const [orders,     setOrders]     = useState<Order[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [activeTab,  setActiveTab]  = useState<FulfillmentStatus>("Pending");
  const [search,     setSearch]     = useState("");
  const [viewOrder,  setViewOrder]  = useState<Order | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadOrders = useCallback(async (tid: string) => {
    const data = await fetchOrders(tid);
    setOrders(data);
    setLoading(false);
    setRefreshing(false);
    onLoadComplete?.();
  }, [onLoadComplete]);

  useEffect(() => {
    const init = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: u } = await supabase
        .from("users")
        .select("tenant_id")
        .eq("user_id", user.id)
        .single();
      if (!u?.tenant_id) return;
      setTenantId(u.tenant_id);
      loadOrders(u.tenant_id);
    };
    init();
  }, [loadOrders]);

  const handleRefresh = () => {
    if (!tenantId) return;
    setRefreshing(true);
    loadOrders(tenantId);
  };

  const filtered = orders.filter((o) => {
    if (o.fulfillment_status !== activeTab) return false;
    const q = search.toLowerCase();
    return (
      o.order_id.toLowerCase().includes(q) ||
      o.customer_name.toLowerCase().includes(q)
    );
  });

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return (
      d.toLocaleDateString("en-PH", { month: "short", day: "numeric" }) +
      " " +
      d.toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" })
    );
  };

  const tabCounts = TABS.reduce((acc, t) => {
    acc[t] = orders.filter((o) => o.fulfillment_status === t).length;
    return acc;
  }, {} as Record<FulfillmentStatus, number>);

  const activeIdx = TABS.indexOf(activeTab);

  return (
    <div className="w-full flex flex-col font-['Inter']">

      {/* Sliding Tab Navigation */}
      <div className="w-full flex justify-center mb-8">
        <div className="relative flex w-full h-[45px] items-center my-2">
          <div className="absolute inset-0 border-2 border-primary rounded-[8px] pointer-events-none" />
          <div
            className={`absolute top-[-2px] bottom-[-2px] rounded-[8px] transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] z-10 ${TAB_META[activeTab].bg}`}
            style={{
              width: `calc(${100 / TABS.length}% + 4px)`,
              left:  `calc(${(activeIdx * 100) / TABS.length}% - 2px)`,
            }}
          />
          {TABS.map((tab) => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 h-full z-20 text-center font-bold text-[16px] transition-colors duration-300 cursor-pointer ${
                  isActive ? TAB_META[tab].text : "text-primary"
                }`}
              >
                <span className="relative">
                  {tab}
                  {tabCounts[tab] > 0 && (
                    <span className={`ml-1.5 text-[11px] font-black px-1.5 py-0.5 rounded-full ${
                      isActive ? "bg-white/25" : "bg-primary/10"
                    }`}>
                      {tabCounts[tab]}
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Toolbar */}
      <div className="w-full flex flex-col lg:flex-row justify-between items-center mb-4 gap-4">
        <div className="flex w-full lg:w-auto flex-1 gap-4 items-center">
          <div className="relative flex-1 max-w-[400px]">
            <input
              type="text"
              placeholder="Search by order ID or customer…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border border-primary rounded-full px-5 py-2.5 bg-transparent text-primary placeholder-primary/70 outline-none font-medium text-[13px]"
            />
            <div className="absolute right-4 top-3 text-primary"><Search size={16} /></div>
          </div>
        </div>
        <div className="flex items-center gap-3 w-full lg:w-auto justify-end">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2.5 rounded-full border border-primary text-primary hover:bg-primary/10 transition-all disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
          </button>
          <div className="text-primary font-bold text-sm border border-primary/30 px-4 py-2 rounded-full">
            {filtered.length} Orders
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="w-full bg-background rounded-[10px] border border-primary flex flex-col overflow-hidden shadow-sm">
        <div className="w-full flex bg-primary px-4 py-3 rounded-t-[8px]">
          {COLUMNS.map((col) => (
            <div key={col} className="flex-1 text-center text-[#FFFCEB] text-[12px] font-bold">{col}</div>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-primary/40 gap-3">
            <Package size={40} strokeWidth={1} />
            <p className="font-medium text-[14px]">
              No {activeTab.toLowerCase()} orders{search ? ` matching "${search}"` : ""}.
            </p>
          </div>
        ) : (
          <AnimatePresence>
            {filtered.map((order, idx) => {
              const isLast = idx === filtered.length - 1;
              const m = TAB_META[order.fulfillment_status] || TAB_META.Pending;
              return (
                <motion.div
                  key={order.order_id || `order-${idx}`}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.18 }}
                  className={`w-full flex px-4 py-[14px] items-center hover:bg-primary/3 transition-colors ${
                    !isLast ? "border-b border-primary/10" : ""
                  }`}
                >
                  <div className="flex-1 text-center">
                    <button
                      onClick={() => setViewOrder(order)}
                      className="text-primary text-[13px] font-black font-mono hover:text-accent hover:underline transition-colors"
                    >
                      {order.order_id.slice(0, 8).toUpperCase()}
                    </button>
                  </div>
                  <div className="flex-1 text-center text-primary/70 text-[13px] font-medium">
                    {formatDate(order.created_at)}
                  </div>
                  <div className="flex-1 text-center text-primary text-[13px] font-bold truncate px-1">
                    {order.customer_name}
                  </div>
                  <div className="flex-1 text-center text-primary text-[13px] font-black">
                    ₱{order.total_amount.toFixed(2)}
                  </div>
                  <div className="flex-1 flex justify-center">
                    <span className="text-[12px] font-bold bg-primary/8 text-primary px-2.5 py-1 rounded-full">
                      {order.payment_method === "QR Code"
                        ? "QR Code"
                        : order.payment_method === "Cash-on-Delivery"
                        ? "Cash on Delivery"
                        : order.payment_method}
                    </span>
                  </div>
                  <div className="flex-1 flex justify-center">
                    <button
                      onClick={() => setViewOrder(order)}
                      className={`px-4 py-1.5 rounded-full text-[11px] font-bold transition-all hover:opacity-90 ${m.bg} ${m.text}`}
                    >
                      Manage
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>

      {/* Order Detail Modal */}
      <AnimatePresence>
        {viewOrder && (
          <ViewOrderModal
            order={viewOrder}
            onClose={() => setViewOrder(null)}
            onStatusChange={() => tenantId && loadOrders(tenantId)}
            colors={colors}
          />
        )}
      </AnimatePresence>
    </div>
  );
}