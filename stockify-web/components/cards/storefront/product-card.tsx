"use client";

import React from "react";
import { motion } from "framer-motion";
import { Star, Plus, Heart } from "lucide-react";

interface Product {
  id: number;
  name: string;
  description: string;
  rating: number;
  price: string;
  image: string;
}

interface ProductCardProps {
  product: Product;
  onOpenModal: (product: Product) => void;
}

export const ProductCard = ({ product, onOpenModal }: ProductCardProps) => {
  return (
    <motion.div
      layoutId={`card-${product.id}`}
      variants={{
        hidden: { opacity: 0, y: 15 },
        visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 25 } }
      }}
      onClick={() => onOpenModal(product)}
      className="bg-[#FFFCEB] border border-[#385E31]/20 rounded-[10px] p-5 flex flex-col shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
    >
      <div className="w-full aspect-square flex items-center justify-center mb-4 bg-gradient-to-b from-[#385E31]/5 to-transparent rounded-[8px] group-hover:scale-105 transition-transform duration-300">
        <span className="text-[80px] drop-shadow-md">{product.image}</span>
      </div>
      
      <div className="flex flex-col flex-1">
        <h3 className="text-[#385E31] text-[16px] font-extrabold mb-1">{product.name}</h3>
        <p className="text-[#385E31]/70 text-[12px] font-medium leading-relaxed mb-4 flex-1">
          {product.description}
        </p>
        
        <div className="flex justify-between items-end mb-5">
          <div className="flex items-center gap-1.5 bg-[#FFFCEB] border border-[#385E31]/10 px-2 py-1 rounded-[4px]">
            <Star size={14} fill="#F7B71D" color="#F7B71D" />
            <span className="text-[#385E31] text-[12px] font-bold">{product.rating}</span>
          </div>
          <div className="text-[#385E31] text-[20px] font-black tracking-tight">₱{product.price}</div>
        </div>

        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
          <button className="flex-1 bg-[#385E31] text-[#FFFCEB] flex justify-center items-center gap-2 py-2.5 rounded-[8px] font-bold text-[13px] hover:opacity-90 transition-opacity">
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