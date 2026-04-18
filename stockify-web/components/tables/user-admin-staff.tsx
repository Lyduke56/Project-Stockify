"use client";

import React from "react";

type StaffRole = "Owner" | "Manager" | "Staff";
type StaffStatus = "Active" | "Inactive" | "Suspended";

interface StaffRecord {
  name: string;
  email: string;
  role: StaffRole;
  status: StaffStatus;
  onEdit?: () => void;
  onDelete?: () => void;
}

interface StaffAdministrationTableProps {
  records?: StaffRecord[];
}

const defaultRecords: StaffRecord[] = [
  { name: "Furina de Fontaine", email: "furifuri@gmail.com",     role: "Owner",   status: "Active" },
  { name: "Dennis Fujiwater",   email: "dasani@gmail.com",       role: "Manager", status: "Active" },
  { name: "Gold Ship",          email: "umaumapyoi@gmail.com",   role: "Staff",   status: "Active" },
];

const statusColors: Record<StaffStatus, string> = {
  Active:    "#385E31",
  Inactive:  "#888",
  Suspended: "#E53333",
};

const roleOptions: StaffRole[] = ["Owner", "Manager", "Staff"];

export default function StaffAdministrationTable({
  records = defaultRecords,
}: StaffAdministrationTableProps) {
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
        {["Name", "Email", "Role", "Status", "Actions"].map((col, i) => (
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

          {/* Role — dropdown */}
          <div className="px-2.5 py-[5px] flex justify-center items-center">
            {record.role === "Owner" ? (
              <span
                className="text-base font-semibold font-['Inter']"
                style={{ color: "#3a7d2c" }}
              >
                Owner
              </span>
            ) : (
              <div
                className="w-20 h-6 px-2 rounded-[40px] flex items-center justify-between gap-1 outline outline-1"
                style={{ outlineColor: "#385E31" }}
              >
                <select
                  defaultValue={record.role}
                  className="flex-1 text-center text-[10px] font-semibold font-['Inter'] bg-transparent border-none outline-none cursor-pointer appearance-none"
                  style={{ color: "#385E31" }}
                >
                  {roleOptions.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
                {/* Chevron */}
                <svg width="10" height="6" viewBox="0 0 10 6" fill="none">
                  <path d="M1 1L5 5L9 1" stroke="#385E31" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            )}
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
                {record.role === "Owner" ? "Inherit Rights" : record.status}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="px-2.5 py-[5px] flex justify-center items-center gap-5">
            {record.role === "Owner" ? (
              <span className="text-xs text-transparent select-none">—</span>
            ) : (
              <>
                {/* Edit */}
                <button
                  onClick={record.onEdit}
                  className="w-6 h-6 flex items-center justify-center hover:opacity-70 transition-opacity"
                  title="Edit"
                >
                  <img
                    src="/icon-edit.svg"
                    alt="Edit"
                    className="w-4 h-4"
                    style={{ filter: "brightness(0) saturate(100%) invert(27%) sepia(40%) saturate(600%) hue-rotate(80deg)" }}
                  />
                </button>
                {/* Delete */}
                <button
                  onClick={record.onDelete}
                  className="w-6 h-6 flex items-center justify-center hover:opacity-70 transition-opacity"
                  title="Delete"
                >
                  <img
                    src="/icon-delete.svg"
                    alt="Delete"
                    className="w-4 h-4"
                    style={{ filter: "brightness(0) saturate(100%) invert(27%) sepia(40%) saturate(600%) hue-rotate(80deg)" }}
                  />
                </button>
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}