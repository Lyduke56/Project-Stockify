"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom"; // <-- IMPORT PORTAL
import { motion, AnimatePresence } from "framer-motion";
import { 
  Package, Clock, User, CreditCard, MapPin, Phone, Mail, 
  Receipt, X, ChevronRight, Truck, CheckCircle2, AlertCircle, 
  Loader2, Upload, AlertTriangle, RefreshCw, Ban
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  fetchOrderItems,
  updateFulfillmentStatus,
  processAndCompleteOrder,
  uploadDeliveryProof,
  uploadProofOfPayment,
  logOrderView,
  type Order,
  type OrderItem,
} from "@/lib/employee/order-actions";
import { type StorefrontConfig } from "@/lib/admin/storefront-actions";

// ─── Cancel Order Modal ─────────────
function CancelOrderModal({
  order,
  onConfirm,
  onClose,
  busy,
  colors,
}: {
  order: Order;
  onConfirm: (reason: string) => void;
  onClose: () => void;
  busy: boolean;
  colors?: StorefrontConfig | null;
}) {
  const [reason, setReason] = useState("");
  
  // <-- MOUNT STATE FOR PORTAL
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const cancelStyles = {
    "--color-primary": colors?.color_primary ?? "#3A6131",
    "--color-background": colors?.color_background ?? "#FFFCEB",
    "--color-accent": colors?.color_accent ?? "#F7B71D",
    "--color-sidebar-text": colors?.color_sidebar_text ?? "#FFF9D7",
  } as React.CSSProperties;

  // <-- PORTAL THE CANCEL MODAL
  return createPortal(
    <AnimatePresence>
      <motion.div
        key="cancel-backdrop"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[9998]"
        onClick={onClose}
      />
      <motion.div
        key="cancel-modal"
        initial={{ opacity: 0, scale: 0.94, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 24 }}
        className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-none font-inter"
      >
        <div style={cancelStyles} className="bg-background rounded-[24px] w-full max-w-[460px] shadow-2xl pointer-events-auto overflow-hidden border-[1.5px] border-red-500/20">
          <div className="bg-red-500 px-6 py-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
                <Ban size={18} className="text-white" />
              </div>
              <div>
                <h2 className="text-white font-black text-[16px]">Cancel Order</h2>
                <p className="text-white/70 text-[11px] font-medium uppercase tracking-widest">
                  #{order.order_id.slice(0, 8)}
                </p>
              </div>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors">
              <X size={16} />
            </button>
          </div>

          <div className="px-6 py-5 flex flex-col gap-4">
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-start gap-3">
              <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
              <p className="text-red-700 text-[13px] font-medium leading-snug">
                This will permanently cancel the order and notify the customer via email.
              </p>
            </div>

            <div>
              <label className="text-[11px] font-black uppercase tracking-[0.12em] text-primary/50 mb-2 block">
                Reason for Cancellation <span className="text-red-400">*</span>
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Describe why this order is being cancelled..."
                rows={4}
                className="w-full rounded-xl border-[1.5px] border-primary/10 focus:border-red-400 bg-background px-4 py-3 text-[13px] text-primary resize-none outline-none transition-colors"
              />
            </div>

            <div className="flex gap-3 pt-1">
              <button onClick={onClose} disabled={busy} className="flex-1 py-3 rounded-xl border-[1.5px] border-primary/10 text-primary/60 font-bold text-[13px] hover:bg-primary/5 transition-colors">
                Go Back
              </button>
              <button onClick={() => onConfirm(reason)} disabled={busy || !reason.trim()} className="flex-1 bg-red-500 text-white py-3 rounded-xl font-black text-[13px] hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2 transition-opacity">
                {busy ? <Loader2 size={14} className="animate-spin" /> : <Ban size={14} />}
                {busy ? "Cancelling..." : "Confirm Cancellation"}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}

// ─── Main ViewOrderModal ──────────────────────────────────────────
interface ViewOrderModalProps {
  order: Order | null;
  onClose: () => void;
  onStatusChange: () => void;
  colors?: StorefrontConfig | null;
}

export default function ViewOrderModal({ order, onClose, onStatusChange, colors }: ViewOrderModalProps) {
  const [step, setStep] = useState(1);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [showCancel, setShowCancel] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [tenantId, setTenantId] = useState("");
  const [customerProfile, setCustomerProfile] = useState<{ email: string | null; contact_number: string | null; address: string | null } | null>(null);

  // Fulfillment specific state
  const [deliveryInfo, setDeliveryInfo] = useState({ deliverer_name: "", delivery_id: "" });
  const [deliveryFile, setDeliveryFile] = useState<File | null>(null);
  const [paymentFile, setPaymentFile] = useState<File | null>(null);
  const [resolutionRemarks, setResolutionRemarks] = useState("");

  // <-- MOUNT STATE FOR PORTAL
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!order) return;
    const init = async () => {
      const itemsData = await fetchOrderItems(order.order_id);
      setItems(itemsData);
      setLoading(false);

      const supabase = createClient();
      const { data: authData } = await supabase.auth.getUser();
      if (authData.user) {
        const { data: u } = await supabase.from("users").select("tenant_id").eq("user_id", authData.user.id).single();
        if (u) setTenantId(u.tenant_id ?? "");
      }

      const { data: profile } = await supabase.from("users").select("email, contact_number, address").eq("user_id", order.customer_id).single();
      if (profile) setCustomerProfile(profile);

      if (order.tenant_id) {
        logOrderView(order.order_id, order.tenant_id, "DETAILS");
      }
    };
    init();
  }, [order]);

  if (!order || !mounted) return null; // Added mounted check

  const modalStyles = {
    "--color-primary": colors?.color_primary ?? "#3A6131",
    "--color-background": colors?.color_background ?? "#FFFCEB",
    "--color-secondary": colors?.color_secondary ?? "#2A4725",
    "--color-accent": colors?.color_accent ?? "#F7B71D",
    "--color-sidebar-text": colors?.color_sidebar_text ?? "#FFF9D7",
  } as React.CSSProperties;

  // ─── Action Handlers ───
  const act = async (fn: () => Promise<{ error: string | null }>, successMsg: string) => {
    setBusy(true); setFeedback(null);
    const { error } = await fn();
    setBusy(false);
    if (error) setFeedback({ type: "error", msg: error });
    else {
      setFeedback({ type: "success", msg: successMsg });
      setTimeout(() => { onStatusChange(); onClose(); }, 1200);
    }
  };

  const handleDispatch = async () => {
    if (!deliveryInfo.deliverer_name) return setFeedback({ type: "error", msg: "Deliverer name is required." });
    setBusy(true);
    const { error } = await updateFulfillmentStatus(order.order_id, "Dispatched", deliveryInfo);
    setBusy(false);
    if (error) setFeedback({ type: "error", msg: error });
    else { setFeedback({ type: "success", msg: "Order dispatched!" }); setTimeout(() => { onStatusChange(); onClose(); }, 1200); }
  };

  const handleDeliveryProof = async () => {
    if (!deliveryFile) return setFeedback({ type: "error", msg: "Please select an image." });
    setBusy(true);
    const { error } = await uploadDeliveryProof(order.order_id, deliveryFile);
    setBusy(false);
    if (error) setFeedback({ type: "error", msg: error });
    else { setFeedback({ type: "success", msg: "Proof of delivery uploaded!" }); setDeliveryFile(null); onStatusChange(); }
  };

  const handlePaymentProof = async () => {
    if (!paymentFile) return setFeedback({ type: "error", msg: "Please select an image." });
    setBusy(true);
    const { error } = await uploadProofOfPayment(order.order_id, paymentFile);
    setBusy(false);
    if (error) setFeedback({ type: "error", msg: error });
    else { setFeedback({ type: "success", msg: "Proof of payment uploaded!" }); setPaymentFile(null); onStatusChange(); }
  };

  const handleCancel = async (reason: string) => {
    setBusy(true); setFeedback(null);
    const res = await fetch("/api/orders/cancel", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ orderId: order.order_id, reason }) });
    const json = await res.json();
    setBusy(false); setShowCancel(false);
    if (json.error) setFeedback({ type: "error", msg: json.error });
    else { setFeedback({ type: "success", msg: "Order cancelled." }); setTimeout(() => { onStatusChange(); onClose(); }, 1400); }
  };

  // ─── UI Helpers ───
  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return `${d.toLocaleDateString("en-PH", { month: "short", day: "numeric" })} ${d.toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" })}`;
  };

  const fulfillmentColor: Record<string, string> = {
    Pending: "bg-[#F7B71D]/20 text-[#7a5800]",
    Processing: "bg-blue-100 text-blue-700",
    Dispatched: "bg-purple-100 text-purple-700",
    Received: "bg-green-100 text-green-700",
    Reported: "bg-orange-100 text-orange-700",
    Cancelled: "bg-red-100 text-red-700",
  };

  const labelStyle = "text-[11px] font-black uppercase tracking-[0.12em] text-primary/50 mb-2 block";
  const cardStyle = "bg-background border-[1.5px] border-primary/10 rounded-2xl px-5 py-4 flex items-center gap-4 shadow-sm";

  // <-- PORTAL THE MAIN MODAL
  return createPortal(
    <div style={modalStyles} className="fixed inset-0 z-[9990] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
        className="w-full max-w-[920px] bg-background rounded-[32px] overflow-hidden border-[1.5px] border-accent/20 shadow-[0_32px_80px_rgba(58,97,49,0.2)] flex flex-col md:flex-row h-[650px] font-inter relative"
      >
        {/* ── LEFT SIDEBAR ── */}
        <div className="w-full md:w-[320px] bg-primary p-10 flex flex-col relative overflow-hidden shrink-0">
          <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-accent/10 rounded-full blur-3xl" />
          
          <div className="relative z-10">
            <div className="bg-accent w-12 h-1 rounded-full mb-8" />
            <h2 className="text-sidebar-text font-raleway text-3xl font-black leading-tight mb-2">Order Details</h2>
            <p className="text-sidebar-text/60 text-xs font-medium leading-relaxed mb-12 uppercase tracking-wider font-mono">
              ID: {order.order_id.slice(0, 8)}
            </p>

            <nav className="flex flex-col gap-8">
              {[
                { id: 1, label: "Order Summary", icon: Receipt },
                { id: 2, label: "Customer Info", icon: User },
                { id: 3, label: "Fulfillment", icon: Truck },
              ].map((s) => (
                <button 
                  key={s.id} onClick={() => setStep(s.id)}
                  className={`flex items-center gap-4 transition-all duration-300 w-full text-left ${step === s.id ? "translate-x-2" : "opacity-40 hover:opacity-80"}`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${step === s.id ? "bg-accent text-primary shadow-lg shadow-accent/20" : "bg-white/10 text-white"}`}>
                    <s.icon size={18} strokeWidth={2.5} />
                  </div>
                  <span className={`text-sm font-bold tracking-wide ${step === s.id ? "text-sidebar-text" : "text-white"}`}>
                    {s.label}
                  </span>
                </button>
              ))}
            </nav>
          </div>

          <div className="mt-auto relative z-10">
            <div className="flex gap-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className={`h-1.5 rounded-full transition-all duration-500 ${step === i ? "w-8 bg-accent" : "w-2 bg-white/20"}`} />
              ))}
            </div>
          </div>
        </div>

        {/* ── RIGHT CONTENT ── */}
        <div className="flex-1 flex flex-col relative bg-background/50 backdrop-blur-sm overflow-hidden">
          <button onClick={onClose} className="absolute top-6 right-6 w-10 h-10 rounded-full bg-background border border-primary/10 flex items-center justify-center text-primary hover:bg-primary hover:text-sidebar-text transition-all z-20 shadow-sm">
            <X size={20} strokeWidth={2.5} />
          </button>

          <div className="flex-1 overflow-y-auto p-10 [&::-webkit-scrollbar]:w-[5px] [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-primary/15 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-primary/25">
            <AnimatePresence mode="wait">
              
              {/* ── STEP 1: SUMMARY ── */}
              {step === 1 && (
                <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                  <div className="mb-8">
                    <span className="bg-accent/15 text-primary text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">Step 01</span>
                    <h3 className="text-2xl font-black text-primary mt-2 font-raleway italic">Order Summary</h3>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className={cardStyle}>
                      <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary">
                        <Clock size={18} />
                      </div>
                      <div>
                        <p className={labelStyle + " !mb-0.5"}>Date & Time</p>
                        <p className="text-primary font-bold text-sm">{formatDate(order.created_at)}</p>
                      </div>
                    </div>
                    <div className={cardStyle}>
                      <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary">
                        <Package size={18} />
                      </div>
                      <div>
                        <p className={labelStyle + " !mb-0.5"}>Status</p>
                        <span className={`inline-block text-[11px] px-2.5 py-0.5 rounded-md font-bold uppercase tracking-wide ${fulfillmentColor[order.fulfillment_status]}`}>
                          {order.fulfillment_status}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-background rounded-2xl border border-primary/10 shadow-sm overflow-hidden mt-6">
                    <div className="bg-primary/5 px-5 py-3 border-b border-primary/10">
                      <h3 className="text-xs font-black text-primary uppercase tracking-wider">Ordered Items</h3>
                    </div>
                    <div className="p-0">
                      <table className="w-full text-sm">
                        <thead className="bg-background text-primary/50 text-[10px] uppercase tracking-wider">
                          <tr>
                            <th className="px-5 py-3 font-black text-left border-b border-primary/5">Item</th>
                            <th className="px-5 py-3 font-black text-center border-b border-primary/5">Qty</th>
                            <th className="px-5 py-3 font-black text-right border-b border-primary/5">Price</th>
                            <th className="px-5 py-3 font-black text-right border-b border-primary/5">Subtotal</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-primary/5">
                          {loading ? (
                            <tr><td colSpan={4} className="px-5 py-8 text-center text-primary/50"><Loader2 className="animate-spin inline mr-2" size={16}/>Loading items...</td></tr>
                          ) : items.map((item, idx) => (
                            <tr key={idx} className="hover:bg-primary/[0.02] transition-colors">
                              <td className="px-5 py-4 font-bold text-primary">
                                {item.item_name}
                                {item.size_label && <span className="block text-[10px] text-primary/60 uppercase mt-0.5">{item.size_label}</span>}
                              </td>
                              <td className="px-5 py-4 text-center font-bold text-primary/60">x{item.quantity}</td>
                              <td className="px-5 py-4 text-right font-semibold text-primary/60">₱{item.unit_price.toFixed(2)}</td>
                              <td className="px-5 py-4 text-right font-black text-primary">₱{(item.quantity * item.unit_price).toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6 mt-6">
                    <div className="bg-primary/5 p-6 rounded-[24px] border border-primary/10 flex flex-col justify-center">
                      <label className={labelStyle}>Payment Method</label>
                      <div className="flex items-center gap-3">
                        <CreditCard size={20} className="text-primary" />
                        <span className="text-lg font-black text-primary">
                          {order.payment_method === "Cash-on-Delivery" ? "Cash on Delivery" : order.payment_method}
                        </span>
                      </div>
                    </div>
                    <div className="bg-accent p-6 rounded-[24px] shadow-lg shadow-accent/20 flex flex-col justify-center items-end text-right">
                      <label className={`${labelStyle} text-primary/60 !mb-1`}>Total Amount</label>
                      <div className="flex items-center text-3xl font-black text-primary">
                        <span className="mr-1 opacity-50">₱</span>
                        {order.total_amount?.toFixed(2) || "0.00"}
                      </div>
                    </div>
                  </div>

                  {order.payment_method === "QR Code" && order.proof_of_payment_url && (
                    <div className="mt-6 bg-background border-[1.5px] border-primary/10 rounded-2xl p-4">
                      <label className={labelStyle}>Customer GCash Proof</label>
                      <div className="relative aspect-video bg-primary/5 rounded-xl border border-primary/10 overflow-hidden cursor-pointer hover:ring-2 hover:ring-accent transition-all"
                        onClick={() => { logOrderView(order.order_id, tenantId, "PAYMENT"); window.open(order.proof_of_payment_url!, "_blank"); }}>
                        <img src={order.proof_of_payment_url} alt="GCash Proof" className="w-full h-full object-contain" />
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {/* ── STEP 2: CUSTOMER ── */}
              {step === 2 && (
                <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                  <div className="mb-8">
                    <span className="bg-accent/15 text-primary text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">Step 02</span>
                    <h3 className="text-2xl font-black text-primary mt-2 font-raleway italic">Customer Information</h3>
                  </div>

                  {!customerProfile ? (
                    <div className="flex items-center gap-3 text-primary/50"><Loader2 className="animate-spin" /> Fetching Profile...</div>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <label className={labelStyle}>Customer Name</label>
                        <div className={cardStyle}>
                          <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary"><User size={18} /></div>
                          <p className="text-primary font-bold text-sm">{order.customer_name}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className={labelStyle}>Phone Number</label>
                          <div className={cardStyle}>
                            <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary"><Phone size={18} /></div>
                            <p className="text-primary font-bold text-sm">{customerProfile.contact_number || "N/A"}</p>
                          </div>
                        </div>
                        <div>
                          <label className={labelStyle}>Email Address</label>
                          <div className={cardStyle}>
                            <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary"><Mail size={18} /></div>
                            <p className="text-primary font-bold text-sm truncate">{customerProfile.email || "N/A"}</p>
                          </div>
                        </div>
                      </div>

                      {customerProfile.address && (
                        <div className="pt-4">
                          <label className={labelStyle}>Delivery Address</label>
                          <div className={`${cardStyle} items-start border-accent/40 bg-accent/5`}>
                            <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center text-primary shrink-0 mt-1"><MapPin size={18} /></div>
                            <p className="text-primary font-bold text-sm leading-relaxed mt-2.5">{customerProfile.address}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              )}

              {/* ── STEP 3: FULFILLMENT ── */}
              {step === 3 && (
                <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                  <div className="mb-6 flex justify-between items-start">
                    <div>
                      <span className="bg-accent/15 text-primary text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">Step 03</span>
                      <h3 className="text-2xl font-black text-primary mt-2 font-raleway italic">Fulfillment Details</h3>
                    </div>
                    {feedback && (
                      <div className={`px-4 py-2 rounded-xl text-[12px] font-bold flex items-center gap-2 ${feedback.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {feedback.type === 'success' ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />} {feedback.msg}
                      </div>
                    )}
                  </div>

                  {/* 1. Pending State */}
                  {order.fulfillment_status === "Pending" && (
                    <div className="bg-accent/10 border border-accent/30 rounded-2xl p-6">
                      <div className="flex items-center gap-2 mb-2">
                         <Clock size={18} className="text-primary" />
                         <label className={labelStyle + " !mb-0"}>Action Required</label>
                      </div>
                      <p className="text-sm text-primary/80 mb-5 leading-relaxed">
                        This order is currently pending review. Please verify the customer's details and payment method, then mark it as processing to begin preparation.
                      </p>
                      <button onClick={() => act(() => updateFulfillmentStatus(order.order_id, "Processing"), "Moved to Processing!")} disabled={busy} className="w-full bg-primary text-sidebar-text py-4 rounded-xl font-black text-sm hover:opacity-90 transition-opacity flex justify-center gap-2">
                        {busy ? <Loader2 className="animate-spin" /> : <Clock />} Mark as Processing
                      </button>
                    </div>
                  )}

                  {/* 2. Processing State */}
                  {order.fulfillment_status === "Processing" && (
                    <div className="bg-background border-[1.5px] border-primary/20 rounded-2xl p-6 shadow-sm">
                      <div className="flex items-center gap-2 mb-1">
                         <Package size={18} className="text-primary" />
                         <label className="text-[11px] font-black uppercase tracking-[0.12em] text-primary/50 block">Preparation Phase</label>
                      </div>
                      <p className="text-sm text-primary/70 mb-6 leading-relaxed">
                        This order is currently being prepared. Once packed and ready, assign a deliverer and input their details below to dispatch the items.
                      </p>

                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className={labelStyle}>Deliverer Name</label>
                            <input type="text" placeholder="e.g. Lalamove Rider" value={deliveryInfo.deliverer_name} onChange={(e) => setDeliveryInfo({ ...deliveryInfo, deliverer_name: e.target.value })} className="w-full border-[1.5px] border-primary/10 rounded-xl px-4 py-3 text-sm text-primary bg-background outline-none focus:border-accent" />
                          </div>
                          <div>
                            <label className={labelStyle}>Reference ID (Opt)</label>
                            <input type="text" placeholder="e.g. TRK-001" value={deliveryInfo.delivery_id} onChange={(e) => setDeliveryInfo({ ...deliveryInfo, delivery_id: e.target.value })} className="w-full border-[1.5px] border-primary/10 rounded-xl px-4 py-3 text-sm text-primary bg-background outline-none focus:border-accent" />
                          </div>
                        </div>
                        <button onClick={handleDispatch} disabled={busy} className="w-full bg-accent text-primary py-4 rounded-xl font-black text-sm hover:opacity-90 shadow-md shadow-accent/20 flex justify-center gap-2">
                          {busy ? <Loader2 className="animate-spin" /> : <Truck />} Dispatch Order
                        </button>
                      </div>
                    </div>
                  )}

                  {/* 3. Dispatched State */}
                  {order.fulfillment_status === "Dispatched" && (
                    <div className="space-y-6">
                      <div className="bg-background border-[1.5px] border-primary/20 rounded-2xl p-6">
                        <div className="flex items-center gap-2 mb-2">
                           <Truck size={18} className="text-primary" />
                           <label className="text-[11px] font-black uppercase tracking-[0.12em] text-primary/50 block">Out for Delivery</label>
                        </div>
                        <p className="text-sm text-primary/70 mb-4 leading-relaxed">
                          This order is currently in transit. Please coordinate with the rider and await proof of delivery to finalize this transaction.
                        </p>
                        <div className="bg-primary/5 rounded-xl border border-primary/10 p-4">
                          <p className="text-[11px] font-black uppercase tracking-wider text-primary/40 mb-1">Active Deliverer</p>
                          <p className="text-primary font-bold text-sm">{order.deliverer_name} {order.delivery_id && <span className="opacity-60 font-mono">({order.delivery_id})</span>}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Delivery Proof */}
                        <div className="bg-background border-[1.5px] border-primary/10 rounded-2xl p-5">
                          <label className={labelStyle}>1. Proof of Delivery</label>
                          {!order.delivery_proof_url ? (
                            <div className="space-y-3">
                              <input type="file" accept="image/*" onChange={(e) => setDeliveryFile(e.target.files?.[0] || null)} className="w-full text-xs file:bg-primary file:text-sidebar-text file:border-0 file:rounded-xl file:px-4 file:py-2 file:font-bold file:mr-3 cursor-pointer hover:file:opacity-90 transition-opacity" />
                              <button onClick={handleDeliveryProof} disabled={busy || !deliveryFile} className="w-full bg-primary/10 text-primary py-2.5 rounded-xl font-bold text-xs hover:bg-primary/20 flex justify-center gap-2 disabled:opacity-50">
                                {busy ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />} Upload Delivery Proof
                              </button>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <div className="text-green-700 text-xs font-bold bg-green-100 p-2 rounded-lg flex items-center gap-2"><CheckCircle2 size={14}/> Verified</div>
                              <img src={order.delivery_proof_url} alt="Delivery" className="w-full h-24 object-cover rounded-xl cursor-pointer hover:ring-2 hover:ring-purple-400 transition-all" onClick={() => window.open(order.delivery_proof_url!, "_blank")}/>
                            </div>
                          )}
                        </div>

                        {/* Payment Proof (COD) */}
                        {order.payment_method === "Cash-on-Delivery" && (
                          <div className="bg-background border-[1.5px] border-primary/10 rounded-2xl p-5">
                            <label className={labelStyle}>2. Payment Proof (Cash)</label>
                            {!order.proof_of_payment_url ? (
                              <div className="space-y-3">
                                <input type="file" accept="image/*" onChange={(e) => setPaymentFile(e.target.files?.[0] || null)} className="w-full text-xs file:bg-accent file:text-primary file:border-0 file:rounded-xl file:px-4 file:py-2 file:font-bold file:mr-3 cursor-pointer hover:file:opacity-90 transition-opacity" />
                                <button onClick={handlePaymentProof} disabled={busy || !paymentFile} className="w-full bg-accent/20 text-primary py-2.5 rounded-xl font-bold text-xs hover:bg-accent/40 flex justify-center gap-2 disabled:opacity-50">
                                  {busy ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />} Upload Payment Proof
                                </button>
                              </div>
                            ) : (
                              <div className="space-y-2">
                                <div className="text-green-700 text-xs font-bold bg-green-100 p-2 rounded-lg flex items-center gap-2"><CheckCircle2 size={14}/> Verified</div>
                                <img src={order.proof_of_payment_url} alt="Payment" className="w-full h-24 object-cover rounded-xl cursor-pointer hover:ring-2 hover:ring-purple-400 transition-all" onClick={() => window.open(order.proof_of_payment_url!, "_blank")}/>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {order.customer_confirmed_received && order.delivery_proof_url && (
                        <button onClick={() => act(() => processAndCompleteOrder(order.order_id), "Transaction completed!")} disabled={busy || (order.payment_method === "Cash-on-Delivery" && !order.proof_of_payment_url)} className="w-full bg-primary text-sidebar-text py-4 rounded-xl font-black text-sm hover:opacity-90 flex justify-center gap-2 shadow-lg disabled:opacity-50">
                          {busy ? <Loader2 className="animate-spin" /> : <CheckCircle2 />} Complete Transaction
                        </button>
                      )}
                    </div>
                  )}

                  {/* 4. Received State */}
                  {order.fulfillment_status === "Received" && (
                    <div className="bg-green-50 border-[1.5px] border-green-200 rounded-2xl p-8 text-center flex flex-col items-center">
                      <div className="w-14 h-14 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
                        <CheckCircle2 size={28} />
                      </div>
                      <h4 className="font-black text-green-800 text-xl mb-2">Order Complete</h4>
                      <p className="text-sm text-green-700/80 leading-relaxed max-w-[300px]">
                        This order has been successfully delivered and paid for. No further fulfillment actions are required.
                      </p>
                    </div>
                  )}

                  {/* 5. Reported State */}
                  {order.fulfillment_status === "Reported" && (
                    <div className="bg-orange-50 border border-orange-200 rounded-2xl p-6 space-y-4">
                      <div className="flex items-center gap-2 mb-1">
                         <AlertTriangle size={18} className="text-orange-600" />
                         <label className="text-[11px] font-black uppercase tracking-[0.12em] text-orange-800/60 block">Dispute Resolution</label>
                      </div>
                      <p className="text-sm text-orange-800/80 mb-2 leading-relaxed">
                        The customer has reported an issue with this delivery. Please review the details, investigate the dispute, and choose a resolution below.
                      </p>

                      {order.cancel_reason && (
                        <div className="bg-white/60 w-full p-4 rounded-xl text-left border border-orange-100 mb-4">
                          <span className="text-[10px] font-black uppercase tracking-wider text-orange-500 mb-1 block">Customer Report</span>
                          <p className="text-orange-900 text-sm italic">"{order.cancel_reason}"</p>
                        </div>
                      )}

                      <textarea placeholder="Resolution remarks..." value={resolutionRemarks} onChange={(e) => setResolutionRemarks(e.target.value)} className="w-full bg-background border border-orange-200 rounded-xl px-4 py-3 text-sm text-primary outline-none focus:border-orange-400 min-h-[80px] resize-none" />
                      
                      <div className="grid grid-cols-2 gap-3 pt-2">
                        <button onClick={() => act(() => updateFulfillmentStatus(order.order_id, "Processing", { deliverer_name: null, delivery_id: null, delivery_proof_url: null, cancel_reason: resolutionRemarks }), "Re-dispatched.")} disabled={busy || !resolutionRemarks.trim()} className="bg-background text-orange-700 py-3 border-[1.5px] border-orange-200 hover:bg-orange-100 rounded-xl font-bold text-[13px] flex items-center justify-center gap-2 transition-colors disabled:opacity-50">
                          <RefreshCw size={16} /> Re-Dispatch
                        </button>
                        <button onClick={() => act(() => processAndCompleteOrder(order.order_id, resolutionRemarks), "Force completed.")} disabled={busy || !resolutionRemarks.trim()} className="bg-orange-600 text-white py-3 rounded-xl font-bold text-[13px] hover:opacity-90 flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 transition-opacity">
                          <CheckCircle2 size={16} /> Force Complete
                        </button>
                      </div>
                    </div>
                  )}

                  {/* 6. Cancelled State */}
                  {order.fulfillment_status === "Cancelled" && (
                    <div className="bg-red-50 border-[1.5px] border-red-200 rounded-2xl p-8 text-center flex flex-col items-center">
                      <div className="w-14 h-14 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
                        <Ban size={28} />
                      </div>
                      <h4 className="font-black text-red-800 text-xl mb-2">Order Cancelled</h4>
                      <p className="text-sm text-red-700/80 leading-relaxed max-w-[300px] mb-6">
                        This order has been voided. The transaction is closed and no further fulfillment actions can be taken.
                      </p>
                      
                      {order.cancel_reason && (
                        <div className="bg-white/60 w-full p-4 rounded-xl text-left border border-red-100">
                          <span className="text-[10px] font-black uppercase tracking-wider text-red-500 mb-1 block">Cancellation Reason</span>
                          <p className="text-red-900 text-sm italic">"{order.cancel_reason}"</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Cancel Fallback Button (Not visible in Received or Cancelled states) */}
                  {order.fulfillment_status !== "Received" && order.fulfillment_status !== "Cancelled" && (
                     <div className="pt-6 border-t border-primary/10">
                        <button 
                          onClick={() => setShowCancel(true)} 
                          className="w-full py-4 text-[13px] font-bold text-red-600 bg-white hover:bg-red-50 border border-red-100 hover:border-red-200 rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm"
                        >
                          <Ban size={16} /> Terminate Order
                        </button>
                        <p className="text-center text-[10px] text-primary/40 mt-3 font-medium uppercase tracking-wider">
                          Warning: Cancelling is permanent and cannot be undone.
                        </p>
                     </div>
                  )}

                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ── FOOTER NAVIGATION ── */}
          <div className="px-8 py-5 border-t border-primary/10 bg-background/80 flex justify-between items-center z-10 shrink-0">
            <button onClick={() => step > 1 ? setStep(step - 1) : onClose()} className="text-primary/50 text-sm font-bold hover:text-primary transition-colors">
              {step === 1 ? "Close" : step === 2 ? "Back to Summary" : "Back to Customer"}
            </button>
            <button onClick={() => step < 3 ? setStep(step + 1) : onClose()} className="bg-primary text-sidebar-text px-8 py-3 rounded-2xl text-sm font-bold flex items-center gap-2 hover:opacity-90 transition-opacity">
              {step === 1 ? "View Customer" : step === 2 ? "Manage Fulfillment" : "Done"} <ChevronRight size={16} />
            </button>
          </div>

          {/* ── CANCEL MODAL MOUNT ── */}
          {showCancel && <CancelOrderModal order={order} onConfirm={handleCancel} onClose={() => setShowCancel(false)} busy={busy} colors={colors} />}
        </div>
      </motion.div>
    </div>,
    document.body
  );
}