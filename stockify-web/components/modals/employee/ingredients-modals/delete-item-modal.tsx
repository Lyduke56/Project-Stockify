"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import ModalBackdrop from "./modals-backdrop";
import { Trash2, Loader2, AlertTriangle } from "lucide-react";

interface DeleteModalProps {
  itemName: string;
  onConfirm: () => Promise<void>;
  onClose: () => void;
}

export default function DeleteItemModal({ itemName, onConfirm, onClose }: DeleteModalProps) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    try {
      setDeleting(true);
      setError(null);
      await onConfirm();
    } catch (e: any) {
      setError(e.message);
      setDeleting(false);
    }
  };

  return (
    <ModalBackdrop onClose={onClose}>
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-[440px] bg-[#FFFCEB] rounded-[28px] overflow-hidden border-[1.5px] border-red-200 shadow-[0_32px_80px_rgba(58,97,49,0.2)] font-inter"
      >
        <div className="p-8">
          {/* Icon */}
          <div className="w-14 h-14 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center mb-6">
            <AlertTriangle size={26} className="text-red-500" strokeWidth={2} />
          </div>

          <h2 className="text-xl font-black text-[#3A6131] mb-2">Delete Item?</h2>
          <p className="text-sm text-[#3A6131]/60 font-medium leading-relaxed mb-6">
            You are about to delete{" "}
            <span className="font-bold text-[#3A6131]">"{itemName}"</span>. 
            This item will be marked as inactive and removed from your inventory view. This action can be reversed by an admin.
          </p>

          {error && (
            <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-xs font-semibold">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={deleting}
              className="flex-1 py-3 rounded-2xl border border-[#3A6131]/20 text-[#3A6131] text-sm font-bold hover:bg-[#3A6131]/5 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex-1 py-3 rounded-2xl bg-red-500 text-white text-sm font-bold flex items-center justify-center gap-2 hover:bg-red-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {deleting ? (
                <><Loader2 size={16} className="animate-spin" /> Deleting...</>
              ) : (
                <><Trash2 size={16} /> Delete Item</>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </ModalBackdrop>
  );
}