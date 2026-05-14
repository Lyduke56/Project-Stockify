"use client";

import { createClient } from "@/lib/supabase/client";

export interface TenantSettings {
  tenant_id: string;
  business_name: string;
  contact_number: string;
  operating_hours: string;
  gcash_qr_url: string | null;
  cod_enabled: boolean;
  qr_enabled: boolean;
}

export async function fetchTenantSettings(tenantId: string): Promise<TenantSettings | null> {
  if (!tenantId || tenantId === "") return null;
  const supabase = createClient();
  const { data, error } = await supabase
    .from("tenant_settings")
    .select("*")
    .eq("tenant_id", tenantId)
    .single();

  if (error || !data) {
    console.error("fetchTenantSettings error:", error);
    // If doesn't exist, create default
    if (error?.code === "PGRST116") {
      const { data: tenant } = await supabase.from("tenants").select("business_name").eq("tenant_id", tenantId).single();
      const defaultSettings = {
        tenant_id: tenantId,
        business_name: tenant?.business_name ?? "My Store",
        contact_number: "+63 900 000 0000",
        operating_hours: "10:00 AM - 9:00 PM",
        cod_enabled: true,
        qr_enabled: true
      };
      const { data: created } = await supabase.from("tenant_settings").insert(defaultSettings).select().single();
      return created;
    }
    return null;
  }

  return data;
}

export async function updateTenantSettings(tenantId: string, data: Partial<TenantSettings>): Promise<{ error: string | null }> {
  const supabase = createClient();
  const { error } = await supabase
    .from("tenant_settings")
    .update(data)
    .eq("tenant_id", tenantId);

  return { error: error?.message ?? null };
}

export async function uploadStoreAsset(file: File, path: string): Promise<{ url: string | null; error: string | null }> {
  const supabase = createClient();
  
  // Ensure bucket exists or handle error (Assuming 'store-assets' bucket exists)
  const fileExt = file.name.split('.').pop();
  const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
  const filePath = `${path}/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from("store-assets")
    .upload(filePath, file);

  if (uploadError) return { url: null, error: uploadError.message };

  const { data } = supabase.storage.from("store-assets").getPublicUrl(filePath);
  return { url: data.publicUrl, error: null };
}
