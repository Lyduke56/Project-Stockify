
import { createClient } from "@/lib/supabase/client";

async function checkDb() {
  const supabase = createClient();
  
  console.log("--- Checking F&B Products Yield ---");
  const { data: prods, error: pErr } = await supabase
    .from("products")
    .select("product_id, name, max_yield, tenant_id")
    .eq("is_active", true);

  if (pErr) {
    console.error("Error fetching products:", pErr);
    return;
  }

  for (const p of prods) {
    console.log(`Product: ${p.name} (${p.product_id}) | Yield: ${p.max_yield}`);
    
    const { data: recipes } = await supabase
      .from("product_recipes")
      .select("item_id, amount, size_label")
      .eq("product_id", p.product_id);

    if (!recipes || recipes.length === 0) {
      console.log("  -> No recipes found.");
      continue;
    }

    console.log(`  -> Recipes found: ${recipes.length}`);
    for (const r of recipes) {
      const { data: inv } = await supabase
        .from("fnb_inventory_items")
        .select("name, stock")
        .eq("item_id", r.item_id)
        .single();
      
      console.log(`     - Ingredient: ${inv?.name || r.item_id} | Stock: ${inv?.stock} | Needed: ${r.amount} | Yield: ${inv ? Math.floor(inv.stock / Number(r.amount)) : "N/A"}`);
    }
  }
}

checkDb();
