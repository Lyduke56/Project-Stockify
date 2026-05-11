// lib/categories.ts
// Type-aware category data access
// Replaces the category functions previously in lib/inventory.ts
// Uses the shared product_categories table with a `type` column

import { createClient } from "@/lib/supabase/client";

// ── Types ─────────────────────────────────────────────────────

export type CategoryType = "product" | "ingredient";

export type Category = {
  category_id: string;
  tenant_id:   string;
  name:        string;
  type:        CategoryType;
  created_at:  string;
};

// ── CRUD ──────────────────────────────────────────────────────

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