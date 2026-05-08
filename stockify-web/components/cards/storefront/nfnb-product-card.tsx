"use client";

import React from "react";
import { motion } from "framer-motion";
import { Plus, Heart, Package } from "lucide-react";

export interface NfnbProduct {
  product_id: string;
  name: string;
  description: string | null;
  price: number;
  quantity: number;
  unit_of_measure: string;
  category_id: string | null;
  category_name: string | null;
}

interface NfnbProductCardProps {
  product: NfnbProduct;
  onOpenModal: (product: NfnbProduct) => void;
  onAddToCart?: (product: NfnbProduct) => void;
}

export const NfnbProductCard = ({
  product,
  onOpenModal,
  onAddToCart,
}: NfnbProductCardProps) => {
  const inStock = product.quantity > 0;

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
      className="bg-[#FFFCEB] border border-[#385E31]/20 rounded-[10px] p-5 flex flex-col shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
    >
      {/* Placeholder with stock overlay */}
      <div className="w-full aspect-square flex items-center justify-center mb-4 bg-gradient-to-b from-[#385E31]/5 to-transparent rounded-[8px] group-hover:scale-105 transition-transform duration-300 relative">
        <Package size={72} className="text-[#385E31]/20" />
        {!inStock && (
          <div className="absolute inset-0 bg-white/60 rounded-[8px] flex items-center justify-center">
            <span className="text-red-500 font-bold text-[11px] bg-red-50 border border-red-100 px-2.5 py-1 rounded-full">
              Out of Stock
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-col flex-1">
        <h3 className="text-[#385E31] text-[16px] font-extrabold mb-1 line-clamp-1">
          {product.name}
        </h3>
        <p className="text-[#385E31]/70 text-[12px] font-medium leading-relaxed mb-4 flex-1 line-clamp-2">
          {product.description ?? "No description available."}
        </p>

        <div className="flex justify-between items-end mb-5">
          <div
            className={`flex items-center gap-1.5 px-2 py-1 rounded-[4px] text-[11px] font-bold border ${
              inStock
                ? "bg-[#FFFCEB] border-[#385E31]/10 text-[#385E31]"
                : "bg-red-50 border-red-100 text-red-400"
            }`}
          >
            {inStock
              ? `${product.quantity} ${product.unit_of_measure}`
              : "Out of Stock"}
          </div>
          <div className="text-[#385E31] text-[20px] font-black tracking-tight">
            ₱{Number(product.price).toFixed(2)}
          </div>
        </div>

        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
          <button
            disabled={!inStock}
            onClick={() => onAddToCart?.(product)}
            className="flex-1 bg-[#385E31] text-[#FFFCEB] flex justify-center items-center gap-2 py-2.5 rounded-[8px] font-bold text-[13px] hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Plus size={16} /> Add to Cart
          </button>
          <button className="w-11 h-11 border border-[#385E31]/30 rounded-[8px] flex items-center justify-center text-[#385E31] hover:bg-[#385E31]/5 transition-colors">
            <Heart size={18} />
          </button>
        </div>
      </div>
    </motion.div>
  );
};