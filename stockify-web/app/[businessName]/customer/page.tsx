"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  ShoppingBag,
  ShoppingCart,
  Search,
  SlidersHorizontal,
  Clock,
  Star,
  Truck,
  Heart,
  Plus,
  LayoutGrid,
  ClipboardList,
  User,
  MapPin
} from "lucide-react";

// --- Mock Data ---
const categories = ["All", "Coffee", "Tea", "Pastries", "Sandwiches"];

const products = [
  {
    id: 1,
    name: "Earl Grey",
    description: "Classic black tea with bergamot",
    rating: 4.6,
    price: "130.00",
    image: "🍵",
  },
  {
    id: 2,
    name: "Brewed Coffee",
    description: "Freshly Brewed using Arabica Beans",
    rating: 4.9,
    price: "125.00",
    image: "☕",
  },
  {
    id: 3,
    name: "Fresh Milk",
    description: "Fresh and bottled on the same day",
    rating: 4.6,
    price: "130.00",
    image: "🥛",
  },
  {
    id: 4,
    name: "Earl Grey",
    description: "Classic black tea with bergamot",
    rating: 4.6,
    price: "130.00",
    image: "🍵",
  },
  {
    id: 5,
    name: "Earl Grey",
    description: "Classic black tea with bergamot",
    rating: 4.6,
    price: "130.00",
    image: "🍵",
  },
  {
    id: 6,
    name: "Earl Grey",
    description: "Classic black tea with bergamot",
    rating: 4.6,
    price: "130.00",
    image: "🍵",
  },
];

// Banner Data
const banners = [
  {
    id: 1,
    title: "Special Opening Promo",
    subtitle: "Get 20% off on all freshly brewed coffee and signature teas. Limited time only!",
    bgGradient: "from-[#2A4725] to-[#385E31]"
  },
  {
    id: 2,
    title: "Freshly Baked Pastries",
    subtitle: "Taste our new croissants and muffins. The perfect pairing for your morning coffee.",
    bgGradient: "from-[#385E31] to-[#4A7540]"
  },
  {
    id: 3,
    title: "Happy Hour Deals",
    subtitle: "Buy 1 Get 1 on selected iced beverages from 2 PM to 5 PM daily.",
    bgGradient: "from-[#1a2e17] to-[#2A4725]"
  }
];

export default function ShopStorefront() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [activeTab, setActiveTab] = useState("Shop");
  const [currentSlide, setCurrentSlide] = useState(0);

  // Auto-scroll logic for the banner
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % banners.length);
    }, 5000); // Changes slide every 5 seconds

    return () => clearInterval(timer); // Cleanup on unmount
  }, []);

  return (
    <div className="min-h-screen w-full bg-[#FFFCEB] font-['Inter'] flex flex-col overflow-x-hidden">
      {/* ── Header ── */}
      <header className="w-full flex flex-col items-center bg-[#385E31] shadow-md z-10">
        <div className="w-full max-w-[1470px] px-6 py-4 flex justify-between items-center">
          
          {/* Shop Info */}
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 flex items-center justify-center text-[#F7B71D]">
              <ShoppingBag size={32} strokeWidth={2.5} />
            </div>
            <div className="flex flex-col">
              <h1 className="text-[#F7B71D] text-[20px] font-extrabold tracking-wide uppercase">
                [Shop Name]
              </h1>
              <p className="text-[#F7B71D]/80 text-[12px] font-medium flex items-center gap-1 mt-0.5">
                <MapPin size={12} /> [Store Address]
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button className="w-10 h-10 rounded-[10px] flex items-center justify-center text-[#F7B71D] hover:bg-[#F7B71D]/10 transition-colors">
              <ShoppingCart size={22} />
            </button>
            <button className="w-10 h-10 border-2 border-[#F7B71D] rounded-[10px] flex items-center justify-center text-[#F7B71D] hover:bg-[#F7B71D]/10 transition-colors">
              <span className="text-[14px] font-bold">SC</span>
            </button>
          </div>
        </div>

        {/* Info Strip */}
        <div className="w-full bg-[#2A4725] flex justify-center py-2.5 gap-8">
          <div className="flex items-center gap-2 text-[#F7B71D] text-[12px] font-medium">
            <Clock size={14} className="text-[#F7B71D]" />
            <span>Open: 10:00 AM - 9:00 PM</span>
          </div>
          <div className="w-px h-4 bg-[#F7B71D]/30" />
          <div className="flex items-center gap-2 text-[#F7B71D] text-[12px] font-medium">
            <Star size={14} fill="#F7B71D" color="#F7B71D" />
            <span>4.8 Rating (127 reviews)</span>
          </div>
          <div className="w-px h-4 bg-[#F7B71D]/30" />
          <div className="flex items-center gap-2 text-[#F7B71D] text-[12px] font-medium">
            <Truck size={14} className="text-[#F7B71D]" />
            <span>Delivery fee starts at ₱25</span>
          </div>
        </div>
      </header>

      {/* ── Main Content ── */}
      <main className="flex-1 w-full max-w-[1300px] mx-auto px-6 py-8 flex flex-col gap-6">
        
        {/* ── Auto-Scrolling Image Banner Carousel ── */}
        <div className="w-full h-48 sm:h-64 rounded-[20px] relative overflow-hidden shadow-md bg-[#385E31]">
          <motion.div 
            className="flex w-full h-full"
            animate={{ x: `-${currentSlide * 100}%` }}
            transition={{ type: "tween", ease: "easeInOut", duration: 0.6 }}
          >
            {banners.map((banner) => (
              <div 
                key={banner.id} 
                className={`w-full h-full flex-shrink-0 bg-gradient-to-r ${banner.bgGradient} relative flex items-center justify-center`}
              >
                {/* Decorative Glows */}
                <div className="absolute -right-16 -top-16 w-64 h-64 bg-[#F7B71D]/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -left-16 -bottom-16 w-64 h-64 bg-[#FFFCEB]/10 rounded-full blur-3xl pointer-events-none" />
                
                {/* Banner Content */}
                <div className="relative z-10 flex flex-col items-center text-center px-6">
                  <h2 className="text-[#F7B71D] text-[28px] sm:text-[36px] font-black tracking-wide uppercase mb-2 drop-shadow-md">
                    {banner.title}
                  </h2>
                  <p className="text-[#FFFCEB] text-[14px] sm:text-[16px] font-medium max-w-[500px] drop-shadow-md">
                    {banner.subtitle}
                  </p>
                </div>
              </div>
            ))}
          </motion.div>

          {/* Carousel Dots */}
          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 z-20">
            {banners.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`h-2.5 rounded-full transition-all duration-300 ${
                  currentSlide === index 
                    ? "w-8 bg-[#F7B71D]" 
                    : "w-2.5 bg-[#FFFCEB]/50 hover:bg-[#FFFCEB]/80"
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="inline-flex bg-[#FFFCEB] border border-[#385E31]/20 rounded-[40px] p-1 shadow-sm self-start">
          {["Shop", "My Orders", "Favorites", "Account"].map((tab) => {
            const isActive = activeTab === tab;
            const icons: Record<string, React.ReactNode> = {
              "Shop": <LayoutGrid size={16} />,
              "My Orders": <ClipboardList size={16} />,
              "Favorites": <Heart size={16} />,
              "Account": <User size={16} />
            };
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex items-center gap-2 px-5 py-2 rounded-[40px] text-[13px] font-bold transition-colors ${
                  isActive 
                    ? "bg-[#385E31] text-[#FFFCEB] shadow-sm" 
                    : "text-[#385E31] hover:bg-[#385E31]/5"
                }`}
              >
                {icons[tab]} {tab}
              </button>
            );
          })}
        </div>

        {/* Search & Filters */}
        <div className="flex gap-3 items-center w-full">
          <div className="flex-1 relative flex items-center">
            <Search className="absolute left-4 text-[#385E31]/50" size={18} />
            <input
              type="text"
              placeholder="Search products..."
              className="w-full bg-[#FFFCEB] border border-[#385E31]/30 rounded-[40px] pl-11 pr-4 py-3 text-[14px] text-[#385E31] placeholder:text-[#385E31]/50 focus:outline-none focus:border-[#385E31] transition-colors shadow-sm"
            />
          </div>
          <button className="flex items-center gap-2 bg-[#FFFCEB] border border-[#385E31]/30 text-[#385E31] px-6 py-3 rounded-[40px] text-[14px] font-bold hover:bg-[#385E31]/5 transition-colors shadow-sm">
            <SlidersHorizontal size={18} /> Filters
          </button>
        </div>

        {/* Categories */}
        <div className="flex gap-2 w-full overflow-x-auto pb-2 scrollbar-hide">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`whitespace-nowrap px-6 py-2 rounded-[40px] text-[14px] font-bold border transition-colors shadow-sm ${
                activeCategory === cat
                  ? "bg-[#385E31] border-[#385E31] text-[#FFFCEB]"
                  : "bg-[#FFFCEB] border-[#385E31]/30 text-[#385E31] hover:bg-[#385E31]/5"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Product Grid */}
        <motion.div 
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-12"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
          }}
        >
          {products.map((product) => (
            <motion.div
              key={product.id}
              variants={{
                hidden: { opacity: 0, y: 15 },
                visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 25 } }
              }}
              className="bg-[#FFFCEB] border border-[#385E31]/20 rounded-[10px] p-5 flex flex-col shadow-sm hover:shadow-md transition-shadow"
            >
              {/* Product Image Placeholder */}
              <div className="w-full aspect-square flex items-center justify-center mb-4 bg-gradient-to-b from-[#385E31]/5 to-transparent rounded-[8px]">
                <span className="text-[80px] drop-shadow-md">{product.image}</span>
              </div>
              
              {/* Info */}
              <div className="flex flex-col flex-1">
                <h3 className="text-[#385E31] text-[16px] font-extrabold mb-1">
                  {product.name}
                </h3>
                <p className="text-[#385E31]/70 text-[12px] font-medium leading-relaxed mb-4 flex-1">
                  {product.description}
                </p>
                
                <div className="flex justify-between items-end mb-5">
                  <div className="flex items-center gap-1.5 bg-[#FFFCEB] border border-[#385E31]/10 px-2 py-1 rounded-[4px]">
                    <Star size={14} fill="#F7B71D" color="#F7B71D" />
                    <span className="text-[#385E31] text-[12px] font-bold">
                      {product.rating}
                    </span>
                  </div>
                  <div className="text-[#385E31] text-[20px] font-black tracking-tight">
                    ₱{product.price}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button className="flex-1 bg-[#385E31] text-[#FFFCEB] flex justify-center items-center gap-2 py-2.5 rounded-[8px] font-bold text-[13px] hover:opacity-90 transition-opacity shadow-sm">
                    <Plus size={16} /> Add to Cart
                  </button>
                  <button className="w-11 h-11 border border-[#385E31]/30 rounded-[8px] flex items-center justify-center text-[#385E31] hover:bg-[#385E31]/5 transition-colors">
                    <Heart size={18} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </main>
    </div>
  );
}