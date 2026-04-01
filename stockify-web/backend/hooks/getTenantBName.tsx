
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

export async function getBusinessNameByUserId(userId: string) {
  const { data, error } = await supabase
    .from('users')
    .select(`
      tenant_id,
      tenants (
        business_name
      )
    `)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error("Error fetching business name:", error.message);
    return null;
  }

  return (data?.tenants as any)?.business_name || null;
}