"use client";
import { useRouter } from "next/navigation";

export default function NavbarLandingPage() {
  const router = useRouter();

  return (
    /* Removed absolute positioning and hardcoded width. Added w-full. */
    <div className="w-full h-14 px-12 bg-[#F7B71D] rounded-[50px] shadow-[2px_4px_4px_0px_rgba(43,88,12,0.70)] flex items-center justify-between">
      
      {/* LEFT SIDE: Logo and Brand Name */}
      <div 
        className="flex items-center gap-3 cursor-pointer select-none" 
        onClick={() => router.push("/")}
      >
        <div className="w-12 h-12 flex items-center justify-center">
          <img
            src="/stockify-logo.svg"
            alt="Stockify Icon"
            className="h-10 w-auto"
            onClick={() => router.push("/")}
          />
        </div>
        <div className="text-[#385E31] text-3xl font-bold font-fredoka">
          STOCKIFY
        </div>
      </div>

      {/* RIGHT SIDE: Navigation Links */}
      <div className="flex items-center gap-16">
        <button
          onClick={() => router.push("/landing-page/features")}
          className="text-[#385E31] text-2xl font-medium font-fredoka hover:opacity-75 transition-opacity cursor-pointer"
        >
          Features
        </button>
        <button
          onClick={() => router.push("/landing-page/about_us")}
          className="text-[#385E31] text-2xl font-medium font-fredoka hover:opacity-75 transition-opacity cursor-pointer"
        >
          About Us
        </button>
      </div>
    </div>
  );
}