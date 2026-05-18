"use client";

import React from "react";
import { motion } from "framer-motion";
import { Plus, Heart, Package, Layers } from "lucide-react";

export interface NfnbVariantOption {
  option_id: string;
  label: string;
  price: number;
  stock: number;
}

export interface NfnbVariantType {
  variant_type_id: string;
  name: string;
  options: NfnbVariantOption[];
}

export interface NfnbProduct {
  product_id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  price: number;
  quantity: number;
  unit_of_measure: string;
  category_id: string | null;
  category_name: string | null;
  variants: NfnbVariantType[];
}

interface NfnbProductCardProps {
  product: NfnbProduct;
  onOpenModal: (product: NfnbProduct) => void;
  isFavorite?: boolean;
  onToggleFavorite?: (productId: string) => void;
  colors?: {
    primary: string;
    secondary: string;
    accent: string;
    bg: string;
    text: string;
  };
}

export const NfnbProductCard = ({ 
  product, 
  onOpenModal,
  isFavorite = false,
  onToggleFavorite,
  colors
}: NfnbProductCardProps) => {
  const c = colors || {
    primary: "#385E31",
    secondary: "#2A4725",
    accent: "#F7B71D",
    bg: "#FFFCEB",
    text: "#3A6131"
  };

  const hasVariants = product.variants.length > 0;
  const allOptions  = product.variants.flatMap((vt) => vt.options);

  const inStock = hasVariants
    ? allOptions.some((o) => o.stock > 0)
    : product.quantity > 0;

  const displayPrice = hasVariants && allOptions.length > 0
    ? (() => {
        const prices = allOptions.map((o) => o.price);
        const min = Math.min(...prices);
        const max = Math.max(...prices);
        return min === max ? `₱${min.toFixed(2)}` : `from ₱${min.toFixed(2)}`;
      })()
    : `₱${Number(product.price).toFixed(2)}`;

  const availabilityLabel = hasVariants
    ? (inStock ? `${allOptions.filter((o) => o.stock > 0).length} options` : "Out of Stock")
    : (inStock ? `${product.quantity} ${product.unit_of_measure}` : "Out of Stock");

  return (
    <motion.div
      layoutId={`card-${product.product_id}`}
      variants={{
        hidden: { opacity: 0, y: 15 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { type: "spring", stiffness: 300, damping: 25 },
        },
      }}
      onClick={() => onOpenModal(product)}
      className="border rounded-[10px] p-5 flex flex-col shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
      style={{ backgroundColor: c.bg, borderColor: c.primary + "33" }}
    >
      {/* Image / Fallback */}
      <div className="w-full aspect-square flex items-center justify-center mb-4 rounded-[8px] group-hover:scale-105 transition-transform duration-300 relative overflow-hidden"
        style={{ background: `linear-gradient(to bottom, ${c.primary}0D, transparent)` }}>
        {product.image_url ? (
          <img
            src={product.image_url.split('?')[0]}
            alt={product.name}
            className="w-full h-full object-cover rounded-[8px]"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
              (e.target as HTMLImageElement).nextElementSibling?.removeAttribute('style');
            }}
          />
        ) : null}
        <Package size={72} style={product.image_url ? { display: 'none' } : { color: c.primary + "33" }} />
        {!inStock && (
          <div className="absolute inset-0 bg-white/60 rounded-[8px] flex items-center justify-center">
            <span className="text-red-500 font-bold text-[11px] bg-red-50 border border-red-100 px-2.5 py-1 rounded-full">
              Out of Stock
            </span>
          </div>
        )}
        {hasVariants && (
          <div className="absolute top-2 left-2 text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1"
            style={{ backgroundColor: c.primary, color: c.accent }}>
            <Layers size={9} /> {allOptions.length} variants
          </div>
        )}
      </div>

      <div className="flex flex-col flex-1">
        <h3 className="text-[16px] font-extrabold mb-1 line-clamp-1" style={{ color: c.text }}>
          {product.name}
        </h3>
        <p className="text-[12px] font-medium leading-relaxed mb-4 flex-1 line-clamp-2" style={{ color: c.text, opacity: 0.7 }}>
          {product.description ?? "No description available."}
        </p>

        <div className="flex justify-between items-end mb-5">
          <div
            className={`flex items-center gap-1.5 px-2 py-1 rounded-[4px] text-[11px] font-bold border ${!inStock ? "bg-red-50 border-red-100 text-red-400" : ""}`}
            style={inStock ? { backgroundColor: c.bg, borderColor: c.primary + "1A", color: c.primary } : {}}
          >
            {availabilityLabel}
          </div>
          <div className="text-[18px] font-black tracking-tight" style={{ color: c.primary }}>
            {displayPrice}
          </div>
        </div>

        <div className="flex gap-2">
          <button
            disabled={!inStock}
            onClick={(e) => { e.stopPropagation(); onOpenModal(product); }}
            className="flex-1 flex justify-center items-center gap-2 py-2.5 rounded-[8px] font-bold text-[13px] hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ backgroundColor: c.primary, color: c.bg }}
          >
            <Plus size={16} /> {hasVariants ? "Choose Variant" : "Add to Cart"}
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); onToggleFavorite?.(product.product_id); }}
            className={`w-11 h-11 border rounded-[8px] flex items-center justify-center transition-colors ${isFavorite ? "bg-red-50 text-red-500 border-red-200" : "hover:brightness-95"}`}
            style={!isFavorite ? { color: c.primary, borderColor: c.primary + "4D" } : {}}
          >
            <Heart size={18} fill={isFavorite ? "currentColor" : "none"} />
          </button>
        </div>
      </div>
    </motion.div>
  );
};