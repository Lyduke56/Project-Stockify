"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface TenantActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  tenantName: string;
  actionType: "suspend" | "terminate";
}

// Helper to get the correct text based on the action type
const getModalContent = (actionType: "suspend" | "terminate", tenantName: string) => {
  if (actionType === "suspend") {
    return {
      title: "SUSPENSION NOTICE",
      message: `Are you sure you want to suspend ${tenantName}?`,
      confirmButtonText: "Suspend",
    };
  } else {
    return {
      title: "TERMINATION NOTICE",
      message: `Are you sure you want to terminate ${tenantName}?`,
      confirmButtonText: "Terminate",
    };
  }
};

export default function TenantActionModal({
  isOpen,
  onClose,
  onConfirm,
  tenantName,
  actionType,
}: TenantActionModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  const { title, message, confirmButtonText } = getModalContent(actionType, tenantName);

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="w-[500px] bg-[#F5F1DC] border-2 border-[#385E31] rounded-2xl shadow-xl p-8 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Title */}
        <h2 className="text-3xl font-bold text-[#385E31] mb-4 tracking-wide uppercase">
          {title}
        </h2>

        {/* Divider */}
        <div className="w-full h-1 bg-[#E5AD24] mb-6"></div>

        {/* Message */}
        <p className="text-lg text-[#385E31] mb-8">{message}</p>

        {/* Buttons */}
        <div className="flex justify-center gap-6">
          {/* Cancel */}
          <button
            onClick={onClose}
            className="px-8 py-3 rounded-full bg-[#E5AD24] text-[#385E31] font-semibold shadow-md hover:opacity-90 transition"
          >
            Cancel
          </button>

          {/* Confirm */}
          <button
            onClick={onConfirm}
            className="px-8 py-3 rounded-full bg-[#385E31] text-white font-semibold shadow-md hover:opacity-90 transition"
          >
            {confirmButtonText}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}