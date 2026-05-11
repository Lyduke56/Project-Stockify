// lib/employee/products.ts
// Supabase data-access layer for Products, Recipes & Sizes

import { createClient } from "@/lib/supabase/client";
import { getCurrentUserContext } from "@/lib/employee/inventory";

// ── Types ─────────────────────────────────────────────────────

export type ProductSize = {
  size_id:    string;
  product_id: string;
  label:      string;
  price:      number;
  is_default: boolean;
  sort_order: number;
};

export type Product = {
  product_id:   string;
  tenant_id:    string;
  category_id:  string | null;
  name:         string;
  sku:          string;
  description:  string | null;
  image_url:    string | null;
  unit_cost:    number;
  price:        number;
  max_yield:    number;
  visible:      boolean;
  is_active:    boolean;
  created_at:   string;
  updated_at:   string;
  category_name?: string;
  recipe?:        RecipeItem[];
  sizes?:         ProductSize[];
};

export type RecipeItem = {
  recipe_id:  string;
  product_id: string;
  item_type:  "fnb" | "nfb";
  item_id:    string;
  amount:     number;
  unit:       string;
};

export type IngredientOption = {
  item_id:         string;
  item_type:       "fnb" | "nfb";
  name:            string;
  base_unit:       string;
  unit_of_measure: string;
  unit:            string;
};

export type ProductInput = {
  category_id:  string | null;
  name:         string;
  sku:          string;
  description:  string | null;
  image_url:    string | null;
  unit_cost:    number;
  price:        number;
  max_yield:    number;
  visible:      boolean;
};

export type RecipeInput = {
  item_type: "fnb" | "nfb";
  item_id:   string;
  amount:    number;
  unit:      string;
};

export type SizeInput = {
  label:      string;
  price:      string;
  is_default: boolean;
};

export { getCurrentUserContext };

// ── Error normaliser ──────────────────────────────────────────

function normaliseError(e: any, sku: string): Error {
  const msg: string  = e?.message ?? "";
  const code: string = e?.code    ?? "";

  if (
    code === "23505" ||
    msg.includes("uq_product_sku_per_tenant") ||
    msg.includes("duplicate key value")
  ) {
    return new Error(
      `SKU "${sku.toUpperCase()}" is already used by another product. Please choose a unique SKU code.`
    );
  }
  return new Error(msg || "An unexpected error occurred. Please try again.");
}

// ── Products CRUD ─────────────────────────────────────────────

export async function fetchProducts(tenantId: string): Promise<Product[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("products")
    .select(`
      *,
      product_categories ( name ),
      product_recipes ( recipe_id, item_type, item_id, amount, unit ),
      product_sizes   ( size_id, label, price, is_default, sort_order )
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
    recipe:        row.product_recipes ?? [],
    sizes:         (row.product_sizes ?? []).sort(
      (a: ProductSize, b: ProductSize) => a.sort_order - b.sort_order
    ),
  }));
}

export async function addProduct(
  tenantId: string,
  input:    ProductInput,
  recipe:   RecipeInput[],
  sizes:    SizeInput[]
): Promise<Product> {
  const supabase = createClient();

  const { data: product, error: productError } = await supabase
    .from("products")
    .insert({ ...input, tenant_id: tenantId })
    .select()
    .single();

  if (productError) throw normaliseError(productError, input.sku);

  if (recipe.length > 0) {
    const { error: recipeError } = await supabase
      .from("product_recipes")
      .insert(recipe.map((r) => ({ ...r, product_id: product.product_id, tenant_id: tenantId })));
    if (recipeError) throw recipeError;
  }

  const validSizes = sizes.filter((s) => s.label.trim());
  if (validSizes.length > 0) {
    const { error: sizeError } = await supabase
      .from("product_sizes")
      .insert(
        validSizes.map((s, i) => ({
          product_id: product.product_id,
          tenant_id:  tenantId,
          label:      s.label.trim(),
          price:      Number(s.price) || 0,
          is_default: s.is_default,
          sort_order: i,
        }))
      );
    if (sizeError) throw sizeError;
  }

  return product;
}

export async function updateProduct(
  productId: string,
  tenantId:  string,
  input:     Partial<ProductInput>,
  recipe:    RecipeInput[],
  sizes:     SizeInput[]
): Promise<void> {
  const supabase = createClient();

  const { error: productError } = await supabase
    .from("products")
    .update(input)
    .eq("product_id", productId);

  if (productError) throw normaliseError(productError, input.sku ?? "");

  await supabase.from("product_recipes").delete().eq("product_id", productId);
  if (recipe.length > 0) {
    const { error: recipeError } = await supabase
      .from("product_recipes")
      .insert(recipe.map((r) => ({ ...r, product_id: productId, tenant_id: tenantId })));
    if (recipeError) throw recipeError;
  }

  await supabase.from("product_sizes").delete().eq("product_id", productId);
  const validSizes = sizes.filter((s) => s.label.trim());
  if (validSizes.length > 0) {
    const { error: sizeError } = await supabase
      .from("product_sizes")
      .insert(
        validSizes.map((s, i) => ({
          product_id: productId,
          tenant_id:  tenantId,
          label:      s.label.trim(),
          price:      Number(s.price) || 0,
          is_default: s.is_default,
          sort_order: i,
        }))
      );
    if (sizeError) throw sizeError;
  }
}

export async function deleteProduct(productId: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("products")
    .update({ is_active: false })
    .eq("product_id", productId);
  if (error) throw error;
}

// ── Ingredient Options (F&B only) ─────────────────────────────

export async function fetchIngredientOptions(
  tenantId: string
): Promise<IngredientOption[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("fnb_inventory_items")
    .select("item_id, name, base_unit")
    .eq("tenant_id", tenantId)
    .eq("is_active", true)
    .order("name");

  if (error) throw error;

  return (data ?? []).map((row: any) => ({
    item_id:         row.item_id,
    item_type:       "fnb" as const,
    name:            row.name,
    base_unit:       row.base_unit,
    unit_of_measure: row.base_unit,
    unit:            row.base_unit,
  }));
}

// ── Supabase Storage ──────────────────────────────────────────

export async function uploadProductImage(
  tenantId:  string,
  productId: string,
  file:      File
): Promise<string> {
  const supabase = createClient();
  const ext      = file.name.split(".").pop() ?? "jpg";
  const filePath = `${tenantId}/${productId}.${ext}`;

  const { error } = await supabase.storage
    .from("product-images")
    .upload(filePath, file, { upsert: true, contentType: file.type });

  if (error) throw error;

  const { data } = supabase.storage.from("product-images").getPublicUrl(filePath);
  return `${data.publicUrl}?t=${Date.now()}`;
}

export async function deleteProductImage(tenantId: string, productId: string): Promise<void> {
  const supabase = createClient();
  const exts = ["jpg", "jpeg", "png", "webp", "gif"];
  await Promise.allSettled(
    exts.map((ext) =>
      supabase.storage.from("product-images").remove([`${tenantId}/${productId}.${ext}`])
    )
  );
}