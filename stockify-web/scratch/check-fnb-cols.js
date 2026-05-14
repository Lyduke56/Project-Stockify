const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkFnbInventoryColumns() {
  const { data, error } = await supabase
    .from("fnb_inventory_items")
    .select("*")
    .limit(1);
  
  if (error) {
    console.error("Error fetching fnb_inventory_items:", error);
  } else {
    if (data.length > 0) {
      console.log("Success! Columns:", Object.keys(data[0]));
    } else {
      console.log("Table is empty, but query worked.");
    }
  }
}

checkFnbInventoryColumns();
