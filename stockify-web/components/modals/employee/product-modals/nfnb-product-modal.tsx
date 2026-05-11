"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ModalBackdrop from "@/components/modals/employee/ingredients-modals/modals-backdrop";
import {
  X, Info, ChevronRight,
  Trash2, Plus, Loader2, PackageCheck, Layers, Coins, UploadCloud, Package,
} from "lucide-react";
import { fetchCategories, type Category } from "@/lib/employee/inventory";
import {
  type NfbProduct,
  type VariantTypeInput,
  type VariantOptionInput,
  uploadNfbProductImage,
} from "@/lib/employee/nfb-products";

export interface NfbProductModalProps {
  mode:     "add" | "edit";
  tenantId: string;
  initial?: NfbProduct;
  onSave: (
    input: {
      category_id:     string | null;
      name:            string;
      sku:             string;
      description:     string | null;
      image_url?:      string | null;
      quantity:        number;
      unit_of_measure: string;
      unit_cost:       number;
      price:           number;
      visible:         boolean;
    },
    variants: VariantTypeInput[]
  ) => Promise<void>;
  onClose: () => void;
}

const labelStyle  = "text-[11px] font-black uppercase tracking-[0.12em] text-[#3A6131]/50 mb-2 block";
const inputStyle  = "w-full bg-white border-[1.5px] border-[#3A6131]/10 rounded-2xl px-4 py-3 text-sm text-[#3A6131] font-medium focus:outline-none focus:border-[#F7B71D] focus:ring-4 focus:ring-[#F7B71D]/10 transition-all placeholder:text-gray-300";
const selectStyle = `${inputStyle} appearance-none pr-10 bg-[image:url("data:image/svg+xml,%3Csvg%20xmlns%3D'http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg'%20width%3D'16'%20height%3D'16'%20viewBox%3D'0%200%2024%2024'%20fill%3D'none'%20stroke%3D'%233A6131'%20stroke-width%3D'2'%20stroke-linecap%3D'round'%20stroke-linejoin%3D'round'%3E%3Cpolyline%20points%3D'6%209%2012%2015%2018%209'%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E")] bg-no-repeat bg-[right_14px_center]`;

const ALL_STEPS = [
  { id: 1, label: "Basic Information", icon: Info   },
  { id: 2, label: "Variants",          icon: Layers, variantsOnly: true },
  { id: 3, label: "Pricing & Metrics", icon: Coins  },
];

const UNIT_OPTIONS = ["pcs", "box", "set", "unit", "pack", "roll", "pair", "sheet", "bottle"];

// Extended variant option now includes unit_of_measure instead of sku_suffix
interface VariantOptionInputExtended {
  label:           string;
  price:           string;
  unit_cost:       string;
  stock:           string;
  unit_of_measure: string;
}

const EMPTY_OPTION = (): VariantOptionInputExtended => ({ label: "", price: "", unit_cost: "", stock: "", unit_of_measure: "pcs" });



// Variant type using extended option
interface VariantTypeInputExtended {
  name:    string;
  options: VariantOptionInputExtended[];
}

export default function NfbProductModal({ mode, tenantId, initial, onSave, onClose }: NfbProductModalProps) {
  const [step,           setStep]           = useState(1);
  const [saving,         setSaving]         = useState(false);
  const [error,          setError]          = useState<string | null>(null);
  const [categories,     setCategories]     = useState<Category[]>([]);
  const [loadingCats,    setLoadingCats]    = useState(true);
  const [imageFile,      setImageFile]      = useState<File | null>(null);
  const [imagePreview,   setImagePreview]   = useState<string | null>(initial?.image_url?.split('?')[0] ?? null);
  const [imageUploading, setImageUploading] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // "with_variants" | "single" — controls Step 1 quantity/UOM display + Step 2 visibility hint
  const [productType, setProductType] = useState<"single" | "with_variants">(
    initial?.variants && initial.variants.length > 0 ? "with_variants" : "single"
  );

  // Derive visible steps — single item skips step 2
  const visibleSteps = ALL_STEPS.filter((s) => !(s.variantsOnly && productType === "single"));
  const totalSteps   = visibleSteps.length;

  // Map logical step index (1-based) within visibleSteps to actual step id
  const currentStepDef = visibleSteps.find((s) => s.id === step);
  const currentStepIdx = visibleSteps.findIndex((s) => s.id === step); // 0-based

  const goNext = () => {
    if (currentStepIdx < totalSteps - 1) {
      setStep(visibleSteps[currentStepIdx + 1].id);
    } else {
      handleSave();
    }
  };

  const goBack = () => {
    if (currentStepIdx > 0) {
      setStep(visibleSteps[currentStepIdx - 1].id);
    } else {
      onClose();
    }
  };

  // When switching from with_variants to single, jump back to step 1 if currently on step 2
  const handleProductTypeChange = (type: "single" | "with_variants") => {
    setProductType(type);
    if (type === "single" && step === 2) setStep(1);
  };

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

  const [variants, setVariants] = useState<VariantTypeInputExtended[]>(
    initial?.variants?.map((vt) => ({
      name: vt.name,
      options: vt.options?.map((o) => ({
        label:           o.label,
        price:           String(o.price),
        unit_cost:       String(o.unit_cost ?? ""),
        stock:           String(o.stock),
        unit_of_measure: (o as any).unit_of_measure ?? "pcs",
      })) ?? [],
    })) ?? []
  );

  const set = (key: string, val: any) => setForm((f) => ({ ...f, [key]: val }));

  useEffect(() => {
    fetchCategories(tenantId, "nfb_product")
      .then((data) => {
        setCategories(data);
        if (mode === "add" && data.length > 0 && !form.category_id)
          setForm((f) => ({ ...f, category_id: data[0].category_id }));
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoadingCats(false));
  }, []);

  // ── Variant helpers ───────────────────────────────────────────

  const addVariantType        = () => setVariants((p) => [...p, { name: "", options: [EMPTY_OPTION()] }]);
  const removeVariantType     = (ti: number) => setVariants((p) => p.filter((_, i) => i !== ti));
  const updateVariantTypeName = (ti: number, name: string) =>
    setVariants((p) => p.map((vt, i) => (i === ti ? { ...vt, name } : vt)));
  const addVariantOption      = (ti: number) =>
    setVariants((p) => p.map((vt, i) => (i === ti ? { ...vt, options: [...vt.options, EMPTY_OPTION()] } : vt)));
  const removeVariantOption   = (ti: number, oi: number) =>
    setVariants((p) => p.map((vt, i) => (i === ti ? { ...vt, options: vt.options.filter((_, j) => j !== oi) } : vt)));
  const updateVariantOption   = (ti: number, oi: number, key: keyof VariantOptionInputExtended, val: string) =>
    setVariants((p) =>
      p.map((vt, i) =>
        i === ti ? { ...vt, options: vt.options.map((o, j) => (j === oi ? { ...o, [key]: val } : o)) } : vt
      )
    );

  // ── Derived pricing helpers ───────────────────────────────────

  const hasVariants = productType === "with_variants" && variants.some(
    (vt) => vt.name.trim() && vt.options.some((o) => o.label.trim())
  );

  // ── Save ──────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!form.name.trim() || !form.sku.trim()) {
      setError("Product name and SKU are required.");
      return;
    }

    const validVariants: VariantTypeInput[] = productType === "with_variants"
      ? variants
          .map((vt) => ({
            ...vt,
            options: vt.options
              .filter((o) => o.label.trim())
              .map((o) => ({
                label:      o.label,
                price:      o.price,
                unit_cost:  o.unit_cost,
                stock:      o.stock,
                sku_suffix: "",          // kept for API compatibility
              })),
          }))
          .filter((vt) => vt.name.trim() && vt.options.length > 0)
      : [];

    if (validVariants.length > 0) {
      const allOptions = validVariants.flatMap((vt) => vt.options);
      const totalVariantStock = allOptions.reduce((sum, o) => sum + (Number(o.stock) || 0), 0);
      const baseQuantity = Number(form.quantity) || 0;
      if (totalVariantStock > baseQuantity && baseQuantity > 0) {
        setError(`Total variant stock (${totalVariantStock}) cannot exceed base quantity (${baseQuantity}).`);
        return;
      }
    }

    const finalPrice = (() => {
      if (validVariants.length === 0) return Number(form.price) || 0;
      const prices = validVariants.flatMap((vt) => vt.options).map((o) => Number(o.price) || 0);
      return prices.length > 0 ? Math.min(...prices) : 0;
    })();

    const finalUnitCost = (() => {
      if (validVariants.length === 0) return Number(form.unit_cost) || 0;
      const costs = validVariants.flatMap((vt) => vt.options).map((o) => Number(o.unit_cost) || 0);
      return costs.length > 0 ? Math.min(...costs) : 0;
    })();

    try {
      setSaving(true);
      setError(null);

      // Upload image if a new file was chosen
      let imageUrl: string | null = initial?.image_url ?? null;
      if (imageFile) {
        setImageUploading(true);
        // We need a productId to name the file – for new products, use a temp UUID
        const productId = (initial as any)?.product_id ?? crypto.randomUUID();
        imageUrl = await uploadNfbProductImage(tenantId, productId, imageFile);
        setImageUploading(false);
      }

      await onSave(
        {
          category_id:     form.category_id || null,
          name:            form.name.trim(),
          sku:             form.sku.trim().toUpperCase(),
          description:     form.description.trim() || null,
          image_url:       imageUrl,
          quantity:        Number(form.quantity) || 0,
          unit_of_measure: form.unit_of_measure,
          unit_cost:       finalUnitCost,
          price:           finalPrice,
          visible:         form.visible,
        },
        validVariants
      );
    } catch (e: any) {
      setError(e.message);
      setImageUploading(false);
      setSaving(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────

  return (
    <ModalBackdrop onClose={onClose}>
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="w-full max-w-[960px] bg-[#FFFCEB] rounded-[32px] overflow-hidden border-[1.5px] border-[#F7B71D]/20 shadow-[0_32px_80px_rgba(58,97,49,0.2)] flex flex-col md:flex-row h-[680px] font-inter"
      >
        {/* ── SIDEBAR ── */}
        <div className="w-full md:w-[300px] bg-[#3A6131] p-10 flex flex-col relative overflow-hidden shrink-0">
          <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-[#F7B71D]/10 rounded-full blur-3xl" />
          <div className="relative z-10">
            <div className="bg-[#F7B71D] w-12 h-1 rounded-full mb-8" />
            <h2 className="text-[#FFFCEB] font-raleway text-3xl font-black leading-tight mb-2">
              {mode === "add" ? "Add Product" : "Edit Product"}
            </h2>
            <p className="text-[#FFFCEB]/60 text-xs font-medium leading-relaxed mb-10">
              Set up your physical product, configure variants, then finalize pricing.
            </p>
            <nav className="flex flex-col gap-7">
              <AnimatePresence initial={false}>
                {visibleSteps.map((s, idx) => (
                  <motion.div
                    key={s.id}
                    initial={{ opacity: 0, x: -16, height: 0 }}
                    animate={{ opacity: 1, x: 0, height: "auto" }}
                    exit={{ opacity: 0, x: -16, height: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <div
                      className={`flex items-center gap-4 transition-all duration-300 ${step === s.id ? "translate-x-2" : "opacity-40"}`}
                    >
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                          step === s.id
                            ? "bg-[#F7B71D] text-[#385E31] shadow-lg shadow-[#F7B71D]/20"
                            : "bg-white/10 text-white"
                        }`}
                      >
                        <s.icon size={18} strokeWidth={2.5} />
                      </div>
                      <span className={`text-sm font-bold tracking-wide ${step === s.id ? "text-[#FFFCEB]" : "text-white"}`}>
                        {s.label}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </nav>
          </div>

          <div className="mt-auto relative z-10 space-y-4">
            <div className="bg-white/10 rounded-2xl px-4 py-3">
              <p className="text-[#FFFCEB]/40 text-[10px] font-black uppercase tracking-widest mb-1">Business Type</p>
              <p className="text-[#F7B71D] text-sm font-bold">Non-Food &amp; Beverages</p>
            </div>
            <div className="flex gap-2">
              {visibleSteps.map((s, i) => (
                <div
                  key={s.id}
                  className={`h-1.5 rounded-full transition-all duration-500 ${
                    step === s.id ? "w-8 bg-[#F7B71D]" : "w-2 bg-white/20"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* ── CONTENT ── */}
        <div className="flex-1 flex flex-col relative bg-white/50 backdrop-blur-sm">
          <button
            onClick={onClose}
            className="absolute top-6 right-6 w-10 h-10 rounded-full bg-[#FFFCEB] border border-[#3A6131]/10 flex items-center justify-center text-[#3A6131] hover:bg-[#3A6131] hover:text-[#FFFCEB] transition-all z-20"
          >
            <X size={20} strokeWidth={2.5} />
          </button>

          <div className="flex-1 overflow-y-auto p-10 [&::-webkit-scrollbar]:w-[5px] [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[#3A6131]/15 [&::-webkit-scrollbar-thumb]:rounded-full">
            {error && (
              <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-2xl text-red-600 text-xs font-semibold">
                {error}
              </div>
            )}

            <AnimatePresence mode="wait">

              {/* ── STEP 1 — Basic Information ── */}
              {step === 1 && (
                <motion.div
                  key="s1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <div className="mb-6">
                    <span className="bg-[#F7B71D]/15 text-[#385E31] text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
                      Step 01
                    </span>
                    <h3 className="text-2xl font-black text-[#3A6131] mt-2 font-raleway italic">Product Information</h3>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className={labelStyle}>Product Name</label>
                      <input
                        className={inputStyle}
                        value={form.name}
                        onChange={(e) => set("name", e.target.value)}
                        placeholder="e.g. Wireless Headphones"
                      />
                    </div>

                    <div className="col-span-2">
                    <label className={labelStyle}>Description</label>
                    <textarea
                      className={`${inputStyle} h-20 resize-none`}
                      value={form.description}
                      onChange={(e) => set("description", e.target.value)}
                      placeholder="Brief product description…"
                    />
                  </div>

                  {/* Image Upload */}
                  <div className="col-span-2">
                    <label className={labelStyle}>Product Image <span className="text-[#3A6131]/40 font-normal">(optional)</span></label>
                    <div
                      onClick={() => imageInputRef.current?.click()}
                      className={`relative flex flex-col items-center justify-center gap-2 w-full h-36 rounded-2xl border-2 border-dashed cursor-pointer transition-all ${
                        imagePreview
                          ? 'border-[#3A6131]/30 bg-transparent'
                          : 'border-[#3A6131]/20 bg-[#3A6131]/3 hover:border-[#3A6131]/50 hover:bg-[#3A6131]/5'
                      }`}
                    >
                      {imagePreview ? (
                        <>
                          <img src={imagePreview} alt="preview" className="w-full h-full object-cover rounded-2xl" />
                          <div className="absolute inset-0 bg-black/30 rounded-2xl flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                            <p className="text-white text-[12px] font-bold flex items-center gap-1"><UploadCloud size={14} /> Change Image</p>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setImagePreview(null); setImageFile(null); }}
                            className="absolute top-2 right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                          >
                            <X size={12} />
                          </button>
                        </>
                      ) : (
                        <>
                          <Package size={28} className="text-[#3A6131]/30" />
                          <p className="text-[#3A6131]/50 text-[12px] font-medium">Click to upload product image</p>
                          <p className="text-[#3A6131]/30 text-[10px]">PNG, JPG, WEBP up to 5MB</p>
                        </>
                      )}
                    </div>
                    <input
                      ref={imageInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        setImageFile(file);
                        setImagePreview(URL.createObjectURL(file));
                      }}
                    />
                  </div>

                    <div>
                      <label className={labelStyle}>SKU Code</label>
                      <input
                        className={inputStyle}
                        value={form.sku}
                        onChange={(e) => set("sku", e.target.value)}
                        placeholder="NFB-PRD-01"
                      />
                    </div>

                    <div>
                      <label className={labelStyle}>Category</label>
                      {loadingCats ? (
                        <div className="flex items-center gap-2 text-[#3A6131]/50 text-sm py-3">
                          <Loader2 size={16} className="animate-spin" /> Loading…
                        </div>
                      ) : (
                        <select
                          className={selectStyle}
                          value={form.category_id}
                          onChange={(e) => set("category_id", e.target.value)}
                        >
                          <option value="">— No Category —</option>
                          {categories.map((c) => (
                            <option key={c.category_id} value={c.category_id}>{c.name}</option>
                          ))}
                        </select>
                      )}
                    </div>

                    {/* ── Product Type Toggle ── */}
                    <div className="col-span-2">
                      <label className={labelStyle}>Product Type</label>
                      <div className="flex gap-2 p-1 bg-[#3A6131]/5 rounded-2xl border border-[#3A6131]/10">
                        <button
                          type="button"
                          onClick={() => handleProductTypeChange("single")}
                          className={`flex-1 py-2.5 rounded-xl text-[12px] font-black tracking-wide transition-all ${
                            productType === "single"
                              ? "bg-[#3A6131] text-[#FFFCEB] shadow-md"
                              : "text-[#3A6131]/50 hover:text-[#3A6131]"
                          }`}
                        >
                          Single Item
                        </button>
                        <button
                          type="button"
                          onClick={() => handleProductTypeChange("with_variants")}
                          className={`flex-1 py-2.5 rounded-xl text-[12px] font-black tracking-wide transition-all ${
                            productType === "with_variants"
                              ? "bg-[#3A6131] text-[#FFFCEB] shadow-md"
                              : "text-[#3A6131]/50 hover:text-[#3A6131]"
                          }`}
                        >
                          With Variants
                        </button>
                      </div>
                    </div>

                    {/* ── Quantity + UOM — only shown for Single Item ── */}
                    <AnimatePresence>
                      {productType === "single" && (
                        <>
                          <motion.div
                            key="qty"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden"
                          >
                            <label className={labelStyle}>Current Quantity</label>
                            <input
                              type="number"
                              className={inputStyle}
                              value={form.quantity}
                              onChange={(e) => set("quantity", e.target.value)}
                              placeholder="0"
                              min="0"
                            />
                          </motion.div>

                          <motion.div
                            key="uom"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden"
                          >
                            <label className={labelStyle}>Unit of Measure</label>
                            <select
                              className={selectStyle}
                              value={form.unit_of_measure}
                              onChange={(e) => set("unit_of_measure", e.target.value)}
                            >
                              {UNIT_OPTIONS.map((u) => <option key={u} value={u}>{u}</option>)}
                            </select>
                          </motion.div>
                        </>
                      )}

                      {productType === "with_variants" && (
                        <motion.div
                          key="variant-hint"
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="col-span-2 overflow-hidden"
                        >
                          <div className="flex items-start gap-3 bg-[#F7B71D]/10 border border-[#F7B71D]/30 rounded-2xl px-4 py-3">
                            <Layers size={16} className="text-[#F7B71D] mt-0.5 shrink-0" />
                            <p className="text-[11px] text-[#3A6131]/70 font-semibold leading-relaxed">
                              Stock and unit of measure will be configured per variant option in the next step.
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              )}

              {/* ── STEP 2 — Variants ── */}
              {step === 2 && (
                <motion.div
                  key="s2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-5"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="bg-[#F7B71D]/15 text-[#385E31] text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
                        Step 02
                      </span>
                      <h3 className="text-2xl font-black text-[#3A6131] mt-2 font-raleway italic">
                        Variants{" "}
                        {productType === "single" && (
                          <span className="text-base font-medium text-[#3A6131]/40 not-italic ml-1">(optional)</span>
                        )}
                      </h3>
                      <p className="text-[11px] text-[#3A6131]/50 mt-1 leading-relaxed pr-8">
                        Add variant types like Size or Color. Pricing is set in the next step.
                      </p>
                    </div>
                    <button
                      onClick={addVariantType}
                      className="w-11 h-11 rounded-2xl bg-[#3A6131] text-[#FFFCEB] flex items-center justify-center shadow-md hover:scale-110 transition-all active:scale-95 flex-shrink-0 mt-1 mr-10 translate-y-8"
                    >
                      <Plus size={22} strokeWidth={2.8} />
                    </button>
                  </div>

                  {variants.length === 0 ? (
                    <div className="py-12 border-2 border-dashed border-[#3A6131]/10 rounded-[24px] flex flex-col items-center justify-center text-[#3A6131]/30 mt-4">
                      <Layers size={40} strokeWidth={1} className="mb-2" />
                      <p className="text-sm font-medium">No variants — product has a single price &amp; stock</p>
                      <p className="text-xs mt-1">Click + to add a variant type (e.g. Size, Color)</p>
                    </div>
                  ) : (
                    <div className="space-y-4 mt-4">
                      {variants.map((vt, ti) => (
                        <div key={ti} className="bg-white rounded-2xl border border-[#3A6131]/10 overflow-hidden shadow-sm">
                          {/* Variant type header */}
                          <div className="flex items-center gap-3 px-4 py-3 bg-[#3A6131]/5 border-b border-[#3A6131]/10">
                            <input
                              className="flex-1 bg-transparent text-[13px] font-black text-[#3A6131] focus:outline-none border-b border-[#3A6131]/20 focus:border-[#F7B71D] py-0.5"
                              placeholder="Variant type (e.g. Size, Color, Material)"
                              value={vt.name}
                              onChange={(e) => updateVariantTypeName(ti, e.target.value)}
                            />
                            <button
                              onClick={() => addVariantOption(ti)}
                              className="text-[11px] font-black text-[#3A6131] bg-[#F7B71D]/20 hover:bg-[#F7B71D]/40 px-3 py-1 rounded-full transition-colors flex items-center gap-1"
                            >
                              <Plus size={12} /> Add Option
                            </button>
                            <button onClick={() => removeVariantType(ti)} className="p-1 text-red-400 hover:text-red-600">
                              <Trash2 size={15} />
                            </button>
                          </div>

                          {/* Column labels */}
                          <div className="flex gap-2 px-4 pt-2 pb-1">
                            <span className="flex-1 text-[10px] font-black uppercase tracking-wider text-[#3A6131]/40">Label</span>
                            <span className="w-20 text-[10px] font-black uppercase tracking-wider text-[#3A6131]/40 text-center">Stock</span>
                            <span className="w-24 text-[10px] font-black uppercase tracking-wider text-[#3A6131]/40 text-center">Unit</span>
                            <div className="w-8" />
                          </div>

                          {/* Options */}
                          <div className="space-y-1 px-4 pb-3">
                            {vt.options.map((opt, oi) => (
                              <div key={oi} className="flex gap-2 items-center">
                                <input
                                  className="flex-1 bg-[#FFFCEB]/60 border border-[#3A6131]/10 rounded-xl px-3 py-2 text-[12px] font-bold text-[#3A6131] focus:outline-none focus:border-[#F7B71D]"
                                  placeholder="e.g. Small, Red…"
                                  value={opt.label}
                                  onChange={(e) => updateVariantOption(ti, oi, "label", e.target.value)}
                                />
                                <input
                                  type="number"
                                  className="w-20 bg-[#FFFCEB]/60 border border-[#3A6131]/10 rounded-xl px-3 py-2 text-[12px] font-black text-[#3A6131] text-center focus:outline-none focus:border-[#F7B71D]"
                                  placeholder="0"
                                  value={opt.stock}
                                  onChange={(e) => updateVariantOption(ti, oi, "stock", e.target.value)}
                                />
                                {/* Unit of Measure per option */}
                                <select
                                  className="w-24 bg-[#FFFCEB]/60 border border-[#3A6131]/10 rounded-xl px-2 py-2 text-[12px] font-bold text-[#3A6131] text-center focus:outline-none focus:border-[#F7B71D] appearance-none"
                                  value={opt.unit_of_measure}
                                  onChange={(e) => updateVariantOption(ti, oi, "unit_of_measure", e.target.value)}
                                >
                                  {UNIT_OPTIONS.map((u) => <option key={u} value={u}>{u}</option>)}
                                </select>
                                <button
                                  onClick={() => removeVariantOption(ti, oi)}
                                  className="w-8 flex justify-center text-red-400 hover:text-red-600"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {/* ── STEP 3 — Pricing & Metrics ── */}
              {step === 3 && (
                <motion.div
                  key="s3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-5"
                >
                  <div className="mb-6">
                    <span className="bg-[#F7B71D]/15 text-[#385E31] text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
                      Step 03
                    </span>
                    <h3 className="text-2xl font-black text-[#3A6131] mt-2 font-raleway italic">Pricing &amp; Metrics</h3>
                    <p className="text-[11px] text-[#3A6131]/50 mt-1">
                      {hasVariants
                        ? "Set unit cost and selling price for each variant option."
                        : "Set the unit cost and selling price for this product."}
                    </p>
                  </div>

                  {/* Summary Ranges (Shown for both) */}
                  <div className="flex gap-4">
                    <div className="flex-1 bg-[#3A6131]/5 p-4 rounded-2xl border border-[#3A6131]/10">
                      <div className="text-[10px] font-black uppercase text-[#3A6131]/50 tracking-wider mb-1">Unit Cost (Internal)</div>
                      <div className="text-lg font-black text-[#3A6131]">
                        {(() => {
                           if (!hasVariants) return `₱${Number(form.unit_cost || 0).toFixed(2)}`;
                           const validOpts = variants.flatMap(vt => vt.options).filter(o => o.label.trim());
                           if (validOpts.length === 0) return "₱0.00";
                           const costs = validOpts.map(o => Number(o.unit_cost || 0));
                           const min = Math.min(...costs); const max = Math.max(...costs);
                           return min === max ? `₱${min.toFixed(2)}` : `₱${min.toFixed(2)} - ₱${max.toFixed(2)}`;
                        })()}
                      </div>
                    </div>
                    <div className="flex-1 bg-[#F7B71D] p-4 rounded-2xl shadow-lg shadow-[#F7B71D]/20">
                      <div className="text-[10px] font-black uppercase text-[#385E31]/60 tracking-wider mb-1">Base Selling Price</div>
                      <div className="text-lg font-black text-[#385E31]">
                        {(() => {
                           if (!hasVariants) return `₱${Number(form.price || 0).toFixed(2)}`;
                           const validOpts = variants.flatMap(vt => vt.options).filter(o => o.label.trim());
                           if (validOpts.length === 0) return "₱0.00";
                           const prices = validOpts.map(o => Number(o.price || 0));
                           const min = Math.min(...prices); const max = Math.max(...prices);
                           return min === max ? `₱${min.toFixed(2)}` : `₱${min.toFixed(2)} - ₱${max.toFixed(2)}`;
                        })()}
                      </div>
                    </div>
                  </div>

                  {/* ── PATH A: No variants — inputs for single item ── */}
                  {!hasVariants && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white p-5 rounded-[20px] border border-[#3A6131]/10">
                        <label className={labelStyle}>Unit Cost (Internal)</label>
                        <div className="flex items-center text-xl font-black text-[#3A6131]">
                          <span className="mr-2 opacity-30">₱</span>
                          <input
                            type="number"
                            className="bg-transparent border-none p-0 focus:ring-0 w-full font-black"
                            value={form.unit_cost}
                            onChange={(e) => set("unit_cost", e.target.value)}
                            placeholder="0.00"
                          />
                        </div>
                      </div>

                      <div className="bg-white p-5 rounded-[20px] border border-[#3A6131]/10">
                        <label className={`${labelStyle}`}>Selling Price</label>
                        <div className="flex items-center text-xl font-black text-[#385E31]">
                          <span className="mr-2 opacity-30">₱</span>
                          <input
                            type="number"
                            className="bg-transparent border-none p-0 focus:ring-0 w-full font-black placeholder:text-[#385E31]/30"
                            value={form.price}
                            onChange={(e) => set("price", e.target.value)}
                            placeholder="0.00"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ── PATH B: Has variants — unit cost + base price per option ── */}
                  {hasVariants && (
                    <div className="space-y-4 max-h-[380px] overflow-y-auto pr-1 [&::-webkit-scrollbar]:w-[5px] [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[#3A6131]/15 [&::-webkit-scrollbar-thumb]:rounded-full">
                      {variants.map((vt, ti) => {
                        const visibleOpts = vt.options.filter((o) => o.label.trim());
                        if (!vt.name.trim() || visibleOpts.length === 0) return null;
                        return (
                          <div key={ti} className="bg-white rounded-2xl border border-[#3A6131]/10 overflow-hidden shadow-sm">
                            {/* Variant type header */}
                            <div className="flex items-center px-4 py-3 bg-[#3A6131]/5 border-b border-[#3A6131]/10">
                              <span className="text-[13px] font-black text-[#3A6131]">{vt.name}</span>
                            </div>

                            {/* Column labels */}
                            <div className="flex gap-2 px-4 pt-2 pb-1">
                              <span className="flex-1 text-[10px] font-black uppercase tracking-wider text-[#3A6131]/40">Option</span>
                              <span className="w-16 text-[10px] font-black uppercase tracking-wider text-[#3A6131]/40 text-center">Stock</span>
                              <span className="w-28 text-[10px] font-black uppercase tracking-wider text-[#3A6131]/40 text-center">Unit Cost (₱)</span>
                              <span className="w-28 text-[10px] font-black uppercase tracking-wider text-[#F7B71D] text-center">Base Price (₱)</span>
                            </div>

                            {/* Option rows */}
                            <div className="space-y-1 px-4 pb-4">
                              {vt.options.map((opt, oi) => {
                                if (!opt.label.trim()) return null;
                                return (
                                  <div key={oi} className="flex gap-2 items-center">
                                    {/* Label — read-only */}
                                    <div className="flex-1 bg-[#3A6131]/5 rounded-xl px-3 py-2 text-[12px] font-bold text-[#3A6131]">
                                      {opt.label}
                                    </div>
                                    {/* Stock — read-only display */}
                                    <div className="w-16 bg-[#3A6131]/5 rounded-xl px-3 py-2 text-[12px] font-black text-[#3A6131] text-center">
                                      {opt.stock || "0"}
                                    </div>
                                    {/* Unit Cost — editable (cost) */}
                                    <div className="w-28 flex items-center bg-[#3A6131]/5 border border-[#3A6131]/15 rounded-xl px-3 py-2">
                                      <span className="text-[11px] font-black text-[#3A6131]/40 mr-1">₱</span>
                                      <input
                                        type="number"
                                        className="w-full bg-transparent text-[12px] font-black text-[#3A6131] text-center focus:outline-none"
                                        placeholder="0.00"
                                        value={opt.unit_cost}
                                        onChange={(e) => updateVariantOption(ti, oi, "unit_cost", e.target.value)}
                                      />
                                    </div>
                                    {/* Base Selling Price — editable */}
                                    <div className="w-28 flex items-center bg-[#F7B71D]/15 border border-[#F7B71D]/50 rounded-xl px-3 py-2">
                                      <span className="text-[11px] font-black text-[#3A6131]/40 mr-1">₱</span>
                                      <input
                                        type="number"
                                        className="w-full bg-transparent text-[12px] font-black text-[#3A6131] text-center focus:outline-none"
                                        placeholder="0.00"
                                        value={opt.price}
                                        onChange={(e) => updateVariantOption(ti, oi, "price", e.target.value)}
                                      />
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Visible toggle — always at bottom */}
                  <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-[#3A6131]/10">
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
                </motion.div>
              )}

            </AnimatePresence>
          </div>

          <div className="px-8 py-5 border-t border-[#3A6131]/10 bg-white/80 flex justify-between items-center z-20">
            <button
              onClick={goBack}
              className="text-[#3A6131]/50 text-sm font-bold hover:text-[#3A6131] transition-colors"
            >
              {currentStepIdx === 0 ? "Cancel" : "Back"}
            </button>
            <button
              onClick={goNext}
              disabled={saving}
              className="bg-[#3A6131] text-[#FFFCEB] px-8 py-3 rounded-2xl text-sm font-bold flex items-center gap-2 hover:opacity-90 transition-opacity shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {saving ? (
                <><Loader2 size={16} className="animate-spin" /> Saving…</>
              ) : (
                <>{currentStepIdx === totalSteps - 1 ? "Complete & Save" : "Continue"} <ChevronRight size={16} /></>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </ModalBackdrop>
  );
}