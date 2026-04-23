"use client";

import React from "react";

type CustomerStatus = "Active" | "Suspended";

interface CustomerRecord {
  name: string;
  email: string;
  contact: string;
  status: CustomerStatus;
  onSuspend?: () => void;
  onReactivate?: () => void;
}

interface RegisteredCustomersTableProps {
  records?: CustomerRecord[];
}

const defaultRecords: CustomerRecord[] = [
  { name: "Asa Mitaka",  email: "morningwar@gmail.com",  contact: "0947-XXX-YYY", status: "Active" },
  { name: "Yoru Mitaka", email: "eveningpeace@gmail.com", contact: "0967-XXX-YYY", status: "Suspended" },
  { name: "Asa Mitaka",  email: "morningwar@gmail.com",  contact: "0947-XXX-YYY", status: "Active" },
  { name: "Yoru Mitaka", email: "eveningpeace@gmail.com", contact: "0967-XXX-YYY", status: "Suspended" },
  { name: "Asa Mitaka",  email: "morningwar@gmail.com",  contact: "0947-XXX-YYY", status: "Active" },
  { name: "Yoru Mitaka", email: "eveningpeace@gmail.com", contact: "0967-XXX-YYY", status: "Suspended" },
];

const statusColors: Record<CustomerStatus, string> = {
  Active:    "#385E31",
  Suspended: "#E53333",
};

// Standardized grid layout for customer data
const GRID_LAYOUT = "1.5fr 2fr 1.5fr 1fr 1fr";

export default function RegisteredCustomersTable({
  records = defaultRecords,
}: RegisteredCustomersTableProps) {
  return (
    <div
      className="w-full rounded-[10px] overflow-hidden border border-[#385E31]"
      style={{ backgroundColor: "#FFFCF0" }}
    >
      {/* Header */}
      <div
        className="grid w-full"
        style={{
          backgroundColor: "#385E31",
          gridTemplateColumns: GRID_LAYOUT,
        }}
      >
        {["Name", "Email", "Contact #", "Status", "Actions"].map((col) => (
          <div key={col} className="px-4 py-3 flex justify-center items-center">
            <span className="text-[16px] font-bold font-['Inter'] text-[#FFFCF0]">
              {col}
            </span>
          </div>
        ))}
      </div>

      {/* Rows */}
      {records.map((record, i) => (
        <div
          key={i}
          className="grid w-full border-t border-[#385E31]/10 items-center"
          style={{ gridTemplateColumns: GRID_LAYOUT }}
        >
          {/* Name */}
          <Cell>
            <span className="text-sm font-medium text-[#385E31] text-center">
              {record.name}
            </span>
          </Cell>

          {/* Email */}
          <Cell>
            <span className="text-sm font-medium text-[#385E31] text-center">
              {record.email}
            </span>
          </Cell>

          {/* Contact # */}
          <Cell>
            <span className="text-sm font-medium text-[#385E31] text-center">
              {record.contact}
            </span>
          </Cell>

          {/* Status Badge */}
          <Cell>
            <div
              className="px-4 py-1 rounded-full flex justify-center items-center min-w-[90px]"
              style={{ backgroundColor: statusColors[record.status] }}
            >
              <span className="text-[10px] font-bold text-[#FFFCF0]">
                {record.status}
              </span>
            </div>
          </Cell>

          {/* Actions Button */}
          <Cell>
            {record.status === "Active" ? (
              <button
                onClick={record.onSuspend}
                className="px-4 py-1 rounded-full flex justify-center items-center transition-all hover:brightness-110 active:scale-95 shadow-sm min-w-[90px]"
                style={{ backgroundColor: "#E53333" }}
              >
                <span className="text-[10px] font-bold text-[#FFFCF0]">
                  Suspend
                </span>
              </button>
            ) : (
              <button
                onClick={record.onReactivate}
                className="px-4 py-1 rounded-full flex justify-center items-center transition-all hover:brightness-110 active:scale-95 shadow-sm min-w-[90px]"
                style={{ backgroundColor: "#E5AC24" }}
              >
                <span className="text-[10px] font-bold text-[#24481F]">
                  Reactivate
                </span>
              </button>
            )}
          </Cell>
        </div>
      ))}
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