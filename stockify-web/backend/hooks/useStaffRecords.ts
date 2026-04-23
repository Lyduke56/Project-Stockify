import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client"; // adjust to your supabase client path

export type UserRole = "Administrator" | "Manager" | "Employee";
export type UserStatus = "Active" | "Inactive" | "Suspended";

export interface StaffRecord {
  user_id: string;
  display_name: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
  role: UserRole;
  status: UserStatus;
}

interface UseStaffRecordsResult {
  records: StaffRecord[];
  tenantId: string | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useStaffRecords(userId: string | null): UseStaffRecordsResult {
  const supabase = createClient();

  const [records, setRecords] = useState<StaffRecord[]>([]);
  const [tenantId, setTenantId] = useState<string | null>(null);
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
        // ── Step 1: resolve tenant_id from the current user ──────────────
        const { data: currentUser, error: userErr } = await supabase
          .from("users")
          .select("tenant_id, role")
          .eq("user_id", userId)
          .single();

        if (userErr) throw new Error(userErr.message);
        if (!currentUser?.tenant_id) throw new Error("User has no tenant assigned.");

        const resolvedTenantId: string = currentUser.tenant_id;

        if (!cancelled) setTenantId(resolvedTenantId);

        // ── Step 2: fetch all users belonging to that tenant ──────────────
        const { data: tenantUsers, error: tenantErr } = await supabase
          .from("users")
          .select(
            "user_id, display_name, first_name, last_name, email, role, is_active"
          )
          .eq("tenant_id", resolvedTenantId)
          .order("created_at", { ascending: true });

        if (tenantErr) throw new Error(tenantErr.message);

        // ── Step 3: normalise into StaffRecord shape ──────────────────────
        const normalised: StaffRecord[] = (tenantUsers ?? []).map((u) => ({
          user_id: u.user_id,
          display_name:
            u.display_name ??
            ([u.first_name, u.last_name].filter(Boolean).join(" ") ||
            u.email),
          first_name: u.first_name,
          last_name: u.last_name,
          email: u.email,
          role: mapRole(u.role),
          status: u.is_active ? "Active" : "Inactive",
        }));

        if (!cancelled) setRecords(normalised);
      } catch (err: unknown) {
        if (!cancelled)
          setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [userId, tick]);

  return { records, tenantId, loading, error, refetch };
}

// ── helpers ───────────────────────────────────────────────────────────────────

/**
 * Maps the raw DB role string to the three UI roles.
 * Extend this switch if your DB enum adds new values.
 */
function mapRole(dbRole: string): UserRole {
  switch (dbRole) {
    case "Superadmin":
    case "Administrator":
      return "Administrator";
    case "Manager":
      return "Manager";
    case "Employee":
      return "Employee";  // ← add this
    default:
      return "Employee";  // ← was "Staff", change to "Employee"
  }
}
