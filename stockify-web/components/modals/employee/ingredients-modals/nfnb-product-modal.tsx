"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ModalBackdrop from "./modals-backdrop";
import {
  X, Info, Package, ChevronRight,
  Trash2, Plus, Loader2, PackageCheck,
} from "lucide-react";
import { fetchCategories, type Category } from "@/lib/employee/inventory";
import {
  fetchNfbIngredientOptions,
  type NfbProduct,
  type BomInput,
  type NfbIngredientOption,
} from "@/lib/employee/nfb-products";

// ── Props ─────────────────────────────────────────────────────

export interface NfbProductModalProps {
  mode:      "add" | "edit";
  tenantId:  string;
  initial?:  NfbProduct;
  onSave: (
    input: {
      category_id:     string | null;
      name:            string;
      sku:             string;
      description:     string | null;
      quantity:        number;
      unit_of_measure: string;
      unit_cost:       number;
      price:           number;
      visible:         boolean;
    },
    bom: BomInput[]
  ) => Promise<void>;
  onClose: () => void;
}

// ── Styles ────────────────────────────────────────────────────

const labelStyle = "text-[11px] font-black uppercase tracking-[0.12em] text-[#3A6131]/50 mb-2 block";
const inputStyle = "w-full bg-white border-[1.5px] border-[#3A6131]/10 rounded-2xl px-4 py-3 text-sm text-[#3A6131] font-medium focus:outline-none focus:border-[#F7B71D] focus:ring-4 focus:ring-[#F7B71D]/10 transition-all placeholder:text-gray-300";
const selectStyle = `${inputStyle} appearance-none pr-10 bg-[image:url("data:image/svg+xml,%3Csvg%20xmlns%3D'http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg'%20width%3D'16'%20height%3D'16'%20viewBox%3D'0%200%2024%2024'%20fill%3D'none'%20stroke%3D'%233A6131'%20stroke-width%3D'2'%20stroke-linecap%3D'round'%20stroke-linejoin%3D'round'%3E%3Cpolyline%20points%3D'6%209%2012%2015%2018%209'%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E")] bg-no-repeat bg-[right_14px_center]`;

const STEPS = [
  { id: 1, label: "Basic Information", icon: Info    },
  { id: 2, label: "Bill of Materials", icon: Package },
];

const UNIT_OPTIONS = ["pcs", "box", "set", "unit", "pack", "roll", "pair", "sheet", "bottle"];

// ── Component ─────────────────────────────────────────────────

export default function NfbProductModal({
  mode, tenantId, initial, onSave, onClose,
}: NfbProductModalProps) {
  const [step,        setStep]        = useState(1);
  const [saving,      setSaving]      = useState(false);
  const [error,       setError]       = useState<string | null>(null);

  const [categories,  setCategories]  = useState<Category[]>([]);
  const [ingredients, setIngredients] = useState<NfbIngredientOption[]>([]);
  const [loadingCats, setLoadingCats] = useState(true);
  const [loadingIngs, setLoadingIngs] = useState(true);

  const [form, setForm] = useState({
    name:            initial?.name            ?? "",
    sku:             initial?.sku             ?? "",
    description:     initial?.description     ?? "",
    category_id:     initial?.category_id     ?? "",
    quantity:        String(initial?.quantity  ?? ""),
    unit_of_measure: initial?.unit_of_measure ?? "pcs",
    unit_cost:       String(initial?.unit_cost ?? ""),
    price:           String(initial?.price     ?? ""),
    visible:         initial?.visible         ?? true,
  });

  const [bom, setBom] = useState<{ item_id: string; quantity: string; unit: string }[]>(
    initial?.bom?.map((b) => ({
      item_id:  b.item_id,
      quantity: String(b.quantity),
      unit:     b.unit,
    })) ?? []
  );

  const set = (key: string, val: any) => setForm((f) => ({ ...f, [key]: val }));

  useEffect(() => {
    fetchCategories(tenantId)
      .then((data) => {
        setCategories(data);
        if (mode === "add" && data.length > 0 && !form.category_id) {
          setForm((f) => ({ ...f, category_id: data[0].category_id }));
        }
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoadingCats(false));

    fetchNfbIngredientOptions(tenantId)
      .then(setIngredients)
      .catch((e) => setError(e.message))
      .finally(() => setLoadingIngs(false));
  }, []);

  // ── BOM helpers ───────────────────────────────────────────────

  const addBomRow = () =>
    setBom((prev) => [...prev, { item_id: "", quantity: "", unit: "" }]);

  const updateBomItem = (idx: number, item_id: string) => {
    const ing = ingredients.find((i) => i.item_id === item_id);
    setBom((prev) =>
      prev.map((row, i) =>
        i === idx ? { ...row, item_id, unit: ing?.unit_of_measure ?? "" } : row
      )
    );
  };

  const updateBomQty = (idx: number, quantity: string) =>
    setBom((prev) => prev.map((row, i) => (i === idx ? { ...row, quantity } : row)));

  const removeBomRow = (idx: number) =>
    setBom((prev) => prev.filter((_, i) => i !== idx));

  // ── Save ──────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!form.name.trim() || !form.sku.trim()) {
      setError("Product name and SKU are required.");
      return;
    }

    const validBom: BomInput[] = bom
      .filter((b) => b.item_id && Number(b.quantity) > 0)
      .map((b) => ({
        item_id:  b.item_id,
        quantity: Number(b.quantity),
        unit:     b.unit,
      }));

    try {
      setSaving(true);
      setError(null);
      await onSave(
        {
          category_id:     form.category_id || null,
          name:            form.name.trim(),
          sku:             form.sku.trim().toUpperCase(),
          description:     form.description.trim() || null,
          quantity:        Number(form.quantity)  || 0,
          unit_of_measure: form.unit_of_measure,
          unit_cost:       Number(form.unit_cost) || 0,
          price:           Number(form.price)     || 0,
          visible:         form.visible,
        },
        validBom
      );
    } catch (e: any) {
      setError(e.message);
      setSaving(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────

  return (
    <ModalBackdrop onClose={onClose}>
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="w-full max-w-[920px] bg-[#FFFCEB] rounded-[32px] overflow-hidden border-[1.5px] border-[#F7B71D]/20 shadow-[0_32px_80px_rgba(58,97,49,0.2)] flex flex-col md:flex-row h-[620px] font-inter"
      >
        {/* LEFT SIDEBAR */}
        <div className="w-full md:w-[300px] bg-[#3A6131] p-10 flex flex-col relative overflow-hidden shrink-0">
          <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-[#F7B71D]/10 rounded-full blur-3xl" />
          <div className="relative z-10">
            <div className="bg-[#F7B71D] w-12 h-1 rounded-full mb-8" />
            <h2 className="text-[#FFFCEB] font-raleway text-3xl font-black leading-tight mb-2">
              {mode === "add" ? "Add Product" : "Edit Product"}
            </h2>
            <p className="text-[#FFFCEB]/60 text-xs font-medium leading-relaxed mb-12">
              Set up your physical product details and link the materials it consumes from your NF&B inventory.
            </p>
            <nav className="flex flex-col gap-8">
              {STEPS.map((s) => (
                <div
                  key={s.id}
                  className={`flex items-center gap-4 transition-all duration-300 ${step === s.id ? "translate-x-2" : "opacity-40"}`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${step === s.id ? "bg-[#F7B71D] text-[#385E31] shadow-lg shadow-[#F7B71D]/20" : "bg-white/10 text-white"}`}>
                    <s.icon size={18} strokeWidth={2.5} />
                  </div>
                  <span className={`text-sm font-bold tracking-wide ${step === s.id ? "text-[#FFFCEB]" : "text-white"}`}>
                    {s.label}
                  </span>
                </div>
              ))}
            </nav>
          </div>

          <div className="mt-auto relative z-10 space-y-4">
            {/* Business type badge */}
            <div className="bg-white/10 rounded-2xl px-4 py-3">
              <p className="text-[#FFFCEB]/40 text-[10px] font-black uppercase tracking-widest mb-1">Business Type</p>
              <p className="text-[#F7B71D] text-sm font-bold">Non-Food & Beverages</p>
            </div>
            <div className="flex gap-2">
              {[1, 2].map((i) => (
                <div key={i} className={`h-1.5 rounded-full transition-all duration-500 ${step === i ? "w-8 bg-[#F7B71D]" : "w-2 bg-white/20"}`} />
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT CONTENT */}
        <div className="flex-1 flex flex-col relative bg-white/50 backdrop-blur-sm">
          <button
            onClick={onClose}
            className="absolute top-6 right-6 w-10 h-10 rounded-full bg-[#FFFCEB] border border-[#3A6131]/10 flex items-center justify-center text-[#3A6131] hover:bg-[#3A6131] hover:text-[#FFFCEB] transition-all z-20"
          >
            <X size={20} strokeWidth={2.5} />
          </button>

          <div className="flex-1 overflow-y-auto p-10 [&::-webkit-scrollbar]:w-[5px] [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[#3A6131]/15 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-[#3A6131]/25">

            {error && (
              <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-2xl text-red-600 text-xs font-semibold">
                {error}
              </div>
            )}

            <AnimatePresence mode="wait">

              {/* ── STEP 1: BASIC INFORMATION ── */}
              {step === 1 && (
                <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
                  <div className="mb-6">
                    <span className="bg-[#F7B71D]/15 text-[#385E31] text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">Step 01</span>
                    <h3 className="text-2xl font-black text-[#3A6131] mt-2 font-raleway italic">Product Information</h3>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Name */}
                    <div className="col-span-2">
                      <label className={labelStyle}>Product Name</label>
                      <input className={inputStyle} value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Wireless Headphones" />
                    </div>

                    {/* Description */}
                    <div className="col-span-2">
                      <label className={labelStyle}>Description</label>
                      <textarea
                        className={`${inputStyle} h-20 resize-none`}
                        value={form.description}
                        onChange={(e) => set("description", e.target.value)}
                        placeholder="Brief product description visible to customers..."
                      />
                    </div>

                    {/* SKU */}
                    <div>
                      <label className={labelStyle}>SKU Code</label>
                      <input className={inputStyle} value={form.sku} onChange={(e) => set("sku", e.target.value)} placeholder="NFB-PRD-01" />
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

                    {/* Unit of Measure */}
                    <div>
                      <label className={labelStyle}>Unit of Measure</label>
                      <select className={selectStyle} value={form.unit_of_measure} onChange={(e) => set("unit_of_measure", e.target.value)}>
                        {UNIT_OPTIONS.map((u) => <option key={u} value={u}>{u}</option>)}
                      </select>
                    </div>

                    {/* Unit Cost */}
                    <div className="bg-[#3A6131]/5 p-5 rounded-[20px] border border-[#3A6131]/10">
                      <label className={labelStyle}>Unit Cost (Internal)</label>
                      <div className="flex items-center text-xl font-black text-[#3A6131]">
                        <span className="mr-2 opacity-30">₱</span>
                        <input type="number" className="bg-transparent border-none p-0 focus:ring-0 w-full font-black" value={form.unit_cost} onChange={(e) => set("unit_cost", e.target.value)} placeholder="0.00" />
                      </div>
                    </div>

                    {/* Selling Price */}
                    <div className="bg-[#F7B71D] p-5 rounded-[20px] shadow-lg shadow-[#F7B71D]/20">
                      <label className={`${labelStyle} text-[#385E31]/60`}>Selling Price</label>
                      <div className="flex items-center text-xl font-black text-[#385E31]">
                        <span className="mr-2 opacity-50">₱</span>
                        <input type="number" className="bg-transparent border-none p-0 focus:ring-0 w-full font-black placeholder:text-[#385E31]/30" value={form.price} onChange={(e) => set("price", e.target.value)} placeholder="0.00" />
                      </div>
                    </div>

                    {/* Visibility toggle */}
                    <div className="col-span-2 flex items-center justify-between bg-white p-4 rounded-2xl border border-[#3A6131]/10">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#3A6131]/10 flex items-center justify-center text-[#3A6131]">
                          <PackageCheck size={20} />
                        </div>
                        <span className="text-sm font-bold text-[#3A6131]">Show on Storefront</span>
                      </div>
                      <button
                        onClick={() => set("visible", !form.visible)}
                        className={`w-12 h-6 rounded-full transition-all relative ${form.visible ? "bg-[#3A6131]" : "bg-gray-200"}`}
                      >
                        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${form.visible ? "right-1" : "left-1"}`} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ── STEP 2: BILL OF MATERIALS ── */}
              {step === 2 && (
                <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="bg-[#F7B71D]/15 text-[#385E31] text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">Step 02</span>
                      <h3 className="text-2xl font-black text-[#3A6131] mt-2 font-raleway italic">Bill of Materials</h3>
                    </div>
                    <button
                      onClick={addBomRow}
                      className="w-11 h-11 rounded-2xl bg-[#3A6131] text-[#FFFCEB] flex items-center justify-center shadow-md hover:scale-110 transition-all active:scale-95 flex-shrink-0 mt-1 mr-10 translate-y-8"
                      title="Add Material"
                    >
                      <Plus size={22} strokeWidth={2.8} />
                    </button>
                  </div>

                  <p className="text-[11px] text-[#3A6131]/50 leading-relaxed pr-16">
                    Link the NF&B inventory items consumed when assembling or selling this product. Stock will be deducted automatically on each sale.
                  </p>

                  {loadingIngs ? (
                    <div className="flex items-center justify-center py-12 text-[#3A6131]/40 gap-2">
                      <Loader2 size={20} className="animate-spin" /> Loading inventory items…
                    </div>
                  ) : (
                    <div className="space-y-3 mt-2">
                      {bom.length === 0 ? (
                        <div className="py-12 border-2 border-dashed border-[#3A6131]/10 rounded-[24px] flex flex-col items-center justify-center text-[#3A6131]/30">
                          <Package size={40} strokeWidth={1} className="mb-2" />
                          <p className="text-sm font-medium">No materials linked yet</p>
                          {ingredients.length === 0 && (
                            <p className="text-xs mt-1 text-[#3A6131]/20">Add NF&B inventory items first</p>
                          )}
                        </div>
                      ) : (
                        bom.map((row, idx) => (
                          <div key={idx} className="flex gap-3 items-center bg-white rounded-2xl p-3 border border-[#3A6131]/5 shadow-sm">
                            <select
                              className="flex-1 appearance-none bg-[#FFFCEB]/50 border border-[#3A6131]/20 rounded-xl pl-3 pr-8 py-2 text-[13px] font-bold text-[#3A6131] focus:outline-none focus:border-[#F7B71D]"
                              value={row.item_id}
                              onChange={(e) => updateBomItem(idx, e.target.value)}
                            >
                              <option value="">Select Item</option>
                              {ingredients.map((ing) => (
                                <option key={ing.item_id} value={ing.item_id}>{ing.name}</option>
                              ))}
                            </select>

                            <input
                              className="w-20 bg-[#FFFCEB]/50 border border-[#3A6131]/20 rounded-xl px-3 py-2 text-[13px] font-black text-[#3A6131] text-center focus:outline-none focus:border-[#F7B71D]"
                              type="number"
                              placeholder="0"
                              min="0"
                              value={row.quantity}
                              onChange={(e) => updateBomQty(idx, e.target.value)}
                            />

                            <span className="text-[12px] font-black text-[#F7B71D] w-8 uppercase text-center">
                              {row.unit || "—"}
                            </span>

                            <button onClick={() => removeBomRow(idx)} className="p-2 text-red-400 hover:text-red-600 transition-colors">
                              <Trash2 size={16} />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </motion.div>
              )}

            </AnimatePresence>
          </div>

          {/* Footer */}
          <div className="px-8 py-5 border-t border-[#3A6131]/10 bg-white/80 flex justify-between items-center z-20">
            <button
              onClick={() => step > 1 ? setStep(step - 1) : onClose()}
              className="text-[#3A6131]/50 text-sm font-bold hover:text-[#3A6131] transition-colors"
            >
              {step === 1 ? "Cancel" : "Back"}
            </button>
            <button
              onClick={() => step < 2 ? setStep(step + 1) : handleSave()}
              disabled={saving}
              className="bg-[#3A6131] text-[#FFFCEB] px-8 py-3 rounded-2xl text-sm font-bold flex items-center gap-2 hover:opacity-90 transition-opacity shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {saving
                ? <><Loader2 size={16} className="animate-spin" /> Saving…</>
                : <>{step === 2 ? "Complete & Save" : "Continue"} <ChevronRight size={16} /></>
              }
            </button>
          </div>
        </div>
      </motion.div>
    </ModalBackdrop>
  );
}