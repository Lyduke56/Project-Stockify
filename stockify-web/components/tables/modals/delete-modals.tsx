"use client";

import ModalBackdrop from "./modals-bakcdrop";
import { Product } from "@/types/product";

interface DeleteModalProps {
  product: Product;
  onConfirm: () => void;
  onClose: () => void;
}

export default function DeleteModal({ product, onConfirm, onClose }: DeleteModalProps) {
  return (
    <ModalBackdrop onClose={onClose}>
      <div className="bg-[#FFFCEB] rounded-2xl shadow-2xl w-[400px] border border-[#E2D88A] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E2D88A]">
          <h2 className="text-red-600 font-extrabold text-lg uppercase tracking-wide">Delete Product</h2>
          <button onClick={onClose} className="text-[#385E31] hover:text-red-500 transition-colors">
            <img src="/icons/x.png" alt="close" className="w-5 h-5" />
          </button>
        </div>
        <div className="px-6 py-6 text-center">
          <img src="/icons-action/Delete.svg" alt="delete" className="w-10 h-10 mx-auto mb-3" />
          <p className="text-[#385E31] font-semibold text-sm">
            Are you sure you want to delete{" "}
            <span className="font-extrabold">"{product.name}"</span>?
          </p>
          <p className="text-gray-400 text-xs mt-1">This action cannot be undone.</p>
        </div>
        <div className="flex justify-center gap-3 px-6 py-4 border-t border-[#E2D88A]">
          <button onClick={onClose} className="px-5 py-2 rounded-full border border-[#385E31] text-[#385E31] text-sm font-semibold hover:bg-[#385E31] hover:text-white transition-colors">
            Cancel
          </button>
          <button onClick={onConfirm} className="px-5 py-2 rounded-full bg-red-500 text-white text-sm font-bold hover:bg-red-600 transition-colors shadow">
            Delete
          </button>
        </div>
      </div>
    </ModalBackdrop>
  );
}