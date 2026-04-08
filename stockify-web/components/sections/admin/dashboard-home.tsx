export default function DashboardHome() {
  return (
    <>
      <header className="mb-8 text-center">
        <h1 className="text-[#385E31] text-3xl font-bold font-['Inter'] uppercase tracking-widest">
          Admin Dashboard
        </h1>
        <div className="w-full h-1 bg-[#F7B71D] mt-2 rounded-full opacity-50" />
      </header>

      <div className="flex flex-col gap-6">
        <h2 className="text-[#385E31] text-4xl font-bold font-['Inter']">
          Hello, Client!
        </h2>
        <p className="text-stone-400 font-medium">Shop Name Corporation, Inc.</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
          <div className="h-40 bg-[#385E31] rounded-xl shadow-lg border-b-8 border-[#F7B71D]" />
          <div className="h-40 bg-[#385E31] rounded-xl shadow-lg border-b-8 border-[#F7B71D]" />
          <div className="h-40 bg-[#385E31] rounded-xl shadow-lg border-b-8 border-[#F7B71D]" />
        </div>
      </div>
    </>
  );
}