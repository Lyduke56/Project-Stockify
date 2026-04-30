"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation"; // <-- 1. Import useRouter
import {
  ShoppingBag,
  ShoppingCart,
  Search,
  SlidersHorizontal,
  Clock,
  Star,
  Truck,
  MapPin,
  Heart,
  User,
  ChevronRight
} from "lucide-react";

// --- Component Imports ---
import { ProductCard } from "@/components/cards/storefront/product-card";
import { ProductModal } from "@/components/modals/storefront/fnb/product-modal";

// --- Expanded Mock Data ---
const categories = ["All Products", "Coffee", "Tea", "Pastries", "Sandwiches", "Cold Drinks"];

const products = [
  { id: 1, name: "Earl Grey", category: "Tea", description: "Classic black tea with a hint of bergamot", rating: 4.6, price: "130.00", image: "🍵" },
  { id: 2, name: "House Brew", category: "Coffee", description: "Freshly brewed signature Arabica blend", rating: 4.9, price: "125.00", image: "☕" },
  { id: 3, name: "Farm Fresh Milk", category: "Cold Drinks", description: "Locally sourced, bottled daily", rating: 4.6, price: "130.00", image: "🥛" },
  { id: 4, name: "Iced Caramel Latte", category: "Coffee", description: "Double espresso, cold milk, caramel drizzle", rating: 4.8, price: "165.00", image: "🧊" },
  { id: 5, name: "Butter Croissant", category: "Pastries", description: "Authentic buttery, flaky French pastry", rating: 4.7, price: "95.00", image: "🥐" },
  { id: 6, name: "Classic Club", category: "Sandwiches", description: "Triple-decker with turkey, bacon, and greens", rating: 4.5, price: "180.00", image: "🥪" },
  { id: 7, name: "Matcha Green Tea", category: "Tea", description: "Ceremonial grade matcha with steamed milk", rating: 4.9, price: "160.00", image: "🍵" },
  { id: 8, name: "Blueberry Muffin", category: "Pastries", description: "Warm muffin bursting with wild blueberries", rating: 4.6, price: "110.00", image: "🧁" },
  { id: 9, name: "Avocado Toast", category: "Sandwiches", description: "Smashed avocado on artisan sourdough", rating: 4.8, price: "195.00", image: "🥑" },
  { id: 10, name: "Iced Peach Tea", category: "Cold Drinks", description: "Refreshing black tea with sweet peach nectar", rating: 4.7, price: "140.00", image: "🍹" },
  { id: 11, name: "Espresso Shot", category: "Coffee", description: "Rich, bold, and highly concentrated", rating: 4.5, price: "90.00", image: "☕" },
  { id: 12, name: "Cinnamon Roll", category: "Pastries", description: "Warm pastry topped with cream cheese icing", rating: 4.9, price: "135.00", image: "🥨" },
];

const banners = [
  { id: 1, title: "Special Opening Promo", subtitle: "Get 20% off on all freshly brewed coffee and signature teas.", bgGradient: "from-[#2A4725] to-[#385E31]", image: "✨" },
  { id: 2, title: "Freshly Baked Pastries", subtitle: "Taste our new premium croissants and muffins.", bgGradient: "from-[#385E31] to-[#4A7540]", image: "🥐" },
  { id: 3, title: "Happy Hour Deals", subtitle: "Buy 1 Get 1 on selected iced beverages from 2 PM to 5 PM.", bgGradient: "from-[#2A4725] to-[#1a2e17]", image: "🧊" }
];

export default function ShopStorefront() {
  const router = useRouter(); // <-- 2. Initialize the router

  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);
  
  // Modals & Drawers
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const handleOpenProduct = (product: any) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  const filteredProducts = products.filter(product => {
    const matchesCategory = activeCategory === "All Products" || activeCategory === "All" || product.category === activeCategory;
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          product.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen w-full bg-[#FFFCEB] font-['Inter'] flex flex-col overflow-x-hidden text-[#3A6131]">
      
      {/* ── Top Status Bar ── */}
      <div className="w-full bg-[#2A4725] flex justify-center py-2 px-4 gap-4 sm:gap-8 overflow-hidden whitespace-nowrap">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="flex items-center gap-2 text-[#F7B71D] text-[11px] sm:text-[12px] font-medium">
          <Clock size={14} /> <span className="hidden sm:inline">Open: 10:00 AM - 9:00 PM</span><span className="sm:hidden">10AM - 9PM</span>
        </motion.div>
        <div className="w-px h-4 bg-[#F7B71D]/30" />
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="flex items-center gap-2 text-[#F7B71D] text-[11px] sm:text-[12px] font-medium">
          <Star size={14} fill="#F7B71D" /> <span>4.8 Rating</span>
        </motion.div>
        <div className="w-px h-4 bg-[#F7B71D]/30" />
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="flex items-center gap-2 text-[#F7B71D] text-[11px] sm:text-[12px] font-medium">
          <Truck size={14} /> <span className="hidden sm:inline">Delivery starts at ₱25</span><span className="sm:hidden">₱25 Delivery</span>
        </motion.div>
      </div>

      {/* ── Main Sticky Header ── */}
      <header className={`w-full sticky top-0 z-40 transition-all duration-300 ${isScrolled ? 'bg-[#385E31] shadow-lg' : 'bg-[#385E31]'}`}>
        <div className="w-full max-w-[1470px] mx-auto px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center gap-4">
          
          <motion.div whileHover={{ scale: 1.02 }} className="flex items-center gap-3 cursor-pointer min-w-max">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#F7B71D]/10 rounded-xl flex items-center justify-center text-[#F7B71D]">
              <ShoppingBag size={28} strokeWidth={2.5} />
            </div>
            <div className="hidden sm:flex flex-col">
              <h1 className="text-[#F7B71D] text-[18px] sm:text-[20px] font-extrabold tracking-wide uppercase leading-tight">Lumina Cafe</h1>
              <p className="text-[#F7B71D]/80 text-[11px] font-medium flex items-center gap-1">
                <MapPin size={10} /> Cebu City, PH
              </p>
            </div>
          </motion.div>

          <div className="flex-1 max-w-2xl hidden md:flex items-center relative group">
            <Search className="absolute left-4 text-[#FFFCEB]/50 group-focus-within:text-[#F7B71D] transition-colors" size={18} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for coffee, pastries..."
              className="w-full bg-[#2A4725]/50 border border-[#FFFCEB]/10 rounded-[12px] pl-11 pr-4 py-2.5 text-[14px] text-[#FFFCEB] placeholder:text-[#FFFCEB]/50 focus:outline-none focus:border-[#F7B71D]/50 focus:bg-[#2A4725] transition-all"
            />
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="w-10 h-10 rounded-[10px] flex items-center justify-center text-[#F7B71D] hover:bg-[#F7B71D]/10 relative">
              <Heart size={22} />
            </motion.button>
            {/* 3. ROUTE TO SHOPPING CART PAGE */}
            <motion.button 
              onClick={() => router.push('shopping-cart')} 
              whileHover={{ scale: 1.05 }} 
              whileTap={{ scale: 0.95 }} 
              className="w-10 h-10 rounded-[10px] flex items-center justify-center text-[#F7B71D] hover:bg-[#F7B71D]/10 relative"
            >
              <ShoppingCart size={22} />
              <span className="absolute top-1 right-1 w-4 h-4 bg-[#F7B71D] text-[#385E31] text-[10px] font-bold flex items-center justify-center rounded-full">3</span>
            </motion.button>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="w-10 h-10 border-2 border-[#F7B71D]/50 hover:border-[#F7B71D] rounded-[10px] flex items-center justify-center text-[#F7B71D] bg-[#2A4725]/30 ml-2">
              <User size={18} />
            </motion.button>
          </div>
        </div>
      </header>

      {/* ── Main Content ── */}
      <main className="flex-1 w-full max-w-[1300px] mx-auto px-4 sm:px-6 py-6 sm:py-8 flex flex-col gap-8">
        
        {/* Animated Hero Banner */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full h-56 sm:h-72 rounded-[24px] relative overflow-hidden shadow-xl group cursor-pointer">
          <motion.div className="flex w-full h-full" animate={{ x: `-${currentSlide * 100}%` }} transition={{ type: "spring", stiffness: 300, damping: 30 }}>
            {banners.map((banner) => (
              <div key={banner.id} className={`w-full h-full flex-shrink-0 bg-gradient-to-br ${banner.bgGradient} relative flex items-center justify-center sm:justify-start sm:px-16`}>
                <div className="absolute right-[-10%] top-[-20%] w-[300px] h-[300px] bg-[#FFFCEB]/5 rounded-full blur-3xl pointer-events-none" />
                <div className="relative z-10 flex flex-col items-center sm:items-start text-center sm:text-left px-6">
                  <h2 className="text-[#F7B71D] text-[28px] sm:text-[40px] font-black uppercase tracking-tight mb-2 drop-shadow-md">{banner.title}</h2>
                  <p className="text-[#FFF9D7] text-[15px] sm:text-[18px] font-medium max-w-[400px]">{banner.subtitle}</p>
                  <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="mt-6 bg-[#F7B71D] text-[#2A4725] px-6 py-2.5 rounded-full font-bold text-[14px] flex items-center gap-2 shadow-lg">
                    Order Now <ChevronRight size={16} />
                  </motion.button>
                </div>
              </div>
            ))}
          </motion.div>
          <div className="absolute bottom-4 left-0 w-full flex justify-center gap-2 z-20">
            {banners.map((_, idx) => (
              <button key={idx} onClick={() => setCurrentSlide(idx)} className={`transition-all duration-300 rounded-full ${currentSlide === idx ? 'w-6 h-2 bg-[#F7B71D]' : 'w-2 h-2 bg-[#FFFCEB]/40 hover:bg-[#FFFCEB]/80'}`} />
            ))}
          </div>
        </motion.div>

        {/* Filters */}
        <div className="flex flex-col gap-4 sticky top-[72px] sm:top-[80px] z-30 bg-[#FFFCEB]/95 backdrop-blur-md pt-4 -mx-4 px-4 sm:mx-0 sm:px-0">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <h2 className="text-[24px] font-bold text-[#3A6131] flex items-center gap-2">Our Menu</h2>
            <button className="flex items-center gap-2 bg-white border border-[#3A6131]/20 text-[#3A6131] px-5 py-2.5 rounded-full text-[14px] font-bold shadow-sm hover:bg-[#F7B71D]/10 transition-colors">
              <SlidersHorizontal size={20} /> Filters
            </button>
          </div>
          <div className="flex gap-2 w-full overflow-x-auto pb-2 scrollbar-hide relative">
            {categories.map((cat) => (
              <button key={cat} onClick={() => setActiveCategory(cat)} className="relative whitespace-nowrap px-6 py-2.5 rounded-full text-[14px] font-bold transition-colors z-10">
                {activeCategory === cat ? <span className="text-[#3A6131] relative z-10">{cat}</span> : <span className="text-[#3A6131]/60 hover:text-[#3A6131] relative z-10">{cat}</span>}
                {activeCategory === cat && <motion.div layoutId="activeCategoryBg" className="absolute inset-0 bg-[#FFD980] rounded-full z-0 shadow-sm border border-[#F7B71D]/30" transition={{ type: "spring", stiffness: 400, damping: 30 }} />}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        <motion.div layout className="min-h-[400px]">
          <AnimatePresence mode="popLayout">
            {filteredProducts.length > 0 ? (
              <motion.div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6 pb-12" initial="hidden" animate="visible" variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.05 } } }}>
                {filteredProducts.map((product) => (
                  <motion.div key={product.id} layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ duration: 0.2 }}>
                    <ProductCard product={product} onOpenModal={handleOpenProduct} />
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full flex flex-col items-center justify-center py-20 text-[#3A6131]/50">
                <Search size={48} className="mb-4 opacity-20" />
                <p className="text-lg font-medium">No items found matching "{searchQuery}"</p>
                <button onClick={() => {setSearchQuery(""); setActiveCategory("All Products");}} className="mt-4 text-[#F7B71D] font-bold hover:underline">Clear search</button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </main>

      <ProductModal product={selectedProduct} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />

    </div>
  );
}