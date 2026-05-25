"use client";

import { createClient } from "@/lib/supabase/client";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface HeroBanner {
  id: string;
  type: "text" | "image";
  title: string;
  subtitle: string;
  font_color: string;
  bg_color_1: string;
  bg_color_2: string;
  image_url: string | null;
}

export interface StorefrontConfig {
  tenant_id: string;
  /** Brand colors */
  color_primary: string;
  color_secondary: string;
  color_accent: string;
  color_background: string;
  color_text: string;
  color_search_bar?: string;
  color_sidebar_text?: string;
  color_navbar_text?: string;
  /** Typography */
  font_family: string;
  /** Legacy single-banner fields (kept for DB compat) */
  hero_banner_type: "text" | "image";
  hero_banner_image_url: string | null;
  hero_banner_font_color: string;
  /** Multi-banner array (stored as JSONB in hero_banners column) */
  hero_banners: HeroBanner[] | null;
  /** Assets */
  logo_url: string | null;
}

const DEFAULTS: Omit<StorefrontConfig, "tenant_id"> = {
  color_primary: "#385E31",
  color_secondary: "#2A4725",
  color_accent: "#E5AC24",
  color_background: "#FFFCEB",
  color_text: "#3A6131",
  color_search_bar: "#2A4725",
  color_sidebar_text: "#FFF9D7",
  color_navbar_text: "#385E31",
  font_family: "Inter",
  hero_banner_type: "text",
  hero_banner_image_url: null,
  hero_banner_font_color: "#E5AC24",
  hero_banners: null,
  logo_url: null,
};


export async function fetchStorefrontConfig(
  tenantId: string
): Promise<StorefrontConfig | null> {
  if (!tenantId) return null;
  const supabase = createClient();

  const { data, error } = await supabase
    .from("tenant_storefront")
    .select("*")
    .eq("tenant_id", tenantId)
    .single();

  if (error || !data) {
    if (error?.code === "PGRST116") {
      // Row doesn't exist yet — create defaults
      const defaults: StorefrontConfig = { tenant_id: tenantId, ...DEFAULTS };
      const { data: created } = await supabase
        .from("tenant_storefront")
        .insert(defaults)
        .select()
        .single();
      return created ?? defaults;
    }
    console.error("[fetchStorefrontConfig]", error);
    return { tenant_id: tenantId, ...DEFAULTS };
  }

  return data as StorefrontConfig;
}

export async function updateStorefrontConfig(
  tenantId: string,
  patch: Partial<Omit<StorefrontConfig, "tenant_id">>
): Promise<{ error: string | null }> {
  const supabase = createClient();
  const { error } = await supabase
    .from("tenant_storefront")
    .upsert({ tenant_id: tenantId, ...patch });

  return { error: error?.message ?? null };
}

export async function updateTenantLogo(
  tenantId: string,
  logoUrl: string
): Promise<{ error: string | null }> {
  const supabase = createClient();
  const { error } = await supabase
    .from("tenants")
    .update({ logo_url: logoUrl })
    .eq("tenant_id", tenantId);

  return { error: error?.message ?? null };
}

export async function uploadStorefrontAsset(
  file: File,
  path: "logos" | "banners"
): Promise<{ url: string | null; error: string | null }> {
  const supabase = createClient();
  const ext = file.name.split(".").pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const filePath = `${path}/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from("store-assets")
    .upload(filePath, file, { upsert: true });

  if (uploadError) return { url: null, error: uploadError.message };

  const { data } = supabase.storage
    .from("store-assets")
    .getPublicUrl(filePath);

  return { url: data.publicUrl, error: null };
}
