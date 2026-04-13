"use client";

import React from "react";
import StockifyButton from "@/components/buttons/button-get-started";

interface SubscriptionStatusProps {
  status?: string;
  pricePerMonth?: string;
  inventoryItems?: number;
  inventoryLimit?: string;
  teamUsed?: number;
  teamTotal?: number;
  nextBilling?: string;
  onUnsubscribe?: () => void;
  onPayment?: () => void;
}

export default function SubscriptionStatus({
  status = "Subscribed",
  pricePerMonth = "₱000.00",
  inventoryItems = 67,
  inventoryLimit = "Unlimited",
  teamUsed = 3,
  teamTotal = 3,
  nextBilling = "April 1, 2026",
  onUnsubscribe,
  onPayment,
}: SubscriptionStatusProps) {
  return (
    <div className="w-full max-w-[675px] rounded-[10px] p-7 flex flex-col gap-4" style={{ backgroundColor: "#385E31" }}>

      {/* Badge */}
      <div className="w-fit px-2 py-0.5 rounded-[5px]" style={{ backgroundColor: "#E5AC24" }}>
        <span className="text-base font-bold font-['Inter']" style={{ color: "#24481F" }}>CURRENT STATUS</span>
      </div>

      {/* Status + Price row */}
      <div className="flex items-center justify-between">
        <span className="text-4xl font-bold font-['Inter']" style={{ color: "#FFFCF0" }}>
          {status}
        </span>
        <span className="text-4xl font-bold font-['Inter']" style={{ color: "#E5AC24" }}>
          {pricePerMonth} / m
        </span>
      </div>

      {/* Info cards row */}
      <div className="flex gap-4">

        {/* Inventory Items */}
        <div className="flex-1 rounded-[10px] p-4 flex flex-col gap-2" style={{ backgroundColor: "#24481F" }}>
          <div className="flex items-center gap-3">
            <img src="/icon-inventory.svg" alt="Inventory" className="w-7 h-7 shrink-0" style={{ filter: "brightness(0) saturate(100%) invert(83%) sepia(43%) saturate(2214%) hue-rotate(343deg) brightness(95%) contrast(88%)" }} />
            <span className="text-2xl font-semibold font-['Inter']" style={{ color: "#E5AC24" }}>
              Inventory Items
            </span>
          </div>
          <div>
            <span className="text-4xl font-semibold font-['Inter']" style={{ color: "#FFFCF0" }}>
              {inventoryItems}
            </span>
            <br />
            <span className="text-xl font-semibold font-['Inter']" style={{ color: "#E5AC24" }}>
              {inventoryLimit}
            </span>
          </div>
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-4 w-52">

          {/* Team */}
          <div className="rounded-[10px] p-4 flex flex-col gap-1" style={{ backgroundColor: "#24481F" }}>
            <div className="flex items-center gap-3">
              <img src="/icon-user-administration.svg" alt="Inventory" className="w-7 h-7 shrink-0" style={{ filter: "brightness(0) saturate(100%) invert(83%) sepia(43%) saturate(2214%) hue-rotate(343deg) brightness(95%) contrast(88%)" }} />
              <span className="text-xl font-semibold font-['Inter']" style={{ color: "#E5AC24" }}>Team</span>
            </div>
            <span className="text-xl font-semibold font-['Inter'] pl-1" style={{ color: "#FFFCF0" }}>
              {teamUsed} / {teamTotal}
            </span>
          </div>

          {/* Next Billing */}
          <div className="rounded-[10px] p-4 flex flex-col gap-1" style={{ backgroundColor: "#24481F" }}>
            <div className="flex items-center gap-3">
              <img src="/icon-subscription-billing.svg" alt="Inventory" className="w-7 h-7 shrink-0" style={{ filter: "brightness(0) saturate(100%) invert(83%) sepia(43%) saturate(2214%) hue-rotate(343deg) brightness(95%) contrast(88%)" }} />
              <span className="text-xl font-semibold font-['Inter']" style={{ color: "#E5AC24" }}>Next Billing</span>
            </div>
            <span className="text-xl font-semibold font-['Inter'] pl-1" style={{ color: "#FFFCF0" }}>
              {nextBilling}
            </span>
          </div>

        </div>
      </div>

      {/* Action buttons */}
      <div className="flex justify-end gap-4 mt-2">
        <StockifyButton
          label="Unsubscribe"
          onClick={onUnsubscribe}
          variant="primary"
          className="!w-36 !h-8 !text-xl !rounded-[10px] !px-0 !py-0"
          style={{ backgroundColor: "#E53333", color: "#FFFCF0" }}
        />
        <StockifyButton
          label="Payment"
          onClick={onPayment}
          variant="primary"
          className="!w-36 !h-8 !text-xl !rounded-[10px] !px-0 !py-0"
          style={{ backgroundColor: "#E5AC24", color: "#24481F" }}
        />
      </div>

    </div>
  );
}