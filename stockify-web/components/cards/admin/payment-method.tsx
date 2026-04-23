"use client";

import React from "react";

interface PaymentMethodProps {
  onProofOfPayment?: () => void;
}

export default function PaymentMethod({
  onProofOfPayment,
}: PaymentMethodProps) {
  return (
    <div className="flex flex-col gap-4 w-64">

      {/* Header */}
      <div className="flex flex-col gap-1">
        <span className="text-base font-bold font-['Inter']" style={{ color: "#24481F" }}>
          Payment Method
        </span>
        <span className="text-sm font-normal font-['Inter']" style={{ color: "#24481F" }}>
          Scan the QR Code to proceed.
        </span>
      </div>

      {/* QR Code box */}
      <div
        className="w-64 h-56 px-3.5 pt-3.5 pb-1 rounded-lg flex flex-col justify-center items-center"
        style={{ outline: "0.87px solid rgba(36,72,31,0.2)" }}
      >
        <img
          src="https://placehold.co/162x192"
          alt="QR Code"
          className="w-40 h-48 object-contain"
        />
      </div>

      {/* Proof of Payment button */}
      <button
        onClick={onProofOfPayment}
        className="w-64 h-8 flex items-center justify-center gap-4 transition-all hover:brightness-105 active:scale-95"
        style={{ backgroundColor: "#E5AC24" }}
      >
        <img
          src="/icon-upload.svg"
          alt="Upload"
          className="w-6 h-6"
          style={{ filter: "brightness(0) saturate(100%) invert(20%) sepia(40%) saturate(600%) hue-rotate(80deg)" }}
        />
        <span className="text-base font-semibold font-['Inter']" style={{ color: "#24481F" }}>
          Proof of Payment
        </span>
      </button>

    </div>
  );
}