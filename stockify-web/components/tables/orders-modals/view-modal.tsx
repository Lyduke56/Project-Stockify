"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Package, 
  Clock, 
  User, 
  CreditCard, 
  MapPin, 
  Phone, 
  Mail, 
  Receipt,
  X,
  ChevronRight
} from "lucide-react";

/* ─── Extended Order Interface ────────────────────────────── */
export type OrderItem = {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
};

export type Order = {
  id: string;
  dateTime: string;
  customer: string;
  customerEmail?: string;
  customerPhone?: string;
  deliveryAddress?: string;
  totalAmount: number;
  paymentMethod: "QR Code" | "COD";
  fulfillment: "Pending" | "Processing" | "Dispatched" | "Received" | "Cancelled";
  items?: OrderItem[];
};

interface ViewOrderModalProps {
  order: Order | null;
  onClose: () => void;
}

export default function ViewOrderModal({ order, onClose }: ViewOrderModalProps) {
  const [step, setStep] = useState(1);

  if (!order) return null;

  const fulfillmentColor: Record<Order["fulfillment"], string> = {
    Pending: "bg-[#F7B71D]/20 text-[#7a5800]",
    Processing: "bg-blue-100 text-blue-700",
    Dispatched: "bg-purple-100 text-purple-700",
    Received: "bg-green-100 text-green-700",
    Cancelled: "bg-red-100 text-red-700",
  };

  const displayItems = order.items || [
    { id: "ITEM-1", name: "Signature Espresso", quantity: 2, unitPrice: 120.0 },
    { id: "ITEM-2", name: "Blueberry Muffin", quantity: 1, unitPrice: 85.0 },
  ];

  const labelStyle = "text-[11px] font-black uppercase tracking-[0.12em] text-[#3A6131]/50 mb-2 block";
  const cardStyle = "bg-white border-[1.5px] border-[#3A6131]/10 rounded-2xl px-5 py-4 flex items-center gap-4 shadow-sm";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#385E31]/40 backdrop-blur-sm p-4">
      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        className="w-full max-w-[920px] bg-[#FFFCEB] rounded-[32px] overflow-hidden border-[1.5px] border-[#F7B71D]/20 shadow-[0_32px_80px_rgba(58,97,49,0.2)] flex flex-col md:flex-row h-[650px] font-inter"
      >
        
        {/* ── LEFT SIDEBAR ── */}
        <div className="w-full md:w-[320px] bg-[#3A6131] p-10 flex flex-col relative overflow-hidden shrink-0">
            <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-[#F7B71D]/10 rounded-full blur-3xl" />
            
            <div className="relative z-10">
                <div className="bg-[#F7B71D] w-12 h-1 rounded-full mb-8" />
                <h2 className="text-[#FFFCEB] font-raleway text-3xl font-black leading-tight mb-2">
                    Order Details
                </h2>
                <p className="text-[#FFFCEB]/60 text-xs font-medium leading-relaxed mb-12 uppercase tracking-wider">
                    ID: {order.id}
                </p>

                <nav className="flex flex-col gap-8">
                    {[
                        { id: 1, label: "Order Summary", icon: Receipt },
                        { id: 2, label: "Customer Info", icon: User },
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

            <div className="flex-1 overflow-y-auto p-10 [&::-webkit-scrollbar]:w-[5px] [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[#3A6131]/15 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-[#3A6131]/25">
                
                <AnimatePresence mode="wait">
                    {/* STEP 1: ORDER SUMMARY */}
                    {step === 1 && (
                        <motion.div 
                            key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                            className="space-y-6"
                        >
                            <div className="mb-8">
                                <span className="bg-[#F7B71D]/15 text-[#385E31] text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">Step 01</span>
                                <h3 className="text-2xl font-black text-[#3A6131] mt-2 font-raleway italic">Order Summary</h3>
                            </div>

                            {/* Quick Meta Grid */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className={cardStyle}>
                                    <div className="w-10 h-10 rounded-xl bg-[#3A6131]/5 flex items-center justify-center text-[#3A6131]">
                                        <Clock size={18} />
                                    </div>
                                    <div>
                                        <p className={labelStyle + " !mb-0.5"}>Date & Time</p>
                                        <p className="text-[#3A6131] font-bold text-sm">{order.dateTime}</p>
                                    </div>
                                </div>
                                <div className={cardStyle}>
                                    <div className="w-10 h-10 rounded-xl bg-[#3A6131]/5 flex items-center justify-center text-[#3A6131]">
                                        <Package size={18} />
                                    </div>
                                    <div>
                                        <p className={labelStyle + " !mb-0.5"}>Fulfillment</p>
                                        <span className={`inline-block text-[11px] px-2.5 py-0.5 rounded-md font-bold uppercase tracking-wide ${fulfillmentColor[order.fulfillment]}`}>
                                            {order.fulfillment}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Ordered Items List */}
                            <div className="bg-white rounded-2xl border border-[#3A6131]/10 shadow-sm overflow-hidden mt-6">
                                <div className="bg-[#3A6131]/5 px-5 py-3 border-b border-[#3A6131]/10">
                                    <h3 className="text-xs font-black text-[#385E31] uppercase tracking-wider">Ordered Items</h3>
                                </div>
                                <div className="p-0">
                                    <table className="w-full text-sm">
                                        <thead className="bg-white text-[#3A6131]/50 text-[10px] uppercase tracking-wider">
                                            <tr>
                                                <th className="px-5 py-3 font-black text-left border-b border-[#3A6131]/5">Item</th>
                                                <th className="px-5 py-3 font-black text-center border-b border-[#3A6131]/5">Qty</th>
                                                <th className="px-5 py-3 font-black text-right border-b border-[#3A6131]/5">Price</th>
                                                <th className="px-5 py-3 font-black text-right border-b border-[#3A6131]/5">Subtotal</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-[#3A6131]/5">
                                            {displayItems.map((item, idx) => (
                                                <tr key={idx} className="hover:bg-[#FFFCEB]/30 transition-colors">
                                                    <td className="px-5 py-4 font-bold text-[#3A6131]">{item.name}</td>
                                                    <td className="px-5 py-4 text-center font-bold text-[#3A6131]/60">x{item.quantity}</td>
                                                    <td className="px-5 py-4 text-right font-semibold text-[#3A6131]/60">₱{item.unitPrice.toFixed(2)}</td>
                                                    <td className="px-5 py-4 text-right font-black text-[#385E31]">
                                                        ₱{(item.quantity * item.unitPrice).toFixed(2)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Total Calculation Area */}
                            <div className="grid grid-cols-2 gap-6 mt-6">
                                <div className="bg-[#3A6131]/5 p-6 rounded-[24px] border border-[#3A6131]/10 flex flex-col justify-center">
                                    <label className={labelStyle}>Payment Method</label>
                                    <div className="flex items-center gap-3">
                                        <CreditCard size={20} className="text-[#3A6131]" />
                                        <span className="text-lg font-black text-[#3A6131]">{order.paymentMethod}</span>
                                    </div>
                                </div>
                                <div className="bg-[#F7B71D] p-6 rounded-[24px] shadow-lg shadow-[#F7B71D]/20 flex flex-col justify-center items-end text-right">
                                    <label className={`${labelStyle} text-[#385E31]/60 !mb-1`}>Total Amount</label>
                                    <div className="flex items-center text-3xl font-black text-[#385E31]">
                                        <span className="mr-1 opacity-50">₱</span>
                                        {order.totalAmount?.toFixed(2) || "0.00"}
                                    </div>
                                </div>
                            </div>

                        </motion.div>
                    )}

                    {/* STEP 2: CUSTOMER DETAILS */}
                    {step === 2 && (
                        <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                            
                            <div className="mb-8">
                                <span className="bg-[#F7B71D]/15 text-[#385E31] text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">Step 02</span>
                                <h3 className="text-2xl font-black text-[#3A6131] mt-2 font-raleway italic">Customer Information</h3>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className={labelStyle}>Full Name</label>
                                    <div className={cardStyle}>
                                        <div className="w-10 h-10 rounded-xl bg-[#3A6131]/5 flex items-center justify-center text-[#3A6131]">
                                            <User size={18} />
                                        </div>
                                        <p className="text-[#3A6131] font-bold text-sm">{order.customer}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className={labelStyle}>Phone Number</label>
                                        <div className={cardStyle}>
                                            <div className="w-10 h-10 rounded-xl bg-[#3A6131]/5 flex items-center justify-center text-[#3A6131]">
                                                <Phone size={18} />
                                            </div>
                                            <p className="text-[#3A6131] font-bold text-sm">{order.customerPhone || "N/A"}</p>
                                        </div>
                                    </div>
                                    <div>
                                        <label className={labelStyle}>Email Address</label>
                                        <div className={cardStyle}>
                                            <div className="w-10 h-10 rounded-xl bg-[#3A6131]/5 flex items-center justify-center text-[#3A6131]">
                                                <Mail size={18} />
                                            </div>
                                            <p className="text-[#3A6131] font-bold text-sm truncate">{order.customerEmail || "N/A"}</p>
                                        </div>
                                    </div>
                                </div>

                                {order.paymentMethod === "COD" && (
                                    <div className="pt-4">
                                        <label className={labelStyle}>Delivery Address (Required for COD)</label>
                                        <div className={`${cardStyle} items-start border-[#F7B71D]/40 bg-[#F7B71D]/5`}>
                                            <div className="w-10 h-10 rounded-xl bg-[#F7B71D]/20 flex items-center justify-center text-[#7a5800] shrink-0 mt-1">
                                                <MapPin size={18} />
                                            </div>
                                            <p className="text-[#3A6131] font-bold text-sm leading-relaxed mt-2.5">
                                                {order.deliveryAddress || "123 Business Park Ave, IT Park, Cebu City, 6000"}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>

                        </motion.div>
                    )}
                </AnimatePresence>

            </div>

            {/* Footer Navigation */}
            <div className="px-8 py-5 border-t border-[#3A6131]/10 bg-white/80 flex justify-between items-center z-10 shrink-0">
                <button 
                    onClick={() => step > 1 ? setStep(step - 1) : onClose()}
                    className="text-[#3A6131]/50 text-sm font-bold hover:text-[#3A6131] transition-colors"
                >
                    {step === 1 ? "Close" : "Back to Summary"}
                </button>
                <button 
                    onClick={() => step < 2 ? setStep(step + 1) : onClose()}
                    className="bg-[#3A6131] text-[#FFFCEB] px-8 py-3 rounded-2xl text-sm font-bold flex items-center gap-2 hover:opacity-90 transition-opacity"
                >
                    {step === 2 ? "Done Viewing" : "View Customer"} <ChevronRight size={16} />
                </button>
            </div>

        </div>
      </motion.div>
    </div>
  );
}