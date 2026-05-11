"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, ShoppingBag, Minus, Plus, Trash2, CheckCircle, Loader2,
  CreditCard, Banknote, Smartphone, Lock
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useCart } from "@/lib/customer/cart-context";
import { placeOrder, type PaymentMethod } from "@/lib/employee/order-actions";

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenantId: string;
  onSuccess?: (orderId: string) => void;
}

export function CheckoutModal({ isOpen, onClose, tenantId, onSuccess }: CheckoutModalProps) {
  const { cartItems, removeFromCart, updateQuantity, clearCart, cartTotal } = useCart();
  const [userId, setUserId] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("Cash-on-Delivery");
  const [placing, setPlacing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<"cart" | "payment" | "success">("cart");

  useEffect(() => {
    if (!isOpen) return;
    setStep("cart");
    setError(null);
    setSuccess(false);

    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id ?? null);
      setAuthLoading(false);
    });
  }, [isOpen]);

  const handlePlaceOrder = async () => {
    if (!userId) return;
    setPlacing(true);
    setError(null);

    const result = await placeOrder({
      tenant_id: tenantId,
      customer_id: userId,
      payment_method: paymentMethod,
      total_amount: cartTotal,
      items: cartItems.map((item) => ({
        item_id: item.option_id ?? item.product_id,
        item_type: item.item_type,
        item_name: item.name + (item.size_label ? ` (${item.size_label})` : ""),
        size_label: item.size_label ?? null,
        quantity: item.qty,
        unit_price: item.price,
      })),
    });

    setPlacing(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    clearCart();
    setStep("success");
    onSuccess?.(result.order_id!);
  };

  const paymentMethods: { id: PaymentMethod; label: string; icon: React.ReactNode }[] = [
    { id: "Cash-on-Delivery", label: "Cash on Delivery", icon: <Banknote size={18} /> },
    { id: "QR code",          label: "QR Code Payment", icon: <Smartphone size={18} /> },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100]"
          />

          {/* Modal */}
          <motion.div
            key="modal"
            initial={{ opacity: 0, y: 40, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 340, damping: 30 }}
            className="fixed inset-0 z-[101] flex items-end sm:items-center justify-center p-0 sm:p-4 pointer-events-none"
          >
            <div className="bg-[#FFFCEB] w-full sm:max-w-[520px] rounded-t-[28px] sm:rounded-[28px] overflow-hidden shadow-2xl pointer-events-auto max-h-[92dvh] flex flex-col">

              {/* Header */}
              <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-[#3A6131]/10">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-[#3A6131] rounded-xl flex items-center justify-center">
                    <ShoppingBag size={18} className="text-[#F7B71D]" />
                  </div>
                  <div>
                    <h2 className="text-[#3A6131] text-[17px] font-black">
                      {step === "cart" ? "Your Cart" : step === "payment" ? "Payment" : "Order Placed!"}
                    </h2>
                    <p className="text-[#3A6131]/50 text-[11px] font-medium">
                      {step === "cart" ? `${cartItems.length} item${cartItems.length !== 1 ? "s" : ""}` : ""}
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="w-9 h-9 rounded-full bg-[#3A6131]/8 hover:bg-[#3A6131]/15 flex items-center justify-center text-[#3A6131]/60 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Loading auth state */}
              {authLoading ? (
                <div className="flex-1 flex items-center justify-center py-16">
                  <Loader2 size={28} className="animate-spin text-[#3A6131]/40" />
                </div>

              ) : !userId ? (
                /* ─── Not Logged In ────────────────────────────────────── */
                <div className="flex-1 flex flex-col items-center justify-center px-8 py-12 text-center gap-6">
                  <div className="w-16 h-16 bg-[#3A6131]/8 rounded-2xl flex items-center justify-center">
                    <Lock size={28} className="text-[#3A6131]/50" />
                  </div>
                  <div>
                    <h3 className="text-[#3A6131] text-[18px] font-black mb-2">Sign In Required</h3>
                    <p className="text-[#3A6131]/60 text-[14px] leading-relaxed">
                      You need to be logged in to place an order. Your cart items will be saved.
                    </p>
                  </div>
                  <a
                    href="../../login"
                    className="bg-[#3A6131] text-[#FFFCEB] px-10 py-3.5 rounded-2xl font-black text-[14px] hover:opacity-90 transition-opacity shadow-md"
                  >
                    Sign In to Continue
                  </a>
                </div>

              ) : step === "success" ? (
                /* ─── Success ─────────────────────────────────────────── */
                <div className="flex-1 flex flex-col items-center justify-center px-8 py-12 text-center gap-5">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 20, delay: 0.1 }}
                    className="w-20 h-20 bg-[#3A6131] rounded-full flex items-center justify-center shadow-lg shadow-[#3A6131]/20"
                  >
                    <CheckCircle size={40} className="text-[#F7B71D]" />
                  </motion.div>
                  <div>
                    <h3 className="text-[#3A6131] text-[22px] font-black mb-2">Order Received!</h3>
                    <p className="text-[#3A6131]/60 text-[14px] leading-relaxed">
                      Your order has been placed and is being processed by our team.
                    </p>
                  </div>
                  <button
                    onClick={onClose}
                    className="bg-[#F7B71D] text-[#385E31] px-10 py-3.5 rounded-2xl font-black text-[14px] hover:opacity-90 transition-opacity shadow-md"
                  >
                    Back to Menu
                  </button>
                </div>

              ) : step === "cart" ? (
                /* ─── Cart ────────────────────────────────────────────── */
                <>
                  <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-3">
                    {cartItems.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-16 text-[#3A6131]/30 gap-3">
                        <ShoppingBag size={48} strokeWidth={1} />
                        <p className="font-medium text-[14px]">Your cart is empty</p>
                      </div>
                    ) : (
                      <AnimatePresence>
                        {cartItems.map((item) => (
                          <motion.div
                            key={item.id}
                            layout
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="flex items-center gap-4 bg-white rounded-2xl p-4 border border-[#3A6131]/8">
                              <div className="flex-1 min-w-0">
                                <p className="text-[#3A6131] font-bold text-[14px] leading-tight truncate">{item.name}</p>
                                {item.size_label && (
                                  <p className="text-[#3A6131]/50 text-[12px] font-medium mt-0.5">{item.size_label}</p>
                                )}
                                <p className="text-[#F7B71D] font-black text-[14px] mt-1">
                                  ₱{(item.price * item.qty).toFixed(2)}
                                </p>
                              </div>
                              <div className="flex items-center gap-2 bg-[#3A6131]/5 rounded-xl p-1">
                                <button
                                  onClick={() => item.qty <= 1 ? removeFromCart(item.id) : updateQuantity(item.id, item.qty - 1)}
                                  className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[#3A6131]/10 text-[#3A6131] transition-colors"
                                >
                                  {item.qty <= 1 ? <Trash2 size={13} className="text-red-400" /> : <Minus size={13} />}
                                </button>
                                <span className="w-5 text-center text-[#3A6131] font-black text-[13px]">{item.qty}</span>
                                <button
                                  onClick={() => updateQuantity(item.id, item.qty + 1)}
                                  className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[#3A6131]/10 text-[#3A6131] transition-colors"
                                >
                                  <Plus size={13} />
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    )}
                  </div>

                  {cartItems.length > 0 && (
                    <div className="px-6 pb-6 pt-4 border-t border-[#3A6131]/10 flex flex-col gap-4">
                      <div className="flex justify-between items-center">
                        <span className="text-[#3A6131]/60 font-bold text-[14px]">Total</span>
                        <span className="text-[#3A6131] font-black text-[22px]">₱{cartTotal.toFixed(2)}</span>
                      </div>
                      <button
                        onClick={() => setStep("payment")}
                        className="w-full bg-[#3A6131] text-[#FFFCEB] py-4 rounded-2xl font-black text-[15px] hover:opacity-90 transition-opacity shadow-md"
                      >
                        Proceed to Payment
                      </button>
                    </div>
                  )}
                </>

              ) : (
                /* ─── Payment ──────────────────────────────────────────── */
                <>
                  <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-4">
                    <p className="text-[#3A6131]/60 text-[13px] font-medium">Choose your payment method</p>
                    <div className="flex flex-col gap-3">
                      {paymentMethods.map((pm) => (
                        <button
                          key={pm.id}
                          onClick={() => setPaymentMethod(pm.id)}
                          className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left ${
                            paymentMethod === pm.id
                              ? "border-[#3A6131] bg-[#3A6131]/5"
                              : "border-[#3A6131]/15 bg-white hover:border-[#3A6131]/30"
                          }`}
                        >
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${paymentMethod === pm.id ? "bg-[#3A6131] text-[#F7B71D]" : "bg-[#3A6131]/8 text-[#3A6131]/60"}`}>
                            {pm.icon}
                          </div>
                          <span className={`font-bold text-[15px] ${paymentMethod === pm.id ? "text-[#3A6131]" : "text-[#3A6131]/60"}`}>
                            {pm.label}
                          </span>
                          {paymentMethod === pm.id && (
                            <div className="ml-auto w-5 h-5 rounded-full bg-[#3A6131] flex items-center justify-center">
                              <div className="w-2 h-2 rounded-full bg-white" />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>

                    {/* Order Summary */}
                    <div className="bg-white rounded-2xl border border-[#3A6131]/10 p-4 mt-2">
                      <p className="text-[#3A6131]/50 text-[11px] font-black uppercase tracking-wider mb-3">Order Summary</p>
                      {cartItems.map((item) => (
                        <div key={item.id} className="flex justify-between items-center py-1.5 border-b border-[#3A6131]/5 last:border-0">
                          <span className="text-[#3A6131] text-[13px] font-medium">
                            {item.qty}× {item.name}{item.size_label ? ` (${item.size_label})` : ""}
                          </span>
                          <span className="text-[#3A6131] text-[13px] font-bold">₱{(item.price * item.qty).toFixed(2)}</span>
                        </div>
                      ))}
                      <div className="flex justify-between items-center pt-3 mt-1">
                        <span className="text-[#3A6131] font-black text-[14px]">Total</span>
                        <span className="text-[#F7B71D] font-black text-[18px]">₱{cartTotal.toFixed(2)}</span>
                      </div>
                    </div>

                    {error && (
                      <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-600 text-[13px] font-medium">
                        {error}
                      </div>
                    )}
                  </div>

                  <div className="px-6 pb-6 pt-4 border-t border-[#3A6131]/10 flex flex-col gap-3">
                    <button
                      onClick={handlePlaceOrder}
                      disabled={placing}
                      className="w-full bg-[#3A6131] text-[#FFFCEB] py-4 rounded-2xl font-black text-[15px] hover:opacity-90 transition-opacity shadow-md flex items-center justify-center gap-2 disabled:opacity-60"
                    >
                      {placing ? (
                        <><Loader2 size={18} className="animate-spin" /> Placing Order…</>
                      ) : (
                        <>Place Order · ₱{cartTotal.toFixed(2)}</>
                      )}
                    </button>
                    <button onClick={() => setStep("cart")} className="text-[#3A6131]/50 font-bold text-[13px] hover:text-[#3A6131] transition-colors">
                      ← Back to Cart
                    </button>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
