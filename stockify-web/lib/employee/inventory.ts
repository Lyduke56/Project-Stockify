
import { createClient } from "@/lib/supabase/client";
import { recalculateYieldsForIngredient } from "@/lib/shared/inventory-utils";

// ── Types ─────────────────────────────────────────────────────

export type BusinessType = "Food & Beverage" | "Non Food & Beverage" | "Food and Beverage" | "Non Food and Beverage";

export type CategoryType = "fnb_product" | "nfb_product" | "fnb_ingredient" | "nfb_ingredient";

export type Category = {
  category_id: string;
  tenant_id:   string;
  name:        string;
  type:        CategoryType;
  created_at:  string;
};

export type FnbItem = {
  item_id:        string;
  tenant_id:      string;
  category_id:    string | null;
  name:           string;
  sku:            string;
  stock:          number;
  base_unit:      string;
  purchase_unit:  string;
  conversion:     number;
  alert_limit:    number;
  unit_cost:      number;
  nearest_expiry: string | null;
  is_active:      boolean;
  created_at:     string;
  updated_at:     string;
  // joined:
  category_name?: string;
};

export type NfbItem = {
  item_id:           string;
  tenant_id:         string;
  category_id:       string | null;
  name:              string;
  sku:               string;
  quantity:          number;
  unit_of_measure:   string;
  reorder_threshold: number;
  unit_price:        number;
  is_active:         boolean;
  created_at:        string;
  updated_at:        string;
  // joined:
  category_name?: string;
};

// ── Auth context helper ───────────────────────────────────────

export async function getCurrentUserContext(): Promise<{
  userId:       string;
  tenantId:     string;
  businessType: BusinessType;
} | null> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: userData } = await supabase
    .from("users")
    .select("tenant_id")
    .eq("user_id", user.id)
    .single();

  if (!userData?.tenant_id) return null;

  const { data: tenantData } = await supabase
    .from("tenants")
    .select("business_type")
    .eq("tenant_id", userData.tenant_id)
    .single();

  if (!tenantData) return null;

  return {
    userId:       user.id,
    tenantId:     userData.tenant_id,
    businessType: tenantData.business_type as BusinessType,
  };
}

// ── Categories ────────────────────────────────────────────────
// ✅ Always requires a type — prevents product/ingredient categories mixing

export async function fetchCategories(
  tenantId: string,
  type: CategoryType
): Promise<Category[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("product_categories")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("type", type)
    .order("name");

  if (error) throw error;
  return data ?? [];
}

export async function addCategory(
  tenantId: string,
  name:     string,
  type:     CategoryType
): Promise<Category> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("product_categories")
    .insert({ tenant_id: tenantId, name: name.trim(), type })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateCategoryName(
  categoryId: string,
  name:       string
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("product_categories")
    .update({ name: name.trim() })
    .eq("category_id", categoryId);

  if (error) throw error;
}

export async function deleteCategory(categoryId: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("product_categories")
    .delete()
    .eq("category_id", categoryId);

  if (error) throw error;
}

// ── F&B Items ─────────────────────────────────────────────────

export async function fetchFnbItems(tenantId: string): Promise<FnbItem[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("fnb_inventory_items")
    .select(`*, product_categories ( name )`)
    .eq("tenant_id", tenantId)
    .order("name");

  if (error) throw error;

  return (data ?? []).map((row: any) => ({
    ...row,
    category_name: row.product_categories?.name ?? "Uncategorized",
  }));
}

export type FnbItemInput = Omit<FnbItem,
  "item_id" | "tenant_id" | "is_active" | "created_at" | "updated_at" | "category_name"
>;

export async function addFnbItem(
  tenantId: string,
  input:    FnbItemInput
): Promise<FnbItem> {
    const supabase = createClient();

  // Unique check
  const { data: existing } = await supabase
    .from("fnb_inventory_items")
    .select("name, sku")
    .eq("tenant_id", tenantId)
    .or(`name.ilike."${input.name.trim()}",sku.ilike."${input.sku.trim()}"`)
    .maybeSingle();

  if (existing) {
    if (existing.name.toLowerCase() === input.name.trim().toLowerCase()) {
      throw new Error(`Item with name "${input.name}" already exists.`);
    }
    if (existing.sku.toLowerCase() === input.sku.trim().toLowerCase()) {
      throw new Error(`Item with SKU "${input.sku}" already exists.`);
    }
  }

  const { data, error } = await supabase
    .from("fnb_inventory_items")
    .insert({ ...input, tenant_id: tenantId })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateFnbItem(
  itemId: string,
  input:  Partial<FnbItemInput>
): Promise<void> {
    const supabase = createClient();
  
  // Unique check
  if (input.name || input.sku) {
    let filters = [];
    if (input.name) filters.push(`name.ilike."${input.name.trim()}"`);
    if (input.sku)  filters.push(`sku.ilike."${input.sku.trim()}"`);

    // We need tenantId to check uniqueness across items of the same tenant
    const { data: currentItem } = await supabase.from("fnb_inventory_items").select("tenant_id").eq("item_id", itemId).single();

    if (currentItem) {
      const { data: existing } = await supabase
        .from("fnb_inventory_items")
        .select("name, sku")
        .eq("tenant_id", currentItem.tenant_id)
        .neq("item_id", itemId)
        .or(filters.join(","))
        .maybeSingle();

      if (existing) {
        if (input.name && existing.name.toLowerCase() === input.name.trim().toLowerCase()) {
          throw new Error(`Item with name "${input.name}" already exists.`);
        }
        if (input.sku && existing.sku.toLowerCase() === input.sku.trim().toLowerCase()) {
          throw new Error(`Item with SKU "${input.sku}" already exists.`);
        }
      }
    }
  }

  
  // Get tenant_id first to use in recalculation
  const { data: item } = await supabase
    .from("fnb_inventory_items")
    .select("tenant_id")
    .eq("item_id", itemId)
    .single();

  const { error } = await supabase
    .from("fnb_inventory_items")
    .update(input)
    .eq("item_id", itemId);

  if (error) throw error;

  // Trigger recalculation if stock was updated
  if (item && (input.stock !== undefined || input.conversion !== undefined)) {
    recalculateYieldsForIngredient(itemId, item.tenant_id).catch(err => {
      console.error("[updateFnbItem] Yield recalculation failed:", err);
    });
  }
}

// ✅ Hard delete — permanently removes from DB
export async function deleteFnbItem(itemId: string): Promise<void> {
  const supabase = createClient();

  // Get tenant_id and find affected products before deletion
  const { data: item } = await supabase.from("fnb_inventory_items").select("tenant_id").eq("item_id", itemId).single();
  
  if (item) {
    // We need to trigger this to find which products were using it
    await recalculateYieldsForIngredient(itemId, item.tenant_id);
  }

  const { error } = await supabase
    .from("fnb_inventory_items")
    .delete()
    .eq("item_id", itemId);

  if (error) throw error;
}

// ── NF&B Items ────────────────────────────────────────────────

export async function fetchNfbItems(tenantId: string): Promise<NfbItem[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("nfb_inventory_items")
    .select(`*, product_categories ( name )`)
    .eq("tenant_id", tenantId)
    .order("name");

  if (error) throw error;

  return (data ?? []).map((row: any) => ({
    ...row,
    category_name: row.product_categories?.name ?? "Uncategorized",
  }));
}

export type NfbItemInput = Omit<NfbItem,
  "item_id" | "tenant_id" | "is_active" | "created_at" | "updated_at" | "category_name"
>;

export async function addNfbItem(
  tenantId: string,
  input:    NfbItemInput
): Promise<NfbItem> {
    const supabase = createClient();

  // Unique check
  const { data: existing } = await supabase
    .from("nfb_inventory_items")
    .select("name, sku")
    .eq("tenant_id", tenantId)
    .or(`name.ilike."${input.name.trim()}",sku.ilike."${input.sku.trim()}"`)
    .maybeSingle();

  if (existing) {
    if (existing.name.toLowerCase() === input.name.trim().toLowerCase()) {
      throw new Error(`Item with name "${input.name}" already exists.`);
    }
    if (existing.sku.toLowerCase() === input.sku.trim().toLowerCase()) {
      throw new Error(`Item with SKU "${input.sku}" already exists.`);
    }
  }

  const { data, error } = await supabase
    .from("nfb_inventory_items")
    .insert({ ...input, tenant_id: tenantId })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateNfbItem(
  itemId: string,
  input:  Partial<NfbItemInput>
): Promise<void> {
    const supabase = createClient();

  // Unique check
  if (input.name || input.sku) {
    let filters = [];
    if (input.name) filters.push(`name.ilike."${input.name.trim()}"`);
    if (input.sku)  filters.push(`sku.ilike."${input.sku.trim()}"`);

    const { data: currentItem } = await supabase.from("nfb_inventory_items").select("tenant_id").eq("item_id", itemId).single();

    if (currentItem) {
      const { data: existing } = await supabase
        .from("nfb_inventory_items")
        .select("name, sku")
        .eq("tenant_id", currentItem.tenant_id)
        .neq("item_id", itemId)
        .or(filters.join(","))
        .maybeSingle();

      if (existing) {
        if (input.name && existing.name.toLowerCase() === input.name.trim().toLowerCase()) {
          throw new Error(`Item with name "${input.name}" already exists.`);
        }
        if (input.sku && existing.sku.toLowerCase() === input.sku.trim().toLowerCase()) {
          throw new Error(`Item with SKU "${input.sku}" already exists.`);
        }
      }
    }
  }

  const { error } = await supabase
    .from("nfb_inventory_items")
    .update(input)
    .eq("item_id", itemId);

  if (error) throw error;
}

// ✅ Hard delete — permanently removes from DB
export async function deleteNfbItem(itemId: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("nfb_inventory_items")
    .delete()
    .eq("item_id", itemId);

  if (error) throw error;
}