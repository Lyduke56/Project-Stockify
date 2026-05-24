"use client";

import React from "react";
import { motion } from "framer-motion";
import { Heart, Plus } from "lucide-react";
import { FnbProduct } from "@/backend/hooks/getStoreFront";

interface FnbProductCardProps {
  product: FnbProduct;
  onOpenModal: (product: FnbProduct) => void;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
  colors?: any; 
}

export const FnbProductCard = ({
  product,
  onOpenModal,
  isFavorite,
  onToggleFavorite,
  colors,
}: FnbProductCardProps) => {
  const currentYield = product.max_yield;
  const isOutOfStock = currentYield === 0;

  // Utilize the exact dark palette provided
  const c = {
    primary: colors?.primary || "#385E31",    // Deep Green 1
    secondary: colors?.secondary || "#2A4725", // Darker Green (Card BG)
    accent: colors?.accent || "#E5AC24",       // Gold
    textLight: colors?.bg || "#FFFCEB",        // Cream/Light Text
  };

  // Sort sizes if they exist
  const sizes = product.sizes?.slice().sort((a, b) => a.sort_order - b.sort_order) || [];

  return (
    <motion.div
      layout
      whileHover={{ y: -6 }}
      className="group relative flex flex-col h-full rounded-[28px] p-3 sm:p-4 cursor-pointer transition-all duration-500 overflow-hidden"
      style={{ 
        backgroundColor: c.secondary, // Dark background
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
            onToggleFavorite(product.product_id);
          }}
          className="absolute top-3 left-3 z-10 w-8 h-8 rounded-full flex items-center justify-center transition-transform duration-300 hover:scale-110"
          style={{ 
            backgroundColor: `${c.textLight}E6`, // Light cream bg for contrast on image
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
          />
        ) : (
          <div 
            className="w-full h-full flex items-center justify-center text-[10px] tracking-widest uppercase font-bold"
            style={{ color: `${c.textLight}40` }}
          >
            No Image
          </div>
        )}
        
        {/* Out of Stock Overlay */}
        {isOutOfStock && (
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
            style={{ color: `${c.textLight}A0` }} // Cream with 60% opacity
          >
            {product.category_name || "Uncategorized"}
          </span>

          <h3 
            className="font-bold text-[16px] leading-snug line-clamp-2 min-h-[38px] pr-2"
            style={{ color: c.textLight }} // Main Cream Text
          >
            {product.name}
          </h3>
          
          <p 
            className="font-black text-[18px] mt-1.5"
            style={{ color: c.accent }} // Gold Price
          >
            ₱{product.price.toFixed(2)}
          </p>
        </div>

        {/* Right Side: Add Button (Gold) */}
        <button 
          disabled={isOutOfStock}
          style={{
            backgroundColor: isOutOfStock ? `${c.accent}20` : c.accent,
            color: isOutOfStock ? `${c.textLight}40` : c.secondary,
            boxShadow: isOutOfStock ? "none" : `0 4px 12px ${c.accent}40`
          }}
          className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2.5 rounded-full transition-all duration-300 ${
            !isOutOfStock && "hover:scale-105 hover:bg-white hover:text-black"
          }`}
        >
          <Plus size={14} strokeWidth={3} />
          <span className="text-[12px] font-black tracking-wide">Add</span>
        </button>
      </div>

      {/* Bottom Row: Always Rendered for Consistent Heights */}
      <div className="flex items-center justify-between mt-auto pt-3 relative z-10" style={{ borderTop: `1px dashed ${c.primary}` }}>
        
        {/* Sizes OR Fallback */}
        <div className="flex items-center flex-wrap gap-1.5">
          {sizes.length > 0 ? (
            sizes.map((size, index) => {
              const isFirst = index === 0;
              return (
                <div 
                  key={size.size_id} 
                  className="px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider transition-colors group-hover:border-white/20"
                  style={{ 
                    // Gold for first, dark green border for others
                    backgroundColor: isFirst ? c.accent : "transparent",
                    color: isFirst ? c.secondary : `${c.textLight}A0`,
                    border: isFirst ? `1px solid ${c.accent}` : `1px solid ${c.primary}`
                  }}
                >
                  {size.label}
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
            style={{ backgroundColor: currentYield > 0 ? c.primary : '#EF4444' }} 
          />
          {currentYield > 0 ? `${currentYield} Left` : "Out"}
        </span>

      </div>
    </motion.div>
  );
};