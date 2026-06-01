"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { motion } from "framer-motion";
import LoadingScreen from "@/app/loading-screen/loading";

import NewEmployeeModal from "@/components/modals/admin/new-employee-modal";
import DeleteEmployeeModal from "@/components/modals/admin/remove-employee-modal";
import StaffAdminTable from "@/components/tables/user-admin-staff";
import CustomerAdminTable from "@/components/tables/user-admin-customers";

import type { StaffRecord } from "@/backend/hooks/useStaffRecords";
import type { CustomerRecord } from "@/backend/hooks/useCustomerRecords";

const supabase = createClient();

const SearchIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"></circle>
    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
  </svg>
);

function mapRole(dbRole: string): StaffRecord["role"] {
  switch (dbRole) {
    case "Superadmin":
    case "Administrator": return "Administrator";
    case "Manager": return "Manager";
    default: return "Employee";
  }
}

interface UserAdminSectionProps {
  colors?: {
    color_primary?: string;
    color_background?: string;
    color_secondary?: string;
    color_accent?: string;
    color_text?: string;
    color_sidebar_text?: string;
  };
}

export default function UserAdminSection({ colors }: UserAdminSectionProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [tableKey, setTableKey] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const [staffRecords, setStaffRecords] = useState<StaffRecord[]>([]);
  const [customerRecords, setCustomerRecords] = useState<CustomerRecord[]>([]);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const loadAll = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        setUserId(user.id);

        const { data: currentUser } = await supabase
          .from("users")
          .select("tenant_id")
          .eq("user_id", user.id)
          .single();

        if (!currentUser?.tenant_id) return;

        const tenantId = currentUser.tenant_id;

        // fetch staff and customers in parallel
        const [staffRes, customerRes] = await Promise.all([
          supabase
            .from("users")
            .select("user_id, display_name, first_name, last_name, email, role, is_active")
            .eq("tenant_id", tenantId)
            .in("role", ["Administrator", "Manager", "Employee", "Superadmin"])
            .order("created_at", { ascending: true }),
          supabase
            .from("users")
            .select("user_id, display_name, first_name, last_name, email, contact_number, is_active")
            .eq("tenant_id", tenantId)
            .eq("role", "Customer")
            .order("created_at", { ascending: false }),
        ]);

        setStaffRecords(
          (staffRes.data ?? []).map((u: any) => ({
            user_id: u.user_id,
            display_name: (u.display_name ?? [u.first_name, u.last_name].filter(Boolean).join(" ")) || u.email,
            first_name: u.first_name,
            last_name: u.last_name,
            email: u.email,
            role: mapRole(u.role),
            status: u.is_active ? "Active" : "Inactive",
          }))
        );

        setCustomerRecords(
          (customerRes.data ?? []).map((c: any) => ({
            user_id: c.user_id,
            name: c.display_name || [c.first_name, c.last_name].filter(Boolean).join(" ") || "Unknown",
            email: c.email,
            contact: c.contact_number || "N/A",
            status: c.is_active ? "Active" : "Suspended",
          }))
        );
      } catch (err) {
        console.error("Failed to load user admin data:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadAll();
  }, [tableKey]);

  if (isLoading) return <LoadingScreen fullScreen={false} bgColor={colors?.color_background} />;

  function handleEmployeeCreated() {
    setTableKey((k) => k + 1);
    setIsModalOpen(false);
  }

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return;
    setIsDeleting(true);
    try {
      const res = await fetch("/api/admin/delete-employee", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: userToDelete.user_id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete employee.");
      setIsDeleteModalOpen(false);
      setUserToDelete(null);
      setTableKey((k) => k + 1);
    } catch (err: any) {
      alert(err.message || "Failed to delete employee.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="flex flex-col w-full min-h-screen bg-background font-['Inter'] pt-5 pb-12"
    >
      {/* PAGE HEADER */}
      <motion.header
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="w-full flex flex-col items-center mb-12 gap-2"
      >
        <h1 className="text-primary text-[30px] font-extrabold uppercase">
          User Administration
        </h1>
        <div className="w-full max-w-[900px] h-1.5 bg-accent rounded-full opacity-60" />
      </motion.header>

      {/* STAFF ACCOUNTS SECTION */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex flex-col gap-6"
      >
        <div className="flex items-end justify-between">
          <div className="flex flex-col gap-1">
            <h2 className="text-primary text-[26px] font-extrabold uppercase">
              Staff Accounts
            </h2>
          </div>
        </div>

        <div className="flex items-center justify-between w-full gap-4">
          <div className="relative w-full max-w-[500px]">
            <input
              type="text"
              placeholder="Search employees..."
              className="w-full border border-primary rounded-full px-5 py-2.5 bg-transparent text-primary placeholder-primary/60 outline-none font-medium text-sm"
            />
            <div className="absolute right-4 top-3 text-primary">
              <SearchIcon />
            </div>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="whitespace-nowrap px-8 py-2.5 rounded-[40px] font-bold text-[14px] transition-all hover:brightness-105 active:scale-95 shadow-sm bg-accent text-primary"
          >
            + Add Employee
          </button>
        </div>

        <div className="w-full bg-background rounded-[10px] border border-primary overflow-hidden shadow-sm">
          <StaffAdminTable
            key={tableKey}
            records={staffRecords}
            userId={userId ?? ""}
            onDelete={(record) => {
              setUserToDelete(record);
              setIsDeleteModalOpen(true);
            }}
          />
        </div>
      </motion.div>

      {/* SEPARATOR */}
      <div className="w-full h-[2px] bg-primary/20 rounded-full my-12" />

      {/* REGISTERED CUSTOMERS SECTION */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="flex flex-col gap-6"
      >
        <h2 className="text-primary text-[26px] font-extrabold uppercase">
          Registered Customers
        </h2>

        <div className="relative w-full max-w-[600px]">
          <input
            type="text"
            placeholder="Search customers..."
            className="w-full border border-primary rounded-full px-5 py-2.5 bg-transparent text-primary placeholder-primary/60 outline-none font-medium text-sm"
          />
          <div className="absolute right-4 top-3 text-primary">
            <SearchIcon />
          </div>
        </div>

        <div className="w-full bg-background rounded-[10px] border border-primary overflow-hidden shadow-sm">
          <CustomerAdminTable records={customerRecords} userId={userId ?? ""} />
        </div>
      </motion.div>

      <NewEmployeeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleEmployeeCreated}
        colors={colors}
      />

      <DeleteEmployeeModal
        isOpen={isDeleteModalOpen}
        user={userToDelete}
        isDeleting={isDeleting}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        colors={colors}
      />
    </motion.div>
  );
}