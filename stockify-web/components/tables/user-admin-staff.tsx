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

const COLUMNS = ["NAME", "EMAIL", "ROLE", "STATUS", "ACTIONS"] as const;

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
        <span className="text-[15px] font-medium text-primary animate-pulse">Loading staff records...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full flex flex-col items-center gap-2 py-10">
        <span className="text-[15px] font-medium text-[#E53333]">Failed to load staff: {error}</span>
        <button onClick={refetch} className="text-sm underline text-primary">Retry</button>
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
        {COLUMNS.map((col) => (
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
          <span className="text-[15px] text-primary/60">No staff records found.</span>
        </div>
      ) : (
        <div className="flex flex-col w-full">
          {records.map((record) => (
            <Row
              key={record.user_id}
              record={record}
              onEdit={onEdit ? () => onEdit(record) : undefined}
              onDelete={onDelete ? () => onDelete(record) : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── row sub-component ─────────────────────────────────────────────────────────

function Row({ record, onEdit, onDelete }: { record: StaffRecord; onEdit?: () => void; onDelete?: () => void }) {
  const isAdmin = record.role === "Administrator";

  return (
    <div 
      className="grid w-full border-t border-primary/20 items-center transition-colors hover:bg-primary/[0.02]" 
      style={{ gridTemplateColumns: GRID_LAYOUT }}
    >
      {/* Name */}
      <Cell>
        <span className="text-[15px] font-medium text-primary text-center">{record.display_name}</span>
      </Cell>

      {/* Email */}
      <Cell>
        <span className="text-[15px] font-medium text-primary text-center">{record.email}</span>
      </Cell>

      {/* Role */}
      <Cell>
        <span className="text-[15px] font-medium text-primary text-center">{record.role}</span>
      </Cell>

      {/* Status */}
      <Cell>
        <div 
          className={`px-5 py-1.5 rounded-full flex justify-center items-center shadow-sm ${
            isAdmin || record.status === "Active"
              ? "bg-primary"
              : record.status === "Inactive"
              ? "bg-[#888888]"
              : "bg-[#E53333]"
          }`}
        >
          <span className="text-xs font-bold text-[#FFFCEB] tracking-wide">
            {isAdmin ? "Active" : record.status}
          </span>
        </div>
      </Cell>

      {/* Actions */}
      <Cell>
        {!isAdmin && (
          <div className="flex justify-center items-center gap-4">
            <button 
              onClick={onDelete} 
              className="p-2 rounded-md hover:bg-primary/10 hover:scale-105 transition-all focus:outline-none focus:ring-2 focus:ring-primary/50"
              aria-label="Delete record"
            >
              <img src="/icon-delete.svg" alt="Delete" className="w-[18px] h-[18px] opacity-80 hover:opacity-100 transition-opacity" />
            </button>
          </div>
        )}
      </Cell>
    </div>
  );
}

function Cell({ children }: { children: React.ReactNode }) {
  return <div className="px-4 py-5 flex justify-center items-center w-full h-full">{children}</div>;
}