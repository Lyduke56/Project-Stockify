"use client";

import { useState } from "react";
// Adjust these import paths based on your actual folder structure
import MaterialModal from "./ingredients-modals/item-modal";
import ManageMaterialCategoriesModal from "./ingredients-modals/manage-categories-modal";

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

// Mock data using base units, but now with conversion and expiry logic included
const INITIAL_INGREDIENTS: Ingredient[] = [
  { id: 1, name: "Espresso Beans", sku: "RAW-ESP-01", category: "Coffee", stock: 5000, baseUnit: "g", alertLimit: 1000, purchaseUnit: "Bag", conversion: 1000, unitCost: 850, nearestExpiry: "2026-08-15" },
  { id: 2, name: "Whole Milk", sku: "RAW-MLK-01", category: "Dairy", stock: 15000, baseUnit: "ml", alertLimit: 3000, purchaseUnit: "Carton", conversion: 1000, unitCost: 95, nearestExpiry: "2026-05-12" },
  { id: 3, name: "Caramel Syrup", sku: "RAW-SYR-01", category: "Syrup", stock: 2500, baseUnit: "ml", alertLimit: 500, purchaseUnit: "Bottle", conversion: 1000, unitCost: 450, nearestExpiry: "2026-12-01" },
  { id: 4, name: "Paper Cups (Medium)", sku: "RAW-CUP-01", category: "Packaging", stock: 250, baseUnit: "pcs", alertLimit: 50, purchaseUnit: "Sleeve", conversion: 50, unitCost: 120, nearestExpiry: "N/A" },
  { id: 5, name: "Raw Sugar", sku: "RAW-SUG-01", category: "Condiments", stock: 3000, baseUnit: "g", alertLimit: 500, purchaseUnit: "Bag", conversion: 1000, unitCost: 65, nearestExpiry: "2027-01-10" },
];

export default function IngredientsTable() {
  const [ingredients, setIngredients] = useState<Ingredient[]>(INITIAL_INGREDIENTS);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  
  const [editTarget, setEditTarget] = useState<Ingredient | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Ingredient | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [showCategories, setShowCategories] = useState(false);

  const displayed = ingredients.filter((ing) => {
    const matchSearch =
      ing.name.toLowerCase().includes(search.toLowerCase()) ||
      ing.sku.toLowerCase().includes(search.toLowerCase()) ||
      ing.category.toLowerCase().includes(search.toLowerCase());
      
    const matchFilter =
      filter === "all" ||
      (filter === "low" && ing.stock <= ing.alertLimit);
      
    return matchSearch && matchFilter;
  });

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
    <>
      {/* ── Toolbar ── */}
      <div className="flex items-center gap-3 flex-wrap mb-5">
        <input
          type="text"
          placeholder="Search Ingredients"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-[200px] max-w-xs border border-[#C8D9C5] rounded-lg px-4 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#F7B71D] text-[#2A3F25] placeholder:text-gray-400 shadow-sm"
        />
        <div className="flex items-center gap-2">
          <span className="text-sm text-[#385E31] font-semibold whitespace-nowrap">Filter by:</span>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="border border-[#C8D9C5] rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#F7B71D] text-[#2A3F25] shadow-sm"
          >
            <option value="all">All Ingredients</option>
            <option value="low">Low Stock Alerts</option>
          </select>
        </div>
        <div className="flex items-center gap-2 ml-auto">
          {/* Managed Categories Button automatically sets state to true */}
          <button onClick={() => setShowCategories(true)} className="px-4 py-2 rounded-full bg-[#385E31] text-white text-sm font-bold hover:bg-[#2D4A27] transition-colors shadow">
            Manage Categories
          </button>
          {/* Add Item Button automatically sets state to true */}
          <button onClick={() => setShowAdd(true)} className="px-4 py-2 rounded-full bg-[#F7B71D] text-[#2A3F25] text-sm font-bold hover:bg-[#e0a518] transition-colors shadow">
            Add Item
          </button>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="w-full overflow-x-auto">
        <table className="w-full text-sm whitespace-nowrap">
          <thead>
            <tr className="bg-[#385E31] text-white">
              {["Material Name", "SKU", "Category", "Current Stock", "Alert Limit", "Unit Cost", "Nearest Expiry", "Actions"].map((h) => (
                <th key={h} className="px-4 py-3 text-center font-bold tracking-wide text-xs uppercase first:text-left">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayed.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-gray-400 text-sm bg-white">No raw materials found.</td>
              </tr>
            ) : (
              displayed.map((ing, i) => {
                const purchasingQty = (ing.stock / ing.conversion).toFixed(1).replace(/\.0$/, ""); 

                return (
                  <tr key={ing.id} className={`border-b border-[#E8E0C0] transition-colors ${i % 2 === 0 ? "bg-[#FFFCEB]" : "bg-[#FFFCEB]"} hover:bg-[#FFF6CC]`}>
                    <td className="px-4 py-3 font-semibold text-[#2A3F25]">{ing.name}</td>
                    <td className="px-4 py-3 text-center text-[#4A6545] font-mono">{ing.sku}</td>
                    <td className="px-4 py-3 text-center text-[#4A6545]">{ing.category}</td>
                    
                    <td className="px-4 py-3 text-center">
                      <span className={`font-semibold ${ing.stock <= ing.alertLimit ? "text-red-500" : "text-[#2A3F25]"}`}>
                        {purchasingQty} {ing.purchaseUnit}s ({ing.stock}{ing.baseUnit})
                      </span>
                    </td>
                    
                    <td className="px-4 py-3 text-center text-[#4A6545]">
                      {ing.alertLimit} {ing.baseUnit}
                    </td>

                    <td className="px-4 py-3 text-center text-[#4A6545]">
                      ₱{ing.unitCost.toFixed(2)}
                    </td>

                    <td className="px-4 py-3 text-center text-[#4A6545]">
                      {ing.nearestExpiry}
                    </td>
                    
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-3">
                        <button onClick={() => setEditTarget(ing)} className="text-[#385E31] hover:text-[#F7B71D] transition-colors" title="Edit">
                          <img src="/icons-action/Edit.svg" alt="edit" className="w-5 h-5" />
                        </button>
                        <button onClick={() => setDeleteTarget(ing)} className="text-[#385E31] hover:text-red-500 transition-colors" title="Delete">
                          <img src="/icons-action/Delete.svg" alt="delete" className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-gray-400 mt-2">
        Showing {displayed.length} of {ingredients.length} raw material{ingredients.length !== 1 ? "s" : ""}
      </p>

      {/* ── Modals ── */}
      {/* 1. Add Material Modal */}
      {showAdd && (
        <MaterialModal 
          mode="add" 
          onSave={handleAdd} 
          onClose={() => setShowAdd(false)} 
        />
      )}

      {/* 2. Edit Material Modal (Shares the same component as Add) */}
      {editTarget && (
        <MaterialModal 
          mode="edit" 
          initial={editTarget} 
          onSave={handleEdit} 
          onClose={() => setEditTarget(null)} 
        />
      )}

      {/* 3. Manage Categories Modal */}
      {showCategories && (
        <ManageMaterialCategoriesModal 
          onClose={() => setShowCategories(false)} 
        />
      )}

      {/* 4. Delete Confirmation (Left commented until you build the DeleteModal component) */}
      {/* {deleteTarget && <DeleteModal target={deleteTarget} onConfirm={handleDelete} onClose={() => setDeleteTarget(null)} />} */}
    </>
  );
}