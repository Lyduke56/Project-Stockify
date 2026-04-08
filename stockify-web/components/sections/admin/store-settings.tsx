export default function StoreSettingsSection() {
  return (
    <div className="flex flex-col gap-8 w-full animate-in fade-in duration-500">
      <header className="mb-4 text-center">
        <h1 className="text-[#385E31] text-3xl font-bold uppercase tracking-widest">
          Store Settings
        </h1>
        <div className="w-full h-[1px] bg-[#F7B71D] mt-2 opacity-50" />
      </header>

      {/* Business Information Section */}
      <div className="space-y-6">
        <h3 className="text-[#385E31] font-bold text-xl">BUSINESS INFORMATION</h3>
        <div className="grid grid-cols-1 gap-4 max-w-3xl">
          {[
            { label: "Business Name:", val: "Description" },
            { label: "Contact Number:", val: "Description" },
            { label: "Operating Hours:", val: "Description" },
          ].map((item) => (
            <div key={item.label} className="grid grid-cols-3 items-center">
              <label className="text-[#385E31] font-bold">{item.label}</label>
              <input 
                type="text" 
                placeholder={item.val}
                className="col-span-2 p-3 rounded-lg bg-[#FDE68A]/50 border border-[#F7B71D]/30 outline-none text-[#385E31]" 
              />
            </div>
          ))}
        </div>
      </div>

      {/* Payment Methods Section */}
      <div className="space-y-4">
        <h3 className="text-[#385E31] font-bold text-xl">PAYMENT METHODS</h3>
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-10">
            <span className="text-[#385E31] font-bold w-64">Enable Cash-on-Delivery (COD)</span>
            <div className="w-10 h-5 bg-[#385E31] rounded-full relative"><div className="absolute right-1 top-1 w-3 h-3 bg-white rounded-full"/></div>
          </div>
          <div className="flex items-center gap-10">
            <span className="text-[#385E31] font-bold w-64">Enable QR Code Payment</span>
            <div className="w-10 h-5 bg-[#385E31] rounded-full relative"><div className="absolute right-1 top-1 w-3 h-3 bg-white rounded-full"/></div>
          </div>
        </div>
      </div>

      {/* QR Code Section - As seen in image_f57fe2.png */}
      <div className="space-y-4">
        <h3 className="text-[#385E31] font-bold text-xl">IN-HOUSE QR CODE</h3>
        <div className="bg-white border border-[#385E31] rounded-2xl p-8 flex items-center gap-8 w-fit">
          <div className="w-40 h-40 bg-white border-2 border-black flex items-center justify-center">
             <img src="/sample-qr.png" alt="QR Code" className="w-32 h-32" />
          </div>
          <div className="flex flex-col gap-2">
            <p className="text-[#385E31] text-xs font-bold text-center">Active Token<br/><span className="font-mono opacity-60 italic">a1b2c3d4e5f6g7h8i9j0</span></p>
            <button className="bg-[#385E31] text-white px-4 py-2 rounded-full text-xs font-bold">Generate New QR Code</button>
          </div>
        </div>
      </div>
    </div>
  );
}