import { useState, useCallback } from "react";

export interface TenantDetails {
  tenant_id: string;
  business_name: string;
  owner_full_name: string;
  owner_email: string;
  business_type: string | null;
  subscription_status: string;
  business_warehouse_address: string | null;
  owner_valid_id_url: string | null;
  business_permit_url: string | null;
  logo_url: string | null;
  created_at: string;
  contact_number: string | null;
  gender: string | null;
  citizenship: string | null;
  address: string | null;
}

interface UseTenantDetailsReturn {
  tenant: TenantDetails | null;
  loading: boolean;
  error: string;
  fetchTenant: (tenantId: string) => Promise<void>;
  reset: () => void;
}

export function useTenantDetails(): UseTenantDetailsReturn {
  const [tenant, setTenant] = useState<TenantDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchTenant = useCallback(async (tenantId: string) => {
    setLoading(true);
    setError("");
    setTenant(null);

    try {
      const res = await fetch(`/api/superadmin/tenant/${tenantId}`);
      const result = await res.json();

      if (!res.ok || result.error) {
        throw new Error(result.error || "Failed to load tenant details.");
      }

      setTenant(result.data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setTenant(null);
    setError("");
    setLoading(false);
  }, []);

  return { tenant, loading, error, fetchTenant, reset };
}
