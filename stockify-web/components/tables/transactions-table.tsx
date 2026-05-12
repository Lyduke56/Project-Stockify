"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, RefreshCw, Loader2, ArrowUpDown, Receipt } from "lucide-react";
import { fetchTransactions, type Transaction } from "@/lib/employee/order-actions";
import { createClient } from "@/lib/supabase/client";

const COLUMNS = ["Transaction ID", "Order ID", "Date & Time", "Customer", "Items", "Payment", "Total"];

export default function TransactionsTable() {
  const [tenantId, setTenantId] = useState("");
  const [transactions, setTxns] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [sortAsc, setSortAsc] = useState(false);

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
        t.transaction_id.toLowerCase().includes(q) ||
        t.order_id.toLowerCase().includes(q) ||
        t.customer_name.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      const diff = new Date(a.completed_at).getTime() - new Date(b.completed_at).getTime();
      return sortAsc ? diff : -diff;
    });

  const totalRevenue = filtered.reduce((sum, t) => sum + t.total_amount, 0);

  return (
    <div className="w-full flex flex-col font-['Inter'] px-6">

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Total Transactions", value: filtered.length.toString(), color: "text-[#385E31]" },
          { label: "Total Revenue", value: `₱${totalRevenue.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`, color: "text-[#F7B71D]" },
          { label: "Avg. Order Value", value: filtered.length ? `₱${(totalRevenue / filtered.length).toFixed(2)}` : "—", color: "text-purple-600" },
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
        <div className="w-full grid grid-cols-7 bg-[#385E31] px-4 py-3 rounded-t-[8px]">
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
                  key={txn.transaction_id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.15 }}
                  className={`w-full grid grid-cols-7 px-4 py-[14px] items-center hover:bg-[#3A6131]/3 transition-colors ${!isLast ? "border-b border-[#385E31]/10" : ""}`}
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
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}