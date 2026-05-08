"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ModalBackdrop from "./modals-backdrop";
import { X, Tag, Plus, Trash2, FolderOpen, Loader2, Pencil, Check } from "lucide-react";
import {
  fetchCategories,
  addCategory,
  deleteCategory,
  updateCategoryName,
  type Category,
} from "@/lib/employee/inventory";

interface Props {
  tenantId: string;
  onClose: () => void;
}

export default function ManageMaterialCategoriesModal({ tenantId, onClose }: Props) {
  const [cats, setCats] = useState<Category[]>([]);
  const [newCat, setNewCat] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Inline edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const data = await fetchCategories(tenantId);
      setCats(data);
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
      const created = await addCategory(tenantId, trimmed);
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
    } catch (e: any) {
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
        prev.map((c) => (c.category_id === categoryId ? { ...c, name: trimmed } : c))
        .sort((a, b) => a.name.localeCompare(b.name))
      );
      setEditingId(null);
    } catch (e: any) {
      setError(e.message);
    }
  };

  const inputStyle =
    "w-full bg-white border-[1.5px] border-[#3A6131]/10 rounded-2xl px-4 py-3 text-sm text-[#3A6131] font-medium focus:outline-none focus:border-[#F7B71D] focus:ring-4 focus:ring-[#F7B71D]/10 transition-all placeholder:text-gray-300";
  const labelStyle =
    "text-[11px] font-black uppercase tracking-[0.12em] text-[#3A6131]/50 mb-2 block";

  return (
    <ModalBackdrop onClose={onClose}>
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="w-full h-[650px] max-w-[700px] bg-[#FFFCEB] rounded-[32px] overflow-hidden border-[1.5px] border-[#F7B71D]/20 shadow-[0_32px_80px_rgba(58,97,49,0.2)] flex flex-col md:flex-row font-inter"
      >
        {/* ── LEFT SIDEBAR ── */}
        <div className="w-full md:w-[260px] bg-[#3A6131] p-10 flex flex-col relative overflow-hidden shrink-0">
          <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-[#F7B71D]/10 rounded-full blur-3xl" />
          <div className="relative z-10 flex flex-col h-full">
            <div className="bg-[#F7B71D] w-12 h-1 rounded-full mb-8" />
            <h2 className="text-[#FFFCEB] font-raleway text-3xl font-black leading-tight mb-2">
              Manage Categories
            </h2>
            <p className="text-[#FFFCEB]/60 text-xs font-medium leading-relaxed mb-10">
              Organise your stock by adding or removing material categories. Changes apply across your entire inventory system.
            </p>
            <div className="flex items-center gap-4 mt-2">
              <div className="w-10 h-10 rounded-xl bg-[#F7B71D] flex items-center justify-center text-[#385E31] shadow-lg shadow-[#F7B71D]/20">
                <Tag size={18} strokeWidth={2.5} />
              </div>
              <span className="text-sm font-bold text-[#FFFCEB]">Categories</span>
            </div>
            <div className="mt-auto pt-10 relative z-10">
              <div className="bg-white/10 rounded-2xl px-4 py-3 flex items-center justify-between">
                <span className="text-[#FFFCEB]/60 text-xs font-bold uppercase tracking-widest">Total</span>
                <span className="text-[#F7B71D] text-2xl font-black">{cats.length}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT CONTENT ── */}
        <div className="flex-1 flex flex-col relative bg-white/50 backdrop-blur-sm min-h-[420px]">
          <button
            onClick={onClose}
            className="absolute top-6 right-6 w-10 h-10 rounded-full bg-[#FFFCEB] border border-[#3A6131]/10 flex items-center justify-center text-[#3A6131] hover:bg-[#3A6131] hover:text-[#FFFCEB] transition-all z-20"
          >
            <X size={20} strokeWidth={2.5} />
          </button>

          <div className="flex-1 overflow-y-auto p-10 [&::-webkit-scrollbar]:w-[3px] [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[#3A6131]/15 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-[#3A6131]/25">
            <div className="mb-8 pr-12">
              <span className="bg-[#F7B71D]/15 text-[#385E31] text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
                Inventory
              </span>
              <h3 className="text-2xl font-black text-[#3A6131] mt-2 font-raleway italic">
                Category List
              </h3>
            </div>

            {/* Error banner */}
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
                  placeholder="e.g. Cleaning Supplies"
                  value={newCat}
                  onChange={(e) => setNewCat(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                  disabled={saving}
                />
                <button
                  onClick={handleAdd}
                  disabled={saving || !newCat.trim()}
                  className="w-12 h-12 shrink-0 rounded-2xl bg-[#3A6131] text-[#FFFCEB] flex items-center justify-center shadow-md hover:scale-110 hover:shadow-[#3A6131]/30 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? <Loader2 size={18} className="animate-spin" /> : <Plus size={20} strokeWidth={2.8} />}
                </button>
              </div>
            </div>

            {/* Category list */}
            <div>
              <label className={labelStyle}>Existing Categories</label>
              <div className="space-y-2">
                {loading ? (
                  <div className="py-10 flex items-center justify-center text-[#3A6131]/40">
                    <Loader2 size={28} className="animate-spin" />
                  </div>
                ) : (
                  <AnimatePresence>
                    {cats.length === 0 ? (
                      <div className="py-10 border-2 border-dashed border-[#3A6131]/10 rounded-[20px] flex flex-col items-center justify-center text-[#3A6131]/30">
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
                          className="flex items-center justify-between bg-white rounded-2xl px-5 py-3 border border-[#3A6131]/5 shadow-sm group"
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="w-2 h-2 rounded-full bg-[#F7B71D] shrink-0" />
                            {editingId === c.category_id ? (
                              <input
                                autoFocus
                                className="flex-1 bg-transparent border-b border-[#F7B71D] text-sm font-bold text-[#3A6131] focus:outline-none py-0.5"
                                value={editingName}
                                onChange={(e) => setEditingName(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") handleConfirmEdit(c.category_id);
                                  if (e.key === "Escape") setEditingId(null);
                                }}
                              />
                            ) : (
                              <span className="text-sm font-bold text-[#3A6131] truncate">{c.name}</span>
                            )}
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all ml-2 shrink-0">
                            {editingId === c.category_id ? (
                              <button
                                onClick={() => handleConfirmEdit(c.category_id)}
                                className="p-1.5 rounded-lg text-[#3A6131] hover:bg-green-50 transition-all"
                              >
                                <Check size={15} />
                              </button>
                            ) : (
                              <button
                                onClick={() => handleStartEdit(c)}
                                className="p-1.5 rounded-lg text-[#3A6131]/30 hover:text-[#3A6131] hover:bg-[#3A6131]/5 transition-all"
                              >
                                <Pencil size={14} />
                              </button>
                            )}
                            <button
                              onClick={() => handleDelete(c.category_id)}
                              className="p-1.5 rounded-lg text-[#3A6131]/20 hover:text-red-400 hover:bg-red-50 transition-all"
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
          <div className="px-8 py-5 border-t border-[#3A6131]/10 bg-white/80 flex justify-between items-center">
            <button
              onClick={onClose}
              className="text-[#3A6131]/50 text-sm font-bold hover:text-[#3A6131] transition-colors"
            >
              Close
            </button>
            <button
              onClick={onClose}
              className="bg-[#3A6131] text-[#FFFCEB] px-8 py-3 rounded-2xl text-sm font-bold flex items-center gap-2 hover:opacity-90 transition-opacity"
            >
              Done
            </button>
          </div>
        </div>
      </motion.div>
    </ModalBackdrop>
  );
}