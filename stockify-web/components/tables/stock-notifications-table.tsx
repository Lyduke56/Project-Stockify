"use client";

import { useState, useMemo } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type StockStatus = "Good" | "Low" | "Critical";
type NotificationStatus = "Notified" | "Pending" | "Dismissed";

interface StockItem {
  id: string;
  itemId: string;
  itemName: string;
  image: string;
  stockStatus: StockStatus;
  notificationStatus: NotificationStatus;
  quantity: number;
  category: string;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_ITEMS: StockItem[] = [
  { id: "1",  itemId: "99121223331", itemName: "Matcha Lover",    image: "/product-images/matcha.jpg",      stockStatus: "Good",     notificationStatus: "Notified",  quantity: 120, category: "Beverages"    },
  { id: "2",  itemId: "99121223332", itemName: "Americano",       image: "/product-images/americano.jpg",   stockStatus: "Good",     notificationStatus: "Notified",  quantity: 95,  category: "Beverages"    },
  { id: "3",  itemId: "99121223333", itemName: "Caramel Latte",   image: "/product-images/latte.jpg",       stockStatus: "Low",      notificationStatus: "Pending",   quantity: 12,  category: "Beverages"    },
  { id: "4",  itemId: "99121223334", itemName: "Croissant",       image: "/product-images/croissant.jpg",   stockStatus: "Good",     notificationStatus: "Notified",  quantity: 60,  category: "Food"         },
  { id: "5",  itemId: "99121223335", itemName: "Blueberry Muffin",image: "/product-images/muffin.jpg",      stockStatus: "Critical", notificationStatus: "Pending",   quantity: 4,   category: "Food"         },
  { id: "6",  itemId: "99121223336", itemName: "Tote Bag",        image: "/product-images/totebag.jpg",     stockStatus: "Low",      notificationStatus: "Dismissed", quantity: 8,   category: "Merchandise"  },
  { id: "7",  itemId: "99121223337", itemName: "Cappuccino",      image: "/product-images/cappuccino.jpg",  stockStatus: "Good",     notificationStatus: "Notified",  quantity: 88,  category: "Beverages"    },
  { id: "8",  itemId: "99121223338", itemName: "Strawberry Cake", image: "/product-images/cake.jpg",        stockStatus: "Critical", notificationStatus: "Pending",   quantity: 2,   category: "Food"         },
];

const FILTER_OPTIONS = ["All", "Good", "Low", "Critical"];

// ─── Stock Status Badge ───────────────────────────────────────────────────────

const STOCK_STYLES: Record<StockStatus, string> = {
  Good:     "bg-[#4CAF50] text-white",
  Low:      "bg-[#F7B71D] text-[#385E31]",
  Critical: "bg-[#E53935] text-white",
};

function StockBadge({ status }: { status: StockStatus }) {
  return (
    <span className={`inline-block px-4 py-0.5 rounded-full text-xs font-bold ${STOCK_STYLES[status]}`}>
      {status}
    </span>
  );
}

// ─── Notification Status Dropdown ─────────────────────────────────────────────

const NOTIF_STYLES: Record<NotificationStatus, string> = {
  Notified:  "border-[#385E31] text-[#385E31]",
  Pending:   "border-[#F7B71D] text-[#b37f00]",
  Dismissed: "border-gray-400 text-gray-500",
};

function NotifDropdown({
  value,
  onChange,
}: {
  value: NotificationStatus;
  onChange: (v: NotificationStatus) => void;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as NotificationStatus)}
      className={`border rounded-full px-3 py-0.5 text-xs font-semibold bg-transparent cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#F7B71D] ${NOTIF_STYLES[value]}`}
    >
      <option value="Notified">Notified</option>
      <option value="Pending">Pending</option>
      <option value="Dismissed">Dismissed</option>
    </select>
  );
}

// ─── Image Placeholder ────────────────────────────────────────────────────────

function ProductImage({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="w-12 h-12 rounded-lg overflow-hidden bg-[#e8f0e5] flex items-center justify-center mx-auto shrink-0">
      <img
        src={src}
        alt={alt}
        className="w-full h-full object-cover"
        onError={(e) => {
          // Fallback if image doesn't exist
          (e.target as HTMLImageElement).style.display = "none";
          (e.target as HTMLImageElement).parentElement!.innerHTML = `
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#385E31" stroke-width="1.8">
              <rect x="3" y="3" width="18" height="18" rx="3"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <path d="M21 15l-5-5L5 21"/>
            </svg>`;
        }}
      />
    </div>
  );
}

// ─── View Modal ───────────────────────────────────────────────────────────────

function ViewModal({ item, onClose }: { item: StockItem; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-[#385E31] text-xl font-extrabold mb-5">Item Details</h3>

        {/* Product image preview */}
        <div className="w-24 h-24 rounded-xl overflow-hidden bg-[#e8f0e5] mx-auto mb-5 flex items-center justify-center">
          <img
            src={item.image}
            alt={item.itemName}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        </div>

        <div className="flex flex-col gap-3 text-sm">
          {([
            ["Item ID",              item.itemId],
            ["Item Name",            item.itemName],
            ["Category",             item.category],
            ["Quantity in Stock",    String(item.quantity)],
            ["Stock Status",         item.stockStatus],
            ["Notification Status",  item.notificationStatus],
          ] as [string, string][]).map(([label, value]) => (
            <div key={label} className="flex justify-between border-b border-gray-100 pb-2">
              <span className="text-gray-400 font-semibold">{label}</span>
              <span className="text-[#385E31] font-bold">
                {label === "Stock Status" ? (
                  <StockBadge status={value as StockStatus} />
                ) : (
                  value
                )}
              </span>
            </div>
          ))}
        </div>

        <button
          onClick={onClose}
          className="mt-6 w-full bg-[#385E31] text-white font-bold py-2.5 rounded-xl hover:bg-[#2e4e28] transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function StockNotifications() {
  const [search,    setSearch]    = useState("");
  const [filter,    setFilter]    = useState("All");
  const [items,     setItems]     = useState<StockItem[]>(MOCK_ITEMS);
  const [viewItem,  setViewItem]  = useState<StockItem | null>(null);

  const filtered = useMemo(() => {
    return items.filter((item) => {
      const matchesFilter = filter === "All" || item.stockStatus === filter;
      const q = search.toLowerCase();
      const matchesSearch =
        !q ||
        item.itemId.includes(q) ||
        item.itemName.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q);
      return matchesFilter && matchesSearch;
    });
  }, [items, search, filter]);

  const handleNotifChange = (id: string, status: NotificationStatus) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, notificationStatus: status } : item))
    );
  };

  return (
    <div className="w-full flex flex-col gap-5">

      {/* ── Search + Filter ── */}
      <div className="flex items-center gap-4 flex-wrap">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <input
            type="text"
            placeholder="Search by Transaction ID"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border border-[#385E31] rounded-lg pl-9 pr-10 py-2 text-sm text-[#385E31] placeholder-[#a8c8a0] bg-white focus:outline-none focus:ring-2 focus:ring-[#F7B71D] transition"
          />
          <img
            src="/search.svg"
            alt="search"
            className="absolute left-3 top-1/2 -translate-y-1/2 w-[18px] h-[18px] opacity-60 pointer-events-none"
            />
        </div>

        {/* Filter */}
        <div className="flex items-center gap-2 ml-auto">
          <span className="text-[#385E31] text-sm font-semibold whitespace-nowrap">Filter by:</span>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="border border-[#385E31] rounded-lg px-3 py-2 text-sm text-[#385E31] bg-white font-medium focus:outline-none focus:ring-2 focus:ring-[#F7B71D] cursor-pointer"
          >
            {FILTER_OPTIONS.map((o) => <option key={o}>{o}</option>)}
          </select>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="w-full overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              {["Image", "Item ID", "Item Name", "Stock Status", "Notification Status", "Action"].map((col) => (
                <th
                  key={col}
                  className="bg-[#385E31] text-white font-bold px-5 py-3 text-center first:rounded-tl-xl last:rounded-tr-xl whitespace-nowrap"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-12 text-[#a8c8a0] font-semibold bg-white">
                  No stock notifications found.
                </td>
              </tr>
            ) : (
              filtered.map((item, idx) => (
                <tr
                  key={item.id}
                  className={`border-b border-[#e9e9d8] transition-colors duration-100 ${
                    idx % 2 === 0 ? "bg-[#FFFCEB]" : "bg-[#FFFCEB]"
                  } hover:bg-[#F7B71D]/10`}
                >
                  {/* Image */}
                  <td className="px-5 py-3 text-center">
                    <ProductImage src={item.image} alt={item.itemName} />
                  </td>

                  {/* Item ID */}
                  <td className="px-5 py-3 text-center text-[#385E31] font-medium whitespace-nowrap">
                    {item.itemId}
                  </td>

                  {/* Item Name */}
                  <td className="px-5 py-3 text-center text-[#385E31] font-semibold">
                    {item.itemName}
                  </td>

                  {/* Stock Status */}
                  <td className="px-5 py-3 text-center">
                    <StockBadge status={item.stockStatus} />
                  </td>

                  {/* Notification Status */}
                  <td className="px-5 py-3 text-center">
                    <NotifDropdown
                      value={item.notificationStatus}
                      onChange={(v) => handleNotifChange(item.id, v)}
                    />
                  </td>

                  {/* Action */}
                  <td className="px-5 py-3 text-center">
                    <button
                      onClick={() => setViewItem(item)}
                      className="bg-[#F7B71D] hover:bg-[#e0a519] text-[#385E31] text-xs font-bold px-5 py-1.5 rounded-lg transition-colors duration-150"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── Record Count ── */}
      <p className="text-xs text-[#a8c8a0] font-medium">
        Showing {filtered.length} of {MOCK_ITEMS.length} items
      </p>

      {/* ── View Modal ── */}
      {viewItem && <ViewModal item={viewItem} onClose={() => setViewItem(null)} />}
    </div>
  );
}
