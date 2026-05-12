"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, 
  Package, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  ChevronRight, 
  Search,
  RefreshCcw,
  ShoppingBag
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";


// --- Types ---
interface OrderItem {
  item_name: string;
  quantity: number;
  unit_price: number;
  size_label: string | null;
}

interface Order {
  order_id: string;
  fulfillment_status: string;
  total_amount: number;
  created_at: string;
  items: OrderItem[];
}

export default function CustomerOrdersPage() {
  const params = useParams();
  const router = useRouter();
  const businessName = params?.businessName as string;
  const supabase = createClient();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchOrders = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("orders")
      .select(`
        order_id, 
        fulfillment_status, 
        total_amount, 
        created_at,
        order_items (item_name, quantity, unit_price, size_label)
      `)
      .eq("customer_id", user.id)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setOrders(data.map((o: any) => ({
        order_id: o.order_id,
        fulfillment_status: o.fulfillment_status,
        total_amount: Number(o.total_amount),
        created_at: o.created_at,
        items: o.order_items || []
      })));
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Pending": return "text-amber-500 bg-amber-50 border-amber-100";
      case "Processing": return "text-blue-500 bg-blue-50 border-blue-100";
      case "Dispatched": return "text-purple-500 bg-purple-50 border-purple-100";
      case "Received": return "text-green-500 bg-green-50 border-green-100";
      case "Cancelled": return "text-red-500 bg-red-50 border-red-100";
      default: return "text-gray-500 bg-gray-50 border-gray-100";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Pending": return <Clock size={14} />;
      case "Processing": return <RefreshCcw size={14} className="animate-spin-slow" />;
      case "Dispatched": return <Package size={14} />;
      case "Received": return <CheckCircle2 size={14} />;
      case "Cancelled": return <XCircle size={14} />;
      default: return null;
    }
  };

  const filteredOrders = orders.filter(o => 
    o.order_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.items.some(i => i.item_name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-[#FFFCEB] font-['Fredoka'] text-[#385E31]">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#385E31] text-[#F7B71D] px-6 py-4 shadow-lg">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => router.back()}
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
            >
              <ArrowLeft size={24} />
            </button>
            <h1 className="text-2xl font-bold">My Orders</h1>
          </div>
          <div className="w-10 h-10 rounded-full bg-[#F7B71D]/20 flex items-center justify-center border border-[#F7B71D]/30">
            <Package size={20} />
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Search & Filter */}
        <div className="relative mb-8">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#385E31]/40" size={20} />
          <input 
            type="text"
            placeholder="Search orders by ID or items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-[#385E31]/10 rounded-2xl pl-12 pr-6 py-4 text-[15px] shadow-sm focus:ring-2 focus:ring-[#F7B71D] outline-none transition-all"
          />
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-12 h-12 border-4 border-[#385E31]/10 border-t-[#F7B71D] rounded-full animate-spin" />
            <p className="text-[#8C9B85]">Loading your history...</p>
          </div>
        ) : filteredOrders.length > 0 ? (
          <div className="flex flex-col gap-6">
            <AnimatePresence>
              {filteredOrders.map((order, idx) => (
                <motion.div
                  key={order.order_id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-white border border-[#385E31]/10 rounded-[24px] overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
                >
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex flex-col gap-1">
                        <span className="text-[12px] font-bold text-[#8C9B85] uppercase tracking-wider">
                          Order #{order.order_id.slice(0, 8)}
                        </span>
                        <span className="text-[13px] text-[#385E31]/60 font-medium">
                          {new Date(order.created_at).toLocaleString('en-US', { month: 'short', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }).replace(',', ' •')}
                        </span>
                      </div>
                      <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-[12px] font-bold ${getStatusColor(order.fulfillment_status)}`}>
                        {getStatusIcon(order.fulfillment_status)}
                        {order.fulfillment_status}
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 mb-6">
                      {order.items.map((item, i) => (
                        <div key={i} className="flex justify-between items-center text-[14px]">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 bg-[#385E31]/5 rounded flex items-center justify-center font-bold text-[11px]">
                              {item.quantity}x
                            </span>
                            <span className="font-semibold">{item.item_name}</span>
                            {item.size_label && (
                              <span className="text-[11px] bg-[#F7B71D]/10 text-[#385E31] px-1.5 py-0.5 rounded uppercase font-bold">
                                {item.size_label}
                              </span>
                            )}
                          </div>
                          <span className="font-bold">₱{(item.unit_price * item.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex justify-between items-center pt-4 border-t border-[#385E31]/5">
                      <div className="flex flex-col">
                        <span className="text-[12px] text-[#8C9B85] font-bold uppercase">Total Amount</span>
                        <span className="text-[22px] font-black text-[#385E31]">₱{order.total_amount.toFixed(2)}</span>
                      </div>
                      <button className="flex items-center gap-2 text-[#385E31] font-bold text-[14px] hover:text-[#F7B71D] transition-colors">
                        View Details <ChevronRight size={18} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
            <div className="w-20 h-20 bg-[#385E31]/5 rounded-full flex items-center justify-center text-[#385E31]/20">
              <ShoppingBag size={48} />
            </div>
            <div>
              <h3 className="text-xl font-bold">No orders found</h3>
              <p className="text-[#8C9B85] text-sm mt-1">Looks like you haven't placed any orders yet.</p>
            </div>
            <button 
              onClick={() => router.push(`/${businessName}/customer/food-and-beverage/storefront`)}
              className="mt-4 bg-[#385E31] text-[#F7B71D] px-8 py-3 rounded-full font-bold hover:bg-[#2A4725] transition-colors"
            >
              Start Shopping
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
