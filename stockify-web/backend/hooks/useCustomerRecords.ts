import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export interface CustomerRecord {
  user_id: string;
  name: string;
  email: string;
  contact: string;
  status: "Active" | "Suspended";
}

interface UseCustomerRecordsResult {
  records: CustomerRecord[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
  toggleStatus: (userId: string, currentStatus: string) => Promise<void>;
}

export function useCustomerRecords(userId: string | null): UseCustomerRecordsResult {
  const supabase = createClient();

  const [records, setRecords] = useState<CustomerRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const refetch = () => setTick((t) => t + 1);

  useEffect(() => {
    if (!userId) return;

    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        // 1. Get tenant_id for the current user
        const { data: currentUser, error: userErr } = await supabase
          .from("users")
          .select("tenant_id")
          .eq("user_id", userId)
          .single();

        if (userErr) throw new Error(userErr.message);
        if (!currentUser?.tenant_id) throw new Error("User has no tenant assigned.");

        const tenantId = currentUser.tenant_id;

        // 2. Fetch all customers for this tenant
        const { data: customers, error: fetchErr } = await supabase
          .from("users")
          .select("user_id, display_name, first_name, last_name, email, contact_number, is_active")
          .eq("tenant_id", tenantId)
          .eq("role", "Customer")
          .order("created_at", { ascending: false });

        if (fetchErr) throw new Error(fetchErr.message);

        const normalized: CustomerRecord[] = (customers ?? []).map((c: any) => ({
          user_id: c.user_id,
          name: c.display_name || [c.first_name, c.last_name].filter(Boolean).join(" ") || "Unknown",
          email: c.email,
          contact: c.contact_number || "N/A",
          status: c.is_active ? "Active" : "Suspended",
        }));

        if (!cancelled) setRecords(normalized);
      } catch (err: any) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [userId, tick]);

  const toggleStatus = async (targetUserId: string, currentStatus: string) => {
    try {
      const { error: updateErr } = await supabase
        .from("users")
        .update({ is_active: currentStatus !== "Active" })
        .eq("user_id", targetUserId);

      if (updateErr) throw updateErr;
      refetch();
    } catch (err: any) {
      console.error("Failed to toggle customer status:", err);
      alert("Failed to update customer status: " + err.message);
    }
  };

  return { records, loading, error, refetch, toggleStatus };
}
