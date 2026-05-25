"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  X, ShoppingBag, Minus, Plus, Trash2, CheckCircle, Loader2,
  Banknote, Smartphone, Lock, User, MapPin, Phone, Mail
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useCart } from "@/lib/customer/cart-context";
import { placeOrder, uploadProofOfPayment, type PaymentMethod } from "@/lib/employee/order-actions";
import { fetchTenantSettings, type TenantSettings } from "@/lib/admin/settings-actions";

interface UserProfile {
  first_name: string | null;
  last_name: string | null;
  middle_name: string | null;
  email: string | null;
  contact_number: string | null;
  address: string | null;
  display_name: string | null;
}

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenantId: string;
  onSuccess?: (orderId: string) => void;
  colors?: {
    primary: string;
    secondary: string;
    accent: string;
    bg: string;
    text: string;
  };
}

export function CheckoutModal({ isOpen, onClose, tenantId, onSuccess, colors }: CheckoutModalProps) {
  const router = useRouter();
  const { cartItems, removeFromCart, updateQuantity, clearCart, cartTotal } = useCart();
  const [userId, setUserId] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("Cash-on-Delivery");
  const [placing, setPlacing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<"cart" | "payment" | "success">("cart");
  const [settings, setSettings] = useState<TenantSettings | null>(null);
  const [popFile, setPopFile] = useState<File | null>(null);

  const c = {
    primary:   colors?.primary   ?? "#3A6131",
    secondary: colors?.secondary ?? "#2A4725",
    accent:    colors?.accent    ?? "#F7B71D",
    bg:        colors?.bg        ?? "#FFFCEB",
    text:      colors?.text      ?? "#3A6131",
  };

  useEffect(() => {
    if (!isOpen) return;
    setStep("cart");
    setError(null);
    setSuccess(false);
    setUserProfile(null);

    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data }: any) => {
      const uid = data.user?.id ?? null;
      setUserId(uid);

      if (uid) {
        const { data: profile } = await supabase
          .from("users")
          .select("first_name, last_name, middle_name, email, contact_number, address, display_name")
          .eq("user_id", uid)
          .single();
        setUserProfile(profile ?? null);
      }

      setAuthLoading(false);
    });

    fetchTenantSettings(tenantId).then(setSettings);
  }, [isOpen, tenantId]);

  const getFullName = (p: UserProfile) => {
    const parts = [p.first_name, p.middle_name ? p.middle_name[0] + "." : null, p.last_name].filter(Boolean);
    return parts.length > 0 ? parts.join(" ") : p.display_name ?? "—";
  };

  const handlePlaceOrder = async () => {
    if (!userId) return;
    if (paymentMethod === "QR Code" && !popFile) {
      setError("Please upload your proof of payment for GCash.");
      return;
    }

    console.log("[CheckoutModal] handlePlaceOrder called. paymentMethod:", paymentMethod);
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

    if (result.error) {
      setPlacing(false);
      setError(result.error);
      return;
    }

    if (paymentMethod === "QR Code" && popFile && result.order_id) {
      const { error: uploadError } = await uploadProofOfPayment(result.order_id, popFile);
      if (uploadError) {
        console.error("POP upload failed:", uploadError);
        // We still placed the order, but POP is missing. Maybe notify user?
      }
    }

    setPlacing(false);
    clearCart();
    setStep("success");
    onSuccess?.(result.order_id!);
  };

  const paymentMethods: { id: PaymentMethod; label: string; icon: React.ReactNode }[] = [
    { id: "Cash-on-Delivery", label: "Cash on Delivery", icon: <Banknote size={18} /> },
    { id: "QR Code", label: "QR Code Payment", icon: <Smartphone size={18} /> },
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
            <div 
              className="w-full sm:max-w-[520px] rounded-t-[28px] sm:rounded-[28px] overflow-hidden shadow-2xl pointer-events-auto max-h-[92dvh] flex flex-col border"
              style={{ backgroundColor: c.bg, color: c.text, borderColor: c.primary + "1A" }}
            >

              {/* Header */}
              <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b" style={{ borderBottomColor: c.primary + "1A" }}>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: c.primary }}>
                    <ShoppingBag size={18} style={{ color: c.accent }} />
                  </div>
                  <div>
                    <h2 className="text-[17px] font-black" style={{ color: c.primary }}>
                      {step === "cart" ? "Your Cart" : step === "payment" ? "Payment" : "Order Placed!"}
                    </h2>
                    <p className="text-[11px] font-medium" style={{ color: c.primary + "80" }}>
                      {step === "cart" ? `${cartItems.length} item${cartItems.length !== 1 ? "s" : ""}` : ""}
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="w-9 h-9 rounded-full flex items-center justify-center transition-colors hover:bg-black/5"
                  style={{ color: c.primary + "90" }}
                >
                  <X size={18} />
                </button>
              </div>

              {/* Loading auth state */}
              {authLoading ? (
                <div className="flex-1 flex items-center justify-center py-16">
                  <Loader2 size={28} className="animate-spin" style={{ color: c.primary + "66" }} />
                </div>

              ) : !userId ? (
                /* ─── Not Logged In ────────────────────────────────────── */
                <div className="flex-1 flex flex-col items-center justify-center px-8 py-12 text-center gap-6">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ backgroundColor: c.primary + "14" }}>
                    <Lock size={28} style={{ color: c.primary + "80" }} />
                  </div>
                  <div>
                    <h3 className="text-[18px] font-black mb-2" style={{ color: c.primary }}>Sign In Required</h3>
                    <p className="text-[14px] leading-relaxed" style={{ color: c.primary + "99" }}>
                      You need to be logged in to place an order. Your cart items will be saved.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      const businessName = window.location.pathname.split("/")[1];
                      router.push(`/${businessName}/login`);
                    }}
                    className="px-10 py-3.5 rounded-2xl font-black text-[14px] hover:opacity-90 transition-opacity shadow-md"
                    style={{ backgroundColor: c.primary, color: c.bg }}
                  >
                    Sign In to Continue
                  </button>
                </div>

              ) : step === "success" ? (
                /* ─── Success ─────────────────────────────────────────── */
                <div className="flex-1 flex flex-col items-center justify-center px-8 py-12 text-center gap-5">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 20, delay: 0.1 }}
                    className="w-20 h-20 rounded-full flex items-center justify-center shadow-lg"
                    style={{ backgroundColor: c.primary, boxShadow: `0 10px 25px ${c.primary}4D` }}
                  >
                    <CheckCircle size={40} style={{ color: c.accent }} />
                  </motion.div>
                  <div>
                    <h3 className="text-[22px] font-black mb-2" style={{ color: c.primary }}>Order Received!</h3>
                    <p className="text-[14px] leading-relaxed" style={{ color: c.primary + "99" }}>
                      Your order has been placed and is being processed by our team.
                    </p>
                  </div>
                  <button
                    onClick={onClose}
                    className="px-10 py-3.5 rounded-2xl font-black text-[14px] hover:opacity-90 transition-opacity shadow-md"
                    style={{ backgroundColor: c.accent, color: c.secondary }}
                  >
                    Back to Menu
                  </button>
                </div>

              ) : step === "cart" ? (
                /* ─── Cart ────────────────────────────────────────────── */
                <>
                  <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-3">
                    {cartItems.length === 0 ? (
                      <div className="flex-1 flex flex-col items-center justify-center py-16 gap-3" style={{ color: c.primary + "4D" }}>
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
                            <div className="flex items-center gap-4 rounded-2xl p-4 border" style={{ backgroundColor: c.bg, borderColor: c.primary + "14" }}>
                              <div className="flex-1 min-w-0">
                                <p className="font-bold text-[14px] leading-tight truncate" style={{ color: c.primary }}>{item.name}</p>
                                {item.size_label && (
                                  <p className="text-[12px] font-medium mt-0.5" style={{ color: c.primary + "80" }}>{item.size_label}</p>
                                )}
                                <p className="font-black text-[14px] mt-1" style={{ color: c.accent }}>
                                  ₱{(item.price * item.qty).toFixed(2)}
                                </p>
                              </div>
                              <div className="flex items-center gap-2 rounded-xl p-1" style={{ backgroundColor: c.primary + "0D" }}>
                                <button
                                  onClick={() => item.qty <= 1 ? removeFromCart(item.id) : updateQuantity(item.id, item.qty - 1)}
                                  className="w-7 h-7 flex items-center justify-center rounded-lg transition-colors hover:bg-black/5"
                                  style={{ color: c.primary }}
                                >
                                  {item.qty <= 1 ? <Trash2 size={13} className="text-red-400" /> : <Minus size={13} />}
                                </button>
                                <span className="w-5 text-center font-black text-[13px]" style={{ color: c.primary }}>{item.qty}</span>
                                <button
                                  onClick={() => updateQuantity(item.id, item.qty + 1)}
                                  className="w-7 h-7 flex items-center justify-center rounded-lg transition-colors hover:bg-black/5"
                                  style={{ color: c.primary }}
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
                    <div className="px-6 pb-6 pt-4 border-t flex flex-col gap-4" style={{ borderTopColor: c.primary + "1A" }}>
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-[14px]" style={{ color: c.primary + "99" }}>Total</span>
                        <span className="font-black text-[22px]" style={{ color: c.primary }}>₱{cartTotal.toFixed(2)}</span>
                      </div>
                      <button
                        onClick={() => setStep("payment")}
                        className="w-full py-4 rounded-2xl font-black text-[15px] hover:opacity-90 transition-opacity shadow-md"
                        style={{ backgroundColor: c.primary, color: c.bg }}
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
                    <p className="text-[13px] font-medium" style={{ color: c.primary + "99" }}>Choose your payment method</p>
                    <div className="flex flex-col gap-3">
                      {paymentMethods
                        .filter(pm => {
                          if (pm.id === "Cash-on-Delivery") return settings?.cod_enabled !== false;
                          if (pm.id === "QR Code") return settings?.qr_enabled !== false;
                          return true;
                        })
                        .map((pm) => (
                          <button
                            key={pm.id}
                            onClick={() => setPaymentMethod(pm.id)}
                            className="flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left"
                            style={paymentMethod === pm.id ? { borderColor: c.primary, backgroundColor: c.primary + "0D" } : { borderColor: c.primary + "26", backgroundColor: c.bg }}
                          >
                            <div 
                              className="w-10 h-10 rounded-xl flex items-center justify-center"
                              style={paymentMethod === pm.id ? { backgroundColor: c.primary, color: c.accent } : { backgroundColor: c.primary + "14", color: c.primary + "99" }}
                            >
                              {pm.icon}
                            </div>
                            <span 
                              className="font-bold text-[15px]"
                              style={{ color: paymentMethod === pm.id ? c.primary : c.primary + "99" }}
                            >
                              {pm.label}
                            </span>
                            {paymentMethod === pm.id && (
                              <div className="ml-auto w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: c.primary }}>
                                <div className="w-2 h-2 rounded-full bg-white" />
                              </div>
                            )}
                          </button>
                        ))}
                    </div>

                    {/* GCash QR & Upload */}
                    {paymentMethod === "QR Code" && settings?.gcash_qr_url && (
                      <div className="flex flex-col gap-4 p-5 bg-blue-50 rounded-[24px] border border-blue-100 items-center text-center">
                        <p className="text-blue-800 text-[13px] font-bold">Scan QR to Pay via GCash</p>
                        <div className="w-48 h-48 bg-white p-2 rounded-2xl shadow-sm">
                          <img src={settings.gcash_qr_url} alt="GCash QR" className="w-full h-full object-contain" />
                        </div>
                        <div className="w-full h-px bg-blue-200" />
                        <div className="w-full text-left">
                          <p className="text-blue-800 text-[11px] font-black uppercase tracking-wider mb-2">Upload Proof of Payment</p>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => setPopFile(e.target.files?.[0] || null)}
                            className="text-xs text-blue-900 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200"
                          />
                        </div>
                      </div>
                    )}

                    {/* Order Summary */}
                    <div className="rounded-2xl border p-4 mt-2" style={{ backgroundColor: c.bg, borderColor: c.primary + "1A" }}>
                      <p className="text-[11px] font-black uppercase tracking-wider mb-3" style={{ color: c.primary + "80" }}>Order Summary</p>
                      {cartItems.map((item) => (
                        <div key={item.id} className="flex justify-between items-center py-1.5 border-b last:border-0" style={{ borderBottomColor: c.primary + "0D" }}>
                          <span className="text-[13px] font-medium" style={{ color: c.primary }}>
                            {item.qty}× {item.name}{item.size_label ? ` (${item.size_label})` : ""}
                          </span>
                          <span className="text-[13px] font-bold" style={{ color: c.primary }}>₱{(item.price * item.qty).toFixed(2)}</span>
                        </div>
                      ))}
                      <div className="flex justify-between items-center pt-3 mt-1">
                        <span className="text-[14px] font-black" style={{ color: c.primary }}>Total</span>
                        <span className="text-[18px] font-black" style={{ color: c.accent }}>₱{cartTotal.toFixed(2)}</span>
                      </div>
                    </div>

                    {/* Delivery / Customer Information */}
                    <div className="rounded-2xl border p-4" style={{ backgroundColor: c.bg, borderColor: c.primary + "1A" }}>
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ backgroundColor: c.primary + "1A" }}>
                          <User size={13} style={{ color: c.primary }} />
                        </div>
                        <p className="text-[11px] font-black uppercase tracking-wider" style={{ color: c.primary + "80" }}>Customer Information</p>
                      </div>

                      {userProfile ? (
                        <div className="flex flex-col gap-2.5">
                          {/* Full Name */}
                          <div className="flex items-start gap-3">
                            <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5" style={{ backgroundColor: c.primary + "0F" }}>
                              <User size={12} style={{ color: c.primary + "99" }} />
                            </div>
                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: c.primary + "66" }}>Full Name</p>
                              <p className="text-[13px] font-semibold leading-snug" style={{ color: c.primary }}>{getFullName(userProfile)}</p>
                            </div>
                          </div>

                          {/* Email */}
                          {userProfile.email && (
                            <div className="flex items-start gap-3">
                              <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5" style={{ backgroundColor: c.primary + "0F" }}>
                                <Mail size={12} style={{ color: c.primary + "99" }} />
                              </div>
                              <div>
                                <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: c.primary + "66" }}>Email</p>
                                <p className="text-[13px] font-semibold leading-snug break-all" style={{ color: c.primary }}>{userProfile.email}</p>
                              </div>
                            </div>
                          )}

                          {/* Contact Number */}
                          {userProfile.contact_number && (
                            <div className="flex items-start gap-3">
                              <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5" style={{ backgroundColor: c.primary + "0F" }}>
                                <Phone size={12} style={{ color: c.primary + "99" }} />
                              </div>
                              <div>
                                <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: c.primary + "66" }}>Contact Number</p>
                                <p className="text-[13px] font-semibold leading-snug" style={{ color: c.primary }}>{userProfile.contact_number}</p>
                              </div>
                            </div>
                          )}

                          {/* Address */}
                          {userProfile.address && (
                            <div className="flex items-start gap-3">
                              <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5" style={{ backgroundColor: c.primary + "0F" }}>
                                <MapPin size={12} style={{ color: c.primary + "99" }} />
                              </div>
                              <div>
                                <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: c.primary + "66" }}>Address</p>
                                <p className="text-[13px] font-semibold leading-snug" style={{ color: c.primary }}>{userProfile.address}</p>
                              </div>
                            </div>
                          )}

                          {/* Warn if some fields are missing */}
                          {(!userProfile.contact_number || !userProfile.address) && (
                            <p className="text-amber-600/70 text-[11px] font-medium mt-1 leading-snug">
                              ⚠ Some details are missing. Please update your profile so we can reach you.
                            </p>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2" style={{ color: c.primary + "66" }}>
                          <Loader2 size={14} className="animate-spin" />
                          <span className="text-[12px] font-medium">Loading your information…</span>
                        </div>
                      )}
                    </div>

                    {error && (
                      <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-600 text-[13px] font-medium">
                        {error}
                      </div>
                    )}
                  </div>

                  <div className="px-6 pb-6 pt-4 border-t flex flex-col gap-3" style={{ borderTopColor: c.primary + "1A" }}>
                    <button
                      onClick={handlePlaceOrder}
                      disabled={placing}
                      className="w-full py-4 rounded-2xl font-black text-[15px] hover:opacity-90 transition-opacity shadow-md flex items-center justify-center gap-2 disabled:opacity-60"
                      style={{ backgroundColor: c.primary, color: c.bg }}
                    >
                      {placing ? (
                        <><Loader2 size={18} className="animate-spin" /> Placing Order…</>
                      ) : (
                        <>Place Order · ₱{cartTotal.toFixed(2)}</>
                      )}
                    </button>
                    <button onClick={() => setStep("cart")} className="font-bold text-[13px] transition-colors" style={{ color: c.primary + "80" }}>
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
