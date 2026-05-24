"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Package,
  Clock,
  CheckCircle2,
  XCircle,
  ChevronRight,
  Search,
  RefreshCcw,
  ShoppingBag,
  X,
  Receipt,
  Truck,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface OrderItem {
  item_name: string;
  quantity: number;
  unit_price: number;
  size_label: string | null;
}

interface Order {
  order_id: string;
  fulfillment_status: string;
  total_amount: number;
  created_at: string;
  payment_method: string;
  payment_status: string;
  cancel_reason?: string;
  deliverer_name?: string;
  delivery_id?: string;
  items: OrderItem[];
}

export default function CustomerOrdersPage() {
  const params = useParams();
  const router = useRouter();
  const businessName = params?.businessName as string;
  const supabase = createClient();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewOrderId, setViewOrderId] = useState<string | null>(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const viewOrder = urlParams.get("view_order");
    if (viewOrder) setViewOrderId(viewOrder);
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("orders")
      .select(
        `order_id, fulfillment_status, total_amount, created_at, payment_method,
         payment_status, cancel_reason, deliverer_name, delivery_id,
         order_items (item_name, quantity, unit_price, size_label)`
      )
      .eq("customer_id", user.id)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setOrders(
        data.map((o: any) => ({
          order_id: o.order_id,
          fulfillment_status: o.fulfillment_status,
          total_amount: Number(o.total_amount),
          created_at: o.created_at,
          payment_method: o.payment_method,
          payment_status: o.payment_status,
          cancel_reason: o.cancel_reason,
          deliverer_name: o.deliverer_name,
          delivery_id: o.delivery_id,
          items: o.order_items || [],
        }))
      );
    }
    setLoading(false);
  };

  useEffect(() => { fetchOrders(); }, []);

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "Pending":    return { color: "text-amber-700 bg-amber-50 border-amber-200",   icon: <Clock size={12} strokeWidth={2.5} /> };
      case "Processing": return { color: "text-blue-700 bg-blue-50 border-blue-200",      icon: <RefreshCcw size={12} className="animate-spin-slow" strokeWidth={2.5} /> };
      case "Dispatched": return { color: "text-violet-700 bg-violet-50 border-violet-200",icon: <Package size={12} strokeWidth={2.5} /> };
      case "Received":   return { color: "text-emerald-700 bg-emerald-50 border-emerald-200", icon: <CheckCircle2 size={12} strokeWidth={2.5} /> };
      case "Cancelled":  return { color: "text-red-700 bg-red-50 border-red-200",         icon: <XCircle size={12} strokeWidth={2.5} /> };
      default:           return { color: "text-gray-600 bg-gray-50 border-gray-200",      icon: <Clock size={12} strokeWidth={2.5} /> };
    }
  };

  const filteredOrders = orders.filter(
    (o) =>
      o.order_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.items.some((i) => i.item_name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const viewOrder = orders.find((o) => o.order_id === viewOrderId);

  return (
    <div className="min-h-screen bg-[#F4F0E0] font-['Inter'] text-[#1C3319] selection:bg-[#F7B71D]/30">
      <style>{`
        .subtle-scroll::-webkit-scrollbar { width: 5px; }
        .subtle-scroll::-webkit-scrollbar-track { background: transparent; }
        .subtle-scroll::-webkit-scrollbar-thumb { background: rgba(56,94,49,0.18); border-radius: 8px; }
        .subtle-scroll::-webkit-scrollbar-thumb:hover { background: rgba(56,94,49,0.35); }
        .subtle-scroll { scrollbar-width: thin; scrollbar-color: rgba(56,94,49,0.18) transparent; }
        .order-card { transition: box-shadow 0.22s ease, transform 0.22s ease; }
        .order-card:hover { box-shadow: 0 12px 36px rgba(28,51,25,0.12); transform: translateY(-3px); }
      `}</style>

      {/* ── Header — full width, 3-zone layout ── */}
      <header className="sticky top-0 z-40 bg-[#2E5128] shadow-[0_2px_20px_rgba(28,51,25,0.2)]">
        <div className="w-full px-10 py-3.5 flex items-center gap-4">

          {/* LEFT — back + title */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <button
              onClick={() => router.back()}
              className="p-2 rounded-xl bg-white/8 hover:bg-white/15 border border-white/12 text-white/80 hover:text-white transition-all"
            >
              <ArrowLeft size={18} strokeWidth={2.5} />
            </button>
            <div>
              <h1 className="text-[21px] font-black tracking-wide leading-tight text-[#F7B71D]">
                My Orders
              </h1>
              <p className="text-[11px] font-semibold text-white/50 leading-none mt-0.5 tracking-wide">
                Order history &amp; tracking
              </p>
            </div>
          </div>

          {/* CENTER — search bar, grows to fill middle */}
          <div className="flex-1 flex justify-center px-4">
            <div className="relative w-full max-w-md">
              <Search
                size={14}
                strokeWidth={2.5}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none"
              />
              <input
                type="text"
                placeholder="Search orders or items…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/10 border border-white/15 focus:border-[#F7B71D]/60 focus:bg-white/15 text-white placeholder:text-white/40 rounded-xl pl-9 pr-4 py-2.5 text-[13px] font-medium outline-none transition-all"
              />
            </div>
          </div>

          {/* RIGHT — spacer to balance left zone */}
          <div className="flex-shrink-0 w-[160px]" />
        </div>
      </header>

      <main className="w-full px-25 py-7">
        {/* Result count */}
        {!loading && filteredOrders.length > 0 && (
          <p className="text-[11.5px] font-black text-[#385E31]/50 uppercase tracking-widest mb-5 px-0.5">
            {filteredOrders.length} order{filteredOrders.length !== 1 ? "s" : ""}
            {searchQuery ? ` for "${searchQuery}"` : ""}
          </p>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-40 gap-5">
            <div className="relative">
              <div className="absolute inset-0 bg-[#F7B71D]/15 rounded-full blur-2xl animate-pulse" />
              <RefreshCcw size={34} className="text-[#F7B71D] animate-spin-slow relative z-10" strokeWidth={2} />
            </div>
            <p className="text-[#385E31]/55 font-semibold text-[15px] tracking-wide animate-pulse">
              Loading your orders…
            </p>
          </div>

        ) : filteredOrders.length > 0 ? (
          /* ── Responsive grid — 1 col mobile, 2 col md, 3 col xl ── */
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            <AnimatePresence>
              {filteredOrders.map((order, idx) => {
                const status = getStatusConfig(order.fulfillment_status);
                return (
                  <motion.div
                    key={order.order_id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05, type: "spring", stiffness: 320, damping: 26 }}
                    onClick={() => setViewOrderId(order.order_id)}
                    className="order-card bg-white rounded-2xl border border-[#2E5128]/8 cursor-pointer overflow-hidden shadow-[0_4px_16px_rgba(28,51,25,0.06)] flex flex-col"
                  >
                    {/* Card top — order ID + status */}
                    <div className="px-4 pt-4 pb-3 flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <Receipt size={11} className="text-[#385E31]/35" strokeWidth={2.5} />
                          <span className="text-[10px] font-black text-[#385E31]/45 uppercase tracking-[0.12em]">
                            #{order.order_id.slice(0, 8).toUpperCase()}
                          </span>
                        </div>
                        <span className="text-[12px] font-semibold text-[#1C3319]/60">
                          {new Date(order.created_at).toLocaleString("en-US", {
                            month: "short", day: "numeric", year: "numeric",
                          })}
                          {" · "}
                          {new Date(order.created_at).toLocaleString("en-US", {
                            hour: "numeric", minute: "2-digit", hour12: true,
                          })}
                        </span>
                      </div>
                      <span className={`flex-shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[11px] font-bold ${status.color}`}>
                        {status.icon}
                        {order.fulfillment_status}
                      </span>
                    </div>

                    {/* Dashed divider */}
                    <div className="mx-4 border-t border-dashed border-[#2E5128]/10" />

                    {/* Items list — flex-grow so footer always pins to bottom */}
                    <div className="px-4 py-3 flex flex-col gap-2 flex-grow">
                      {order.items.slice(0, 3).map((item, i) => (
                        <div key={i} className="flex items-center justify-between gap-2 text-[13px]">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="flex-shrink-0 w-6 h-6 bg-[#385E31]/8 rounded-md flex items-center justify-center font-black text-[10.5px] text-[#2E5128]">
                              {item.quantity}×
                            </span>
                            <div className="min-w-0">
                              <p className="font-semibold text-[#1C3319] truncate">{item.item_name}</p>
                              {item.size_label && (
                                <p className="text-[10.5px] text-[#385E31]/50 font-semibold">{item.size_label}</p>
                              )}
                            </div>
                          </div>
                          <span className="flex-shrink-0 font-bold text-[#1C3319] text-[12.5px]">
                            ₱{(item.unit_price * item.quantity).toFixed(2)}
                          </span>
                        </div>
                      ))}
                      {order.items.length > 3 && (
                        <p className="text-[11px] font-semibold text-[#385E31]/40 italic pl-8">
                          +{order.items.length - 3} more item{order.items.length - 3 !== 1 ? "s" : ""}
                        </p>
                      )}
                    </div>

                    {/* Card footer */}
                    <div className="border-t border-[#2E5128]/8 bg-[#2E5128]/[0.025] px-4 py-3 flex items-center justify-between mt-auto">
                      <div>
                        <p className="text-[9.5px] font-black text-[#385E31]/45 uppercase tracking-widest mb-0.5">Total</p>
                        <p className="text-[17px] font-black text-[#1C3319] leading-none">
                          ₱{order.total_amount.toFixed(2)}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11.5px] font-bold text-[#385E31]/50">
                        <span className="hidden sm:inline">Details</span>
                        <div className="w-7 h-7 rounded-full border border-[#2E5128]/15 bg-white flex items-center justify-center text-[#2E5128] shadow-sm">
                          <ChevronRight size={14} strokeWidth={2.5} />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-24 text-center gap-5 bg-white rounded-2xl border border-[#2E5128]/8 shadow-sm"
          >
            <div className="w-20 h-20 bg-[#F4F0E0] rounded-2xl flex items-center justify-center text-[#F7B71D] shadow-inner">
              <ShoppingBag size={34} strokeWidth={1.8} />
            </div>
            <div>
              <h3 className="text-xl font-black text-[#1C3319]">No orders found</h3>
              <p className="text-[#385E31]/55 font-medium mt-1.5 max-w-[240px] mx-auto text-[13.5px] leading-relaxed">
                {searchQuery ? "No orders match your search query." : "You haven't placed any orders yet."}
              </p>
            </div>
            <button
              onClick={() => {
                if (searchQuery) setSearchQuery("");
                else router.push(`/${businessName}/customer/food-and-beverage/storefront`);
              }}
              className="mt-1 bg-[#2E5128] text-[#F7B71D] px-7 py-3 rounded-xl font-black text-[13.5px] hover:bg-[#253F20] hover:-translate-y-0.5 hover:shadow-lg transition-all active:scale-95"
            >
              {searchQuery ? "Clear Search" : "Browse Menu"}
            </button>
          </motion.div>
        )}
      </main>

      {/* ── Order Detail Modal ── */}
      <AnimatePresence>
        {viewOrder && (
          <div
            className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-6 bg-[#0A1209]/50 backdrop-blur-sm"
            onClick={() => setViewOrderId(null)}
          >
            <motion.div
              initial={{ opacity: 0, y: 80 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 80 }}
              transition={{ type: "spring", stiffness: 380, damping: 32 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full md:max-w-[580px] bg-[#FDFAF0] rounded-t-[28px] md:rounded-[24px] shadow-2xl flex flex-col max-h-[92vh] md:max-h-[88vh] font-['Inter'] overflow-hidden border border-white/20"
            >
              {/* Mobile drag handle */}
              <div className="w-full flex justify-center pt-3.5 pb-1 md:hidden bg-[#2E5128]">
                <div className="w-10 h-1 bg-white/20 rounded-full" />
              </div>

              {/* Modal Header */}
              <div className="px-7 pb-6 pt-5 md:pt-7 bg-[#2E5128] text-white relative flex-shrink-0">
                <button
                  onClick={() => setViewOrderId(null)}
                  className="absolute top-5 right-5 p-2 bg-white/10 hover:bg-white/18 rounded-xl transition-colors border border-white/10"
                >
                  <X size={18} strokeWidth={2.5} />
                </button>
                <div className="pr-12">
                  <div className="flex items-center gap-2 mb-2 text-[#F7B71D]">
                    <Receipt size={14} strokeWidth={2.5} />
                    <span className="text-[11px] font-black uppercase tracking-[0.14em]">Order Details</span>
                  </div>
                  <h2 className="text-2xl font-black mb-1 tracking-wide">
                    #{viewOrder.order_id.slice(0, 8).toUpperCase()}
                  </h2>
                  <p className="text-white/55 font-semibold text-[13px]">
                    Placed on{" "}
                    {new Date(viewOrder.created_at).toLocaleString("en-US", {
                      month: "long", day: "numeric", year: "numeric",
                      hour: "numeric", minute: "2-digit", hour12: true,
                    })}
                  </p>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-6 md:p-7 overflow-y-auto subtle-scroll flex flex-col gap-5">

                {/* Status */}
                <div className="flex justify-between items-center bg-white px-5 py-4 rounded-xl border border-[#2E5128]/8 shadow-[0_2px_8px_rgba(28,51,25,0.05)]">
                  <div>
                    <p className="text-[10px] font-black text-[#385E31]/45 uppercase tracking-widest mb-1">Fulfillment Status</p>
                    <p className="font-bold text-[#1C3319] text-[14px]">Current Stage</p>
                  </div>
                  <span className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border font-bold text-[12.5px] ${getStatusConfig(viewOrder.fulfillment_status).color}`}>
                    {getStatusConfig(viewOrder.fulfillment_status).icon}
                    {viewOrder.fulfillment_status}
                  </span>
                </div>

                {/* Cancellation reason */}
                {viewOrder.fulfillment_status === "Cancelled" && viewOrder.cancel_reason && (
                  <div className="bg-red-50 px-5 py-4 rounded-xl border border-red-200 flex gap-3 items-start">
                    <XCircle className="text-red-500 mt-0.5 flex-shrink-0" size={17} strokeWidth={2.5} />
                    <div>
                      <p className="font-bold text-red-800 text-[13px] mb-1">Cancellation Reason</p>
                      <p className="text-red-600 text-[13px] font-medium leading-relaxed">{viewOrder.cancel_reason}</p>
                    </div>
                  </div>
                )}

                {/* Delivery info */}
                {viewOrder.deliverer_name && (
                  <div className="bg-white px-5 py-4 rounded-xl border border-[#2E5128]/8 shadow-[0_2px_8px_rgba(28,51,25,0.04)]">
                    <p className="text-[10px] font-black text-[#385E31]/45 uppercase tracking-widest mb-3">Delivery Information</p>
                    <div className="flex items-center gap-4">
                      <div className="w-11 h-11 rounded-xl bg-[#F7B71D]/15 text-[#C49115] flex items-center justify-center flex-shrink-0">
                        <Truck size={22} strokeWidth={1.8} />
                      </div>
                      <div>
                        <p className="font-bold text-[#1C3319] text-[15px]">{viewOrder.deliverer_name}</p>
                        {viewOrder.delivery_id && (
                          <p className="text-[12px] font-semibold text-[#385E31]/50 mt-0.5">ID: {viewOrder.delivery_id}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Order Summary */}
                <div className="bg-white rounded-xl border border-[#2E5128]/8 overflow-hidden shadow-[0_2px_8px_rgba(28,51,25,0.04)]">
                  <div className="bg-[#2E5128]/[0.04] px-5 py-3.5 border-b border-[#2E5128]/8">
                    <h3 className="font-black text-[#1C3319] text-[13px] uppercase tracking-wider">Order Summary</h3>
                  </div>
                  <div className="divide-y divide-[#2E5128]/6">
                    {viewOrder.items.map((item, i) => (
                      <div key={i} className="flex justify-between items-center px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <span className="w-8 h-8 bg-[#385E31]/8 rounded-lg flex items-center justify-center font-black text-[11.5px] text-[#2E5128] flex-shrink-0">
                            {item.quantity}×
                          </span>
                          <div>
                            <p className="font-semibold text-[#1C3319] text-[14px]">{item.item_name}</p>
                            {item.size_label && (
                              <p className="text-[11px] font-semibold text-[#385E31]/50 mt-0.5">Size: {item.size_label}</p>
                            )}
                          </div>
                        </div>
                        <span className="font-bold text-[#1C3319] text-[13.5px]">
                          ₱{(item.unit_price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Payment & Total */}
                <div className="grid grid-cols-2 gap-3.5 pb-2">
                  <div className="bg-white px-5 py-4 rounded-xl border border-[#2E5128]/8 shadow-[0_2px_8px_rgba(28,51,25,0.04)]">
                    <p className="text-[10px] font-black text-[#385E31]/45 uppercase tracking-widest mb-2">Payment Method</p>
                    <p className="font-bold text-[#1C3319] text-[14px] leading-snug">
                      {viewOrder.payment_method === "Cash-on-Delivery" ? "Cash on Delivery" : viewOrder.payment_method}
                    </p>
                  </div>
                  <div className="bg-[#2E5128] px-5 py-4 rounded-xl flex flex-col justify-center items-end shadow-[0_4px_16px_rgba(46,81,40,0.3)]">
                    <p className="text-[10px] font-black text-white/45 uppercase tracking-widest mb-1">Total Paid</p>
                    <p className="text-2xl font-black text-[#F7B71D] leading-none tracking-tight">
                      ₱{viewOrder.total_amount.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}