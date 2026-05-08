import { createClient } from "@/lib/supabase/client";

// ─── Types ────────────────────────────────────────────────────────────────────

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

export interface FnbProduct {
  product_id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  price: number;
  max_yield: number;
  category_id: string | null;
  category_name: string | null;
}

export interface NfnbProduct {
  product_id: string;
  name: string;
  description: string | null;
  price: number;
  quantity: number;
  unit_of_measure: string;
  category_id: string | null;
  category_name: string | null;
}

// ─── Tenant ───────────────────────────────────────────────────────────────────

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

// ─── Categories ───────────────────────────────────────────────────────────────

export const getProductCategories = async (
  tenantId: string
): Promise<ProductCategory[]> => {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("product_categories")
    .select("category_id, name")
    .eq("tenant_id", tenantId)
    .order("name");

  if (error || !data) return [];
  return data;
};

// ─── FnB Products ─────────────────────────────────────────────────────────────

export const getFnbProducts = async (
  tenantId: string
): Promise<FnbProduct[]> => {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("products")
    .select(
      "product_id, name, description, image_url, price, max_yield, category_id, product_categories(name)"
    )
    .eq("tenant_id", tenantId)
    .eq("visible", true)
    .eq("is_active", true)
    .order("name");

  if (error || !data) return [];

  return data.map((p) => ({
    product_id: p.product_id,
    name: p.name,
    description: p.description ?? null,
    image_url: p.image_url ?? null,
    price: Number(p.price),
    max_yield: p.max_yield,
    category_id: p.category_id ?? null,
    category_name: (p.product_categories as any)?.name ?? null,
  }));
};

// ─── NFNB Products ────────────────────────────────────────────────────────────

export const getNfnbProducts = async (
  tenantId: string
): Promise<NfnbProduct[]> => {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("nfb_products")
    .select(
      "product_id, name, description, price, quantity, unit_of_measure, category_id, product_categories(name)"
    )
    .eq("tenant_id", tenantId)
    .eq("visible", true)
    .eq("is_active", true)
    .order("name");

  if (error || !data) return [];

  return data.map((p) => ({
    product_id: p.product_id,
    name: p.name,
    description: p.description ?? null,
    price: Number(p.price),
    quantity: p.quantity,
    unit_of_measure: p.unit_of_measure,
    category_id: p.category_id ?? null,
    category_name: (p.product_categories as any)?.name ?? null,
  }));
};