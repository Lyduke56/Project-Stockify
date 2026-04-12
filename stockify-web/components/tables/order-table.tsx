"use client";

import { useState, useMemo } from "react";
import ViewOrderModal, { type Order } from "./orders-modals/view-modal";
import EditOrderModal from "./orders-modals/edit-mordal";
import DeleteOrderModal from "./orders-modals/delete-modal";

/* ─── Sample Data ─────────────────────────────────────────── */
const SAMPLE_ORDERS: Order[] = [
  { id: "#1001", dateTime: "03/19/2026 13:05", customer: "Denji Hayakawa",   paymentMethod: "QR Code",     paymentStatus: "Pending", fulfillment: "Processing" },
  { id: "#1002", dateTime: "03/19/2026 14:10", customer: "Makima Reinholt",  paymentMethod: "Cash",        paymentStatus: "Paid",    fulfillment: "Shipped"    },
  { id: "#1003", dateTime: "03/20/2026 09:00", customer: "Power Kobeni",     paymentMethod: "Credit Card", paymentStatus: "Paid",    fulfillment: "Delivered"  },
  { id: "#1004", dateTime: "03/20/2026 11:30", customer: "Aki Hayakawa",     paymentMethod: "GCash",       paymentStatus: "Pending", fulfillment: "Processing" },
  { id: "#1005", dateTime: "03/21/2026 08:45", customer: "Himeno Sato",      paymentMethod: "QR Code",     paymentStatus: "Failed",  fulfillment: "Cancelled"  },
  { id: "#1006", dateTime: "03/21/2026 10:00", customer: "Kishibe Tanaka",   paymentMethod: "Cash",        paymentStatus: "Paid",    fulfillment: "Delivered"  },
  { id: "#1007", dateTime: "03/22/2026 15:20", customer: "Quanxi Lin",       paymentMethod: "Credit Card", paymentStatus: "Pending", fulfillment: "Processing" },
  { id: "#1008", dateTime: "03/22/2026 16:00", customer: "Beam Nakamura",    paymentMethod: "GCash",       paymentStatus: "Paid",    fulfillment: "Shipped"    },
];

type FilterOption = "All" | Order["paymentStatus"] | Order["fulfillment"];

/* ─── Badge helpers ───────────────────────────────────────── */
const paymentBadge: Record<Order["paymentStatus"], string> = {
  Pending:  "bg-[#F7B71D]/90 text-[#5a3e00]",
  Paid:     "bg-green-500   text-white",
  Failed:   "bg-red-500     text-white",
};

const fulfillmentBadge: Record<Order["fulfillment"], string> = {
  Processing: "bg-blue-100   text-blue-700",
  Shipped:    "bg-purple-100 text-purple-700",
  Delivered:  "bg-green-100  text-green-700",
  Cancelled:  "bg-red-100    text-red-600",
};

/* ─── Component ───────────────────────────────────────────── */
export default function OrdersTable() {
  const [orders, setOrders]             = useState<Order[]>(SAMPLE_ORDERS);
  const [search, setSearch]             = useState("");
  const [filter, setFilter]             = useState<FilterOption>("All");

  const [viewOrder,   setViewOrder]     = useState<Order | null>(null);
  const [editOrder,   setEditOrder]     = useState<Order | null>(null);
  const [deleteOrder, setDeleteOrder]   = useState<Order | null>(null);

  /* ── derived list ── */
  const displayed = useMemo(() => {
    return orders.filter((o) => {
      const matchSearch =
        o.id.toLowerCase().includes(search.toLowerCase()) ||
        o.customer.toLowerCase().includes(search.toLowerCase()) ||
        o.paymentMethod.toLowerCase().includes(search.toLowerCase());

      const matchFilter =
        filter === "All" ||
        o.paymentStatus === filter ||
        o.fulfillment === filter;

      return matchSearch && matchFilter;
    });
  }, [orders, search, filter]);

  /* ── handlers ── */
  const handleSave = (updated: Order) => {
    setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
  };

  const handleDelete = (id: string) => {
    setOrders((prev) => prev.filter((o) => o.id !== id));
  };

  return (
    <>
      {/* ── Controls ── */}
      <div className="flex items-center gap-4 mb-5">
        {/* Search */}
        <div className="relative flex-1 max-w-[600px]">
          <img
            src="/search.svg"
            alt="search"
            className="absolute left-3 top-1/2 -translate-y-1/2 w-[18px] h-[18px] opacity-60 pointer-events-none"
            />
          <input
            type="text"
            placeholder="Search by order ID, customer, or payment..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 rounded-lg border border-gray-300 bg-white text-sm text-[#385E31] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#F7B71D] transition"
          />
        </div>

        {/* Filter */}
        <div className="flex items-center gap-2 ml-auto">
          <span className="text-sm text-gray-500 font-medium whitespace-nowrap">Filter by:</span>
          <div className="relative">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as FilterOption)}
              className="appearance-none pl-3 pr-8 py-1.5 rounded-lg border border-gray-300 bg-white text-sm text-[#385E31] font-medium focus:outline-none focus:ring-2 focus:ring-[#F7B71D] cursor-pointer"
            >
              <option value="All">All</option>
              <optgroup label="Payment Status">
                <option value="Pending">Pending</option>
                <option value="Paid">Paid</option>
                <option value="Failed">Failed</option>
              </optgroup>
              <optgroup label="Fulfillment">
                <option value="Processing">Processing</option>
                <option value="Shipped">Shipped</option>
                <option value="Delivered">Delivered</option>
                <option value="Cancelled">Cancelled</option>
              </optgroup>
            </select>
            <img
                src="/arrow-down.svg"
                alt="dropdown"
                className="absolute right-2 top-1/2 -translate-y-1/2 w-[14px] h-[14px] opacity-60 pointer-events-none"
                />
          </div>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="w-full overflow-hidden">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-[#385E31]">
              {["ORDER ID", "DATE / TIME", "CUSTOMER", "PAYMENT METHOD", "FULFILLMENT", "VIEW ORDER"].map((h) => (
                <th
                  key={h}
                  className="px-4 py-3 text-center text-xs font-bold text-white tracking-widest uppercase"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {displayed.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-gray-400 text-sm">
                  No orders found.
                </td>
              </tr>
            ) : (
              displayed.map((order, idx) => (
                <tr
                  key={order.id + idx}
                  className={`border-b border-[#F7B71D]/20 transition-colors ${
                    idx % 2 === 0 ? "bg-[#FFFCEB]" : "bg-[#FFFCEB]"
                  } hover:bg-[#F7B71D]/10`}
                >
                  {/* Order ID */}
                  <td className="px-4 py-3 text-center text-sm font-bold text-[#385E31]">
                    {order.id}
                  </td>

                  {/* Date / Time */}
                  <td className="px-4 py-3 text-center text-sm text-gray-600">
                    {order.dateTime}
                  </td>

                  {/* Customer */}
                  <td className="px-4 py-3 text-center text-sm font-medium text-gray-700">
                    {order.customer}
                  </td>

                  {/* Payment Method + Status badge */}
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-sm text-gray-600">{order.paymentMethod}</span>
                      <span
                        className={`text-[11px] px-2.5 py-0.5 rounded-full font-semibold ${paymentBadge[order.paymentStatus]}`}
                      >
                        {order.paymentStatus}
                      </span>
                    </div>
                  </td>

                  {/* Fulfillment */}
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`text-xs px-3 py-1 rounded-full font-semibold ${fulfillmentBadge[order.fulfillment]}`}
                    >
                      {order.fulfillment}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-2">
                      {/* View */}
                      <button
                        onClick={() => setViewOrder(order)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-[#F7B71D] text-[#385E31] text-xs font-bold rounded-full hover:bg-[#e6a918] transition-colors"
                      >
                        View
                      </button>

                      {/* Edit 
                      <button
                        onClick={() => setEditOrder(order)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-[#385E31] text-white text-xs font-bold rounded-lg hover:bg-[#2d4d27] transition-colors"
                      >
                        <img src="/icons-action/Edit.svg" alt="edit" className="w-[12px] h-[12px]" />
                        Edit
                      </button>
                      */}

                      {/* Delete 
                      <button
                        onClick={() => setDeleteOrder(order)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-red-500 text-white text-xs font-bold rounded-lg hover:bg-red-600 transition-colors"
                      >
                        <img
                          src="/icons-action/Delete.svg"
                          className="w-[12px] h-[12px] filter invert"
                        />
                        Delete
                      </button>*/}

                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Row count */}
        {displayed.length > 0 && (
          <div className="bg-[#FFFCEB] px-4 py-2.5 text-xs text-gray-400 border-t border-[#F7B71D]/20">
            Showing <span className="font-semibold text-[#385E31]">{displayed.length}</span> of{" "}
            <span className="font-semibold text-[#385E31]">{orders.length}</span> orders
          </div>
        )}
      </div>

      {/* ── Modals ── */}
      <ViewOrderModal   order={viewOrder}   onClose={() => setViewOrder(null)}   />
      <EditOrderModal   order={editOrder}   onClose={() => setEditOrder(null)}   onSave={handleSave}    />
      <DeleteOrderModal order={deleteOrder} onClose={() => setDeleteOrder(null)} onConfirm={handleDelete} />
    </>
  );
}