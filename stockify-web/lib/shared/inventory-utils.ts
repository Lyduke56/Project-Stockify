import { createClient } from "@/lib/supabase/client";

/**
 * Recalculates the max_yield for a product based on its recipe and current inventory levels.
 */
export async function recalculateMaxYield(productId: string, tenantId: string) {
  const supabase = createClient();

  console.log(`[recalculateMaxYield] Starting recalculation for product: ${productId} (Tenant: ${tenantId})`);

  const { data: recipes, error: recipeError } = await supabase
    .from("product_recipes")
    .select("item_id, amount, size_label")
    .eq("product_id", productId)
    .eq("tenant_id", tenantId);

  if (recipeError) {
    console.error(`[recalculateMaxYield] Error fetching recipes for ${productId}:`, recipeError);
    return;
  }

  if (!recipes || recipes.length === 0) {
    console.log(`[recalculateMaxYield] No recipes found for ${productId}. Skipping yield update.`);
    return;
  }

  const sizes = Array.from(new Set(recipes.map(r => r.size_label)));
  console.log(`[recalculateMaxYield] Found ${recipes.length} recipe rows across sizes:`, sizes);

  let baseMinYield = Infinity;
  const sizeYieldMap: Record<string, number> = {};

  // Fetch all ingredients involved to avoid multiple calls if needed, 
  // but for simplicity we'll stay with the current loop unless performance is an issue.
  for (const size of sizes) {
    const sizeRecipes = recipes.filter(r => r.size_label === size);
    let sizeMinYield = Infinity;

    for (const recipe of sizeRecipes) {
      const { data: inv, error: invError } = await supabase
        .from("fnb_inventory_items")
        .select("stock")
        .eq("item_id", recipe.item_id)
        .single();
      
      if (invError) {
        console.error(`[recalculateMaxYield] Error fetching ingredient ${recipe.item_id}:`, invError);
        sizeMinYield = 0; // If ingredient missing, assume 0 yield
        break;
      }

      if (inv) {
        const stock = Number(inv.stock || 0);
        const amountNeeded = Number(recipe.amount || 0);
        
        if (amountNeeded <= 0) {
          console.warn(`[recalculateMaxYield] Recipe amount for ${recipe.item_id} is 0 or less. Skipping.`);
          continue;
        }

        const possibleYield = Math.floor(stock / amountNeeded);
        if (possibleYield < sizeMinYield) {
          sizeMinYield = possibleYield;
        }
      }
    }

    if (sizeMinYield === Infinity) sizeMinYield = 0;

    if (size) {
      sizeYieldMap[size] = sizeMinYield;
    } else {
      baseMinYield = sizeMinYield;
    }
  }

  // 1. Update Sizes
  for (const [sizeLabel, yieldVal] of Object.entries(sizeYieldMap)) {
    console.log(`[recalculateMaxYield] Updating size [${sizeLabel}] yield to: ${yieldVal}`);
    await supabase
      .from("product_sizes")
      .update({ max_yield: yieldVal })
      .eq("product_id", productId)
      .eq("label", sizeLabel);
  }

  // 2. Update Main Product Yield
  // If we have a base yield (no size_label), use it. 
  // If we ONLY have sizes, we might want to set main yield to 0 or leave it.
  // But if baseMinYield is still Infinity, it means there was NO recipe with null size_label.
  const finalMainYield = baseMinYield === Infinity ? 0 : baseMinYield;
  
  console.log(`[recalculateMaxYield] Updating main product yield to: ${finalMainYield}`);
  const { error: updateError } = await supabase
    .from("products")
    .update({ max_yield: finalMainYield })
    .eq("product_id", productId);

  if (updateError) {
    console.error(`[recalculateMaxYield] Failed to update products.max_yield:`, updateError);
  }
}

/**
 * Recalculates yield for all products that use a specific ingredient.
 */
export async function recalculateYieldsForIngredient(itemId: string, tenantId: string) {
  const supabase = createClient();
  
  console.log(`[recalculateYieldsForIngredient] Finding products using ingredient: ${itemId}`);

  const { data: recipes, error } = await supabase
    .from("product_recipes")
    .select("product_id")
    .eq("item_id", itemId)
    .eq("tenant_id", tenantId);

  if (error) {
    console.error(`[recalculateYieldsForIngredient] Error fetching recipes:`, error);
    return;
  }

  if (!recipes || recipes.length === 0) {
    console.log(`[recalculateYieldsForIngredient] No products found using this ingredient.`);
    return;
  }

  const productIds = Array.from(new Set(recipes.map(r => r.product_id)));
  console.log(`[recalculateYieldsForIngredient] Recalculating yields for ${productIds.length} products:`, productIds);
  
  await Promise.all(productIds.map(pid => recalculateMaxYield(pid, tenantId)));
}
