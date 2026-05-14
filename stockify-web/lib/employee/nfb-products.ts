// lib/employee/nfb-products.ts
// Supabase data-access layer for NF&B Products & Variants
// NOTE: NF&B no longer has a separate ingredients/components table.
// Stock is managed directly via nfb_products.quantity.

import { createClient } from "@/lib/supabase/client";
import { recalculateNfbProductQuantity } from "@/lib/shared/inventory-utils";
import { logAuditEvent } from "@/lib/employee/order-actions";

// ─── Audit helper ─────────────────────────────────────────────────
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

export type NfbVariantOption = {
  option_id:       string;
  variant_type_id: string;
  label:           string;
  price:           number;
  unit_cost:       number;
  stock:           number;
  reorder_threshold: number;
  unit_of_measure: string | null;
  sort_order:      number;
};

export type NfbVariantType = {
  variant_type_id: string;
  product_id:      string;
  name:            string;
  sort_order:      number;
  options:         NfbVariantOption[];
};

export type NfbProduct = {
  product_id:      string;
  tenant_id:       string;
  category_id:     string | null;
  name:            string;
  sku:             string;
  description:     string | null;
  image_url:       string | null;
  quantity:        number;
  unit_of_measure: string;
  unit_cost:       number;
  price:           number;
  reorder_threshold: number;
  visible:         boolean;
  is_active:       boolean;
  created_at:      string;
  updated_at:      string;
  category_name?:  string;
  variants?:       NfbVariantType[];
};

export type NfbProductInput = {
  category_id:     string | null;
  name:            string;
  sku:             string;
  description:     string | null;
  image_url?:      string | null;
  quantity:        number;
  unit_of_measure: string;
  unit_cost:       number;
  price:           number;
  reorder_threshold: number;
  visible:         boolean;
};

export type VariantOptionInput = {
  label:      string;
  price:      string;
  unit_cost?: string;
  stock:      string;
  reorder_threshold?: string;
  unit_of_measure: string;
};

export type VariantTypeInput = {
  name:    string;
  options: VariantOptionInput[];
};

// ── Error normaliser ──────────────────────────────────────────

function normaliseError(e: any, sku: string): Error {
  const msg: string  = e?.message ?? "";
  const code: string = e?.code    ?? "";

  if (
    code === "23505" ||
    msg.includes("uq_nfb_product_sku_per_tenant") ||
    msg.includes("duplicate key value")
  ) {
    return new Error(
      `SKU "${sku.toUpperCase()}" is already used by another product. Please choose a unique SKU code.`
    );
  }
  return new Error(msg || "An unexpected error occurred. Please try again.");
}

// ── Products CRUD ─────────────────────────────────────────────

export async function fetchNfbProducts(tenantId: string): Promise<NfbProduct[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("nfb_products")
    .select(`
      *,
      product_categories ( name ),
      nfb_variant_types (
        variant_type_id, name, sort_order,
        nfb_variant_options ( option_id, label, price, unit_cost, stock, reorder_threshold, sku_suffix, sort_order )
      )
    `)
    .eq("tenant_id", tenantId)
    .order("name");

  if (error) throw error;

  return (data ?? []).map((row: any) => ({
    ...row,
    unit_cost:           Number(row.unit_cost),
    price:               Number(row.price),
    reorder_threshold:   Number(row.reorder_threshold ?? 0),
    image_url:           row.image_url ?? null,
    category_name: row.product_categories?.name ?? "Uncategorized",
    variants: (row.nfb_variant_types ?? [])
      .sort((a: NfbVariantType, b: NfbVariantType) => a.sort_order - b.sort_order)
      .map((vt: any) => ({
        ...vt,
        options: (vt.nfb_variant_options ?? []).sort(
          (a: NfbVariantOption, b: NfbVariantOption) => a.sort_order - b.sort_order
        ).map((o: any) => ({
          ...o,
          unit_of_measure: o.sku_suffix ?? "pcs",
        })),
      })),
  }));
}

export async function addNfbProduct(
  tenantId: string,
  input:    NfbProductInput,
  variants: VariantTypeInput[]
): Promise<NfbProduct> {
  const supabase = createClient();
  
  // Unique check
  const { data: existing } = await supabase
    .from("nfb_products")
    .select("name, sku")
    .eq("tenant_id", tenantId)
    .or(`name.ilike."${input.name.trim()}",sku.ilike."${input.sku.trim()}"`)
    .maybeSingle();

  if (existing) {
    if (existing.name.toLowerCase() === input.name.trim().toLowerCase()) {
      throw new Error(`Product with name "${input.name}" already exists.`);
    }
    if (existing.sku.toLowerCase() === input.sku.trim().toLowerCase()) {
      throw new Error(`Product with SKU "${input.sku}" already exists.`);
    }
  }
  // Prepare payload safely
  const payload: any = { ...input, tenant_id: tenantId };

  const { data: product, error: productError } = await supabase
    .from("nfb_products")
    .insert(payload)
    .select()
    .single();

  if (productError) throw normaliseError(productError, input.sku);

  // Insert variant types + options
  for (const [i, vt] of variants.entries()) {
    if (!vt.name.trim()) continue;

    const { data: vtRow, error: vtError } = await supabase
      .from("nfb_variant_types")
      .insert({
        product_id: product.product_id,
        tenant_id:  tenantId,
        name:       vt.name.trim(),
        sort_order: i,
      })
      .select()
      .single();

    if (vtError) throw vtError;

    const validOptions = vt.options.filter((o) => o.label.trim());
    if (vtRow && validOptions.length > 0) {
      const { error: optError } = await supabase
        .from("nfb_variant_options")
        .insert(
          validOptions.map((o, j) => ({
            variant_type_id: vtRow.variant_type_id,
            product_id:      product.product_id,
            tenant_id:       tenantId,
            label:           o.label.trim(),
            price:           Number(o.price) || 0,
            unit_cost:       Number(o.unit_cost) || 0,
            stock:           Number(o.stock) || 0,
            reorder_threshold: Number(o.reorder_threshold) || 0,
            sku_suffix:      o.unit_of_measure.trim() || null,
            sort_order:      j,
          }))
        );
    }
  }

  // Recalculate main product quantity as sum of variants
  if (variants.length > 0) {
    await recalculateNfbProductQuantity(product.product_id, tenantId);
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
      details:    { sku: product.sku, variants: variants.length },
    });
  });

  return product;
}

export async function updateNfbProduct(
  productId: string,
  tenantId:  string,
  input:     Partial<NfbProductInput>,
  variants:  VariantTypeInput[]
): Promise<void> {
    const supabase = createClient();

  // Unique check
  if (input.name || input.sku) {
    let filters = [];
    if (input.name) filters.push(`name.ilike."${input.name.trim()}"`);
    if (input.sku)  filters.push(`sku.ilike."${input.sku.trim()}"`);

    const { data: existing } = await supabase
      .from("nfb_products")
      .select("name, sku")
      .eq("tenant_id", tenantId)
      .neq("product_id", productId)
      .or(filters.join(","))
      .maybeSingle();

    if (existing) {
      if (input.name && existing.name.toLowerCase() === input.name.trim().toLowerCase()) {
        throw new Error(`Product with name "${input.name}" already exists.`);
      }
      if (input.sku && existing.sku.toLowerCase() === input.sku.trim().toLowerCase()) {
        throw new Error(`Product with SKU "${input.sku}" already exists.`);
      }
    }
  }


  const payload = { ...input };

  const { error: productError } = await supabase
    .from("nfb_products")
    .update(payload)
    .eq("product_id", productId);

  if (productError) throw normaliseError(productError, input.sku ?? "");

  // Replace variants — cascade delete handles options automatically
  await supabase.from("nfb_variant_types").delete().eq("product_id", productId);

  for (const [i, vt] of variants.entries()) {
    if (!vt.name.trim()) continue;

    const { data: vtRow, error: vtError } = await supabase
      .from("nfb_variant_types")
      .insert({
        product_id: productId,
        tenant_id:  tenantId,
        name:       vt.name.trim(),
        sort_order: i,
      })
      .select()
      .single();

    if (vtError) throw vtError;

    const validOptions = vt.options.filter((o) => o.label.trim());
    if (vtRow && validOptions.length > 0) {
      const { error: optError } = await supabase
        .from("nfb_variant_options")
        .insert(
          validOptions.map((o, j) => ({
            variant_type_id: vtRow.variant_type_id,
            product_id:      productId,
            tenant_id:       tenantId,
            label:           o.label.trim(),
            price:           Number(o.price) || 0,
            unit_cost:       Number(o.unit_cost) || 0,
            stock:           Number(o.stock) || 0,
            reorder_threshold: Number(o.reorder_threshold) || 0,
            sku_suffix:      o.unit_of_measure.trim() || null,
            sort_order:      j,
          }))
        );
      if (optError) throw optError;
    }
  }

  // Recalculate main product quantity as sum of variants
  if (variants.length > 0) {
    await recalculateNfbProductQuantity(productId, tenantId);
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
      details:    { sku: input.sku, variants: variants.length },
    });
  });
}

// Hard delete — permanently removes product, its variant types/options (via cascade), and its image
export async function deleteNfbProduct(productId: string, tenantId?: string, productName?: string): Promise<void> {
  const supabase = createClient();

  // Delete image from storage if one exists
  if (tenantId) {
    const exts = ["jpg", "jpeg", "png", "webp", "gif"];
    await Promise.allSettled(
      exts.map((ext) =>
        supabase.storage.from("product-images").remove([`${tenantId}/nfb-${productId}.${ext}`])
      )
    );
  }

  // Hard delete — variant_types and variant_options are removed via CASCADE
  const { error } = await supabase
    .from("nfb_products")
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


// ─── Image Upload ─────────────────────────────────────────────────────────────

export async function uploadNfbProductImage(
  tenantId:  string,
  productId: string,
  file:      File
): Promise<string> {
  if (file.size > 5 * 1024 * 1024) {
    throw new Error("File size exceeds 5MB limit.");
  }
  const supabase = createClient();
  const ext      = file.name.split(".").pop() ?? "jpg";
  const filePath = `${tenantId}/nfb-${productId}.${ext}`;

  const { error } = await supabase.storage
    .from("product-images")
    .upload(filePath, file, { upsert: true, contentType: file.type });

  if (error) throw error;

  const { data } = supabase.storage.from("product-images").getPublicUrl(filePath);
  return `${data.publicUrl}?t=${Date.now()}`;
}