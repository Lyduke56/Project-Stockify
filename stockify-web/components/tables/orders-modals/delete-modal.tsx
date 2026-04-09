"use client";

import { type Order } from "./view-modal";
interface DeleteOrderModalProps {
  order: Order | null;
  onClose: () => void;
  onConfirm: (id: string) => void;
}

export default function DeleteOrderModal({ order, onClose, onConfirm }: DeleteOrderModalProps) {
  if (!order) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-[#FFFCEB] rounded-2xl shadow-2xl w-[420px] max-w-[95vw] overflow-hidden border border-red-200">
        
        {/* Header */}
        <div className="bg-red-600 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/icons/trash.svg" alt="delete" className="w-[18px] h-[18px]" />
            <h2 className="text-white font-bold text-lg tracking-wide">Delete Order</h2>
          </div>

          <button
            onClick={onClose}
            className="text-white/70 hover:text-white transition-colors"
          >
            <img src="/icons/x.svg" alt="close" className="w-[20px] h-[20px]" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 flex flex-col items-center text-center gap-4">
          
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
            <img src="/icons/alert-triangle.svg" alt="warning" className="w-8 h-8" />
          </div>

          <div>
            <p className="text-[#385E31] font-bold text-lg">Are you sure?</p>
            <p className="text-gray-500 text-sm mt-1">
              You are about to delete order{" "}
              <span className="font-bold text-[#385E31]">{order.id}</span> for{" "}
              <span className="font-bold text-[#385E31]">{order.customer}</span>.
              This action cannot be undone.
            </p>
          </div>

          <div className="w-full p-3 bg-red-50 rounded-xl border border-red-100 text-left">
            <p className="text-xs text-red-600 font-medium">
              ⚠ Deleting this order will permanently remove it from the system.
            </p>
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
              onConfirm(order.id);
              onClose();
            }}
            className="flex-1 py-2.5 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-colors"
          >
            Delete Order
          </button>
        </div>

      </div>
    </div>
  );
}