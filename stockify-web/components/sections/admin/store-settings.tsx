export default function StoreSettings() {
  return (
    <div className="flex flex-col gap-8 w-full animate-in fade-in duration-500">
      <header className="mb-4 text-center">
        <h1 className="text-[#385E31] text-3xl font-bold font-['Inter'] uppercase tracking-widest">
          Store Settings
        </h1>
        <div className="w-full h-1 bg-[#F7B71D] mt-2 rounded-full opacity-50" />
      </header>

      {/* Main Form Card */}
      <div className="bg-white/70 backdrop-blur-md rounded-[35px] p-10 border border-stone-200 shadow-xl shadow-[#385E31]/5">
        <div className="flex items-center gap-3 mb-8">
           <img src="/icon-store-settings.svg" className="w-8 h-8" alt="" />
           <h3 className="text-[#385E31] text-2xl font-black">Shop Configuration</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
          {/* Store Name */}
          <div className="flex flex-col gap-2">
            <label className="text-[#385E31] text-[10px] font-black uppercase tracking-widest opacity-60 ml-2">Official Store Name</label>
            <input 
              type="text" 
              defaultValue="Shop Name Corporation, Inc." 
              className="p-5 rounded-[20px] bg-white border-2 border-stone-100 focus:border-[#F7B71D] focus:ring-4 focus:ring-[#F7B71D]/10 outline-none transition-all text-[#385E31] font-bold shadow-sm" 
            />
          </div>

          {/* Business Type */}
          <div className="flex flex-col gap-2">
            <label className="text-[#385E31] text-[10px] font-black uppercase tracking-widest opacity-60 ml-2">Business Category</label>
            <select className="p-5 rounded-[20px] bg-white border-2 border-stone-100 focus:border-[#F7B71D] outline-none text-[#385E31] font-bold shadow-sm cursor-pointer appearance-none">
              <option>Retail & Inventory</option>
              <option>Wholesale</option>
              <option>Food & Beverage</option>
            </select>
          </div>

          {/* Contact Email */}
          <div className="flex flex-col gap-2">
            <label className="text-[#385E31] text-[10px] font-black uppercase tracking-widest opacity-60 ml-2">Contact Email</label>
            <input 
              type="email" 
              placeholder="contact@shopname.com" 
              className="p-5 rounded-[20px] bg-white border-2 border-stone-100 focus:border-[#F7B71D] outline-none transition-all text-[#385E31] font-bold shadow-sm" 
            />
          </div>

          {/* Phone */}
          <div className="flex flex-col gap-2">
            <label className="text-[#385E31] text-[10px] font-black uppercase tracking-widest opacity-60 ml-2">Phone Number</label>
            <input 
              type="text" 
              placeholder="+63 912 345 6789" 
              className="p-5 rounded-[20px] bg-white border-2 border-stone-100 focus:border-[#F7B71D] outline-none transition-all text-[#385E31] font-bold shadow-sm" 
            />
          </div>
        </div>

        <div className="mt-12 flex justify-center md:justify-end">
          <button className="bg-[#385E31] text-white px-14 py-5 rounded-full font-black text-sm uppercase tracking-widest shadow-lg shadow-[#385E31]/30 hover:bg-[#F7B71D] hover:text-[#385E31] transition-all transform hover:-translate-y-1">
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}