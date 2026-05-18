"use client";

import React from "react";
import { useCustomerRecords, CustomerRecord } from "@/backend/hooks/useCustomerRecords";
import { Loader2 } from "lucide-react";

interface RegisteredCustomersTableProps {
  userId: string;
}

// Standardized grid layout for customer data
const GRID_LAYOUT = "1.5fr 2fr 1.5fr 1fr";

export default function RegisteredCustomersTable({
  userId,
}: RegisteredCustomersTableProps) {
  const { records, loading, error } = useCustomerRecords(userId);

  if (loading) {
    return (
      <div className="w-full flex justify-center items-center py-10">
        <Loader2 className="animate-spin text-primary mr-2" size={20} />
        <span className="text-sm font-semibold text-primary">Loading customers...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full flex flex-col items-center gap-2 py-10">
        <span className="text-sm font-semibold text-[#E53333]">Failed to load customers: {error}</span>
      </div>
    );
  }

  return (
    <div className="w-full rounded-[10px] overflow-hidden border border-primary bg-background">
      {/* Header */}
      <div
        className="grid w-full bg-primary"
        style={{ gridTemplateColumns: GRID_LAYOUT }}
      >
        {["Name", "Email", "Contact #", "Status"].map((col) => (
          <div key={col} className="px-4 py-3 flex justify-center items-center">
            <span className="text-[16px] font-bold font-['Inter'] text-background">
              {col}
            </span>
          </div>
        ))}
      </div>

      {/* Rows */}
      {records.length === 0 ? (
        <div className="py-10 flex justify-center">
          <span className="text-sm text-primary/60">No registered customers found.</span>
        </div>
      ) : (
        records.map((record) => (
          <div
            key={record.user_id}
            className="grid w-full border-t border-primary/10 items-center"
            style={{ gridTemplateColumns: GRID_LAYOUT }}
          >
            {/* Name */}
            <Cell>
              <span className="text-sm font-medium text-primary text-center">
                {record.name}
              </span>
            </Cell>

            {/* Email */}
            <Cell>
              <span className="text-sm font-medium text-primary text-center">
                {record.email}
              </span>
            </Cell>

            {/* Contact # */}
            <Cell>
              <span className="text-sm font-medium text-primary text-center">
                {record.contact}
              </span>
            </Cell>

            {/* Status Badge */}
            <Cell>
              <div
                className={`px-4 py-1 rounded-full flex justify-center items-center min-w-[90px] ${
                  record.status === "Active"
                    ? "bg-primary"
                    : "bg-[#E53333]"
                }`}
              >
                <span className="text-[10px] font-bold text-background">
                  {record.status}
                </span>
              </div>
            </Cell>
          </div>
        ))
      )}
    </div>
  );
}

// Reusable Cell helper to ensure centering logic is identical across all columns
function Cell({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-2 py-4 flex justify-center items-center w-full">
      {children}
    </div>
  );
}