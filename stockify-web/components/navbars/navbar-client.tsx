"use client";

import { useRouter } from "next/navigation";



export default function NavbarClient() {
const router = useRouter();

  return (
    <header className="w-full rounded-[40px] bg-amber-400 shadow-[2px_4px_11px_0px_rgba(0,0,0,0.25)] px-6 py-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-6 w-8 rounded bg-white/40" />
              <div className="text-lime-800 text-2xl font-bold font-['Inter']">STOCKIFY</div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-white/40" />
              <div className="h-8 w-8 rounded-full bg-white/40" />
              <div className="h-8 w-8 rounded-full bg-white/40" />
            </div>
          </header>
  );
}