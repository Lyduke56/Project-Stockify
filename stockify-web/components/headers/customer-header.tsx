"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, useParams } from "next/navigation";
import {
  ShoppingBag,
  ShoppingCart,
  Search,
  Heart,
  User,
  Bell,
  MapPin,
  LogOut,
  Package,
  Settings,
  X
} from "lucide-react";
import { useCart } from "@/lib/customer/cart-context";
import { createClient } from "@/lib/supabase/client";

interface Notification {
  id: string;
  title: string;
  message: string;
  created_at: string;
  is_read: boolean;
}

interface CustomerHeaderProps {
  businessName: string;
  tenantLogo?: string;
  tenantName?: string;
  onSearch?: (query: string) => void;
  showSearch?: boolean;
}

export function CustomerHeader({ 
  businessName, 
  tenantLogo, 
  tenantName,
  onSearch,
  showSearch = true
}: CustomerHeaderProps) {
  const router = useRouter();
  const supabase = createClient();
  const { cartCount } = useCart();

  const [isScrolled, setIsScrolled] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const fetchNotifications = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // We'll try to fetch from customer_notifications
    // If table doesn't exist yet, we'll handle it gracefully
    try {
      const { data, error } = await supabase
        .from("customer_notifications")
        .select("*")
        .eq("customer_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10);

      if (!error && data) {
        setNotifications(data);
        setUnreadCount(data.filter(n => !n.is_read).length);
      }
    } catch (e) {
      console.log("Notification table not found or error:", e);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Poll every 30 seconds for new notifications
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const markAsRead = async (id: string) => {
    const { error } = await supabase
      .from("customer_notifications")
      .update({ is_read: true })
      .eq("id", id);
    
    if (!error) {
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push(`/${businessName}/login`);
  };

  return (
    <header
      className={`w-full sticky top-0 z-50 transition-all duration-300 ${
        isScrolled ? "bg-[#385E31] shadow-lg" : "bg-[#385E31]"
      }`}
    >
      <div className="w-full max-w-[1470px] mx-auto px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center gap-4">
        {/* Logo Section */}
        <motion.div
          onClick={() => router.push(`/${businessName}/customer/food-and-beverage/storefront`)}
          whileHover={{ scale: 1.02 }}
          className="flex items-center gap-3 cursor-pointer min-w-max"
        >
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#F7B71D]/10 rounded-xl flex items-center justify-center text-[#F7B71D]">
            {tenantLogo ? (
              <img src={tenantLogo} alt={tenantName} className="w-full h-full object-cover rounded-xl" />
            ) : (
              <ShoppingBag size={28} strokeWidth={2.5} />
            )}
          </div>
          <div className="hidden sm:flex flex-col">
            <h1 className="text-[#F7B71D] text-[18px] sm:text-[20px] font-extrabold tracking-wide uppercase leading-tight">
              {tenantName ?? businessName?.replace(/-/g, " ")}
            </h1>
            <p className="text-[#F7B71D]/80 text-[11px] font-medium flex items-center gap-1">
              <MapPin size={10} /> Cebu City, PH
            </p>
          </div>
        </motion.div>

        {/* Search Bar */}
        {showSearch && (
          <div className="flex-1 max-w-2xl hidden md:flex items-center relative group">
            <Search className="absolute left-4 text-[#FFFCEB]/50 group-focus-within:text-[#F7B71D] transition-colors" size={18} />
            <input
              type="text"
              onChange={(e) => onSearch?.(e.target.value)}
              placeholder="Search for coffee, pastries..."
              className="w-full bg-[#2A4725]/50 border border-[#FFFCEB]/10 rounded-[12px] pl-11 pr-4 py-2.5 text-[14px] text-[#FFFCEB] placeholder:text-[#FFFCEB]/50 focus:outline-none focus:border-[#F7B71D]/50 focus:bg-[#2A4725] transition-all"
            />
          </div>
        )}

        {/* Actions Section */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Notification Bell */}
          <div className="relative">
            <motion.button
              onClick={() => setShowNotifications(!showNotifications)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`w-10 h-10 rounded-[10px] flex items-center justify-center text-[#F7B71D] hover:bg-[#F7B71D]/10 transition-colors ${showNotifications ? 'bg-[#F7B71D]/10' : ''}`}
            >
              <Bell size={22} />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[9px] font-black flex items-center justify-center rounded-full border-2 border-[#385E31]">
                  {unreadCount}
                </span>
              )}
            </motion.button>

            <AnimatePresence>
              {showNotifications && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-3 w-80 bg-[#FFFCEB] border border-[#385E31]/10 rounded-2xl shadow-2xl z-50 overflow-hidden"
                  >
                    <div className="p-4 border-b border-[#385E31]/5 flex justify-between items-center">
                      <h3 className="font-bold text-[#385E31]">Notifications</h3>
                      {unreadCount > 0 && (
                        <span className="text-[10px] font-black bg-[#F7B71D]/20 text-[#385E31] px-2 py-0.5 rounded-full">
                          {unreadCount} NEW
                        </span>
                      )}
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {notifications.length > 0 ? (
                        notifications.map((n) => (
                          <div 
                            key={n.id}
                            onClick={() => { markAsRead(n.id); setShowNotifications(false); router.push(`/${businessName}/customer/orders`); }}
                            className={`p-4 border-b border-[#385E31]/5 hover:bg-[#F7B71D]/5 cursor-pointer transition-colors relative ${!n.is_read ? 'bg-[#F7B71D]/5' : ''}`}
                          >
                            {!n.is_read && <div className="absolute left-1 top-1/2 -translate-y-1/2 w-1 h-8 bg-[#F7B71D] rounded-full" />}
                            <p className="text-[14px] font-bold text-[#385E31] mb-1">{n.title}</p>
                            <p className="text-[12px] text-[#385E31]/70 line-clamp-2">{n.message}</p>
                            <p className="text-[10px] text-[#8C9B85] mt-2 font-medium">
                              {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        ))
                      ) : (
                        <div className="p-8 text-center flex flex-col items-center gap-2">
                          <Bell size={32} className="text-[#385E31]/10" />
                          <p className="text-[13px] text-[#8C9B85] font-medium">All caught up!</p>
                        </div>
                      )}
                    </div>
                    <button 
                      onClick={() => { setShowNotifications(false); router.push(`/${businessName}/customer/orders`); }}
                      className="w-full p-3 text-center text-[12px] font-bold text-[#385E31] bg-[#F7B71D]/10 hover:bg-[#F7B71D]/20 transition-colors"
                    >
                      View All Orders
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {/* Cart */}
          <motion.button
            onClick={() => router.push(`/${businessName}/customer/food-and-beverage/storefront?checkout=true`)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-10 h-10 rounded-[10px] flex items-center justify-center text-[#F7B71D] hover:bg-[#F7B71D]/10 relative"
          >
            <ShoppingCart size={22} />
            {cartCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-[#F7B71D] text-[#385E31] text-[10px] font-bold flex items-center justify-center rounded-full border border-[#385E31]">
                {cartCount}
              </span>
            )}
          </motion.button>

          {/* User Profile Menu */}
          <div className="relative">
            <motion.button
              onClick={() => setShowUserMenu(!showUserMenu)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`w-10 h-10 border-2 border-[#F7B71D]/50 hover:border-[#F7B71D] rounded-[10px] flex items-center justify-center text-[#F7B71D] bg-[#2A4725]/30 ml-2 transition-all ${showUserMenu ? 'scale-110 border-[#F7B71D]' : ''}`}
            >
              <User size={18} />
            </motion.button>

            <AnimatePresence>
              {showUserMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-3 w-56 bg-[#FFFCEB] border border-[#385E31]/10 rounded-2xl shadow-2xl z-50 overflow-hidden"
                  >
                    <div className="p-2">
                      <MenuButton 
                        icon={<User size={16} />} 
                        label="My Profile" 
                        onClick={() => { setShowUserMenu(false); router.push(`/${businessName}/customer/profile`); }} 
                      />
                      <MenuButton 
                        icon={<Package size={16} />} 
                        label="Order History" 
                        onClick={() => { setShowUserMenu(false); router.push(`/${businessName}/customer/orders`); }} 
                      />
                      <MenuButton 
                        icon={<Heart size={16} />} 
                        label="My Favorites" 
                        onClick={() => { setShowUserMenu(false); }} 
                      />
                      <div className="h-px bg-[#385E31]/5 my-2" />
                      <button 
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-[14px] font-bold text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                      >
                        <LogOut size={16} /> Sign Out
                      </button>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  );
}

function MenuButton({ icon, label, onClick }: { icon: React.ReactNode, label: string, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-2.5 text-[14px] font-bold text-[#385E31] hover:bg-[#F7B71D]/10 rounded-xl transition-colors"
    >
      <span className="text-[#F7B71D]">{icon}</span>
      {label}
    </button>
  );
}
