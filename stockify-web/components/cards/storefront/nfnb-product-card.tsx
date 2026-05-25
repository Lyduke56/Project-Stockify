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
  const c = {
    primary:   colors?.primary   || "#385E31",
    secondary: colors?.secondary || "#2A4725",
    accent:    colors?.accent    || "#E5AC24",
    textLight: colors?.bg        || "#FFFCEB",
  };

  const hasVariants = product.variants.length > 0;
  const allOptions  = product.variants.flatMap((vt) => vt.options);

  const inStock = hasVariants
    ? allOptions.some((o) => o.stock > 0)
    : product.quantity > 0;

  const currentYield = hasVariants
    ? allOptions.reduce((sum, o) => sum + o.stock, 0)
    : product.quantity;

  const displayPrice = hasVariants && allOptions.length > 0
    ? (() => {
        const prices = allOptions.map((o) => o.price);
        const min = Math.min(...prices);
        const max = Math.max(...prices);
        return min === max ? `₱${min.toFixed(2)}` : `from ₱${min.toFixed(2)}`;
      })()
    : `₱${Number(product.price).toFixed(2)}`;

  return (
    <motion.div
      layoutId={`card-${product.product_id}`}
      whileHover={{ y: -6 }}
      className="group relative flex flex-col h-full rounded-[28px] p-3 sm:p-4 cursor-pointer transition-all duration-500 overflow-hidden"
      style={{ 
        backgroundColor: c.secondary,
        border: `1px solid ${c.primary}`, 
        boxShadow: `0 12px 32px -4px rgba(0,0,0,0.3)`, 
      }}
      onClick={() => onOpenModal(product)}
    >
      {/* Glow Effect on Hover */}
      <div 
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{
          background: `radial-gradient(circle at center, ${c.accent}15 0%, rgba(0,0,0,0) 70%)`
        }}
      />

      {/* Padded Image Container */}
      <div className="relative w-full aspect-[4/3] rounded-[20px] overflow-hidden mb-4 flex-shrink-0" style={{ backgroundColor: `${c.primary}80` }}>
        
        {/* Favorite Button (Floating over image) */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite?.(product.product_id);
          }}
          className="absolute top-3 left-3 z-10 w-8 h-8 rounded-full flex items-center justify-center transition-transform duration-300 hover:scale-110"
          style={{ 
            backgroundColor: `${c.textLight}E6`,
            backdropFilter: "blur(4px)",
            boxShadow: "0 2px 8px rgba(0,0,0,0.2)"
          }}
        >
          <Heart
            size={16}
            fill={isFavorite ? c.accent : "none"}
            stroke={isFavorite ? c.accent : c.secondary}
            strokeWidth={1.5}
            className="transition-colors duration-300"
          />
        </button>

        {product.image_url ? (
          <img
            src={product.image_url.split("?")[0]}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
              (e.target as HTMLImageElement).nextElementSibling?.removeAttribute('style');
            }}
          />
        ) : null}
        <div 
          className="w-full h-full flex items-center justify-center text-[10px] tracking-widest uppercase font-bold"
          style={product.image_url ? { display: 'none', color: `${c.textLight}40` } : { color: `${c.textLight}40` }}
        >
          No Image
        </div>
        
        {/* Out of Stock Overlay */}
        {!inStock && (
          <div className="absolute inset-0 backdrop-blur-[2px] flex items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
            <span 
              className="text-[11px] font-black px-4 py-2 rounded-full tracking-widest uppercase shadow-md"
              style={{ backgroundColor: c.accent, color: c.secondary }}
            >
              Sold Out
            </span>
          </div>
        )}
      </div>

      {/* Card Content & Action Row */}
      <div className="flex justify-between items-end gap-2 flex-1 relative z-10 mb-4">
        
        {/* Left Side: Text Info */}
        <div className="flex flex-col flex-1 min-w-0">
          {/* Categorization */}
          <span 
            className="text-[10px] font-bold uppercase tracking-widest mb-1 truncate"
            style={{ color: `${c.textLight}A0` }}
          >
            {product.category_name || "Uncategorized"}
          </span>

          <h3 
            className="font-bold text-[16px] leading-snug line-clamp-2 min-h-[38px] pr-2"
            style={{ color: c.textLight }}
          >
            {product.name}
          </h3>
          
          <p 
            className="font-black text-[18px] mt-1.5"
            style={{ color: c.accent }}
          >
            {displayPrice}
          </p>
        </div>

        {/* Right Side: Add Button (Gold) */}
        <button 
          disabled={!inStock}
          style={{
            backgroundColor: !inStock ? `${c.accent}20` : c.accent,
            color: !inStock ? `${c.textLight}40` : c.secondary,
            boxShadow: !inStock ? "none" : `0 4px 12px ${c.accent}40`
          }}
          className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2.5 rounded-full transition-all duration-300 ${
            inStock && "hover:scale-105 hover:bg-white hover:text-black"
          }`}
        >
          <Plus size={14} strokeWidth={3} />
          <span className="text-[12px] font-black tracking-wide">Add</span>
        </button>
      </div>

      {/* Bottom Row: Always Rendered for Consistent Heights */}
      <div className="flex items-center justify-between mt-auto pt-3 relative z-10" style={{ borderTop: `1px dashed ${c.primary}` }}>
        
        {/* Variant options / Fallback */}
        <div className="flex items-center flex-wrap gap-1.5">
          {hasVariants ? (
            allOptions.slice(0, 3).map((opt, index) => {
              const isFirst = index === 0;
              return (
                <div 
                  key={opt.option_id} 
                  className="px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider transition-colors group-hover:border-white/20"
                  style={{ 
                    backgroundColor: isFirst ? c.accent : "transparent",
                    color: isFirst ? c.secondary : `${c.textLight}A0`,
                    border: isFirst ? `1px solid ${c.accent}` : `1px solid ${c.primary}`
                  }}
                >
                  {opt.label}
                </div>
              );
            })
          ) : (
            <div 
              className="px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider"
              style={{ 
                backgroundColor: "transparent",
                color: `${c.textLight}60`,
                border: `1px solid ${c.primary}`
              }}
            >
              Regular
            </div>
          )}
        </div>

        {/* Stock Indicator */}
        <span 
          className="text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 shrink-0"
          style={{ color: `${c.textLight}70` }}
        >
          <span 
            className="w-1.5 h-1.5 rounded-full" 
            style={{ backgroundColor: inStock ? c.primary : '#EF4444' }} 
          />
          {currentYield > 0 ? `${currentYield} Left` : "Out"}
        </span>

      </div>
    </motion.div>
  );
};