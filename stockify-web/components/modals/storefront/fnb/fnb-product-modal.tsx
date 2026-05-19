"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Minus, Coffee, ShoppingCart, Check, ChevronRight } from "lucide-react";
import type { FnbProduct, FnbProductSize } from "@/components/cards/storefront/fnb-product-card";
import { useCart } from "@/lib/customer/cart-context";
import { ProductReviews } from "../nfnb/product-reviews";

interface ProductModalProps {
  product: FnbProduct | null;
  isOpen: boolean;
  onClose: () => void;
  tenantId: string;
}

export const ProductModal = ({ product, isOpen, onClose, tenantId }: ProductModalProps) => {
  const { addToCart } = useCart();
  const [qty, setQty]               = useState(1);
  const [added, setAdded]           = useState(false);
  const [selectedSize, setSelectedSize] = useState<FnbProductSize | null>(null);

  // Reset when product changes / modal opens
  useEffect(() => {
    if (!product) return;
    setQty(1);
    setAdded(false);
    if (product.sizes.length > 0) {
      const def = product.sizes.find((s) => s.is_default) ?? product.sizes[0];
      setSelectedSize(def);
    } else {
      setSelectedSize(null);
    }
  }, [product, isOpen]);

  if (!product) return null;

  const hasSizes = product.sizes.length > 0;

  // Availability & max qty depend on whether a size is selected
  const isAvailable = hasSizes
    ? (selectedSize ? selectedSize.max_yield > 0 : product.sizes.some((s) => s.max_yield > 0))
    : product.max_yield > 0;

  const maxQty = hasSizes
    ? (selectedSize ? Math.min(selectedSize.max_yield, 99) : 1)
    : Math.min(product.max_yield, 99);

  const activePrice = hasSizes
    ? (selectedSize?.price ?? product.sizes[0]?.price ?? product.price)
    : product.price;

  const handleAdd = () => {
    if (hasSizes && !selectedSize) return;

    addToCart({
      product_id: product.product_id,
      tenant_id:  "",
      item_type:  hasSizes ? "fnb_size" : "fnb_single",
      name:       product.name,
      price:      activePrice,
      qty,
      image:      product.image_url ?? undefined,
      size_label: hasSizes ? selectedSize!.label : null,
      option_id:  hasSizes ? selectedSize!.size_id : null,
      modifiers:  hasSizes ? [`Size: ${selectedSize!.label}`] : [],
    });

    setAdded(true);
    setTimeout(() => {
      setAdded(false);
      onClose();
      setQty(1);
    }, 900);
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
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.92, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 24 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div className="bg-[#FFFCEB] rounded-[28px] w-full max-w-[440px] overflow-hidden shadow-2xl pointer-events-auto max-h-[92dvh] flex flex-col">

              {/* ── Image ─────────────────────────────────────────── */}
              <div className="w-full h-56 bg-gradient-to-b from-[#385E31]/10 to-[#385E31]/5 flex items-center justify-center relative shrink-0">
                {product.image_url ? (
                  <img
                    src={product.image_url.split('?')[0]}
                    alt={product.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                      (e.target as HTMLImageElement).nextElementSibling?.removeAttribute('style');
                    }}
                  />
                ) : null}
                <Coffee size={96} className="text-[#385E31]/20" style={product.image_url ? { display: 'none' } : {}} />
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

              {/* ── Content ───────────────────────────────────────── */}
              <div className="flex-1 overflow-y-auto">
                <div className="p-6 flex flex-col gap-5">

                  {/* Name & Description */}
                  <div>
                    <h2 className="text-[#385E31] text-[22px] font-black mb-1">{product.name}</h2>
                    <p className="text-[#385E31]/60 text-[13px] leading-relaxed">
                      {product.description ?? "No description available."}
                    </p>
                  </div>

                  {/* Price & Availability */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-[#385E31]/40 mb-0.5">
                        {hasSizes ? (selectedSize ? `${selectedSize.label} Price` : "Starting from") : "Price"}
                      </p>
                      <span className="text-[#385E31] text-[28px] font-black leading-none">
                        ₱{Number(activePrice).toFixed(2)}
                      </span>
                    </div>
                    <span className={`text-[12px] font-bold px-3 py-1.5 rounded-full border ${
                      isAvailable
                        ? "bg-[#FFFCEB] border-[#385E31]/20 text-[#385E31]"
                        : "bg-red-50 border-red-100 text-red-400"
                    }`}>
                      {isAvailable
                        ? hasSizes
                          ? (selectedSize ? `${selectedSize.max_yield} servings` : "Choose size")
                          : `${product.max_yield} servings left`
                        : "Currently Unavailable"}
                    </span>
                  </div>

                  {/* ── Size Selector ─────────────────────────────── */}
                  {hasSizes && (
                    <div>
                      <p className="text-[11px] font-black uppercase tracking-wider text-[#385E31]/50 mb-3">
                        Choose Size
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {product.sizes.map((size) => {
                          const isSel  = selectedSize?.size_id === size.size_id;
                          const avail  = size.max_yield > 0;
                          return (
                            <button
                              key={size.size_id}
                              disabled={!avail}
                              onClick={() => { setSelectedSize(size); setQty(1); }}
                              className={`relative px-4 py-2.5 rounded-xl border-2 text-[13px] font-black transition-all ${
                                isSel
                                  ? "border-[#385E31] bg-[#385E31] text-[#FFFCEB] shadow-md"
                                  : avail
                                  ? "border-[#385E31]/20 text-[#385E31] hover:border-[#385E31]/60"
                                  : "border-[#385E31]/10 text-[#385E31]/30 cursor-not-allowed bg-[#385E31]/3"
                              }`}
                            >
                              <span className="block leading-none">{size.label}</span>
                              <span className={`block text-[11px] font-bold mt-0.5 ${isSel ? "text-[#F7B71D]" : "text-[#385E31]/50"}`}>
                                ₱{size.price.toFixed(2)}
                              </span>
                              {!avail && (
                                <span className="absolute -top-1.5 -right-1.5 text-[9px] font-bold bg-red-400 text-white px-1.5 py-0.5 rounded-full">sold out</span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* ── Qty + Add ──────────────────────────────────── */}
                  {isAvailable && (!hasSizes || selectedSize) && (
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 bg-[#385E31]/5 border border-[#385E31]/10 rounded-[10px] px-2 py-1.5">
                        <button
                          onClick={() => setQty((q) => Math.max(1, q - 1))}
                          className="w-8 h-8 flex items-center justify-center text-[#385E31] hover:bg-[#385E31]/10 rounded-[6px] transition-colors"
                        >
                          <Minus size={16} />
                        </button>
                        <span className="w-8 text-center text-[#385E31] font-bold text-[16px]">{qty}</span>
                        <button
                          onClick={() => setQty((q) => Math.min(maxQty, q + 1))}
                          className="w-8 h-8 flex items-center justify-center text-[#385E31] hover:bg-[#385E31]/10 rounded-[6px] transition-colors"
                        >
                          <Plus size={16} />
                        </button>
                      </div>

                      <motion.button
                        onClick={handleAdd}
                        whileTap={{ scale: 0.97 }}
                        className={`flex-1 text-[#FFFCEB] flex justify-center items-center gap-2 py-3 rounded-[10px] font-bold text-[14px] transition-all ${
                          added ? "bg-[#22c55e]" : "bg-[#385E31] hover:opacity-90"
                        }`}
                      >
                        {added ? (
                          <><Check size={16} /> Added!</>
                        ) : (
                          <><ShoppingCart size={16} /> Add to Cart · ₱{(activePrice * qty).toFixed(2)}</>
                        )}
                      </motion.button>
                    </div>
                  )}

                  {hasSizes && !selectedSize && isAvailable && (
                    <p className="text-center text-[#385E31]/50 text-[13px] font-medium flex items-center justify-center gap-1">
                      <ChevronRight size={14} /> Select a size to continue
                    </p>
                  )}

                  {/* Reviews Section */}
                  <ProductReviews 
                    productId={product.product_id} 
                    productType="fnb" 
                    tenantId={tenantId} 
                  />
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};