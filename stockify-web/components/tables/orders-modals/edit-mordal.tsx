"use client";

import { useState, useEffect } from "react";
import { type Order } from "./view-modal";
    
interface EditOrderModalProps {
  order: Order | null;
  onClose: () => void;
  onSave: (updated: Order) => void;
}

export default function EditOrderModal({ order, onClose, onSave }: EditOrderModalProps) {
  const [form, setForm] = useState<Order | null>(null);

  useEffect(() => {
    if (order) setForm({ ...order });
  }, [order]);

  if (!order || !form) return null;

  const handleChange = (field: keyof Order, value: string) => {
    setForm((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-[#FFFCEB] rounded-2xl shadow-2xl w-[480px] max-w-[95vw] overflow-hidden border border-[#F7B71D]/40">
        
        {/* Header */}
        <div className="bg-[#385E31] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/icons/pencil.svg" alt="edit" className="w-[18px] h-[18px]" />
            <h2 className="text-white font-bold text-lg tracking-wide">Edit Order</h2>
          </div>

          <button
            onClick={onClose}
            className="text-white/70 hover:text-white transition-colors"
          >
            <img src="/icons/x.svg" alt="close" className="w-[20px] h-[20px]" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          
          <div>
            <label className="block text-xs font-semibold text-[#385E31] uppercase tracking-wider mb-1.5">
              Customer
            </label>
            <input
              type="text"
              value={form.customer}
              onChange={(e) => handleChange("customer", e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-[#F7B71D]/40 bg-white text-[#385E31] font-medium focus:outline-none focus:ring-2 focus:ring-[#F7B71D]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#385E31] uppercase tracking-wider mb-1.5">
              Payment Method
            </label>
            <select
              value={form.paymentMethod}
              onChange={(e) => handleChange("paymentMethod", e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-[#F7B71D]/40 bg-white text-[#385E31] font-medium focus:outline-none focus:ring-2 focus:ring-[#F7B71D]"
            >
              <option>QR Code</option>
              <option>Cash</option>
              <option>Credit Card</option>
              <option>GCash</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#385E31] uppercase tracking-wider mb-1.5">
              Payment Status
            </label>
            <select
              value={form.paymentStatus}
              onChange={(e) =>
                handleChange("paymentStatus", e.target.value as Order["paymentStatus"])
              }
              className="w-full px-4 py-2.5 rounded-xl border border-[#F7B71D]/40 bg-white text-[#385E31] font-medium focus:outline-none focus:ring-2 focus:ring-[#F7B71D]"
            >
              <option>Pending</option>
              <option>Paid</option>
              <option>Failed</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#385E31] uppercase tracking-wider mb-1.5">
              Fulfillment Status
            </label>
            <select
              value={form.fulfillment}
              onChange={(e) =>
                handleChange("fulfillment", e.target.value as Order["fulfillment"])
              }
              className="w-full px-4 py-2.5 rounded-xl border border-[#F7B71D]/40 bg-white text-[#385E31] font-medium focus:outline-none focus:ring-2 focus:ring-[#F7B71D]"
            >
              <option>Processing</option>
              <option>Shipped</option>
              <option>Delivered</option>
              <option>Cancelled</option>
            </select>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 border-2 border-[#385E31] text-[#385E31] font-semibold rounded-xl hover:bg-[#385E31]/5 transition-colors"
          >
            Cancel
          </button>

          <button
            onClick={() => {
              if (form) onSave(form);
              onClose();
            }}
            className="flex-1 py-2.5 bg-[#F7B71D] text-[#385E31] font-bold rounded-xl hover:bg-[#e6a918] transition-colors"
          >
            Save Changes
          </button>
        </div>

      </div>
    </div>
  );
}