"use client";

import { useState } from "react";
import ModalBackdrop from "./modals-bakcdrop";
import { Product, CATEGORIES } from "@/types/product";

interface ProductModalProps {
  mode: "add" | "edit";
  initial?: Product;
  onSave: (data: Omit<Product, "id">) => void;
  onClose: () => void;
}

export default function ProductModal({ mode, initial, onSave, onClose }: ProductModalProps) {
  const [form, setForm] = useState(
    initial
      ? {
          name: initial.name,
          sku: initial.sku,
          category: initial.category,
          price: String(initial.price),
          stock: String(initial.stock),
          stockUnit: initial.stockUnit,
          alertLimit: initial.alertLimit,
          visible: initial.visible,
          img: initial.img,
        }
      : {
          name: "",
          sku: "",
          category: "Coffee",
          price: "",
          stock: "",
          stockUnit: "kg",
          alertLimit: "",
          visible: true,
          img: null as string | null,
        }
  );

  const set = (key: string, val: string | boolean | null) =>
    setForm((f) => ({ ...f, [key]: val }));

  const handleSave = () => {
    if (!form.name || !form.sku || !form.price || !form.stock) return;
    onSave({
      name: form.name,
      sku: form.sku,
      category: form.category,
      price: Number(form.price),
      stock: Number(form.stock),
      stockUnit: form.stockUnit,
      alertLimit: form.alertLimit || `<= ${form.stock}${form.stockUnit}`,
      visible: form.visible,
      img: form.img,
    });
  };

  const label = "block text-xs font-semibold text-[#385E31] mb-1 uppercase tracking-wide";
  const input = "w-full border border-[#C8D9C5] rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#F7B71D] text-[#2A3F25]";

  return (
    <ModalBackdrop onClose={onClose}>
      <div className="bg-[#FFFCEB] rounded-2xl shadow-2xl w-[520px] max-h-[90vh] overflow-y-auto border border-[#E2D88A]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E2D88A]">
          <h2 className="text-[#385E31] font-extrabold text-lg uppercase tracking-wide">
            {mode === "add" ? "Add Product" : "Edit Product"}
          </h2>
          <button onClick={onClose} className="text-[#385E31] hover:text-red-500 transition-colors">
            <img src="/icons/x.png" alt="close" className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className={label}>Product Name</label>
            <input className={input} value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Espresso" />
          </div>

          <div>
            <label className={label}>SKU</label>
            <input className={input} value={form.sku} onChange={(e) => set("sku", e.target.value)} placeholder="e.g. ESP-01" />
          </div>

          <div>
            <label className={label}>Category</label>
            <select className={input} value={form.category} onChange={(e) => set("category", e.target.value)}>
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <label className={label}>Price (₱)</label>
            <input className={input} type="number" min={0} value={form.price} onChange={(e) => set("price", e.target.value)} placeholder="0.00" />
          </div>

          <div>
            <label className={label}>Stock</label>
            <div className="flex gap-2">
              <input className={input} type="number" min={0} value={form.stock} onChange={(e) => set("stock", e.target.value)} placeholder="0" />
              <select
                className="border border-[#C8D9C5] rounded-lg px-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#F7B71D] text-[#2A3F25]"
                value={form.stockUnit}
                onChange={(e) => set("stockUnit", e.target.value)}
              >
                <option>kg</option>
                <option>g</option>
                <option>pcs</option>
                <option>L</option>
              </select>
            </div>
          </div>

          <div className="col-span-2">
            <label className={label}>Alert Limit</label>
            <input className={input} value={form.alertLimit} onChange={(e) => set("alertLimit", e.target.value)} placeholder="e.g. <= 5kg" />
          </div>

          <div className="col-span-2 flex items-center gap-3">
            <button
              type="button"
              onClick={() => set("visible", !form.visible)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.visible ? "bg-[#385E31]" : "bg-gray-300"}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${form.visible ? "translate-x-6" : "translate-x-1"}`} />
            </button>
            <span className="text-sm font-semibold text-[#385E31]">
              {form.visible ? "Visible to customers" : "Hidden from customers"}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-[#E2D88A]">
          <button onClick={onClose} className="px-5 py-2 rounded-full border border-[#385E31] text-[#385E31] text-sm font-semibold hover:bg-[#385E31] hover:text-white transition-colors">
            Cancel
          </button>
          <button onClick={handleSave} className="px-5 py-2 rounded-full bg-[#F7B71D] text-[#2A3F25] text-sm font-bold hover:bg-[#e0a518] transition-colors shadow">
            {mode === "add" ? "Add Product" : "Save Changes"}
          </button>
        </div>
      </div>
    </ModalBackdrop>
  );
}