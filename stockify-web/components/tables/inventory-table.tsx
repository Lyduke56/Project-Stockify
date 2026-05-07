"use client";

import { useState, useEffect, useRef } from "react";
// Don't forget to update this interface in your types/product file!
import { Product } from "@/types/product";
import ProductModal from "./inventory-modals/product-modal";
import DeleteModal from "./inventory-modals/delete-modals";
import ManageCategoriesModal from "./inventory-modals/manage-categories-modal";

// ── SVG helpers ───────────────────────────────────────────────────────────────

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

// ── Mock Data (15 Items) ──────────────────────────────────────────────────────

const INITIAL_PRODUCTS: any[] = [
  { id: 1,  name: "Espresso",               img: null, sku: "ESP-01", category: "Coffee",        unitCost: 45, price: 120, maxYield: 45, visible: true },
  { id: 2,  name: "Cappuccino",             img: null, sku: "CAP-01", category: "Coffee",        unitCost: 65, price: 150, maxYield: 32, visible: true },
  { id: 3,  name: "Latte",                  img: null, sku: "LAT-01", category: "Coffee",        unitCost: 60, price: 140, maxYield: 15, visible: false },
  { id: 4,  name: "Americano",              img: null, sku: "AME-01", category: "Coffee",        unitCost: 35, price: 110, maxYield: 45, visible: true },
  { id: 5,  name: "Macchiato",              img: null, sku: "MAC-01", category: "Coffee",        unitCost: 55, price: 130, maxYield: 8,  visible: true },
  { id: 6,  name: "Mocha",                  img: null, sku: "MOC-01", category: "Coffee",        unitCost: 70, price: 160, maxYield: 25, visible: true },
  { id: 7,  name: "Flat White",             img: null, sku: "FLT-01", category: "Coffee",        unitCost: 65, price: 145, maxYield: 30, visible: true },
  { id: 8,  name: "Matcha Latte",           img: null, sku: "MAT-01", category: "Tea",           unitCost: 80, price: 180, maxYield: 20, visible: true },
  { id: 9,  name: "Earl Grey",              img: null, sku: "EAR-01", category: "Tea",           unitCost: 30, price: 90,  maxYield: 50, visible: true },
  { id: 10, name: "Chamomile",              img: null, sku: "CHM-01", category: "Tea",           unitCost: 35, price: 95,  maxYield: 40, visible: false },
  { id: 11, name: "Croissant",              img: null, sku: "CRO-01", category: "Pastry",        unitCost: 40, price: 95,  maxYield: 15, visible: true },
  { id: 12, name: "Blueberry Muffin",       img: null, sku: "BMU-01", category: "Pastry",        unitCost: 45, price: 110, maxYield: 12, visible: true },
  { id: 13, name: "Chocolate Chip Cookie",  img: null, sku: "CCC-01", category: "Pastry",        unitCost: 25, price: 60,  maxYield: 24, visible: true },
  { id: 14, name: "Iced Caramel Macchiato", img: null, sku: "ICM-01", category: "Cold Beverage", unitCost: 75, price: 170, maxYield: 18, visible: true },
  { id: 15, name: "Lemonade",               img: null, sku: "LEM-01", category: "Cold Beverage", unitCost: 30, price: 85,  maxYield: 40, visible: true },
];

// Define column flex ratios so headers and rows align perfectly
const COLUMNS = [
  { label: "NAME",      className: "flex-[1.5] justify-start text-left pl-4" },
  { label: "IMG",       className: "w-[60px] justify-center flex-none" },
  { label: "SKU",       className: "flex-1 justify-center" },
  { label: "CATEGORY",  className: "flex-1 justify-center" },
  { label: "UNIT COST", className: "flex-1 justify-center" },
  { label: "PRICE",     className: "flex-1 justify-center" },
  { label: "MAX YIELD", className: "flex-1 justify-center" },
  { label: "VISIBLE",   className: "w-[70px] justify-center flex-none" },
  { label: "ACTIONS",   className: "flex-[1.2] justify-center" },
];

// ── Component ─────────────────────────────────────────────────────────────────

export default function InventoryTable() {
  const [products, setProducts] = useState<any[]>(INITIAL_PRODUCTS);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  
  // Pagination State
  const [visibleCount, setVisibleCount] = useState(5);
  
  const [editTarget, setEditTarget] = useState<any | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [showCategories, setShowCategories] = useState(false);

  // Dropdown state
  const [openDropdownId, setOpenDropdownId] = useState<string | number | null>(null);

  // Close dropdown on outside click
  const tableRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (tableRef.current && !tableRef.current.contains(e.target as Node)) {
        setOpenDropdownId(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // 1. Filter the entire dataset
  const filteredProducts = products.filter((p) => {
    const matchSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase());
      
    const matchFilter =
      filterStatus === "All" ||
      (filterStatus === "Visible" && p.visible) ||
      (filterStatus === "Hidden" && !p.visible);
      
    return matchSearch && matchFilter;
  });

  // 2. Slice the filtered data based on how many we want to display
  const displayed = filteredProducts.slice(0, visibleCount);

  // Reset visible count if search or filter changes so we don't end up on an empty page
  useEffect(() => {
    setVisibleCount(5);
  }, [search, filterStatus]);

  const handleAdd = (data: Omit<any, "id">) => {
    setProducts([...products, { ...data, id: Date.now() }]);
    setShowAdd(false);
  };

  const handleEdit = (data: Omit<any, "id">) => {
    setProducts(products.map((p) => (p.id === editTarget!.id ? { ...data, id: p.id } : p)));
    setEditTarget(null);
  };

  const handleDelete = () => {
    setProducts(products.filter((p) => p.id !== deleteTarget!.id));
    setDeleteTarget(null);
  };

  return (
    <div className="w-full font-['Inter']">
      
      {/* ── Toolbar: Search, Filter & Actions ── */}
      <div className="w-full flex flex-col lg:flex-row justify-between items-center mb-4 gap-4">
        
        {/* Left Side: Search & Filter */}
        <div className="flex w-full lg:w-auto flex-1 gap-4 items-center">
          
          {/* Search Bar */}
          <div className="relative flex-1 max-w-[400px]">
            <input
              type="text"
              placeholder="Search by product, sku, or category…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border border-[#385E31] rounded-full px-5 py-2.5 bg-transparent text-[#385E31] placeholder-[#385E31]/70 outline-none font-medium text-[13px]"
            />
            <div className="absolute right-4 top-3 text-[#385E31]"><SearchIcon /></div>
          </div>

          {/* Filter Dropdown */}
          <div className="relative w-[180px]">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full appearance-none border border-[#385E31] rounded-full px-5 py-2.5 bg-transparent text-[#385E31] outline-none font-medium cursor-pointer text-[13px]"
            >
              <option value="All">Filter By</option>
              <option value="Visible">Visible</option>
              <option value="Hidden">Hidden</option>
            </select>
            <div className="absolute right-4 top-3.5 text-[#385E31] pointer-events-none"><ChevronDown /></div>
          </div>
        </div>

        {/* Right Side: Action Buttons */}
        <div className="flex items-center gap-3 w-full lg:w-auto justify-end">
          <button 
            onClick={() => setShowCategories(true)} 
            className="px-6 py-2.5 rounded-[40px] bg-[#F7B71D] text-[#385E31] text-[13px] font-bold hover:opacity-90 active:scale-95 transition-all shadow-sm"
          >
            Manage Categories
          </button>
          <button 
            onClick={() => setShowAdd(true)} 
            className="px-6 py-2.5 rounded-[40px] bg-[#385E31] text-[#FFFCEB] text-[13px] font-bold hover:opacity-90 active:scale-95 transition-all shadow-sm"
          >
            Add Product
          </button>
        </div>
      </div>

      {/* ── Table Wrapper (Flex-based) ── */}
      <div
        ref={tableRef}
        className="w-full bg-[#FFFCEB] rounded-[10px] border border-[#385E31] flex flex-col overflow-visible shadow-sm"
      >
        {/* Header */}
        <div className="w-full flex bg-[#385E31] px-2 py-3 rounded-t-[8px]">
          {COLUMNS.map((col) => (
            <div key={col.label} className={`flex text-[#FFFCEB] text-[13px] font-bold items-center ${col.className}`}>
              {col.label}
            </div>
          ))}
        </div>

        {/* Rows */}
        {displayed.length === 0 ? (
          <div className="w-full text-center py-10 text-[#385E31] font-semibold text-sm">
            No products found.
          </div>
        ) : (
          displayed.map((row, idx) => {
            const isLast = idx === displayed.length - 1;
            const isOpen = openDropdownId === row.id;

            return (
              <div
                key={row.id}
                className={`w-full flex px-2 py-[10px] items-center ${!isLast ? "border-b border-[#385E31]/20" : ""}`}
              >
                {/* Name */}
                <div className={`flex text-[#3A6131] text-[13px] font-bold items-center ${COLUMNS[0].className}`}>
                  {row.name}
                </div>

                {/* Img */}
                <div className={`flex items-center ${COLUMNS[1].className}`}>
                  {row.img ? (
                    <img src={row.img} alt={row.name} className="w-8 h-8 object-cover rounded border border-[#385E31]" />
                  ) : (
                    <div className="w-8 h-8 border border-[#385E31] rounded bg-white flex items-center justify-center">
                       <span className="text-[#385E31]/50 text-[9px] font-bold">IMG</span>
                    </div>
                  )}
                </div>

                {/* SKU */}
                <div className={`flex text-[#3A6131] text-[13px] font-bold items-center ${COLUMNS[2].className}`}>
                  {row.sku}
                </div>

                {/* Category */}
                <div className={`flex text-[#3A6131] text-[13px] font-bold items-center ${COLUMNS[3].className}`}>
                  {row.category}
                </div>

                {/* Unit Cost */}
                <div className={`flex text-[#3A6131] text-[13px] font-bold items-center ${COLUMNS[4].className}`}>
                  ₱{(row.unitCost || 0).toFixed(2)}
                </div>

                {/* Price */}
                <div className={`flex text-[#385E31] text-[13px] font-extrabold items-center ${COLUMNS[5].className}`}>
                  ₱{(row.price || 0).toFixed(2)}
                </div>

                {/* Yield */}
                <div className={`flex text-[13px] font-bold items-center ${COLUMNS[6].className} ${row.maxYield <= 10 ? "text-[#E91F22]" : "text-[#3A6131]"}`}>
                  {row.maxYield}
                </div>

                {/* Visible Pill */}
                <div className={`flex items-center ${COLUMNS[7].className}`}>
                  <div className={`px-2.5 py-0.5 rounded-[40px] flex justify-center items-center ${row.visible ? "bg-[#385E31] text-[#FFFCEB]" : "bg-transparent border border-[#385E31]/40 text-[#385E31]"}`}>
                    <span className="text-[10px] font-bold leading-tight">
                      {row.visible ? "Yes" : "No"}
                    </span>
                  </div>
                </div>

                {/* Actions dropdown */}
                <div className={`flex relative items-center justify-center ${COLUMNS[8].className}`}>
                  <button
                    onClick={() => setOpenDropdownId((prev) => prev === row.id ? null : row.id)}
                    className={`border border-[#385E31] rounded-full px-3 py-1 text-[11px] font-bold flex items-center gap-1 transition-colors ${
                      isOpen
                        ? "bg-[#385E31] text-[#FFFCEB]"
                        : "text-[#385E31] hover:bg-[#385E31]/10"
                    }`}
                  >
                    Action <ChevronDown />
                  </button>

                  {isOpen && (
                    <div className="absolute top-8 right-[50%] translate-x-1/2 w-[140px] bg-[#FFFCEB] border border-[#385E31] shadow-lg rounded-[4px] z-50 py-1 overflow-hidden text-[#385E31] text-[11px] font-semibold flex flex-col text-left">
                      
                      <button
                        onClick={() => {
                          setEditTarget(row);
                          setOpenDropdownId(null);
                        }}
                        className="px-3 py-1.5 hover:bg-[#E5AD24] text-left transition-colors"
                      >
                        Edit Product
                      </button>

                      <button
                        onClick={() => {
                          setDeleteTarget(row);
                          setOpenDropdownId(null);
                        }}
                        className="px-3 py-1.5 hover:bg-[#E5AD24] text-[#E91F22] hover:text-[#385E31] text-left transition-colors"
                      >
                        Delete Product
                      </button>

                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ── Pagination Buttons ── */}
      <div className="w-full flex justify-end items-center gap-3 mt-6">
        
        {/* Show Less Button - Only appears when expanded beyond 5 items */}
        {visibleCount > 5 && (
          <button
            onClick={() => setVisibleCount(5)}
            className="bg-transparent border border-[#385E31] text-[#385E31] text-[13px] font-bold font-['Inter'] px-8 py-2.5 rounded-[40px] shadow-sm hover:bg-[#385E31]/10 active:scale-95 transition-all"
          >
            Show Less
          </button>
        )}

        {/* Load More Button - Only appears if there are more items to show */}
        {filteredProducts.length > visibleCount && (
          <button
            onClick={() => setVisibleCount((prev) => prev + 5)}
            className="bg-[#F7B71D] text-[#385E31] text-[13px] font-bold font-['Inter'] px-8 py-2.5 rounded-[40px] shadow-sm hover:opacity-90 active:scale-95 transition-all"
          >
            Load More
          </button>
        )}
      </div>

      {/* ── Modals ── */}
      {showAdd && <ProductModal mode="add" onSave={handleAdd} onClose={() => setShowAdd(false)} />}
      {editTarget && <ProductModal mode="edit" initial={editTarget} onSave={handleEdit} onClose={() => setEditTarget(null)} />}
      {deleteTarget && <DeleteModal product={deleteTarget} onConfirm={handleDelete} onClose={() => setDeleteTarget(null)} />}
      {showCategories && <ManageCategoriesModal onClose={() => setShowCategories(false)} />}
    </div>
  );
}