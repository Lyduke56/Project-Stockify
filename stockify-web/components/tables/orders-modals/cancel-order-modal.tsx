"use client";

import { AlertTriangle, X, XCircle } from "lucide-react";

// Using a simplified interface to bypass strict cross-file type clashes!
interface CancelConfirmModalProps {
  order: any; 
  onClose: () => void;
  onConfirm: (id: string, newStatus: string) => void; 
}

export default function CancelConfirmModal({ order, onClose, onConfirm }: CancelConfirmModalProps) {
  if (!order) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#385E31]/40 backdrop-blur-sm">
      <div className="bg-[#FFFCEB] rounded-2xl shadow-2xl w-[420px] max-w-[95vw] overflow-hidden border border-red-200 font-['Inter']">
        
        {/* Header */}
        <div className="bg-red-600 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-white">
            <XCircle size={18} strokeWidth={2.5} />
            <h2 className="font-bold text-lg tracking-wide">Cancel Order</h2>
          </div>

          <button
            onClick={onClose}
            className="text-white/70 hover:text-white transition-colors"
          >
            <X size={20} strokeWidth={2.5} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 flex flex-col items-center text-center gap-4">
          
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center text-red-600">
            <AlertTriangle size={32} />
          </div>

          <div>
            <p className="text-[#385E31] font-bold text-lg">Are you sure?</p>
            <p className="text-gray-500 text-sm mt-1 leading-relaxed">
              You are about to cancel order <span className="font-bold text-[#385E31]">{order.id}</span> for{" "}
              <span className="font-bold text-[#385E31]">{order.customer}</span>.
            </p>
          </div>

          <div className="w-full p-3 bg-red-50 rounded-xl border border-red-100 text-left mt-2">
            <p className="text-xs text-red-600 font-medium leading-relaxed">
              <span className="font-bold">Note:</span> Canceling this order will permanently void the transaction. The deducted ingredients will be automatically restored to your inventory.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 border-2 border-[#385E31] text-[#385E31] font-semibold rounded-xl hover:bg-[#385E31]/5 transition-colors"
          >
            Go Back
          </button>

          <button
            onClick={() => {
              onConfirm(order.id, "Cancelled");
              onClose();
            }}
            className="flex-1 py-2.5 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-colors shadow-md"
          >
            Confirm Cancel
          </button>
        </div>

      </div>
    </div>
  );
}