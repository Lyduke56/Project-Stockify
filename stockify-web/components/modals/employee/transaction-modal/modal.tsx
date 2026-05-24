"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom"; // <-- IMPORT PORTAL
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, Receipt, Package, Truck, Eye, ChevronRight, 
  Loader2, Image as ImageIcon, Info 
} from "lucide-react";
import { 
  fetchOrderById, 
  fetchOrderItems, 
  logOrderView, 
  type Order, 
  type OrderItem 
} from "@/lib/employee/order-actions";

interface TransactionDetailModalProps {
  orderId: string;
  tenantId: string;
  onClose: () => void;
}

export default function TransactionDetailModal({ orderId, tenantId, onClose }: TransactionDetailModalProps) {
  const [step, setStep] = useState(1);
  const [order, setOrder] = useState<Order | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);

  // <-- MOUNT STATE FOR PORTAL
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const load = async () => {
      const [ord, itms] = await Promise.all([
        fetchOrderById(orderId),
        fetchOrderItems(orderId)
      ]);
      setOrder(ord);
      setItems(itms);
      setLoading(false);
      
      if (tenantId) logOrderView(orderId, tenantId, "DETAILS");
    };
    load();
  }, [orderId, tenantId]);

  const handleViewProof = (type: "PAYMENT" | "PROOFS") => {
    if (!order) return;
    const url = type === "PAYMENT" ? order.proof_of_payment_url : order.delivery_proof_url;
    if (url) {
      logOrderView(orderId, tenantId, type);
      window.open(url, "_blank");
    }
  };

  const labelStyle = "text-[11px] font-black uppercase tracking-[0.12em] text-[#3A6131]/50 mb-2 block";
  const cardStyle = "bg-white border-[1.5px] border-[#3A6131]/10 rounded-2xl px-5 py-4 flex items-center gap-4 shadow-sm";

  // <-- PREVENT RENDER UNTIL MOUNTED
  if (!mounted) return null;

  // <-- PORTAL THE MODAL TO document.body
  return createPortal(
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        className="w-full max-w-[920px] bg-[#FFFCEB] rounded-[32px] overflow-hidden border-[1.5px] border-[#F7B71D]/20 shadow-[0_32px_80px_rgba(58,97,49,0.2)] flex flex-col md:flex-row h-[600px] font-inter relative"
      >
        {/* ── LEFT SIDEBAR ── */}
        <div className="w-full md:w-[320px] bg-[#3A6131] p-10 flex flex-col relative overflow-hidden shrink-0">
            <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-[#F7B71D]/10 rounded-full blur-3xl" />
            
            <div className="relative z-10">
                <div className="bg-[#F7B71D] w-12 h-1 rounded-full mb-8" />
                <h2 className="text-[#FFFCEB] font-raleway text-3xl font-black leading-tight mb-2 italic">
                  Transaction
                </h2>
                <p className="text-[#FFFCEB]/60 text-xs font-medium leading-relaxed mb-12 uppercase tracking-wider font-mono">
                    ID: {orderId.slice(0, 8)}
                </p>

                <nav className="flex flex-col gap-8">
                    {[
                        { id: 1, label: "Overview & Proofs", icon: Receipt },
                        { id: 2, label: "Item Breakdown", icon: Package },
                    ].map((s) => (
                        <button 
                            key={s.id}
                            onClick={() => setStep(s.id)}
                            className={`flex items-center gap-4 transition-all duration-300 w-full text-left ${step === s.id ? "translate-x-2" : "opacity-40 hover:opacity-80"}`}
                        >
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${step === s.id ? "bg-[#F7B71D] text-[#385E31] shadow-lg shadow-[#F7B71D]/20" : "bg-white/10 text-white"}`}>
                                <s.icon size={18} strokeWidth={2.5} />
                            </div>
                            <span className={`text-sm font-bold tracking-wide ${step === s.id ? "text-[#FFFCEB]" : "text-white"}`}>
                                {s.label}
                            </span>
                        </button>
                    ))}
                </nav>
            </div>

            <div className="mt-auto relative z-10">
                <div className="flex gap-2">
                    {[1, 2].map((i) => (
                        <div key={i} className={`h-1.5 rounded-full transition-all duration-500 ${step === i ? "w-8 bg-[#F7B71D]" : "w-2 bg-white/20"}`} />
                    ))}
                </div>
            </div>
        </div>

        {/* ── RIGHT CONTENT ── */}
        <div className="flex-1 flex flex-col relative bg-white/50 backdrop-blur-sm overflow-hidden">
            <button onClick={onClose} className="absolute top-6 right-6 w-10 h-10 rounded-full bg-[#FFFCEB] border border-[#3A6131]/10 flex items-center justify-center text-[#3A6131] hover:bg-[#3A6131] hover:text-[#FFFCEB] transition-all z-20 shadow-sm">
                <X size={20} strokeWidth={2.5} />
            </button>

            <div className="flex-1 overflow-y-auto p-10">
                {loading ? (
                    <div className="h-full flex flex-col items-center justify-center gap-3 text-[#3A6131]/40">
                        <Loader2 size={32} className="animate-spin" />
                        <p className="text-[13px] font-bold uppercase tracking-wider">Fetching Record...</p>
                    </div>
                ) : order && (
                    <AnimatePresence mode="wait">
                        {/* STEP 1: OVERVIEW */}
                        {step === 1 && (
                            <motion.div 
                                key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                <div className="mb-8">
                                    <span className="bg-[#F7B71D]/15 text-[#385E31] text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">Step 01</span>
                                    <h3 className="text-2xl font-black text-[#3A6131] mt-2 font-raleway italic">Summary Details</h3>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-[#3A6131]/5 p-6 rounded-[24px] border border-[#3A6131]/10 flex flex-col justify-center">
                                        <label className={labelStyle}>Customer Name</label>
                                        <p className="text-[#3A6131] font-black text-lg truncate">{order.customer_name}</p>
                                    </div>
                                    <div className="bg-[#F7B71D] p-6 rounded-[24px] shadow-lg shadow-[#F7B71D]/20 flex flex-col justify-center items-end text-right">
                                        <label className={`${labelStyle} text-[#385E31]/60 !mb-1`}>Total Paid</label>
                                        <div className="flex items-center text-3xl font-black text-[#385E31]">
                                            <span className="mr-1 opacity-50">₱</span>
                                            {order.total_amount?.toFixed(2) || "0.00"}
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-4">
                                    <label className={labelStyle}>Verification Proofs</label>
                                    <div className="grid grid-cols-2 gap-4">
                                        <button 
                                            onClick={() => handleViewProof("PAYMENT")}
                                            disabled={!order.proof_of_payment_url}
                                            className={`flex items-center justify-between p-4 rounded-2xl border-[1.5px] transition-all ${order.proof_of_payment_url ? 'bg-white border-[#3A6131]/10 hover:border-[#F7B71D] group shadow-sm' : 'bg-[#3A6131]/5 border-transparent opacity-50 cursor-not-allowed'}`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-500"><ImageIcon size={18} /></div>
                                                <span className="text-[13px] font-bold text-[#3A6131]">Payment</span>
                                            </div>
                                            {order.proof_of_payment_url && <Eye size={16} className="text-[#3A6131]/30 group-hover:text-[#F7B71D] transition-colors" />}
                                        </button>

                                        <button 
                                            onClick={() => handleViewProof("PROOFS")}
                                            disabled={!order.delivery_proof_url}
                                            className={`flex items-center justify-between p-4 rounded-2xl border-[1.5px] transition-all ${order.delivery_proof_url ? 'bg-white border-[#3A6131]/10 hover:border-[#F7B71D] group shadow-sm' : 'bg-[#3A6131]/5 border-transparent opacity-50 cursor-not-allowed'}`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center text-purple-500"><Truck size={18} /></div>
                                                <span className="text-[13px] font-bold text-[#3A6131]">Delivery</span>
                                            </div>
                                            {order.delivery_proof_url && <Eye size={16} className="text-[#3A6131]/30 group-hover:text-[#F7B71D] transition-colors" />}
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* STEP 2: ITEMS */}
                        {step === 2 && (
                            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                                <div className="mb-8">
                                    <span className="bg-[#F7B71D]/15 text-[#385E31] text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">Step 02</span>
                                    <h3 className="text-2xl font-black text-[#3A6131] mt-2 font-raleway italic">Order Breakdown</h3>
                                </div>

                                <div className="bg-white rounded-2xl border border-[#3A6131]/10 shadow-sm overflow-hidden">
                                    <div className="bg-[#3A6131]/5 px-5 py-3 border-b border-[#3A6131]/10">
                                        <h3 className="text-xs font-black text-[#385E31] uppercase tracking-wider">Purchased Items</h3>
                                    </div>
                                    <div className="max-h-[300px] overflow-y-auto">
                                        <table className="w-full text-sm">
                                            <thead className="bg-white text-[#3A6131]/50 text-[10px] uppercase tracking-wider">
                                                <tr>
                                                    <th className="px-5 py-3 font-black text-left border-b border-[#3A6131]/5">Item</th>
                                                    <th className="px-5 py-3 font-black text-center border-b border-[#3A6131]/5">Qty</th>
                                                    <th className="px-5 py-3 font-black text-right border-b border-[#3A6131]/5">Subtotal</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-[#3A6131]/5">
                                                {items.map((item, idx) => (
                                                    <tr key={idx} className="hover:bg-[#FFFCEB]/50 transition-colors">
                                                        <td className="px-5 py-4 font-bold text-[#3A6131]">
                                                            {item.item_name}
                                                            <span className="block text-[10px] text-[#3A6131]/50 mt-0.5">₱{item.unit_price.toFixed(2)} each</span>
                                                        </td>
                                                        <td className="px-5 py-4 text-center font-bold text-[#3A6131]/60">x{item.quantity}</td>
                                                        <td className="px-5 py-4 text-right font-black text-[#385E31]">₱{(item.quantity * item.unit_price).toFixed(2)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                )}
            </div>

            {/* Footer Navigation */}
            <div className="px-8 py-5 border-t border-[#3A6131]/10 bg-white/80 flex justify-between items-center z-10 shrink-0">
                <button 
                    onClick={() => step > 1 ? setStep(step - 1) : onClose()}
                    className="text-[#3A6131]/50 text-sm font-bold hover:text-[#3A6131] transition-colors"
                >
                    {step === 1 ? "Close Menu" : "Back to Summary"}
                </button>
                <button 
                    onClick={() => step < 2 ? setStep(step + 1) : onClose()}
                    className="bg-[#3A6131] text-[#FFFCEB] px-8 py-3 rounded-2xl text-sm font-bold flex items-center gap-2 hover:opacity-90 transition-opacity"
                >
                    {step === 2 ? "Finish" : "View Breakdown"} <ChevronRight size={16} />
                </button>
            </div>
        </div>
      </motion.div>
    </div>,
    document.body
  );
}