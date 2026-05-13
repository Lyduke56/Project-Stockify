const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Use service role to bypass RLS

const supabase = createClient(supabaseUrl, supabaseKey);

async function testInsert() {
  const { data, error } = await supabase
    .from("customer_notifications")
    .insert({
      customer_id: '00000000-0000-0000-0000-000000000000',
      tenant_id:   '00000000-0000-0000-0000-000000000000',
      title:       'Test Notification',
      message:     'This is a test message',
    });
  
  if (error) {
    console.error("Insert failed:", error);
  } else {
    console.log("Insert success!");
  }
}

testInsert();
