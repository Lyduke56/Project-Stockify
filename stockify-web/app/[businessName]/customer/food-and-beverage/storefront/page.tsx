"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import {
  Search,
  SlidersHorizontal,
  Clock,
  Phone,
  Package,
} from "lucide-react";

// --- Component Imports ---
import { FnbProductCard } from "@/components/cards/storefront/fnb-product-card";
import { FnbProductModal as ProductModal } from "@/components/modals/storefront/fnb/fnb-product-modal";
import { CheckoutModal } from "@/components/modals/customer/checkout-modal";
import { CustomerHeader } from "@/components/headers/customer-header";
import LoadingScreen from "@/app/loading-screen/loading";
import {
  toggleFavorite,
  fetchFavorites,
  fetchTopRatedProduct,
} from "@/lib/customer/customer-actions";

// --- DB Hooks ---
import { createClient } from "@/lib/supabase/client";
import {
  getStorefrontTenant,
  getProductCategories,
  getFnbProducts,
} from "@/backend/hooks/getStoreFront";
import type {
  StorefrontTenant,
  ProductCategory,
  FnbProduct,
  FnbProductSize,
} from "@/backend/hooks/getStoreFront";
import {
  fetchTenantSettings,
  type TenantSettings,
} from "@/lib/admin/settings-actions";
import {
  fetchStorefrontConfig,
  type StorefrontConfig,
} from "@/lib/admin/storefront-actions";

// --- Types ---
interface Banner {
  id: string | number;
  title?: string;
  subtitle?: string;
  type?: "text" | "image";
  image_url?: string | null;
  bg_color_1?: string;
  bg_color_2?: string;
  bgGradient?: string;
  font_color?: string;
}

interface TopRatedProduct {
  product_id: string;
  name: string;
  average_rating: number;
  product_type: string;
}

// --- Static Banners ---
const banners: Banner[] = [
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
  const [settings, setSettings] = useState<TenantSettings | null>(null);
  const [sfConfig, setSfConfig] = useState<StorefrontConfig | null>(null);
  const [topRatedProduct, setTopRatedProduct] = useState<TopRatedProduct | null>(null);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [products, setProducts] = useState<FnbProduct[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ─── UI State ────────────────────────────────────────────────────────────────
  const [activeCategory, setActiveCategory] = useState("All Products");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentSlide, setCurrentSlide] = useState(0);
  const [selectedProduct, setSelectedProduct] = useState<FnbProduct | null>(null);
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

        const [cats, prods, favs, sett, sf] = await Promise.all([
          getProductCategories(tenantData.tenant_id, "fnb_product"),
          getFnbProducts(tenantData.tenant_id),
          fetchFavorites(),
          fetchTenantSettings(tenantData.tenant_id),
          fetchStorefrontConfig(tenantData.tenant_id),
        ]);

        setTenant(tenantData);
        setSettings(sett);
        setSfConfig(sf);
        setCategories(cats);
        setProducts(prods);
        setFavorites(favs);

        fetchTopRatedProduct(tenantData.tenant_id, "fnb").then(
          (p: TopRatedProduct | null) => setTopRatedProduct(p)
        );
      } catch (err: unknown) {
        setError(
          err instanceof Error ? err.message : "Something went wrong."
        );
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

    const productChannel = supabase
      .channel("fnb_products_realtime")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "products",
          filter: `tenant_id=eq.${tenant.tenant_id}`,
        },
        (payload: { new: Pick<FnbProduct, "product_id" | "max_yield"> }) => {
          setProducts((prev) => {
            const updated = prev.map((p) =>
              p.product_id === payload.new.product_id
                ? { ...p, max_yield: payload.new.max_yield }
                : p
            );
            if (selectedProduct?.product_id === payload.new.product_id) {
              setSelectedProduct((prevModal) =>
                prevModal
                  ? { ...prevModal, max_yield: payload.new.max_yield }
                  : null
              );
            }
            return updated;
          });
        }
      )
      .subscribe();

    const sizeChannel = supabase
      .channel("fnb_sizes_realtime")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "product_sizes",
          filter: `tenant_id=eq.${tenant.tenant_id}`,
        },
        (payload: { new: Pick<FnbProductSize, "size_id" | "max_yield"> }) => {
          setProducts((prev) => {
            const updated = prev.map((p) => ({
              ...p,
              sizes: p.sizes.map((s) =>
                s.size_id === payload.new.size_id
                  ? { ...s, max_yield: payload.new.max_yield }
                  : s
              ),
            }));

            if (selectedProduct) {
              const hasSize = selectedProduct.sizes.some(
                (s) => s.size_id === payload.new.size_id
              );
              if (hasSize) {
                setSelectedProduct((prev) =>
                  prev
                    ? {
                        ...prev,
                        sizes: prev.sizes.map((s) =>
                          s.size_id === payload.new.size_id
                            ? { ...s, max_yield: payload.new.max_yield }
                            : s
                        ),
                      }
                    : null
                );
              }
            }
            return updated;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(productChannel);
      supabase.removeChannel(sizeChannel);
    };
  }, [tenant]);

  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get("checkout") === "true") {
      setIsCheckoutOpen(true);
      window.history.replaceState({}, "", window.location.pathname);
    }
    if (searchParams.get("favorites") === "true") {
      setActiveCategory("My Favorites");
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [searchParams]);

  const handleToggleFavorite = async (productId: string) => {
    const { favorited, error: toggleError } = await toggleFavorite(productId);
    if (!toggleError) {
      setFavorites((prev) =>
        favorited ? [...prev, productId] : prev.filter((id) => id !== productId)
      );
    }
  };

  const handleOpenProduct = (product: FnbProduct) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  const handleBannerClick = (banner: Banner) => {
    if (banner.id === "top-rated" && topRatedProduct) {
      const prod = products.find(
        (p) => p.product_id === topRatedProduct.product_id
      );
      if (prod) handleOpenProduct(prod);
    }
  };

  // ─── Derived Data ────────────────────────────────────────────────────────────
  const categoryTabs = [
    "All Products",
    "My Favorites",
    ...categories.map((c) => c.name),
  ];

  const filteredProducts = products.filter((p) => {
    const pCatName = p.category_name ?? "Uncategorized";
    const activeCat = activeCategory || "All Products";

    const matchesCategory =
      activeCat === "All Products" ||
      (activeCat === "My Favorites"
        ? favorites.includes(p.product_id)
        : pCatName === activeCat);

    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.description ?? "").toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  // ─── Derived colors ──────────────────────────────────────────────────────────
  const c = {
    primary: sfConfig?.color_primary ?? "#385E31",
    secondary: sfConfig?.color_secondary ?? "#2A4725",
    accent: sfConfig?.color_accent ?? "#F7B71D",
    bg: sfConfig?.color_background ?? "#FFFCEB",
    text: sfConfig?.color_text ?? "#3A6131",
    search_bar: sfConfig?.color_search_bar ?? undefined,
  };

  // ─── Build active banners ────────────────────────────────────────────────────
  const buildActiveBanners = (): Banner[] => {
    const base: Banner[] = sfConfig?.hero_banners?.length
      ? (sfConfig.hero_banners as Banner[])
      : banners;

    const active = [...base];

    if (topRatedProduct && topRatedProduct.product_type === "fnb") {
      active.unshift({
        id: "top-rated",
        type: "text",
        title: `★ Top Rated: ${topRatedProduct.name}`,
        subtitle: `Rated ${topRatedProduct.average_rating.toFixed(1)}/5 stars by our customers!`,
        font_color: "#FFFFFF",
        bg_color_1: c.accent,
        bg_color_2: c.primary,
        image_url: null,
      });
    }

    return active;
  };

  const activeBanners = buildActiveBanners();

  // ─── Error State ─────────────────────────────────────────────────────────────
  if (loading) {
    return <LoadingScreen />;
  }

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
    <div
      className="min-h-screen w-full font-['Inter'] flex flex-col overflow-x-hidden"
      style={{ backgroundColor: c.bg, color: c.text }}
    >
      {/* ── Top Status Bar ── */}
      <div
        className="w-full flex justify-center py-2 px-4 gap-4 sm:gap-8 overflow-hidden whitespace-nowrap"
        style={{ backgroundColor: c.secondary }}
      >
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex items-center gap-2 text-[11px] sm:text-[12px] font-medium"
          style={{ color: c.accent }}
        >
          <Clock size={14} />
          <span className="hidden sm:inline">
            Open: {settings?.operating_hours || "10:00 AM - 9:00 PM"}
          </span>
          <span className="sm:hidden">
            {settings?.operating_hours || "10AM - 9PM"}
          </span>
        </motion.div>
        <div
          className="w-px h-4"
          style={{ backgroundColor: c.accent + "50" }}
        />
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex items-center gap-2 text-[11px] sm:text-[12px] font-medium"
          style={{ color: c.accent }}
        >
          <Phone size={14} />
          <span>{settings?.contact_number || "+63 900 000 0000"}</span>
        </motion.div>
        {settings?.nationwide_delivery && (
          <>
            <div
              className="w-px h-4"
              style={{ backgroundColor: c.accent + "50" }}
            />
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex items-center gap-2 text-[11px] sm:text-[12px] font-medium"
              style={{ color: c.accent }}
            >
              <Package size={14} />
              <span className="hidden sm:inline">Nationwide Delivery</span>
              <span className="sm:hidden">PH Delivery</span>
            </motion.div>
          </>
        )}
      </div>

      <CustomerHeader
        businessName={businessName}
        tenantLogo={tenant?.logo_url ?? undefined}
        tenantName={tenant?.business_name}
        onSearch={setSearchQuery}
        colors={c}
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
            animate={{
              x: `-${Math.min(currentSlide, activeBanners.length - 1) * 100}%`,
            }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            {activeBanners.map((banner) => (
              <div
                key={banner.id}
                onClick={() => handleBannerClick(banner)}
                className="w-full h-full flex-shrink-0 relative flex items-center justify-center sm:justify-start sm:px-16 cursor-pointer"
                style={{
                  background:
                    banner.type === "image"
                      ? "none"
                      : `linear-gradient(to bottom right, ${banner.bg_color_1 ?? c.secondary}, ${banner.bg_color_2 ?? c.primary})`,
                }}
              >
                {banner.type === "image" && banner.image_url ? (
                  <img
                    src={banner.image_url}
                    alt="Banner"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : (
                  <>
                    <div
                      className="absolute right-[-10%] top-[-20%] w-[300px] h-[300px] rounded-full blur-3xl pointer-events-none"
                      style={{ backgroundColor: c.bg + "1A" }}
                    />
                    <div className="relative z-10 flex flex-col items-center sm:items-start text-center sm:text-left px-6">
                      <h2
                        className="text-[28px] sm:text-[40px] font-black uppercase tracking-tight mb-2 drop-shadow-md"
                        style={{ color: banner.font_color ?? c.accent }}
                      >
                        {banner.title}
                      </h2>
                      <p
                        className="text-[15px] sm:text-[18px] font-medium max-w-[400px] whitespace-pre-wrap break-words"
                        style={{ color: c.bg }}
                      >
                        {banner.subtitle}
                      </p>
                    </div>
                  </>
                )}
              </div>
            ))}
          </motion.div>

          <div className="absolute bottom-4 left-0 w-full flex justify-center gap-2 z-20">
            {activeBanners.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentSlide(idx)}
                className={`transition-all duration-300 rounded-full ${
                  currentSlide === idx ? "w-6 h-2" : "w-2 h-2 hover:opacity-80"
                }`}
                style={{
                  backgroundColor:
                    currentSlide === idx ? c.accent : c.bg + "66",
                }}
              />
            ))}
          </div>
        </motion.div>

        {/* Filters */}
        <div 
          className="flex flex-col gap-4 sticky top-[72px] sm:top-[80px] z-30 backdrop-blur-md pt-4 -mx-4 px-4 sm:mx-0 sm:px-0"
          style={{ backgroundColor: c.bg + "F2" }}
        >
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <h2 className="text-[24px] font-bold" style={{ color: c.primary }}>
              Our Menu
            </h2>
          </div>
          <div className="flex gap-2 w-full overflow-x-auto pb-2 scrollbar-hide">
            {categoryTabs.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className="relative whitespace-nowrap px-6 py-2.5 rounded-full text-[14px] font-bold transition-colors z-10"
              >
                <span
                  className="relative z-10"
                  style={{
                    color:
                      activeCategory === cat ? c.primary : c.primary + "99",
                  }}
                >
                  {cat}
                </span>
                {activeCategory === cat && (
                  <motion.div
                    layoutId="activeCategoryBg"
                    className="absolute inset-0 rounded-full z-0 shadow-sm"
                    style={{ backgroundColor: c.accent }}
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
                    <FnbProductCard
                      product={product}
                      onOpenModal={handleOpenProduct}
                      isFavorite={favorites.includes(product.product_id)}
                      onToggleFavorite={handleToggleFavorite}
                      colors={c}
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
                  No items found
                  {searchQuery
                    ? ` matching "${searchQuery}"`
                    : " in this category"}
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
        tenantId={tenant?.tenant_id || ""}
        colors={c}
      />

      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        tenantId={tenant?.tenant_id ?? ""}
        onSuccess={() => {}}
        colors={c}
      />
    </div>
  );
}