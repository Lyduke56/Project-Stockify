"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import ModalBackdrop from "./modals-backdrop";
import { X, Package, ChevronRight, Loader2 } from "lucide-react";
import { fetchCategories, type Category, type NfbItem } from "@/lib/employee/inventory";

// ── Fixed unit options ────────────────────────────────────────

const UNIT_OPTIONS = [
  { value: "pcs",    label: "pcs — Pieces" },
  { value: "box",    label: "box — Box" },
  { value: "set",    label: "set — Set" },
  { value: "unit",   label: "unit — Unit" },
  { value: "pack",   label: "pack — Pack" },
  { value: "roll",   label: "roll — Roll" },
  { value: "pair",   label: "pair — Pair" },
  { value: "sheet",  label: "sheet — Sheet" },
  { value: "bottle", label: "bottle — Bottle" },
  { value: "bag",    label: "bag — Bag" },
  { value: "carton", label: "carton — Carton" },
  { value: "ream",   label: "ream — Ream" },
];

// ── Props ─────────────────────────────────────────────────────

export interface NfbItemModalProps {
  mode: "add" | "edit";
  tenantId: string;
  initial?: NfbItem;
  onSave: (data: Omit<NfbItem, "item_id" | "tenant_id" | "is_active" | "created_at" | "updated_at" | "category_name">) => Promise<void>;
  onClose: () => void;
}

// ── Styles ────────────────────────────────────────────────────

const labelStyle = "text-[11px] font-black uppercase tracking-[0.12em] text-[#3A6131]/50 mb-2 block";
const inputStyle = "w-full bg-white border-[1.5px] border-[#3A6131]/10 rounded-2xl px-4 py-3 text-sm text-[#3A6131] font-medium focus:outline-none focus:border-[#F7B71D] focus:ring-4 focus:ring-[#F7B71D]/10 transition-all placeholder:text-gray-300";
const selectStyle = `${inputStyle} appearance-none pr-10 bg-[image:url("data:image/svg+xml,%3Csvg%20xmlns%3D'http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg'%20width%3D'16'%20height%3D'16'%20viewBox%3D'0%200%2024%2024'%20fill%3D'none'%20stroke%3D'%233A6131'%20stroke-width%3D'2'%20stroke-linecap%3D'round'%20stroke-linejoin%3D'round'%3E%3Cpolyline%20points%3D'6%209%2012%2015%2018%209'%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E")] bg-no-repeat bg-[right_14px_center]`;

// ── Component ─────────────────────────────────────────────────

export default function NfbItemModal({ mode, tenantId, initial, onSave, onClose }: NfbItemModalProps) {
  const [saving,      setSaving]      = useState(false);
  const [categories,  setCategories]  = useState<Category[]>([]);
  const [loadingCats, setLoadingCats] = useState(true);
  const [error,       setError]       = useState<string | null>(null);

  const [form, setForm] = useState({
    name:              initial?.name              ?? "",
    sku:               initial?.sku               ?? "",
    category_id:       initial?.category_id       ?? "",
    quantity:          String(initial?.quantity    ?? ""),
    unit_of_measure:   initial?.unit_of_measure   ?? "pcs",
    reorder_threshold: String(initial?.reorder_threshold ?? ""),
    unit_price:        String(initial?.unit_price  ?? ""),
  });

  const set = (key: string, val: string) => setForm((f) => ({ ...f, [key]: val }));

  useEffect(() => {
    // ✅ Pass "ingredient" type so only ingredient categories are shown
    fetchCategories(tenantId, "ingredient")
      .then((data) => {
        setCategories(data);
        if (mode === "add" && data.length > 0 && !form.category_id) {
          setForm((f) => ({ ...f, category_id: data[0].category_id }));
        }
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoadingCats(false));
  }, []);

  const handleSave = async () => {
    if (!form.name.trim() || !form.sku.trim()) {
      setError("Item name and SKU are required.");
      return;
    }
    try {
      setSaving(true);
      setError(null);
      await onSave({
        category_id:       form.category_id || null,
        name:              form.name.trim(),
        sku:               form.sku.trim().toUpperCase(),
        quantity:          Number(form.quantity)          || 0,
        unit_of_measure:   form.unit_of_measure,
        reorder_threshold: Number(form.reorder_threshold) || 0,
        unit_price:        Number(form.unit_price)        || 0,
      });
    } catch (e: any) {
      // ✅ Friendly duplicate SKU error
      if (e.message?.includes("uq_nfb_sku_per_tenant") || e.code === "23505") {
        setError(`SKU "${form.sku.trim().toUpperCase()}" already exists. Please use a unique SKU.`);
      } else {
        setError(e.message);
      }
      setSaving(false);
    }
  };

  return (
    <ModalBackdrop onClose={onClose}>
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="w-full max-w-[820px] bg-[#FFFCEB] rounded-[32px] overflow-hidden border-[1.5px] border-[#F7B71D]/20 shadow-[0_32px_80px_rgba(58,97,49,0.2)] flex flex-col md:flex-row font-inter"
        style={{ minHeight: 500 }}
      >
        {/* LEFT SIDEBAR */}
        <div className="w-full md:w-[280px] bg-[#3A6131] p-10 flex flex-col relative overflow-hidden shrink-0">
          <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-[#F7B71D]/10 rounded-full blur-3xl" />
          <div className="relative z-10 flex flex-col h-full">
            <div className="bg-[#F7B71D] w-12 h-1 rounded-full mb-8" />
            <h2 className="text-[#FFFCEB] font-raleway text-3xl font-black leading-tight mb-2">
              {mode === "add" ? "Add Item" : "Edit Item"}
            </h2>
            <p className="text-[#FFFCEB]/60 text-xs font-medium leading-relaxed mb-10">
              Track non-food & beverage stock with discrete unit quantities.
            </p>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-[#F7B71D] flex items-center justify-center text-[#385E31] shadow-lg shadow-[#F7B71D]/20">
                <Package size={18} strokeWidth={2.5} />
              </div>
              <span className="text-sm font-bold text-[#FFFCEB]">NF&B Item</span>
            </div>
            <div className="mt-auto">
              <div className="bg-white/10 rounded-2xl px-4 py-3">
                <p className="text-[#FFFCEB]/40 text-[10px] font-black uppercase tracking-widest mb-1">Business Type</p>
                <p className="text-[#F7B71D] text-sm font-bold">Non-Food & Beverages</p>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT CONTENT */}
        <div className="flex-1 flex flex-col relative bg-white/50 backdrop-blur-sm">
          <button onClick={onClose} className="absolute top-6 right-6 w-10 h-10 rounded-full bg-[#FFFCEB] border border-[#3A6131]/10 flex items-center justify-center text-[#3A6131] hover:bg-[#3A6131] hover:text-[#FFFCEB] transition-all z-20">
            <X size={20} strokeWidth={2.5} />
          </button>

          <div className="flex-1 overflow-y-auto p-10 [&::-webkit-scrollbar]:w-[5px] [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[#3A6131]/15 [&::-webkit-scrollbar-thumb]:rounded-full">

            {error && (
              <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-2xl text-red-600 text-xs font-semibold">
                {error}
              </div>
            )}

            <div className="mb-8">
              <span className="bg-[#F7B71D]/15 text-[#385E31] text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">Item Details</span>
              <h3 className="text-2xl font-black text-[#3A6131] mt-2 font-raleway italic">Stock Information</h3>
            </div>

            <div className="grid grid-cols-2 gap-5">
              {/* Name */}
              <div className="col-span-2">
                <label className={labelStyle}>Item Name</label>
                <input className={inputStyle} value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Office Chair, Safety Gloves" />
              </div>

              {/* SKU */}
              <div>
                <label className={labelStyle}>SKU Code</label>
                <input
                  className={inputStyle}
                  value={form.sku}
                  onChange={(e) => set("sku", e.target.value)}
                  placeholder="NFB-CHR-01"
                />
                <p className="text-[10px] text-[#3A6131]/40 mt-1 pl-1">Must be unique per tenant.</p>
              </div>

              {/* Category */}
              <div>
                <label className={labelStyle}>Category</label>
                {loadingCats ? (
                  <div className="flex items-center gap-2 text-[#3A6131]/50 text-sm py-3"><Loader2 size={16} className="animate-spin" /> Loading…</div>
                ) : (
                  <select className={selectStyle} value={form.category_id} onChange={(e) => set("category_id", e.target.value)}>
                    <option value="">— No Category —</option>
                    {categories.map((c) => (
                      <option key={c.category_id} value={c.category_id}>{c.name}</option>
                    ))}
                  </select>
                )}
              </div>

              {/* Quantity */}
              <div>
                <label className={labelStyle}>Current Quantity</label>
                <input type="number" className={inputStyle} value={form.quantity} onChange={(e) => set("quantity", e.target.value)} placeholder="0" min="0" />
              </div>

              {/* ✅ Unit of Measure — dropdown */}
              <div>
                <label className={labelStyle}>Unit of Measure</label>
                <select className={selectStyle} value={form.unit_of_measure} onChange={(e) => set("unit_of_measure", e.target.value)}>
                  {UNIT_OPTIONS.map((u) => (
                    <option key={u.value} value={u.value}>{u.label}</option>
                  ))}
                </select>
              </div>

              {/* Reorder Threshold */}
              <div>
                <label className={labelStyle}>
                  Reorder Alert <span className="lowercase normal-case font-medium">({form.unit_of_measure})</span>
                </label>
                <input type="number" className={inputStyle} value={form.reorder_threshold} onChange={(e) => set("reorder_threshold", e.target.value)} placeholder="0" min="0" />
              </div>

              {/* Unit Price */}
              <div className="bg-[#3A6131]/5 p-5 rounded-[24px] border border-[#3A6131]/10">
                <label className={labelStyle}>Unit Price <span className="lowercase normal-case font-medium">(per {form.unit_of_measure})</span></label>
                <div className="flex items-center text-2xl font-black text-[#3A6131]">
                  <span className="mr-2 opacity-30">₱</span>
                  <input type="number" className="bg-transparent border-none p-0 focus:ring-0 w-full font-black text-xl" value={form.unit_price} onChange={(e) => set("unit_price", e.target.value)} placeholder="0.00" min="0" />
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-8 py-5 border-t border-[#3A6131]/10 bg-white/80 flex justify-between items-center z-20">
            <button onClick={onClose} className="text-[#3A6131]/50 text-sm font-bold hover:text-[#3A6131] transition-colors">
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-[#3A6131] text-[#FFFCEB] px-8 py-3 rounded-2xl text-sm font-bold flex items-center gap-2 hover:opacity-90 transition-opacity shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {saving
                ? <><Loader2 size={16} className="animate-spin" /> Saving…</>
                : <>{mode === "add" ? "Add Item" : "Save Changes"} <ChevronRight size={16} /></>
              }
            </button>
          </div>
        </div>
      </motion.div>
    </ModalBackdrop>
  );
}