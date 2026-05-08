
// lib/nfb-products.ts
// Supabase data-access layer for NF&B Products & BOM

import { createClient } from "@/lib/supabase/client";

// ── Types ─────────────────────────────────────────────────────

export type NfbProduct = {
  product_id:      string;
  tenant_id:       string;
  category_id:     string | null;
  name:            string;
  sku:             string;
  description:     string | null;
  quantity:        number;
  unit_of_measure: string;
  unit_cost:       number;
  price:           number;
  visible:         boolean;
  is_active:       boolean;
  created_at:      string;
  updated_at:      string;
  // joined:
  category_name?:  string;
  bom?:            BomItem[];
};

export type BomItem = {
  bom_id:         string;
  product_id:     string;
  item_id:        string;
  quantity:       number;
  unit:           string;
  // joined:
  ingredient_name?: string;
};

export type NfbIngredientOption = {
  item_id:         string;
  name:            string;
  unit_of_measure: string;
};

export type NfbProductInput = {
  category_id:     string | null;
  name:            string;
  sku:             string;
  description:     string | null;
  quantity:        number;
  unit_of_measure: string;
  unit_cost:       number;
  price:           number;
  visible:         boolean;
};

export type BomInput = {
  item_id:  string;
  quantity: number;
  unit:     string;
};

// ── Products CRUD ─────────────────────────────────────────────

export async function fetchNfbProducts(tenantId: string): Promise<NfbProduct[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("nfb_products")
    .select(`
      *,
      product_categories ( name ),
      nfb_product_bom (
        bom_id, item_id, quantity, unit
      )
    `)
    .eq("tenant_id", tenantId)
    .eq("is_active", true)
    .order("name");

  if (error) throw error;

  return (data ?? []).map((row: any) => ({
    ...row,
    unit_cost:     Number(row.unit_cost),
    price:         Number(row.price),
    category_name: row.product_categories?.name ?? "Uncategorized",
    bom:           row.nfb_product_bom ?? [],
  }));
}

export async function addNfbProduct(
  tenantId: string,
  input:    NfbProductInput,
  bom:      BomInput[]
): Promise<NfbProduct> {
  const supabase = createClient();

  const { data: product, error: productError } = await supabase
    .from("nfb_products")
    .insert({ ...input, tenant_id: tenantId })
    .select()
    .single();

  if (productError) throw productError;

  if (bom.length > 0) {
    const bomRows = bom.map((b) => ({
      ...b,
      product_id: product.product_id,
      tenant_id:  tenantId,
    }));
    const { error: bomError } = await supabase
      .from("nfb_product_bom")
      .insert(bomRows);
    if (bomError) throw bomError;
  }

  return product;
}

export async function updateNfbProduct(
  productId: string,
  tenantId:  string,
  input:     Partial<NfbProductInput>,
  bom:       BomInput[]
): Promise<void> {
  const supabase = createClient();

  const { error: productError } = await supabase
    .from("nfb_products")
    .update(input)
    .eq("product_id", productId);

  if (productError) throw productError;

  // Replace BOM
  const { error: deleteError } = await supabase
    .from("nfb_product_bom")
    .delete()
    .eq("product_id", productId);

  if (deleteError) throw deleteError;

  if (bom.length > 0) {
    const bomRows = bom.map((b) => ({
      ...b,
      product_id: productId,
      tenant_id:  tenantId,
    }));
    const { error: bomError } = await supabase
      .from("nfb_product_bom")
      .insert(bomRows);
    if (bomError) throw bomError;
  }
}

export async function deleteNfbProduct(productId: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("nfb_products")
    .update({ is_active: false })
    .eq("product_id", productId);
  if (error) throw error;
}

// ── NF&B Ingredient Options ───────────────────────────────────

export async function fetchNfbIngredientOptions(
  tenantId: string
): Promise<NfbIngredientOption[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("nfb_inventory_items")
    .select("item_id, name, unit_of_measure")
    .eq("tenant_id", tenantId)
    .eq("is_active", true)
    .order("name");

  if (error) throw error;
  return data ?? [];
}