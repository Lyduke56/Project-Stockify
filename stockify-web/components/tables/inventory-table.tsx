"use client";

import { useState } from "react";
// Don't forget to update this interface in your types/product file!
import { Product } from "@/types/product";
import ProductModal from "./inventory-modals/product-modal";
import DeleteModal from "./inventory-modals/delete-modals";
import ManageCategoriesModal from "./inventory-modals/manage-categories-modal";

// Updated mock data to reflect the new Bill of Materials (BOM) concept
const INITIAL_PRODUCTS: any[] = [
  { id: 1, name: "Espresso",   img: null, sku: "ESP-01", category: "Coffee", unitCost: 45, price: 120, maxYield: 45, visible: true },
  { id: 2, name: "Cappuccino", img: null, sku: "CAP-01", category: "Coffee", unitCost: 65, price: 150, maxYield: 32, visible: true },
  { id: 3, name: "Latte",      img: null, sku: "LAT-01", category: "Coffee", unitCost: 60, price: 140, maxYield: 15, visible: false },
  { id: 4, name: "Americano",  img: null, sku: "AME-01", category: "Coffee", unitCost: 35, price: 110, maxYield: 45, visible: true },
  { id: 5, name: "Macchiato",  img: null, sku: "MAC-01", category: "Coffee", unitCost: 55, price: 130, maxYield: 8,  visible: true },
];

export default function InventoryTable() {
  const [products, setProducts] = useState<any[]>(INITIAL_PRODUCTS);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [editTarget, setEditTarget] = useState<any | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [showCategories, setShowCategories] = useState(false);

  const displayed = products.filter((p) => {
    const matchSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase());
      
    // Removed the "low stock" filter since alerts now belong to Raw Materials
    const matchFilter =
      filter === "all" ||
      (filter === "visible" && p.visible) ||
      (filter === "hidden" && !p.visible);
      
    return matchSearch && matchFilter;
  });

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
    <>
      {/* ── Toolbar ── */}
      <div className="flex items-center gap-3 flex-wrap mb-5">
        <input
          type="text"
          placeholder="Search Bar"
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
            <option value="all">Select Action</option>
            <option value="visible">Visible</option>
            <option value="hidden">Hidden</option>
            {/* Low Stock option removed */}
          </select>
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <button onClick={() => setShowCategories(true)} className="px-4 py-2 rounded-full bg-[#385E31] text-white text-sm font-bold hover:bg-[#2D4A27] transition-colors shadow">
            Manage Categories
          </button>
          <button onClick={() => setShowAdd(true)} className="px-4 py-2 rounded-full bg-[#F7B71D] text-[#2A3F25] text-sm font-bold hover:bg-[#e0a518] transition-colors shadow">
            Add Product
          </button>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="w-full overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#385E31] text-white">
              {/* Updated Table Headers */}
              {["Name", "Img", "SKU", "Category", "Unit Cost", "Price", "Max Yield", "Visible", "Actions"].map((h) => (
                <th key={h} className="px-4 py-3 text-center font-bold tracking-wide text-xs uppercase first:text-left">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayed.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-gray-400 text-sm bg-white">No products found.</td>
              </tr>
            ) : (
              displayed.map((p, i) => (
                <tr key={p.id} className={`border-b border-[#E8E0C0] transition-colors ${i % 2 === 0 ? "bg-[#FFFCEB]" : "bg-[#FFFCEB]"} hover:bg-[#FFF6CC]`}>
                  <td className="px-4 py-3 font-semibold text-[#2A3F25]">{p.name}</td>
                  <td className="px-4 py-3 text-center">
                    {p.img ? (
                      <img src={p.img} alt={p.name} className="w-8 h-8 object-cover rounded mx-auto" />
                    ) : (
                      <div className="w-7 h-7 border-2 border-[#385E31] rounded mx-auto bg-[#f5f0d8]" />
                    )}
                  </td>
                  <td className="px-4 py-3 text-center text-[#4A6545] font-mono">{p.sku}</td>
                  <td className="px-4 py-3 text-center text-[#4A6545]">{p.category}</td>
                  
                  {/* New Unit Cost Column */}
                  <td className="px-4 py-3 text-center text-[#4A6545] font-semibold">₱{(p.unitCost || 0).toFixed(2)}</td>
                  
                  <td className="px-4 py-3 text-center text-[#2A3F25] font-semibold">₱{(p.price || 0).toFixed(2)}</td>
                  
                  {/* Updated Stock to Max Yield */}
                  <td className="px-4 py-3 text-center">
                    {/* Kept a simple low-yield color change just for visual warning */}
                    <span className={`font-semibold ${p.maxYield <= 10 ? "text-red-500" : "text-[#2A3F25]"}`}>
                      {p.maxYield} Servings
                    </span>
                  </td>
                  
                  {/* Alert Limit column completely removed here */}
                  
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex items-center justify-center w-7 h-7 rounded border-2 font-bold text-xs ${p.visible ? "border-[#385E31] text-[#385E31] bg-[#e8f5e4]" : "border-gray-300 text-gray-300 bg-gray-50"}`}>
                      {p.visible ? "✓" : ""}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-3">
                      <button onClick={() => setEditTarget(p)} className="text-[#385E31] hover:text-[#F7B71D] transition-colors" title="Edit">
                        <img src="/icons-action/Edit.svg" alt="edit" className="w-5 h-5" />
                      </button>
                      <button onClick={() => setDeleteTarget(p)} className="text-[#385E31] hover:text-red-500 transition-colors" title="Delete">
                        <img src="/icons-action/Delete.svg" alt="delete" className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-gray-400 mt-2">
        Showing {displayed.length} of {products.length} product{products.length !== 1 ? "s" : ""}
      </p>

      {/* ── Modals ── */}
      {showAdd && <ProductModal mode="add" onSave={handleAdd} onClose={() => setShowAdd(false)} />}
      {editTarget && <ProductModal mode="edit" initial={editTarget} onSave={handleEdit} onClose={() => setEditTarget(null)} />}
      {deleteTarget && <DeleteModal product={deleteTarget} onConfirm={handleDelete} onClose={() => setDeleteTarget(null)} />}
      {showCategories && <ManageCategoriesModal onClose={() => setShowCategories(false)} />}
    </>
  );
}