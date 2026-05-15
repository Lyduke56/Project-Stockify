"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import {
  ShoppingBag,
  Search,
  SlidersHorizontal,
  Package,
  ShieldCheck,
  Truck,
  MapPin,
  ChevronRight,
} from "lucide-react";

// --- Component Imports ---
import { NfnbProductCard } from "@/components/cards/storefront/nfnb-product-card";
import { ProductModal } from "@/components/modals/storefront/nfnb/nfnb-product-modal";
import { CheckoutModal } from "@/components/modals/customer/checkout-modal";
import type { NfnbProduct } from "@/components/cards/storefront/nfnb-product-card";
import { CustomerHeader } from "@/components/headers/customer-header";
import { toggleFavorite, fetchFavorites } from "@/lib/customer/customer-actions";

// --- DB Hooks ---
import { createClient } from "@/lib/supabase/client";
import {
  getStorefrontTenant,
  getProductCategories,
  getNfnbProducts,
} from "@/backend/hooks/getStoreFront";
import type { StorefrontTenant, ProductCategory } from "@/backend/hooks/getStoreFront";

// --- Static Banners ---
const banners = [
  {
    id: 1,
    title: "End of Season Sale",
    subtitle: "Up to 40% off on all outerwear and selected accessories.",
    bgGradient: "from-[#2A4725] to-[#385E31]",
  },
  {
    id: 2,
    title: "New Arrivals",
    subtitle: "Explore our latest collection of sustainable everyday wear.",
    bgGradient: "from-[#385E31] to-[#4A7540]",
  },
  {
    id: 3,
    title: "Free Shipping",
    subtitle: "Enjoy free standard shipping nationwide on orders over ₱3,000.",
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

export default function NfnbStorefront() {
  const router = useRouter();
  const params = useParams();
  const businessName = params?.businessName as string;

  // ─── Data State ─────────────────────────────────────────────────────────────
  const [tenant, setTenant] = useState<StorefrontTenant | null>(null);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [products, setProducts] = useState<NfnbProduct[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ─── UI State ────────────────────────────────────────────────────────────────
  const [activeCategory, setActiveCategory] = useState("All Products");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentSlide, setCurrentSlide] = useState(0);
  const [selectedProduct, setSelectedProduct] = useState<NfnbProduct | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

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

        const [cats, prods, favs] = await Promise.all([
          getProductCategories(tenantData.tenant_id, "nfb_product"),
          getNfnbProducts(tenantData.tenant_id),
          fetchFavorites()
        ]);

        setTenant(tenantData);
        setCategories(cats);
        setProducts(prods);
        setFavorites(favs);
      } catch (err: any) {
        setError(err.message ?? "Something went wrong.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [businessName, router]);

  useEffect(() => {
    const timer = setInterval(
      () => setCurrentSlide((prev) => (prev + 1) % banners.length),
      5000
    );
    return () => clearInterval(timer);
  }, []);

  // ─── Realtime Updates ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!tenant) return;
    const supabase = createClient();

    // 1. Listen for Main NF&B Product quantity changes
    const productChannel = supabase
      .channel('nfb_products_realtime')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'nfb_products',
        filter: `tenant_id=eq.${tenant.tenant_id}`
      }, (payload: any) => {
        setProducts(prev => {
          const updated = prev.map(p =>
            p.product_id === payload.new.product_id
              ? { ...p, quantity: payload.new.quantity }
              : p
          );
          // Sync open modal
          if (selectedProduct?.product_id === payload.new.product_id) {
            setSelectedProduct(prevModal => prevModal ? { ...prevModal, quantity: payload.new.quantity } : null);
          }
          return updated;
        });
      })
      .subscribe();

    // 2. Listen for Variant-specific stock changes
    const variantChannel = supabase
      .channel('nfb_variants_realtime')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'nfb_variant_options',
        filter: `tenant_id=eq.${tenant.tenant_id}`
      }, (payload: any) => {
        setProducts(prev => {
          const updated = prev.map(p => ({
            ...p,
            variants: p.variants.map(v => ({
              ...v,
              options: v.options.map(o =>
                o.option_id === payload.new.option_id
                  ? { ...o, stock: payload.new.stock }
                  : o
              )
            }))
          }));

          // Sync open modal
          if (selectedProduct) {
            const updatedVariants = selectedProduct.variants.map(v => ({
              ...v,
              options: v.options.map(o =>
                o.option_id === payload.new.option_id
                  ? { ...o, stock: payload.new.stock }
                  : o
              )
            }));
            setSelectedProduct(prev => prev ? { ...prev, variants: updatedVariants } : null);
          }
          return updated;
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(productChannel);
      supabase.removeChannel(variantChannel);
    };
  }, [tenant]);

  const searchParams = useSearchParams();

  // Listen for ?checkout=true in the URL
  useEffect(() => {
    if (searchParams.get("checkout") === "true") {
      setIsCheckoutOpen(true);
      // Clean up the URL
      const newUrl = window.location.pathname;
      window.history.replaceState({}, "", newUrl);
    }
  }, [searchParams]);

  const handleToggleFavorite = async (productId: string) => {
    const { favorited, error } = await toggleFavorite(productId);
    if (!error) {
      setFavorites(prev =>
        favorited ? [...prev, productId] : prev.filter(id => id !== productId)
      );
    }
  };

  const handleOpenProduct = (product: NfnbProduct) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  // ─── Derived Data ────────────────────────────────────────────────────────────
  const categoryTabs = ["All Products", ...categories.map((c) => c.name)];

  const filteredProducts = products.filter((p) => {
    // Normalize names for safer comparison
    const pCatName = p.category_name || "Uncategorized";
    const activeCat = activeCategory || "All Products";

    const matchesCategory =
      activeCat === "All Products" || pCatName === activeCat;

    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.description ?? "").toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCategory && matchesSearch;
  });

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
          <Truck size={14} />
          <span className="hidden sm:inline">Free Shipping over ₱3,000</span>
          <span className="sm:hidden">Free Ship ₱3k</span>
        </motion.div>
        <div className="w-px h-4 bg-[#F7B71D]/30" />
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex items-center gap-2 text-[#F7B71D] text-[11px] sm:text-[12px] font-medium"
        >
          <ShieldCheck size={14} />
          <span>30-Day Returns</span>
        </motion.div>
        <div className="w-px h-4 bg-[#F7B71D]/30" />
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex items-center gap-2 text-[#F7B71D] text-[11px] sm:text-[12px] font-medium"
        >
          <Package size={14} />
          <span className="hidden sm:inline">Nationwide Delivery</span>
          <span className="sm:hidden">PH Delivery</span>
        </motion.div>
      </div>

      <CustomerHeader
        businessName={businessName}
        tenantLogo={tenant?.logo_url ?? undefined}
        tenantName={tenant?.business_name}
        onSearch={setSearchQuery}
      />

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
                    Shop Collection <ChevronRight size={16} />
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
                className={`transition-all duration-300 rounded-full ${currentSlide === idx
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
            <h2 className="text-[24px] font-bold text-[#3A6131]">Collections</h2>
            <button className="flex items-center gap-2 bg-white border border-[#3A6131]/20 text-[#3A6131] px-5 py-2.5 rounded-full text-[14px] font-bold shadow-sm hover:bg-[#F7B71D]/10 transition-colors">
              <SlidersHorizontal size={20} /> Filters & Sorting
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
                key={`grid-${activeCategory}`}
                className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6 pb-12"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
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
                    <NfnbProductCard
                      product={product}
                      onOpenModal={handleOpenProduct}
                      isFavorite={favorites.includes(product.product_id)}
                      onToggleFavorite={handleToggleFavorite}
                    />
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <motion.div
                key="empty-state"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
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
        onSuccess={() => { }}
      />
    </div>
  );
}