// lib/employee/products.ts
// Supabase data-access layer for Products, Recipes & Sizes

import { createClient } from "@/lib/supabase/client";
import { getCurrentUserContext } from "@/lib/employee/inventory";
import { logAuditEvent } from "@/lib/employee/order-actions";
import { recalculateMaxYield } from "@/lib/shared/inventory-utils";

// ─── Audit helper (fire-and-forget) ───────────────────────────────────────────
async function getAuditCtx() {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { data: u } = await supabase
      .from("users")
      .select("first_name, last_name, display_name")
      .eq("user_id", user.id)
      .single();
    const userName = u?.first_name && u?.last_name
      ? `${u.first_name} ${u.last_name}` : u?.display_name ?? user.email ?? "Unknown";
    return { userId: user.id, userName };
  } catch { return null; }
}

// ── Types ─────────────────────────────────────────────────────

export type ProductSize = {
  size_id:    string;
  product_id: string;
  label:      string;
  price:      number;
  is_default: boolean;
  sort_order: number;
  max_yield:  number;
  unit_cost:  number;
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
  size_label?: string | null;
};

export type IngredientOption = {
  item_id:         string;
  item_type:       "fnb" | "nfb";
  name:            string;
  base_unit:       string;
  unit_of_measure: string;
  unit:            string;
  cost_per_base_unit?: number;
  stock?:          number;
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
  size_label?: string | null;
};

export type SizeInput = {
  label:      string;
  price:      string;
  is_default: boolean;
  max_yield:  string;
  unit_cost?: number;
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
      product_recipes ( recipe_id, item_type, item_id, amount, unit, size_label ),
      product_sizes   ( size_id, label, price, is_default, sort_order, max_yield, unit_cost )
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
    ).map((s: any) => ({ ...s, max_yield: Number(s.max_yield) || 0, unit_cost: Number(s.unit_cost) || 0 })),
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
      .insert(recipe.map((r) => ({ ...r, product_id: product.product_id, tenant_id: tenantId, size_label: r.size_label || null })));
    if (recipeError) {
      await supabase.from("products").delete().eq("product_id", product.product_id);
      throw recipeError;
    }
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
          max_yield:  Number(s.max_yield) || 0,
          unit_cost:  s.unit_cost || 0,
        }))
      );
    if (sizeError) {
      await supabase.from("products").delete().eq("product_id", product.product_id);
      throw sizeError;
    }
  }

  // Recalculate yield for F&B products
  if (recipe.length > 0) {
    recalculateMaxYield(product.product_id, tenantId).catch(err => {
      console.error("[addProduct] Yield recalculation failed:", err);
    });
  }

  // Fire-and-forget audit log
  getAuditCtx().then((ctx) => {
    if (!ctx) return;
    logAuditEvent({
      tenantId,
      userId:     ctx.userId,
      userName:   ctx.userName,
      action:     "CREATE",
      entityType: "product",
      entityId:   product.product_id,
      entityName: product.name,
      details:    { sku: product.sku, sizes: sizes.length, recipe_items: recipe.length },
    });
  });

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
      .insert(recipe.map((r) => ({ ...r, product_id: productId, tenant_id: tenantId, size_label: r.size_label || null })));
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
          max_yield:  Number(s.max_yield) || 0,
          unit_cost:  s.unit_cost || 0,
        }))
      );
    if (sizeError) throw sizeError;
  }

  // Recalculate yield for F&B products
  if (recipe.length > 0) {
    recalculateMaxYield(productId, tenantId).catch(err => {
      console.error("[updateProduct] Yield recalculation failed:", err);
    });
  }

  // Fire-and-forget audit log
  getAuditCtx().then((ctx) => {
    if (!ctx) return;
    logAuditEvent({
      tenantId,
      userId:     ctx.userId,
      userName:   ctx.userName,
      action:     "UPDATE",
      entityType: "product",
      entityId:   productId,
      entityName: input.name ?? productId,
      details:    { sku: input.sku, sizes: sizes.length, recipe_items: recipe.length },
    });
  });
}

export async function deleteProduct(productId: string, tenantId?: string, productName?: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("products")
    .delete()
    .eq("product_id", productId);
  if (error) throw error;

  // Fire-and-forget audit log
  if (tenantId) {
    getAuditCtx().then((ctx) => {
      if (!ctx) return;
      logAuditEvent({
        tenantId,
        userId:     ctx.userId,
        userName:   ctx.userName,
        action:     "DELETE",
        entityType: "product",
        entityId:   productId,
        entityName: productName ?? productId,
      });
    });
  }
}

// ── Ingredient Options (F&B only) ─────────────────────────────

// ── Ingredient Options (F&B only) ─────────────────────────────

export async function fetchIngredientOptions(
  tenantId: string
): Promise<IngredientOption[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("fnb_inventory_items")
    .select("item_id, name, base_unit, unit_cost, conversion, stock")
    .eq("tenant_id", tenantId)
    .eq("is_active", true)
    .order("name");

  if (error) throw error;

  return (data ?? []).map((row: any) => {
    const costPerBase = row.conversion && row.conversion > 0 
      ? Number(row.unit_cost || 0) / Number(row.conversion) 
      : Number(row.unit_cost || 0);

    return {
      item_id:         row.item_id,
      item_type:       "fnb" as const,
      name:            row.name,
      base_unit:       row.base_unit,
      unit_of_measure: row.base_unit,
      unit:            row.base_unit,
      cost_per_base_unit: costPerBase,
      stock:           Number(row.stock || 0),
    };
  });
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