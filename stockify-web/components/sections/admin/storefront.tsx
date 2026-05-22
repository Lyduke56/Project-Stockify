"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, Upload, Loader2, Save, RefreshCw, Image as ImageIcon, Type, ChevronDown } from "lucide-react";
import {
  fetchStorefrontConfig,
  updateStorefrontConfig,
  uploadStorefrontAsset,
  updateTenantLogo,
  type StorefrontConfig,
  type HeroBanner,
} from "@/lib/admin/storefront-actions";
import { createClient } from "@/lib/supabase/client";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const GOOGLE_FONTS = ["Inter", "Poppins", "Roboto", "Outfit", "Nunito", "Lato", "Montserrat", "Raleway"];

const COLOR_FIELDS: { key: keyof StorefrontConfig; label: string; description: string }[] = [
  { key: "color_primary",    label: "Primary Color",    description: "Header bg, buttons, borders, card outlines" },
  { key: "color_secondary",  label: "Secondary Color",  description: "Top status bar, deep banner gradient" },
  { key: "color_accent",     label: "Accent Color",     description: "CTAs, active category tabs, highlights" },
  { key: "color_background", label: "Background",       description: "Page background, card surfaces" },
  { key: "color_search_bar", label: "Search Bar Color", description: "Background color for the search bar" },
];

function ColorRow({
  label, description, value, onChange,
}: { label: string; description: string; value: string; onChange: (v: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [localVal, setLocalVal] = useState(value);

  useEffect(() => { setLocalVal(value); }, [value]);

  const handleHexChange = (v: string) => {
    setLocalVal(v);
    if (/^#([0-9A-Fa-f]{6})$/.test(v)) onChange(v);
  };

  return (
    <div className="flex items-center gap-4">
      <div className="w-40 shrink-0">
        <p className="text-primary font-bold text-sm">{label}</p>
        <p className="text-primary/50 text-[11px] leading-tight mt-0.5">{description}</p>
      </div>
      <div className="flex-1 flex items-center gap-3">
        <input
          type="text"
          value={localVal}
          onChange={(e) => handleHexChange(e.target.value)}
          className="w-full border border-primary rounded-full px-5 py-2 bg-transparent text-primary outline-none font-medium text-sm uppercase tracking-wider"
          maxLength={7}
        />
        <button
          onClick={() => inputRef.current?.click()}
          className="w-10 h-10 rounded-full shrink-0 border-2 border-primary shadow-inner overflow-hidden"
          style={{ backgroundColor: localVal }}
          title="Pick color"
        />
        <input
          ref={inputRef}
          type="color"
          value={localVal}
          onChange={(e) => { setLocalVal(e.target.value); onChange(e.target.value); }}
          className="sr-only"
        />
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function StorefrontSection() {
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [businessType, setBusinessType] = useState<"fnb" | "nfb" | null>(null);
  const [businessName, setBusinessName] = useState<string>("");
  const [config, setConfig] = useState<StorefrontConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [tenantLogoUrl, setTenantLogoUrl] = useState<string | null>(null);
  // Multi-banner state
  const [banners, setBanners] = useState<HeroBanner[]>([]);
  const [bannerFiles, setBannerFiles] = useState<Record<string, File>>({});
  const [bannerPreviews, setBannerPreviews] = useState<Record<string, string>>({});
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [previewKey, setPreviewKey] = useState(0);

  const [showDefaultModal, setShowDefaultModal] = useState(false);

  const newBanner = (): HeroBanner => ({
    id: `b-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    type: "text",
    title: "Special Promo",
    subtitle: "Order now and enjoy the best deals!",
    font_color: "#E5AC24",
    bg_color_1: "#2A4725",
    bg_color_2: "#385E31",
    image_url: null,
  });

  // ─── Load tenant & config ──────────────────────────────────────────────────
  useEffect(() => {
    // URL is: /[businessName]/administrator/dashboard
    const segments = window.location.pathname.split("/").filter(Boolean);
    setBusinessName(segments[0] ?? "");

    const load = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: userData } = await supabase
        .from("users")
        .select("tenant_id, tenants(business_type, logo_url)")
        .eq("user_id", user.id)
        .single();

      if (!userData) { setLoading(false); return; }

      const tid = userData.tenant_id;
      const btype = (userData.tenants as any)?.business_type ?? "fnb";
      const tLogo = (userData.tenants as any)?.logo_url ?? null;
      setTenantId(tid);
      setTenantLogoUrl(tLogo);
      
      const btypeLower = btype.toLowerCase();
      const isNfb = btypeLower.startsWith("non") || btypeLower === "nfb" || btypeLower === "non-food-and-beverage";
      setBusinessType(isNfb ? "nfb" : "fnb");

      const cfg = await fetchStorefrontConfig(tid);
      setConfig(cfg);
      // Initialise multi-banner list
      if (cfg?.hero_banners && cfg.hero_banners.length > 0) {
        setBanners(cfg.hero_banners);
      } else {
        setBanners([{
          id: `b-init`,
          type: cfg?.hero_banner_type ?? "text",
          title: "Special Promo",
          subtitle: "Order now and enjoy the best deals!",
          font_color: cfg?.hero_banner_font_color ?? "#E5AC24",
          bg_color_1: cfg?.color_secondary ?? "#2A4725",
          bg_color_2: cfg?.color_primary ?? "#385E31",
          image_url: cfg?.hero_banner_image_url ?? null,
        }]);
      }
      setLoading(false);
    };
    load();
  }, []);

  const patch = useCallback(<K extends keyof StorefrontConfig>(key: K, val: StorefrontConfig[K]) => {
    setConfig((prev) => prev ? { ...prev, [key]: val } : prev);
  }, []);

  // ─── Banner helpers ──────────────────────────────────────────────────────────
  const updateBanner = (id: string, field: keyof HeroBanner, value: string) => {
    setBanners((prev) => prev.map((b) => b.id === id ? { ...b, [field]: value } : b));
  };
  const addBanner = () => setBanners((prev) => [...prev, newBanner()]);
  const removeBanner = (id: string) => {
    setBanners((prev) => prev.filter((b) => b.id !== id));
    setBannerFiles((prev) => { const n = { ...prev }; delete n[id]; return n; });
    setBannerPreviews((prev) => { const n = { ...prev }; delete n[id]; return n; });
  };
  const handleBannerImageFile = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setBannerFiles((prev) => ({ ...prev, [id]: f }));
    setBannerPreviews((prev) => ({ ...prev, [id]: URL.createObjectURL(f) }));
    setBanners((prev) => prev.map((b) => b.id === id ? { ...b, type: "image" } : b));
  };

  const handleLogoFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setLogoFile(f);
    setLogoPreview(URL.createObjectURL(f));
  };

  const handleSave = async () => {
    if (!config || !tenantId) return;
    setSaving(true);
    let updated = { ...config };

    // Upload logo
    if (logoFile) {
      const { url, error } = await uploadStorefrontAsset(logoFile, "logos");
      if (error) {
        alert(`Failed to upload logo: ${error}`);
        setSaving(false);
        return;
      }
      if (url) {
        updated.logo_url = url;
        patch("logo_url", url);
        setTenantLogoUrl(url);
        await updateTenantLogo(tenantId, url);
      }
    }

    // Upload any pending banner images
    const resolvedBanners = await Promise.all(
      banners.map(async (b) => {
        if (bannerFiles[b.id]) {
          const { url, error } = await uploadStorefrontAsset(bannerFiles[b.id], "banners");
          if (error) {
            alert(`Failed to upload banner image for ${b.title}: ${error}`);
            return b;
          }
          if (url) {
            setBannerPreviews((prev) => ({ ...prev, [b.id]: url }));
            return { ...b, image_url: url };
          }
        }
        return b;
      })
    );
    setBanners(resolvedBanners);
    setBannerFiles({});
    updated.hero_banners = resolvedBanners;

    const { error } = await updateStorefrontConfig(tenantId, updated);
    if (error) {
      alert(`Failed to save configuration: ${error}`);
      setSaving(false);
      return;
    }

    setSaving(false);
    setSavedMsg(true);
    // Reload the iframe so the actual storefront reflects saved changes in real-time
    setPreviewKey((k) => k + 1);
    setTimeout(() => setSavedMsg(false), 3000);
  };

  const handleResetToDefault = async () => {
    if (!tenantId) return;
    setSaving(true);
    const defaults: Partial<Omit<StorefrontConfig, "tenant_id">> = {
      color_primary: "#385E31",
      color_secondary: "#2A4725",
      color_accent: "#E5AC24",
      color_background: "#FFFCEB",
      color_text: "#3A6131",
      color_search_bar: "#2A4725",
      color_sidebar_text: "#FFF9D7",
      font_family: "Inter",
    };
    const { error } = await updateStorefrontConfig(tenantId, defaults);
    if (error) {
      alert(`Failed to reset configuration: ${error}`);
      setSaving(false);
      return;
    }
    const cfg = await fetchStorefrontConfig(tenantId);
    setConfig(cfg);
    setSaving(false);
    setShowDefaultModal(false);
    setSavedMsg(true);
    setPreviewKey((k) => k + 1);
    setTimeout(() => setSavedMsg(false), 3000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  if (!config) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-primary/60 text-sm font-medium">
        Could not load storefront configuration.
      </div>
    );
  }

  const previewPath = businessType === "fnb"
    ? `/${businessName}/customer/food-and-beverage/storefront`
    : `/${businessName}/customer/non-food-and-beverage/storefront`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="flex flex-col w-full min-h-screen bg-[#FFFCEB] font-['Inter'] pt-5 pb-12"
      style={{
        '--color-primary': config?.color_primary ?? '#385E31',
        '--color-secondary': config?.color_secondary ?? '#2A4725',
        '--color-accent': config?.color_accent ?? '#E5AC24',
        '--color-background': config?.color_background ?? '#FFFCEB',
      } as React.CSSProperties}
    >
      {/* PAGE HEADER */}
      <motion.header
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="w-full flex flex-col items-center mb-12 gap-2"
      >
        <div className="flex items-center gap-3">
          <h1 className="text-primary text-[30px] font-extrabold uppercase">
            Storefront Configuration
          </h1>
        </div>
        <div className="w-full max-w-[900px] h-1.5 bg-accent rounded-full opacity-60" />
      </motion.header>

      {/* WELCOME */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex flex-col gap-1 mb-8"
      >
        <h2 className="text-primary text-[26px] font-extrabold uppercase">
          Welcome to the storefront, Client!
        </h2>
        <p className="text-primary text-sm font-medium">
          Customize your storefront appearance. Changes are reflected in the live preview below.
        </p>
      </motion.div>

      {/* ── CONFIGURATION GRIDS ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="flex flex-col gap-8 w-full"
      >
        {/* Brand Colors + Media & Typography (side by side) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Brand Colors */}
          <div className="flex flex-col gap-4 p-6 w-full bg-[#FFFCEB] rounded-[10px] border border-primary shadow-sm">
            <h3 className="text-primary text-[16px] font-extrabold uppercase mb-2">Brand Colors</h3>
            <div className="flex flex-col gap-5">
              {COLOR_FIELDS.map((f) => (
                <ColorRow
                  key={f.key}
                  label={f.label}
                  description={f.description}
                  value={config[f.key] as string}
                  onChange={(v) => patch(f.key, v)}
                />
              ))}
            </div>
          </div>

          {/* Right Column: Media Assets + Typography */}
          <div className="flex flex-col gap-8">
            {/* Media Assets */}
            <div className="flex flex-col gap-4 p-6 w-full bg-[#FFFCEB] rounded-[10px] border border-primary shadow-sm">
              <h3 className="text-primary text-[16px] font-extrabold uppercase mb-2">Media Assets</h3>
              <div className="flex flex-col gap-6">
                {/* Shop Logo */}
                <div className="flex items-center gap-4">
                  <label className="text-primary font-bold text-sm w-28 shrink-0">Shop Logo</label>
                  <div className="flex-1 flex flex-col xl:flex-row xl:items-center gap-3">
                    {(logoPreview || tenantLogoUrl) && (
                      <img
                        src={logoPreview ?? tenantLogoUrl ?? ""}
                        alt="Logo"
                        className="w-10 h-10 rounded-full object-cover border border-primary/30 shrink-0"
                      />
                    )}
                    <div className="flex items-center gap-3 w-full">
                      <input
                        type="text"
                        placeholder="No file selected"
                        readOnly
                        value={logoFile?.name ?? (tenantLogoUrl ? "Current logo uploaded" : "")}
                        className="w-full border border-primary rounded-full px-5 py-2 bg-transparent text-primary placeholder-primary/60 outline-none font-medium text-sm"
                      />
                      <label className="whitespace-nowrap px-6 py-2 rounded-[40px] font-bold text-[13px] transition-all hover:brightness-105 active:scale-95 shadow-sm cursor-pointer flex items-center gap-2 shrink-0"
                        style={{ backgroundColor: "var(--color-primary)", color: "var(--color-sidebar-text, #FFF9D7)" }}>
                        <Upload size={14} /> Upload
                        <input type="file" accept="image/*" className="sr-only" onChange={handleLogoFile} />
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Typography */}
            <div className="flex flex-col gap-4 p-6 w-full bg-[#FFFCEB] rounded-[10px] border border-primary shadow-sm">
              <h3 className="text-primary text-[16px] font-extrabold uppercase mb-2">Typography</h3>
              <div className="flex flex-col gap-5">
                <div className="flex items-center gap-4">
                  <label className="text-primary font-bold text-sm w-28 shrink-0">Font</label>
                  <div className="relative flex-1">
                    <select
                      value={config.font_family}
                      onChange={(e) => patch("font_family", e.target.value)}
                      className="w-full border border-primary rounded-full px-5 py-2 bg-transparent text-primary outline-none font-medium text-sm appearance-none cursor-pointer"
                    >
                      {GOOGLE_FONTS.map((f) => (
                        <option key={f} value={f}>{f}</option>
                      ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-primary">
                      <ChevronDown size={14} />
                    </div>
                  </div>
                </div>
                <ColorRow
                  label="Text Color"
                  description="Body text, section headings, icons"
                  value={config.color_text}
                  onChange={(v) => patch("color_text", v)}
                />
                <ColorRow
                  label="Sidebar Font/Icon Color"
                  description="Color of text or icons in the sidebar"
                  value={config.color_sidebar_text || "#FFF9D7"}
                  onChange={(v) => patch("color_sidebar_text", v)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Hero Banners — full width */}
        <div className="flex flex-col gap-4 p-6 w-full bg-[#FFFCEB] rounded-[10px] border border-primary shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <div>
              <h3 className="text-primary text-[16px] font-extrabold uppercase">Hero Banners</h3>
              <p className="text-primary/50 text-xs font-medium mt-0.5">Add multiple banners — they rotate as a slideshow on your storefront.</p>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <AnimatePresence>
              {banners.map((banner, idx) => (
                <motion.div
                  key={banner.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                  className="border border-primary/30 rounded-xl p-4 flex flex-col gap-3 bg-white/60"
                >
                  {/* Banner header */}
                  <div className="flex items-center justify-between">
                    <span className="text-primary font-black text-sm uppercase tracking-wide">Banner {idx + 1}</span>
                    <button
                      onClick={() => removeBanner(banner.id)}
                      disabled={banners.length === 1}
                      className="w-7 h-7 rounded-full flex items-center justify-center text-red-400 hover:bg-red-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Remove banner"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  {/* Type toggle */}
                  <div className="flex gap-2">
                    {(["text", "image"] as const).map((t) => (
                      <button
                        key={t}
                        onClick={() => updateBanner(banner.id, "type", t)}
                        className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold transition-all border ${
                          banner.type === t
                            ? "bg-primary text-sidebar-text border-primary"
                            : "bg-transparent text-primary border-primary/30 hover:border-primary"
                        }`}
                        style={banner.type === t ? { color: "var(--color-sidebar-text, #FFF9D7)" } : {}}
                      >
                        {t === "text" ? <Type size={12} /> : <ImageIcon size={12} />}
                        {t === "text" ? "Text" : "Image"}
                      </button>
                    ))}
                  </div>

                  <AnimatePresence mode="wait">
                    {banner.type === "text" ? (
                      <motion.div key="text" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col gap-3">
                        {/* Preview */}
                        <div className="w-full h-14 rounded-lg flex flex-col items-start justify-center px-4"
                          style={{ background: `linear-gradient(to right, ${banner.bg_color_1 || config.color_secondary}, ${banner.bg_color_2 || config.color_primary})` }}>
                          <p className="font-black text-sm" style={{ color: banner.font_color }}>{banner.title || "Banner Title"}</p>
                          <p className="text-[11px] opacity-80" style={{ color: banner.font_color }}>{banner.subtitle || "Subtitle text"}</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="flex flex-col gap-1">
                            <label className="text-primary font-bold text-xs">Title</label>
                            <input
                              type="text"
                              value={banner.title}
                              onChange={(e) => updateBanner(banner.id, "title", e.target.value)}
                              placeholder="e.g. Special Promo"
                              className="border border-primary/40 rounded-full px-4 py-2 bg-transparent text-primary outline-none text-sm"
                            />
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className="text-primary font-bold text-xs">Subtitle</label>
                            <textarea
                              value={banner.subtitle}
                              onChange={(e) => updateBanner(banner.id, "subtitle", e.target.value)}
                              placeholder="e.g. Order now!"
                              maxLength={80}
                              className="border border-primary/40 rounded-2xl px-4 py-2 bg-transparent text-primary outline-none text-sm resize-none h-20"
                            />
                            <div className="text-[10px] text-primary/60 text-right pr-2">
                              {banner.subtitle.length}/80
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 flex-wrap">
                          <div className="flex items-center gap-2">
                            <label className="text-primary font-bold text-xs">Color 1</label>
                            <input type="color" value={banner.bg_color_1}
                              onChange={(e) => updateBanner(banner.id, "bg_color_1", e.target.value)}
                              className="w-8 h-8 rounded-full border-2 border-primary cursor-pointer shrink-0" />
                          </div>
                          <div className="flex items-center gap-2">
                            <label className="text-primary font-bold text-xs">Color 2</label>
                            <input type="color" value={banner.bg_color_2}
                              onChange={(e) => updateBanner(banner.id, "bg_color_2", e.target.value)}
                              className="w-8 h-8 rounded-full border-2 border-primary cursor-pointer shrink-0" />
                          </div>
                          <div className="flex items-center gap-2">
                            <label className="text-primary font-bold text-xs">Font Color</label>
                            <input type="color" value={banner.font_color}
                              onChange={(e) => updateBanner(banner.id, "font_color", e.target.value)}
                              className="w-8 h-8 rounded-full border-2 border-primary cursor-pointer shrink-0" />
                          </div>
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div key="image" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col gap-3">
                        {(bannerPreviews[banner.id] || banner.image_url) && (
                          <div className="w-full h-32 rounded-xl overflow-hidden border border-primary/20">
                            <img
                              src={bannerPreviews[banner.id] ?? banner.image_url ?? ""}
                              alt="Banner"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <div className="flex items-center gap-3">
                          <input
                            type="text"
                            readOnly
                            value={bannerFiles[banner.id]?.name ?? (banner.image_url ? "Image uploaded" : "")}
                            placeholder="No image selected"
                            className="flex-1 border border-primary/40 rounded-full px-4 py-2 bg-transparent text-primary placeholder-primary/40 outline-none text-sm"
                          />
                          <label className="whitespace-nowrap px-5 py-2 rounded-[40px] font-bold text-[13px] transition-all hover:brightness-105 active:scale-95 shadow-sm cursor-pointer flex items-center gap-2"
                            style={{ backgroundColor: "var(--color-primary)", color: "var(--color-sidebar-text, #FFF9D7)" }}>
                            <Upload size={13} /> Upload
                            <input type="file" accept="image/*" className="sr-only"
                              onChange={(e) => handleBannerImageFile(banner.id, e)} />
                          </label>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Add banner button */}
          <button
            onClick={addBanner}
            className="mt-2 flex items-center gap-2 px-5 py-2.5 rounded-full border-2 border-dashed border-primary/40 text-primary text-sm font-bold hover:border-primary hover:bg-primary/5 transition-all w-fit"
          >
            <Plus size={15} /> Add Banner
          </button>
        </div>

        {/* Save & Default Buttons */}
        <div className="flex items-center justify-end gap-4 mt-2">
          <AnimatePresence>
            {savedMsg && (
              <motion.span
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="text-primary text-sm font-bold"
              >
                ✓ Changes saved!
              </motion.span>
            )}
          </AnimatePresence>
          <button
            onClick={() => setShowDefaultModal(true)}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 rounded-[40px] font-bold text-[14px] transition-all hover:bg-primary/10 shadow-sm border border-primary disabled:opacity-60 text-primary"
          >
            Reset to Default
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-8 py-3 rounded-[40px] font-bold text-[14px] transition-all hover:brightness-105 active:scale-95 shadow-md disabled:opacity-60 bg-primary"
            style={{ color: "var(--color-sidebar-text, #FFF9D7)" }}
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </motion.div>

      {/* SEPARATOR */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="w-full h-[2px] bg-primary/20 rounded-full my-12"
      />

      {/* LIVE PREVIEW */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="flex flex-col gap-6"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-primary text-[26px] font-extrabold uppercase">Live Preview</h2>
          <button
            onClick={() => setPreviewKey((k) => k + 1)}
            className="flex items-center gap-2 px-5 py-2 rounded-full border border-primary text-primary text-sm font-bold hover:bg-primary/5 transition-colors"
          >
            <RefreshCw size={14} /> Refresh Preview
          </button>
        </div>

        {/* iframe — actual storefront preview */}
        <div className="rounded-[10px] border border-primary overflow-hidden shadow-md bg-white">
          {/* Browser chrome mock */}
          <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 border-b border-primary/20">
            <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
            <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
            <div className="flex-1 ml-2 bg-white/80 rounded-full px-3 py-0.5 text-[11px] text-primary/60 font-medium truncate border border-primary/10">
              {typeof window !== "undefined" ? window.location.origin + previewPath : previewPath}
            </div>
          </div>
          <iframe
            key={previewKey}
            ref={iframeRef}
            src={previewPath}
            className="w-full"
            style={{ height: "680px", border: "none" }}
            title="Storefront Live Preview"
          />
        </div>

        <p className="text-primary/50 text-xs font-medium text-center">
          This is your live {businessType === "fnb" ? "F&B" : "NF&B"} storefront. Save changes then click Refresh Preview to see updates.
        </p>
      </motion.div>

      {/* Default Confirmation Modal */}
      <AnimatePresence>
        {showDefaultModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#FFFCEB] rounded-[20px] p-6 max-w-sm w-full border border-primary/20 shadow-xl"
            >
              <h3 className="text-primary font-extrabold text-xl mb-2">Reset to Default?</h3>
              <p className="text-primary/70 text-sm mb-6">
                Are you sure you want to revert all colors and typography back to their original settings? Your logo and banners will remain.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowDefaultModal(false)}
                  className="px-5 py-2 rounded-full font-bold text-sm text-primary hover:bg-primary/10 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleResetToDefault}
                  disabled={saving}
                  className="px-5 py-2 rounded-full font-bold text-sm bg-primary text-sidebar-text hover:brightness-110 transition-all flex items-center gap-2"
                  style={{ color: "var(--color-sidebar-text, #FFF9D7)" }}
                >
                  {saving && <Loader2 size={14} className="animate-spin" />}
                  Yes, Reset
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}