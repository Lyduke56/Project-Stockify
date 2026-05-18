"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Minus, Package, ShoppingCart, Check, ChevronRight } from "lucide-react";
import type { NfnbProduct, NfnbVariantOption, NfnbVariantType } from "@/components/cards/storefront/nfnb-product-card";
import { useCart } from "@/lib/customer/cart-context";

import { ProductReviews } from "./product-reviews";

interface ProductModalProps {
  product: NfnbProduct | null;
  isOpen: boolean;
  onClose: () => void;
  tenantId: string;
  readOnly?: boolean;
}

export const ProductModal = ({ product, isOpen, onClose, tenantId, readOnly = false }: ProductModalProps) => {
  const { addToCart } = useCart();
  const [qty, setQty]   = useState(1);
  const [added, setAdded] = useState(false);

  // One selected option per variant type
  const [selections, setSelections] = useState<Record<string, NfnbVariantOption | null>>({});

  useEffect(() => {
    if (!product) return;
    setQty(1);
    setAdded(false);

    // Default-select the first in-stock option for each variant type
    const init: Record<string, NfnbVariantOption | null> = {};
    product.variants.forEach((vt) => {
      const firstInStock = vt.options.find((o) => o.stock > 0) ?? null;
      init[vt.variant_type_id] = firstInStock;
    });
    setSelections(init);
  }, [product, isOpen]);

  if (!product) return null;

  const hasVariants  = product.variants.length > 0;
  const allSelected  = hasVariants
    ? product.variants.every((vt) => selections[vt.variant_type_id] !== null)
    : true;

  // Compute display price from selected options
  const activePrice = (() => {
    if (!hasVariants) return product.price;
    const prices = Object.values(selections).filter(Boolean).map((o) => o!.price);
    if (prices.length === 0) return product.price;
    return Math.max(...prices); // use max if multiple types (edge case)
  })();

  // Availability: if has variants all selected options must have stock
  const inStock = hasVariants
    ? allSelected && Object.values(selections).every((o) => o !== null && o.stock > 0)
    : product.quantity > 0;

  const maxQty = hasVariants
    ? (allSelected ? Math.min(...Object.values(selections).map((o) => o?.stock ?? 1), 99) : 1)
    : Math.min(product.quantity, 99);

  // Generate a combined label for cart from all selected options
  const combinedLabel = hasVariants
    ? product.variants
        .map((vt) => {
          const sel = selections[vt.variant_type_id];
          return sel ? `${vt.name}: ${sel.label}` : null;
        })
        .filter(Boolean)
        .join(", ")
    : null;

  const handleAdd = () => {
    if (!inStock || !allSelected) return;

    // For NF&B with variants: use the first selected option_id as primary (or create combined)
    const firstOption = Object.values(selections)[0];

    addToCart({
      product_id: product.product_id,
      tenant_id:  "",
      item_type:  hasVariants ? "nfb_variant" : "nfb_single",
      name:       product.name,
      price:      activePrice,
      qty,
      size_label: combinedLabel,
      option_id:  hasVariants && firstOption ? firstOption.option_id : null,
      modifiers:  combinedLabel ? [combinedLabel] : [],
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

              {/* ── Header Image / Icon ─────────────────────────── */}
              <div className="w-full h-48 bg-gradient-to-b from-[#385E31]/10 to-[#385E31]/5 flex items-center justify-center relative shrink-0 overflow-hidden">
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
                <Package size={96} className="text-[#385E31]/20" style={product.image_url ? { display: 'none' } : {}} />
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
                {!inStock && (
                  <div className="absolute inset-0 bg-white/50 flex items-center justify-center">
                    <span className="text-red-500 font-bold text-[13px] bg-red-50 border border-red-100 px-4 py-1.5 rounded-full">
                      Out of Stock
                    </span>
                  </div>
                )}
              </div>

              {/* ── Content ────────────────────────────────────── */}
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
                      <p className="text-[10px] font-bold uppercase tracking-wider text-[#385E31]/40 mb-0.5">Price</p>
                      <span className="text-[#385E31] text-[28px] font-black leading-none">
                        ₱{Number(activePrice).toFixed(2)}
                      </span>
                    </div>
                    <span className={`text-[12px] font-bold px-3 py-1.5 rounded-full border ${
                      inStock
                        ? "bg-[#FFFCEB] border-[#385E31]/20 text-[#385E31]"
                        : "bg-red-50 border-red-100 text-red-400"
                    }`}>
                      {inStock
                        ? hasVariants
                          ? (allSelected ? `${Math.min(...Object.values(selections).map((o) => o?.stock ?? 0))} in stock` : "Select options")
                          : `${product.quantity} ${product.unit_of_measure}`
                        : "Out of Stock"}
                    </span>
                  </div>

                  {/* ── Variant Selectors ─────────────────────────────────── */}
                  {hasVariants && product.variants.map((vt) => (
                    <div key={vt.variant_type_id}>
                      <p className="text-[11px] font-black uppercase tracking-wider text-[#385E31]/50 mb-3">
                        {vt.name}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {vt.options.map((opt) => {
                          const isSel  = selections[vt.variant_type_id]?.option_id === opt.option_id;
                          const avail  = opt.stock > 0;
                          return (
                            <button
                              key={opt.option_id}
                              disabled={!avail}
                              onClick={() =>
                                setSelections((prev) => ({
                                  ...prev,
                                  [vt.variant_type_id]: isSel ? null : opt,
                                }))
                              }
                              className={`relative px-4 py-2.5 rounded-xl border-2 text-[13px] font-black transition-all ${
                                isSel
                                  ? "border-[#385E31] bg-[#385E31] text-[#FFFCEB] shadow-md"
                                  : avail
                                  ? "border-[#385E31]/20 text-[#385E31] hover:border-[#385E31]/60"
                                  : "border-[#385E31]/10 text-[#385E31]/30 cursor-not-allowed"
                              }`}
                            >
                              <span className="block leading-none">{opt.label}</span>
                              <span className={`block text-[11px] font-bold mt-0.5 ${isSel ? "text-[#F7B71D]" : "text-[#385E31]/50"}`}>
                                ₱{opt.price.toFixed(2)}
                              </span>
                              {!avail && (
                                <span className="absolute -top-1.5 -right-1.5 text-[9px] font-bold bg-red-400 text-white px-1.5 py-0.5 rounded-full">out</span>
                              )}
                              {avail && (
                                <span className={`block text-[10px] font-medium mt-0.5 ${isSel ? "text-[#FFFCEB]/60" : "text-[#385E31]/30"}`}>
                                  {opt.stock} left
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}

                  {/* ── Qty + Add ──────────────────────────────────── */}
                  {!readOnly && inStock && allSelected && (
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

                  {!inStock && !hasVariants && (
                    <div className="text-center py-2 text-red-400 font-medium text-[13px]">This item is currently out of stock.</div>
                  )}

                  {hasVariants && !allSelected && inStock && (
                    <p className="text-center text-[#385E31]/50 text-[13px] font-medium flex items-center justify-center gap-1">
                      <ChevronRight size={14} /> Select all options to continue
                    </p>
                  )}

                  {/* Reviews Section */}
                  <ProductReviews 
                    productId={product.product_id} 
                    productType="nfb" 
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