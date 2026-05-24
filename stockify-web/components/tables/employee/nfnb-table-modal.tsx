"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  fetchNfbProducts,
  addNfbProduct,
  updateNfbProduct,
  deleteNfbProduct,
  type NfbProduct,
  type VariantTypeInput,
} from "@/lib/employee/nfb-products";
import NfbProductModal       from "@/components/modals/employee/product-modals/nfnb-product-modal";
import ManageCategoriesModal from "@/components/modals/employee/product-modals/manage-categories-modal";
import DeleteItemModal       from "@/components/modals/employee/ingredients-modals/delete-item-modal";
import RestockModal          from "@/components/modals/employee/product-modals/restock-modal";
import { Loader2, RefreshCw } from "lucide-react";
import { type StorefrontConfig } from "@/lib/admin/storefront-actions";

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
  { label: "NAME",      className: "flex-[1.8] min-w-[150px] justify-start text-left pl-4" },
  { label: "SKU",       className: "flex-[1.2] min-w-[100px] justify-center text-center"  },
  { label: "CATEGORY",  className: "flex-[1]   min-w-[90px]  justify-center text-center"  },
  { label: "QTY",       className: "flex-[0.8] min-w-[70px]  justify-center text-center"  },
  { label: "UNIT COST", className: "flex-[1]   min-w-[90px]  justify-center text-center"  },
  { label: "PRICE",     className: "flex-[1]   min-w-[90px]  justify-center text-center"  },
  { label: "STATUS",    className: "flex-[1.2] min-w-[110px] justify-center text-center"  },
  { label: "VISIBLE",   className: "w-[70px]   min-w-[70px]  justify-center flex-none text-center" },
  { label: "ACTIONS",   className: "flex-[1]   min-w-[80px]  justify-center text-center"  },
];

// ── Dropdown position type ────────────────────────────────────

type DropdownPos = { top: number; right: number };

// ── Component ─────────────────────────────────────────────────

interface NfbProductsTableProps {
  tenantId: string;
  onLoadComplete?: () => void;  
  colors?: StorefrontConfig | null;
}

export default function NfbProductsTable({ tenantId, onLoadComplete, colors }: NfbProductsTableProps) {
  const [products,      setProducts]      = useState<NfbProduct[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState<string | null>(null);
  const [search,        setSearch]        = useState("");
  const [filterStatus,  setFilterStatus]  = useState("All");
  const [visibleCount,  setVisibleCount]  = useState(5);
  const [showAdd,        setShowAdd]        = useState(false);
  const [editTarget,     setEditTarget]     = useState<NfbProduct | null>(null);
  const [deleteTarget,   setDeleteTarget]   = useState<NfbProduct | null>(null);
  const [restockTarget,  setRestockTarget]  = useState<NfbProduct | null>(null);
  const [showCategories, setShowCategories] = useState(false);

  // ── UI popover states ──────────────────────────────────────────
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [dropdownPos,    setDropdownPos]    = useState<DropdownPos | null>(null);
  
  const [variantPopId,   setVariantPopId]   = useState<string | null>(null);
  const [variantPopPos,  setVariantPopPos]  = useState<DropdownPos | null>(null);

  const tableRef = useRef<HTMLDivElement>(null);

 const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setProducts(await fetchNfbProducts(tenantId));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
      onLoadComplete?.();  // ← add this
    }
  }, [tenantId, onLoadComplete]);
  

  useEffect(() => { loadProducts(); }, [loadProducts]);

  // Close popovers on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      
      const actionDropdown = document.getElementById("nfb-action-dropdown");
      const variantPop     = document.getElementById("nfb-variant-popover");
      
      if (
        (tableRef.current && tableRef.current.contains(target)) ||
        (actionDropdown && actionDropdown.contains(target)) ||
        (variantPop && variantPop.contains(target))
      ) return;
      
      setOpenDropdownId(null);
      setDropdownPos(null);
      setVariantPopId(null);
      setVariantPopPos(null);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => { setVisibleCount(5); }, [search, filterStatus]);

  // ── Toggle dropdown with fixed screen position ────────────────

  const handleActionClick = (e: React.MouseEvent<HTMLButtonElement>, productId: string) => {
    if (openDropdownId === productId) {
      setOpenDropdownId(null);
      setDropdownPos(null);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    setDropdownPos({
      top:   rect.bottom + 4,
      right: window.innerWidth - rect.right,
    });
    setOpenDropdownId(productId);
    setVariantPopId(null); // close other popovers
  };

  const handleVariantClick = (e: React.MouseEvent<HTMLButtonElement>, productId: string) => {
    if (variantPopId === productId) {
      setVariantPopId(null);
      setVariantPopPos(null);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    setVariantPopPos({
      top:   rect.bottom + 4,
      right: window.innerWidth - rect.right,
    });
    setVariantPopId(productId);
    setOpenDropdownId(null); // close other popovers
  };

  // ── Filtering ─────────────────────────────────────────────────

  const filtered = products.filter((p) => {
    const matchSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase()) ||
      (p.category_name ?? "").toLowerCase().includes(search.toLowerCase());
    const matchFilter =
      filterStatus === "All" ||
      (filterStatus === "Visible" && p.visible) ||
      (filterStatus === "Hidden"  && !p.visible);
    return matchSearch && matchFilter;
  });

  const displayed = filtered.slice(0, visibleCount);

  // ── CRUD handlers ─────────────────────────────────────────────

  const handleAdd = async (
    input:    Parameters<typeof addNfbProduct>[1],
    variants: VariantTypeInput[]
  ) => {
    await addNfbProduct(tenantId, input, variants);
    setShowAdd(false);
    loadProducts();
  };

  const handleEdit = async (
    input:    Parameters<typeof addNfbProduct>[1],
    variants: VariantTypeInput[]
  ) => {
    if (!editTarget) return;
    await updateNfbProduct(editTarget.product_id, tenantId, input, variants);
    setEditTarget(null);
    loadProducts();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deleteNfbProduct(deleteTarget.product_id, tenantId, deleteTarget.name);
    setDeleteTarget(null);
    loadProducts();
  };

  

  // ── Render ────────────────────────────────────────────────────

  return (
    <div className="w-full font-['Inter']">

      {/* Toolbar */}
      <div className="w-full flex flex-col lg:flex-row justify-between items-center mb-4 gap-4">
        <div className="flex w-full lg:w-auto flex-1 gap-4 items-center">
          <div className="relative flex-1 max-w-[400px]">
            <input
              type="text"
              placeholder="Search by product, SKU, or category…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border border-primary rounded-full px-5 py-2.5 bg-transparent text-primary placeholder-primary/70 outline-none font-medium text-[13px]"
            />
            <div className="absolute right-4 top-3 text-primary"><SearchIcon /></div>
          </div>
          <div className="relative w-[180px]">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full appearance-none border border-primary rounded-full px-5 py-2.5 bg-transparent text-primary outline-none font-medium cursor-pointer text-[13px]"
            >
              <option value="All">Filter By</option>
              <option value="Visible">Visible</option>
              <option value="Hidden">Hidden</option>
            </select>
            <div className="absolute right-4 top-3.5 text-primary pointer-events-none"><ChevronDown /></div>
          </div>
        </div>
        <div className="flex items-center gap-3 w-full lg:w-auto justify-end">
          <button onClick={loadProducts} className="p-2.5 rounded-full border border-primary text-primary hover:bg-primary/10 transition-all" title="Refresh">
            <RefreshCw size={16} />
          </button>
          <button onClick={() => setShowCategories(true)} className="px-6 py-2.5 rounded-[40px] bg-accent text-primary text-[13px] font-bold hover:opacity-90 active:scale-95 transition-all shadow-sm">
            Manage Categories
          </button>
          <button onClick={() => setShowAdd(true)} className="px-6 py-2.5 rounded-[40px] bg-primary text-[var(--color-sidebar-text,#FFF9D7)] text-[13px] font-bold hover:opacity-90 active:scale-95 transition-all shadow-sm">
            Add Product
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-2xl text-red-600 text-sm font-semibold flex items-center justify-between">
          <span>{error}</span>
          <button onClick={loadProducts} className="text-red-400 hover:text-red-600 underline text-xs">Retry</button>
        </div>
      )}

      {/* Table */}
      <div ref={tableRef} className="w-full bg-transparent rounded-[10px] border border-primary flex flex-col overflow-x-auto shadow-sm">

        {/* Header */}
        <div className="w-full flex bg-primary px-2 py-3 rounded-t-[8px] min-w-[900px]">
          {COLUMNS.map((col) => (
            <div key={col.label} className={`flex text-[var(--color-sidebar-text,#FFF9D7)] text-[11px] font-bold items-center uppercase tracking-wide ${col.className}`}>
              {col.label}
            </div>
          ))}
        </div>

        {/* Body */}
        {loading ? (
          <div className="w-full flex items-center justify-center py-16 text-primary/60 gap-3">
            <Loader2 size={20} className="animate-spin" />
            <span className="text-sm font-semibold">Loading products…</span>
          </div>
        ) : displayed.length === 0 ? (
          <div className="w-full text-center py-10 text-primary font-semibold text-sm">
            {search || filterStatus !== "All" ? "No products match your filters." : "No products yet. Add your first product!"}
          </div>
        ) : (
          displayed.map((row, idx) => {
            const isLast         = idx === displayed.length - 1;
            const isOpen         = openDropdownId === row.product_id;
            const hasVariants = row.variants && row.variants.length > 0;
            const variantSummary = hasVariants
              ? row.variants!.map((v) => v.name).join(", ")
              : null;

            let displayQuantity = row.quantity.toString();
            let displayPrice = `₱${Number(row.price).toFixed(2)}`;
            let displayUnitCost = `₱${Number(row.unit_cost).toFixed(2)}`;

            if (hasVariants) {
              const allOptions = row.variants!.flatMap((v) => v.options || []);
              if (allOptions.length > 0) {
                const totalStock = allOptions.reduce((sum, opt) => sum + (Number(opt.stock) || 0), 0);
                displayQuantity = totalStock.toString();
                
                const prices = allOptions.map((opt) => Number(opt.price) || 0);
                const minPrice = Math.min(...prices);
                const maxPrice = Math.max(...prices);
                if (minPrice === maxPrice) {
                  displayPrice = `₱${minPrice.toFixed(2)}`;
                } else {
                  displayPrice = `₱${minPrice.toFixed(2)} - ₱${maxPrice.toFixed(2)}`;
                }

                const unitCosts = allOptions.map((opt) => Number(opt.unit_cost) || 0);
                const minUnitCost = Math.min(...unitCosts);
                const maxUnitCost = Math.max(...unitCosts);
                if (minUnitCost === maxUnitCost) {
                  displayUnitCost = `₱${minUnitCost.toFixed(2)}`;
                } else {
                  displayUnitCost = `₱${minUnitCost.toFixed(2)} - ₱${maxUnitCost.toFixed(2)}`;
                }
              }
            }

            return (
              <div
                key={row.product_id}
                className={`w-full flex px-2 py-[10px] items-center min-w-[900px] ${!isLast ? "border-b border-primary/20" : ""}`}
              >
                {/* Name */}
                <div className={`flex flex-col justify-center ${COLUMNS[0].className}`}>
                  <span className="text-primary text-[13px] font-bold truncate pr-2">{row.name}</span>
                  {!row.visible && (
                    <span className="text-[9px] text-amber-600 font-black uppercase bg-amber-50 px-1.5 py-0.5 rounded-full w-fit mt-0.5">
                      Hidden
                    </span>
                  )}
                </div>

                {/* SKU */}
                <div className={`flex text-primary text-[11px] font-bold font-mono items-center ${COLUMNS[1].className}`}>
                  {row.sku}
                </div>

                {/* Category */}
                <div className={`flex text-primary text-[12px] font-bold items-center ${COLUMNS[2].className}`}>
                  <span className="truncate">{row.category_name ?? "—"}</span>
                </div>

                {/* Quantity */}
                <div className={`flex flex-col items-center justify-center ${COLUMNS[3].className}`}>
                  <span className="text-primary text-[13px] font-bold">{displayQuantity}</span>
                  <span className="text-[10px] text-primary/50">{row.unit_of_measure}</span>
                </div>

                {/* Unit Cost */}
                <div className={`flex text-primary text-[12px] font-bold items-center ${COLUMNS[4].className}`}>
                  {displayUnitCost}
                </div>

                {/* Price */}
                <div className={`flex text-primary text-[13px] font-extrabold items-center ${COLUMNS[5].className}`}>
                  {displayPrice}
                </div>

                {/* Status Column */}
                <div className={`flex items-center justify-center ${COLUMNS[6].className}`}>
                  {hasVariants ? (
                    <button
                      onClick={(e) => handleVariantClick(e, row.product_id)}
                      className={`text-[10px] font-black px-2.5 py-1 rounded-full border transition-all flex items-center gap-1.5 ${
                        variantPopId === row.product_id 
                          ? "bg-accent text-primary border-accent" 
                          : "bg-white/10 text-primary border-primary/20 hover:bg-primary/5"
                      }`}
                    >
                      <RefreshCw size={10} className={variantPopId === row.product_id ? "animate-spin" : ""} />
                      View Variants
                    </button>
                  ) : (
                    (() => {
                      const threshold = row.reorder_threshold ?? 0;
                      const currentStock = Number(displayQuantity) || 0;
                      const isLow = currentStock <= threshold && threshold > 0;
                      
                      return (
                        <div className={`px-2.5 py-0.5 rounded-[40px] text-[10px] font-bold flex items-center gap-1.5 ${
                          isLow 
                            ? "bg-amber-500 text-white border border-amber-600" 
                            : "bg-accent text-primary"
                        }`}>
                          {!isLow && <span className="w-1 h-1 rounded-full bg-green-400" />}
                          {isLow ? "Low Stock" : "Good"}
                        </div>
                      );
                    })()
                  )}
                </div>

                {/* Visible */}
                <div className={`flex items-center ${COLUMNS[7].className}`}>
                  <div className={`px-2.5 py-0.5 rounded-[40px] flex justify-center items-center ${row.visible ? "bg-accent text-primary" : "bg-transparent border border-primary/40 text-primary"}`}>
                    <span className="text-[10px] font-bold leading-tight">{row.visible ? "Yes" : "No"}</span>
                  </div>
                </div>

                {/* Actions — button only; dropdown rendered via fixed portal below */}
                <div className={`flex items-center justify-center ${COLUMNS[8].className}`}>
                  <button
                    onClick={(e) => handleActionClick(e, row.product_id)}
                    className={`border border-primary rounded-full px-3 py-1 text-[11px] font-bold flex items-center gap-1 transition-colors ${
                      isOpen ? "bg-primary text-[var(--color-sidebar-text,#FFF9D7)]" : "text-primary hover:bg-primary/10"
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

      {/* ── Fixed variant popover ── */}
      {variantPopId && variantPopPos && (() => {
        const row = products.find((p) => p.product_id === variantPopId);
        if (!row || !row.variants) return null;
        const threshold = row.reorder_threshold ?? 0;
        
        return (
          <div
            id="nfb-variant-popover"
            style={{ position: "fixed", top: variantPopPos.top, right: variantPopPos.right, zIndex: 9999 }}
            className="w-[280px] bg-background border border-primary shadow-2xl rounded-[16px] py-3 overflow-hidden flex flex-col text-primary"
          >
            <div className="px-4 pb-2 border-b border-primary/10 mb-2">
              <h4 className="text-[11px] font-black text-primary uppercase tracking-wider">{row.name} Variants</h4>
            </div>
            <div className="max-h-[300px] overflow-y-auto px-2 space-y-1">
              {row.variants.flatMap(vt => vt.options).map((opt, i) => {
                const stock = Number(opt.stock) || 0;
                const variantThreshold = Number(opt.reorder_threshold) || 0;
                const isLow = stock <= variantThreshold && variantThreshold > 0;
                return (
                  <div key={i} className="flex items-center justify-between p-2 rounded-xl hover:bg-primary/5 transition-colors">
                    <div className="flex flex-col">
                      <span className="text-[12px] font-bold text-primary">{opt.label}</span>
                      <span className="text-[10px] text-primary/50 font-medium">Qty: {stock} {row.unit_of_measure}</span>
                    </div>
                    <div className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter ${
                      isLow ? "bg-amber-50 text-amber-600" : "bg-green-50 text-green-600"
                    }`}>
                      {isLow ? "Low" : "Good"}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-2 px-4 pt-2 border-t border-primary/5 flex justify-between items-center bg-primary/5 py-2">
              <span className="text-[10px] font-bold text-primary/40 italic">Threshold: {threshold}</span>
              <button onClick={() => setVariantPopId(null)} className="text-[10px] font-black text-primary hover:underline">Close</button>
            </div>
          </div>
        );
      })()}

      {/* ── Fixed action dropdown ── */}
      {openDropdownId && dropdownPos && (() => {
        const row = products.find((p) => p.product_id === openDropdownId);
        if (!row) return null;
        return (
          <div
            id="nfb-action-dropdown"
            style={{ position: "fixed", top: dropdownPos.top, right: dropdownPos.right, zIndex: 9999 }}
            className="w-[140px] bg-background border border-primary shadow-lg rounded-[4px] py-1 overflow-hidden text-primary text-[11px] font-semibold flex flex-col text-left"
          >
            <button
              onClick={() => { setEditTarget(row); setOpenDropdownId(null); setDropdownPos(null); }}
              className="px-3 py-1.5 hover:bg-accent text-left transition-colors"
            >
              Edit Product
            </button>
            <button
              onClick={() => { setRestockTarget(row); setOpenDropdownId(null); setDropdownPos(null); }}
              className="px-3 py-1.5 hover:bg-accent text-left transition-colors"
            >
              Restock
            </button>
            <button
              onClick={() => { setDeleteTarget(row); setOpenDropdownId(null); setDropdownPos(null); }}
              className="px-3 py-1.5 hover:bg-accent text-red-600 hover:text-primary text-left transition-colors"
            >
              Delete Product
            </button>
          </div>
        );
      })()}

      {/* Pagination */}
      <div className="w-full flex justify-end items-center gap-3 mt-6">
        {visibleCount > 5 && (
          <button onClick={() => setVisibleCount(5)} className="bg-transparent border border-primary text-primary text-[13px] font-bold px-8 py-2.5 rounded-[40px] shadow-sm hover:bg-primary/10 active:scale-95 transition-all">
            Show Less
          </button>
        )}
        {filtered.length > visibleCount && (
          <button onClick={() => setVisibleCount((p) => p + 5)} className="bg-accent text-primary text-[13px] font-bold px-8 py-2.5 rounded-[40px] shadow-sm hover:opacity-90 active:scale-95 transition-all">
            Load More
          </button>
        )}
      </div>

      {/* Modals */}
      {showAdd && (
        <NfbProductModal mode="add" tenantId={tenantId} onSave={handleAdd} onClose={() => setShowAdd(false)} colors={colors} />
      )}
      {editTarget && (
        <NfbProductModal mode="edit" tenantId={tenantId} initial={editTarget} onSave={handleEdit} onClose={() => setEditTarget(null)} colors={colors} />
      )}
      {deleteTarget && (
        <DeleteItemModal itemName={deleteTarget.name} onConfirm={handleDelete} onClose={() => setDeleteTarget(null)} />
      )}
      {restockTarget && (
        <RestockModal
          type="nfnb"
          product={restockTarget}
          tenantId={tenantId}
          onClose={() => setRestockTarget(null)}
          onSuccess={loadProducts}
          colors={colors}
        />
      )}
      {showCategories && (
        <ManageCategoriesModal
          tenantId={tenantId}
          type="nfb_product"
          placeholder="e.g. Cleaning supplies"
          onClose={() => { setShowCategories(false); loadProducts(); }}
          colors={colors}
        />
      )}
    </div>
  );
}