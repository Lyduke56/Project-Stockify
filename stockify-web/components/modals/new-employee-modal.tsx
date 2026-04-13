"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface NewEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NewEmployeeModal({ isOpen, onClose }: NewEmployeeModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-[500px] bg-[#F5F1DC] border-2 border-[#385E31] rounded-[30px] shadow-2xl p-10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <h2 className="text-3xl font-black text-[#385E31] text-center mb-2 uppercase tracking-tight">
          New Employee
        </h2>
        <div className="w-full h-1 bg-[#E5AD24] mb-8"></div>

        {/* Form Fields */}
        <div className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="Name"
            className="w-full p-4 rounded-xl bg-[#FDE68A]/60 border border-[#F7B71D]/30 outline-none text-[#385E31] font-bold placeholder-[#385E31]/40"
          />
          <input
            type="email"
            placeholder="Email"
            className="w-full p-4 rounded-xl bg-[#FDE68A]/60 border border-[#F7B71D]/30 outline-none text-[#385E31] font-bold placeholder-[#385E31]/40"
          />
          <input
            type="password"
            placeholder="Password"
            className="w-full p-4 rounded-xl bg-[#FDE68A]/60 border border-[#F7B71D]/30 outline-none text-[#385E31] font-bold placeholder-[#385E31]/40"
          />
          <select 
            className="w-full p-4 rounded-xl bg-[#FDE68A]/60 border border-[#F7B71D]/30 outline-none text-[#385E31] font-bold appearance-none cursor-pointer"
          >
            <option value="" disabled selected>Role</option>
            <option value="manager">Manager</option>
            <option value="staff">Staff</option>
          </select>
        </div>

        {/* Buttons */}
        <div className="flex justify-center gap-4 mt-10">
          <button
            onClick={onClose}
            className="flex-1 py-4 rounded-full bg-[#F7B71D] text-[#385E31] font-black uppercase text-sm shadow-md hover:brightness-95 transition"
          >
            Cancel
          </button>
          <button
            className="flex-1 py-4 rounded-full bg-[#385E31] text-white font-black uppercase text-sm shadow-md hover:brightness-110 transition"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}