"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, Trash2, MapPin, Clock, Bike, Store, Info } from "lucide-react";

// --- Mock F&B Cart Data ---
const initialFBCart = [
  { id: 4, name: "Iced Caramel Latte", price: 195.00, qty: 1, image: "🧊", modifiers: ["Oat Milk (+₱30)", "Less Ice", "2 Pumps Vanilla"] },
  { id: 5, name: "Butter Croissant", price: 95.00, qty: 2, image: "🥐", modifiers: ["Warmed up"] },
];

export default function FBCartPage() {
  const [cartItems, setCartItems] = useState(initialFBCart);
  const [fulfillment, setFulfillment] = useState("delivery");
  const [isExpired, setIsExpired] = useState(false);
  const [schedule, setSchedule] = useState("ASAP");

  // Simulated Expiration Logic
  useEffect(() => {
    // In a real app, you would check a timestamp stored in localStorage
    // const cartTime = localStorage.getItem('fb_cart_time');
    // if (Date.now() - cartTime > 4 * 60 * 60 * 1000) { setCartItems([]); setIsExpired(true); }
  }, []);

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.qty, 0);
  const deliveryFee = fulfillment === "delivery" ? 45 : 0;
  const total = subtotal + deliveryFee;

  const removeItem = (id: number) => setCartItems(prev => prev.filter(item => item.id !== id));

  if (isExpired || cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-[#FFFCEB] flex flex-col items-center justify-center p-6 font-inter text-[#3A6131]">
        <Clock size={48} className="mb-4 opacity-30" />
        <h2 className="text-2xl font-black mb-2">Your tray is empty</h2>
        <p className="text-[#3A6131]/60 mb-6 text-center max-w-md">
          {isExpired ? "Your previous order session expired because our menu updated." : "Looks like you haven't added any food or drinks yet."}
        </p>
        <button className="bg-[#3A6131] text-[#FFFCEB] px-8 py-3 rounded-xl font-bold hover:opacity-90">Back to Menu</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFFCEB] font-inter text-[#3A6131] pb-24">
      {/* Header */}
      <header className="bg-white border-b border-[#3A6131]/10 sticky top-0 z-30">
        <div className="max-w-[1100px] mx-auto px-6 py-4 flex items-center justify-between">
          <button className="flex items-center gap-2 text-[#3A6131]/70 hover:text-[#3A6131] font-bold text-sm transition-colors">
            <ChevronLeft size={18} /> Menu
          </button>
          <h1 className="text-lg font-black uppercase tracking-wide">Review Order</h1>
          <div className="w-20" /> {/* Spacer */}
        </div>
      </header>

      <main className="max-w-[1100px] mx-auto px-4 sm:px-6 py-8 flex flex-col lg:flex-row gap-8">
        
        {/* Left Column: Items & Fulfillment */}
        <div className="flex-1 flex flex-col gap-6">
          
          {/* Fulfillment Card */}
          <div className="bg-white p-6 rounded-[24px] border border-[#3A6131]/10 shadow-sm">
            <div className="flex p-1 bg-[#3A6131]/5 rounded-[14px] mb-6">
              <button onClick={() => setFulfillment("delivery")} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-[10px] text-[14px] font-bold transition-all ${fulfillment === "delivery" ? 'bg-white text-[#3A6131] shadow-sm' : 'text-[#3A6131]/50'}`}><Bike size={18} /> Delivery</button>
              <button onClick={() => setFulfillment("pickup")} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-[10px] text-[14px] font-bold transition-all ${fulfillment === "pickup" ? 'bg-white text-[#3A6131] shadow-sm' : 'text-[#3A6131]/50'}`}><Store size={18} /> Pick-up</button>
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex items-start gap-3 p-4 rounded-xl border border-[#3A6131]/10 bg-[#FFFCEB]/50">
                <MapPin size={20} className="text-[#3A6131] mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs font-bold text-[#3A6131]/50 uppercase tracking-wider mb-1">{fulfillment === "delivery" ? "Deliver To" : "Pick Up From"}</p>
                  <p className="font-bold text-[15px]">{fulfillment === "delivery" ? "123 Mango Ave, Unit 4B" : "Lumina Cafe, Main Branch"}</p>
                </div>
                <button className="text-sm font-bold text-[#F7B71D] hover:underline">Edit</button>
              </div>

              <div className="flex items-start gap-3 p-4 rounded-xl border border-[#3A6131]/10 bg-[#FFFCEB]/50">
                <Clock size={20} className="text-[#3A6131] mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs font-bold text-[#3A6131]/50 uppercase tracking-wider mb-1">Time</p>
                  <select 
                    value={schedule} 
                    onChange={(e) => setSchedule(e.target.value)}
                    className="w-full bg-transparent font-bold text-[15px] focus:outline-none appearance-none cursor-pointer"
                  >
                    <option value="ASAP">ASAP (15-25 mins)</option>
                    <option value="12:00 PM">Today at 12:00 PM</option>
                    <option value="1:00 PM">Today at 1:00 PM</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Cart Items */}
          <div className="bg-white p-6 rounded-[24px] border border-[#3A6131]/10 shadow-sm">
            <h2 className="text-lg font-black mb-6 border-b border-[#3A6131]/10 pb-4">Your Items</h2>
            <div className="flex flex-col gap-6">
              <AnimatePresence>
                {cartItems.map((item) => (
                  <motion.div key={item.id} layout exit={{ opacity: 0, scale: 0.9, height: 0 }} className="flex gap-4">
                    <div className="w-20 h-20 rounded-2xl bg-[#FFFCEB] border border-[#3A6131]/10 flex items-center justify-center text-4xl">{item.image}</div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <h3 className="font-bold text-[16px] leading-tight">{item.qty}x {item.name}</h3>
                        <span className="font-black text-[16px]">₱{(item.price * item.qty).toFixed(2)}</span>
                      </div>
                      <ul className="mt-1 text-[13px] text-[#3A6131]/60 font-medium">
                        {item.modifiers.map((mod, i) => <li key={i}>• {mod}</li>)}
                      </ul>
                      <div className="flex mt-3">
                        <button onClick={() => removeItem(item.id)} className="text-red-500/70 hover:text-red-500 text-sm font-bold flex items-center gap-1"><Trash2 size={14}/> Remove</button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Right Column: Order Summary */}
        <div className="w-full lg:w-[380px]">
          <div className="bg-white p-6 rounded-[24px] border border-[#3A6131]/10 shadow-sm lg:sticky lg:top-24">
            <h2 className="text-lg font-black mb-6">Order Summary</h2>
            
            <div className="flex flex-col gap-3 text-[15px] font-medium text-[#3A6131]/80 border-b border-[#3A6131]/10 pb-6 mb-6">
              <div className="flex justify-between"><span>Subtotal</span><span className="font-bold text-[#3A6131]">₱{subtotal.toFixed(2)}</span></div>
              {fulfillment === "delivery" && <div className="flex justify-between"><span>Delivery Fee</span><span className="font-bold text-[#3A6131]">₱{deliveryFee.toFixed(2)}</span></div>}
            </div>

            {/* F&B Specific: Tip Jar */}
            <div className="mb-6">
              <p className="text-sm font-bold mb-3 flex items-center gap-2">Add a tip for the team?</p>
              <div className="grid grid-cols-4 gap-2">
                {['No Tip', '10%', '15%', '20%'].map(tip => (
                  <button key={tip} className="py-2.5 rounded-xl border border-[#3A6131]/20 text-[13px] font-bold hover:bg-[#FFD980] hover:border-[#F7B71D] transition-colors">{tip}</button>
                ))}
              </div>
            </div>

            <div className="flex justify-between items-center mb-6">
              <span className="text-xl font-black">Total</span>
              <span className="text-2xl font-black text-[#F7B71D] drop-shadow-sm">₱{total.toFixed(2)}</span>
            </div>

            <button className="w-full bg-[#3A6131] text-[#FFFCEB] py-4 rounded-xl font-black text-lg hover:opacity-90 transition-opacity shadow-lg">
              Place Order
            </button>
            <p className="text-[11px] text-center mt-4 text-[#3A6131]/50 flex items-center justify-center gap-1"><Info size={12}/> Orders cannot be cancelled once prepared.</p>
          </div>
        </div>
      </main>
    </div>
  );
}