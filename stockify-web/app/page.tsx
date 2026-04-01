"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import NavbarLandingPage from "@/components/navbars/navbar-landing-page";
import LoginModal from "@/components/modals/login-modal";
import StockifyButton from "@/components/buttons/button-get-started";

export default function Home() {
  const router = useRouter();
  const [loginOpen, setLoginOpen] = useState(false);

  return (
    <div className="w-full h-screen bg-[#385E31] flex flex-col items-center relative overflow-hidden">
      
      <div className="w-full max-w-[1268px] flex flex-col h-full px-8 pt-8">
        
        {/* Navbar Section */}
        <div className="w-full flex justify-center shrink-0">
          <NavbarLandingPage />
        </div>

        {/* Hero Section (Split Layout) */}
        {/* Added pb-24 here. This pushes the vertical center point upwards. */}
        <div className="w-full flex-1 flex justify-center items-center gap-0 -translate-y-5">
          
          {/* Left Side: Text & Call to Actions */}
          <div className="w-[550px] flex flex-col gap-9 shrink-0">
            
            {/* Headers */}
            <div className="flex flex-col gap-4 pl-3 pt-8">
              <h1 className="text-[#F7B71D] text-5xl font-semibold font-fredoka leading-[1.1]">
                Your inventory should work even when you’re not.
              </h1>
              <p className="text-[#FDEF96] text-2xl font-regular font-raleway leading-10">
                Put your supply chain on autopilot with Stockify’s multi-tenant management engine.
              </p>
            </div>

            {/* Buttons Row */}
            <div className="flex items-center gap-9 pl-3">
              <StockifyButton
                label="Get Started"
                variant="primary"
                onClick={() => router.push("/auth/sign-up")}
              />
              <StockifyButton
                label="Sign In"
                variant="secondary"
                onClick={() => setLoginOpen(true)}
              />
            </div>
          </div>

          {/* Right Side: Dashboard Preview Image */}
          <div className="w-[700px] flex justify-center items-center">
            <img 
              src="/landing-page.png" 
              alt="Stockify Dashboard Preview" 
              className="w-full h-auto max-h-[87vh] object-contain drop-shadow-2xl scale-105"
            />
          </div>

        </div>
      </div>

      {/* Modal Overlay */}
      <LoginModal
        isOpen={loginOpen}
        onClose={() => setLoginOpen(false)}
      />
    </div>
  );
}