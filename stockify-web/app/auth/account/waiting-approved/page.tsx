"use client";
import { useRouter } from "next/navigation";
import NavbarLandingPage from "@/components/navbars/navbar-landing-page";

export default function WaitingApproved() {
  const router = useRouter();

  return (
    <div className="w-full min-h-screen bg-[#FFFCEB] flex flex-col items-center">
      <div className="w-full max-w-[1268px] flex flex-col h-full px-8 pt-5">
        <div className="w-full flex justify-center shrink-0">
          <NavbarLandingPage />
        </div>
        <div className="flex flex-1 items-center justify-center py-16">
          <div className="bg-[#385E31] rounded-[10px] px-12 py-14 text-center max-w-md shadow-lg">
            <div className="text-6xl mb-5">⏳</div>
            <h2 className="font-bold text-[32px] text-[#F7B71D] mb-3 font-['Inter']">
              Email Confirmed!
            </h2>
            <p className="text-[16px] text-[#FFF9D7] mb-6 leading-relaxed font-['Inter']">
              Your email has been verified. Your account is now pending
              review by our team. You will receive another email once
              your registration has been approved. Please check back later.
            </p>
            <button
              onClick={() => router.push("/")}
              className="bg-[#FFD980] text-[#385E31] font-bold text-[18px] py-3 px-20 rounded-[5px] hover:opacity-90 transition w-full font-['Inter']"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}