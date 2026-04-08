export default function ClientProfileModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#FFFCF0] w-[600px] rounded-[40px] shadow-2xl border-t-[12px] border-[#385E31] overflow-hidden relative">
        
        <header className="bg-[#F7B71D]/10 p-8 border-b border-stone-200">
          <h2 className="text-[#385E31] text-2xl font-black uppercase tracking-widest">Client Profile</h2>
          <button onClick={onClose} className="absolute top-6 right-8 text-[#385E31] font-bold text-xl hover:scale-110 transition-transform">✕</button>
        </header>

        <div className="p-10 space-y-8">
          {/* Section: Business Details */}
          <div className="space-y-4">
            <h3 className="text-[#385E31] font-bold text-sm uppercase flex items-center gap-2">
              <span className="w-2 h-2 bg-[#F7B71D] rounded-full" /> Business Details
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-white rounded-2xl border border-stone-100">
                <p className="text-[10px] text-stone-400 font-bold uppercase">Registered Name</p>
                <p className="text-[#385E31] font-semibold">Shop Name Corp.</p>
              </div>
              <div className="p-4 bg-white rounded-2xl border border-stone-100">
                <p className="text-[10px] text-stone-400 font-bold uppercase">TIN / Business ID</p>
                <p className="text-[#385E31] font-semibold">123-456-789-000</p>
              </div>
            </div>
          </div>

          {/* Section: Owner Information */}
          <div className="space-y-4">
            <h3 className="text-[#385E31] font-bold text-sm uppercase flex items-center gap-2">
              <span className="w-2 h-2 bg-[#F7B71D] rounded-full" /> Owner Information
            </h3>
            <div className="p-5 bg-[#385E31] rounded-[25px] text-white flex items-center gap-6">
              <div className="w-16 h-16 bg-[#F7B71D] rounded-full border-4 border-white/20 flex items-center justify-center text-2xl font-black">C</div>
              <div>
                <p className="text-xl font-bold italic">Client Administrator</p>
                <p className="text-[#F7B71D] text-sm">Main Account Holder</p>
              </div>
            </div>
          </div>
        </div>

        <footer className="p-8 bg-stone-50 flex justify-end gap-4">
          <button onClick={onClose} className="px-8 py-3 rounded-full font-bold text-stone-400 hover:text-stone-600">Close</button>
          <button className="bg-[#385E31] text-white px-10 py-3 rounded-full font-bold shadow-lg shadow-[#385E31]/20">Edit Details</button>
        </footer>
      </div>
    </div>
  );
}