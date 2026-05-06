"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ModalBackdrop from "./modals-backdrop";
import { Product, CATEGORIES } from "@/types/product";
import { 
  X, 
  Info, 
  Coffee, 
  Tag, 
  Layout, 
  ChevronRight, 
  Flame, 
  Trash2, 
  Plus,
  Coins,
  PackageCheck,
  ImagePlus,
  UploadCloud
} from "lucide-react";

// Mock raw materials
const MOCK_RAW_MATERIALS = [
  { id: 1, name: "Espresso Beans", baseUnit: "g" },
  { id: 2, name: "Whole Milk", baseUnit: "ml" },
  { id: 3, name: "Caramel Syrup", baseUnit: "ml" },
  { id: 4, name: "Paper Cups (Med)", baseUnit: "pcs" },
];

interface ProductModalProps {
  mode: "add" | "edit";
  initial?: any;
  onSave: (data: any) => void;
  onClose: () => void;
}

export default function ProductModal({ mode, initial, onSave, onClose }: ProductModalProps) {
  const [step, setStep] = useState(1);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState(
    initial ? { ...initial, unitCost: String(initial.unitCost), price: String(initial.price), maxYield: String(initial.maxYield) } 
    : {
        name: "",
        sku: "",
        description: "",
        category: "Coffee",
        unitCost: "",
        price: "",
        maxYield: "",
        visible: true,
        img: null as string | null,
        recipe: [] as { materialId: string; amount: string; unit: string }[],
      }
  );

  const set = (key: string, val: any) => setForm((f: any) => ({ ...f, [key]: val }));

  const labelStyle = "text-[11px] font-black uppercase tracking-[0.12em] text-[#3A6131]/50 mb-2 block";
  const inputStyle = "w-full bg-white border-[1.5px] border-[#3A6131]/10 rounded-2xl px-4 py-3 text-sm text-[#3A6131] font-medium focus:outline-none focus:border-[#F7B71D] focus:ring-4 focus:ring-[#F7B71D]/10 transition-all placeholder:text-gray-300";
  const selectStyle = `${inputStyle} appearance-none pr-10 bg-[image:url("data:image/svg+xml,%3Csvg%20xmlns%3D'http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg'%20width%3D'16'%20height%3D'16'%20viewBox%3D'0%200%2024%2024'%20fill%3D'none'%20stroke%3D'%233A6131'%20stroke-width%3D'2'%20stroke-linecap%3D'round'%20stroke-linejoin%3D'round'%3E%3Cpolyline%20points%3D'6%209%2012%2015%2018%209'%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E")] bg-no-repeat bg-[right_14px_center]`;

  const handleImageFile = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => set("img", e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    if (!form.name || !form.sku || !form.price) return;
    onSave({
      name: form.name,
      sku: form.sku,
      description: form.description,
      category: form.category,
      unitCost: Number(form.unitCost),
      price: Number(form.price),
      maxYield: Number(form.maxYield),
      visible: form.visible,
      img: form.img,
      recipe: form.recipe,
    });
  };

  return (
    <ModalBackdrop onClose={onClose}>
      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="w-full max-w-[920px] bg-[#FFFCEB] rounded-[32px] overflow-hidden border-[1.5px] border-[#F7B71D]/20 shadow-[0_32px_80px_rgba(58,97,49,0.2)] flex flex-col md:flex-row h-[650px] font-inter"
      >
        
        {/* ── LEFT SIDEBAR ── */}
        <div className="w-full md:w-[320px] bg-[#3A6131] p-10 flex flex-col relative overflow-hidden">
            <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-[#F7B71D]/10 rounded-full blur-3xl" />
            
            <div className="relative z-10">
                <div className="bg-[#F7B71D] w-12 h-1 rounded-full mb-8" />
                <h2 className="text-[#FFFCEB] font-raleway text-3xl font-black leading-tight mb-2">
                    {mode === "add" ? "Create Product" : "Edit Details"}
                </h2>
                <p className="text-[#FFFCEB]/60 text-xs font-medium leading-relaxed mb-12">
                    Fill in the necessary information to update your digital storefront and automate inventory.
                </p>

                <nav className="flex flex-col gap-8">
                    {[
                        { id: 1, label: "Basic Information", icon: Info },
                        { id: 2, label: "Recipe & Ingredients", icon: Coffee },
                        { id: 3, label: "Pricing & Metrics", icon: Coins },
                    ].map((s) => (
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

            <div className="mt-auto relative z-10">
                <div className="flex gap-2">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className={`h-1.5 rounded-full transition-all duration-500 ${step === i ? "w-8 bg-[#F7B71D]" : "w-2 bg-white/20"}`} />
                    ))}
                </div>
            </div>
        </div>

        {/* ── RIGHT CONTENT ── */}
        <div className="flex-1 flex flex-col relative bg-white/50 backdrop-blur-sm">
            
            <button onClick={onClose} className="absolute top-6 right-6 w-10 h-10 rounded-full bg-[#FFFCEB] border border-[#3A6131]/10 flex items-center justify-center text-[#3A6131] hover:bg-[#3A6131] hover:text-[#FFFCEB] transition-all z-20">
                <X size={20} strokeWidth={2.5} />
            </button>

            <div className="flex-1 overflow-y-auto p-10 [&::-webkit-scrollbar]:w-[5px] [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[#3A6131]/15 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-[#3A6131]/25">
                
                <AnimatePresence mode="wait">
                    {/* STEP 1: PRODUCT INFORMATION */}
                    {step === 1 && (
                        <motion.div 
                            key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                            className="space-y-6"
                        >
                            <div className="mb-8">
                                <span className="bg-[#F7B71D]/15 text-[#385E31] text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">Step 01</span>
                                <h3 className="text-2xl font-black text-[#3A6131] mt-2 font-raleway italic">Product Information</h3>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className={labelStyle}>Product Name</label>
                                    <input className={inputStyle} value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Signature Espresso" />
                                </div>
                                <div className="col-span-2">
                                    <label className={labelStyle}>Product Description (Visible to Customers)</label>
                                    <textarea 
                                        className={`${inputStyle} h-24 resize-none`} 
                                        value={form.description} 
                                        onChange={(e) => set("description", e.target.value)} 
                                        placeholder="Briefly describe the taste, ingredients, or story of this product..."
                                    />
                                </div>
                                <div>
                                    <label className={labelStyle}>SKU Code</label>
                                    <input className={inputStyle} value={form.sku} onChange={(e) => set("sku", e.target.value)} placeholder="ESP-001" />
                                </div>
                                <div>
                                    <label className={labelStyle}>Category</label>
                                   <select className={selectStyle} value={form.category} onChange={(e) => set("category", e.target.value)}>
                                        {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                                    </select>
                                </div>

                                {/* ── PRODUCT IMAGE UPLOAD ── */}
                                <div className="col-span-2">
                                    <label className={labelStyle}>Product Photo</label>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) handleImageFile(file);
                                        }}
                                    />

                                    {form.img ? (
                                        /* Preview state */
                                        <div className="flex items-center gap-4 bg-white border-[1.5px] border-[#3A6131]/10 rounded-2xl p-3">
                                            <img
                                                src={form.img}
                                                alt="Product preview"
                                                className="w-16 h-16 rounded-xl object-cover border border-[#3A6131]/10 flex-shrink-0"
                                            />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-bold text-[#3A6131] truncate">Photo uploaded</p>
                                                <p className="text-[10px] text-[#3A6131]/40 mt-0.5">Looks great! Square images display best.</p>
                                            </div>
                                            <button
                                                onClick={() => set("img", null)}
                                                className="p-2 text-red-400 hover:text-red-600 transition-colors flex-shrink-0"
                                                title="Remove image"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                            <button
                                                onClick={() => fileInputRef.current?.click()}
                                                className="text-[10px] font-black uppercase tracking-wide text-[#3A6131]/50 hover:text-[#3A6131] transition-colors flex-shrink-0 pr-1"
                                            >
                                                Change
                                            </button>
                                        </div>
                                    ) : (
                                        /* Drop zone state */
                                        <div
                                            onClick={() => fileInputRef.current?.click()}
                                            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                                            onDragLeave={() => setDragOver(false)}
                                            onDrop={(e) => {
                                                e.preventDefault();
                                                setDragOver(false);
                                                const file = e.dataTransfer.files?.[0];
                                                if (file) handleImageFile(file);
                                            }}
                                            className={`cursor-pointer flex items-center gap-4 border-[1.5px] border-dashed rounded-2xl px-5 py-4 transition-all ${
                                                dragOver
                                                    ? "border-[#F7B71D] bg-[#F7B71D]/5"
                                                    : "border-[#3A6131]/15 bg-white hover:border-[#F7B71D]/60 hover:bg-[#FFFCEB]/60"
                                            }`}
                                        >
                                            <div className="w-10 h-10 rounded-xl bg-[#3A6131]/5 flex items-center justify-center text-[#3A6131]/40 flex-shrink-0">
                                                <UploadCloud size={20} strokeWidth={1.8} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-[#3A6131]">
                                                    Click to upload or drag & drop
                                                </p>
                                                <p className="text-[10px] text-[#3A6131]/40 mt-0.5 leading-relaxed">
                                                    PNG, JPG, WEBP supported &nbsp;·&nbsp; <span className="font-semibold text-[#3A6131]/55">Best displayed as a square (1:1) image</span>
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                {/* ── END IMAGE UPLOAD ── */}
                            </div>
                        </motion.div>
                    )}

                    {/* STEP 2: RECIPE BUILDER */}
                    {step === 2 && (
                        <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                            
                            {/* Header row: title left, big + button right */}
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <span className="bg-[#F7B71D]/15 text-[#385E31] text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">Step 02</span>
                                    <h3 className="text-2xl font-black text-[#3A6131] mt-2 font-raleway italic">Ingredients Setup</h3>
                                </div>

                                {/* Large + button — no label text to avoid header clash */}
                                <button
                                    onClick={() => set("recipe", [...form.recipe, { materialId: "", amount: "", unit: "" }])}
                                    className="w-13 h-13 rounded-2xl bg-[#3A6131] text-[#FFFCEB] flex items-center justify-center shadow-md hover:scale-110 hover:shadow-[#3A6131]/30 transition-all active:scale-95 flex-shrink-0 mt-1 mr-10 translate-y-8"
                                    title="Add Ingredient"
                                >
                                    <Plus size={24} strokeWidth={2.8} />
                                </button>
                            </div>

                            {/* Helper note */}
                            <p className="text-[11px] text-[#3A6131]/50 leading-relaxed -mt-2 pr-25">
                                Map each ingredient and its quantity used per serving. This powers the automatic deduction of raw materials from your inventory every time a sale is recorded.
                            </p>

                            <div className="space-y-3">
                                {form.recipe.length === 0 ? (
                                    <div className="py-12 border-2 border-dashed border-[#3A6131]/10 rounded-[24px] flex flex-col items-center justify-center text-[#3A6131]/30">
                                        <Coffee size={40} strokeWidth={1} className="mb-2" />
                                        <p className="text-sm font-medium">No ingredients mapped yet</p>
                                    </div>
                                ) : (
                                    form.recipe.map((item: any, idx: number) => (
                                        <div key={idx} className="flex gap-3 items-center bg-white rounded-2xl p-3 border border-[#3A6131]/5 shadow-sm">
                                            <select 
                                              className="flex-1 appearance-none bg-[#FFFCEB]/50 border-[#3A6131] rounded-xl pl-3 pr-10 py-2 text-[15px] font-bold text-[#3A6131] bg-[image:url('data:image/svg+xml,%3Csvg%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%20width%3D%2716%27%20height%3D%2716%27%20viewBox%3D%270%200%2024%2024%27%20fill%3D%27none%27%20stroke%3D%27%233A6131%27%20stroke-width%3D%272%27%20stroke-linecap%3D%27round%27%20stroke-linejoin%3D%27round%27%3E%3Cpolyline%20points%3D%276%209%2012%2015%2018%209%27%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[right_10px_center]"
                                                value={item.materialId}
                                                onChange={(e) => {
                                                    const newRecipe = [...form.recipe];
                                                    newRecipe[idx].materialId = e.target.value;
                                                    newRecipe[idx].unit = MOCK_RAW_MATERIALS.find(m => m.id.toString() === e.target.value)?.baseUnit || "";
                                                    set("recipe", newRecipe);
                                                }}
                                            >
                                                <option value="">Select Ingredient</option>
                                                {MOCK_RAW_MATERIALS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                                            </select>
                                            <input 
                                                className="w-20 bg-[#FFFCEB]/50 border-[#3A6131] rounded-xl px-3 py-2 text-[13px] font-black text-[#3A6131] text-center"
                                                type="number" placeholder="0"
                                                value={item.amount}
                                                onChange={(e) => {
                                                    const newRecipe = [...form.recipe];
                                                    newRecipe[idx].amount = e.target.value;
                                                    set("recipe", newRecipe);
                                                }}
                                            />
                                            <span className="text-[12px] font-black text-[#F7B71D] w-8 uppercase">{item.unit || "-"}</span>
                                            <button onClick={() => set("recipe", form.recipe.filter((_: any, i: number) => i !== idx))} className="p-2 text-red-400 hover:text-red-600">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </motion.div>
                    )}

                    {/* STEP 3: PRICING & VISIBILITY */}
                    {step === 3 && (
                        <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                            <div className="mb-8">
                                <span className="bg-[#F7B71D]/15 text-[#385E31] text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">Step 03</span>
                                <h3 className="text-2xl font-black text-[#3A6131] mt-2 font-raleway italic">Pricing & Metrics</h3>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="bg-[#3A6131]/5 p-6 rounded-[24px] border border-[#3A6131]/10">
                                    <label className={labelStyle}>Unit Cost (Internal)</label>
                                    <div className="flex items-center text-2xl font-black text-[#3A6131]">
                                        <span className="mr-2 opacity-30">₱</span>
                                        <input type="number" className="bg-transparent border-none p-0 focus:ring-0 w-full font-black" value={form.unitCost} onChange={(e) => set("unitCost", e.target.value)} />
                                    </div>
                                </div>
                                <div className="bg-[#F7B71D] p-6 rounded-[24px] shadow-lg shadow-[#F7B71D]/20">
                                    <label className={`${labelStyle} text-[#385E31]/60`}>Selling Price (Customer)</label>
                                    <div className="flex items-center text-2xl font-black text-[#385E31]">
                                        <span className="mr-2 opacity-50">₱</span>
                                        <input type="number" className="bg-transparent border-none p-0 focus:ring-0 w-full font-black placeholder:text-[#385E31]/30" value={form.price} onChange={(e) => set("price", e.target.value)} />
                                    </div>
                                </div>
                            </div>

                            <div className="pt-6">
                                <label className={labelStyle}>Availability Settings</label>
                                <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-[#3A6131]/10 mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-[#3A6131]/10 flex items-center justify-center text-[#3A6131]">
                                            <PackageCheck size={20} />
                                        </div>
                                        <span className="text-sm font-bold text-[#3A6131]">Show on Storefront</span>
                                    </div>
                                    <button onClick={() => set("visible", !form.visible)} className={`w-12 h-6 rounded-full transition-all relative ${form.visible ? "bg-[#3A6131]" : "bg-gray-200"}`}>
                                        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${form.visible ? "right-1" : "left-1"}`} />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

            </div>

            {/* Footer Navigation */}
            <div className="px-8 py-5 border-t border-[#3A6131]/10 bg-white/80 flex justify-between items-center">
                <button 
                    onClick={() => step > 1 ? setStep(step - 1) : onClose()}
                    className="text-[#3A6131]/50 text-sm font-bold hover:text-[#3A6131] transition-colors"
                >
                    {step === 1 ? "Cancel" : "Back"}
                </button>
                <button 
                    onClick={() => step < 3 ? setStep(step + 1) : handleSave()}
                    className="bg-[#3A6131] text-[#FFFCEB] px-8 py-3 rounded-2xl text-sm font-bold flex items-center gap-2 hover:opacity-90 transition-opacity"
                >
                    {step === 3 ? "Complete & Save" : "Continue"} <ChevronRight size={16} />
                </button>
            </div>

        </div>
      </motion.div>
    </ModalBackdrop>
  );
}