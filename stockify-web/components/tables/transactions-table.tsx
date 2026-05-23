"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, RefreshCw, Loader2, ArrowUpDown, 
  Receipt, FileText, ChevronDown, ChevronUp
} from "lucide-react";
import { fetchTransactions, type Transaction } from "@/lib/employee/order-actions";
import { createClient } from "@/lib/supabase/client";

// Import your components
import StatCard from "../cards/stat-cards";
import TransactionDetailModal from "../modals/employee/transaction-modal/modal";

// ─── Constants ───────────────────────────────────────────────────────────
const COLUMNS = ["TRANSACTION ID", "ORDER ID", "DATE & TIME", "CUSTOMER", "PAYMENT", "TOTAL", "ACTION"];
const ITEMS_PER_LOAD = 15;

export default function TransactionsTable() {
  const [tenantId, setTenantId] = useState("");
  const [transactions, setTxns] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [sortAsc, setSortAsc] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  const CustomOrdersIcon = () => (
    <svg 
      className="w-full h-full text-[#385E31]" 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Ensure your custom path here is a valid SVG d="..." attribute */}
      <path d="M4 7V20C4 21.1046 4.89543 22 6 22H18C19.1046 22 20 21.1046 20 20V7M4 7L12 3L20 7M4 7L12 11M20 7L12 11M12 11V22" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
  
  // Pagination State
  const [visibleRows, setVisibleRows] = useState(ITEMS_PER_LOAD);

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

  // Reset pagination when searching
  useEffect(() => {
    setVisibleRows(ITEMS_PER_LOAD);
  }, [search]);

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

  const fmtCurrency = (n: number) => {
    if (n >= 1_000_000) return `₱ ${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000)     return `₱ ${(n / 1_000).toFixed(1)}K`;
    return `₱ ${n.toFixed(2)}`;
  };

  // Slicing data for pagination
  const displayedTxns = filtered.slice(0, visibleRows);
  const hasMore = visibleRows < filtered.length;
  const hasLess = visibleRows > ITEMS_PER_LOAD;

  return (
    <div className="w-full flex flex-col font-['Inter'] px-6 space-y-8 pb-12">
      
      {/* ── Stats Dashboard ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          title="Total Transactions" 
          value={transactions.length.toString()} 
          hideIcon={false} 
          svgName="employee-transactions"
          className="w-full"
          iconClassName="w-13 h-13 text-[#3A6131]"
        />
        <StatCard 
          title="Total Revenue" 
          value={fmtCurrency(totalRevenue)} 
          hideIcon={true} 
          className="w-full"
        />
        <StatCard 
          title="Avg. Order Value" 
          value={transactions.length ? fmtCurrency(totalRevenue / transactions.length) : "₱0.00"} 
          hideIcon={true} 
          className="w-full"
        />
      </div>

      <div className="flex flex-col gap-4">
        {/* ── Toolbar ── */}
        <div className="w-full flex justify-between items-center gap-4">
          <div className="relative flex-1 max-w-[400px]">
            <input
              type="text"
              placeholder="Search by ID or customer…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border border-[#3A6131] rounded-full px-5 py-2.5 bg-transparent text-[#3A6131] placeholder-[#3A6131]/70 outline-none font-medium text-[13px]"
            />
            <div className="absolute right-4 top-3 text-[#3A6131]"><Search size={16} /></div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setSortAsc(!sortAsc)}
              className="flex items-center gap-2 border-[1.5px] border-[#3A6131] text-[#3A6131] px-4 py-2.5 rounded-full text-[13px] font-bold hover:bg-[#3A6131]/5 transition-colors">
              <ArrowUpDown size={14} /> {sortAsc ? "Oldest First" : "Newest First"}
            </button>
            <button onClick={handleRefresh} disabled={refreshing}
              className="p-2.5 rounded-full border-[1.5px] border-[#3A6131] text-[#3A6131] hover:bg-[#3A6131]/10 transition-all disabled:opacity-50">
              <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        {/* ── Table ── */}
        <div className="w-full bg-transparent rounded-[10px] border border-[#3A6131]/30 flex flex-col overflow-hidden shadow-sm">
          
          {/* UPDATED GRID PROPORTIONS HERE */}
          <div className="w-full grid grid-cols-[1fr_1fr_2fr_1.5fr_1.5fr_1fr_1fr] bg-[#3A6131] px-4 py-3 rounded-t-[8px]">
            {COLUMNS.map((col) => (
              <div key={col} className="text-center text-[#FFFCEB] text-[12px] font-bold">{col}</div>
            ))}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16 text-[#3A6131]/40 gap-3">
              <Loader2 size={22} className="animate-spin" /> Loading transactions…
            </div>
          ) : displayedTxns.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-[#3A6131]/40 gap-3">
              <Receipt size={40} strokeWidth={1.5} />
              <p className="font-medium text-[14px]">
                {search ? `No transactions matching "${search}".` : "No transactions yet."}
              </p>
            </div>
          ) : (
            <AnimatePresence>
              {displayedTxns.map((txn, idx) => {
                const isLast = idx === displayedTxns.length - 1;
                return (
                  <motion.div
                    key={txn.transaction_id || `txn-${idx}`}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.15 }}
                    /* UPDATED GRID PROPORTIONS HERE TOO */
                    className={`w-full grid grid-cols-[1fr_1fr_2fr_1.5fr_1.5fr_1fr_1fr] px-4 py-[14px] items-center hover:bg-[#3A6131]/5 transition-colors ${!isLast ? "border-b border-[#3A6131]/10" : ""}`}
                  >
                    <div className="text-center text-[#3A6131] text-[11px] font-black font-mono">
                      {txn.transaction_id.slice(0, 8).toUpperCase()}
                    </div>
                    <div className="text-center text-[#3A6131]/60 text-[11px] font-black font-mono">
                      {txn.order_id.slice(0, 8).toUpperCase()}
                    </div>
                    <div className="text-center text-[#3A6131]/70 text-[12px] font-medium">{formatDate(txn.completed_at)}</div>
                    <div className="text-center text-[#3A6131] text-[12px] font-bold truncate px-1">{txn.customer_name}</div>
                    
                    <div className="flex justify-center">
                      <span className="text-[11px] font-bold bg-[#3A6131]/10 text-[#3A6131] px-2.5 py-1 rounded-full whitespace-nowrap">
                        {txn.payment_method === "QR Code" ? "QR Code" : txn.payment_method === "Cash-on-Delivery" ? "Cash on Delivery" : txn.payment_method}
                      </span>
                    </div>
                    
                    <div className="text-center text-[#385E31] text-[13px] font-black">
                      ₱{txn.total_amount.toFixed(2)}
                    </div>
                    
                    <div className="flex justify-center">
                      <button 
                        onClick={() => setSelectedOrderId(txn.order_id)}
                        className="px-4 py-1.5 rounded-full bg-[#F7B71D] text-[#385E31] text-[11px] font-black hover:bg-[#e5a91a] active:scale-95 transition-all flex items-center justify-center gap-1.5 shadow-sm"
                      >
                        <FileText size={12} strokeWidth={2.5} />
                        View
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </div>

        {/* ── Pagination Controls ── */}
        {!loading && filtered.length > 0 && (
          <div className="flex flex-col items-center mt-6 gap-4">
            <p className="text-center text-[#3A6131]/50 text-[12px] font-semibold">
              Showing {displayedTxns.length} of {filtered.length} entries
            </p>
            
            <div className="flex items-center gap-3">
              {hasLess && (
                 <button 
                   onClick={() => setVisibleRows(ITEMS_PER_LOAD)}
                   className="px-6 py-2.5 rounded-full border-[1.5px] border-[#3A6131] text-[#3A6131] font-bold text-[13px] hover:bg-[#3A6131]/5 transition-colors flex items-center gap-2"
                 >
                   <ChevronUp size={16} /> Show Less
                 </button>
              )}
              
              {hasMore && (
                <button 
                  onClick={() => setVisibleRows((prev) => prev + ITEMS_PER_LOAD)}
                  className="px-6 py-2.5 rounded-full bg-[#3A6131] text-[#FFFCEB] font-bold text-[13px] hover:opacity-90 shadow-sm transition-all flex items-center gap-2"
                >
                  Load More <ChevronDown size={16} />
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal Mount */}
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