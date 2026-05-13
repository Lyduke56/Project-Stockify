import { createClient } from "@/lib/supabase/client";

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface StorefrontTenant {
  tenant_id: string;
  business_name: string;
  business_type: string;
  logo_url: string | null;
}

export interface ProductCategory {
  category_id: string;
  name: string;
}

export interface FnbProductSize {
  size_id: string;
  label: string;
  price: number;
  is_default: boolean;
  sort_order: number;
  max_yield: number; // from product_sizes.max_yield
}

export interface FnbProduct {
  product_id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  price: number;       // base price (or min size price if sizes exist)
  max_yield: number;   // total yield (or 0 if sizes handle it)
  category_id: string | null;
  category_name: string | null;
  sizes: FnbProductSize[];
}

export interface NfnbVariantOption {
  option_id: string;
  label: string;
  price: number;
  stock: number;
}

export interface NfnbVariantType {
  variant_type_id: string;
  name: string;
  options: NfnbVariantOption[];
}

export interface NfnbProduct {
  product_id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  price: number;
  quantity: number;
  unit_of_measure: string;
  category_id: string | null;
  category_name: string | null;
  variants: NfnbVariantType[];
}

// ─── Tenant ────────────────────────────────────────────────────────────────────

export const getStorefrontTenant = async (
  userId: string
): Promise<StorefrontTenant | null> => {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("users")
    .select(
      "tenant_id, tenants(tenant_id, business_name, business_type, logo_url)"
    )
    .eq("user_id", userId)
    .single();

  if (error || !data) return null;

  const t = data.tenants as any;
  return {
    tenant_id: t.tenant_id,
    business_name: t.business_name,
    business_type: t.business_type,
    logo_url: t.logo_url ?? null,
  };
};

// ─── Categories ────────────────────────────────────────────────────────────────

export const getProductCategories = async (
  tenantId: string,
  type?: string
): Promise<ProductCategory[]> => {
  const supabase = createClient();
  let query = supabase
    .from("product_categories")
    .select("category_id, name")
    .eq("tenant_id", tenantId);

  if (type) {
    query = query.eq("type", type);
  }

  const { data, error } = await query.order("name");

  if (error || !data) return [];
  return data;
};

// ─── F&B Products (with sizes) ─────────────────────────────────────────────────

export const getFnbProducts = async (
  tenantId: string
): Promise<FnbProduct[]> => {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("products")
    .select(`
      product_id, name, description, image_url, price, max_yield,
      category_id, product_categories(name),
      product_sizes(size_id, label, price, is_default, sort_order, max_yield)
    `)
    .eq("tenant_id", tenantId)
    .eq("visible", true)
    .eq("is_active", true)
    .order("name");

  if (error || !data) return [];

  return data.map((p) => {
    const rawSizes = (p.product_sizes as any[]) ?? [];
    const sizes: FnbProductSize[] = rawSizes
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((s) => ({
        size_id:   s.size_id,
        label:     s.label,
        price:     Number(s.price),
        is_default: s.is_default,
        sort_order: s.sort_order,
        max_yield:  Number(s.max_yield ?? 0),
      }));

    // Compute the display price: if sizes exist use lowest, else use base
    const basePrice = sizes.length > 0 ? Math.min(...sizes.map((s) => s.price)) : Number(p.price);

    return {
      product_id:    p.product_id,
      name:          p.name,
      description:   p.description ?? null,
      image_url:     p.image_url ?? null,
      price:         basePrice,
      max_yield:     p.max_yield,
      category_id:   p.category_id ?? null,
      category_name: (p.product_categories as any)?.name ?? null,
      sizes,
    };
  });
};

// ─── NF&B Products (with variants) ─────────────────────────────────────────────

const mapNfnbProducts = (data: any[], hasImage: boolean): NfnbProduct[] =>
  data.map((p) => {
    const rawVariantTypes = (p.nfb_variant_types as any[]) ?? [];

    const variants: NfnbVariantType[] = rawVariantTypes
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((vt) => ({
        variant_type_id: vt.variant_type_id,
        name:            vt.name,
        options:         ((vt.nfb_variant_options as any[]) ?? [])
          .sort((a: any, b: any) => a.sort_order - b.sort_order)
          .map((o: any) => ({
            option_id: o.option_id,
            label:     o.label,
            price:     Number(o.price),
            stock:     Number(o.stock),
          })),
      }));

    const allOptPrices = variants.flatMap((vt) => vt.options.map((o) => o.price)).filter(p => p > 0);
    const basePrice = allOptPrices.length > 0 ? Math.min(...allOptPrices) : (Number(p.price) || 0);

    return {
      product_id:      p.product_id,
      name:            p.name,
      description:     p.description ?? null,
      image_url:       hasImage ? (p.image_url ?? null) : null,
      price:           basePrice,
      quantity:        p.quantity,
      unit_of_measure: p.unit_of_measure,
      category_id:     p.category_id ?? null,
      category_name:   (p.product_categories as any)?.name ?? null,
      variants,
    };
  });

export const getNfnbProducts = async (
  tenantId: string
): Promise<NfnbProduct[]> => {
  const supabase = createClient();

  const BASE_SELECT = `
    product_id, name, description, price, quantity, unit_of_measure,
    category_id, product_categories(name),
    nfb_variant_types(
      variant_type_id, name, sort_order,
      nfb_variant_options(option_id, label, price, stock, sort_order)
    )
  `;

  // Try with image_url first (requires the column to exist)
  const { data, error } = await supabase
    .from("nfb_products")
    .select(`image_url, ${BASE_SELECT}`)
    .eq("tenant_id", tenantId)
    .eq("visible", true)
    .eq("is_active", true)
    .order("name");

  if (!error && data) return mapNfnbProducts(data, true);

  // Fallback: column doesn't exist yet — query without image_url
  console.warn("[getNfnbProducts] image_url column missing, falling back:", error?.message);
  const { data: fallback, error: fallbackErr } = await supabase
    .from("nfb_products")
    .select(BASE_SELECT)
    .eq("tenant_id", tenantId)
    .eq("visible", true)
    .eq("is_active", true)
    .order("name");

  if (fallbackErr || !fallback) return [];
  return mapNfnbProducts(fallback, false);
};