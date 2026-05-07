"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import ViewOrderModal, { type Order as BaseOrder } from "./orders-modals/view-modal";
import EditOrderModal from "./orders-modals/edit-modal";
import CancelConfirmModal from "./orders-modals/cancel-order-modal";

// ─── Strictly Typed Data based on SRS ──────────────────────
export interface Order extends Omit<BaseOrder, "paymentStatus" | "fulfillment" | "paymentMethod"> {
  id: string;
  dateTime: string;
  customer: string;
  totalAmount: number;
  paymentMethod: "QR Code" | "COD";
  fulfillment: "Pending" | "Processing" | "Dispatched" | "Received" | "Cancelled";
}

const SAMPLE_ORDERS: Order[] = [
  { id: "#1001", dateTime: "03/19/2026 13:05", customer: "Denji Hayakawa", totalAmount: 450.0, paymentMethod: "QR Code", fulfillment: "Pending" },
  { id: "#1002", dateTime: "03/19/2026 14:10", customer: "Makima Reinholt", totalAmount: 820.5, paymentMethod: "COD", fulfillment: "Pending" },
  { id: "#1003", dateTime: "03/20/2026 09:00", customer: "Power Kobeni", totalAmount: 310.0, paymentMethod: "QR Code", fulfillment: "Processing" },
  { id: "#1004", dateTime: "03/20/2026 11:30", customer: "Aki Hayakawa", totalAmount: 150.0, paymentMethod: "COD", fulfillment: "Processing" },
  { id: "#1005", dateTime: "03/21/2026 08:45", customer: "Himeno Sato", totalAmount: 540.0, paymentMethod: "QR Code",fulfillment: "Cancelled" },
  { id: "#1006", dateTime: "03/21/2026 10:00", customer: "Kishibe Tanaka", totalAmount: 1200.0, paymentMethod: "COD", fulfillment: "Received" },
  { id: "#1007", dateTime: "03/22/2026 15:20", customer: "Quanxi Lin", totalAmount: 230.0, paymentMethod: "QR Code", fulfillment: "Dispatched" },
  { id: "#1008", dateTime: "03/22/2026 16:00", customer: "Beam Nakamura", totalAmount: 670.0, paymentMethod: "COD", fulfillment: "Dispatched" },
];

const TABS: Order["fulfillment"][] = ["Pending", "Processing", "Dispatched", "Received", "Cancelled"];
const COLUMNS = ["ORDER ID", "DATE / TIME", "CUSTOMER", "TOTAL AMOUNT", "PAYMENT METHOD", "ACTIONS"];

// ─── SVG helpers ───────────────────────────────────────────
const SearchIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const ChevronDown = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

// ─── Styling Helpers ───────────────────────────────────────
const getTabConfig = (tab: Order["fulfillment"]) => {
  switch (tab) {
    case "Pending":    return { bg: "bg-[#E5AD24]", text: "text-[#385E31]" };
    case "Processing": return { bg: "bg-[#46B332]", text: "text-[#FFFCEB]" };
    case "Dispatched": return { bg: "bg-[#FFD980]", text: "text-[#385E31]" };
    case "Received":   return { bg: "bg-[#385E31]", text: "text-[#FFFCEB]" };
    case "Cancelled":  return { bg: "bg-[#E91F22]", text: "text-[#FFFCEB]" };
    default:           return { bg: "bg-[#385E31]", text: "text-[#FFFCEB]" };
  }
};


// ─── Component ─────────────────────────────────────────────
export default function OrdersTable() {
  const [orders, setOrders] = useState<Order[]>(SAMPLE_ORDERS);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<Order["fulfillment"]>("Pending");
  
  // Modals
  const [viewOrder, setViewOrder] = useState<Order | null>(null);
  const [editOrder, setEditOrder] = useState<Order | null>(null);
  const [cancelOrder, setCancelOrder] = useState<Order | null>(null);

  // Dropdown state
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdownId(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /* ── derived list ── */
  const displayed = useMemo(() => {
    return orders.filter((o) => {
      const matchSearch =
        o.id.toLowerCase().includes(search.toLowerCase()) ||
        o.customer.toLowerCase().includes(search.toLowerCase()) ||
        o.paymentMethod.toLowerCase().includes(search.toLowerCase());

      const matchTab = o.fulfillment === activeTab;
      return matchSearch && matchTab;
    });
  }, [orders, search, activeTab]);

  /* ── handlers ── */
  const handleSave = (updated: Order) => {
    setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
  };

  const changeFulfillment = (orderId: string, newStatus: Order["fulfillment"]) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, fulfillment: newStatus } : o));
    setOpenDropdownId(null);
  };

  return (
    <div className="w-full flex flex-col items-center font-['Inter']">
      
      {/* ── Tab navigation ── */}
      <div className="w-full flex justify-center mb-8">
        <div className="relative flex w-full max-w-[900px] h-[45px] items-center my-2">
          <div className="absolute inset-0 border-2 border-[#385E31] rounded-[8px] pointer-events-none" />
          <div
            className={`absolute top-[-2px] bottom-[-2px] rounded-[8px] transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] z-10 ${getTabConfig(activeTab).bg}`}
            style={{
              width: "calc(20% + 4px)",
              left: `calc(${(TABS.indexOf(activeTab) * 20)}% - 2px)`,
            }}
          />
          {TABS.map((tab) => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 h-full z-20 text-center font-bold text-[18px] transition-colors duration-300 cursor-pointer ${
                  isActive ? getTabConfig(tab).text : "text-[#385E31]"
                }`}
              >
                {tab}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Controls (Search & Count) ── */}
      <div className="w-full flex justify-between items-center mb-4 gap-4">
        <div className="relative flex-1 max-w-[60%]">
          <input
            type="text"
            placeholder="Search by order ID or customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border border-[#385E31] rounded-full px-5 py-2 bg-transparent text-[#385E31] placeholder-[#385E31] outline-none text-[13px]"
          />
          <div className="absolute right-4 top-2.5 text-[#385E31]">
            <SearchIcon />
          </div>
        </div>
        
        <div className="text-[#385E31] font-bold text-sm bg-[#F7B71D]/20 px-4 py-2 rounded-full border border-[#385E31]/20">
          {displayed.length} Orders
        </div>
      </div>

      {/* ── Table (Using Flex Divs for exact styling) ── */}
      <div 
        ref={dropdownRef}
        className="w-full bg-[#FFFCEB] rounded-[10px] border border-[#385E31] flex flex-col overflow-visible shadow-sm"
      >
        {/* Header */}
        <div className="w-full flex bg-[#385E31] px-4 py-3 rounded-t-[8px]">
          {COLUMNS.map((col) => (
            <div key={col} className="flex-1 text-center text-[#FFFCEB] text-[13px] font-bold">
              {col}
            </div>
          ))}
        </div>

        {/* Rows */}
        {displayed.length === 0 ? (
          <div className="w-full text-center py-10 text-[#385E31] font-semibold text-sm">
            No {activeTab.toLowerCase()} orders found.
          </div>
        ) : (
          displayed.map((order, idx) => {
            const isLast = idx === displayed.length - 1;
            const isOpen = openDropdownId === order.id;

            return (
              <div
                key={order.id}
                className={`w-full flex px-4 py-[14px] items-center ${!isLast ? "border-b border-[#385E31]/20" : ""}`}
              >
                
                {/* Order ID */}
                <div className="flex-1 text-center text-[#3A6131] text-[13px] font-bold">
                  <span
                    onClick={() => setViewOrder(order)}
                    className="cursor-pointer hover:text-[#E5AD24] hover:underline transition-colors"
                  >
                    {order.id}
                  </span>
                </div>

                {/* Date / Time */}
                <div className="flex-1 text-center text-[#3A6131] text-[13px] font-medium">
                  {order.dateTime}
                </div>

                {/* Customer */}
                <div className="flex-1 text-center text-[#3A6131] text-[13px] font-bold">
                  {order.customer}
                </div>

                {/* Total Amount */}
                <div className="flex-1 text-center text-[#3A6131] text-[13px] font-bold">
                  ₱{order.totalAmount.toFixed(2)}
                </div>

                {/* Payment (Pill & Method) */}
                <div className="flex-1 flex flex-col justify-center items-center gap-1.5">
                  <span className="text-[12px] font-bold text-[#3A6131]/70 bg-gray-100 px-2 py-[2px] rounded-md">
                    {order.paymentMethod}
                  </span>
                </div>

                {/* Actions Dropdown */}
                <div className="flex-1 flex justify-center items-center relative">
                  <button
                    onClick={() => setOpenDropdownId(prev => prev === order.id ? null : order.id)}
                    className={`border border-[#385E31] rounded-full px-3 py-1 text-[11px] font-bold flex items-center gap-1 transition-colors ${
                      isOpen
                        ? "bg-[#385E31] text-[#FFFCEB]"
                        : "text-[#385E31] hover:bg-[#385E31]/10"
                    }`}
                  >
                    Action <ChevronDown />
                  </button>

                  {isOpen && (
                    <div className="absolute top-8 right-[50%] translate-x-1/2 w-[160px] bg-[#FFFCEB] border border-[#385E31] shadow-lg rounded-[4px] z-10 py-1 overflow-hidden text-[#385E31] text-[11px] font-semibold flex flex-col text-left">
                      
                      {/* Always available */}
                      <button
                        onClick={() => { setViewOrder(order); setOpenDropdownId(null); }}
                        className="px-3 py-1.5 hover:bg-[#E5AD24] text-left transition-colors"
                      >
                        View Details
                      </button>

                      {/* Dynamic Actions based on Tab */}
                      {activeTab === "Pending" && (
                        <>
                          <button
                            onClick={() => changeFulfillment(order.id, "Processing")}
                            className="px-3 py-1.5 hover:bg-[#E5AD24] text-left transition-colors"
                          >
                            Start Preparing
                          </button>
                          <button
                            onClick={() => { setCancelOrder(order); setOpenDropdownId(null); }}
                            className="px-3 py-1.5 hover:bg-red-500 hover:text-white text-left transition-colors text-red-600"
                          >
                            Cancel Order
                          </button>
                        </>
                      )}

                      {activeTab === "Processing" && (
                        <button
                          onClick={() => changeFulfillment(order.id, "Dispatched")}
                          className="px-3 py-1.5 hover:bg-[#E5AD24] text-left transition-colors"
                        >
                          Dispatch Order
                        </button>
                      )}
                      
                    </div>
                  )}
                </div>

              </div>
            );
          })
        )}
      </div>

      {/* ── Modals ── */}
      {viewOrder && <ViewOrderModal order={viewOrder} onClose={() => setViewOrder(null)} />}
      {cancelOrder && (
        <CancelConfirmModal
          order={cancelOrder} 
          onClose={() => setCancelOrder(null)} 
          onConfirm={changeFulfillment as any} 
        />
      )}
    </div>
  );
}