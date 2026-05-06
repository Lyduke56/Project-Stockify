"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ModalBackdrop from "./modals-backdrop"; 
import { 
  X, 
  Info, 
  ChevronRight, 
  Scale,
  CalendarDays,
  Coins
} from "lucide-react";

// The categories for raw materials
const MATERIAL_CATEGORIES = ["Coffee", "Dairy", "Syrup", "Packaging", "Condiments", "Cleaning"];

export interface MaterialModalProps {
  mode: "add" | "edit";
  initial?: any;
  onSave: (data: any) => void;
  onClose: () => void;
}

export default function MaterialModal({ mode, initial, onSave, onClose }: MaterialModalProps) {
  const [step, setStep] = useState(1);
  
  // Initialize form with string values for controlled inputs, parsing the initial data if in "edit" mode
  const [form, setForm] = useState(
    initial ? { 
        ...initial, 
        stock: String(initial.stock), 
        alertLimit: String(initial.alertLimit), 
        conversion: String(initial.conversion), 
        unitCost: String(initial.unitCost) 
      } 
    : {
        name: "",
        sku: "",
        category: "Coffee",
        stock: "",
        baseUnit: "g",
        alertLimit: "",
        purchaseUnit: "Bag",
        conversion: "",
        unitCost: "",
        nearestExpiry: "",
      }
  );

  const set = (key: string, val: any) => setForm((f: any) => ({ ...f, [key]: val }));

  // Preserved exactly from your UI reference
  const labelStyle = "text-[11px] font-black uppercase tracking-[0.12em] text-[#3A6131]/50 mb-2 block";
  const inputStyle = "w-full bg-white border-[1.5px] border-[#3A6131]/10 rounded-2xl px-4 py-3 text-sm text-[#3A6131] font-medium focus:outline-none focus:border-[#F7B71D] focus:ring-4 focus:ring-[#F7B71D]/10 transition-all placeholder:text-gray-300";
  const selectStyle = `${inputStyle} appearance-none pr-10 bg-[image:url("data:image/svg+xml,%3Csvg%20xmlns%3D'http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg'%20width%3D'16'%20height%3D'16'%20viewBox%3D'0%200%2024%2024'%20fill%3D'none'%20stroke%3D'%233A6131'%20stroke-width%3D'2'%20stroke-linecap%3D'round'%20stroke-linejoin%3D'round'%3E%3Cpolyline%20points%3D'6%209%2012%2015%2018%209'%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E")] bg-no-repeat bg-[right_14px_center]`;

  const handleSave = () => {
    if (!form.name || !form.sku) return;
    
    // Cast number fields back to integers/floats before saving
    onSave({
      name: form.name,
      sku: form.sku,
      category: form.category,
      baseUnit: form.baseUnit,
      purchaseUnit: form.purchaseUnit,
      nearestExpiry: form.nearestExpiry || "N/A",
      stock: Number(form.stock) || 0,
      alertLimit: Number(form.alertLimit) || 0,
      conversion: Number(form.conversion) || 1,
      unitCost: Number(form.unitCost) || 0,
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
                    {mode === "add" ? "Add Material" : "Edit Details"}
                </h2>
                <p className="text-[#FFFCEB]/60 text-xs font-medium leading-relaxed mb-12">
                    Fill in the necessary information to track your stock accurately and automate inventory deductions.
                </p>

                <nav className="flex flex-col gap-8">
                    {[
                        { id: 1, label: "Basic Information", icon: Info },
                        { id: 2, label: "Units & Conversion", icon: Scale },
                        { id: 3, label: "Stock & Purchasing", icon: CalendarDays },
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
                    
                    {/* STEP 1: BASIC INFORMATION */}
                    {step === 1 && (
                        <motion.div 
                            key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                            className="space-y-6"
                        >
                            <div className="mb-8">
                                <span className="bg-[#F7B71D]/15 text-[#385E31] text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">Step 01</span>
                                <h3 className="text-2xl font-black text-[#3A6131] mt-2 font-raleway italic">Basic Information</h3>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className={labelStyle}>Material Name</label>
                                    <input className={inputStyle} value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Whole Milk" />
                                </div>
                                
                                <div className="col-span-1">
                                    <label className={labelStyle}>SKU Code</label>
                                    <input className={inputStyle} value={form.sku} onChange={(e) => set("sku", e.target.value)} placeholder="RAW-MLK-01" />
                                </div>
                                
                                <div className="col-span-1">
                                    <label className={labelStyle}>Category</label>
                                    <select className={selectStyle} value={form.category} onChange={(e) => set("category", e.target.value)}>
                                        {MATERIAL_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* STEP 2: UNITS & CONVERSION */}
                    {step === 2 && (
                        <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                            
                            <div className="mb-6">
                                <span className="bg-[#F7B71D]/15 text-[#385E31] text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">Step 02</span>
                                <h3 className="text-2xl font-black text-[#3A6131] mt-2 font-raleway italic">Units & Conversion</h3>
                                <p className="text-[11px] text-[#3A6131]/50 leading-relaxed mt-2">
                                    Define how you buy this item versus how you use it in recipes. This ensures the system deducts the correct amounts automatically.
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className={labelStyle}>Purchasing Unit</label>
                                    <input className={inputStyle} value={form.purchaseUnit} onChange={(e) => set("purchaseUnit", e.target.value)} placeholder="e.g. Bag, Carton, Sleeve" />
                                </div>
                                <div>
                                    <label className={labelStyle}>Base / Recipe Unit</label>
                                    <input className={inputStyle} value={form.baseUnit} onChange={(e) => set("baseUnit", e.target.value)} placeholder="e.g. g, ml, pcs" />
                                </div>
                                <div className="col-span-2">
                                    <label className={labelStyle}>Conversion Factor</label>
                                    <input type="number" className={inputStyle} value={form.conversion} onChange={(e) => set("conversion", e.target.value)} placeholder="e.g. 1000" />
                                </div>
                            </div>

                            {/* Conversion Visualizer */}
                            {(form.purchaseUnit || form.baseUnit || form.conversion) && (
                                <div className="mt-4 p-4 rounded-2xl bg-[#3A6131]/5 border border-[#3A6131]/10 flex items-center justify-center text-sm font-bold text-[#3A6131]">
                                    1 <span className="text-[#F7B71D] mx-1 uppercase">{form.purchaseUnit || "Unit"}</span> 
                                    = 
                                    <span className="text-[#F7B71D] mx-1">{form.conversion || "0"}</span> {form.baseUnit || "Base"}
                                </div>
                            )}

                        </motion.div>
                    )}

                    {/* STEP 3: STOCK & PURCHASING */}
                    {step === 3 && (
                        <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                            <div className="mb-8">
                                <span className="bg-[#F7B71D]/15 text-[#385E31] text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">Step 03</span>
                                <h3 className="text-2xl font-black text-[#3A6131] mt-2 font-raleway italic">Stock & Purchasing</h3>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="col-span-1">
                                    <label className={labelStyle}>Current Stock <span className="lowercase normal-case font-medium">({form.baseUnit || "base units"})</span></label>
                                    <input type="number" className={inputStyle} value={form.stock} onChange={(e) => set("stock", e.target.value)} placeholder="0" />
                                </div>

                                <div className="col-span-1">
                                    <label className={labelStyle}>Low Stock Alert Limit</label>
                                    <input type="number" className={inputStyle} value={form.alertLimit} onChange={(e) => set("alertLimit", e.target.value)} placeholder="0" />
                                </div>

                                <div className="bg-[#3A6131]/5 p-6 rounded-[24px] border border-[#3A6131]/10 col-span-1">
                                    <label className={labelStyle}>Cost per {form.purchaseUnit || "Unit"}</label>
                                    <div className="flex items-center text-2xl font-black text-[#3A6131]">
                                        <span className="mr-2 opacity-30">₱</span>
                                        <input type="number" className="bg-transparent border-none p-0 focus:ring-0 w-full font-black" value={form.unitCost} onChange={(e) => set("unitCost", e.target.value)} placeholder="0.00" />
                                    </div>
                                </div>

                                <div className="bg-[#FFFCEB] p-6 rounded-[24px] border-[1.5px] border-[#F7B71D]/50 shadow-sm col-span-1">
                                    <label className={labelStyle}>Nearest Expiry Date</label>
                                    <div className="flex items-center text-[#3A6131] mt-2">
                                        <input 
                                            type="date" 
                                            className="bg-transparent border-none p-0 focus:ring-0 w-full font-bold text-lg text-[#385E31]" 
                                            value={form.nearestExpiry} 
                                            onChange={(e) => set("nearestExpiry", e.target.value)} 
                                        />
                                    </div>
                                </div>
                            </div>

                        </motion.div>
                    )}
                </AnimatePresence>

            </div>

            {/* Footer Navigation */}
            <div className="px-8 py-5 border-t border-[#3A6131]/10 bg-white/80 flex justify-between items-center z-20">
                <button 
                    onClick={() => step > 1 ? setStep(step - 1) : onClose()}
                    className="text-[#3A6131]/50 text-sm font-bold hover:text-[#3A6131] transition-colors"
                >
                    {step === 1 ? "Cancel" : "Back"}
                </button>
                <button 
                    onClick={() => step < 3 ? setStep(step + 1) : handleSave()}
                    className="bg-[#3A6131] text-[#FFFCEB] px-8 py-3 rounded-2xl text-sm font-bold flex items-center gap-2 hover:opacity-90 transition-opacity shadow-md"
                >
                    {step === 3 ? "Complete & Save" : "Continue"} <ChevronRight size={16} />
                </button>
            </div>

        </div>
      </motion.div>
    </ModalBackdrop>
  );
}