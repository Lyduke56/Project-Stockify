"use client";

export default function StorefrontSection() {
  return (
    <div className="flex flex-col gap-8 w-full animate-in fade-in duration-500">
      <header className="mb-4 text-center">
        <h1 className="text-[#385E31] text-3xl font-bold uppercase tracking-widest">
          Storefront
        </h1>
        <div className="w-full h-[1px] bg-[#F7B71D] mt-2 opacity-50" />
      </header>

      <div className="space-y-1">
        <h2 className="text-[#385E31] text-2xl font-black">Welcome to the storefront, Client!</h2>
        <p className="text-[#385E31]/60 text-xs font-bold">Utilize the parameters below to give life to your store.</p>
      </div>

      {/* Main Configuration Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4 mt-4">
        {/* Logo and Banner Row */}
        <div className="flex items-center gap-3">
          <label className="text-[#385E31] font-black text-sm w-32">Shop Logo:</label>
          <input type="text" placeholder="filename.png" className="flex-1 p-2.5 rounded-lg bg-[#FDE68A]/50 border border-[#F7B71D]/30 text-[#385E31] text-xs font-bold" />
          <button className="bg-[#385E31] text-white px-6 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-wider hover:brightness-110">Upload</button>
        </div>
        <div className="flex items-center gap-3">
          <label className="text-[#385E31] font-black text-sm w-32">Banner Image:</label>
          <input type="text" placeholder="filename.png" className="flex-1 p-2.5 rounded-lg bg-[#FDE68A]/50 border border-[#F7B71D]/30 text-[#385E31] text-xs font-bold" />
          <button className="bg-[#385E31] text-white px-6 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-wider hover:brightness-110">Upload</button>
        </div>

        {/* Dynamic Color/Dropdown Fields based on Figma */}
        {[
          { label: "Primary Color:", val: "#FF7272", type: "color" },
          { label: "Accents:", val: "#FF7272", type: "color" },
          { label: "Secondary Color:", val: "#FF7272", type: "color" },
          { label: "Background:", val: "#FF7272", type: "color" },
          { label: "Tertiary Color:", val: "#FF7272", type: "color" },
          { label: "Typography:", val: "Inter", type: "select" },
          { label: "Highlighted Product:", val: "Carousel Layout", type: "select" },
          { label: "Other Product:", val: "Card Layout", type: "select" },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-3">
            <label className="text-[#385E31] font-black text-sm w-32">{item.label}</label>
            {item.type === "select" ? (
              <select className="flex-1 p-2.5 rounded-lg bg-[#FDE68A]/50 border border-[#F7B71D]/30 text-[#385E31] text-xs font-bold appearance-none cursor-pointer">
                <option>{item.val}</option>
              </select>
            ) : (
              <input type="text" defaultValue={item.val} className="flex-1 p-2.5 rounded-lg bg-[#FDE68A]/50 border border-[#F7B71D]/30 text-[#385E31] text-xs font-bold" />
            )}
            {item.type === "color" && (
              <div className="w-10 h-10 rounded-md shadow-sm bg-[#FF7272] border border-black/5" />
            )}
          </div>
        ))}
      </div>

      {/* Live Preview Placeholder */}
      <div className="mt-10 pt-6 border-t-2 border-[#385E31]/10">
        <h3 className="text-[#385E31] font-black text-xl mb-4 tracking-tighter uppercase">Live Preview:</h3>
        <div className="rounded-3xl border-4 border-stone-100 overflow-hidden shadow-2xl bg-white aspect-video relative group">
           <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors" />
           <img 
            src="/api/placeholder/800/450" 
            alt="Figma Preview" 
            className="w-full h-full object-cover opacity-80"
           />
           <div className="absolute inset-0 flex items-center justify-center">
             <span className="bg-[#385E31] text-white px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">Preview Mode</span>
           </div>
        </div>
      </div>
    </div>
  );
}