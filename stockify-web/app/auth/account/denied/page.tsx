"use client";
import { useRouter } from "next/navigation";
import NavbarLandingPage from "@/components/navbars/navbar-landing-page";

export default function DeniedBusiness() {
  const router = useRouter();

  return (
    <div className="w-full min-h-screen bg-[#FFFCEB] flex flex-col items-center">
      <div className="w-full max-w-[1268px] flex flex-col h-full px-8 pt-5">
        <div className="w-full flex justify-center shrink-0">
          <NavbarLandingPage />
        </div>
        <div className="flex flex-1 items-center justify-center py-16">
          <div className="bg-[#7B2020] rounded-[10px] px-12 py-14 text-center max-w-md shadow-lg">
            <div className="text-6xl mb-5">❌</div>
            <h2 className="font-bold text-[32px] text-[#FFD980] mb-3 font-['Inter']">
              Registration Denied
            </h2>
            <p className="text-[16px] text-[#FFF9D7] mb-6 leading-relaxed font-['Inter']">
              Unfortunately, your business registration was not approved by our
              team. A notification has been sent to your registered email. If
              you think this was a mistake, please contact our support.
            </p>
            <button
              onClick={() => router.push("/")}
              className="bg-[#FFD980] text-[#7B2020] font-bold text-[18px] px-8 py-3 rounded-[5px] hover:opacity-90 transition w-full font-['Inter']"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}