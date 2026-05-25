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
  colors?: {
    primary: string;
    secondary: string;
    accent: string;
    bg: string;
    text: string;
  };
}

const buildC = (colors?: ProductModalProps["colors"]) => {
  const primary = colors?.primary ?? "#385E31";
  const secondary = colors?.secondary ?? "#254020";
  return {
    primary,
    secondary,
    accent:      colors?.accent      ?? "#F7B71D",
    accentSoft:  colors?.accent      ?? "#F7B71D",
    bg:          colors?.bg          ?? "#FFFCEB",
    bgDim:       colors?.bg          ? colors.bg + "D9" : "rgba(255, 252, 235, 0.85)",
    muted:       colors?.bg          ? colors.bg + "80" : "rgba(255, 252, 235, 0.5)",
    border:      colors?.accent      ? colors.accent + "33" : "rgba(247, 183, 29, 0.2)",
    borderHi:    colors?.accent      ? colors.accent + "80" : "rgba(247, 183, 29, 0.5)",
  };
};

// ── Noise SVG (subtle grain texture) ─────────────────────────────────────────
const NoiseBg = () => (
  <svg
    style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", opacity: 0.04, mixBlendMode: "overlay" }}
    xmlns="http://www.w3.org/2000/svg"
  >
    <filter id="noise">
      <feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="4" stitchTiles="stitch" />
      <feColorMatrix type="saturate" values="0" />
    </filter>
    <rect width="100%" height="100%" filter="url(#noise)" />
  </svg>
);

export const ProductModal = ({ product, isOpen, onClose, tenantId, readOnly = false, colors }: ProductModalProps) => {
  const C = buildC(colors);
  const { addToCart } = useCart();
  const [qty, setQty]   = useState(1);
  const [added, setAdded] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);

  // One selected option per variant type
  const [selections, setSelections] = useState<Record<string, NfnbVariantOption | null>>({});

  useEffect(() => {
    if (!product) return;
    setQty(1);
    setAdded(false);
    setImgLoaded(false);
    setImgError(false);

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
        <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "flex-end", justifyContent: "center" }}
          className="md:items-center md:p-6 p-0"
        >
          {/* Subtle Scrollbar Styles */}
          <style>{`
            .subtle-scroll::-webkit-scrollbar {
              width: 6px;
            }
            .subtle-scroll::-webkit-scrollbar-track {
              background: transparent;
            }
            .subtle-scroll::-webkit-scrollbar-thumb {
              background: ${C.borderHi};
              border-radius: 8px;
            }
            .subtle-scroll::-webkit-scrollbar-thumb:hover {
              background: ${C.accent};
            }
            .subtle-scroll {
              scrollbar-width: thin;
              scrollbar-color: ${C.borderHi} transparent;
            }
          `}</style>

          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            style={{ position: "absolute", inset: 0, background: "rgba(5,10,4,0.8)", backdropFilter: "blur(12px)" }}
          />

          {/* Card */}
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 60 }}
            transition={{ type: "spring", stiffness: 380, damping: 34 }}
            className="relative w-full md:max-w-[960px] max-h-[94vh] overflow-y-auto overflow-x-hidden subtle-scroll
                       rounded-t-[28px] md:rounded-[28px] flex flex-col"
            style={{
              backgroundColor: C.primary,
              boxShadow: `0 32px 80px rgba(10, 18, 9, 0.55), 0 0 0 1px ${C.borderHi}`,
            }}
          >
            <NoiseBg />

            {/* Mobile handle */}
            <div className="md:hidden absolute top-3 left-1/2 -translate-x-1/2 z-50">
              <div style={{ width: 36, height: 3.5, borderRadius: 99, background: C.muted }} />
            </div>

            {/* Close */}
            <motion.button
              whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.94 }}
              onClick={onClose}
              style={{
                position: "absolute", top: 18, right: 18, zIndex: 50,
                width: 36, height: 36, borderRadius: "50%",
                background: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)",
                border: `1px solid ${C.border}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", color: C.bgDim,
              }}
            >
              <X size={16} strokeWidth={2.5} />
            </motion.button>

            {/* ── TOP SECTION: Image + Details (Split on Desktop) ──────────────── */}
            <div className="flex flex-col md:flex-row w-full">
              {/* ── LEFT: Image Panel ─────────────────────────────────────────── */}
              <div
                className="w-full md:w-[42%]"
                style={{
                  flexShrink: 0,
                  padding: "28px 24px 28px 28px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "flex-start",
                  background: C.primary,
                }}
              >
                {/* Image box - Stretch to fill container */}
                <div style={{
                  position: "relative",
                  width: "100%",
                  flex: 1,
                  minHeight: "300px",
                  borderRadius: 20,
                  overflow: "hidden",
                  background: C.secondary,
                  boxShadow: `0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px ${C.border}`,
                }}>
                  {product.image_url && !imgError ? (
                    <motion.img
                      src={product.image_url.split("?")[0]}
                      alt={product.name}
                      onLoad={() => setImgLoaded(true)}
                      onError={() => setImgError(true)}
                      initial={{ opacity: 0, scale: 1.04 }}
                      animate={{ opacity: imgLoaded ? 1 : 0, scale: 1 }}
                      transition={{ duration: 0.45, ease: "easeOut" }}
                      style={{
                        position: "absolute", inset: 0,
                        width: "100%", height: "100%",
                        objectFit: "cover", objectPosition: "center",
                      }}
                    />
                  ) : (
                    <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Package size={56} style={{ color: C.muted }} />
                    </div>
                  )}

                  {/* Category pill */}
                  {product.category_name && (
                    <div style={{
                      position: "absolute", top: 14, left: 14,
                      background: `${C.accent}EE`,
                      backdropFilter: "blur(6px)",
                      color: C.secondary,
                      fontSize: 9, fontWeight: 900, letterSpacing: ".14em", textTransform: "uppercase",
                      padding: "5px 12px", borderRadius: 99,
                      boxShadow: `0 4px 12px ${C.accent}50`,
                    }}>
                      {product.category_name}
                    </div>
                  )}
                </div>
              </div>

              {/* ── RIGHT: Details ────────────────────────────────────────────── */}
              <div
                className="w-full md:w-[58%]"
                style={{
                  padding: "28px 28px 28px 8px",
                  display: "flex",
                  flexDirection: "column",
                  background: C.primary,
                }}
              >
                {/* Product name + price */}
                <div style={{ marginBottom: 18 }}>
                  <motion.h2
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    style={{
                      fontSize: "clamp(24px, 4vw, 32px)",
                      fontWeight: 900, color: C.bg,
                      lineHeight: 1.1, marginBottom: 10,
                      paddingRight: 40,
                      letterSpacing: "-0.02em",
                    }}
                  >
                    {product.name}
                  </motion.h2>

                  <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
                    <span style={{ fontSize: 28, fontWeight: 900, color: C.accent, letterSpacing: "-0.01em" }}>
                      ₱{Number(activePrice).toFixed(2)}
                    </span>
                    {/* Stock badge */}
                    <div style={{
                      display: "inline-flex", alignItems: "center", gap: 6,
                      padding: "4px 12px", borderRadius: 99,
                      background: inStock ? `${C.secondary}CC` : "rgba(127,29,29,0.4)",
                      color: inStock ? C.bg : "#fca5a5",
                      fontSize: 11, fontWeight: 700, letterSpacing: "0.04em",
                      border: `1px solid ${inStock ? C.border : "rgba(252,165,165,0.25)"}`,
                    }}>
                      <div style={{
                        width: 5, height: 5, borderRadius: "50%",
                        background: inStock ? C.accent : "#f87171",
                        boxShadow: `0 0 6px ${inStock ? C.accent : "#f87171"}`,
                      }} />
                      {inStock
                        ? hasVariants
                          ? (allSelected ? `${Math.min(...Object.values(selections).map((o) => o?.stock ?? 0))} left` : "Select options")
                          : `${product.quantity} left`
                        : "Sold Out"}
                    </div>
                  </div>
                </div>

                {/* Thin decorative rule */}
                <div style={{ height: 1, background: `linear-gradient(90deg, ${C.borderHi}, transparent)`, marginBottom: 18 }} />

                {/* Description */}
                <p style={{ fontSize: 14, color: C.bgDim, lineHeight: 1.75, marginBottom: 28 }}>
                  {product.description ?? "No description available."}
                </p>

                {/* Variant Selector */}
                {hasVariants && product.variants.map((vt) => (
                  <div key={vt.variant_type_id} style={{ marginBottom: 28 }}>
                    <p style={{ fontSize: 9.5, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".14em", color: C.accent, marginBottom: 12 }}>
                      Select {vt.name}
                    </p>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {vt.options.map((opt) => {
                        const isSel  = selections[vt.variant_type_id]?.option_id === opt.option_id;
                        const avail  = opt.stock > 0;
                        return (
                          <motion.button
                            key={opt.option_id}
                            disabled={!avail}
                            whileHover={avail ? { y: -2 } : {}}
                            whileTap={avail ? { scale: 0.96 } : {}}
                            onClick={() =>
                              setSelections((prev) => ({
                                ...prev,
                                [vt.variant_type_id]: isSel ? null : opt,
                              }))
                            }
                            style={{
                              flex: "1 1 80px",
                              padding: "12px 14px", borderRadius: 14,
                              cursor: !avail ? "not-allowed" : "pointer",
                              opacity: !avail ? .3 : 1,
                              background: isSel ? C.accent : C.secondary,
                              color: isSel ? C.secondary : C.bg,
                              border: `1px solid ${isSel ? C.accent : C.border}`,
                              boxShadow: isSel ? `0 6px 20px ${C.accent}45` : "none",
                              transition: "all .18s ease",
                              display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
                            }}
                          >
                            <span style={{ fontSize: 13.5, fontWeight: 800 }}>{opt.label}</span>
                            <span style={{ fontSize: 12, fontWeight: 600, opacity: isSel ? 0.85 : 0.55 }}>
                              ₱{opt.price.toFixed(2)}
                            </span>
                            {avail && (
                              <span style={{ fontSize: 10.5, fontWeight: 500, opacity: 0.5 }}>
                                {opt.stock} left
                              </span>
                            )}
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>
                ))}

                {/* Qty + CTA */}
                {!readOnly && inStock && (
                  <div style={{ display: "flex", gap: 10, marginTop: "auto" }}>
                    {/* Qty stepper */}
                    {allSelected && (
                      <div style={{
                        display: "flex", alignItems: "center",
                        background: C.secondary,
                        border: `1px solid ${C.border}`,
                        borderRadius: 14, overflow: "hidden",
                      }}>
                        <button
                          onClick={() => setQty(q => Math.max(1, q - 1))}
                          style={{
                            width: 44, height: 50, border: "none",
                            background: "transparent", color: C.accent,
                            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                            transition: "background .15s",
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = C.primary}
                          onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                        >
                          <Minus size={16} strokeWidth={2.5} />
                        </button>
                        <span style={{ width: 36, textAlign: "center", fontSize: 17, fontWeight: 900, color: C.bg, userSelect: "none" }}>
                          {qty}
                        </span>
                        <button
                          onClick={() => setQty(q => Math.min(maxQty, q + 1))}
                          disabled={qty >= maxQty}
                          style={{
                            width: 44, height: 50, border: "none",
                            background: "transparent", color: C.accent,
                            cursor: qty >= maxQty ? "not-allowed" : "pointer",
                            opacity: qty >= maxQty ? .3 : 1,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            transition: "background .15s",
                          }}
                          onMouseEnter={e => { if (qty < maxQty) e.currentTarget.style.background = C.primary; }}
                          onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                        >
                          <Plus size={16} strokeWidth={2.5} />
                        </button>
                      </div>
                    )}

                    {/* Add to cart */}
                    <motion.button
                      disabled={!allSelected}
                      onClick={handleAdd}
                      whileHover={allSelected ? { y: -2, boxShadow: `0 12px 32px ${C.accent}60` } : {}}
                      whileTap={allSelected ? { scale: 0.97 } : {}}
                      style={{
                        flex: 1, height: 50, borderRadius: 14, border: "none",
                        background: added
                          ? "#22c55e"
                          : (allSelected
                            ? `linear-gradient(135deg, ${C.accentSoft} 0%, ${C.accent} 100%)`
                            : C.secondary),
                        color: added ? "#FFFFFF" : (allSelected ? C.secondary : C.muted),
                        fontSize: 14, fontWeight: 900, letterSpacing: "0.03em",
                        cursor: allSelected ? "pointer" : "not-allowed",
                        display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                        boxShadow: allSelected ? `0 6px 22px ${C.accent}45` : "none",
                        transition: "box-shadow .2s, background .2s",
                      }}
                    >
                      {added ? (
                        <><Check size={18} strokeWidth={2.5} /> Added!</>
                      ) : allSelected ? (
                        <>
                          <ShoppingCart size={18} strokeWidth={2.5} />
                          Add to Cart  ·  ₱{(activePrice * qty).toFixed(2)}
                        </>
                      ) : (
                        "Select options to continue"
                      )}
                    </motion.button>
                  </div>
                )}

                {hasVariants && !allSelected && inStock && (
                  <p style={{ textAlign: "center", fontSize: 13, color: C.accent, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: "auto" }}>
                    <ChevronRight size={14} /> Select options to continue
                  </p>
                )}

                {!inStock && (
                  <p style={{ textAlign: "center", fontSize: 13, color: "#f87171", fontWeight: 600, marginTop: "auto" }}>
                    This item is currently out of stock.
                  </p>
                )}
              </div>
            </div>

            {/* ── BOTTOM SECTION: Full-Width Reviews ────────────────────────── */}
            <div style={{ padding: "12px 28px 40px 28px", width: "100%" }}>
              {/* Divider before reviews */}
              <div style={{ marginBottom: 28, height: 1, background: `linear-gradient(90deg, transparent, ${C.borderHi} 50%, transparent)` }} />
              
              <ProductReviews 
                productId={product.product_id} 
                productType="nfb" 
                tenantId={tenantId} 
                colors={colors}
              />
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};