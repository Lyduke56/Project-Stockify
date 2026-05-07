"use client";

import { useState, useEffect, useRef } from "react";
// Adjust these import paths based on your actual folder structure
import MaterialModal from "./ingredients-modals/item-modal";
import ManageMaterialCategoriesModal from "./ingredients-modals/manage-categories-modal";

// ── Types ─────────────────────────────────────────────────────────────────────

export type Ingredient = {
  id: number;
  name: string;
  sku: string;
  category: string;
  stock: number;         // Total stock in BASE units (e.g., 5000)
  baseUnit: string;      // e.g., "g", "ml", "pcs"
  alertLimit: number;    // Alert trigger in BASE units
  purchaseUnit: string;  // e.g., "Bag", "Carton"
  conversion: number;    // How many base units in 1 purchase unit
  unitCost: number;      // Cost per purchase unit
  nearestExpiry: string; // YYYY-MM-DD
};

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

const INITIAL_INGREDIENTS: Ingredient[] = [
  { id: 1,  name: "Espresso Beans",    sku: "RAW-ESP-01", category: "Coffee",     stock: 5000,  baseUnit: "g",   alertLimit: 1000, purchaseUnit: "Bag",    conversion: 1000, unitCost: 850, nearestExpiry: "2026-08-15" },
  { id: 2,  name: "Whole Milk",        sku: "RAW-MLK-01", category: "Dairy",      stock: 15000, baseUnit: "ml",  alertLimit: 3000, purchaseUnit: "Carton", conversion: 1000, unitCost: 95,  nearestExpiry: "2026-05-12" },
  { id: 3,  name: "Caramel Syrup",     sku: "RAW-SYR-01", category: "Syrup",      stock: 2500,  baseUnit: "ml",  alertLimit: 500,  purchaseUnit: "Bottle", conversion: 1000, unitCost: 450, nearestExpiry: "2026-12-01" },
  { id: 4,  name: "Paper Cups (Med)",  sku: "RAW-CUP-01", category: "Packaging",  stock: 250,   baseUnit: "pcs", alertLimit: 50,   purchaseUnit: "Sleeve", conversion: 50,   unitCost: 120, nearestExpiry: "N/A" },
  { id: 5,  name: "Raw Sugar",         sku: "RAW-SUG-01", category: "Condiments", stock: 3000,  baseUnit: "g",   alertLimit: 500,  purchaseUnit: "Bag",    conversion: 1000, unitCost: 65,  nearestExpiry: "2027-01-10" },
  { id: 6,  name: "Matcha Powder",     sku: "RAW-MAT-01", category: "Tea",        stock: 800,   baseUnit: "g",   alertLimit: 200,  purchaseUnit: "Tin",    conversion: 200,  unitCost: 650, nearestExpiry: "2026-09-20" },
  { id: 7,  name: "Oat Milk",          sku: "RAW-OAT-01", category: "Dairy Alt",  stock: 8000,  baseUnit: "ml",  alertLimit: 2000, purchaseUnit: "Carton", conversion: 1000, unitCost: 145, nearestExpiry: "2026-06-30" },
  { id: 8,  name: "Vanilla Syrup",     sku: "RAW-SYR-02", category: "Syrup",      stock: 1500,  baseUnit: "ml",  alertLimit: 500,  purchaseUnit: "Bottle", conversion: 1000, unitCost: 450, nearestExpiry: "2026-11-15" },
  { id: 9,  name: "Cup Lids (Med)",    sku: "RAW-LID-01", category: "Packaging",  stock: 300,   baseUnit: "pcs", alertLimit: 100,  purchaseUnit: "Sleeve", conversion: 50,   unitCost: 80,  nearestExpiry: "N/A" },
  { id: 10, name: "Cocoa Powder",      sku: "RAW-COC-01", category: "Chocolate",  stock: 2000,  baseUnit: "g",   alertLimit: 500,  purchaseUnit: "Bag",    conversion: 1000, unitCost: 550, nearestExpiry: "2026-10-05" },
  { id: 11, name: "Wooden Stirrers",   sku: "RAW-STR-01", category: "Packaging",  stock: 1500,  baseUnit: "pcs", alertLimit: 300,  purchaseUnit: "Box",    conversion: 500,  unitCost: 90,  nearestExpiry: "N/A" },
  { id: 12, name: "Earl Grey Tea Bags",sku: "RAW-TEA-01", category: "Tea",        stock: 400,   baseUnit: "pcs", alertLimit: 100,  purchaseUnit: "Box",    conversion: 100,  unitCost: 350, nearestExpiry: "2027-02-28" },
  { id: 13, name: "Dark Choc Chips",   sku: "RAW-CHC-01", category: "Toppings",   stock: 450,   baseUnit: "g",   alertLimit: 500,  purchaseUnit: "Bag",    conversion: 1000, unitCost: 700, nearestExpiry: "2026-07-12" }, // Low stock item
  { id: 14, name: "Ice Cubes",         sku: "RAW-ICE-01", category: "Misc",       stock: 10000, baseUnit: "g",   alertLimit: 2000, purchaseUnit: "Bag",    conversion: 5000, unitCost: 40,  nearestExpiry: "N/A" },
  { id: 15, name: "Napkins",           sku: "RAW-NAP-01", category: "Packaging",  stock: 5000,  baseUnit: "pcs", alertLimit: 1000, purchaseUnit: "Pack",   conversion: 1000, unitCost: 150, nearestExpiry: "N/A" },
];

// Define column flex ratios
const COLUMNS = [
  { label: "Material Name",  className: "flex-[1.5] justify-start text-left pl-4" },
  { label: "SKU",            className: "flex-1 justify-center" },
  { label: "Category",       className: "flex-[0.8] justify-center" },
  { label: "Current Stock",  className: "flex-[1.2] justify-center" },
  { label: "Alert Limit",    className: "flex-[0.8] justify-center" },
  { label: "Unit Cost",      className: "flex-[0.8] justify-center" },
  { label: "Nearest Expiry", className: "flex-1 justify-center" },
  { label: "Actions",        className: "flex-[0.8] justify-center" },
];

// ── Component ─────────────────────────────────────────────────────────────────

export default function IngredientsTable() {
  const [ingredients, setIngredients] = useState<Ingredient[]>(INITIAL_INGREDIENTS);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  
  // Pagination State
  const [visibleCount, setVisibleCount] = useState(5);

  const [editTarget, setEditTarget] = useState<Ingredient | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Ingredient | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [showCategories, setShowCategories] = useState(false);

  // Dropdown state
  const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);

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

  // 1. Filter dataset
  const filteredIngredients = ingredients.filter((ing) => {
    const matchSearch =
      ing.name.toLowerCase().includes(search.toLowerCase()) ||
      ing.sku.toLowerCase().includes(search.toLowerCase()) ||
      ing.category.toLowerCase().includes(search.toLowerCase());
      
    const matchFilter =
      filterStatus === "All" ||
      (filterStatus === "Low" && ing.stock <= ing.alertLimit);
      
    return matchSearch && matchFilter;
  });

  // 2. Slice the filtered data based on how many we want to display
  const displayed = filteredIngredients.slice(0, visibleCount);

  // Reset visible count if search or filter changes
  useEffect(() => {
    setVisibleCount(5);
  }, [search, filterStatus]);

  const handleAdd = (data: Omit<Ingredient, "id">) => {
    setIngredients([...ingredients, { ...data, id: Date.now() }]);
    setShowAdd(false);
  };

  const handleEdit = (data: Omit<Ingredient, "id">) => {
    setIngredients(ingredients.map((ing) => (ing.id === editTarget!.id ? { ...data, id: ing.id } : ing)));
    setEditTarget(null);
  };

  const handleDelete = () => {
    setIngredients(ingredients.filter((ing) => ing.id !== deleteTarget!.id));
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
              placeholder="Search by material, sku, or category…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border border-[#385E31] rounded-full px-5 py-2.5 bg-transparent text-[#385E31] placeholder-[#385E31]/70 outline-none font-medium text-[13px]"
            />
            <div className="absolute right-4 top-3 text-[#385E31]"><SearchIcon /></div>
          </div>

          {/* Filter Dropdown */}
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
            Add Item
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
            <div key={col.label} className={`flex text-[#FFFCEB] text-[12px] font-bold items-center uppercase tracking-wide ${col.className}`}>
              {col.label}
            </div>
          ))}
        </div>

        {/* Rows */}
        {displayed.length === 0 ? (
          <div className="w-full text-center py-10 text-[#385E31] font-semibold text-sm">
            No ingredients found.
          </div>
        ) : (
          displayed.map((row, idx) => {
            const isLast = idx === displayed.length - 1;
            const isOpen = openDropdownId === row.id;
            const purchasingQty = (row.stock / row.conversion).toFixed(1).replace(/\.0$/, ""); 
            const isLowStock = row.stock <= row.alertLimit;

            return (
              <div
                key={row.id}
                className={`w-full flex px-2 py-[12px] items-center ${!isLast ? "border-b border-[#385E31]/20" : ""}`}
              >
                {/* Material Name */}
                <div className={`flex text-[#3A6131] text-[13px] font-bold items-center ${COLUMNS[0].className}`}>
                  {row.name}
                </div>

                {/* SKU */}
                <div className={`flex text-[#3A6131] text-[12px] font-bold font-mono items-center ${COLUMNS[1].className}`}>
                  {row.sku}
                </div>

                {/* Category */}
                <div className={`flex text-[#3A6131] text-[13px] font-bold items-center ${COLUMNS[2].className}`}>
                  {row.category}
                </div>

                {/* Current Stock */}
                <div className={`flex text-[12px] font-bold items-center ${COLUMNS[3].className} ${isLowStock ? "text-[#E91F22]" : "text-[#3A6131]"}`}>
                  {purchasingQty} {row.purchaseUnit}s <span className="opacity-70 ml-1 text-[11px]">({row.stock}{row.baseUnit})</span>
                </div>

                {/* Alert Limit */}
                <div className={`flex text-[#3A6131] text-[13px] font-bold items-center ${COLUMNS[4].className}`}>
                  {row.alertLimit} {row.baseUnit}
                </div>

                {/* Unit Cost */}
                <div className={`flex text-[#385E31] text-[13px] font-extrabold items-center ${COLUMNS[5].className}`}>
                  ₱{row.unitCost.toFixed(2)}
                </div>

                {/* Nearest Expiry */}
                <div className={`flex text-[#3A6131] text-[13px] font-bold items-center ${COLUMNS[6].className}`}>
                  {row.nearestExpiry}
                </div>

                {/* Actions dropdown */}
                <div className={`flex relative items-center justify-center ${COLUMNS[7].className}`}>
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
                        Edit Item
                      </button>

                      <button
                        onClick={() => {
                          setDeleteTarget(row);
                          setOpenDropdownId(null);
                        }}
                        className="px-3 py-1.5 hover:bg-[#E5AD24] text-[#E91F22] hover:text-[#385E31] text-left transition-colors"
                      >
                        Delete Item
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
        
        {/* Show Less Button */}
        {visibleCount > 5 && (
          <button
            onClick={() => setVisibleCount(5)}
            className="bg-transparent border border-[#385E31] text-[#385E31] text-[13px] font-bold font-['Inter'] px-8 py-2.5 rounded-[40px] shadow-sm hover:bg-[#385E31]/10 active:scale-95 transition-all"
          >
            Show Less
          </button>
        )}

        {/* Load More Button */}
        {filteredIngredients.length > visibleCount && (
          <button
            onClick={() => setVisibleCount((prev) => prev + 5)}
            className="bg-[#F7B71D] text-[#385E31] text-[13px] font-bold font-['Inter'] px-8 py-2.5 rounded-[40px] shadow-sm hover:opacity-90 active:scale-95 transition-all"
          >
            Load More
          </button>
        )}
      </div>

      {/* ── Modals ── */}
      {showAdd && (
        <MaterialModal 
          mode="add" 
          onSave={handleAdd} 
          onClose={() => setShowAdd(false)} 
        />
      )}

      {editTarget && (
        <MaterialModal 
          mode="edit" 
          initial={editTarget} 
          onSave={handleEdit} 
          onClose={() => setEditTarget(null)} 
        />
      )}

      {showCategories && (
        <ManageMaterialCategoriesModal 
          onClose={() => setShowCategories(false)} 
        />
      )}

      {/* Delete Confirmation (Leave commented until you build the DeleteModal component) */}
      {/* {deleteTarget && <DeleteModal target={deleteTarget} onConfirm={handleDelete} onClose={() => setDeleteTarget(null)} />} */}
    </div>
  );
}