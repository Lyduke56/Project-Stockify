import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

export async function getBusinessNameByUserId(userId: string) {
  const { data, error } = await supabase
    .from('users')
    .select(`
      tenant_id,
      tenants (
        business_name,
        business_type
      )
    `)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error("Error fetching business name:", error.message);
    return null;
  }

  const tenant = data?.tenants as any;
  return tenant ? {
    business_name: tenant.business_name || null,
    business_type: tenant.business_type || null,
  } : null;
}