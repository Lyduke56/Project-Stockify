import { createClient } from "@/lib/supabase/client";


const UNIT_CONVERSIONS: Record<string, number> = {
  // Weight
  'g': 1,
  'kg': 1000,
  'oz': 28.3495,
  'lb': 453.592,
  // Volume
  'ml': 1,
  'l': 1000,
  'tsp': 4.92892,
  'tbsp': 14.7868,
  'cup': 240,
  'pt': 473.176,
  'qt': 946.353,
  'gal': 3785.41,
  // Count
  'pcs': 1,
  'unit': 1,
  'pack': 1,
};

function getConversionFactor(fromUnit: string, toUnit: string): number {
  if (fromUnit === toUnit) return 1;
  const fromBase = UNIT_CONVERSIONS[fromUnit.toLowerCase()];
  const toBase = UNIT_CONVERSIONS[toUnit.toLowerCase()];
  if (!fromBase || !toBase) return 1;
  return fromBase / toBase;
}

/**
 * Recalculates the max_yield for a product based on its recipe and current inventory levels.
 */
export async function recalculateMaxYield(productId: string, tenantId: string) {
  const supabase = createClient();

  console.log(`[recalculateMaxYield] Starting recalculation for product: ${productId} (Tenant: ${tenantId})`);

  const { data: recipes, error: recipeError } = await supabase
    .from("product_recipes")
    .select("item_id, amount, unit, size_label")
    .eq("product_id", productId)
    .eq("tenant_id", tenantId);

  if (recipeError) {
    console.error(`[recalculateMaxYield] Error fetching recipes for ${productId}:`, recipeError);
    return;
  }

  if (!recipes || recipes.length === 0) {
    console.log(`[recalculateMaxYield] No recipes found for ${productId}. Resetting all yields to 0.`);
    // Reset all sizes
    await supabase.from("product_sizes").update({ max_yield: 0 }).eq("product_id", productId);
    // Reset main product
    await supabase.from("products").update({ max_yield: 0 }).eq("product_id", productId);
    return;
  }

  // 0. Fetch all sizes for this product to ensure we check every variant
  // 0. Fetch all sizes for this product to ensure we check every variant
  const { data: allSizes } = await supabase
    .from("product_sizes")
    .select("label")
    .eq("product_id", productId)
    .eq("tenant_id", tenantId);

  const sizeLabels = allSizes?.map((s: any) => s.label) || [];
  const recipeSizes = Array.from(new Set(recipes.map((r: any) => r.size_label)));
  
  // Combine them: every size should be considered
  const allConsideredSizes = Array.from(new Set([...sizeLabels, ...recipeSizes]));
  
  console.log(`[recalculateMaxYield] Analyzing yield for product ${productId} with sizes:`, allConsideredSizes);

  let baseMinYield = Infinity;
  const sizeYieldMap: Record<string, number> = {};

  for (const size of allConsideredSizes) {
    // Exact match for size label
    const sizeRecipes = recipes.filter((r: any) => 
      (size === null && r.size_label === null) || 
      (size !== null && r.size_label === size)
    );
    
    // If no recipe for this size, yield is 0
    if (sizeRecipes.length === 0 && size !== null) {
      sizeYieldMap[size as string] = 0;
      continue;
    }

    let sizeMinYield = Infinity;

    for (const recipe of sizeRecipes) {
      const { data: inv, error: invError } = await supabase
        .from("fnb_inventory_items")
        .select("stock, base_unit")
        .eq("item_id", recipe.item_id)
        .eq("tenant_id", tenantId)
        .single();
      
      if (invError || !inv) {
        console.warn(`[recalculateMaxYield] Ingredient ${recipe.item_id} not found or error. Setting yield to 0.`);
        sizeMinYield = 0; 
        break;
      }

      const stock = Number(inv.stock || 0);
      const amountNeededRaw = Number(recipe.amount || 0);
      
      if (amountNeededRaw <= 0) {
        console.warn(`[recalculateMaxYield] Recipe amount for ${recipe.item_id} is 0. Skipping.`);
        continue;
      }

      const factor = getConversionFactor(recipe.unit || "unit", inv.base_unit || "unit");
      const amountNeededInBase = amountNeededRaw * factor;

      const possibleYield = amountNeededInBase > 0 ? Math.floor(stock / amountNeededInBase) : 0;
      
      if (possibleYield < sizeMinYield) {
        sizeMinYield = possibleYield;
      }
    }

    if (sizeMinYield === Infinity) sizeMinYield = 0;

    if (size) {
      sizeYieldMap[size] = sizeMinYield;
    } else {
      baseMinYield = sizeMinYield;
    }
  }

  // 1. Update Sizes in DB
  for (const [sizeLabel, yieldVal] of Object.entries(sizeYieldMap)) {
    await supabase
      .from("product_sizes")
      .update({ max_yield: yieldVal })
      .eq("product_id", productId)
      .eq("tenant_id", tenantId)
      .eq("label", sizeLabel);
  }

  // 2. Update Main Product Yield
  // For F&B, "Main Yield" is the maximum possible yield of any single size.
  let finalMainYield = 0;
  const sizeYieldValues = Object.values(sizeYieldMap);
  
  if (sizeYieldValues.length > 0) {
    finalMainYield = Math.max(...sizeYieldValues);
  } else {
    finalMainYield = baseMinYield === Infinity ? 0 : baseMinYield;
  }
  
  console.log(`[recalculateMaxYield] Final product yield: ${finalMainYield}`);
  await supabase
    .from("products")
    .update({ max_yield: finalMainYield })
    .eq("product_id", productId)
    .eq("tenant_id", tenantId);
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
  const productIds = Array.from(new Set(recipes.map((r: any) => r.product_id)));
  await Promise.all(productIds.map((pid: any) => recalculateMaxYield(pid, tenantId)));
}

export interface InventoryValidationResult {
  isPossible: boolean;
  error?: string;
  bottlenecks?: {
    item_name: string;
    requested: number;
    possible: number;
    reason: string;
  }[];
}

/**
 * Validates if the total sum of items in a cart can be fulfilled by current inventory.
 * Aggregates overlapping ingredients across different products.
 */
export async function validateInventoryForOrder(
  tenantId: string,
  items: {
    item_id: string;
    item_type: string;
    item_name: string;
    size_label: string | null;
    quantity: number;
  }[]
): Promise<InventoryValidationResult> {
  const supabase = createClient();
  
  // Maps to track total requirements and which items use them
  const ingredientRequirements: Record<string, { amount: number; unit: string; name: string; affectedItems: string[] }> = {};
  const nfbRequirements: Record<string, { qty: number; name: string }> = {};
  const nfbVariantRequirements: Record<string, { qty: number; label: string }> = {};

  // 1. Aggregate all requirements
  for (const item of items) {
    if (item.item_type === "nfb_single") {
      nfbRequirements[item.item_id] = {
        qty: (nfbRequirements[item.item_id]?.qty || 0) + item.quantity,
        name: item.item_name
      };
    } else if (item.item_type === "nfb_variant") {
      nfbVariantRequirements[item.item_id] = {
        qty: (nfbVariantRequirements[item.item_id]?.qty || 0) + item.quantity,
        label: item.item_name
      };
    } else if (item.item_type === "fnb_single" || item.item_type === "fnb_size") {
      let productId = item.item_id;
      let sizeLabel = item.size_label;

      if (item.item_type === "fnb_size") {
        const { data: sz } = await supabase.from("product_sizes").select("product_id, label").eq("size_id", item.item_id).single();
        if (sz) { productId = sz.product_id; sizeLabel = sz.label; }
      }

      const { data: recipes } = sizeLabel 
        ? await supabase.from("product_recipes").select("item_id, amount, unit").eq("product_id", productId).eq("size_label", sizeLabel)
        : await supabase.from("product_recipes").select("item_id, amount, unit").eq("product_id", productId).is("size_label", null);

      if (recipes) {
        for (const r of recipes) {
          const req = ingredientRequirements[r.item_id] || { amount: 0, unit: r.unit, name: "Unknown", affectedItems: [] };
          req.amount += (Number(r.amount) * item.quantity);
          req.unit = r.unit;
          if (!req.affectedItems.includes(item.item_name)) {
            req.affectedItems.push(item.item_name);
          }
          ingredientRequirements[r.item_id] = req;
        }
      }
    }
  }

  const bottlenecks: InventoryValidationResult["bottlenecks"] = [];

  // 2. Check NF&B Singles
  for (const [id, req] of Object.entries(nfbRequirements)) {
    const { data: prod } = await supabase.from("nfb_products").select("quantity").eq("product_id", id).single();
    const stock = Number(prod?.quantity || 0);
    if (stock < req.qty) {
      bottlenecks.push({
        item_name: req.name,
        requested: req.qty,
        possible: stock,
        reason: `Only ${stock} available in stock.`
      });
    }
  }

  // 3. Check NF&B Variants
  for (const [id, req] of Object.entries(nfbVariantRequirements)) {
    const { data: opt } = await supabase.from("nfb_variant_options").select("stock").eq("option_id", id).single();
    const stock = Number(opt?.stock || 0);
    if (stock < req.qty) {
      bottlenecks.push({
        item_name: req.label,
        requested: req.qty,
        possible: stock,
        reason: `Only ${stock} available in stock.`
      });
    }
  }

  // 4. Check F&B Ingredients (Aggregated)
  for (const [id, req] of Object.entries(ingredientRequirements)) {
    const { data: inv } = await supabase.from("fnb_inventory_items").select("name, stock, base_unit").eq("item_id", id).single();
    if (!inv) continue;

    const factor = getConversionFactor(req.unit || "unit", inv.base_unit || "unit");
    const totalNeededInBase = req.amount * factor;
    const stockInBase = Number(inv.stock || 0);

    if (stockInBase < totalNeededInBase) {
      // Calculate max possible for EACH product using this ingredient
      const productRecs = await Promise.all(items.filter(item => {
        if (item.item_type !== "fnb_single" && item.item_type !== "fnb_size") return false;
        return req.affectedItems.includes(item.item_name);
      }).map(async (item) => {
        let productId = item.item_id;
        let sizeLabel = item.size_label;
        if (item.item_type === "fnb_size") {
          const { data: sz } = await supabase.from("product_sizes").select("product_id, label").eq("size_id", item.item_id).eq("tenant_id", tenantId).single();
          if (sz) { productId = sz.product_id; sizeLabel = sz.label; }
        }
        
        const query = supabase.from("product_recipes").select("amount, unit").eq("product_id", productId).eq("item_id", id).eq("tenant_id", tenantId);
        const { data: recipeRow } = sizeLabel 
          ? await query.eq("size_label", sizeLabel).single()
          : await query.is("size_label", null).single();

        if (recipeRow) {
          const itemFactor = getConversionFactor(recipeRow.unit || "unit", inv.base_unit || "unit");
          const amountPerServingInBase = Number(recipeRow.amount) * itemFactor;
          const maxPossible = Math.floor(stockInBase / amountPerServingInBase);
          return { name: item.item_name, max: maxPossible, amountPerServing: amountPerServingInBase };
        }
        return null;
      }));

      const validRecs = productRecs.filter((r: any): r is NonNullable<typeof r> => r !== null);
      
      // Check if all affected products use the same amount of this ingredient
      const firstAmount = validRecs[0]?.amountPerServing;
      const allSameAmount = validRecs.every((r: any) => r.amountPerServing === firstAmount);

      let reason = "";
      if (allSameAmount && validRecs.length > 1) {
        reason = `⚠️ We're short on ${inv.name}. You can only order a combined total of ${validRecs[0].max} servings across: ${validRecs.map((r: any) => r.name).join(", ")}.`;
      } else {
        const recStrings = validRecs.map((r: any) => `${r.name} (Max: ${r.max})`).join(", ");
        reason = `⚠️ We're short on ${inv.name}. Total available: ${recStrings}. (Note: These items share the same ingredient stock)`;
      }

      bottlenecks.push({
        item_name: req.affectedItems.join(", "),
        requested: req.amount,
        possible: 0,
        reason
      });
    }
  }

  if (bottlenecks.length > 0) {
    return {
      isPossible: false,
      error: "We're sorry, but we can't fulfill your entire order with our current stock.",
      bottlenecks
    };
  }

  return { isPossible: true };
}

/**
 * Recalculates the total quantity for an NF&B product based on the sum of its variant options.
 */
export async function recalculateNfbProductQuantity(productId: string, tenantId: string) {
  const supabase = createClient();

  const { data: options, error } = await supabase
    .from("nfb_variant_options")
    .select("stock")
    .eq("product_id", productId)
    .eq("tenant_id", tenantId);

  if (error || !options) {
    console.error(`[recalculateNfbProductQuantity] Error fetching options for ${productId}:`, error);
    return;
  }

  if (options.length === 0) return; // No variants, quantity is handled manually or stays as is

  const totalQuantity = options.reduce((sum: number, opt: any) => sum + (Number(opt.stock) || 0), 0);

  console.log(`[recalculateNfbProductQuantity] Updating product ${productId} total quantity to: ${totalQuantity}`);
  await supabase
    .from("nfb_products")
    .update({ quantity: totalQuantity })
    .eq("product_id", productId);
}
