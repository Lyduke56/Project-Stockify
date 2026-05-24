import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ModalBackdrop from "./modals-backdrop";
import { X, Info, ChevronRight, Scale, CalendarDays, Loader2 } from "lucide-react";
import { fetchCategories, type Category, type FnbItem } from "@/lib/employee/inventory";
import { type StorefrontConfig } from "@/lib/admin/storefront-actions";

// ── Fixed unit options ────────────────────────────────────────

const BASE_UNITS = [
  { value: "g",   label: "g — Grams" },
  { value: "kg",  label: "kg — Kilograms" },
  { value: "ml",  label: "ml — Milliliters" },
  { value: "L",   label: "L — Liters" },
  { value: "pcs", label: "pcs — Pieces" },
  { value: "tsp", label: "tsp — Teaspoon" },
  { value: "tbsp",label: "tbsp — Tablespoon" },
  { value: "cup", label: "cup — Cup" },
  { value: "oz",  label: "oz — Ounces" },
  { value: "lb",  label: "lb — Pounds" },
];

const PURCHASE_UNITS = [
  { value: "Bag",     label: "Bag" },
  { value: "Carton",  label: "Carton" },
  { value: "Box",     label: "Box" },
  { value: "Bottle",  label: "Bottle" },
  { value: "Can",     label: "Can" },
  { value: "Tin",     label: "Tin" },
  { value: "Sack",    label: "Sack" },
  { value: "Sleeve",  label: "Sleeve" },
  { value: "Pack",    label: "Pack" },
  { value: "Gallon",  label: "Gallon" },
  { value: "Drum",    label: "Drum" },
  { value: "Pcs",     label: "Pcs (each)" },
];

// ── Props ─────────────────────────────────────────────────────

export interface FnbItemModalProps {
  mode: "add" | "edit";
  tenantId: string;
  initial?: FnbItem;
  onSave: (data: Omit<FnbItem, "item_id" | "tenant_id" | "is_active" | "created_at" | "updated_at" | "category_name">) => Promise<void>;
  onClose: () => void;
  colors?: StorefrontConfig | null;
}

const STEPS = [
  { id: 1, label: "Basic Information", icon: Info },
  { id: 2, label: "Units & Conversion", icon: Scale },
  { id: 3, label: "Stock & Purchasing", icon: CalendarDays },
];

// ── Styles ────────────────────────────────────────────────────

const labelStyle = "text-[11px] font-black uppercase tracking-[0.12em] text-primary/50 mb-2 block";
const inputStyle = "w-full bg-background border-[1.5px] border-primary/10 rounded-2xl px-4 py-3 text-sm text-primary font-medium focus:outline-none focus:border-accent focus:ring-4 focus:ring-accent/10 transition-all placeholder:text-gray-300";
const selectStyle = `${inputStyle} appearance-none pr-10 bg-[image:url("data:image/svg+xml,%3Csvg%20xmlns%3D'http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg'%20width%3D'16'%20height%3D'16'%20viewBox%3D'0%200%2024%2024'%20fill%3D'none'%20stroke%3D'%233A6131'%20stroke-width%3D'2'%20stroke-linecap%3D'round'%20stroke-linejoin%3D'round'%3E%3Cpolyline%20points%3D'6%209%2012%2015%2018%209'%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E")] bg-no-repeat bg-[right_14px_center]`;

// ── Component ─────────────────────────────────────────────────

export default function FnbItemModal({ mode, tenantId, initial, onSave, onClose, colors }: FnbItemModalProps) {
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCats, setLoadingCats] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    name:           initial?.name           ?? "",
    sku:            initial?.sku            ?? "",
    category_id:    initial?.category_id    ?? "",
    stock:          initial ? String(Number(initial.stock) / Number(initial.conversion || 1)) : "",
    base_unit:      initial?.base_unit      ?? "g",
    alert_limit:    String(initial?.alert_limit ?? ""),
    purchase_unit:  initial?.purchase_unit  ?? "Bag",
    conversion:     String(initial?.conversion ?? ""),
    unit_cost:      String(initial?.unit_cost  ?? ""),
    nearest_expiry: initial?.nearest_expiry ?? "",
  });

  const set = (key: string, val: string) => setForm((f) => ({ ...f, [key]: val }));

  useEffect(() => {
    fetchCategories(tenantId, "fnb_ingredient")
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
      setError("Material name and SKU are required.");
      return;
    }
    if (!form.conversion || Number(form.conversion) <= 0) {
      setError("Conversion factor must be greater than 0.");
      setStep(2);
      return;
    }
    if (!form.unit_cost || Number(form.unit_cost) <= 0) {
      setError("Cost per " + form.purchase_unit + " is required.");
      setStep(3);
      return;
    }

    try {
      setSaving(true);
      setError(null);
      await onSave({
        category_id:    form.category_id || null,
        name:           form.name.trim(),
        sku:            form.sku.trim().toUpperCase(),
        stock:          (Number(form.stock) || 0) * (Number(form.conversion) || 1),
        base_unit:      form.base_unit,
        alert_limit:    Number(form.alert_limit)  || 0,
        purchase_unit:  form.purchase_unit,
        conversion:     Number(form.conversion)   || 1,
        unit_cost:      Number(form.unit_cost)    || 0,
        nearest_expiry: form.nearest_expiry       || null,
      });
    } catch (e: any) {
      if (e.message?.includes("uq_fnb_sku_per_tenant") || e.code === "23505") {
        setError(`SKU "${form.sku.trim().toUpperCase()}" already exists. Please use a unique SKU.`);
        setStep(1);
      } else {
        setError(e.message);
      }
      setSaving(false);
    }
  };

  const modalStyles = {
    "--color-primary": colors?.color_primary ?? "#385E31",
    "--color-secondary": colors?.color_secondary ?? "#2A4725",
    "--color-accent": colors?.color_accent ?? "#F7B71D",
    "--color-background": colors?.color_background ?? "#FFFCEB",
    "--color-text": colors?.color_text ?? "#3A6131",
    "--color-sidebar-text": colors?.color_sidebar_text ?? "#FFF9D7",
  } as React.CSSProperties;

  return (
    <ModalBackdrop onClose={onClose}>
      <motion.div
        style={modalStyles}
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="w-full max-w-[920px] bg-background rounded-[32px] overflow-hidden border-[1.5px] border-accent/20 shadow-[0_32px_80px_rgba(58,97,49,0.2)] flex flex-col md:flex-row h-[650px] font-inter"
      >
        {/* LEFT SIDEBAR */}
        <div className="w-full md:w-[320px] bg-primary p-10 flex flex-col relative overflow-hidden shrink-0">
          <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-accent/10 rounded-full blur-3xl" />
          <div className="relative z-10">
            <div className="bg-accent w-12 h-1 rounded-full mb-8" />
            <h2 className="text-[var(--color-sidebar-text,#FFF9D7)] font-raleway text-3xl font-black leading-tight mb-2">
              {mode === "add" ? "Add Material" : "Edit Details"}
            </h2>
            <p className="text-[var(--color-sidebar-text,#FFF9D7)]/60 text-xs font-medium leading-relaxed mb-12">
              Fill in the information to track your F&B stock accurately and automate inventory deductions.
            </p>
            <nav className="flex flex-col gap-8">
              {STEPS.map((s) => (
                <div key={s.id} className={`flex items-center gap-4 transition-all duration-300 ${step === s.id ? "translate-x-2" : "opacity-40"}`}>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${step === s.id ? "bg-accent text-primary shadow-lg shadow-accent/20" : "bg-white/10 text-white"}`}>
                    <s.icon size={18} strokeWidth={2.5} />
                  </div>
                  <span className={`text-sm font-bold tracking-wide ${step === s.id ? "text-[var(--color-sidebar-text,#FFF9D7)]" : "text-white"}`}>{s.label}</span>
                </div>
              ))}
            </nav>
          </div>
          <div className="mt-auto relative z-10">
            <div className="flex gap-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className={`h-1.5 rounded-full transition-all duration-500 ${step === i ? "w-8 bg-accent" : "w-2 bg-white/20"}`} />
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT CONTENT */}
        <div className="flex-1 flex flex-col relative bg-background/50 backdrop-blur-sm">
          <button onClick={onClose} className="absolute top-6 right-6 w-10 h-10 rounded-full bg-background border border-primary/10 flex items-center justify-center text-primary hover:bg-primary hover:text-[var(--color-sidebar-text,#FFF9D7)] transition-all z-20">
            <X size={20} strokeWidth={2.5} />
          </button>

          <div className="flex-1 overflow-y-auto p-10 [&::-webkit-scrollbar]:w-[5px] [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-primary/15 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-primary/25">

            {error && (
              <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-2xl text-red-600 text-xs font-semibold">
                {error}
              </div>
            )}

            <AnimatePresence mode="wait">

              {/* ── STEP 1: BASIC INFO ── */}
              {step === 1 && (
                <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                  <div className="mb-8">
                    <span className="bg-accent/15 text-primary text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">Step 01</span>
                    <h3 className="text-2xl font-black text-primary mt-2 font-raleway italic">Basic Information</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className={labelStyle}>Material Name</label>
                      <input className={inputStyle} value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Whole Milk" />
                    </div>
                    <div>
                      <label className={labelStyle}>SKU Code</label>
                      <input
                        className={inputStyle}
                        value={form.sku}
                        onChange={(e) => set("sku", e.target.value)}
                        placeholder="RAW-MLK-01"
                      />
                      <p className="text-[10px] text-primary/40 mt-1 pl-1">Must be unique per tenant.</p>
                    </div>
                    <div>
                      <label className={labelStyle}>Category</label>
                      {loadingCats ? (
                        <div className="flex items-center gap-2 text-primary/50 text-sm py-3">
                          <Loader2 size={16} className="animate-spin" /> Loading…
                        </div>
                      ) : (
                        <select className={selectStyle} value={form.category_id} onChange={(e) => set("category_id", e.target.value)}>
                          <option value="">— No Category —</option>
                          {categories.map((c) => (
                            <option key={c.category_id} value={c.category_id}>{c.name}</option>
                          ))}
                        </select>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ── STEP 2: UNITS & CONVERSION ── */}
              {step === 2 && (
                <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                  <div className="mb-6">
                    <span className="bg-accent/15 text-primary text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">Step 02</span>
                    <h3 className="text-2xl font-black text-primary mt-2 font-raleway italic">Units & Conversion</h3>
                    <p className="text-[11px] text-primary/50 leading-relaxed mt-2">
                      Define how you buy this item vs. how you use it in recipes. This powers automatic stock deduction.
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {/* ✅ Purchasing unit — dropdown */}
                    <div>
                      <label className={labelStyle}>Purchasing Unit</label>
                      <select className={selectStyle} value={form.purchase_unit} onChange={(e) => set("purchase_unit", e.target.value)}>
                        {PURCHASE_UNITS.map((u) => (
                          <option key={u.value} value={u.value}>{u.label}</option>
                        ))}
                      </select>
                    </div>

                    {/* ✅ Base / recipe unit — dropdown */}
                    <div>
                      <label className={labelStyle}>Base / Recipe Unit</label>
                      <select className={selectStyle} value={form.base_unit} onChange={(e) => set("base_unit", e.target.value)}>
                        {BASE_UNITS.map((u) => (
                          <option key={u.value} value={u.value}>{u.label}</option>
                        ))}
                      </select>
                    </div>

                    <div className="col-span-2">
                      <label className={labelStyle}>Conversion Factor</label>
                      <input
                        type="number"
                        className={inputStyle}
                        value={form.conversion}
                        onChange={(e) => set("conversion", e.target.value)}
                        placeholder="e.g. 1000"
                        min="1"
                      />
                      <p className="text-[10px] text-primary/40 mt-1 pl-1">
                        How many {form.base_unit || "base units"} are in 1 {form.purchase_unit || "purchase unit"}?
                      </p>
                    </div>
                  </div>

                  {/* Conversion preview */}
                  {form.conversion && Number(form.conversion) > 0 && (
                    <div className="mt-4 p-4 rounded-2xl bg-primary/5 border border-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                      1 <span className="text-accent mx-1">{form.purchase_unit}</span>
                      =
                      <span className="text-accent mx-1">{form.conversion}</span>
                      {form.base_unit}
                    </div>
                  )}
                </motion.div>
              )}

              {/* ── STEP 3: STOCK & PURCHASING ── */}
              {step === 3 && (
                <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                  <div className="mb-8">
                    <span className="bg-accent/15 text-primary text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">Step 03</span>
                    <h3 className="text-2xl font-black text-primary mt-2 font-raleway italic">Stock & Purchasing</h3>
                  </div>
                  {/* ── Dynamic Metrics Cards ── */}
                  <div className="flex gap-4">
                    <div className="flex-1 bg-background p-6 rounded-[24px] border border-primary/20 shadow-sm transition-all hover:border-primary/40">
                      <label className={labelStyle}>Current Stock <span className="lowercase normal-case font-medium">({form.purchase_unit})</span></label>
                      <div className="flex items-center text-2xl font-black text-primary">
                        <input
                          type="number"
                          className="bg-transparent border-none p-0 focus:ring-0 w-full font-black text-3xl"
                          value={form.stock}
                          onChange={(e) => set("stock", e.target.value)}
                          placeholder="0"
                          min="0"
                        />
                      </div>
                      <p className="text-[10px] text-primary/60 mt-2 font-bold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                        = {(Number(form.stock) || 0) * (Number(form.conversion) || 1)} {form.base_unit} (Base Units)
                      </p>
                    </div>

                    <div className="flex-1 bg-primary/5 p-6 rounded-[24px] border border-primary/15 transition-all hover:bg-primary/10">
                      <label className={labelStyle}>Cost per {form.purchase_unit} <span className="text-red-500">*</span></label>
                      <div className="flex items-center text-3xl font-black text-primary">
                        <span className="mr-2 opacity-30 text-xl">₱</span>
                        <input
                          type="number"
                          className="bg-transparent border-none p-0 focus:ring-0 w-full font-black"
                          value={form.unit_cost}
                          onChange={(e) => set("unit_cost", e.target.value)}
                          placeholder="0.00"
                          min="0"
                        />
                      </div>
                      <p className="text-[10px] text-primary/40 mt-2 font-bold">Standard purchase price</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6 mt-2">
                    <div className="bg-background/50 p-6 rounded-[24px] border border-primary/10">
                      <label className={labelStyle}>
                        Low Stock Alert <span className="lowercase normal-case font-medium">({form.base_unit})</span>
                      </label>
                      <input
                        type="number"
                        className="bg-transparent border-b border-primary/10 w-full py-2 text-lg font-bold text-primary focus:outline-none focus:border-accent"
                        value={form.alert_limit}
                        onChange={(e) => set("alert_limit", e.target.value)}
                        placeholder="0"
                        min="0"
                      />
                    </div>
                    
                    <div className="bg-background p-6 rounded-[24px] border-[1.5px] border-accent/50 shadow-sm">
                      <label className={labelStyle}>Nearest Expiry Date</label>
                      <div className="flex items-center text-primary mt-1">
                        <input
                          type="date"
                          className="bg-transparent border-none p-0 focus:ring-0 w-full font-bold text-lg text-primary"
                          value={form.nearest_expiry}
                          onChange={(e) => set("nearest_expiry", e.target.value)}
                        />
                      </div>
                      <p className="text-[10px] text-primary/40 mt-2">Leave blank if non-perishable.</p>
                    </div>
                  </div>
                </motion.div>
              )}

            </AnimatePresence>
          </div>

          {/* Footer */}
          <div className="px-8 py-5 border-t border-primary/10 bg-background/80 flex justify-between items-center z-20">
            <button
              onClick={() => step > 1 ? setStep(step - 1) : onClose()}
              className="text-primary/50 text-sm font-bold hover:text-primary transition-colors"
            >
              {step === 1 ? "Cancel" : "Back"}
            </button>
            <button
              onClick={() => step < 3 ? setStep(step + 1) : handleSave()}
              disabled={saving}
              className="bg-primary text-[var(--color-sidebar-text,#FFF9D7)] px-8 py-3 rounded-2xl text-sm font-bold flex items-center gap-2 hover:opacity-90 transition-opacity shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {saving
                ? <><Loader2 size={16} className="animate-spin" /> Saving…</>
                : <>{step === 3 ? "Complete & Save" : "Continue"} <ChevronRight size={16} /></>
              }
            </button>
          </div>
        </div>
      </motion.div>
    </ModalBackdrop>
  );
}