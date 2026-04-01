"use client";
import { useRouter } from "next/navigation";

export default function NavbarLandingPage() {
  const router = useRouter();

  return (
    <div className="absolute left-[160px] top-[58.88px] w-[1120px] h-[69.27px]">
      {/* Background Bar */}
      <div className="absolute inset-0 bg-[#F7B71D] rounded-[50px] shadow-[2px_4px_4px_rgba(43,88,12,0.7)]" />

      {/* Box Icon*/}
      <img
        src="/stockify-logo.svg"
        alt="Stockify Icon"
        onClick={() => router.push("/")}
        className="absolute h-[37px] w-auto left-[4.29%] top-[11px] cursor-pointer"
      />

      {/* STOCKIFY*/}s
      <button
        onClick={() => router.push("/")}
        className="absolute font-['Fredoka'] font-bold text-[30px] leading-[36px] text-[#3A6131] cursor-pointer"
        style={{ left: "9.2%", right: "78.66%", top: "18.03%", bottom: "30%" }}
      >
        STOCKIFY
      </button>

      {/* Features link */}
      <button
        onClick={() => router.push("/landing-page/features")}
        className="absolute font-['Fredoka'] font-medium text-[25px] leading-[30px] text-[#3A6131] cursor-pointer hover:opacity-75 transition-opacity"
        style={{ left: "72.05%", right: "19.02%", top: "26.23%", bottom: "30.46%" }}
      >
        Features
      </button>

      {/* About Us link */}
      <button
        onClick={() => router.push("/landing-page/about_us")}
        className="absolute font-['Fredoka'] font-medium text-[25px] leading-[30px] text-[#3A6131] cursor-pointer hover:opacity-75 transition-opacity"
        style={{ left: "85.27%", right: "5.36%", top: "26.23%", bottom: "30.46%" }}
      >
        About Us
      </button>
    </div>
  );
}