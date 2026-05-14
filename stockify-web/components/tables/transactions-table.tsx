"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, RefreshCw, Loader2, ArrowUpDown, Receipt, Eye, X, Package, Clock, Truck, CheckCircle2, User, MapPin, Phone, Mail, Image as ImageIcon } from "lucide-react";
import { fetchTransactions, fetchOrderById, fetchOrderItems, logOrderView, type Transaction, type Order, type OrderItem } from "@/lib/employee/order-actions";
import { createClient } from "@/lib/supabase/client";

const COLUMNS = ["Transaction ID", "Order ID", "Date & Time", "Customer", "Items", "Payment", "Total", "Action"];

// ─── Transaction Detail Modal ──────────────────────────────────────────────────

function TransactionDetailModal({ orderId, onClose, tenantId }: { orderId: string, onClose: () => void, tenantId: string }) {
  const [order, setOrder] = useState<Order | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [ord, itms] = await Promise.all([
        fetchOrderById(orderId),
        fetchOrderItems(orderId)
      ]);
      setOrder(ord);
      setItems(itms);
      setLoading(false);
      
      // Log initial view
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

  return (
    <AnimatePresence>
      <motion.div 
        key="transaction-modal-backdrop"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
        className="fixed inset-0 w-screen h-screen bg-black/70 backdrop-blur-sm z-[999]" 
        onClick={onClose} 
      />
      <motion.div 
        key="transaction-modal-content"
        initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="fixed inset-0 z-[1000] flex items-center justify-center p-4 pointer-events-none"
      >
        <div className="bg-white rounded-[28px] w-full max-w-[500px] shadow-2xl pointer-events-auto overflow-hidden flex flex-col max-h-[90vh]">
          {/* Header */}
          <div className="bg-[#3A6131] px-6 py-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-white">
                <Receipt size={20} />
              </div>
              <div>
                <h2 className="text-white font-black text-[17px]">Transaction Receipt</h2>
                <p className="text-white/60 text-[11px] font-mono uppercase tracking-wider">Order #{orderId.slice(0,8)}</p>
              </div>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all"><X size={18} /></button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {loading ? (
              <div className="h-40 flex flex-center flex-col items-center justify-center gap-3">
                <Loader2 size={32} className="text-[#3A6131] animate-spin" />
                <p className="text-[12px] text-[#3A6131]/60 font-bold">Fetching Record...</p>
              </div>
            ) : order && (
              <>
                {/* Summary Cards */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                    <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Customer</p>
                    <p className="text-[14px] text-[#3A6131] font-black">{order.customer_name}</p>
                  </div>
                  <div className="bg-[#F7B71D]/10 rounded-2xl p-4 border border-[#F7B71D]/20 text-right">
                    <p className="text-[10px] text-[#8a6700] font-bold uppercase mb-1">Total Paid</p>
                    <p className="text-[18px] text-[#3A6131] font-black">₱{order.total_amount.toFixed(2)}</p>
                  </div>
                </div>

                {/* Proofs Section */}
                <div className="space-y-2">
                  <p className="text-[11px] text-gray-400 font-bold uppercase px-1">Verification Proofs</p>
                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      onClick={() => handleViewProof("PAYMENT")}
                      disabled={!order.proof_of_payment_url}
                      className={`flex items-center justify-between p-3 rounded-xl border transition-all ${order.proof_of_payment_url ? 'bg-white border-gray-200 hover:border-[#3A6131] group' : 'bg-gray-50 border-gray-100 opacity-50 cursor-not-allowed'}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-blue-500"><ImageIcon size={16} /></div>
                        <span className="text-[12px] font-bold text-gray-600">Payment</span>
                      </div>
                      {order.proof_of_payment_url && <Eye size={14} className="text-gray-300 group-hover:text-[#3A6131]" />}
                    </button>

                    <button 
                      onClick={() => handleViewProof("PROOFS")}
                      disabled={!order.delivery_proof_url}
                      className={`flex items-center justify-between p-3 rounded-xl border transition-all ${order.delivery_proof_url ? 'bg-white border-gray-200 hover:border-[#3A6131] group' : 'bg-gray-50 border-gray-100 opacity-50 cursor-not-allowed'}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center text-purple-500"><Truck size={16} /></div>
                        <span className="text-[12px] font-bold text-gray-600">Delivery</span>
                      </div>
                      {order.delivery_proof_url && <Eye size={14} className="text-gray-300 group-hover:text-[#3A6131]" />}
                    </button>
                  </div>
                </div>

                {/* Items List */}
                <div className="space-y-2 pt-2">
                  <p className="text-[11px] text-gray-400 font-bold uppercase px-1">Order Breakdown</p>
                  <div className="bg-gray-50 rounded-2xl overflow-hidden border border-gray-100">
                    {items.map((item, idx) => (
                      <div key={`${item.item_id}-${idx}`} className={`p-4 flex items-center justify-between ${idx !== items.length - 1 ? 'border-b border-gray-100' : ''}`}>
                        <div>
                          <p className="text-[13px] font-bold text-[#3A6131]">{item.item_name}</p>
                          <p className="text-[10px] text-gray-400 font-medium">Qty: {item.quantity} × ₱{item.unit_price.toFixed(2)}</p>
                        </div>
                        <p className="text-[13px] font-black text-[#3A6131]">₱{(item.quantity * item.unit_price).toFixed(2)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
          
          <div className="p-6 bg-gray-50/80 border-t border-gray-100">
             <button onClick={onClose} className="w-full py-3 bg-[#3A6131] text-white font-black rounded-xl hover:bg-[#2D4B26] transition-colors shadow-lg shadow-[#3A6131]/20">Close Receipt</button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

export default function TransactionsTable() {
  const [tenantId, setTenantId] = useState("");
  const [transactions, setTxns] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [sortAsc, setSortAsc] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  const loadTxns = useCallback(async (tid: string) => {
    const data = await fetchTransactions(tid);
    setTxns(data);
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    const init = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: u } = await supabase.from("users").select("tenant_id").eq("user_id", user.id).single();
      if (!u?.tenant_id) return;
      setTenantId(u.tenant_id);
      loadTxns(u.tenant_id);
    };
    init();
  }, [loadTxns]);

  const handleRefresh = () => { if (!tenantId) return; setRefreshing(true); loadTxns(tenantId); };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" }) +
      " " + d.toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" });
  };

  const filtered = transactions
    .filter((t) => {
      const q = search.toLowerCase();
      return (
        t.customer_name.toLowerCase().includes(q) ||
        t.transaction_id.toLowerCase().includes(q) ||
        t.order_id.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      const diff = new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime();
      return sortAsc ? -diff : diff;
    });

  const totalRevenue = transactions.reduce((s, t) => s + t.total_amount, 0);
  const avgOrder = transactions.length > 0 ? totalRevenue / transactions.length : 0;

  return (
    <div className="w-full flex flex-col font-['Inter'] px-6 space-y-6">
      {/* Stats Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: "Total Transactions", value: transactions.length.toString(), color: "text-[#385E31]" },
          { label: "Total Revenue", value: `₱${totalRevenue.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`, color: "text-[#F7B71D]" },
          { label: "Avg. Order Value", value: transactions.length ? `₱${(totalRevenue / transactions.length).toFixed(2)}` : "—", color: "text-purple-600" },
        ].map((card) => (
          <div key={card.label} className="bg-white rounded-2xl border border-[#385E31]/15 px-5 py-4 shadow-sm">
            <p className="text-[11px] font-black uppercase tracking-wider text-[#3A6131]/40 mb-1">{card.label}</p>
            <p className={`text-[22px] font-black ${card.color}`}>{card.value}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="w-full flex justify-between items-center mb-4 gap-4">
        <div className="relative flex-1 max-w-[400px]">
          <input
            type="text"
            placeholder="Search by ID or customer…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border border-[#385E31] rounded-full px-5 py-2.5 bg-transparent text-[#385E31] placeholder-[#385E31]/70 outline-none font-medium text-[13px]"
          />
          <div className="absolute right-4 top-3 text-[#385E31]"><Search size={16} /></div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setSortAsc(!sortAsc)}
            className="flex items-center gap-2 border border-[#385E31] text-[#385E31] px-4 py-2.5 rounded-full text-[13px] font-bold hover:bg-[#385E31]/5 transition-colors">
            <ArrowUpDown size={14} /> {sortAsc ? "Oldest First" : "Newest First"}
          </button>
          <button onClick={handleRefresh} disabled={refreshing}
            className="p-2.5 rounded-full border border-[#385E31] text-[#385E31] hover:bg-[#385E31]/10 transition-all disabled:opacity-50">
            <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="w-full bg-[#FFFCEB] rounded-[10px] border border-[#385E31] flex flex-col overflow-hidden shadow-sm">
        <div className="w-full grid grid-cols-8 bg-[#385E31] px-4 py-3 rounded-t-[8px]">
          {COLUMNS.map((col) => (
            <div key={col} className="text-center text-[#FFFCEB] text-[13px] font-bold">{col}</div>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-[#3A6131]/40 gap-3">
            <Loader2 size={22} className="animate-spin" /> Loading transactions…
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-[#385E31]/40 gap-3">
            <Receipt size={40} strokeWidth={1} />
            <p className="font-medium text-[14px]">
              {search ? `No transactions matching "${search}".` : "No transactions yet."}
            </p>
          </div>
        ) : (
          <AnimatePresence>
            {filtered.map((txn, idx) => {
              const isLast = idx === filtered.length - 1;
              return (
                <motion.div
                  key={txn.transaction_id || `txn-${idx}`}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.15 }}
                  className={`w-full grid grid-cols-8 px-4 py-[14px] items-center hover:bg-[#3A6131]/3 transition-colors ${!isLast ? "border-b border-[#385E31]/10" : ""}`}
                >
                  <div className="text-center text-[#3A6131] text-[11px] font-black font-mono">
                    {txn.transaction_id.slice(0, 8).toUpperCase()}
                  </div>
                  <div className="text-center text-[#3A6131]/60 text-[11px] font-black font-mono">
                    {txn.order_id.slice(0, 8).toUpperCase()}
                  </div>
                  <div className="text-center text-[#3A6131]/70 text-[12px] font-medium">{formatDate(txn.completed_at)}</div>
                  <div className="text-center text-[#3A6131] text-[12px] font-bold truncate px-1">{txn.customer_name}</div>
                  <div className="text-center">
                    <span className="text-[11px] font-bold bg-[#3A6131]/8 text-[#3A6131] px-2.5 py-1 rounded-full">
                      {txn.item_count} item{txn.item_count !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="text-center">
                    <span className="text-[11px] font-bold bg-[#3A6131]/8 text-[#3A6131] px-2.5 py-1 rounded-full">
                      {txn.payment_method === "QR Code" ? "QR Code" : txn.payment_method === "Cash-on-Delivery" ? "Cash on Delivery" : txn.payment_method}
                    </span>
                  </div>
                  <div className="text-center text-[#F7B71D] text-[13px] font-black">
                    ₱{txn.total_amount.toFixed(2)}
                  </div>
                  <div className="text-center">
                    <button 
                      onClick={() => setSelectedOrderId(txn.order_id)}
                      className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-[#385E31] text-[#F7B71D] hover:scale-110 transition-transform shadow-sm"
                    >
                      <Eye size={14} />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>

      {selectedOrderId && (
        <TransactionDetailModal 
          orderId={selectedOrderId} 
          tenantId={tenantId}
          onClose={() => setSelectedOrderId(null)} 
        />
      )}
    </div>
  );
}