"use client";

export type Order = {
  id: string;
  dateTime: string;
  customer: string;
  paymentMethod: string;
  paymentStatus: "Pending" | "Paid" | "Failed";
  fulfillment: "Processing" | "Shipped" | "Delivered" | "Cancelled";
};

interface ViewOrderModalProps {
  order: Order | null;
  onClose: () => void;
}

export default function ViewOrderModal({ order, onClose }: ViewOrderModalProps) {
  if (!order) return null;

  const fulfillmentColor: Record<Order["fulfillment"], string> = {
    Processing: "bg-blue-100 text-blue-700",
    Shipped: "bg-purple-100 text-purple-700",
    Delivered: "bg-green-100 text-green-700",
    Cancelled: "bg-red-100 text-red-700",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-[#FFFCEB] rounded-2xl shadow-2xl w-[480px] max-w-[95vw] overflow-hidden border border-[#F7B71D]/40">
        {/* Header */}
        <div className="bg-[#385E31] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img
            src="/icons/package.svg"
            alt="package"
            className="w-5 h-5"
            />
            <h2 className="text-white font-bold text-lg tracking-wide">Order Details</h2>
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white transition-colors"
          >
            <img src="/icons/x.svg" alt="close" className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-3 p-4 bg-white rounded-xl border border-[#F7B71D]/30">
            <div className="w-9 h-9 rounded-full bg-[#F7B71D]/20 flex items-center justify-center">
              <img
                src="/icons/package.svg"
                alt="package"
                className="w-5 h-5"
                />
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Order ID</p>
              <p className="text-[#385E31] font-bold text-base">{order.id}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 bg-white rounded-xl border border-[#F7B71D]/30">
            <div className="w-9 h-9 rounded-full bg-[#F7B71D]/20 flex items-center justify-center">
              <img src="/icons/clock.svg" alt="clock" className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Date / Time</p>
              <p className="text-[#385E31] font-semibold">{order.dateTime}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 bg-white rounded-xl border border-[#F7B71D]/30">
            <div className="w-9 h-9 rounded-full bg-[#F7B71D]/20 flex items-center justify-center">
              <img src="/icons/user.svg" alt="user" className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Customer</p>
              <p className="text-[#385E31] font-semibold">{order.customer}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 bg-white rounded-xl border border-[#F7B71D]/30">
            <div className="w-9 h-9 rounded-full bg-[#F7B71D]/20 flex items-center justify-center">
              <img src="/icons/credit-card.svg" alt="payment" className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Payment</p>
              <div className="flex items-center gap-2 mt-0.5">
                <p className="text-[#385E31] font-semibold">{order.paymentMethod}</p>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    order.paymentStatus === "Paid"
                      ? "bg-green-100 text-green-700"
                      : order.paymentStatus === "Failed"
                      ? "bg-red-100 text-red-700"
                      : "bg-[#F7B71D]/30 text-[#7a5800]"
                  }`}
                >
                  {order.paymentStatus}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-[#F7B71D]/30">
            <div>
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Fulfillment Status</p>
              <p className="text-[#385E31] font-semibold mt-0.5">{order.fulfillment}</p>
            </div>
            <span className={`text-xs px-3 py-1 rounded-full font-semibold ${fulfillmentColor[order.fulfillment]}`}>
              {order.fulfillment}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-[#385E31] text-white font-semibold rounded-xl hover:bg-[#2d4d27] transition-colors"
          >
            Close
          </button>

          
        </div>
      </div>
    </div>
  );
}
