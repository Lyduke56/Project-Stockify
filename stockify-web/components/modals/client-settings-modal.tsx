"use client";

export default function ClientSettingsModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#FFFCF0] w-[500px] rounded-[40px] shadow-2xl border-t-[12px] border-[#385E31] overflow-hidden">
        <header className="p-8 flex justify-between items-center border-b border-stone-100">
          <h2 className="text-[#385E31] text-2xl font-black uppercase tracking-widest font-['Inter']">Client Settings</h2>
          <button onClick={onClose} className="text-[#385E31] text-xl font-bold">✕</button>
        </header>

        <div className="p-10 space-y-6">
          <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-stone-100">
            <div>
              <p className="text-[#385E31] font-bold">Email Notifications</p>
              <p className="text-[10px] text-stone-400">Receive daily inventory reports</p>
            </div>
            <div className="w-12 h-6 bg-[#385E31] rounded-full relative"><div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"/></div>
          </div>

          <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-stone-100">
            <div>
              <p className="text-[#385E31] font-bold">Two-Factor Auth</p>
              <p className="text-[10px] text-stone-400">Secure your administrator account</p>
            </div>
            <div className="w-12 h-6 bg-stone-200 rounded-full relative"><div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full"/></div>
          </div>
        </div>

        <div className="p-8 flex justify-center">
          <button className="bg-[#385E31] text-white px-12 py-3 rounded-full font-black uppercase tracking-widest text-xs">Save Preferences</button>
        </div>
      </div>
    </div>
  );
}