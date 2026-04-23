"use client";
import { useRouter } from "next/navigation";


export default function AccessDeniedPage() {
    const router = useRouter();
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FFFCF0]">
      <div className="flex flex-col items-center gap-3 text-center px-6">
        <h1 className="text-[#385E31] text-3xl font-bold font-['Inter'] uppercase tracking-widest">
          Access Denied
        </h1>
        <div className="w-64 h-1.5 bg-[#F7B71D] rounded-full opacity-50" />
        <p className="text-[#385E31] text-sm font-medium font-['Inter'] opacity-70 mt-1">
          You do not have permission to access this page.
        </p>
        <button
          onClick={() => (router.push("/"))}
          className="bg-[#F7B71D] text-[#385E31] font-bold py-2 px-6 rounded-full hover:bg-[#E5AD24] transition-colors"
        >
          Return to Homepage
        </button>
      </div>
    </div>
  );
}