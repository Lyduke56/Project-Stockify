"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, X, Loader2, AlertCircle, CheckCircle2,
  Package, Clock, Truck, Ban, RefreshCw,
  User, MapPin, Phone, Mail,
} from "lucide-react";
import {
  fetchOrders,
  fetchOrderItems,
  updateFulfillmentStatus,
  processAndCompleteOrder,
  type Order,
  type OrderItem,
  type FulfillmentStatus,
} from "@/lib/employee/order-actions";
import { createClient } from "@/lib/supabase/client";

const TABS: FulfillmentStatus[] = ["Pending", "Processing", "Dispatched", "Received", "Cancelled"];
const COLUMNS = ["ORDER ID", "DATE / TIME", "CUSTOMER", "TOTAL AMOUNT", "PAYMENT METHOD", "ACTIONS"];

const TAB_META: Record<FulfillmentStatus, { bg: string; text: string; badge: string; icon: React.ReactNode }> = {
  Pending: { bg: "bg-[#F7B71D]", text: "text-[#385E31]", badge: "bg-[#F7B71D]/20 text-[#8a6700]", icon: <Clock size={12} /> },
  Processing: { bg: "bg-blue-500", text: "text-white", badge: "bg-blue-100 text-blue-700", icon: <Package size={12} /> },
  Dispatched: { bg: "bg-purple-500", text: "text-white", badge: "bg-purple-100 text-purple-700", icon: <Truck size={12} /> },
  Received: { bg: "bg-[#385E31]", text: "text-[#F7B71D]", badge: "bg-[#385E31]/10 text-[#385E31]", icon: <CheckCircle2 size={12} /> },
  Cancelled: { bg: "bg-red-500", text: "text-white", badge: "bg-red-50 text-red-600", icon: <Ban size={12} /> },
};

// ─── Cancel Order Modal (full-screen) ─────────────────────────────────────────

function CancelOrderModal({
  order,
  onConfirm,
  onClose,
  busy,
}: {
  order: Order;
  onConfirm: (reason: string) => void;
  onClose: () => void;
  busy: boolean;
}) {
  const [reason, setReason] = useState("");

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        key="cancel-backdrop"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200]"
        onClick={onClose}
      />
      {/* Modal */}
      <motion.div
        key="cancel-modal"
        initial={{ opacity: 0, scale: 0.94, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 24 }}
        transition={{ type: "spring", stiffness: 340, damping: 28 }}
        className="fixed inset-0 z-[201] flex items-center justify-center p-4 pointer-events-none"
      >
        <div className="bg-white rounded-[24px] w-full max-w-[460px] shadow-2xl pointer-events-auto overflow-hidden">
          {/* Header */}
          <div className="bg-red-500 px-6 py-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
                <Ban size={18} className="text-white" />
              </div>
              <div>
                <h2 className="text-white font-black text-[16px]">Cancel Order</h2>
                <p className="text-white/70 text-[11px] font-medium">
                  #{order.order_id.slice(0, 8).toUpperCase()}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          {/* Body */}
          <div className="px-6 py-5 flex flex-col gap-4">
            {/* Warning notice */}
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-start gap-3">
              <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
              <p className="text-red-700 text-[13px] font-medium leading-snug">
                This will permanently cancel the order and notify the customer via email.
              </p>
            </div>

            {/* Order summary chip */}
            <div className="flex items-center justify-between bg-[#fafafa] border border-[#e5e5e5] rounded-xl px-4 py-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-gray-400 mb-0.5">Customer</p>
                <p className="text-[#333] font-bold text-[13px]">{order.customer_name}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black uppercase tracking-wider text-gray-400 mb-0.5">Total</p>
                <p className="text-red-500 font-black text-[15px]">₱{order.total_amount.toFixed(2)}</p>
              </div>
            </div>

            {/* Reason textarea */}
            <div>
              <label className="text-[11px] font-black uppercase tracking-wider text-gray-500 mb-2 block">
                Reason for Cancellation <span className="text-red-400">*</span>
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Describe why this order is being cancelled. This will be included in the email sent to the customer…"
                rows={4}
                className="w-full rounded-xl border border-[#e5e5e5] focus:border-red-400 bg-white px-4 py-3 text-[13px] text-[#333] resize-none outline-none transition-colors placeholder:text-gray-300"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-1">
              <button
                onClick={onClose}
                disabled={busy}
                className="flex-1 py-3 rounded-xl border border-[#e5e5e5] text-gray-500 font-bold text-[13px] hover:bg-gray-50 transition-colors"
              >
                Go Back
              </button>
              <button
                onClick={() => onConfirm(reason)}
                disabled={busy || !reason.trim()}
                className="flex-1 bg-red-500 text-white py-3 rounded-xl font-black text-[13px] hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2 transition-opacity"
              >
                {busy ? <Loader2 size={14} className="animate-spin" /> : <Ban size={14} />}
                {busy ? "Cancelling…" : "Confirm Cancellation"}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// ─── Order Detail Modal ────────────────────────────────────────────────────────

interface CustomerProfile {
  email: string | null;
  contact_number: string | null;
  address: string | null;
}

function OrderDetailModal({
  order,
  onClose,
  onStatusChange,
}: {
  order: Order;
  onClose: () => void;
  onStatusChange: () => void;
}) {
  const [items, setItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [showCancel, setShowCancel] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [tenantId, setTenantId] = useState("");
  const [customerProfile, setCustomerProfile] = useState<CustomerProfile | null>(null);

  useEffect(() => {
    fetchOrderItems(order.order_id).then((data) => { setItems(data); setLoading(false); });
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      const { data: u } = await supabase
        .from("users")
        .select("tenant_id")
        .eq("user_id", data.user.id)
        .single();
      if (u) setTenantId(u.tenant_id ?? "");
    });
    // Fetch the customer's profile
    supabase
      .from("users")
      .select("email, contact_number, address")
      .eq("user_id", order.customer_id)
      .single()
      .then(({ data }) => setCustomerProfile(data ?? null));
  }, [order.order_id, order.customer_id]);

  const act = async (fn: () => Promise<{ error: string | null }>, successMsg: string) => {
    setBusy(true);
    setFeedback(null);
    const { error } = await fn();
    setBusy(false);
    if (error) {
      setFeedback({ type: "error", msg: error });
    } else {
      setFeedback({ type: "success", msg: successMsg });
      setTimeout(() => { onStatusChange(); onClose(); }, 1200);
    }
  };

  const handleCancel = async (reason: string) => {
    setBusy(true);
    setFeedback(null);
    const res = await fetch("/api/orders/cancel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId: order.order_id, reason }),
    });
    const json = await res.json();
    setBusy(false);
    setShowCancel(false);
    if (json.error) {
      setFeedback({ type: "error", msg: json.error });
    } else {
      setFeedback({ type: "success", msg: "Order cancelled. Email sent to customer." });
      setTimeout(() => { onStatusChange(); onClose(); }, 1400);
    }
  };

  const meta = TAB_META[order.fulfillment_status];

  return (
    <AnimatePresence>
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
        onClick={onClose}
      />
      <motion.div
        key="modal"
        initial={{ opacity: 0, scale: 0.94, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 20 }}
        transition={{ type: "spring", stiffness: 340, damping: 28 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
      >
        <div className="bg-[#FFFCEB] rounded-[24px] w-full max-w-[540px] shadow-2xl pointer-events-auto overflow-hidden max-h-[90dvh] flex flex-col">

          {/* Header */}
          <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-[#3A6131]/10">
            <div>
              <p className="text-[#3A6131]/50 text-[11px] font-bold uppercase tracking-wider mb-0.5">Order</p>
              <h2 className="text-[#3A6131] font-black text-[16px] font-mono">{order.order_id.slice(0, 8).toUpperCase()}</h2>
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-[12px] font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 ${meta.badge}`}>
                {meta.icon} {order.fulfillment_status}
              </span>
              <button onClick={onClose} className="w-8 h-8 rounded-full bg-[#3A6131]/8 hover:bg-[#3A6131]/15 flex items-center justify-center text-[#3A6131]/50">
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Info row */}
          <div className="px-6 py-4 grid grid-cols-3 gap-4 border-b border-[#3A6131]/10">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#3A6131]/40 mb-1">Customer</p>
              <p className="text-[#3A6131] font-bold text-[13px]">{order.customer_name}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#3A6131]/40 mb-1">Payment</p>
              <p className="text-[#3A6131] font-bold text-[13px]">{order.payment_method}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#3A6131]/40 mb-1">Total</p>
              <p className="text-[#F7B71D] font-black text-[15px]">₱{order.total_amount.toFixed(2)}</p>
            </div>
          </div>

          {/* Customer Profile */}
          <div className="px-6 py-3 border-b border-[#3A6131]/10 bg-[#3A6131]/2">
            <div className="flex items-center gap-2 mb-2">
              <User size={11} className="text-[#3A6131]/40" />
              <p className="text-[10px] font-black uppercase tracking-wider text-[#3A6131]/40">Customer Details</p>
            </div>
            {customerProfile ? (
              <div className="flex flex-col gap-1.5">
                {customerProfile.email && (
                  <div className="flex items-center gap-2">
                    <Mail size={11} className="text-[#3A6131]/40 shrink-0" />
                    <span className="text-[#3A6131] text-[12px] font-medium">{customerProfile.email}</span>
                  </div>
                )}
                {customerProfile.contact_number && (
                  <div className="flex items-center gap-2">
                    <Phone size={11} className="text-[#3A6131]/40 shrink-0" />
                    <span className="text-[#3A6131] text-[12px] font-medium">{customerProfile.contact_number}</span>
                  </div>
                )}
                {customerProfile.address && (
                  <div className="flex items-start gap-2">
                    <MapPin size={11} className="text-[#3A6131]/40 shrink-0 mt-0.5" />
                    <span className="text-[#3A6131] text-[12px] font-medium leading-snug">{customerProfile.address}</span>
                  </div>
                )}
                {!customerProfile.email && !customerProfile.contact_number && !customerProfile.address && (
                  <p className="text-[#3A6131]/30 text-[12px] font-medium italic">No contact details on file.</p>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-[#3A6131]/30">
                <Loader2 size={12} className="animate-spin" />
                <span className="text-[11px]">Loading customer info…</span>
              </div>
            )}
          </div>

          {/* Items */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            <p className="text-[10px] font-black uppercase tracking-wider text-[#3A6131]/40 mb-3">Order Items</p>
            {loading ? (
              <div className="flex items-center justify-center py-8 text-[#3A6131]/30 gap-2">
                <Loader2 size={18} className="animate-spin" /> Loading…
              </div>
            ) : items.length === 0 ? (
              <p className="text-center text-[#3A6131]/30 text-[13px] py-8">No item details available yet.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {items.map((item) => (
                  <div key={item.order_item_id} className="flex items-center gap-3 bg-white rounded-xl p-3 border border-[#3A6131]/8">
                    <div className="flex-1 min-w-0">
                      <p className="text-[#3A6131] font-bold text-[13px] truncate">
                        {item.item_name || `Item #${item.item_id.slice(0, 6)}`}
                      </p>
                      {item.size_label && (
                        <span className="text-[11px] text-[#3A6131]/60 bg-[#3A6131]/8 px-2 py-0.5 rounded-full font-medium mt-0.5 inline-block">
                          {item.size_label}
                        </span>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[#3A6131] font-bold text-[13px]">×{item.quantity}</p>
                      <p className="text-[#F7B71D] font-black text-[12px]">₱{(item.unit_price * item.quantity).toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Cancel reason display for Cancelled orders */}
            {order.fulfillment_status === "Cancelled" && order.cancel_reason && (
              <div className="mt-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                <p className="text-[10px] font-black uppercase tracking-wider text-red-400 mb-1">Cancellation Reason</p>
                <p className="text-red-600 text-[13px] font-medium">{order.cancel_reason}</p>
              </div>
            )}
          </div>

          {/* Feedback */}
          {feedback && (
            <div className={`mx-6 mb-3 rounded-xl px-4 py-3 flex items-center gap-2 text-[13px] font-medium ${feedback.type === "success" ? "bg-green-50 border border-green-200 text-green-700" : "bg-red-50 border border-red-200 text-red-600"}`}>
              {feedback.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
              {feedback.msg}
            </div>
          )}

          {/* Action Buttons */}
          <div className="px-6 pb-6 pt-3 border-t border-[#3A6131]/10 flex flex-col gap-2">
            {order.fulfillment_status === "Pending" && (
              <>
                <button
                  onClick={() => act(() => updateFulfillmentStatus(order.order_id, "Processing"), "Order moved to Processing.")}
                  disabled={busy}
                  className="w-full bg-blue-500 text-white py-3.5 rounded-2xl font-black text-[14px] hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {busy ? <Loader2 size={16} className="animate-spin" /> : <Package size={16} />} Start Processing
                </button>
                <button onClick={() => setShowCancel(true)} disabled={busy}
                  className="w-full bg-red-50 border border-red-200 text-red-600 py-3 rounded-2xl font-bold text-[13px] hover:bg-red-100 transition-colors flex items-center justify-center gap-2">
                  <Ban size={14} /> Cancel Order
                </button>
              </>
            )}

            {order.fulfillment_status === "Processing" && (
              <>
                <button
                  onClick={() => act(() => updateFulfillmentStatus(order.order_id, "Dispatched"), "Order dispatched & stock deducted!")}
                  disabled={busy}
                  className="w-full bg-purple-500 text-white py-3.5 rounded-2xl font-black text-[14px] hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {busy ? <Loader2 size={16} className="animate-spin" /> : <Truck size={16} />} Mark as Dispatched & Deduct Stock
                </button>
                <button onClick={() => setShowCancel(true)} disabled={busy}
                  className="w-full bg-red-50 border border-red-200 text-red-600 py-3 rounded-2xl font-bold text-[13px] hover:bg-red-100 transition-colors flex items-center justify-center gap-2">
                  <Ban size={14} /> Cancel Order
                </button>
              </>
            )}

            {order.fulfillment_status === "Dispatched" && (
              <>
                <button
                  onClick={() => act(() => processAndCompleteOrder(order.order_id, tenantId), "Order received & transaction completed!")}
                  disabled={busy}
                  className="w-full bg-[#385E31] text-[#F7B71D] py-3.5 rounded-2xl font-black text-[14px] hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {busy ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                  {busy ? "Processing…" : "Mark as Received & Complete Transaction"}
                </button>
                <button onClick={() => setShowCancel(true)} disabled={busy}
                  className="w-full bg-red-50 border border-red-200 text-red-600 py-3 rounded-2xl font-bold text-[13px] hover:bg-red-100 transition-colors flex items-center justify-center gap-2">
                  <Ban size={14} /> Cancel Order
                </button>
              </>
            )}

            {(order.fulfillment_status === "Received" || order.fulfillment_status === "Cancelled") && (
              <p className="text-center text-[#3A6131]/40 text-[13px] font-medium py-2">
                This order is {order.fulfillment_status === "Received" ? "completed" : "cancelled"}.
              </p>
            )}
          </div>

          {/* Cancel Order Modal (portal-style, rendered inside AnimatePresence) */}
          {showCancel && (
            <CancelOrderModal
              order={order}
              onConfirm={handleCancel}
              onClose={() => setShowCancel(false)}
              busy={busy}
            />
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// ─── Main Orders Table ─────────────────────────────────────────────────────────

export default function OrdersTable() {
  const [tenantId, setTenantId] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<FulfillmentStatus>("Pending");
  const [search, setSearch] = useState("");
  const [viewOrder, setViewOrder] = useState<Order | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadOrders = useCallback(async (tid: string) => {
    const data = await fetchOrders(tid);
    setOrders(data);
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    const init = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: u } = await supabase.from("users").select("tenant_id").eq("user_id", user.id).single();
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
    return o.order_id.toLowerCase().includes(q) || o.customer_name.toLowerCase().includes(q);
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

      {/* ── Sliding Tab Navigation ── */}
      <div className="w-full flex justify-center mb-8">
        <div className="relative flex w-full h-[45px] items-center my-2">
          <div className="absolute inset-0 border-2 border-[#385E31] rounded-[8px] pointer-events-none" />
          <div
            className={`absolute top-[-2px] bottom-[-2px] rounded-[8px] transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] z-10 ${TAB_META[activeTab].bg}`}
            style={{
              width: `calc(${100 / TABS.length}% + 4px)`,
              left: `calc(${(activeIdx * 100) / TABS.length}% - 2px)`,
            }}
          />
          {TABS.map((tab) => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 h-full z-20 text-center font-bold text-[14px] transition-colors duration-300 cursor-pointer ${isActive ? TAB_META[tab].text : "text-[#385E31]"
                  }`}
              >
                <span className="relative">
                  {tab}
                  {tabCounts[tab] > 0 && (
                    <span className={`ml-1.5 text-[11px] font-black px-1.5 py-0.5 rounded-full ${isActive ? "bg-white/25" : "bg-[#385E31]/10"}`}>
                      {tabCounts[tab]}
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Toolbar ── */}
      <div className="w-full flex flex-col lg:flex-row justify-between items-center mb-4 gap-4">
        <div className="flex w-full lg:w-auto flex-1 gap-4 items-center">
          <div className="relative flex-1 max-w-[400px]">
            <input
              type="text"
              placeholder="Search by order ID or customer…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border border-[#385E31] rounded-full px-5 py-2.5 bg-transparent text-[#385E31] placeholder-[#385E31]/70 outline-none font-medium text-[13px]"
            />
            <div className="absolute right-4 top-3 text-[#385E31]">
              <Search size={16} />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 w-full lg:w-auto justify-end">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2.5 rounded-full border border-[#385E31] text-[#385E31] hover:bg-[#385E31]/10 transition-all disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
          </button>
          <div className="text-[#385E31] font-bold text-sm border border-[#385E31]/30 px-4 py-2 rounded-full">
            {filtered.length} Orders
          </div>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="w-full bg-[#FFFCEB] rounded-[10px] border border-[#385E31] flex flex-col overflow-hidden shadow-sm">

        {/* Header */}
        <div className="w-full flex bg-[#385E31] px-4 py-3 rounded-t-[8px]">
          {COLUMNS.map((col) => (
            <div key={col} className="flex-1 text-center text-[#FFFCEB] text-[13px] font-bold">
              {col}
            </div>
          ))}
        </div>

        {/* Body */}
        {loading ? (
          <div className="flex items-center justify-center py-16 text-[#3A6131]/40 gap-3">
            <Loader2 size={22} className="animate-spin" /> Loading orders…
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-[#385E31]/40 gap-3">
            <Package size={40} strokeWidth={1} />
            <p className="font-medium text-[14px]">
              No {activeTab.toLowerCase()} orders{search ? ` matching "${search}"` : ""}.
            </p>
          </div>
        ) : (
          <AnimatePresence>
            {filtered.map((order, idx) => {
              const isLast = idx === filtered.length - 1;
              const m = TAB_META[order.fulfillment_status];
              return (
                <motion.div
                  key={order.order_id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.18 }}
                  className={`w-full flex px-4 py-[14px] items-center hover:bg-[#3A6131]/3 transition-colors ${!isLast ? "border-b border-[#385E31]/10" : ""
                    }`}
                >
                  {/* ORDER ID */}
                  <div className="flex-1 text-center">
                    <button
                      onClick={() => setViewOrder(order)}
                      className="text-[#3A6131] text-[13px] font-black font-mono hover:text-[#F7B71D] hover:underline transition-colors"
                    >
                      {order.order_id.slice(0, 8).toUpperCase()}
                    </button>
                  </div>

                  {/* DATE / TIME */}
                  <div className="flex-1 text-center text-[#3A6131]/70 text-[13px] font-medium">
                    {formatDate(order.created_at)}
                  </div>

                  {/* CUSTOMER */}
                  <div className="flex-1 text-center text-[#3A6131] text-[13px] font-bold truncate px-1">
                    {order.customer_name}
                  </div>

                  {/* TOTAL AMOUNT */}
                  <div className="flex-1 text-center text-[#3A6131] text-[13px] font-black">
                    ₱{order.total_amount.toFixed(2)}
                  </div>

                  {/* PAYMENT METHOD */}
                  <div className="flex-1 flex justify-center">
                    <span className="text-[12px] font-bold bg-[#3A6131]/8 text-[#3A6131] px-2.5 py-1 rounded-full">
                      {order.payment_method === "QR Code" ? "QR Code" : order.payment_method === "Cash-on-Delivery" ? "Cash on Delivery" : order.payment_method}
                    </span>
                  </div>

                  {/* ACTIONS */}
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

      {/* ── Order Detail Modal ── */}
      {viewOrder && (
        <OrderDetailModal
          order={viewOrder}
          onClose={() => setViewOrder(null)}
          onStatusChange={() => tenantId && loadOrders(tenantId)}
        />
      )}
    </div>
  );
}