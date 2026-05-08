"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Minus, Coffee, ShoppingCart } from "lucide-react";
import type { FnbProduct } from "@/components/cards/storefront/fnb-product-card";

interface ProductModalProps {
  product: FnbProduct | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart?: (product: FnbProduct, qty: number) => void;
}

export const ProductModal = ({
  product,
  isOpen,
  onClose,
  onAddToCart,
}: ProductModalProps) => {
  const [qty, setQty] = useState(1);

  if (!product) return null;

  const isAvailable = product.max_yield > 0;
  const maxQty = Math.min(product.max_yield, 99);

  const handleAdd = () => {
    onAddToCart?.(product, qty);
    onClose();
    setQty(1);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div className="bg-[#FFFCEB] rounded-[24px] w-full max-w-[420px] overflow-hidden shadow-2xl pointer-events-auto">
              
              {/* Image area */}
              <div className="w-full h-52 bg-gradient-to-b from-[#385E31]/10 to-[#385E31]/5 flex items-center justify-center relative">
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Coffee size={96} className="text-[#385E31]/20" />
                )}
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 w-9 h-9 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center text-[#385E31] hover:bg-white transition-colors shadow-md"
                >
                  <X size={18} />
                </button>
                {product.category_name && (
                  <span className="absolute bottom-4 left-4 bg-[#385E31] text-[#F7B71D] text-[11px] font-bold px-3 py-1 rounded-full">
                    {product.category_name}
                  </span>
                )}
              </div>

              {/* Content */}
              <div className="p-6 flex flex-col gap-4">
                <div>
                  <h2 className="text-[#385E31] text-[22px] font-black mb-1">
                    {product.name}
                  </h2>
                  <p className="text-[#385E31]/70 text-[14px] leading-relaxed">
                    {product.description ?? "No description available."}
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[#385E31] text-[28px] font-black">
                    ₱{Number(product.price).toFixed(2)}
                  </span>
                  <span
                    className={`text-[12px] font-bold px-3 py-1 rounded-full border ${
                      isAvailable
                        ? "bg-[#FFFCEB] border-[#385E31]/20 text-[#385E31]"
                        : "bg-red-50 border-red-100 text-red-400"
                    }`}
                  >
                    {isAvailable
                      ? `${product.max_yield} servings left`
                      : "Currently Unavailable"}
                  </span>
                </div>

                {/* Qty + Add */}
                {isAvailable && (
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 bg-[#385E31]/5 border border-[#385E31]/10 rounded-[10px] px-2 py-1.5">
                      <button
                        onClick={() => setQty((q) => Math.max(1, q - 1))}
                        className="w-8 h-8 flex items-center justify-center text-[#385E31] hover:bg-[#385E31]/10 rounded-[6px] transition-colors"
                      >
                        <Minus size={16} />
                      </button>
                      <span className="w-8 text-center text-[#385E31] font-bold text-[16px]">
                        {qty}
                      </span>
                      <button
                        onClick={() => setQty((q) => Math.min(maxQty, q + 1))}
                        className="w-8 h-8 flex items-center justify-center text-[#385E31] hover:bg-[#385E31]/10 rounded-[6px] transition-colors"
                      >
                        <Plus size={16} />
                      </button>
                    </div>

                    <button
                      onClick={handleAdd}
                      className="flex-1 bg-[#385E31] text-[#FFFCEB] flex justify-center items-center gap-2 py-3 rounded-[10px] font-bold text-[14px] hover:opacity-90 transition-opacity"
                    >
                      <ShoppingCart size={16} />
                      Add to Cart · ₱{(Number(product.price) * qty).toFixed(2)}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};