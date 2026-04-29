"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, Trash2, Package, Truck, ShieldCheck, Tag, Minus, Plus, ShoppingBag } from "lucide-react";

// --- Mock Retail Cart Data ---
const initialRetailCart = [
  { id: 1, name: "Classic Denim Jacket", price: 2450.00, qty: 1, image: "🧥", variants: ["Size: L", "Color: Vintage Blue"] },
  { id: 2, name: "Everyday Cotton Tee", price: 550.00, qty: 2, image: "👕", variants: ["Size: M", "Color: Olive"] },
];

export default function RetailCartPage() {
  const [cartItems, setCartItems] = useState(initialRetailCart);
  const [shippingMethod, setShippingMethod] = useState("standard");
  const [promoCode, setPromoCode] = useState("");

  // Simulated Persistence Logic
  useEffect(() => {
    // Retail carts should load from localStorage with NO expiration check
    // const savedCart = localStorage.getItem('retail_cart');
    // if (savedCart) setCartItems(JSON.parse(savedCart));
  }, []);

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.qty, 0);
  // Free shipping threshold logic
  const shippingCost = subtotal >= 3000 ? 0 : (shippingMethod === "express" ? 150 : 80); 
  const total = subtotal + shippingCost;

  const updateQty = (id: number, delta: number) => {
    setCartItems(prev => prev.map(item => {
      if (item.id === id) return { ...item, qty: Math.max(1, item.qty + delta) };
      return item;
    }));
  };

  const removeItem = (id: number) => setCartItems(prev => prev.filter(item => item.id !== id));

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-[#FFFCEB] flex flex-col items-center justify-center p-6 font-inter text-[#3A6131]">
        <ShoppingBag size={48} className="mb-4 opacity-30" />
        <h2 className="text-2xl font-black mb-2">Your bag is empty</h2>
        <p className="text-[#3A6131]/60 mb-6 text-center">Looks like you haven't added anything to your bag yet.</p>
        <button className="bg-[#3A6131] text-[#FFFCEB] px-8 py-3 rounded-xl font-bold hover:opacity-90">Start Shopping</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFFCEB] font-inter text-[#3A6131] pb-24">
      {/* Header */}
      <header className="bg-white border-b border-[#3A6131]/10 sticky top-0 z-30">
        <div className="max-w-[1100px] mx-auto px-6 py-4 flex items-center justify-between">
          <button className="flex items-center gap-2 text-[#3A6131]/70 hover:text-[#3A6131] font-bold text-sm transition-colors">
            <ChevronLeft size={18} /> Back to Shop
          </button>
          <h1 className="text-lg font-black uppercase tracking-wide">Shopping Bag</h1>
          <div className="flex items-center gap-1 text-[13px] font-bold"><ShieldCheck size={16}/> Secure</div>
        </div>
      </header>

      <main className="max-w-[1100px] mx-auto px-4 sm:px-6 py-8 flex flex-col lg:flex-row gap-8">
        
        {/* Left Column: Items */}
        <div className="flex-1 flex flex-col gap-6">
          <div className="bg-white p-6 sm:p-8 rounded-[24px] border border-[#3A6131]/10 shadow-sm">
            <h2 className="text-xl font-black mb-6 border-b border-[#3A6131]/10 pb-4">Bag Details ({cartItems.length} items)</h2>
            
            <div className="flex flex-col gap-8">
              <AnimatePresence>
                {cartItems.map((item) => (
                  <motion.div key={item.id} layout exit={{ opacity: 0, height: 0 }} className="flex gap-4 sm:gap-6 border-b border-[#3A6131]/5 pb-8 last:border-0 last:pb-0">
                    <div className="w-24 h-32 sm:w-32 sm:h-40 rounded-2xl bg-[#FFFCEB] border border-[#3A6131]/10 flex items-center justify-center text-5xl sm:text-6xl">{item.image}</div>
                    
                    <div className="flex-1 flex flex-col">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-black text-[16px] sm:text-[18px] leading-tight pr-4">{item.name}</h3>
                        <span className="font-black text-[16px] sm:text-[18px]">₱{(item.price * item.qty).toFixed(2)}</span>
                      </div>
                      
                      <div className="flex flex-wrap gap-2 mb-4">
                        {item.variants.map((v, i) => (
                          <span key={i} className="bg-[#3A6131]/5 border border-[#3A6131]/10 px-2 py-1 rounded-md text-[12px] font-bold text-[#3A6131]/70">{v}</span>
                        ))}
                      </div>

                      <div className="mt-auto flex items-center justify-between">
                        <div className="flex items-center border-[1.5px] border-[#3A6131]/20 rounded-xl overflow-hidden bg-white h-[40px] w-[110px]">
                          <button onClick={() => updateQty(item.id, -1)} className="w-10 h-full flex items-center justify-center text-[#3A6131] hover:bg-[#3A6131]/10"><Minus size={14} /></button>
                          <span className="flex-1 text-center text-sm font-bold">{item.qty}</span>
                          <button onClick={() => updateQty(item.id, 1)} className="w-10 h-full flex items-center justify-center text-[#3A6131] hover:bg-[#3A6131]/10"><Plus size={14} /></button>
                        </div>
                        <button onClick={() => removeItem(item.id)} className="text-[#3A6131]/50 hover:text-red-500 text-[13px] font-bold underline">Remove</button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Right Column: Order Summary & Fulfillment */}
        <div className="w-full lg:w-[400px] flex flex-col gap-6">
          
          {/* Promo Code */}
          <div className="bg-white p-6 rounded-[24px] border border-[#3A6131]/10 shadow-sm">
            <h3 className="font-bold text-[15px] mb-3 flex items-center gap-2"><Tag size={16}/> Promo Code</h3>
            <div className="flex gap-2">
              <input type="text" placeholder="Enter discount code" value={promoCode} onChange={(e) => setPromoCode(e.target.value)} className="flex-1 border border-[#3A6131]/20 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#3A6131]" />
              <button className="bg-[#F7B71D] text-[#385E31] px-6 rounded-xl font-bold hover:opacity-90 transition-opacity">Apply</button>
            </div>
          </div>

          {/* Summary */}
          <div className="bg-white p-6 sm:p-8 rounded-[24px] border border-[#3A6131]/10 shadow-sm lg:sticky lg:top-24">
            <h2 className="text-xl font-black mb-6">Summary</h2>
            
            {/* Shipping Selector */}
            <div className="mb-6 border border-[#3A6131]/20 rounded-xl p-1 bg-[#3A6131]/5">
              <button onClick={() => setShippingMethod("standard")} className={`w-full flex justify-between items-center p-3 rounded-lg text-sm font-bold mb-1 transition-colors ${shippingMethod === "standard" ? "bg-white shadow-sm" : "hover:bg-white/50"}`}>
                <div className="flex items-center gap-2"><Truck size={16}/> Standard (3-5 Days)</div>
                <span>{subtotal >= 3000 ? "FREE" : "₱80.00"}</span>
              </button>
              <button onClick={() => setShippingMethod("express")} className={`w-full flex justify-between items-center p-3 rounded-lg text-sm font-bold transition-colors ${shippingMethod === "express" ? "bg-white shadow-sm" : "hover:bg-white/50"}`}>
                <div className="flex items-center gap-2"><Package size={16}/> Express (1-2 Days)</div>
                <span>₱150.00</span>
              </button>
            </div>

            <div className="flex flex-col gap-3 text-[15px] font-medium text-[#3A6131]/80 border-b border-[#3A6131]/10 pb-6 mb-6">
              <div className="flex justify-between"><span>Subtotal</span><span className="font-bold text-[#3A6131]">₱{subtotal.toFixed(2)}</span></div>
              <div className="flex justify-between"><span>Shipping</span><span className="font-bold text-[#3A6131]">{shippingCost === 0 ? "Free" : `₱${shippingCost.toFixed(2)}`}</span></div>
            </div>

            <div className="flex justify-between items-end mb-8">
              <span className="text-xl font-black">Total</span>
              <div className="text-right">
                <span className="text-[11px] text-[#3A6131]/60 font-bold uppercase block mb-1">Including VAT</span>
                <span className="text-3xl font-black text-[#F7B71D] drop-shadow-sm">₱{total.toFixed(2)}</span>
              </div>
            </div>

            <button className="w-full bg-[#3A6131] text-[#FFFCEB] py-4 rounded-xl font-black text-lg hover:opacity-90 transition-opacity shadow-lg">
              Proceed to Checkout
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}