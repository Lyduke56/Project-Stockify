"use client";

export default function NotificationModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#FFFCF0] w-[550px] rounded-[40px] shadow-2xl border-t-[12px] border-[#385E31] overflow-hidden">
        <header className="p-8 flex justify-between items-center border-b border-stone-100">
          <h2 className="text-[#385E31] text-2xl font-black uppercase tracking-widest font-['Inter']">Notifications</h2>
          <button onClick={onClose} className="text-[#385E31] text-xl font-bold hover:scale-110 transition-transform">✕</button>
        </header>

        <div className="p-8 max-h-[400px] overflow-y-auto space-y-4">
          {/* Notification Item */}
          <div className="p-5 bg-white rounded-2xl border-l-4 border-[#F7B71D] shadow-sm flex flex-col gap-1">
            <span className="text-[10px] font-black text-[#385E31]/50 uppercase">Subscription</span>
            <p className="text-[#385E31] font-semibold text-sm">Your "Pro Plan" expires in 5 days. Renew now to avoid service interruption.</p>
            <span className="text-[10px] text-stone-400 mt-2">Today at 10:30 AM</span>
          </div>

          <div className="p-5 bg-white rounded-2xl border-l-4 border-stone-200 shadow-sm flex flex-col gap-1 opacity-60">
            <span className="text-[10px] font-black text-[#385E31]/50 uppercase">Inventory</span>
            <p className="text-[#385E31] font-semibold text-sm">Low stock alert: "Organic Fertilizer" is below 10 units.</p>
            <span className="text-[10px] text-stone-400 mt-2">Yesterday</span>
          </div>
        </div>

        <footer className="p-6 bg-stone-50 text-center">
          <button className="text-[#385E31] font-bold text-xs uppercase tracking-widest hover:underline">Mark all as read</button>
        </footer>
      </div>
    </div>
  );
}