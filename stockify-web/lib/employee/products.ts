// lib/products.ts
// Supabase data-access layer for Products & Recipes

import { createClient } from "@/lib/supabase/client";
import { getCurrentUserContext } from "@/lib/employee/inventory";

// ── Types ─────────────────────────────────────────────────────

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
  // joined:
  category_name?: string;
  recipe?:        RecipeItem[];
};

export type RecipeItem = {
  recipe_id:  string;
  product_id: string;
  item_type:  "fnb" | "nfb";
  item_id:    string;
  amount:     number;
  unit:       string;
  // joined:
  ingredient_name?: string;
};

export type IngredientOption = {
  item_id:   string;
  item_type: "fnb" | "nfb";
  name:      string;
  base_unit: string; // for fnb
  unit_of_measure: string; // for nfb
  unit: string; // normalised — whichever applies
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

// ── Re-export context helper ──────────────────────────────────
export { getCurrentUserContext };

// ── Products CRUD ─────────────────────────────────────────────

export async function fetchProducts(tenantId: string): Promise<Product[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("products")
    .select(`
      *,
      product_categories ( name ),
      product_recipes (
        recipe_id, item_type, item_id, amount, unit
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
    recipe:        row.product_recipes ?? [],
  }));
}

export async function addProduct(
  tenantId: string,
  input: ProductInput,
  recipe: RecipeInput[]
): Promise<Product> {
  const supabase = createClient();

  // 1. Insert product
  const { data: product, error: productError } = await supabase
    .from("products")
    .insert({ ...input, tenant_id: tenantId })
    .select()
    .single();

  if (productError) throw productError;

  // 2. Insert recipe rows (if any)
  if (recipe.length > 0) {
    const recipeRows = recipe.map((r) => ({
      ...r,
      product_id: product.product_id,
      tenant_id:  tenantId,
    }));

    const { error: recipeError } = await supabase
      .from("product_recipes")
      .insert(recipeRows);

    if (recipeError) throw recipeError;
  }

  return product;
}

export async function updateProduct(
  productId: string,
  tenantId:  string,
  input:     Partial<ProductInput>,
  recipe:    RecipeInput[]
): Promise<void> {
  const supabase = createClient();

  // 1. Update product fields
  const { error: productError } = await supabase
    .from("products")
    .update(input)
    .eq("product_id", productId);

  if (productError) throw productError;

  // 2. Replace recipe: delete old rows, insert new ones
  const { error: deleteError } = await supabase
    .from("product_recipes")
    .delete()
    .eq("product_id", productId);

  if (deleteError) throw deleteError;

  if (recipe.length > 0) {
    const recipeRows = recipe.map((r) => ({
      ...r,
      product_id: productId,
      tenant_id:  tenantId,
    }));

    const { error: recipeError } = await supabase
      .from("product_recipes")
      .insert(recipeRows);

    if (recipeError) throw recipeError;
  }
}

export async function deleteProduct(productId: string): Promise<void> {
  const supabase = createClient();
  // Soft delete
  const { error } = await supabase
    .from("products")
    .update({ is_active: false })
    .eq("product_id", productId);

  if (error) throw error;
}

// ── Ingredient Options ────────────────────────────────────────
// Loads from BOTH fnb and nfb tables and merges them

export async function fetchIngredientOptions(
  tenantId: string
): Promise<IngredientOption[]> {
  const supabase = createClient();

  const [fnbRes, nfbRes] = await Promise.all([
    supabase
      .from("fnb_inventory_items")
      .select("item_id, name, base_unit")
      .eq("tenant_id", tenantId)
      .eq("is_active", true)
      .order("name"),
    supabase
      .from("nfb_inventory_items")
      .select("item_id, name, unit_of_measure")
      .eq("tenant_id", tenantId)
      .eq("is_active", true)
      .order("name"),
  ]);

  if (fnbRes.error) throw fnbRes.error;
  if (nfbRes.error) throw nfbRes.error;

  const fnbOptions: IngredientOption[] = (fnbRes.data ?? []).map((row: any) => ({
    item_id:         row.item_id,
    item_type:       "fnb" as const,
    name:            row.name,
    base_unit:       row.base_unit,
    unit_of_measure: row.base_unit,
    unit:            row.base_unit,
  }));

  const nfbOptions: IngredientOption[] = (nfbRes.data ?? []).map((row: any) => ({
    item_id:         row.item_id,
    item_type:       "nfb" as const,
    name:            row.name,
    base_unit:       row.unit_of_measure,
    unit_of_measure: row.unit_of_measure,
    unit:            row.unit_of_measure,
  }));

  return [...fnbOptions, ...nfbOptions];
}

// ── Supabase Storage Image Upload ─────────────────────────────

export async function uploadProductImage(
  tenantId:  string,
  productId: string,
  file:      File
): Promise<string> {
  const supabase = createClient();

  const ext      = file.name.split(".").pop() ?? "jpg";
  const filePath = `${tenantId}/${productId}.${ext}`;

  // Upsert so re-uploads overwrite cleanly
  const { error } = await supabase.storage
    .from("product-images")
    .upload(filePath, file, { upsert: true, contentType: file.type });

  if (error) throw error;

  const { data } = supabase.storage
    .from("product-images")
    .getPublicUrl(filePath);

  // Bust cache on re-upload by appending a timestamp query param
  return `${data.publicUrl}?t=${Date.now()}`;
}

export async function deleteProductImage(tenantId: string, productId: string): Promise<void> {
  const supabase = createClient();

  // Try common extensions — Storage doesn't tell us the ext so try all
  const exts = ["jpg", "jpeg", "png", "webp", "gif"];
  await Promise.allSettled(
    exts.map((ext) =>
      supabase.storage
        .from("product-images")
        .remove([`${tenantId}/${productId}.${ext}`])
    )
  );
}