"use client";

import React from "react";

interface BillingRecord {
  invoiceId: string;
  date: string;
  description: string;
  amount: string;
  status: "Paid" | "Pending" | "Overdue";
  onReview?: () => void;
}

interface BillingHistoryProps {
  records?: BillingRecord[];
}

const defaultRecords: BillingRecord[] = [
  { invoiceId: "INV-2026-03", date: "March 01, 2026", description: "Pro Plan", amount: "₱ 000.00", status: "Paid" },
  { invoiceId: "INV-2026-03", date: "March 01, 2026", description: "Pro Plan", amount: "₱ 000.00", status: "Paid" },
  { invoiceId: "INV-2026-03", date: "March 01, 2026", description: "Pro Plan", amount: "₱ 000.00", status: "Paid" },
  { invoiceId: "INV-2026-03", date: "March 01, 2026", description: "Pro Plan", amount: "₱ 000.00", status: "Paid" },
  { invoiceId: "INV-2026-03", date: "March 01, 2026", description: "Pro Plan", amount: "₱ 000.00", status: "Paid" },
  { invoiceId: "INV-2026-03", date: "March 01, 2026", description: "Pro Plan", amount: "₱ 000.00", status: "Paid" },
  { invoiceId: "INV-2026-03", date: "March 01, 2026", description: "Pro Plan", amount: "₱ 000.00", status: "Paid" },
  { invoiceId: "INV-2026-03", date: "March 01, 2026", description: "Pro Plan", amount: "₱ 000.00", status: "Paid" },
  { invoiceId: "INV-2026-03", date: "March 01, 2026", description: "Pro Plan", amount: "₱ 000.00", status: "Paid" },
];

const statusColors: Record<BillingRecord["status"], string> = {
  Paid: "bg-lime-600",
  Pending: "bg-amber-400",
  Overdue: "bg-red-500",
};

export default function BillingHistory({ records = defaultRecords }: BillingHistoryProps) {
  return (
    <div className="w-full flex flex-col gap-4">

      {/* Title */}
      <h2
        className="text-2xl font-bold font-['Inter'] tracking-widest uppercase"
        style={{ color: "#385E31" }}
      >
        Billing History
      </h2>

      {/* Table */}
      <div
        className="w-full rounded-[10px] overflow-hidden outline outline-1"
        style={{ backgroundColor: "#FFFCF0", outlineColor: "#385E31" }}
      >
        {/* Header */}
        <div
          className="grid grid-cols-6 w-full"
          style={{ backgroundColor: "#385E31" }}
        >
          {["Invoice ID", "Date", "Description", "Amount", "Status", "Actions"].map((col, i) => (
            <div
              key={col}
              className={`px-2.5 py-[5px] flex justify-center items-center ${
                i === 0 ? "rounded-tl-[10px]" : i === 5 ? "rounded-tr-[10px]" : ""
              }`}
            >
              <span className="text-lg font-semibold font-['Inter'] text-center" style={{ color: "#FFFCF0" }}>
                {col}
              </span>
            </div>
          ))}
        </div>

        {/* Rows */}
        {records.map((record, i) => (
          <div
            key={i}
            className="grid grid-cols-6 w-full border-t"
            style={{ borderColor: "#385E31" + "22" }}
          >
            {/* Invoice ID */}
            <div className="px-2.5 py-[5px] flex justify-center items-center">
              <span className="text-base font-semibold font-['Inter']" style={{ color: "#3a7d2c" }}>
                {record.invoiceId}
              </span>
            </div>

            {/* Date */}
            <div className="px-2.5 py-[5px] flex justify-center items-center">
              <span className="text-base font-semibold font-['Inter']" style={{ color: "#3a7d2c" }}>
                {record.date}
              </span>
            </div>

            {/* Description */}
            <div className="px-2.5 py-[5px] flex justify-center items-center">
              <span className="text-base font-semibold font-['Inter']" style={{ color: "#3a7d2c" }}>
                {record.description}
              </span>
            </div>

            {/* Amount */}
            <div className="px-2.5 py-[5px] flex justify-center items-center">
              <span className="text-base font-semibold font-['Inter']" style={{ color: "#3a7d2c" }}>
                {record.amount}
              </span>
            </div>

            {/* Status */}
            <div className="px-2.5 py-[5px] flex justify-center items-center">
              <div className={`w-20 h-5 px-[5px] py-[3px] ${statusColors[record.status]} rounded-[40px] flex justify-center items-center`}>
                <span className="text-[9.70px] font-bold font-['Inter'] text-orange-100 text-center">
                  {record.status}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="px-2.5 py-[5px] flex justify-center items-center">
              <button
                onClick={record.onReview}
                className="w-20 h-5 px-2.5 rounded-[40px] flex justify-center items-center shadow-[2px_2px_4px_0px_rgba(0,0,0,0.25)] transition-all hover:brightness-110 active:scale-95"
                style={{ backgroundColor: "#24481F" }}
              >
                <span className="text-[10px] font-semibold font-['Inter'] text-orange-100">
                  Review
                </span>
              </button>
            </div>
          </div>
        ))}
      </div>


        {/* Help text */}
        <div className="flex items-center gap-2">
            <img src="/icon-info.svg" alt="info" className="w-4 h-4" />
                <p className="text-sm font-['Inter']" style={{ color: "#385E31" }}>
                Need help with billing? <a href="mailto:billing@stockify.com" className="underline" style={{ color: "#E5AC24" }}>Contact our support team at billing@stockify.com</a>
                </p>
        </div>

    </div>
  );
}