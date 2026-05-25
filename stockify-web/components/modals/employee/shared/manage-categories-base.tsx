"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ModalBackdrop from "../ingredients-modals/modals-backdrop";
import { X, Tag, Plus, Trash2, FolderOpen, Loader2, Pencil, Check } from "lucide-react";
import {
  fetchCategories,
  addCategory,
  deleteCategory,
  updateCategoryName,
  type Category,
  type CategoryType,
} from "../../../../lib/employee/categories";
import { type StorefrontConfig } from "../../../../lib/admin/storefront-actions";

// ── Props ─────────────────────────────────────────────────────

interface Props {
  tenantId:    string;
  type:        CategoryType;           // "product" | "ingredient"
  title:       string;                 // e.g. "Product Categories"
  contextLabel: string;                // e.g. "Products" | "Inventory"
  placeholder: string;                 // input placeholder
  onClose:     () => void;
  colors?:     StorefrontConfig | null;
}

// ── Shared modal UI (used by both product and ingredient modals) ─

export default function ManageCategoriesBase({
  tenantId, type, title, contextLabel, placeholder, onClose, colors,
}: Props) {
  const [cats,        setCats]        = useState<Category[]>([]);
  const [newCat,      setNewCat]      = useState("");
  const [loading,     setLoading]     = useState(true);
  const [saving,      setSaving]      = useState(false);
  const [error,       setError]       = useState<string | null>(null);
  const [editingId,   setEditingId]   = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      setLoading(true);
      setCats(await fetchCategories(tenantId, type));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    const trimmed = newCat.trim();
    if (!trimmed) return;
    if (cats.some((c) => c.name.toLowerCase() === trimmed.toLowerCase())) {
      setError("Category already exists.");
      return;
    }
    try {
      setSaving(true);
      setError(null);
      const created = await addCategory(tenantId, trimmed, type);
      setCats((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
      setNewCat("");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (categoryId: string) => {
    try {
      setError(null);
      await deleteCategory(categoryId);
      setCats((prev) => prev.filter((c) => c.category_id !== categoryId));
    } catch {
      setError("Cannot delete: category may be in use by existing items.");
    }
  };

  const handleStartEdit = (cat: Category) => {
    setEditingId(cat.category_id);
    setEditingName(cat.name);
  };

  const handleConfirmEdit = async (categoryId: string) => {
    const trimmed = editingName.trim();
    if (!trimmed) return;
    try {
      setError(null);
      await updateCategoryName(categoryId, trimmed);
      setCats((prev) =>
        prev
          .map((c) => (c.category_id === categoryId ? { ...c, name: trimmed } : c))
          .sort((a, b) => a.name.localeCompare(b.name))
      );
      setEditingId(null);
    } catch (e: any) {
      setError(e.message);
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

  const inputStyle =
    "w-full bg-background border-[1.5px] border-primary/10 rounded-2xl px-4 py-3 text-sm text-primary font-medium focus:outline-none focus:border-accent focus:ring-4 focus:ring-accent/10 transition-all placeholder:text-gray-300";
  const labelStyle =
    "text-[11px] font-black uppercase tracking-[0.12em] text-primary/50 mb-2 block";

  return (
    <ModalBackdrop onClose={onClose}>
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="w-full h-[650px] max-w-[700px] bg-background rounded-[32px] overflow-hidden border-[1.5px] border-accent/20 shadow-[0_32px_80px_rgba(58,97,49,0.2)] flex flex-col md:flex-row font-inter"
        style={modalStyles}
      >
        {/* LEFT SIDEBAR */}
        <div className="w-full md:w-[260px] bg-primary p-10 flex flex-col relative overflow-hidden shrink-0">
          <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-accent/10 rounded-full blur-3xl" />
          <div className="relative z-10 flex flex-col h-full">
            <div className="bg-accent w-12 h-1 rounded-full mb-8" />
            <h2 className="text-[var(--color-sidebar-text,#FFF9D7)] font-raleway text-3xl font-black leading-tight mb-2">
              {title}
            </h2>
            <p className="text-[var(--color-sidebar-text,#FFF9D7)]/60 text-xs font-medium leading-relaxed mb-10">
              Organise your {type.includes("product") ? "products" : "inventory"} by adding or removing categories. Changes apply immediately.
            </p>
            <div className="flex items-center gap-4 mt-2">
              <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center text-primary shadow-lg shadow-accent/20">
                <Tag size={18} strokeWidth={2.5} />
              </div>
              <span className="text-sm font-bold text-[var(--color-sidebar-text,#FFF9D7)]">{contextLabel}</span>
            </div>

            {/* Type badge */}
            <div className="mt-6">
              <div className={`inline-flex px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                type.includes("product")
                  ? "bg-accent/20 text-accent"
                  : "bg-white/10 text-[var(--color-sidebar-text,#FFF9D7)]/60"
              }`}>
                {type.includes("product") ? "Product Categories" : "Ingredient Categories"}
              </div>
            </div>

            <div className="mt-auto pt-10 relative z-10">
              <div className="bg-white/10 rounded-2xl px-4 py-3 flex items-center justify-between">
                <span className="text-[var(--color-sidebar-text,#FFF9D7)]/60 text-xs font-bold uppercase tracking-widest">Total</span>
                <span className="text-accent text-2xl font-black">{cats.length}</span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT CONTENT */}
        <div className="flex-1 flex flex-col relative bg-background/50 backdrop-blur-sm min-h-[420px]">
          <button
            onClick={onClose}
            className="absolute top-6 right-6 w-10 h-10 rounded-full bg-background border border-primary/10 flex items-center justify-center text-primary hover:bg-primary hover:text-[var(--color-sidebar-text,#FFF9D7)] transition-all z-20"
          >
            <X size={20} strokeWidth={2.5} />
          </button>

          <div className="flex-1 overflow-y-auto p-10 [&::-webkit-scrollbar]:w-[3px] [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-primary/15 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-primary/25">
            <div className="mb-8 pr-12">
              <span className="bg-accent/15 text-primary text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
                {contextLabel}
              </span>
              <h3 className="text-2xl font-black text-primary mt-2 font-raleway italic">
                Category List
              </h3>
            </div>

            {error && (
              <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-2xl text-red-600 text-xs font-semibold">
                {error}
              </div>
            )}

            {/* Add new */}
            <div className="mb-6">
              <label className={labelStyle}>New Category</label>
              <div className="flex gap-3">
                <input
                  className={inputStyle}
                  placeholder={placeholder}
                  value={newCat}
                  onChange={(e) => setNewCat(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                  disabled={saving}
                />
                <button
                  onClick={handleAdd}
                  disabled={saving || !newCat.trim()}
                  className="w-12 h-12 shrink-0 rounded-2xl bg-primary text-[var(--color-sidebar-text,#FFF9D7)] flex items-center justify-center shadow-md hover:scale-110 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving
                    ? <Loader2 size={18} className="animate-spin" />
                    : <Plus size={20} strokeWidth={2.8} />
                  }
                </button>
              </div>
            </div>

            {/* List */}
            <div>
              <label className={labelStyle}>Existing Categories</label>
              <div className="space-y-2">
                {loading ? (
                  <div className="py-10 flex items-center justify-center text-primary/40">
                    <Loader2 size={28} className="animate-spin" />
                  </div>
                ) : (
                  <AnimatePresence>
                    {cats.length === 0 ? (
                      <div className="py-10 border-2 border-dashed border-primary/10 rounded-[20px] flex flex-col items-center justify-center text-primary/30">
                        <FolderOpen size={36} strokeWidth={1} className="mb-2" />
                        <p className="text-sm font-medium">No categories yet</p>
                      </div>
                    ) : (
                      cats.map((c) => (
                        <motion.div
                          key={c.category_id}
                          initial={{ opacity: 0, y: -6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          transition={{ duration: 0.18 }}
                          className="flex items-center justify-between bg-white rounded-2xl px-5 py-3 border border-primary/5 shadow-sm group"
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="w-2 h-2 rounded-full bg-accent shrink-0" />
                            {editingId === c.category_id ? (
                              <input
                                autoFocus
                                className="flex-1 bg-transparent border-b border-accent text-sm font-bold text-primary focus:outline-none py-0.5"
                                value={editingName}
                                onChange={(e) => setEditingName(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter")  handleConfirmEdit(c.category_id);
                                  if (e.key === "Escape") setEditingId(null);
                                }}
                              />
                            ) : (
                              <span className="text-sm font-bold text-primary truncate">{c.name}</span>
                            )}
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all ml-2 shrink-0">
                            {editingId === c.category_id ? (
                              <button
                                onClick={() => handleConfirmEdit(c.category_id)}
                                className="p-1.5 rounded-lg text-primary hover:bg-green-50 transition-all"
                              >
                                <Check size={15} />
                              </button>
                            ) : (
                              <button
                                onClick={() => handleStartEdit(c)}
                                className="p-1.5 rounded-lg text-primary/30 hover:text-primary hover:bg-primary/5 transition-all"
                              >
                                <Pencil size={14} />
                              </button>
                            )}
                            <button
                              onClick={() => handleDelete(c.category_id)}
                              className="p-1.5 rounded-lg text-primary/20 hover:text-red-400 hover:bg-red-50 transition-all"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </motion.div>
                      ))
                    )}
                  </AnimatePresence>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-8 py-5 border-t border-primary/10 bg-background/80 flex justify-between items-center">
            <button
              onClick={onClose}
              className="text-primary/50 text-sm font-bold hover:text-primary transition-colors"
            >
              Close
            </button>
            <button
              onClick={onClose}
              className="bg-primary text-[var(--color-sidebar-text,#FFF9D7)] px-8 py-3 rounded-2xl text-sm font-bold hover:opacity-90 transition-opacity"
            >
              Done
            </button>
          </div>
        </div>
      </motion.div>
    </ModalBackdrop>
  );
}