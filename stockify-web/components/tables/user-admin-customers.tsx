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
        <span className="text-[15px] font-medium text-primary">Loading customers...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full flex flex-col items-center gap-2 py-10">
        <span className="text-[15px] font-medium text-[#E53333]">Failed to load customers: {error}</span>
      </div>
    );
  }

  return (
    <div className="w-full rounded-xl overflow-hidden border border-primary bg-background shadow-sm">
      {/* Header */}
      <div
        className="grid w-full bg-primary"
        style={{ gridTemplateColumns: GRID_LAYOUT }}
      >
        {["NAME", "EMAIL", "CONTACT NUMBER", "STATUS"].map((col) => (
          <div key={col} className="px-4 py-4 flex justify-center items-center">
            <span className="text-[15px] font-bold tracking-wide font-['Inter'] text-[#FFFCEB]">
              {col}
            </span>
          </div>
        ))}
      </div>

      {/* Rows */}
      {records.length === 0 ? (
        <div className="py-12 flex justify-center">
          <span className="text-[15px] text-primary/60">No registered customers found.</span>
        </div>
      ) : (
        <div className="flex flex-col w-full">
          {records.map((record) => (
            <div
              key={record.user_id}
              className="grid w-full border-t border-primary/20 items-center transition-colors hover:bg-primary/[0.02]"
              style={{ gridTemplateColumns: GRID_LAYOUT }}
            >
              {/* Name */}
              <Cell>
                <span className="text-[15px] font-medium text-primary text-center">
                  {record.name}
                </span>
              </Cell>

              {/* Email */}
              <Cell>
                <span className="text-[15px] font-medium text-primary text-center">
                  {record.email}
                </span>
              </Cell>

              {/* Contact # */}
              <Cell>
                <span className="text-[15px] font-medium text-primary text-center">
                  {record.contact}
                </span>
              </Cell>

              {/* Status Badge */}
              <Cell>
                <div
                  className={`px-5 py-1.5 rounded-full flex justify-center items-center shadow-sm ${
                    record.status === "Active"
                      ? "bg-primary"
                      : "bg-[#E53333]"
                  }`}
                >
                  <span className="text-xs font-bold text-[#FFFCEB] tracking-wide">
                    {record.status}
                  </span>
                </div>
              </Cell>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Reusable Cell helper to ensure centering logic is identical across all columns
function Cell({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-4 py-5 flex justify-center items-center w-full h-full">
      {children}
    </div>
  );
}