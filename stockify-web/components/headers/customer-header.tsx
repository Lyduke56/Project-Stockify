"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, useParams, usePathname } from "next/navigation";
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
import { confirmOrderReceipt, reportOrderUnreceived } from "@/lib/employee/order-actions";
import { AlertCircle, AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";

interface Notification {
  id: string;
  title: string;
  message: string;
  created_at: string;
  is_read: boolean;
  order_id?: string;
  notification_type?: string;
}

interface CustomerHeaderProps {
  businessName: string;
  tenantLogo?: string;
  tenantName?: string;
  onSearch?: (query: string) => void;
  showSearch?: boolean;
  showCart?: boolean;
  isNfnb?: boolean;
  colors?: {
    primary: string;
    secondary: string;
    accent: string;
    bg: string;
    text: string;
    search_bar?: string;
  };
}

export function CustomerHeader({
  businessName,
  tenantLogo,
  tenantName,
  onSearch,
  showSearch = true,
  showCart = true,
  isNfnb: propIsNfnb,
  colors
}: CustomerHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();
  const { cartCount } = useCart();

  // Determine the current business category path (fnb or nfnb)
  const isNfnb = propIsNfnb !== undefined ? propIsNfnb : pathname.includes("non-food-and-beverage");
  const categoryPath = isNfnb ? "non-food-and-beverage" : "food-and-beverage";

  const [isScrolled, setIsScrolled] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [reportingOrder, setReportingOrder] = useState<{ id: string, order_id: string } | null>(null);

  const c = colors || {
    primary: "#385E31",
    secondary: "#2A4725",
    accent: "#F7B71D",
    bg: "#FFFCEB",
    text: "#3A6131"
  };

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
        setUnreadCount(data.filter((n: any) => !n.is_read).length);
      }
    } catch (e) {
      console.log("Notification table not found or error:", e);
    }
  };

  useEffect(() => {
    let channel: any;
    let isMounted = true;

    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !isMounted) return;

      // Initial fetch
      fetchNotifications();

      // Subscribe to real-time changes
      const channelName = `notifs_${user.id}`;
      console.log(`[Realtime] Subscribing to customer_notifications for user ${user.id}`);

      // Pre-emptively remove existing channel with same name to avoid "already subscribed" errors
      await supabase.removeChannel(supabase.channel(channelName));

      if (!isMounted) return;

      channel = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'customer_notifications',
          },
          (payload: any) => {
            console.log('[Realtime] New row detected:', payload);
            if (isMounted && payload.new.customer_id === user.id) {
              const newNotif = payload.new as Notification;
              setNotifications((prev: Notification[]) => [newNotif, ...prev].slice(0, 10));
              setUnreadCount((prev: number) => prev + 1);
            }
          }
        )
        .subscribe((status: any) => {
          console.log(`[Realtime] Subscription status for user ${user.id}:`, status);
        });
    };

    init();

    const pollInterval = setInterval(fetchNotifications, 30000); // Poll every 30s as backup

    return () => {
      isMounted = false;
      if (channel) {
        console.log('[Realtime] Unsubscribing...');
        supabase.removeChannel(channel);
      }
      clearInterval(pollInterval);
    };
  }, []);

  const updateNotificationDB = async (id: string, type: string, title: string, message: string) => {
    try {
      const { error } = await supabase
        .from("customer_notifications")
        .update({
          is_read: true,
          notification_type: type,
          title: title,
          message: message
        })
        .eq("id", id);
      if (error) console.error("[updateNotificationDB] Error:", error);
    } catch (e) {
      console.error("[updateNotificationDB] Exception:", e);
    }
  };

  const markAsRead = async (id: string) => {
    const { error } = await supabase
      .from("customer_notifications")
      .update({ is_read: true })
      .eq("id", id);

    if (!error) {
      setNotifications((prev: Notification[]) => prev.map((n: Notification) => n.id === id ? { ...n, is_read: true } : n));
      setUnreadCount((prev: number) => Math.max(0, prev - 1));
    }
  };

  const handleConfirmReceived = async (notifId: string, orderId: string) => {
    const { error } = await confirmOrderReceipt(orderId);
    if (!error) {
      const newTitle = "Order Received";
      const newMessage = `Order #${orderId.slice(0, 8).toUpperCase()} - Received`;
      await updateNotificationDB(notifId, 'ORDER_RECEIVED', newTitle, newMessage);
      setNotifications((prev: Notification[]) => prev.map((n: Notification) =>
        n.id === notifId ? {
          ...n,
          notification_type: 'ORDER_RECEIVED',
          is_read: true,
          title: newTitle,
          message: newMessage
        } : n
      ));
      router.refresh();
    } else {
      console.error("Confirm Receipt Error:", error);
      alert("Failed to confirm receipt: " + (typeof error === 'string' ? error : JSON.stringify(error)));
    }
  };

  const handleReportUnreceived = async (notifId: string, orderId: string, reason: string) => {
    const { error } = await reportOrderUnreceived(orderId, reason);
    if (!error) {
      const newTitle = "Issue Reported";
      const newMessage = `Order #${orderId.slice(0, 8).toUpperCase()} - Reported`;
      await updateNotificationDB(notifId, 'ORDER_REPORTED', newTitle, newMessage);
      setNotifications((prev: Notification[]) => prev.map((n: Notification) =>
        n.id === notifId ? {
          ...n,
          notification_type: 'ORDER_REPORTED',
          is_read: true,
          title: newTitle,
          message: newMessage
        } : n
      ));
      setReportingOrder(null);
      router.refresh();
    } else {
      console.error("Report Issue Error:", error);
      alert("Failed to report issue: " + (typeof error === 'string' ? error : JSON.stringify(error)));
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push(`/${businessName}/login`);
  };

  return (
    <header
      className={`w-full sticky top-0 z-50 transition-all duration-300 ${isScrolled ? "shadow-lg" : ""}`}
      style={{ backgroundColor: c.primary }}
    >
      <div className="w-full max-w-[1470px] mx-auto px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center gap-4">
        {/* Logo Section */}
        <motion.div
          onClick={() => router.push(`/${businessName}/customer/${categoryPath}/storefront`)}
          whileHover={{ scale: 1.02 }}
          className="flex items-center gap-3 cursor-pointer min-w-max"
        >
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: c.accent + "1A", color: c.accent }}>
            {tenantLogo ? (
              <img src={tenantLogo} alt={tenantName} className="w-full h-full object-cover rounded-xl" />
            ) : (
              <ShoppingBag size={28} strokeWidth={2.5} />
            )}
          </div>
          <div className="hidden sm:flex flex-col">
            <h1 className="text-[18px] sm:text-[20px] font-extrabold tracking-wide uppercase leading-tight"
              style={{ color: c.accent }}>
              {tenantName ?? businessName?.replace(/-/g, " ")}
            </h1>
            <p className="text-[11px] font-medium flex items-center gap-1" style={{ color: c.accent + "CC" }}>
              <MapPin size={10} /> Cebu City, PH
            </p>
          </div>
        </motion.div>

        {/* Search Bar */}
        {showSearch && (
          <div className="flex-1 max-w-2xl hidden md:flex items-center relative group">
            <Search className="absolute left-4 transition-colors" size={18} style={{ color: c.bg + "80" }} />
            <input
              type="text"
              onChange={(e) => onSearch?.(e.target.value)}
              placeholder="Search for coffee, pastries..."
              className="w-full border rounded-[12px] pl-11 pr-4 py-2.5 text-[14px] focus:outline-none transition-all placeholder-opacity-50"
              style={{ backgroundColor: (c as any).search_bar || c.secondary + "80", borderColor: c.bg + "1A", color: c.bg }}
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
              className={`w-10 h-10 rounded-[10px] flex items-center justify-center transition-colors`}
              style={{ color: c.accent, backgroundColor: showNotifications ? c.accent + "1A" : "transparent" }}
            >
              <Bell size={22} />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 text-white text-[9px] font-black flex items-center justify-center rounded-full border-2"
                  style={{ backgroundColor: "red", borderColor: c.primary }}>
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
                    className="absolute right-0 mt-3 w-80 rounded-2xl shadow-2xl z-50 overflow-hidden border"
                    style={{ backgroundColor: c.bg, borderColor: c.primary + "1A" }}
                  >
                    <div className="p-4 flex justify-between items-center" style={{ borderBottom: `1px solid ${c.primary}0D` }}>
                      <h3 className="font-bold" style={{ color: c.primary }}>Notifications</h3>
                      {unreadCount > 0 && (
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full" style={{ backgroundColor: c.accent + "33", color: c.primary }}>
                          {unreadCount} NEW
                        </span>
                      )}
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {notifications.length > 0 ? (
                        notifications.map((n: Notification) => (
                          <div
                            key={n.id}
                            className="p-4 transition-colors relative cursor-pointer"
                            style={{
                              borderBottom: `1px solid ${c.primary}0D`,
                              backgroundColor: !n.is_read ? c.accent + "0D" : "transparent",
                            }}
                          >
                            {!n.is_read && <div className="absolute left-1 top-1/2 -translate-y-1/2 w-1 h-8 rounded-full" style={{ backgroundColor: c.accent }} />}
                            <div onClick={() => { markAsRead(n.id); setShowNotifications(false); router.push(`/${businessName}/customer/orders${n.order_id ? `?view_order=${n.order_id}` : ''}`); }}>
                              <p className="text-[14px] font-bold mb-1" style={{ color: c.primary }}>{n.title}</p>
                              <p className="text-[12px] line-clamp-2" style={{ color: c.primary + "B3" }}>{n.message}</p>
                            </div>

                            {(n.notification_type === 'ORDER_DISPATCHED' || n.notification_type === 'DELIVERY_IN_PROGRESS') && n.order_id && (
                              <div className="flex gap-2 mt-3">
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleConfirmReceived(n.id, n.order_id!); }}
                                  className="flex-1 py-2 rounded-lg text-[11px] font-black hover:opacity-90 transition-opacity"
                                  style={{ backgroundColor: c.primary, color: c.accent }}
                                >
                                  I HAVE RECEIVED IT
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); setReportingOrder({ id: n.id, order_id: n.order_id! }); setShowNotifications(false); }}
                                  className="flex-1 py-2 rounded-lg text-[11px] font-bold transition-colors"
                                  style={{ border: `1px solid ${c.primary}33`, color: c.primary }}
                                >
                                  REPORT ISSUE
                                </button>
                              </div>
                            )}

                            <p className="text-[10px] mt-2 font-medium" style={{ color: c.primary + "80" }}>
                              {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        ))
                      ) : (
                        <div className="p-8 text-center flex flex-col items-center gap-2">
                          <Bell size={32} style={{ color: c.primary + "1A" }} />
                          <p className="text-[13px] font-medium" style={{ color: c.primary + "80" }}>All caught up!</p>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => { setShowNotifications(false); router.push(`/${businessName}/customer/orders`); }}
                      className="w-full p-3 text-center text-[12px] font-bold transition-colors hover:opacity-80"
                      style={{ color: c.primary, backgroundColor: c.accent + "1A" }}
                    >
                      View All Orders
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {/* Cart */}
          {showCart && (
            <motion.button
              onClick={() => router.push(`/${businessName}/customer/${categoryPath}/storefront?checkout=true`)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-10 h-10 rounded-[10px] flex items-center justify-center hover:opacity-80 relative"
              style={{ color: c.accent }}
            >
              <ShoppingCart size={22} />
              {cartCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 text-[10px] font-bold flex items-center justify-center rounded-full border"
                  style={{ backgroundColor: c.accent, color: c.primary, borderColor: c.primary }}>
                  {cartCount}
                </span>
              )}
            </motion.button>
          )}

          {/* User Profile Menu */}
          <div className="relative">
            <motion.button
              onClick={() => setShowUserMenu(!showUserMenu)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`w-10 h-10 border-2 rounded-[10px] flex items-center justify-center ml-2 transition-all ${showUserMenu ? 'scale-110' : ''}`}
              style={{ color: c.accent, backgroundColor: c.secondary + "4D", borderColor: showUserMenu ? c.accent : c.accent + "80" }}
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
                    className="absolute right-0 mt-3 w-56 rounded-2xl shadow-2xl z-50 overflow-hidden border"
                    style={{ backgroundColor: c.bg, borderColor: c.primary + "1A" }}
                  >
                    <div className="p-2">
                      <MenuButton
                        icon={<User size={16} />}
                        label="My Profile"
                        onClick={() => { setShowUserMenu(false); router.push(`/${businessName}/customer/profile`); }}
                        c={c}
                      />
                      <MenuButton
                        icon={<Package size={16} />}
                        label="Order History"
                        onClick={() => { setShowUserMenu(false); router.push(`/${businessName}/customer/orders`); }}
                        c={c}
                      />
                      <div className="h-px my-2" style={{ backgroundColor: c.primary + "0D" }} />
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

      <ReportIssueModal
        isOpen={!!reportingOrder}
        onClose={() => setReportingOrder(null)}
        onConfirm={(reason) => reportingOrder && handleReportUnreceived(reportingOrder.id, reportingOrder.order_id, reason)}
        colors={c}
      />
    </header>
  );
}

function MenuButton({ icon, label, onClick, c }: { icon: React.ReactNode, label: string, onClick: () => void, c?: { primary: string; accent: string; bg: string } }) {
  const primary = c?.primary ?? "#385E31";
  const accent  = c?.accent  ?? "#F7B71D";
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-2.5 text-[14px] font-bold rounded-xl transition-colors"
      style={{ color: primary }}
      onMouseEnter={e => (e.currentTarget.style.backgroundColor = accent + "1A")}
      onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
    >
      <span style={{ color: accent }}>{icon}</span>
      {label}
    </button>
  );
}

function ReportIssueModal({ isOpen, onClose, onConfirm, colors }: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  colors?: { primary: string; accent: string; bg: string };
}) {
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const cl = colors ?? { primary: "#385E31", accent: "#F7B71D", bg: "#FFFCEB" };

  const handleSubmit = async () => {
    if (!reason.trim()) return;
    setBusy(true);
    await onConfirm(reason);
    setBusy(false);
    setReason("");
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200]"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 flex items-center justify-center p-4 z-[201] pointer-events-none"
          >
            <div className="w-full max-w-md rounded-[28px] overflow-hidden shadow-2xl pointer-events-auto p-6 flex flex-col gap-5" style={{ backgroundColor: cl.bg }}>
              <div className="flex items-center gap-3 text-red-600">
                <AlertTriangle size={24} />
                <h3 className="text-xl font-black">Report Unreceived Order</h3>
              </div>
              <p className="text-[14px] leading-relaxed" style={{ color: cl.primary + "B3" }}>
                Please describe the issue. Our team will investigate why your order hasn't arrived and get back to you shortly.
              </p>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Ex: The status says delivered but I haven't received anything at my door..."
                className="w-full h-32 rounded-2xl p-4 text-[14px] outline-none focus:border-red-500 transition-colors resize-none"
                style={{ backgroundColor: cl.bg, color: cl.primary, border: `1px solid ${cl.primary}1A` }}
              />
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 py-3.5 rounded-2xl font-bold text-[14px] hover:opacity-70 transition-opacity"
                  style={{ color: cl.primary + "99" }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={busy || !reason.trim()}
                  className="flex-1 bg-red-600 text-white py-3.5 rounded-2xl font-black text-[14px] hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {busy ? <Loader2 size={18} className="animate-spin" /> : <AlertCircle size={18} />}
                  Submit Report
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
