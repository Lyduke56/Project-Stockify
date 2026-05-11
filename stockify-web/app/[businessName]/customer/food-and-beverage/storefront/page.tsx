"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, useParams } from "next/navigation";
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
  ChevronRight,
} from "lucide-react";

// --- Component Imports ---
import { FnbProductCard } from "@/components/cards/storefront/fnb-product-card";
import { ProductModal } from "@/components/modals/storefront/fnb/fnb-product-modal";
import { CheckoutModal } from "@/components/modals/customer/checkout-modal";
import type { FnbProduct } from "@/components/cards/storefront/fnb-product-card";
import { useCart } from "@/lib/customer/cart-context";

// --- DB Hooks ---
import { createClient } from "@/lib/supabase/client";
import {
  getStorefrontTenant,
  getProductCategories,
  getFnbProducts,
} from "@/backend/hooks/getStoreFront";
import type { StorefrontTenant, ProductCategory } from "@/backend/hooks/getStoreFront";

// --- Static Banners (no banners table in schema) ---
const banners = [
  {
    id: 1,
    title: "Special Opening Promo",
    subtitle: "Get 20% off on all freshly brewed coffee and signature teas.",
    bgGradient: "from-[#2A4725] to-[#385E31]",
  },
  {
    id: 2,
    title: "Freshly Baked Pastries",
    subtitle: "Taste our new premium croissants and muffins.",
    bgGradient: "from-[#385E31] to-[#4A7540]",
  },
  {
    id: 3,
    title: "Happy Hour Deals",
    subtitle: "Buy 1 Get 1 on selected iced beverages from 2 PM to 5 PM.",
    bgGradient: "from-[#2A4725] to-[#1a2e17]",
  },
];

// --- Skeleton Card ---
const SkeletonCard = () => (
  <div className="bg-[#FFFCEB] border border-[#385E31]/20 rounded-[10px] p-5 flex flex-col gap-3 animate-pulse">
    <div className="w-full aspect-square bg-[#385E31]/10 rounded-[8px]" />
    <div className="h-4 bg-[#385E31]/10 rounded w-3/4" />
    <div className="h-3 bg-[#385E31]/10 rounded w-full" />
    <div className="h-3 bg-[#385E31]/10 rounded w-2/3" />
    <div className="flex justify-between mt-2">
      <div className="h-6 bg-[#385E31]/10 rounded w-16" />
      <div className="h-6 bg-[#385E31]/10 rounded w-20" />
    </div>
    <div className="h-10 bg-[#385E31]/10 rounded-[8px] mt-1" />
  </div>
);

export default function FnbStorefront() {
  const router = useRouter();
  const params = useParams();
  const businessName = params?.businessName as string;

  // ─── Data State ─────────────────────────────────────────────────────────────
  const [tenant, setTenant] = useState<StorefrontTenant | null>(null);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [products, setProducts] = useState<FnbProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ─── UI State ────────────────────────────────────────────────────────────────
  const [activeCategory, setActiveCategory] = useState("All Products");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<FnbProduct | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  const { cartCount } = useCart();

  // ─── Fetch Data ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.push(`/${businessName}/login`);
          return;
        }

        const tenantData = await getStorefrontTenant(user.id);
        if (!tenantData) throw new Error("Could not load store information.");

        const [cats, prods] = await Promise.all([
          getProductCategories(tenantData.tenant_id),
          getFnbProducts(tenantData.tenant_id),
        ]);

        setTenant(tenantData);
        setCategories(cats);
        setProducts(prods);
      } catch (err: any) {
        setError(err.message ?? "Something went wrong.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [businessName, router]);

  // ─── Scroll + Slide ──────────────────────────────────────────────────────────
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const timer = setInterval(
      () => setCurrentSlide((prev) => (prev + 1) % banners.length),
      5000
    );
    return () => clearInterval(timer);
  }, []);

  // ─── Derived Data ────────────────────────────────────────────────────────────
  const categoryTabs = ["All Products", ...categories.map((c) => c.name)];

  const filteredProducts = products.filter((p) => {
    const matchesCategory =
      activeCategory === "All Products" || p.category_name === activeCategory;
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.description ?? "").toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleOpenProduct = (product: FnbProduct) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  // ─── Error State ─────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="min-h-screen bg-[#FFFCEB] flex items-center justify-center text-[#385E31]">
        <div className="text-center">
          <p className="text-lg font-bold mb-2">Failed to load storefront</p>
          <p className="text-sm opacity-60">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#FFFCEB] font-['Inter'] flex flex-col overflow-x-hidden text-[#3A6131]">

      {/* ── Top Status Bar ── */}
      <div className="w-full bg-[#2A4725] flex justify-center py-2 px-4 gap-4 sm:gap-8 overflow-hidden whitespace-nowrap">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex items-center gap-2 text-[#F7B71D] text-[11px] sm:text-[12px] font-medium"
        >
          <Clock size={14} />
          <span className="hidden sm:inline">Open: 10:00 AM - 9:00 PM</span>
          <span className="sm:hidden">10AM - 9PM</span>
        </motion.div>
        <div className="w-px h-4 bg-[#F7B71D]/30" />
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex items-center gap-2 text-[#F7B71D] text-[11px] sm:text-[12px] font-medium"
        >
          <Star size={14} fill="#F7B71D" />
          <span>4.8 Rating</span>
        </motion.div>
        <div className="w-px h-4 bg-[#F7B71D]/30" />
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex items-center gap-2 text-[#F7B71D] text-[11px] sm:text-[12px] font-medium"
        >
          <Truck size={14} />
          <span className="hidden sm:inline">Delivery starts at ₱25</span>
          <span className="sm:hidden">₱25 Delivery</span>
        </motion.div>
      </div>

      {/* ── Sticky Header ── */}
      <header
        className={`w-full sticky top-0 z-40 transition-all duration-300 ${
          isScrolled ? "bg-[#385E31] shadow-lg" : "bg-[#385E31]"
        }`}
      >
        <div className="w-full max-w-[1470px] mx-auto px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center gap-4">
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="flex items-center gap-3 cursor-pointer min-w-max"
          >
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#F7B71D]/10 rounded-xl flex items-center justify-center text-[#F7B71D]">
              {tenant?.logo_url ? (
                <img
                  src={tenant.logo_url}
                  alt={tenant.business_name}
                  className="w-full h-full object-cover rounded-xl"
                />
              ) : (
                <ShoppingBag size={28} strokeWidth={2.5} />
              )}
            </div>
            <div className="hidden sm:flex flex-col">
              <h1 className="text-[#F7B71D] text-[18px] sm:text-[20px] font-extrabold tracking-wide uppercase leading-tight">
                {tenant?.business_name ?? businessName?.replace(/-/g, " ")}
              </h1>
              <p className="text-[#F7B71D]/80 text-[11px] font-medium flex items-center gap-1">
                <MapPin size={10} /> Cebu City, PH
              </p>
            </div>
          </motion.div>

          <div className="flex-1 max-w-2xl hidden md:flex items-center relative group">
            <Search
              className="absolute left-4 text-[#FFFCEB]/50 group-focus-within:text-[#F7B71D] transition-colors"
              size={18}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for coffee, pastries..."
              className="w-full bg-[#2A4725]/50 border border-[#FFFCEB]/10 rounded-[12px] pl-11 pr-4 py-2.5 text-[14px] text-[#FFFCEB] placeholder:text-[#FFFCEB]/50 focus:outline-none focus:border-[#F7B71D]/50 focus:bg-[#2A4725] transition-all"
            />
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-10 h-10 rounded-[10px] flex items-center justify-center text-[#F7B71D] hover:bg-[#F7B71D]/10"
            >
              <Heart size={22} />
            </motion.button>
            <motion.button
              onClick={() => setIsCheckoutOpen(true)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-10 h-10 rounded-[10px] flex items-center justify-center text-[#F7B71D] hover:bg-[#F7B71D]/10 relative"
            >
              <ShoppingCart size={22} />
              {cartCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-[#F7B71D] text-[#385E31] text-[10px] font-bold flex items-center justify-center rounded-full">
                  {cartCount}
                </span>
              )}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-10 h-10 border-2 border-[#F7B71D]/50 hover:border-[#F7B71D] rounded-[10px] flex items-center justify-center text-[#F7B71D] bg-[#2A4725]/30 ml-2"
            >
              <User size={18} />
            </motion.button>
          </div>
        </div>
      </header>

      {/* ── Main Content ── */}
      <main className="flex-1 w-full max-w-[1300px] mx-auto px-4 sm:px-6 py-6 sm:py-8 flex flex-col gap-8">

        {/* Hero Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full h-56 sm:h-72 rounded-[24px] relative overflow-hidden shadow-xl cursor-pointer"
        >
          <motion.div
            className="flex w-full h-full"
            animate={{ x: `-${currentSlide * 100}%` }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            {banners.map((banner) => (
              <div
                key={banner.id}
                className={`w-full h-full flex-shrink-0 bg-gradient-to-br ${banner.bgGradient} relative flex items-center justify-center sm:justify-start sm:px-16`}
              >
                <div className="absolute right-[-10%] top-[-20%] w-[300px] h-[300px] bg-[#FFFCEB]/5 rounded-full blur-3xl pointer-events-none" />
                <div className="relative z-10 flex flex-col items-center sm:items-start text-center sm:text-left px-6">
                  <h2 className="text-[#F7B71D] text-[28px] sm:text-[40px] font-black uppercase tracking-tight mb-2 drop-shadow-md">
                    {banner.title}
                  </h2>
                  <p className="text-[#FFF9D7] text-[15px] sm:text-[18px] font-medium max-w-[400px]">
                    {banner.subtitle}
                  </p>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="mt-6 bg-[#F7B71D] text-[#2A4725] px-6 py-2.5 rounded-full font-bold text-[14px] flex items-center gap-2 shadow-lg"
                  >
                    Order Now <ChevronRight size={16} />
                  </motion.button>
                </div>
              </div>
            ))}
          </motion.div>
          <div className="absolute bottom-4 left-0 w-full flex justify-center gap-2 z-20">
            {banners.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentSlide(idx)}
                className={`transition-all duration-300 rounded-full ${
                  currentSlide === idx
                    ? "w-6 h-2 bg-[#F7B71D]"
                    : "w-2 h-2 bg-[#FFFCEB]/40 hover:bg-[#FFFCEB]/80"
                }`}
              />
            ))}
          </div>
        </motion.div>

        {/* Filters */}
        <div className="flex flex-col gap-4 sticky top-[72px] sm:top-[80px] z-30 bg-[#FFFCEB]/95 backdrop-blur-md pt-4 -mx-4 px-4 sm:mx-0 sm:px-0">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <h2 className="text-[24px] font-bold text-[#3A6131]">Our Menu</h2>
            <button className="flex items-center gap-2 bg-white border border-[#3A6131]/20 text-[#3A6131] px-5 py-2.5 rounded-full text-[14px] font-bold shadow-sm hover:bg-[#F7B71D]/10 transition-colors">
              <SlidersHorizontal size={20} /> Filters
            </button>
          </div>
          <div className="flex gap-2 w-full overflow-x-auto pb-2 scrollbar-hide">
            {categoryTabs.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className="relative whitespace-nowrap px-6 py-2.5 rounded-full text-[14px] font-bold transition-colors z-10"
              >
                {activeCategory === cat ? (
                  <span className="text-[#3A6131] relative z-10">{cat}</span>
                ) : (
                  <span className="text-[#3A6131]/60 hover:text-[#3A6131] relative z-10">
                    {cat}
                  </span>
                )}
                {activeCategory === cat && (
                  <motion.div
                    layoutId="activeCategoryBg"
                    className="absolute inset-0 bg-[#FFD980] rounded-full z-0 shadow-sm border border-[#F7B71D]/30"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Product Grid */}
        <motion.div layout className="min-h-[400px]">
          <AnimatePresence mode="popLayout">
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6 pb-12">
                {Array.from({ length: 8 }).map((_, i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            ) : filteredProducts.length > 0 ? (
              <motion.div
                className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6 pb-12"
                initial="hidden"
                animate="visible"
                variants={{
                  hidden: { opacity: 0 },
                  visible: {
                    opacity: 1,
                    transition: { staggerChildren: 0.05 },
                  },
                }}
              >
                {filteredProducts.map((product) => (
                  <motion.div
                    key={product.product_id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.2 }}
                  >
                    <FnbProductCard
                      product={product}
                      onOpenModal={handleOpenProduct}
                    />
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="w-full flex flex-col items-center justify-center py-20 text-[#3A6131]/50"
              >
                <Search size={48} className="mb-4 opacity-20" />
                <p className="text-lg font-medium">
                  No items found{searchQuery ? ` matching "${searchQuery}"` : " in this category"}
                </p>
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setActiveCategory("All Products");
                  }}
                  className="mt-4 text-[#F7B71D] font-bold hover:underline"
                >
                  Clear filters
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </main>

      <ProductModal
        product={selectedProduct}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />

      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        tenantId={tenant?.tenant_id ?? ""}
        onSuccess={() => {}}
      />
    </div>
  );
}