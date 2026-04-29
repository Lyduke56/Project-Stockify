"use client";

import React from "react";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface TenantDetail {
  tenant_id:                    string;
  business_name:                string;
  owner_full_name:              string;
  owner_email:                  string;
  gender?:                      string;
  citizenship?:                 string;
  contact_number?:              string;
  address?:                     string;
  business_type?:               string;
  business_warehouse_address?:  string;
  owner_valid_id_url?:          string;
  business_permit_url?:         string;
  logo_url?:                    string;
  created_at?:                  string;
  subscription_status?:         string;
}

// ── Info Item ─────────────────────────────────────────────────────────────────

const InfoItem = ({
  label,
  value,
  colSpan = false,
}: {
  label: string;
  value: React.ReactNode;
  colSpan?: boolean;
}) => (
  <div className={`flex flex-col ${colSpan ? "col-span-1 md:col-span-2" : ""}`}>
    <span className="text-[10px] text-[#385E31]/70 font-bold uppercase tracking-wider mb-1">
      {label}
    </span>
    <div className="text-[13px] text-[#385E31] font-semibold bg-[#385E31]/5 px-3 py-2 rounded-[6px] border border-[#385E31]/10 min-h-[36px] flex items-center">
      {value || (
        <span className="italic text-[#385E31]/40 font-normal">Not provided</span>
      )}
    </div>
  </div>
);

// ── Document Link ─────────────────────────────────────────────────────────────

const DocLink = ({ url }: { url?: string }) => {
  if (!url)
    return <span className="italic text-[#385E31]/40 font-normal">Not provided</span>;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-1.5 text-[#E5AD24] hover:text-[#D19D1F] transition-colors font-bold text-[12px] group"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
      </svg>
      <span className="group-hover:underline">View Document</span>
    </a>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────

export default function BusinessDetailsTab({ tenant }: { tenant: TenantDetail }) {
  return (
    <div className="flex flex-col gap-5 py-2">

      {/* ── Business Owner Information ── */}
      <div className="bg-[#FFFCEB] rounded-[8px] border border-[#385E31] p-5 flex flex-col shadow-sm">
        <div className="flex items-center gap-2 mb-4 border-b border-[#385E31]/20 pb-3">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18" height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#385E31"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          <h2 className="text-[15px] font-extrabold text-[#385E31]">
            Business Owner&apos;s Information
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3">
          <InfoItem label="Full Name"    value={tenant.owner_full_name} colSpan />
          <InfoItem label="Gender"       value={tenant.gender} />
          <InfoItem label="Citizenship"  value={tenant.citizenship} />
          <InfoItem label="Email"        value={tenant.owner_email} />
          <InfoItem label="Contact No."  value={tenant.contact_number} />
          <InfoItem label="Address"      value={tenant.address} colSpan />
        </div>
      </div>

      {/* ── Business Details ── */}
      <div className="bg-[#FFFCEB] rounded-[8px] border border-[#385E31] p-5 flex flex-col shadow-sm">
        <div className="flex items-center gap-2 mb-4 border-b border-[#385E31]/20 pb-3">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18" height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#385E31"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          <h2 className="text-[15px] font-extrabold text-[#385E31]">Business Details</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3">
          <InfoItem label="Business Name" value={tenant.business_name}    colSpan />
          <InfoItem label="Business Type" value={tenant.business_type}    colSpan />
          <InfoItem
            label="Owner's Valid ID"
            value={<DocLink url={tenant.owner_valid_id_url} />}
          />
          <InfoItem
            label="Business Permit"
            value={<DocLink url={tenant.business_permit_url} />}
          />
          <InfoItem
            label="Business / Warehouse Address"
            value={tenant.business_warehouse_address}
            colSpan
          />
        </div>
      </div>

    </div>
  );
}