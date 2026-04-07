"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import NavbarLandingPage from "@/components/navbars/navbar-landing-page";
import LoginModal from "@/components/modals/login-modal";
import StockifyButton from "@/components/buttons/button-get-started";
import LandingPageInfoCard from "@/components/cards/landing-page-info-card";
import LandingPageObjectiveCard from "@/components/cards/landing-page-objective-card"; 

export default function Home() {
  const router = useRouter();
  const [loginOpen, setLoginOpen] = useState(false);

  return (
    // Changed to min-h-screen and removed overflow-hidden so the page can scroll
    <div className="w-full min-h-screen flex flex-col relative overflow-x-hidden font-sans">
      
      {/* ================= HERO SECTION ================= */}
      <div className="w-full min-h-screen bg-[#385E31] flex flex-col items-center pt-8">
        <div className="w-full max-w-[1268px] flex flex-col h-full px-8 flex-1">
          
          {/* Navbar Section */}
          <div className="w-full flex justify-center shrink-0">
            <NavbarLandingPage />
          </div>

          {/* Hero Content (Split Layout) */}
          <div className="w-full flex-1 flex justify-center items-center gap-0 pb-0">
            
            {/* Left Side: Text & Call to Actions */}
            <div className="w-[550px] flex flex-col gap-10 shrink-0">
              <div className="flex flex-col gap-4 pl-3 pt-8">
                <h1 className="text-[#F7B71D] text-[51px] font-semibold font-fredoka leading-[1.1]">
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
                className="w-full h-auto max-h-[76vh] object-contain drop-shadow-2xl scale-105"
              />
            </div>

          </div>
        </div>
      </div>
      {/* ================= END HERO SECTION ================= */}


      {/* ================= FEATURES SECTION ================= */}
      {/* Target ID for smooth scrolling */}
      <div id="features" className="w-full bg-[#FFFCEB] flex flex-col items-center relative">
        
        {/* Top: What is Stockify + Info Cards */}
        <div className="w-full max-w-[1268px] flex flex-col px-8 pt-12 pb-16">
          
          {/* Section Header */}
          <div className="flex flex-col items-center justify-center text-center w-full mx-auto max-w-5xl mb-12">
            <div className="flex flex-row items-center justify-center gap-2 mb-6">
              <h2 className="text-[#3B5418] text-3xl md:text-[43px] font-semibold font-['Fredoka']">What is</h2>
              <img className="w-16 md:w-15 h-auto" src="/stockify-logo-1.svg" alt="Stockify Box Icon" />
              <h2 className="text-[#3B5418] text-3xl md:text-[40px] font-bold font-['Fredoka'] tracking-wide">STOCKIFY?</h2>
            </div>
            <div className="w-full max-w-[900px] h-2 bg-amber-400 rounded-full mb-8" />
            <p className="max-w-4xl text-xl md:text-[20px] font-semibold font-['Inter'] leading-relaxed">
              <span className="text-[#3B5418]">The heavy lifting, handled</span>
              <span className="text-amber-400">. </span>
              <span className="text-[#3B5418]">It’s everything you need to run your shop without the spreadsheet-induced migraines.</span>
            </p>
          </div>

          {/* Info Cards Section */}
          <div className="w-full flex flex-col gap-8">
            <div className="w-full flex justify-center">
              <LandingPageInfoCard 
                number="01"
                title="Smart Restock Alerts"
                description={`Never tell a customer "we're out" ever again. Set your own minimum stock thresholds, and our engine will trigger a digital "hey, look at this" notification before you hit zero.`}
              />
            </div>
            <div className="w-full flex justify-center">
              <LandingPageInfoCard 
                number="02"
                title="Sales Forecasting"
                description={`Stop guessing what will sell next month. After six months of data, Stockify synthesizes your transaction history into annual sales projections to help you make data-driven restocking decisions.`}
              />
            </div>
            <div className="w-full flex justify-center">
              <LandingPageInfoCard 
                number="03"
                title="Multi-Tenant Privacy"
                description={`Even though you're on a shared SaaS platform, your data is yours alone. Our architecture ensures a high degree of isolation, giving you a unique shop directory and individual settings tailored for you.`}
              />
            </div>
            <div className="w-full flex justify-center">
              <LandingPageInfoCard 
                number="04"
                title="Team Control"
                description={`Managing a crew? Use Role-Based Access Control (RBAC) to grant your staff access to inventory records or order fulfillment without giving away the keys to the entire castle.`}
              />
            </div>
            <div className="w-full flex justify-center">
              <LandingPageInfoCard 
                number="05"
                title="Your Brand, Your Rules"
                description={`It’s your storefront, not ours. Customize your colors, upload your logo, and choose exactly how you want to get paid—whether it's through QR codes or Cash-on-Delivery.`}
              />
            </div>
            <div className="w-full flex justify-center">
              <LandingPageInfoCard 
                number="06"
                title="Total Inventory CRUD"
                description={`From adding seasonal pastries to updating tech gear prices, our single interface gives you full Create, Read, Update, and Delete power over your entire product catalog.`}
              />
            </div>
          </div>
        </div>

        {/* Objectives - Height now adjusts naturally to content using vertical padding */}
        <div className="w-full bg-[#F7B71D] pt-16 md:pt-12 pl-10 flex justify-center items-center">
          <div className="w-full max-w-[1268px] flex flex-col justify-center items-center">
            
            {/* Added px-8 here so it aligns perfectly with the left edge of the cards below */}
            <h2 className="w-full text-left text-[#3B5418] text-4xl md:text-5xl font-semibold font-['Fredoka'] mb-10">
              The Objectives
            </h2>

            {/* Flexbox adjusted for better balancing of cards and 3D character */}
            <div className="flex flex-col lg:flex-row items-stretch justify-center gap-12 w-full px-8">
              
              {/* The 3 Cards Wrapper */}
              <div className="flex flex-col md:flex-row flex-wrap lg:flex-nowrap justify-center gap-6 w-full lg:w-2/3">
                <div className="flex-1 min-w-[280px]">
                  <LandingPageObjectiveCard 
                    image_path="/icon-stocks.png" 
                    title="Eliminate Loss in Sales and Revenue"
                    description="We aim to prevent revenue loss caused by inventory stock-outs, a common issue that disrupts small business growth."
                  />
                </div>
                <div className="flex-1 min-w-[280px]">
                  <LandingPageObjectiveCard 
                    image_path="/icon-automation.png" 
                    title="Automate Stock Monitoring"
                    description="The system is designed to automate stock monitoring and to alert generation, ensuring you are always aware of your inventory levels without manual tracking."
                  />
                </div>
                <div className="flex-1 min-w-[280px]">
                  <LandingPageObjectiveCard 
                    image_path="/icon-decision.png" 
                    title="Drive Data-Based Decisions"
                    description="We provide business insights and analytics to assist owners in making restocking decisions and optimizing their overall inventory strategy."
                  />
                </div>
              </div>

              {/* The 3D Character Illustration */}
              <div className="hidden lg:flex w-full lg:w-1/3 justify-center items-center -translate-y-9">
                <img 
                  src="/stockify-kid.png" 
                  alt="Stockify User Character" 
                  className="w-full max-w-[350px] h-auto object-contain drop-shadow-xl" 
                />
              </div>

            </div>
          </div>
        </div>

        {/* Bottom Call to Action Section */}
        <div className="w-full flex justify-center py-25 bg-[#FFFCEB]">
          <div className="flex flex-col items-center justify-center text-center w-full max-w-5xl px-4">
            
            {/* Title Row */}
            <div className="flex flex-row flex-wrap items-center justify-center gap-3 md:gap-4 mb-10">
              <h2 className="text-[#3B5418] text-4xl md:text-[55px] font-semibold font-['Fredoka']">
                Get started with
              </h2>
              <img 
                className="w-14 md:w-18 h-auto" 
                src="/stockify-logo-1.svg" 
                alt="Stockify Box Icon" 
              />
              <h2 className="text-[#3B5418] text-4xl md:text-[55px] font-bold font-['Fredoka'] tracking-wide">
                STOCKIFY 
              </h2>
              <h2 className="text-[#3B5418] text-4xl md:text-[55px] font-semibold font-['Fredoka']">
                now!
              </h2>
            </div>

            {/* Action Button */}
            <StockifyButton
              label="Get Started"
              variant="primary"
              onClick={() => router.push("/auth/sign-up")}
            />

          </div>
        </div>

      </div>
      {/* ================= END FEATURES SECTION ================= */}

      {/* Modal Overlay */}
      <LoginModal
        isOpen={loginOpen}
        onClose={() => setLoginOpen(false)}
      />
    </div>
  );
}