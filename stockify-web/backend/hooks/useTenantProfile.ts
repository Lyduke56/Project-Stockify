"use client";

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Types based on your SQL schema
export interface UserProfile {
  user_id: string;
  tenant_id: string | null;
  email: string;
  role: string;
  display_name: string | null;
  contact_number: string | null;
  first_name: string | null;
  middle_name: string | null;
  last_name: string | null;
  suffix: string | null;
  gender: string | null;
  citizenship: string | null;
  address: string | null;
  profile_picture_url: string | null;
  created_at: string;
}

export interface TenantDetails {
  tenant_id: string;
  business_name: string;
  owner_email: string;
  business_type: string | null;
  subscription_status: string;
  business_warehouse_address: string | null;
  owner_full_name: string | null;
  owner_valid_id_url: string | null;
  business_permit_url: string | null;
  logo_url: string | null;
  created_at: string;
  is_active: boolean;
  is_suspended: boolean | null;
}

export function useTenantProfile(tenantId: string | undefined) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tenantData, setTenantData] = useState<TenantDetails | null>(null);
  const [ownerData, setOwnerData] = useState<UserProfile | null>(null);

  const fetchProfile = async () => {
    if (!tenantId) return;

    try {
      setLoading(true);
      setError(null);

      // 1. Fetch Tenant Information
      const { data: tenant, error: tenantErr } = await supabase
        .from("tenants")
        .select("*")
        .eq("tenant_id", tenantId)
        .single();

      if (tenantErr) throw tenantErr;
      setTenantData(tenant);

      // 2. Fetch the Owner (the User associated with this tenant)
      // Usually, the owner's email matches the tenant's owner_email
      const { data: owner, error: ownerErr } = await supabase
        .from("users")
        .select("*")
        .eq("tenant_id", tenantId)
        .eq("email", tenant.owner_email)
        .single();

      if (!ownerErr) {
        setOwnerData(owner);
      }

    } catch (err: any) {
      setError(err.message || "Failed to fetch profile data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [tenantId]);

  return { 
    tenantData, 
    ownerData, 
    loading, 
    error, 
    refresh: fetchProfile 
  };
}