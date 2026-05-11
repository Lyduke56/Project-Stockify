"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  fetchFnbItems,
  addFnbItem,
  updateFnbItem,
  deleteFnbItem,
  type FnbItem,
} from "@/lib/employee/inventory";
import FnbItemModal from "@/components/modals/employee/ingredients-modals/fnb-item-modal";
import ManageMaterialCategoriesModal from "@/components/modals/employee/ingredients-modals/manage-categories-modal";
import DeleteItemModal from "@/components/modals/employee/ingredients-modals/delete-item-modal";
import { Loader2, RefreshCw } from "lucide-react";

// ── SVG helpers ───────────────────────────────────────────────

const SearchIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const ChevronDown = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

// ── Columns ───────────────────────────────────────────────────

const COLUMNS = [
  { label: "Material Name", className: "flex-[2] min-w-[160px] justify-start  text-left pl-4" },
  { label: "SKU", className: "flex-[1.2] min-w-[110px] justify-center text-center" },
  { label: "Category", className: "flex-[1] min-w-[90px]  justify-center text-center" },
  { label: "Current Stock", className: "flex-[1.4] min-w-[130px] justify-center text-center" },
  { label: "Alert Limit", className: "flex-[1] min-w-[90px]  justify-center text-center" },
  { label: "Unit Cost", className: "flex-[1] min-w-[90px]  justify-center text-center" },
  { label: "Nearest Expiry", className: "flex-[1.2] min-w-[110px] justify-center text-center" },
  { label: "Actions", className: "flex-[0.9] min-w-[80px]  justify-center text-center" },
];

// ── Component ─────────────────────────────────────────────────

interface FnbIngredientsTableProps {
  tenantId: string;
}

export default function FnbIngredientsTable({ tenantId }: FnbIngredientsTableProps) {
  const [items, setItems] = useState<FnbItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [visibleCount, setVisibleCount] = useState(5);
  const [showAdd, setShowAdd] = useState(false);
  const [editTarget, setEditTarget] = useState<FnbItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<FnbItem | null>(null);
  const [showCategories, setShowCategories] = useState(false);

  // ── Dropdown state ────────────────────────────────────────
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [dropdownPos, setDropdownPos] = useState<{ top: number; right: number } | null>(null);

  const loadItems = useCallback(async () => {
    try { setLoading(true); setError(null); setItems(await fetchFnbItems(tenantId)); }
    catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, [tenantId]);

  useEffect(() => { loadItems(); }, [loadItems]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-dropdown-menu]") && !target.closest("[data-action-btn]")) {
        setOpenDropdownId(null);
        setDropdownPos(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Close dropdown on scroll
  useEffect(() => {
    const handler = () => { setOpenDropdownId(null); setDropdownPos(null); };
    window.addEventListener("scroll", handler, true);
    return () => window.removeEventListener("scroll", handler, true);
  }, []);

  useEffect(() => { setVisibleCount(5); }, [search, filterStatus]);

  const handleActionClick = (e: React.MouseEvent<HTMLButtonElement>, itemId: string) => {
    if (openDropdownId === itemId) {
      setOpenDropdownId(null);
      setDropdownPos(null);
    } else {
      const rect = e.currentTarget.getBoundingClientRect();
      setDropdownPos({
        top: rect.bottom + 4,
        right: window.innerWidth - rect.right,
      });
      setOpenDropdownId(itemId);
    }
  };

  const filtered = items.filter((item) => {
    const matchSearch =
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.sku.toLowerCase().includes(search.toLowerCase()) ||
      (item.category_name ?? "").toLowerCase().includes(search.toLowerCase());
    const matchFilter =
      filterStatus === "All" ||
      (filterStatus === "Low" && item.stock <= item.alert_limit);
    return matchSearch && matchFilter;
  });

  const displayed = filtered.slice(0, visibleCount);

  // ── CRUD handlers ─────────────────────────────────────────

  const handleAdd = async (data: Omit<FnbItem, "item_id" | "tenant_id" | "is_active" | "created_at" | "updated_at" | "category_name">) => {
    try {
      await addFnbItem(tenantId, data);
      setShowAdd(false);
      loadItems();
    } catch (e: any) { throw e; }
  };

  const handleEdit = async (data: Omit<FnbItem, "item_id" | "tenant_id" | "is_active" | "created_at" | "updated_at" | "category_name">) => {
    if (!editTarget) return;
    try {
      await updateFnbItem(editTarget.item_id, data);
      setEditTarget(null);
      loadItems();
    } catch (e: any) { throw e; }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deleteFnbItem(deleteTarget.item_id);
    setDeleteTarget(null);
    loadItems();
  };

  // The row whose dropdown is open
  const openRow = openDropdownId ? items.find((i) => i.item_id === openDropdownId) ?? null : null;

  // ── Render ────────────────────────────────────────────────

  return (
    <div className="w-full font-['Inter']">

      {/* Toolbar */}
      <div className="w-full flex flex-col lg:flex-row justify-between items-center mb-4 gap-4">
        <div className="flex w-full lg:w-auto flex-1 gap-4 items-center">
          <div className="relative flex-1 max-w-[400px]">
            <input
              type="text"
              placeholder="Search by material, SKU, or category…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border border-[#385E31] rounded-full px-5 py-2.5 bg-transparent text-[#385E31] placeholder-[#385E31]/70 outline-none font-medium text-[13px]"
            />
            <div className="absolute right-4 top-3 text-[#385E31]"><SearchIcon /></div>
          </div>
          <div className="relative w-[200px]">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full appearance-none border border-[#385E31] rounded-full px-5 py-2.5 bg-transparent text-[#385E31] outline-none font-medium cursor-pointer text-[13px]"
            >
              <option value="All">All Ingredients</option>
              <option value="Low">Low Stock Alerts</option>
            </select>
            <div className="absolute right-4 top-3.5 text-[#385E31] pointer-events-none"><ChevronDown /></div>
          </div>
        </div>
        <div className="flex items-center gap-3 w-full lg:w-auto justify-end">
          <button onClick={loadItems} className="p-2.5 rounded-full border border-[#385E31] text-[#385E31] hover:bg-[#385E31]/10 transition-all" title="Refresh">
            <RefreshCw size={16} />
          </button>
          <button onClick={() => setShowCategories(true)} className="px-6 py-2.5 rounded-[40px] bg-[#F7B71D] text-[#385E31] text-[13px] font-bold hover:opacity-90 active:scale-95 transition-all shadow-sm">
            Manage Categories
          </button>
          <button onClick={() => setShowAdd(true)} className="px-6 py-2.5 rounded-[40px] bg-[#385E31] text-[#FFFCEB] text-[13px] font-bold hover:opacity-90 active:scale-95 transition-all shadow-sm">
            Add Item
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-2xl text-red-600 text-sm font-semibold flex items-center justify-between">
          <span>{error}</span>
          <button onClick={loadItems} className="text-red-400 hover:text-red-600 underline text-xs">Retry</button>
        </div>
      )}

      {/* Table */}
      <div className="w-full bg-[#FFFCEB] rounded-[10px] border border-[#385E31] flex flex-col overflow-x-auto shadow-sm">
        {/* Header */}
        <div className="w-full flex bg-[#385E31] px-2 py-3 rounded-t-[8px] min-w-[900px]">
          {COLUMNS.map((col) => (
            <div key={col.label} className={`flex text-[#FFFCEB] text-[11px] font-bold items-center uppercase tracking-wide ${col.className}`}>
              {col.label}
            </div>
          ))}
        </div>

        {/* Body */}
        {loading ? (
          <div className="w-full flex items-center justify-center py-16 text-[#385E31]/60 gap-3">
            <Loader2 size={20} className="animate-spin" />
            <span className="text-sm font-semibold">Loading inventory…</span>
          </div>
        ) : displayed.length === 0 ? (
          <div className="w-full text-center py-10 text-[#385E31] font-semibold text-sm">
            {search || filterStatus !== "All" ? "No items match your filters." : "No ingredients yet. Add your first item!"}
          </div>
        ) : (
          displayed.map((row, idx) => {
            const isLast = idx === displayed.length - 1;
            const isOpen = openDropdownId === row.item_id;
            const purchasingQty = row.conversion > 0
              ? (row.stock / row.conversion).toFixed(1).replace(/\.0$/, "")
              : row.stock.toString();
            const isLowStock = row.stock <= row.alert_limit;
            const expiryDisplay = row.nearest_expiry
              ? new Date(row.nearest_expiry).toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" })
              : "N/A";

            return (
              <div
                key={row.item_id}
                className={`w-full flex px-2 py-[12px] items-center min-w-[900px] ${!isLast ? "border-b border-[#385E31]/20" : ""}`}
              >
                {/* Material Name */}
                <div className={`flex text-[#3A6131] text-[13px] font-bold items-center ${COLUMNS[0].className}`}>
                  <span className="truncate pr-2">{row.name}</span>
                </div>

                {/* SKU */}
                <div className={`flex text-[#3A6131] text-[11px] font-bold font-mono items-center ${COLUMNS[1].className}`}>
                  {row.sku}
                </div>

                {/* Category */}
                <div className={`flex text-[#3A6131] text-[12px] font-bold items-center ${COLUMNS[2].className}`}>
                  <span className="truncate">{row.category_name ?? "—"}</span>
                </div>

                {/* Current Stock */}
                <div className={`flex flex-col items-center justify-center ${COLUMNS[3].className}`}>
                  <span className={`text-[12px] font-bold ${isLowStock ? "text-[#E91F22]" : "text-[#3A6131]"}`}>
                    {purchasingQty} {row.purchase_unit}{Number(purchasingQty) !== 1 ? "s" : ""}
                  </span>
                  <span className="text-[10px] text-[#3A6131]/50 font-medium">
                    ({row.stock} {row.base_unit})
                  </span>
                  {isLowStock && (
                    <span className="text-[9px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full font-black mt-0.5">LOW</span>
                  )}
                </div>

                {/* Alert Limit */}
                <div className={`flex text-[#3A6131] text-[12px] font-bold items-center ${COLUMNS[4].className}`}>
                  {row.alert_limit} {row.base_unit}
                </div>

                {/* Unit Cost */}
                <div className={`flex text-[#385E31] text-[12px] font-extrabold items-center ${COLUMNS[5].className}`}>
                  ₱{Number(row.unit_cost).toFixed(2)}
                </div>

                {/* Nearest Expiry */}
                <div className={`flex text-[#3A6131] text-[12px] font-bold items-center ${COLUMNS[6].className}`}>
                  {expiryDisplay}
                </div>

                {/* Actions */}
                <div className={`flex items-center justify-center ${COLUMNS[7].className}`}>
                  <button
                    data-action-btn
                    onClick={(e) => handleActionClick(e, row.item_id)}
                    className={`border border-[#385E31] rounded-full px-3 py-1 text-[11px] font-bold flex items-center gap-1 transition-colors ${isOpen ? "bg-[#385E31] text-[#FFFCEB]" : "text-[#385E31] hover:bg-[#385E31]/10"
                      }`}
                  >
                    Action <ChevronDown />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ── Fixed dropdown — renders OUTSIDE the overflow container ── */}
      {openRow && dropdownPos && (
        <div
          data-dropdown-menu
          style={{
            position: "fixed",
            top: dropdownPos.top,
            right: dropdownPos.right,
            zIndex: 9999,
          }}
          className="w-[140px] bg-[#FFFCEB] border border-[#385E31] shadow-lg rounded-[6px] py-1 overflow-hidden text-[#385E31] text-[11px] font-semibold flex flex-col"
        >
          <button
            onClick={() => {
              setEditTarget(openRow);
              setOpenDropdownId(null);
              setDropdownPos(null);
            }}
            className="px-3 py-2 hover:bg-[#E5AD24] text-left transition-colors"
          >
            Edit Item
          </button>
          <button
            onClick={() => {
              setDeleteTarget(openRow);
              setOpenDropdownId(null);
              setDropdownPos(null);
            }}
            className="px-3 py-2 hover:bg-[#E5AD24] text-[#E91F22] hover:text-[#385E31] text-left transition-colors"
          >
            Delete Item
          </button>
        </div>
      )}

      {/* Pagination */}
      <div className="w-full flex justify-end items-center gap-3 mt-6">
        {visibleCount > 5 && (
          <button onClick={() => setVisibleCount(5)} className="bg-transparent border border-[#385E31] text-[#385E31] text-[13px] font-bold px-8 py-2.5 rounded-[40px] shadow-sm hover:bg-[#385E31]/10 active:scale-95 transition-all">
            Show Less
          </button>
        )}
        {filtered.length > visibleCount && (
          <button onClick={() => setVisibleCount((p) => p + 5)} className="bg-[#F7B71D] text-[#385E31] text-[13px] font-bold px-8 py-2.5 rounded-[40px] shadow-sm hover:opacity-90 active:scale-95 transition-all">
            Load More
          </button>
        )}
      </div>

      {/* Modals */}
      {showAdd && (
        <FnbItemModal mode="add" tenantId={tenantId} onSave={handleAdd} onClose={() => setShowAdd(false)} />
      )}
      {editTarget && (
        <FnbItemModal mode="edit" tenantId={tenantId} initial={editTarget} onSave={handleEdit} onClose={() => setEditTarget(null)} />
      )}
      {deleteTarget && (
        <DeleteItemModal itemName={deleteTarget.name} onConfirm={handleDelete} onClose={() => setDeleteTarget(null)} />
      )}
      {showCategories && (
        <ManageMaterialCategoriesModal tenantId={tenantId} type="fnb_ingredient" placeholder="e.g. Powder" onClose={() => { setShowCategories(false); loadItems(); }} />
      )}
    </div>
  );
}