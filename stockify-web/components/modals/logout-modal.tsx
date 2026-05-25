"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface LogoutModalProps {
  isOpen: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  colors?: {
    color_primary?: string;
    color_background?: string;
    color_secondary?: string;
    color_accent?: string;
    color_text?: string;
    color_sidebar_text?: string;
  };
}

export default function LogoutModal({
  isOpen,
  onCancel,
  onConfirm,
  colors,
}: LogoutModalProps) {
  // Prevent hydration errors by ensuring this only renders on the client
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Return null if not open OR if the component hasn't mounted on the client yet
  if (!isOpen || !mounted) return null;

  const modalStyles = {
    "--color-primary": colors?.color_primary || "#385E31",
    "--color-background": colors?.color_background || "#FFFCEB",
    "--color-secondary": colors?.color_secondary || "#2A4725",
    "--color-accent": colors?.color_accent || "#E5AC24",
  } as React.CSSProperties;

  // Render the modal directly into the document body
  return createPortal(
    <div 
      style={modalStyles}
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40"
      onClick={onCancel} // <-- ADDED THIS: Closes modal when clicking the background
    >
      <div 
        className="w-[500px] bg-background border-2 border-primary rounded-2xl shadow-xl p-8 text-center"
        onClick={(e) => e.stopPropagation()} // <-- ADDED THIS: Prevents clicks inside the box from closing it
      >

        {/* Title */}
        <h2 className="text-3xl font-bold text-primary mb-4 tracking-wide">
          LOG OUT CONFIRMATION
        </h2>

        {/* Divider */}
        <div className="w-full h-1 bg-accent mb-6"></div>

        {/* Message */}
        <p className="text-lg text-primary mb-8">
          Are you sure you want to log out?
        </p>

        {/* Buttons */}
        <div className="flex justify-center gap-6">
          {/* Cancel */}
          <button
            onClick={onCancel}
            className="px-8 py-3 rounded-full bg-accent text-primary font-semibold shadow-md hover:opacity-90 transition"
          >
            Cancel
          </button>

          {/* Confirm */}
          <button
            onClick={onConfirm}
            className="px-8 py-3 rounded-full bg-primary text-background font-semibold shadow-md hover:opacity-90 transition"
          >
            Log Out
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}