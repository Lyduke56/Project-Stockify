"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
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
import { getStorefrontTenant } from "@/backend/hooks/getStoreFront";
import { fetchStorefrontConfig } from "@/lib/admin/storefront-actions";
import { CustomerHeader } from "@/components/headers/customer-header";
import LoadingScreen from "@/app/loading-screen/loading";

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
  const [sfConfig, setSfConfig] = useState<any>(null);
  const [tenant, setTenant] = useState<any>(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const viewOrder = urlParams.get("view_order");
    if (viewOrder) setViewOrderId(viewOrder);
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Fetch sfConfig on first load
    if (!sfConfig) {
      const tenantData = await getStorefrontTenant(user.id);
      if (tenantData) {
        setTenant(tenantData);
        const sf = await fetchStorefrontConfig(tenantData.tenant_id);
        setSfConfig(sf);
      }
    }

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
      case "Received":   return { className: "", style: { color: c.primary, backgroundColor: c.primary + "14", borderColor: c.primary + "26" }, icon: <CheckCircle2 size={12} strokeWidth={2.5} /> };
      case "Cancelled":  return { className: "text-red-700 bg-red-50 border-red-200",         icon: <XCircle size={12} strokeWidth={2.5} /> };
      default:           return { className: "text-gray-600 bg-gray-50 border-gray-200",      icon: <Clock size={12} strokeWidth={2.5} /> };
    }
  };

  const filteredOrders = orders.filter(
    (o) =>
      o.order_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.items.some((i) => i.item_name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const viewOrder = orders.find((o) => o.order_id === viewOrderId);

  const c = {
    primary:   sfConfig?.color_primary   ?? "#2E5128",
    secondary: sfConfig?.color_secondary ?? "#2A4725",
    accent:    sfConfig?.color_accent    ?? "#F7B71D",
    bg:        sfConfig?.color_background ?? "#F4F0E0",
    text:      sfConfig?.color_text      ?? "#1C3319",
  };

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen font-['Inter'] selection:bg-yellow-200" style={{ backgroundColor: c.bg, color: c.text }}>
      <style>{`
        .subtle-scroll::-webkit-scrollbar { width: 5px; }
        .subtle-scroll::-webkit-scrollbar-track { background: transparent; }
        .subtle-scroll::-webkit-scrollbar-thumb { background: rgba(56,94,49,0.18); border-radius: 8px; }
        .subtle-scroll::-webkit-scrollbar-thumb:hover { background: rgba(56,94,49,0.35); }
        .subtle-scroll { scrollbar-width: thin; scrollbar-color: rgba(56,94,49,0.18) transparent; }
        .order-card { transition: box-shadow 0.22s ease, transform 0.22s ease; }
        .order-card:hover { box-shadow: 0 12px 36px rgba(28,51,25,0.12); transform: translateY(-3px); }
      `}</style>

      <CustomerHeader
        businessName={businessName}
        tenantLogo={tenant?.logo_url ?? undefined}
        tenantName={tenant?.business_name}
        showSearch={false}
        showCart={false}
        colors={c}
      />

      {/* ── Sub-header with search ── */}
      <div className="sticky top-[72px] z-40 shadow-sm" style={{ backgroundColor: c.primary }}>
        <div className="w-full px-6 sm:px-10 py-3.5 flex items-center gap-4">
          <div>
            <h1 className="text-[21px] font-black tracking-wide leading-tight" style={{ color: c.accent }}>My Orders</h1>
            <p className="text-[11px] font-semibold leading-none mt-0.5 tracking-wide" style={{ color: "rgba(255,255,255,0.5)" }}>Order history &amp; tracking</p>
          </div>
          <div className="flex-1 flex justify-center px-4">
            <div className="relative w-full max-w-md">
              <Search size={14} strokeWidth={2.5} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "rgba(255,255,255,0.4)" }} />
              <input
                type="text"
                placeholder="Search orders or items…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full border rounded-xl pl-9 pr-4 py-2.5 text-[13px] font-medium outline-none transition-all"
                style={{ backgroundColor: "rgba(255,255,255,0.1)", borderColor: "rgba(255,255,255,0.15)", color: "white" }}
                onFocus={e => { e.currentTarget.style.borderColor = c.accent + "99"; e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.15)"; }}
                onBlur={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)"; e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.1)"; }}
              />
            </div>
          </div>
          <div className="flex-shrink-0 w-[100px]" />
        </div>
      </div>

      <main className="w-full px-25 py-7">
        {/* Result count */}
        {filteredOrders.length > 0 && (
          <p className="text-[11.5px] font-black text-[#385E31]/50 uppercase tracking-widest mb-5 px-0.5">
            {filteredOrders.length} order{filteredOrders.length !== 1 ? "s" : ""}
            {searchQuery ? ` for "${searchQuery}"` : ""}
          </p>
        )}

        {filteredOrders.length > 0 ? (
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
                    className="order-card rounded-2xl border cursor-pointer overflow-hidden shadow-[0_4px_16px_rgba(28,51,25,0.06)] flex flex-col"
                    style={{ backgroundColor: c.bg, borderColor: c.primary + "14" }}
                  >
                    {/* Card top — order ID + status */}
                    <div className="px-4 pt-4 pb-3 flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <Receipt size={11} style={{ color: c.secondary + "59" }} strokeWidth={2.5} />
                          <span className="text-[10px] font-black uppercase tracking-[0.12em]" style={{ color: c.secondary + "73" }}>
                            #{order.order_id.slice(0, 8).toUpperCase()}
                          </span>
                        </div>
                        <span className="text-[12px] font-semibold" style={{ color: c.secondary + "99" }}>
                          {new Date(order.created_at).toLocaleString("en-US", {
                            month: "short", day: "numeric", year: "numeric",
                          })}
                          {" · "}
                          {new Date(order.created_at).toLocaleString("en-US", {
                            hour: "numeric", minute: "2-digit", hour12: true,
                          })}
                        </span>
                      </div>
                      <span 
                        className={`flex-shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[11px] font-bold ${status.className || ""}`}
                        style={status.style}
                      >
                        {status.icon}
                        {order.fulfillment_status}
                      </span>
                    </div>

                    {/* Dashed divider */}
                    <div className="mx-4 border-t border-dashed" style={{ borderColor: c.secondary + "1A" }} />

                    {/* Items list — flex-grow so footer always pins to bottom */}
                    <div className="px-4 py-3 flex flex-col gap-2 flex-grow">
                      {order.items.slice(0, 3).map((item, i) => (
                        <div key={i} className="flex items-center justify-between gap-2 text-[13px]">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="flex-shrink-0 w-6 h-6 rounded-md flex items-center justify-center font-black text-[10.5px]" style={{ backgroundColor: c.primary + "14", color: c.primary }}>
                              {item.quantity}×
                            </span>
                            <div className="min-w-0">
                              <p className="font-semibold truncate" style={{ color: c.text }}>{item.item_name}</p>
                              {item.size_label && (
                                <p className="text-[10.5px] font-semibold" style={{ color: c.secondary + "80" }}>{item.size_label}</p>
                              )}
                            </div>
                          </div>
                          <span className="flex-shrink-0 font-bold text-[12.5px]" style={{ color: c.text }}>
                            ₱{(item.unit_price * item.quantity).toFixed(2)}
                          </span>
                        </div>
                      ))}
                      {order.items.length > 3 && (
                        <p className="text-[11px] font-semibold italic pl-8" style={{ color: c.secondary + "66" }}>
                          +{order.items.length - 3} more item{order.items.length - 3 !== 1 ? "s" : ""}
                        </p>
                      )}
                    </div>

                    {/* Card footer */}
                    <div className="border-t px-4 py-3 flex items-center justify-between mt-auto" style={{ borderTopColor: c.secondary + "14", backgroundColor: c.secondary + "08" }}>
                      <div>
                        <p className="text-[9.5px] font-black uppercase tracking-widest mb-0.5" style={{ color: c.secondary + "73" }}>Total</p>
                        <p className="text-[17px] font-black leading-none" style={{ color: c.text }}>
                          ₱{order.total_amount.toFixed(2)}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11.5px] font-bold" style={{ color: c.secondary + "80" }}>
                        <span className="hidden sm:inline">Details</span>
                        <div className="w-7 h-7 rounded-full border flex items-center justify-center shadow-sm" style={{ borderColor: c.secondary + "26", backgroundColor: c.bg, color: c.secondary }}>
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
            className="flex flex-col items-center justify-center py-24 text-center gap-5 rounded-2xl border shadow-sm"
            style={{ backgroundColor: c.bg + "CC", borderColor: c.primary + "14" }}
          >
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center shadow-inner" style={{ backgroundColor: c.bg, color: c.accent }}>
              <ShoppingBag size={34} strokeWidth={1.8} />
            </div>
            <div>
              <h3 className="text-xl font-black" style={{ color: c.text }}>No orders found</h3>
              <p className="font-medium mt-1.5 max-w-[240px] mx-auto text-[13.5px] leading-relaxed" style={{ color: c.primary + "8C" }}>
                {searchQuery ? "No orders match your search query." : "You haven't placed any orders yet."}
              </p>
            </div>
            <button
              onClick={() => {
                if (searchQuery) setSearchQuery("");
                else router.push(`/${businessName}/customer/food-and-beverage/storefront`);
              }}
              className="mt-1 px-7 py-3 rounded-xl font-black text-[13.5px] hover:-translate-y-0.5 hover:shadow-lg transition-all active:scale-95"
              style={{ backgroundColor: c.primary, color: c.accent }}
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
              className="w-full md:max-w-[580px] rounded-t-[28px] md:rounded-[24px] shadow-2xl flex flex-col max-h-[92vh] md:max-h-[88vh] font-['Inter'] overflow-hidden border border-white/20"
              style={{ backgroundColor: c.bg }}
            >
              <div className="w-full flex justify-center pt-3.5 pb-1 md:hidden" style={{ backgroundColor: c.primary }}>
                <div className="w-10 h-1 rounded-full" style={{ backgroundColor: "rgba(255,255,255,0.2)" }} />
              </div>

              {/* Modal Header */}
              <div className="px-7 pb-6 pt-5 md:pt-7 text-white relative flex-shrink-0" style={{ backgroundColor: c.primary }}>
                <button
                  onClick={() => setViewOrderId(null)}
                  className="absolute top-5 right-5 p-2 bg-white/10 hover:bg-white/18 rounded-xl transition-colors border border-white/10"
                >
                  <X size={18} strokeWidth={2.5} />
                </button>
                <div className="pr-12">
                  <div className="flex items-center gap-2 mb-2" style={{ color: c.accent }}>
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
                <div className="flex justify-between items-center rounded-xl border px-5 py-4 shadow-[0_2px_8px_rgba(28,51,25,0.05)]" style={{ backgroundColor: c.bg, borderColor: c.primary + "14" }}>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ color: c.primary + "73" }}>Fulfillment Status</p>
                    <p className="font-bold text-[14px]" style={{ color: c.text }}>Current Stage</p>
                  </div>
                  {(() => {
                    const detailStatus = getStatusConfig(viewOrder.fulfillment_status);
                    return (
                      <span 
                        className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border font-bold text-[12.5px] ${detailStatus.className || ""}`}
                        style={detailStatus.style}
                      >
                        {detailStatus.icon}
                        {viewOrder.fulfillment_status}
                      </span>
                    );
                  })()}
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
                  <div className="px-5 py-4 rounded-xl border shadow-[0_2px_8px_rgba(28,51,25,0.04)]" style={{ backgroundColor: c.bg, borderColor: c.primary + "14" }}>
                    <p className="text-[10px] font-black uppercase tracking-widest mb-3" style={{ color: c.primary + "73" }}>Delivery Information</p>
                    <div className="flex items-center gap-4">
                      <div className="w-11 h-11 rounded-xl bg-[#F7B71D]/15 text-[#C49115] flex items-center justify-center flex-shrink-0">
                        <Truck size={22} strokeWidth={1.8} />
                      </div>
                      <div>
                        <p className="font-bold text-[15px]" style={{ color: c.text }}>{viewOrder.deliverer_name}</p>
                        {viewOrder.delivery_id && (
                          <p className="text-[12px] font-semibold mt-0.5" style={{ color: c.primary + "80" }}>ID: {viewOrder.delivery_id}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Order Summary */}
                <div className="rounded-xl border overflow-hidden shadow-[0_2px_8px_rgba(28,51,25,0.04)]" style={{ backgroundColor: c.bg, borderColor: c.primary + "14" }}>
                  <div className="px-5 py-3.5 border-b" style={{ backgroundColor: c.primary + "0A", borderColor: c.primary + "14" }}>
                    <h3 className="font-black text-[13px] uppercase tracking-wider" style={{ color: c.text }}>Order Summary</h3>
                  </div>
                  <div className="divide-y divide-[#2E5128]/6">
                    {viewOrder.items.map((item, i) => (
                      <div key={i} className="flex justify-between items-center px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <span className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-[11.5px] flex-shrink-0" style={{ backgroundColor: c.primary + "14", color: c.primary }}>
                            {item.quantity}×
                          </span>
                          <div>
                            <p className="font-semibold text-[14px]" style={{ color: c.text }}>{item.item_name}</p>
                            {item.size_label && (
                              <p className="text-[11px] font-semibold mt-0.5" style={{ color: c.primary + "80" }}>Size: {item.size_label}</p>
                            )}
                          </div>
                        </div>
                        <span className="font-bold text-[13.5px]" style={{ color: c.text }}>
                          ₱{(item.unit_price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Payment & Total */}
                <div className="grid grid-cols-2 gap-3.5 pb-2">
                  <div className="px-5 py-4 rounded-xl border shadow-[0_2px_8px_rgba(28,51,25,0.04)]" style={{ backgroundColor: c.bg, borderColor: c.primary + "14" }}>
                    <p className="text-[10px] font-black uppercase tracking-widest mb-2" style={{ color: c.primary + "73" }}>Payment Method</p>
                    <p className="font-bold text-[14px] leading-snug" style={{ color: c.text }}>
                      {viewOrder.payment_method === "Cash-on-Delivery" ? "Cash on Delivery" : viewOrder.payment_method}
                    </p>
                  </div>
                  <div className="px-5 py-4 rounded-xl flex flex-col justify-center items-end" style={{ backgroundColor: c.primary, boxShadow: `0 4px 16px ${c.primary}4D` }}>
                    <p className="text-[10px] font-black text-white/45 uppercase tracking-widest mb-1">Total Paid</p>
                    <p className="text-2xl font-black leading-none tracking-tight" style={{ color: c.accent }}>
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