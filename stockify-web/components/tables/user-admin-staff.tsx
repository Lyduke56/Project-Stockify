"use client";

import React from "react";
import { useStaffRecords, StaffRecord, UserRole, UserStatus  } from "@/backend/hooks/useStaffRecords";

// ── types ─────────────────────────────────────────────────────────────────────

interface StaffAdministrationTableProps {
  /** UUID of the currently-authenticated user — used to resolve tenant_id */
  userId: string;
  onEdit?: (record: StaffRecord) => void;
  onDelete?: (record: StaffRecord) => void;
}

// ── constants ─────────────────────────────────────────────────────────────────

const statusColors: Record<UserStatus, string> = {
  Active:    "#385E31",
  Inactive:  "#888888",
  Suspended: "#E53333",
};

const roleOptions: Exclude<UserRole, "Administrator">[] = ["Manager", "Staff"];

const COLUMNS = ["Name", "Email", "Role", "Status", "Actions"] as const;

// ── component ─────────────────────────────────────────────────────────────────

export default function StaffAdministrationTable({
  userId,
  onEdit,
  onDelete,
}: StaffAdministrationTableProps) {
  const { records, loading, error, refetch } = useStaffRecords(userId);

  // ── loading / error states ────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="w-full flex justify-center items-center py-10">
        <span className="text-sm font-semibold text-[#385E31] animate-pulse">
          Loading staff records…
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full flex flex-col items-center gap-2 py-10">
        <span className="text-sm font-semibold text-[#E53333]">
          Failed to load staff: {error}
        </span>
        <button
          onClick={refetch}
          className="text-xs underline text-[#385E31] hover:opacity-70"
        >
          Retry
        </button>
      </div>
    );
  }

  // ── table ─────────────────────────────────────────────────────────────────
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
        {COLUMNS.map((col, i) => (
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
      {records.length === 0 ? (
        <div className="py-8 flex justify-center">
          <span className="text-sm text-[#385E31] opacity-60 font-['Inter']">
            No staff records found.
          </span>
        </div>
      ) : (
        records.map((record) => (
          <Row
            key={record.user_id}
            record={record}
            onEdit={onEdit ? () => onEdit(record) : undefined}
            onDelete={onDelete ? () => onDelete(record) : undefined}
          />
        ))
      )}
    </div>
  );
}

// ── row sub-component ─────────────────────────────────────────────────────────

interface RowProps {
  record: StaffRecord;
  onEdit?: () => void;
  onDelete?: () => void;
}

function Row({ record, onEdit, onDelete }: RowProps) {
  const isAdmin = record.role === "Administrator";

  return (
    <div
      className="grid w-full border-t"
      style={{
        gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr",
        borderColor: "rgba(56,94,49,0.13)",
      }}
    >
      {/* Name */}
      <Cell>
        <span className="text-base font-semibold font-['Inter'] text-center text-[#3a7d2c]">
          {record.display_name}
        </span>
      </Cell>

      {/* Email */}
      <Cell>
        <span className="text-base font-semibold font-['Inter'] text-center text-[#3a7d2c]">
          {record.email}
        </span>
      </Cell>

      {/* Role — plain label for Administrator, dropdown for others */}
      <Cell>
        {isAdmin ? (
          <span className="text-base font-semibold font-['Inter'] text-[#3a7d2c]">
            Administrator
          </span>
        ) : (
          <div
            className="w-24 h-6 px-2 rounded-[40px] flex items-center justify-between gap-1 outline outline-1"
            style={{ outlineColor: "#385E31" }}
          >
            <select
              defaultValue={record.role}
              className="flex-1 text-center text-[10px] font-semibold font-['Inter'] bg-transparent border-none outline-none cursor-pointer appearance-none text-[#385E31]"
            >
              {roleOptions.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
            {/* Chevron */}
            <svg width="10" height="6" viewBox="0 0 10 6" fill="none">
              <path
                d="M1 1L5 5L9 1"
                stroke="#385E31"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        )}
      </Cell>

      {/* Status badge */}
      <Cell>
        <div
          className="w-24 h-5 px-[5px] py-[3px] rounded-[40px] flex justify-center items-center"
          style={{
            backgroundColor: isAdmin
              ? statusColors["Active"]
              : statusColors[record.status],
          }}
        >
          <span
            className="text-[9.70px] font-semibold font-['Inter'] text-center"
            style={{ color: "#FFFCF0" }}
          >
            {isAdmin ? "Inherit Rights" : record.status}
          </span>
        </div>
      </Cell>

      {/* Actions */}
      <Cell>
        {isAdmin ? (
          // Administrators cannot be edited or deleted
          <span className="text-xs text-transparent select-none">—</span>
        ) : (
          <div className="flex items-center gap-5">
            {/* Edit */}
            <button
              onClick={onEdit}
              className="w-6 h-6 flex items-center justify-center hover:opacity-70 transition-opacity"
              title="Edit"
            >
              <img
                src="/icon-edit.svg"
                alt="Edit"
                className="w-4 h-4"
                style={{
                  filter:
                    "brightness(0) saturate(100%) invert(27%) sepia(40%) saturate(600%) hue-rotate(80deg)",
                }}
              />
            </button>

            {/* Delete */}
            <button
              onClick={onDelete}
              className="w-6 h-6 flex items-center justify-center hover:opacity-70 transition-opacity"
              title="Delete"
            >
              <img
                src="/icon-delete.svg"
                alt="Delete"
                className="w-4 h-4"
                style={{
                  filter:
                    "brightness(0) saturate(100%) invert(27%) sepia(40%) saturate(600%) hue-rotate(80deg)",
                }}
              />
            </button>
          </div>
        )}
      </Cell>
    </div>
  );
}

// ── tiny layout helper ────────────────────────────────────────────────────────

function Cell({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-2.5 py-[5px] flex justify-center items-center">
      {children}
    </div>
  );
}