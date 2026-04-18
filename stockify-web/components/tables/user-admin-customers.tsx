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

export default function RegisteredCustomersTable({
  records = defaultRecords,
}: RegisteredCustomersTableProps) {
  return (
    <div
      className="w-full rounded-[10px] overflow-hidden outline outline-1"
      style={{ backgroundColor: "#FFFCF0", outlineColor: "#385E31" }}
    >
      {/* Header */}
      <div
        className="grid w-full"
        style={{
          backgroundColor: "#385E31",
          gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr",
        }}
      >
        {["Name", "Email", "Contact #", "Status", "Actions"].map((col, i) => (
          <div
            key={col}
            className={`px-2.5 py-[5px] flex justify-center items-center ${
              i === 0 ? "rounded-tl-[10px]" : i === 4 ? "rounded-tr-[10px]" : ""
            }`}
          >
            <span
              className="text-lg font-semibold font-['Inter'] text-center"
              style={{ color: "#FFFCF0" }}
            >
              {col}
            </span>
          </div>
        ))}
      </div>

      {/* Rows */}
      {records.map((record, i) => (
        <div
          key={i}
          className="grid w-full border-t"
          style={{
            gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr",
            borderColor: "rgba(56,94,49,0.13)",
          }}
        >
          {/* Name */}
          <div className="px-2.5 py-[5px] flex justify-center items-center">
            <span
              className="text-base font-semibold font-['Inter'] text-center"
              style={{ color: "#3a7d2c" }}
            >
              {record.name}
            </span>
          </div>

          {/* Email */}
          <div className="px-2.5 py-[5px] flex justify-center items-center">
            <span
              className="text-base font-semibold font-['Inter'] text-center"
              style={{ color: "#3a7d2c" }}
            >
              {record.email}
            </span>
          </div>

          {/* Contact # */}
          <div className="px-2.5 py-[5px] flex justify-center items-center">
            <span
              className="text-base font-semibold font-['Inter'] text-center"
              style={{ color: "#3a7d2c" }}
            >
              {record.contact}
            </span>
          </div>

          {/* Status */}
          <div className="px-2.5 py-[5px] flex justify-center items-center">
            <div
              className="w-20 h-5 px-[5px] py-[3px] rounded-[40px] flex justify-center items-center"
              style={{ backgroundColor: statusColors[record.status] }}
            >
              <span
                className="text-[9.70px] font-semibold font-['Inter'] text-center"
                style={{ color: "#FFFCF0" }}
              >
                {record.status}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="px-2.5 py-[5px] flex justify-center items-center">
            {record.status === "Active" ? (
              <button
                onClick={record.onSuspend}
                className="w-20 h-5 px-[5px] py-[3px] rounded-[40px] flex justify-center items-center transition-all hover:brightness-110 active:scale-95"
                style={{ backgroundColor: "#E53333" }}
              >
                <span
                  className="text-[9.70px] font-semibold font-['Inter']"
                  style={{ color: "#FFFCF0" }}
                >
                  Suspend
                </span>
              </button>
            ) : (
              <button
                onClick={record.onReactivate}
                className="w-20 h-5 px-[5px] py-[3px] rounded-[40px] flex justify-center items-center transition-all hover:brightness-110 active:scale-95"
                style={{ backgroundColor: "#E5AC24" }}
              >
                <span
                  className="text-[9.70px] font-semibold font-['Inter']"
                  style={{ color: "#24481F" }}
                >
                  Reactivate
                </span>
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}