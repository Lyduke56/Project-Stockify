"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  ShoppingCart,
  Minus,
  Plus,
  ThumbsUp,
  MoreHorizontal,
  Play,
  Star,
  Flame,
  BadgeCheck,
  Ruler, // Added for Size Guide
  Package // Added for shipping status
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Review {
  id: number;
  user: string;
  date: string;
  rating: number;
  size: string;
  color: string; // Added color to reviews
  text: string;
  likes: number;
  hasImages: boolean;
  verified?: boolean;
}

interface ProductModalProps {
  product: {
    name: string;
    price: number | string;
    image: string;
    rating?: number;
    description?: string;
    originalPrice?: number | string;
    category?: string;
  } | null;
  isOpen: boolean;
  onClose: () => void;
}

// ─── Retail Mock Data ─────────────────────────────────────────────────────────

const mockReviews: Review[] = [
  {
    id: 1,
    user: "A***n",
    date: "3 weeks ago",
    rating: 5,
    size: "Size: L",
    color: "Midnight Navy",
    text: "The fit is absolutely perfect! The material feels premium and breathable, making it great for everyday wear. I've washed it twice and it hasn't shrunk at all. Highly recommend.",
    likes: 12,
    hasImages: true,
    verified: true,
  },
  {
    id: 2,
    user: "M***s",
    date: "5 days ago",
    rating: 5,
    size: "Size: M",
    color: "Olive Green",
    text: "True to size. I was worried the color wouldn't match the photos, but it's identical. Great stitching quality and very comfortable for long hours. Will be buying another colorways soon.",
    likes: 4,
    hasImages: true,
    verified: true,
  },
];

const SIZES = ["S", "M", "L", "XL", "2XL", "3XL"] as const;
type Size = (typeof SIZES)[number];

const MOCK_COLORS = [
  { id: "navy", name: "Midnight Navy", hex: "#1A2E3B" },
  { id: "olive", name: "Olive Green", hex: "#4A5D4E" },
  { id: "sand", name: "Desert Sand", hex: "#D4C4B7" },
  { id: "charcoal", name: "Charcoal Grey", hex: "#333333" },
];

const FILTERS = [
  "All",
  "With photos (1.8K)",
  "True to size (1.5K)",
  "Great quality (1.2K)",
  "Comfortable (980)",
];

// ─── Sub-components ──────────────────────────────────────────────────────────

const StarRow = ({ rating, size = 14 }: { rating: number; size?: number }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map((s) => (
      <Star
        key={s}
        size={size}
        fill={s <= Math.round(rating) ? "#F7B71D" : "none"}
        color={s <= Math.round(rating) ? "#F7B71D" : "#D9D9D9"}
      />
    ))}
  </div>
);

// ─── Main Component ──────────────────────────────────────────────────────────

export const ProductModal = ({ product, isOpen, onClose }: ProductModalProps) => {
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState<Size>("M");
  const [selectedColor, setSelectedColor] = useState(MOCK_COLORS[0]);
  const [activeFilter, setActiveFilter] = useState("All");
  const [activeThumb, setActiveThumb] = useState(0);

  if (!product) return null;

  const handleDecrease = () => setQuantity((prev) => Math.max(1, prev - 1));
  const handleIncrease = () => setQuantity((prev) => prev + 1);

  const avatarColors = [
    { bg: "#3A6131", text: "#FFFCEB" },
    { bg: "#F7B71D", text: "#385E31" },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 font-inter">
          <style>{`
            .custom-scrollbar::-webkit-scrollbar { width: 6px; }
            .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
            .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(58,97,49,0.2); border-radius: 99px; }
          `}</style>

          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-[#385E31]/55 backdrop-blur-[4px]"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ scale: 0.93, opacity: 0, y: 16 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.93, opacity: 0, y: 16 }}
            transition={{ type: "spring", damping: 26, stiffness: 320 }}
            className="custom-scrollbar relative w-full max-w-[880px] bg-[#FFFCEB] rounded-[28px] overflow-hidden overflow-y-auto max-h-[90vh] border-[1.5px] border-[#F7B71D]/25 shadow-[0_32px_80px_rgba(58,97,49,0.25)] flex flex-col"
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 sm:top-5 sm:right-5 z-20 w-9 h-9 rounded-full border-[1.5px] border-[#3A6131]/20 bg-[#FFF9D7] text-[#3A6131] flex items-center justify-center transition-all duration-200 hover:bg-[#3A6131] hover:text-[#FFFCEB] hover:border-[#3A6131]"
            >
              <X size={18} strokeWidth={2.5} />
            </button>

            {/* ── TOP SECTION ── */}
            <div className="flex flex-col md:flex-row w-full">
              {/* Left: Image panel */}
              <div className="w-full md:w-[42%] md:min-w-[240px] flex flex-col items-center justify-center p-8 sm:p-10 relative border-b md:border-b-0 md:border-r border-[#3A6131]/10">
                
                {/* Retail Badge */}
                <div className="absolute top-5 left-5 bg-[#3A6131] text-[#FFFCEB] text-[11px] font-bold tracking-[0.08em] uppercase px-3 py-1 rounded-full shadow-sm">
                  ✦ New Arrival
                </div>

                {/* Main image */}
                <div className="w-full max-w-[280px] aspect-square bg-white rounded-3xl flex items-center justify-center border border-[#3A6131]/10 text-8xl sm:text-[120px] shadow-sm">
                  {product.image}
                </div>

                {/* Dotted Progress Bar */}
                <div className="flex items-center gap-2.5 mt-8">
                  {[0, 1, 2, 3].map((i) => (
                    <button
                      key={i}
                      onClick={() => setActiveThumb(i)}
                      className={`h-2.5 rounded-full transition-all duration-300 ease-out ${
                        activeThumb === i
                          ? "w-7 bg-[#3A6131]"
                          : "w-2.5 bg-[#3A6131]/20 hover:bg-[#3A6131]/40"
                      }`}
                      aria-label={`View image ${i + 1}`}
                    />
                  ))}
                </div>
              </div>

              {/* Right: Details */}
              <div className="flex-1 p-6 sm:p-8 flex flex-col">
                {/* Tags */}
                <div className="flex flex-wrap gap-2 mb-3">
                  <span className="inline-flex items-center gap-1 bg-[#F7B71D]/15 text-[#385E31] text-xs font-bold px-2.5 py-1 rounded-full">
                    <Flame size={12} className="text-[#F7B71D]" /> Trending
                  </span>
                  {product.category && (
                    <span className="bg-[#3A6131]/10 text-[#3A6131] text-xs font-semibold px-2.5 py-1 rounded-full">
                      {product.category}
                    </span>
                  )}
                </div>

                {/* Name */}
                <h2 className="font-raleway text-[28px] sm:text-[32px] font-black text-[#3A6131] leading-tight mb-2">
                  {product.name}
                </h2>

                {/* Rating */}
                <div className="flex items-center gap-2 mb-5">
                  <StarRow rating={product.rating ?? 4.8} />
                  <span className="text-[13px] font-bold text-[#3A6131]/70">
                    {product.rating ?? 4.8}
                  </span>
                  <span className="text-[13px] text-[#385E31] underline font-medium cursor-pointer transition-colors hover:text-[#3A6131]">
                    1,432 reviews
                  </span>
                </div>

                {/* Price & Stock */}
                <div className="flex items-end justify-between mb-3 border-b border-[#3A6131]/10 pb-6">
                  <div className="flex items-baseline gap-2.5">
                    <span className="font-inter text-[38px] sm:text-[42px] font-black text-[#3A6131] leading-none">
                      ₱{product.price}
                    </span>
                    {product.originalPrice && (
                      <span className="text-lg text-[#D9D9D9] line-through font-medium">
                        ₱{product.originalPrice}
                      </span>
                    )}
                  </div>
                  {/* Retail Shipping Indicator */}
                  <div className="flex items-center gap-1.5 text-[12px] font-bold text-[#3A6131] bg-[#3A6131]/5 px-3 py-1.5 rounded-lg border border-[#3A6131]/10">
                    <Package size={14} className="text-[#3A6131]/70"/> In Stock
                  </div>
                </div>

                {/* Description */}
                <p className="text-sm text-[#3A6131]/75 leading-[1.65] mb-6 pt-2">
                  {product.description ??
                    "Crafted from a premium, breathable fabric blend, this piece offers a relaxed fit without compromising on structure. Features reinforced stitching and a soft-touch finish. Machine washable."}
                </p>

                {/* Color Selector */}
                <div className="mb-6">
                  <p className="text-xs font-bold uppercase tracking-[0.08em] text-[#3A6131]/50 mb-3">
                    Color: <span className="text-[#3A6131] capitalize">{selectedColor.name}</span>
                  </p>
                  <div className="flex gap-3">
                    {MOCK_COLORS.map((color) => (
                      <button
                        key={color.id}
                        onClick={() => setSelectedColor(color)}
                        className={`relative w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                          selectedColor.id === color.id ? "ring-2 ring-offset-2 ring-offset-[#FFFCEB] ring-[#3A6131]" : "hover:scale-110"
                        }`}
                      >
                        <span 
                          className="w-full h-full rounded-full border border-black/10 shadow-sm"
                          style={{ backgroundColor: color.hex }}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Size Selector with Guide */}
                <div className="mb-8">
                  <div className="flex justify-between items-end mb-3">
                    <p className="text-xs font-bold uppercase tracking-[0.08em] text-[#3A6131]/50 mb-0">
                      Choose Size
                    </p>
                    <button className="text-xs font-bold text-[#3A6131] underline hover:text-[#F7B71D] flex items-center gap-1 transition-colors">
                      <Ruler size={13} /> Size Guide
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {SIZES.map((size) => (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        className={`py-2 rounded-lg border-[1.5px] text-[13px] font-bold transition-all duration-200 ${
                          selectedSize === size
                            ? "bg-[#3A6131] border-[#3A6131] text-[#FFFCEB] shadow-md"
                            : "bg-white border-[#3A6131]/20 text-[#3A6131] hover:bg-[#3A6131]/5 hover:border-[#3A6131]"
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Qty + Actions */}
                <div className="flex gap-2.5 items-center mt-auto">
                  {/* Quantity */}
                  <div className="flex items-center border-[1.5px] border-[#3A6131]/20 rounded-xl overflow-hidden bg-white h-[46px] w-[110px]">
                    <button
                      onClick={handleDecrease}
                      className="w-10 h-full flex items-center justify-center text-[#3A6131] transition-colors hover:bg-[#3A6131]/10"
                    >
                      <Minus size={16} />
                    </button>
                    <span className="flex-1 text-center text-base font-bold text-[#3A6131]">
                      {quantity}
                    </span>
                    <button
                      onClick={handleIncrease}
                      className="w-10 h-full flex items-center justify-center text-[#3A6131] transition-colors hover:bg-[#3A6131]/10"
                    >
                      <Plus size={16} />
                    </button>
                  </div>

                  {/* Add to Cart */}
                  <button className="flex-1 h-[46px] rounded-xl bg-[#3A6131] text-[#FFFCEB] text-[15px] font-bold flex items-center justify-center gap-2 transition-opacity hover:opacity-90 shadow-md">
                    <ShoppingCart size={18} /> Add to Cart
                  </button>
                </div>
              </div>
            </div>

            {/* ── REVIEWS SECTION ── */}
            <div className="border-t border-[#3A6131]/10 p-6 sm:p-8 bg-[#FFF9D7]">
              
              {/* Reviews header */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 mb-8">
                {/* Overall score */}
                <div className="flex flex-col items-center justify-center min-w-[150px] bg-white rounded-2xl p-4 border border-[#3A6131]/10 shadow-sm">
                  <span className="font-inter text-[50px] font-black text-[#3A6131] leading-none mb-1">
                    4.8
                  </span>
                  <div className="mb-1">
                    <StarRow rating={4.8} size={15} />
                  </div>
                  <span className="text-[12px] font-bold text-[#3A6131]/50">92% Recommend</span>
                </div>

                {/* Filter chips */}
                <div className="flex flex-wrap gap-2 flex-1">
                  {FILTERS.map((f) => (
                    <button
                      key={f}
                      onClick={() => setActiveFilter(f)}
                      className={`px-3.5 py-1.5 rounded-full text-[13px] font-bold border-[1.5px] transition-all duration-200 ${
                        activeFilter === f
                          ? "bg-[#3A6131] border-[#3A6131] text-[#FFFCEB]"
                          : "bg-white border-[#3A6131]/15 text-[#3A6131] hover:border-[#3A6131]"
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              {/* Review cards */}
              <div className="flex flex-col gap-4">
                {mockReviews.map((review, idx) => {
                  const av = avatarColors[idx % avatarColors.length];
                  return (
                    <div
                      key={review.id}
                      className="bg-white rounded-2xl p-5 border border-[#3A6131]/10 shadow-sm transition-shadow hover:shadow-md"
                    >
                      {/* Reviewer row */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-[15px] shrink-0"
                            style={{ background: av.bg, color: av.text }}
                          >
                            {review.user.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-sm text-[#3A6131] m-0">
                              {review.user}
                            </p>
                            <p className="text-[11px] font-bold text-[#A0AAB2] m-0 mt-0.5 uppercase tracking-wide">
                              {review.date} <span className="mx-1">·</span> {review.color} <span className="mx-1">·</span> {review.size}
                            </p>
                          </div>
                        </div>
                        <button className="text-[#D9D9D9] hover:text-[#3A6131] transition-colors">
                          <MoreHorizontal size={18} />
                        </button>
                      </div>

                      <div className="mb-2.5">
                        <StarRow rating={review.rating} size={13} />
                      </div>

                      <p className="text-[13px] font-medium text-[#3A6131]/80 leading-[1.65] m-0">
                        {review.text}
                      </p>

                      {/* Review images */}
                      {review.hasImages && (
                        <div className="flex gap-2 mt-4">
                          {[1, 2, 3].map((i) => (
                            <div
                              key={i}
                              className="w-16 h-16 rounded-[10px] bg-[#eef7e9] flex items-center justify-center text-3xl border border-[#3A6131]/10 relative overflow-hidden cursor-pointer group"
                            >
                              <div className="absolute inset-0 bg-[#3A6131]/0 group-hover:bg-[#3A6131]/5 transition-colors z-10" />
                              {product.image}
                              
                              {i === 1 && (
                                <div className="absolute bottom-1 right-1 w-5 h-5 bg-[#3A6131]/80 rounded-full flex items-center justify-center z-20 shadow-sm backdrop-blur-sm">
                                  <Play size={9} fill="#FFFCEB" color="#FFFCEB" className="ml-0.5" />
                                </div>
                              )}
                              {i === 3 && (
                                <div className="absolute bottom-1 right-1 w-5 h-5 bg-[#3A6131]/80 rounded-full flex items-center justify-center text-[9px] font-bold text-[#FFFCEB] z-20 shadow-sm backdrop-blur-sm">
                                  +1
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Footer */}
                      <div className="flex items-center justify-between mt-4 pt-4 border-t border-[#3A6131]/5">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-[#3A6131]/60">
                          {review.verified && <BadgeCheck size={16} className="text-[#3A6131]" />}
                          Verified purchase
                        </div>
                        <button className="flex items-center gap-1.5 bg-transparent border border-[#3A6131]/15 rounded-full px-3 py-1.5 text-xs font-bold text-[#3A6131]/60 transition-colors hover:border-[#3A6131] hover:text-[#3A6131]">
                          <ThumbsUp size={13} strokeWidth={2.5}/> Helpful ({review.likes})
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};