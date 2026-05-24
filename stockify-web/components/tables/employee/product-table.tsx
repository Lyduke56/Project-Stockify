"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  fetchProducts,
  addProduct,
  updateProduct,
  deleteProduct,
  uploadProductImage,
  getCurrentUserContext,
  type Product,
  type RecipeInput,
  type SizeInput,
} from "@/lib/employee/products";
import ProductModal          from "@/components/modals/employee/product-modals/product-modal";
import ManageCategoriesModal from "@/components/modals/employee/product-modals/manage-categories-modal";
import DeleteItemModal       from "@/components/modals/employee/ingredients-modals/delete-item-modal";
import RestockModal          from "@/components/modals/employee/product-modals/restock-modal";
import { RefreshCw } from "lucide-react";
import { type StorefrontConfig } from "@/lib/admin/storefront-actions";

const SearchIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const ChevronDown = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const COLUMNS = [
  { label: "NAME",         className: "flex-[1.5] justify-start text-left pl-4" },
  { label: "SKU",          className: "flex-1 justify-center" },
  { label: "CATEGORY",     className: "flex-1 justify-center" },
  { label: "UNIT COST",    className: "flex-1 justify-center" },
  { label: "PRICE",        className: "flex-1 justify-center" },
  { label: "AVAILABILITY", className: "flex-1 justify-center" },
  { label: "VISIBLE",      className: "w-[70px] justify-center flex-none" },
  { label: "ACTIONS",      className: "flex-[1.2] justify-center" },
];

interface ProductsTableProps {
  tenantId:       string;
  onLoadComplete?: () => void;
  colors?: StorefrontConfig | null;
}

export default function ProductsTable({ tenantId, onLoadComplete, colors }: ProductsTableProps) {
  const [products,     setProducts]     = useState<Product[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState<string | null>(null);
  const [search,       setSearch]       = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [visibleCount, setVisibleCount] = useState(5);
  const [showAdd,        setShowAdd]        = useState(false);
  const [editTarget,     setEditTarget]     = useState<Product | null>(null);
  const [deleteTarget,   setDeleteTarget]   = useState<Product | null>(null);
  const [showCategories, setShowCategories] = useState(false);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const tableRef = useRef<HTMLDivElement>(null);

  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setProducts(await fetchProducts(tenantId));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
      onLoadComplete?.();
    }
  }, [tenantId, onLoadComplete]);

  useEffect(() => { loadProducts(); }, [loadProducts]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (tableRef.current && !tableRef.current.contains(e.target as Node))
        setOpenDropdownId(null);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => { setVisibleCount(5); }, [search, filterStatus]);

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

  const handleAdd = async (input: Parameters<typeof addProduct>[1], recipe: RecipeInput[], sizes: SizeInput[]) => {
    await addProduct(tenantId, input, recipe, sizes);
    setShowAdd(false);
    loadProducts();
  };

  const handleEdit = async (input: Parameters<typeof addProduct>[1], recipe: RecipeInput[], sizes: SizeInput[]) => {
    if (!editTarget) return;
    await updateProduct(editTarget.product_id, tenantId, input, recipe, sizes);
    setEditTarget(null);
    loadProducts();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deleteProduct(deleteTarget.product_id, tenantId, deleteTarget.name);
    setDeleteTarget(null);
    loadProducts();
  };

  return (
    <div className="w-full font-['Inter']">
      {/* Toolbar */}
      <div className="w-full flex flex-col lg:flex-row justify-between items-center mb-4 gap-4">
        <div className="flex w-full lg:w-auto flex-1 gap-4 items-center">
          <div className="relative flex-1 max-w-[400px]">
            <input type="text" placeholder="Search by product, SKU, or category…" value={search} onChange={(e) => setSearch(e.target.value)} className="w-full border border-primary rounded-full px-5 py-2.5 bg-transparent text-primary placeholder-primary/70 outline-none font-medium text-[13px]" />
            <div className="absolute right-4 top-3 text-primary"><SearchIcon /></div>
          </div>
          <div className="relative w-[180px]">
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="w-full appearance-none border border-primary rounded-full px-5 py-2.5 bg-transparent text-primary outline-none font-medium cursor-pointer text-[13px]">
              <option value="All">Filter By</option>
              <option value="Visible">Visible</option>
              <option value="Hidden">Hidden</option>
            </select>
            <div className="absolute right-4 top-3.5 text-primary pointer-events-none"><ChevronDown /></div>
          </div>
        </div>
        <div className="flex items-center gap-3 w-full lg:w-auto justify-end">
          <button onClick={loadProducts} className="p-2.5 rounded-full border border-primary text-primary hover:bg-primary/10 transition-all" title="Refresh"><RefreshCw size={16} /></button>
          <button onClick={() => setShowCategories(true)} className="px-6 py-2.5 rounded-[40px] bg-accent text-primary text-[13px] font-bold hover:opacity-90 active:scale-95 transition-all shadow-sm">Manage Categories</button>
          <button onClick={() => setShowAdd(true)} className="px-6 py-2.5 rounded-[40px] bg-primary text-[var(--color-sidebar-text,#FFF9D7)] text-[13px] font-bold hover:opacity-90 active:scale-95 transition-all shadow-sm">Add Product</button>
        </div>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-2xl text-red-600 text-sm font-semibold flex items-center justify-between">
          <span>{error}</span>
          <button onClick={loadProducts} className="text-red-400 hover:text-red-600 underline text-xs">Retry</button>
        </div>
      )}

      <div ref={tableRef} className="w-full bg-transparent rounded-[10px] border border-primary flex flex-col overflow-visible shadow-sm">
        <div className="w-full flex bg-primary px-2 py-3 rounded-t-[8px]">
          {COLUMNS.map((col) => (
            <div key={col.label} className={`flex text-[var(--color-sidebar-text,#FFF9D7)] text-[12px] font-bold items-center ${col.className}`}>{col.label}</div>
          ))}
        </div>

        {displayed.length === 0 ? (
          <div className="w-full text-center py-10 text-primary font-semibold text-sm">
            {search || filterStatus !== "All" ? "No products match your filters." : "No products yet. Add your first product!"}
          </div>
        ) : (
          displayed.map((row, idx) => {
            const isLast   = idx === displayed.length - 1;
            const isOpen   = openDropdownId === row.product_id;
            const hasSizes = row.sizes && row.sizes.length > 0;

            return (
              <div key={row.product_id} className={`w-full flex px-2 py-[10px] items-center ${!isLast ? "border-b border-primary/20" : ""}`}>
                <div className={`flex flex-col justify-center ${COLUMNS[0].className}`}>
                  <span className="text-primary text-[13px] font-bold">{row.name}</span>
                  {hasSizes && (
                    <span className="text-[10px] text-primary/60 font-semibold mt-0.5">{row.sizes!.map((s) => s.label).join(" · ")}</span>
                  )}
                </div>
                <div className={`flex text-primary text-[12px] font-bold font-mono items-center ${COLUMNS[1].className}`}>{row.sku}</div>
                <div className={`flex text-primary text-[13px] font-bold items-center ${COLUMNS[2].className}`}>{row.category_name ?? "—"}</div>
                <div className={`flex text-primary text-[13px] font-bold items-center ${COLUMNS[3].className}`}>
                  {(() => {
                    const sizes = row.sizes || [];
                    if (sizes.length === 0) return `₱${Number(row.unit_cost).toFixed(2)}`;
                    const costs = sizes.map(s => Number(s.unit_cost) || 0);
                    const min = Math.min(...costs); const max = Math.max(...costs);
                    return min === max ? `₱${min.toFixed(2)}` : `₱${min.toFixed(2)} – ₱${max.toFixed(2)}`;
                  })()}
                </div>
                <div className={`flex flex-col items-center justify-center ${COLUMNS[4].className}`}>
                  <span className="text-primary text-[13px] font-extrabold text-center leading-tight">
                    {(() => {
                      const sizes = row.sizes || [];
                      if (sizes.length === 0) return `₱${Number(row.price).toFixed(2)}`;
                      const prices = sizes.map(s => Number(s.price) || 0);
                      const min = Math.min(...prices); const max = Math.max(...prices);
                      return min === max ? `₱${min.toFixed(2)}` : `₱${min.toFixed(2)} – ₱${max.toFixed(2)}`;
                    })()}
                  </span>
                  {hasSizes && (
                    <span className="text-[10px] text-primary/40 font-semibold mt-0.5">{row.sizes!.length} variants</span>
                  )}
                </div>
                <div className={`flex flex-col items-center justify-center ${COLUMNS[5].className}`}>
                  {hasSizes ? (
                    <div className="flex flex-wrap justify-center gap-1 px-1">
                      {row.sizes!.map((s) => (
                        <span key={s.size_id} className={`text-[10px] font-black px-1.5 py-0.5 rounded-md border ${
                          s.max_yield <= 5 ? "bg-red-500 text-white border-red-600" :
                          s.max_yield <= 15 ? "bg-amber-500 text-white border-amber-600" :
                          "bg-white/10 text-primary border-primary/20"
                        }`}>
                          {s.label.charAt(0).toUpperCase()}: {s.max_yield}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className={`text-[13px] font-black ${
                      row.max_yield <= 5 ? "text-red-500" : row.max_yield <= 15 ? "text-amber-500" : "text-primary"
                    }`}>{row.max_yield}</span>
                  )}
                </div>
                <div className={`flex items-center ${COLUMNS[6].className}`}>
                  <div className={`px-2.5 pb-[3px] pt-[4px] rounded-[40px] flex justify-center items-center ${row.visible ? "bg-accent text-primary" : "bg-transparent border border-primary/40 text-primary"}`}>
                    <span className="text-[10px] font-bold leading-tight">{row.visible ? "Yes" : "No"}</span>
                  </div>
                </div>
                <div className={`flex relative items-center justify-center ${COLUMNS[7].className}`}>
                  <button onClick={() => setOpenDropdownId((prev) => prev === row.product_id ? null : row.product_id)} className={`border border-primary rounded-full px-3 py-1 text-[11px] font-bold flex items-center gap-1 transition-colors ${isOpen ? "bg-accent text-primary" : "text-primary hover:bg-primary/10"}`}>
                    Action <ChevronDown />
                  </button>
                  {isOpen && (
                    <div className="absolute top-8 right-[50%] translate-x-1/2 w-[140px] bg-background border border-primary shadow-lg rounded-[4px] z-50 py-1 overflow-hidden text-primary text-[11px] font-semibold flex flex-col text-left">
                      <button onClick={() => { setEditTarget(row); setOpenDropdownId(null); }} className="px-3 py-1.5 hover:bg-accent text-left transition-colors">Edit Product</button>
                      <button onClick={() => { setDeleteTarget(row); setOpenDropdownId(null); }} className="px-3 py-1.5 hover:bg-accent text-red-600 hover:text-primary text-left transition-colors">Delete Product</button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="w-full flex justify-end items-center gap-3 mt-6">
        {visibleCount > 5 && <button onClick={() => setVisibleCount(5)} className="bg-transparent border border-primary text-primary text-[13px] font-bold px-8 py-2.5 rounded-[40px] shadow-sm hover:bg-primary/10 active:scale-95 transition-all">Show Less</button>}
        {filtered.length > visibleCount && <button onClick={() => setVisibleCount((p) => p + 5)} className="bg-accent text-primary text-[13px] font-bold px-8 py-2.5 rounded-[40px] shadow-sm hover:opacity-90 active:scale-95 transition-all">Load More</button>}
      </div>

      {showAdd      && <ProductModal mode="add"  tenantId={tenantId} onSave={handleAdd}  onClose={() => setShowAdd(false)} colors={colors} />}
      {editTarget   && <ProductModal mode="edit" tenantId={tenantId} productId={editTarget.product_id} initial={editTarget} onSave={handleEdit} onClose={() => setEditTarget(null)} colors={colors} />}
      {deleteTarget && <DeleteItemModal itemName={deleteTarget.name} onConfirm={handleDelete} onClose={() => setDeleteTarget(null)} />}
      {showCategories && <ManageCategoriesModal tenantId={tenantId} type="fnb_product" placeholder="e.g. Cold Beverage" onClose={() => { setShowCategories(false); loadProducts(); }} colors={colors} />}
    </div>
  );
}