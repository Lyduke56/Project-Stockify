"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ModalBackdrop from "@/components/modals/employee/ingredients-modals/modals-backdrop";
import {
  X, Info, Coffee, ChevronRight, Trash2, Plus,
  Coins, PackageCheck, UploadCloud, Loader2, Ruler,
} from "lucide-react";
import { fetchCategories } from "@/lib/employee/categories";
import type { Category } from "@/lib/employee/categories";
import {
  fetchIngredientOptions,
  uploadProductImage,
  type Product,
  type RecipeInput,
  type IngredientOption,
} from "@/lib/employee/products";

export type SizeInput = {
  label:      string;
  price:      string;
  is_default: boolean;
  max_yield:  string;
  unit_cost?: number;
};

const DEFAULT_SIZES: SizeInput[] = [];

const UNIT_OPTIONS = [
  { value: "mg", label: "mg" },
  { value: "g", label: "g" },
  { value: "kg", label: "kg" },
  { value: "ml", label: "ml" },
  { value: "L", label: "L" },
  { value: "tsp", label: "tsp" },
  { value: "tbsp", label: "tbsp" },
  { value: "cup", label: "cup" },
  { value: "oz", label: "oz" },
  { value: "lb", label: "lb" },
  { value: "pcs", label: "pcs" },
];

const getConversionFactor = (fromUnit: string, toUnit: string): number => {
  if (fromUnit === toUnit) return 1;
  const from = fromUnit.toLowerCase();
  const to = toUnit.toLowerCase();
  const weightToGrams: Record<string, number> = { "mg": 0.001, "g": 1, "kg": 1000, "oz": 28.3495, "lb": 453.592 };
  const volToMl: Record<string, number> = { "ml": 1, "l": 1000, "tsp": 5, "tbsp": 15, "cup": 240, "oz": 29.5735 };

  if (weightToGrams[from] && weightToGrams[to]) return weightToGrams[from] / weightToGrams[to];
  if (volToMl[from] && volToMl[to]) return volToMl[from] / volToMl[to];
  return 1;
};

export interface ProductModalProps {
  mode:       "add" | "edit";
  tenantId:   string;
  productId?: string;
  initial?:   Product;
  onSave: (
    input: {
      category_id: string | null;
      name:        string;
      sku:         string;
      description: string | null;
      image_url:   string | null;
      unit_cost:   number;
      price:       number;
      max_yield:   number;
      visible:     boolean;
    },
    recipe:    RecipeInput[],
    sizes:     SizeInput[],
    imageFile: File | null
  ) => Promise<void>;
  onClose: () => void;
}

const labelStyle = "text-[11px] font-black uppercase tracking-[0.12em] text-[#3A6131]/50 mb-2 block";
const inputStyle = "w-full bg-white border-[1.5px] border-[#3A6131]/10 rounded-2xl px-4 py-3 text-sm text-[#3A6131] font-medium focus:outline-none focus:border-[#F7B71D] focus:ring-4 focus:ring-[#F7B71D]/10 transition-all placeholder:text-gray-300";
const selectStyle = `${inputStyle} appearance-none pr-10 bg-[image:url("data:image/svg+xml,%3Csvg%20xmlns%3D'http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg'%20width%3D'16'%20height%3D'16'%20viewBox%3D'0%200%2024%2024'%20fill%3D'none'%20stroke%3D'%233A6131'%20stroke-width%3D'2'%20stroke-linecap%3D'round'%20stroke-linejoin%3D'round'%3E%3Cpolyline%20points%3D'6%209%2012%2015%2018%209'%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E")] bg-no-repeat bg-[right_14px_center]`;

const STEPS = [
  { id: 1, label: "Basic Information",    icon: Info    },
  { id: 2, label: "Sizes & Variants",     icon: Ruler   },
  { id: 3, label: "Recipe & Ingredients", icon: Coffee  },
  { id: 4, label: "Pricing & Metrics",    icon: Coins   },
];

export default function ProductModal({ mode, tenantId, productId, initial, onSave, onClose }: ProductModalProps) {
  const [step,     setStep]     = useState(1);
  const [saving,   setSaving]   = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error,    setError]    = useState<string | null>(null);
  const [categories,  setCategories]  = useState<Category[]>([]);
  const [ingredients, setIngredients] = useState<IngredientOption[]>([]);
  const [loadingCats, setLoadingCats] = useState(true);
  const [loadingIngs, setLoadingIngs] = useState(true);
  const [imageFile,    setImageFile]    = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(initial?.image_url ?? null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    name:        initial?.name        ?? "",
    sku:         initial?.sku         ?? "",
    description: initial?.description ?? "",
    category_id: initial?.category_id ?? "",
    unit_cost:   String(initial?.unit_cost ?? ""),
    price:       String(initial?.price     ?? ""),
    max_yield:   String(initial?.max_yield ?? ""),
    visible:     initial?.visible     ?? true,
  });

  const [recipe, setRecipe] = useState<{ item_id: string; item_type: "fnb" | "nfb"; amount: string; unit: string; size_label: string | null }[]>(
    initial?.recipe?.map((r: any) => ({ item_id: r.item_id, item_type: r.item_type, amount: String(r.amount), unit: r.unit, size_label: r.size_label ?? null })) ?? []
  );

  const [activeSizeTab, setActiveSizeTab] = useState<string | null>(null);

  const [sizes, setSizes] = useState<SizeInput[]>(
    initial?.sizes?.length
      ? initial.sizes.map((s: any) => ({ label: s.label, price: String(s.price), is_default: s.is_default, max_yield: String(s.max_yield || "") }))
      : DEFAULT_SIZES
  );

  const set = (key: string, val: any) => setForm((f) => ({ ...f, [key]: val }));

  useEffect(() => {
    fetchCategories(tenantId, "fnb_product")
      .then((data) => {
        setCategories(data);
        if (mode === "add" && data.length > 0 && !form.category_id)
          setForm((f) => ({ ...f, category_id: data[0].category_id }));
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoadingCats(false));

    fetchIngredientOptions(tenantId)
      .then(setIngredients)
      .catch((e) => setError(e.message))
      .finally(() => setLoadingIngs(false));
  }, []);

  useEffect(() => {
    if (sizes.length > 0) {
      if (!activeSizeTab || !sizes.find(s => s.label === activeSizeTab)) {
        setActiveSizeTab(sizes[0].label);
      }
    } else {
      setActiveSizeTab(null);
    }
  }, [sizes]);

  const handleImageFile = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const addRecipeRow = () => setRecipe((p) => [...p, { item_id: "", item_type: "fnb", amount: "", unit: "", size_label: sizes.length > 0 ? activeSizeTab : null }]);
  const updateRecipeRow = (idx: number, item_id: string) => {
    const ing = ingredients.find((i) => i.item_id === item_id);
    setRecipe((p) => p.map((r, i) => i === idx ? { ...r, item_id, item_type: ing?.item_type ?? "fnb", unit: ing?.unit ?? "" } : r));
  };
  const updateRecipeAmount = (idx: number, amount: string) => setRecipe((p) => p.map((r, i) => i === idx ? { ...r, amount } : r));
  const updateRecipeUnit = (idx: number, unit: string) => setRecipe((p) => p.map((r, i) => i === idx ? { ...r, unit } : r));
  const removeRecipeRow = (idx: number) => setRecipe((p) => p.filter((_, i) => i !== idx));

  const addSize = () => setSizes((p) => [...p, { label: "", price: "", is_default: false, max_yield: "" }]);
  const updateSize = (idx: number, key: keyof SizeInput, val: string | boolean) => {
    if (key === "label") {
      const oldLabel = sizes[idx].label;
      setRecipe((p) => p.map(r => r.size_label === oldLabel ? { ...r, size_label: val as string } : r));
    }
    setSizes((p) => p.map((s, i) => i === idx ? { ...s, [key]: val } : s));
  };
  const setDefaultSize = (idx: number) => setSizes((p) => p.map((s, i) => ({ ...s, is_default: i === idx })));
  const removeSize = (idx: number) => {
    const sizeToDelete = sizes[idx];
    setSizes((p) => p.filter((_, i) => i !== idx));
    setRecipe((p) => p.filter(r => r.size_label !== sizeToDelete.label));
  };

  const getRecipeCostForSize = (sizeLabel: string | null) => {
    return recipe.filter(r => r.size_label === sizeLabel).reduce((sum, row) => {
      const ing = ingredients.find((i) => i.item_id === row.item_id);
      if (!ing || !row.amount) return sum;
      const factor = getConversionFactor(row.unit, ing.base_unit);
      return sum + (ing.cost_per_base_unit || 0) * (Number(row.amount) * factor);
    }, 0);
  };

  const getYieldForSize = (sizeLabel: string | null) => {
    const rows = recipe.filter(r => r.size_label === sizeLabel);
    if (rows.length === 0) return 0;
    return rows.reduce((minYield, row) => {
      const ing = ingredients.find((i) => i.item_id === row.item_id);
      if (!ing || !row.amount || Number(row.amount) <= 0) return minYield;
      const factor = getConversionFactor(row.unit, ing.base_unit);
      const amountInBase = Number(row.amount) * factor;
      const ingYield = Math.floor((ing.stock || 0) / amountInBase);
      return minYield === null ? ingYield : Math.min(minYield, ingYield);
    }, null as number | null) ?? 0;
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.sku.trim()) { setError("Product name and SKU are required."); return; }
    const validRecipe: RecipeInput[] = recipe.filter((r) => r.item_id && Number(r.amount) > 0).map((r) => ({ item_id: r.item_id, item_type: r.item_type, amount: Number(r.amount), unit: r.unit, size_label: r.size_label }));
    const validSizes: SizeInput[] = sizes.filter((s) => s.label.trim()).map(s => ({
      ...s,
      unit_cost: getRecipeCostForSize(s.label)
    }));

    let finalPrice = Number(form.price) || 0;
    let finalUnitCost = Number(form.unit_cost) || 0;
    let finalMaxYield = Number(form.max_yield) || 0;

    if (validSizes.length > 0) {
      const prices = validSizes.map(s => Number(s.price) || 0);
      finalPrice = prices.length > 0 ? Math.min(...prices) : 0;
      
      const costs = validSizes.map(s => getRecipeCostForSize(s.label));
      finalUnitCost = costs.length > 0 ? Math.min(...costs) : 0;
      
      const yields = validSizes.map(s => Number(s.max_yield) || 0);
      finalMaxYield = yields.length > 0 ? Math.max(...yields) : 0;
    } else {
      finalUnitCost = getRecipeCostForSize(null);
    }

    try {
      setSaving(true); setError(null);
      await onSave({ category_id: form.category_id || null, name: form.name.trim(), sku: form.sku.trim().toUpperCase(), description: form.description.trim() || null, image_url: imagePreview && !imageFile ? imagePreview : null, unit_cost: finalUnitCost, price: finalPrice, max_yield: finalMaxYield, visible: form.visible }, validRecipe, validSizes, imageFile);
    } catch (e: any) { setError(e.message); setSaving(false); }
  };

  return (
    <ModalBackdrop onClose={onClose}>
      <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} className="w-full max-w-[960px] bg-[#FFFCEB] rounded-[32px] overflow-hidden border-[1.5px] border-[#F7B71D]/20 shadow-[0_32px_80px_rgba(58,97,49,0.2)] flex flex-col md:flex-row h-[680px] font-inter">
        {/* SIDEBAR */}
        <div className="w-full md:w-[300px] bg-[#3A6131] p-10 flex flex-col relative overflow-hidden shrink-0">
          <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-[#F7B71D]/10 rounded-full blur-3xl" />
          <div className="relative z-10">
            <div className="bg-[#F7B71D] w-12 h-1 rounded-full mb-8" />
            <h2 className="text-[#FFFCEB] font-raleway text-3xl font-black leading-tight mb-2">{mode === "add" ? "Create Product" : "Edit Details"}</h2>
            <p className="text-[#FFFCEB]/60 text-xs font-medium leading-relaxed mb-10">Fill in product details, map ingredients, set pricing, and configure size variants.</p>
            <nav className="flex flex-col gap-6">
              {STEPS.map((s) => (
                <div key={s.id} className={`flex items-center gap-4 transition-all duration-300 ${step === s.id ? "translate-x-2" : "opacity-40"}`}>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${step === s.id ? "bg-[#F7B71D] text-[#385E31] shadow-lg shadow-[#F7B71D]/20" : "bg-white/10 text-white"}`}><s.icon size={18} strokeWidth={2.5} /></div>
                  <span className={`text-sm font-bold tracking-wide ${step === s.id ? "text-[#FFFCEB]" : "text-white"}`}>{s.label}</span>
                </div>
              ))}
            </nav>
          </div>
          <div className="mt-auto relative z-10 flex gap-2">
            {[1,2,3,4].map((i) => <div key={i} className={`h-1.5 rounded-full transition-all duration-500 ${step === i ? "w-8 bg-[#F7B71D]" : "w-2 bg-white/20"}`} />)}
          </div>
        </div>

        {/* CONTENT */}
        <div className="flex-1 flex flex-col relative bg-white/50 backdrop-blur-sm">
          <button onClick={onClose} className="absolute top-6 right-6 w-10 h-10 rounded-full bg-[#FFFCEB] border border-[#3A6131]/10 flex items-center justify-center text-[#3A6131] hover:bg-[#3A6131] hover:text-[#FFFCEB] transition-all z-20"><X size={20} strokeWidth={2.5} /></button>
          <div className="flex-1 overflow-y-auto p-10 [&::-webkit-scrollbar]:w-[5px] [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[#3A6131]/15 [&::-webkit-scrollbar-thumb]:rounded-full">
            {error && <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-2xl text-red-600 text-xs font-semibold">{error}</div>}
            <AnimatePresence mode="wait">

              {step === 1 && (
                <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
                  <div className="mb-6"><span className="bg-[#F7B71D]/15 text-[#385E31] text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">Step 01</span><h3 className="text-2xl font-black text-[#3A6131] mt-2 font-raleway italic">Product Information</h3></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2"><label className={labelStyle}>Product Name</label><input className={inputStyle} value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Signature Espresso" /></div>
                    <div className="col-span-2"><label className={labelStyle}>Description</label><textarea className={`${inputStyle} h-20 resize-none`} value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="Briefly describe this product..." /></div>
                    <div><label className={labelStyle}>SKU Code</label><input className={inputStyle} value={form.sku} onChange={(e) => set("sku", e.target.value)} placeholder="ESP-001" /></div>
                    <div><label className={labelStyle}>Category</label>
                      {loadingCats ? <div className="flex items-center gap-2 text-[#3A6131]/50 text-sm py-3"><Loader2 size={16} className="animate-spin" /> Loading…</div>
                      : <select className={selectStyle} value={form.category_id} onChange={(e) => set("category_id", e.target.value)}><option value="">— No Category —</option>{categories.map((c) => <option key={c.category_id} value={c.category_id}>{c.name}</option>)}</select>}
                    </div>
                    <div className="col-span-2">
                      <label className={labelStyle}>Product Photo</label>
                      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageFile(f); }} />
                      {imagePreview ? (
                        <div className="flex items-center gap-4 bg-white border-[1.5px] border-[#3A6131]/10 rounded-2xl p-3">
                          <img src={imagePreview} alt="Preview" className="w-16 h-16 rounded-xl object-cover border border-[#3A6131]/10 flex-shrink-0" />
                          <div className="flex-1 min-w-0"><p className="text-xs font-bold text-[#3A6131] truncate">{imageFile ? imageFile.name : "Existing photo"}</p><p className="text-[10px] text-[#3A6131]/40 mt-0.5">Square images display best.</p></div>
                          <button onClick={() => { setImageFile(null); setImagePreview(null); }} className="p-2 text-red-400 hover:text-red-600"><Trash2 size={16} /></button>
                          <button onClick={() => fileInputRef.current?.click()} className="text-[10px] font-black uppercase tracking-wide text-[#3A6131]/50 hover:text-[#3A6131] pr-1">Change</button>
                        </div>
                      ) : (
                        <div onClick={() => fileInputRef.current?.click()} onDragOver={(e) => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)} onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files?.[0]; if (f) handleImageFile(f); }} className={`cursor-pointer flex items-center gap-4 border-[1.5px] border-dashed rounded-2xl px-5 py-4 transition-all ${dragOver ? "border-[#F7B71D] bg-[#F7B71D]/5" : "border-[#3A6131]/15 bg-white hover:border-[#F7B71D]/60"}`}>
                          <div className="w-10 h-10 rounded-xl bg-[#3A6131]/5 flex items-center justify-center text-[#3A6131]/40"><UploadCloud size={20} strokeWidth={1.8} /></div>
                          <div><p className="text-sm font-bold text-[#3A6131]">Click to upload or drag & drop</p><p className="text-[10px] text-[#3A6131]/40 mt-0.5">PNG, JPG, WEBP · Best as 1:1 square</p></div>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
                  <div className="flex justify-between items-start mb-2">
                    <div><span className="bg-[#F7B71D]/15 text-[#385E31] text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">Step 02</span><h3 className="text-2xl font-black text-[#3A6131] mt-2 font-raleway italic">Sizes & Variants (Optional)</h3><p className="text-[11px] text-[#3A6131]/50 mt-1 leading-relaxed pr-16">Add custom sizes if your product has variations. Pricing is configured in Step 4.</p></div>
                    <button onClick={addSize} className="w-11 h-11 rounded-2xl bg-[#3A6131] text-[#FFFCEB] flex items-center justify-center shadow-md hover:scale-110 transition-all active:scale-95 flex-shrink-0 mt-1 mr-10 translate-y-8"><Plus size={22} strokeWidth={2.8} /></button>
                  </div>
                  <div className="flex gap-3 px-1 mt-6">
                    <span className={`${labelStyle} flex-1 mb-0`}>Size Label</span>
                    <div className="w-9" />
                  </div>
                  <div className="space-y-2">
                    {sizes.length === 0 ? (
                      <div className="py-10 border-2 border-dashed border-[#3A6131]/10 rounded-[20px] flex flex-col items-center justify-center text-[#3A6131]/30"><Ruler size={36} strokeWidth={1} className="mb-2" /><p className="text-sm font-medium">No sizes added — product uses a single base price and recipe</p></div>
                    ) : sizes.map((s, idx) => (
                      <div key={idx} className="flex gap-3 items-center bg-white rounded-2xl px-4 py-3 border border-[#3A6131]/5 shadow-sm">
                        <input className="flex-1 bg-transparent border-b border-[#3A6131]/15 text-[13px] font-bold text-[#3A6131] focus:outline-none focus:border-[#F7B71D] py-1" placeholder="e.g. Solo, Sharing, Large…" value={s.label} onChange={(e) => updateSize(idx, "label", e.target.value)} />
                        <button onClick={() => removeSize(idx)} className="w-9 flex justify-center text-red-400 hover:text-red-600"><Trash2 size={15} /></button>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div key="s3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5 flex flex-col h-[400px]">
                  <div className="flex justify-between items-start mb-2 shrink-0">
                    <div><span className="bg-[#F7B71D]/15 text-[#385E31] text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">Step 03</span><h3 className="text-2xl font-black text-[#3A6131] mt-2 font-raleway italic">Ingredients Setup</h3></div>
                    <button onClick={addRecipeRow} className="w-11 h-11 rounded-2xl bg-[#3A6131] text-[#FFFCEB] flex items-center justify-center shadow-md hover:scale-110 transition-all active:scale-95 flex-shrink-0 mt-1 mr-10 translate-y-8"><Plus size={22} strokeWidth={2.8} /></button>
                  </div>
                  <p className="text-[11px] text-[#3A6131]/50 leading-relaxed pr-16 shrink-0">Map each ingredient and its quantity per serving.</p>
                  
                  {sizes.length > 0 && (
                     <div className="flex gap-2 mb-2 border-b border-[#3A6131]/10 pb-2 overflow-x-auto shrink-0">
                       {sizes.map(s => (
                         <button 
                           key={s.label}
                           onClick={() => setActiveSizeTab(s.label)}
                           className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeSizeTab === s.label ? "bg-[#3A6131] text-[#FFFCEB]" : "bg-white text-[#3A6131]/50 border border-[#3A6131]/10 hover:border-[#3A6131]/30"}`}
                         >
                           {s.label || "Unnamed Size"}
                         </button>
                       ))}
                     </div>
                   )}

                  {loadingIngs ? <div className="flex items-center justify-center py-12 text-[#3A6131]/40 gap-2 shrink-0"><Loader2 size={20} className="animate-spin" /> Loading…</div> : (
                    <div className="space-y-3 mt-2 flex-1 overflow-y-auto pr-2 pb-10">
                      {recipe.filter(r => (sizes.length > 0 ? r.size_label === activeSizeTab : r.size_label === null)).length === 0 ? (
                        <div className="py-12 border-2 border-dashed border-[#3A6131]/10 rounded-[24px] flex flex-col items-center justify-center text-[#3A6131]/30"><Coffee size={40} strokeWidth={1} className="mb-2" /><p className="text-sm font-medium">No ingredients mapped for this size</p></div>
                      ) : recipe.map((row, idx) => {
                        if (sizes.length > 0 && row.size_label !== activeSizeTab) return null;
                        if (sizes.length === 0 && row.size_label !== null) return null;
                        return (
                        <div key={idx} className="flex gap-3 items-center bg-white rounded-2xl p-3 border border-[#3A6131]/5 shadow-sm">
                          <select className="flex-1 appearance-none bg-[#FFFCEB]/50 border border-[#3A6131]/20 rounded-xl pl-3 pr-8 py-2 text-[13px] font-bold text-[#3A6131] focus:outline-none focus:border-[#F7B71D]" value={row.item_id} onChange={(e) => updateRecipeRow(idx, e.target.value)}>
                            <option value="">Select Ingredient</option>
                            <optgroup label="F&B Ingredients">{ingredients.filter((i) => i.item_type === "fnb").map((ing) => <option key={ing.item_id} value={ing.item_id}>{ing.name}</option>)}</optgroup>
                          </select>
                          <input className="w-20 bg-[#FFFCEB]/50 border border-[#3A6131]/20 rounded-xl px-3 py-2 text-[13px] font-black text-[#3A6131] text-center focus:outline-none" type="number" placeholder="0" min="0" value={row.amount} onChange={(e) => updateRecipeAmount(idx, e.target.value)} />
                          
                          <select className="w-16 appearance-none bg-[#FFFCEB]/50 border border-[#3A6131]/20 rounded-xl px-2 py-2 text-[12px] font-black text-[#F7B71D] uppercase text-center focus:outline-none cursor-pointer" value={row.unit} onChange={(e) => updateRecipeUnit(idx, e.target.value)}>
                            <option value="" disabled>—</option>
                            {UNIT_OPTIONS.map(u => <option key={u.value} value={u.value}>{u.label}</option>)}
                          </select>
                          
                          <button onClick={() => removeRecipeRow(idx)} className="p-2 text-red-400 hover:text-red-600"><Trash2 size={16} /></button>
                        </div>
                      )})}
                    </div>
                  )}
                </motion.div>
              )}

              {step === 4 && (
                <motion.div key="s4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                  <div className="mb-6"><span className="bg-[#F7B71D]/15 text-[#385E31] text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">Step 04</span><h3 className="text-2xl font-black text-[#3A6131] mt-2 font-raleway italic">Pricing & Metrics</h3><p className="text-[11px] text-[#3A6131]/50 mt-1">Configure pricing and track yields for your product.</p></div>
                  
                  {/* Summary Ranges */}
                  <div className="flex gap-4">
                    <div className="flex-1 bg-[#3A6131]/5 p-4 rounded-2xl border border-[#3A6131]/10">
                      <div className="text-[10px] font-black uppercase text-[#3A6131]/50 tracking-wider mb-1">Unit Cost (Internal)</div>
                      <div className="text-lg font-black text-[#3A6131]">
                        {(() => {
                           if (sizes.length === 0) return `₱${getRecipeCostForSize(null).toFixed(2)}`;
                           const costs = sizes.map(s => getRecipeCostForSize(s.label));
                           if (costs.length === 0) return "₱0.00";
                           const min = Math.min(...costs); const max = Math.max(...costs);
                           return min === max ? `₱${min.toFixed(2)}` : `₱${min.toFixed(2)} - ₱${max.toFixed(2)}`;
                        })()}
                      </div>
                    </div>
                    <div className="flex-1 bg-[#F7B71D] p-4 rounded-2xl shadow-lg shadow-[#F7B71D]/20">
                      <div className="text-[10px] font-black uppercase text-[#385E31]/60 tracking-wider mb-1">Base Selling Price</div>
                      <div className="text-lg font-black text-[#385E31]">
                        {(() => {
                           if (sizes.length === 0) return `₱${Number(form.price || 0).toFixed(2)}`;
                           const prices = sizes.map(s => Number(s.price || 0));
                           if (prices.length === 0) return "₱0.00";
                           const min = Math.min(...prices); const max = Math.max(...prices);
                           return min === max ? `₱${min.toFixed(2)}` : `₱${min.toFixed(2)} - ₱${max.toFixed(2)}`;
                        })()}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 max-h-[250px] overflow-y-auto pr-2 pb-10">
                    {sizes.length === 0 ? (
                      <div className="bg-white p-5 rounded-[24px] border border-[#3A6131]/10">
                        <div className="grid grid-cols-2 gap-6">
                           <div>
                             <label className={labelStyle}>Base Selling Price</label>
                             <div className="flex items-center text-xl font-black text-[#3A6131] border-b border-[#3A6131]/10 pb-1">
                               <span className="mr-2 opacity-50">₱</span>
                               <input type="number" className="bg-transparent border-none p-0 focus:ring-0 w-full" value={form.price} onChange={(e) => set("price", e.target.value)} placeholder="0.00" />
                             </div>
                           </div>
                           <div>
                             <div className="flex justify-between items-center mb-2">
                               <label className={`${labelStyle} !mb-0`}>Max Yield (Servings)</label>
                               <span className="text-[10px] font-black text-[#3A6131]/40 uppercase tracking-wider">
                                 Possible: {getYieldForSize(null)}
                               </span>
                             </div>
                             <div className="flex items-center text-xl font-black text-[#3A6131] border-b border-[#3A6131]/10 pb-1">
                               <input type="number" className="bg-transparent border-none p-0 focus:ring-0 w-full" value={form.max_yield} onChange={(e) => set("max_yield", e.target.value)} placeholder="0" />
                             </div>
                             {Number(form.max_yield) > getYieldForSize(null) && getYieldForSize(null) > 0 && (
                               <p className="text-[10px] font-bold text-red-500 mt-1">Warning: Exceeds possible stock yield.</p>
                             )}
                           </div>
                        </div>
                      </div>
                    ) : (
                      sizes.map((s, idx) => (
                        <div key={idx} className="bg-white p-5 rounded-[24px] border border-[#3A6131]/10 flex flex-col gap-4 shadow-sm">
                          <div className="flex justify-between items-center border-b border-[#3A6131]/5 pb-2">
                            <h4 className="font-black text-[#3A6131] text-lg">{s.label || "Unnamed Size"}</h4>
                            <div className="text-right">
                              <span className="text-[10px] uppercase font-black tracking-wider text-[#3A6131]/40 block leading-none mb-1">Unit Cost</span>
                              <span className="text-sm font-black text-[#3A6131]">₱{getRecipeCostForSize(s.label).toFixed(2)}</span>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-6">
                           <div>
                             <label className={labelStyle}>Selling Price</label>
                             <div className="flex items-center text-xl font-black text-[#3A6131] border-b border-[#3A6131]/10 pb-1">
                               <span className="mr-2 opacity-50">₱</span>
                               <input type="number" className="bg-transparent border-none p-0 focus:ring-0 w-full" value={s.price} onChange={(e) => updateSize(idx, "price", e.target.value)} placeholder="0.00" />
                             </div>
                           </div>
                           <div>
                             <div className="flex justify-between items-center mb-2">
                               <label className={`${labelStyle} !mb-0`}>Max Yield (Servings)</label>
                               <span className="text-[10px] font-black text-[#3A6131]/40 uppercase tracking-wider">
                                 Possible: {getYieldForSize(s.label)}
                               </span>
                             </div>
                             <div className="flex items-center text-xl font-black text-[#3A6131] border-b border-[#3A6131]/10 pb-1">
                               <input type="number" className="bg-transparent border-none p-0 focus:ring-0 w-full" value={s.max_yield} onChange={(e) => updateSize(idx, "max_yield", e.target.value)} placeholder="0" />
                             </div>
                             {Number(s.max_yield) > getYieldForSize(s.label) && getYieldForSize(s.label) > 0 && (
                               <p className="text-[10px] font-bold text-red-500 mt-1">Warning: Exceeds possible stock yield.</p>
                             )}
                           </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-[#3A6131]/10">
                    <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-full bg-[#3A6131]/10 flex items-center justify-center text-[#3A6131]"><PackageCheck size={20} /></div><span className="text-sm font-bold text-[#3A6131]">Show on Storefront</span></div>
                    <button onClick={() => set("visible", !form.visible)} className={`w-12 h-6 rounded-full transition-all relative ${form.visible ? "bg-[#3A6131]" : "bg-gray-200"}`}><div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${form.visible ? "right-1" : "left-1"}`} /></button>
                  </div>
                </motion.div>
              )}

            </AnimatePresence>
          </div>
          <div className="px-8 py-5 border-t border-[#3A6131]/10 bg-white/80 flex justify-between items-center z-20">
            <button onClick={() => step > 1 ? setStep(step - 1) : onClose()} className="text-[#3A6131]/50 text-sm font-bold hover:text-[#3A6131] transition-colors">{step === 1 ? "Cancel" : "Back"}</button>
            <button onClick={() => step < 4 ? setStep(step + 1) : handleSave()} disabled={saving} className="bg-[#3A6131] text-[#FFFCEB] px-8 py-3 rounded-2xl text-sm font-bold flex items-center gap-2 hover:opacity-90 transition-opacity shadow-md disabled:opacity-60 disabled:cursor-not-allowed">
              {saving ? <><Loader2 size={16} className="animate-spin" /> Saving…</> : <>{step === 4 ? "Complete & Save" : "Continue"} <ChevronRight size={16} /></>}
            </button>
          </div>
        </div>
      </motion.div>
    </ModalBackdrop>
  );
}