"use client";

import React from "react";
import { useStaffRecords, StaffRecord, UserRole, UserStatus } from "@/backend/hooks/useStaffRecords";

// ── types ─────────────────────────────────────────────────────────────────────

interface StaffAdministrationTableProps {
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

const COLUMNS = ["Name", "Email", "Role", "Status", "Actions"] as const;

// Using a custom grid layout to better match the proportions of the reference image
const GRID_LAYOUT = "1.5fr 2fr 1.2fr 1.2fr 1fr";

export default function StaffAdministrationTable({
  userId,
  onEdit,
  onDelete,
}: StaffAdministrationTableProps) {
  const { records, loading, error, refetch } = useStaffRecords(userId);

  if (loading) {
    return (
      <div className="w-full flex justify-center items-center py-10">
        <span className="text-sm font-semibold text-[#385E31] animate-pulse">Loading staff records...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full flex flex-col items-center gap-2 py-10">
        <span className="text-sm font-semibold text-[#E53333]">Failed to load staff: {error}</span>
        <button onClick={refetch} className="text-xs underline text-[#385E31]">Retry</button>
      </div>
    );
  }

  return (
    <div className="w-full rounded-[10px] overflow-hidden border border-[#385E31]" style={{ backgroundColor: "#FFFCF0" }}>
      {/* Header */}
      <div 
        className="grid w-full" 
        style={{ backgroundColor: "#385E31", gridTemplateColumns: GRID_LAYOUT }}
      >
        {COLUMNS.map((col) => (
          <div key={col} className="px-4 py-3 flex justify-center items-center">
            <span className="text-[16px] font-bold font-['Inter'] text-[#FFFCF0]">
              {col}
            </span>
          </div>
        ))}
      </div>

      {/* Rows */}
      {records.length === 0 ? (
        <div className="py-10 flex justify-center">
          <span className="text-sm text-[#385E31]/60">No staff records found.</span>
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

function Row({ record, onEdit, onDelete }: { record: StaffRecord; onEdit?: () => void; onDelete?: () => void }) {
  const isAdmin = record.role === "Administrator";

  return (
    <div 
      className="grid w-full border-t border-[#385E31]/10 items-center" 
      style={{ gridTemplateColumns: GRID_LAYOUT }}
    >
      {/* Name */}
      <Cell>
        <span className="text-sm font-medium text-[#385E31] text-center">{record.display_name}</span>
      </Cell>

      {/* Email */}
      <Cell>
        <span className="text-sm font-medium text-[#385E31] text-center">{record.email}</span>
      </Cell>

      {/* Role */}
      <Cell>
        <span className="text-sm font-medium text-[#385E31] text-center">{record.role}</span>
      </Cell>

      {/* Status */}
      <Cell>
        <div 
          className="px-4 py-1 rounded-full flex justify-center items-center min-w-[100px]"
          style={{ backgroundColor: isAdmin ? statusColors["Active"] : statusColors[record.status] }}
        >
          <span className="text-[10px] font-bold text-[#FFFCF0]">
            {isAdmin ? "Active" : record.status}
          </span>
        </div>
      </Cell>

      {/* Actions */}
      <Cell>
        {!isAdmin && (
          <div className="flex items-center gap-4">
            <button onClick={onEdit} className="hover:scale-110 transition-transform">
              <img src="/icon-edit.svg" alt="Edit" className="w-4 h-4 icon-green" />
            </button>
            <button onClick={onDelete} className="hover:scale-110 transition-transform">
              <img src="/icon-delete.svg" alt="Delete" className="w-4 h-4 icon-green" />
            </button>
          </div>
        )}
      </Cell>
    </div>
  );
}

function Cell({ children }: { children: React.ReactNode }) {
  return <div className="px-2 py-4 flex justify-center items-center w-full">{children}</div>;
}