"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import NavbarLandingPage from "@/components/navbars/navbar-landing-page";
import LandingPageInfoCard from "@/components/cards/landing-page-info-card";
import LandingPageObjectiveCard from "@/components/cards/landing-page-objective-card"; 
import StockifyButton from "@/components/buttons/button-get-started"; 

export default function Home() {
  const router = useRouter();
  const [loginOpen, setLoginOpen] = useState(false);

  return (
    // Note: I removed `items-center` from the root div so we can manage full-width sections easier
    <div className="w-full h-screen bg-[#FFFCEB] flex flex-col relative overflow-y-auto">
      
      {/* Top */}
      <div className="w-full flex justify-center">
        <div className="w-full max-w-[1268px] flex flex-col px-8 pt-8 pb-16">
          
          {/* Navbar Section */}
          <div className="w-full flex justify-center shrink-0 pb-8">
            <NavbarLandingPage />
          </div>

          {/* Section Header */}
          <div className="flex flex-col items-center justify-center text-center w-full mx-auto max-w-5xl mb-8">
            <div className="flex flex-row items-center justify-center gap-4 mb-6">
              <h2 className="text-[#3B5418] text-4xl md:text-5xl font-bold font-['Inter']">What is</h2>
              <img className="w-16 md:w-20 h-auto" src="/stockify-logo-1.svg" alt="Stockify Box Icon" />
              <h2 className="text-[#3B5418] text-4xl md:text-5xl font-bold font-['Fredoka'] tracking-wide">STOCKIFY?</h2>
            </div>
            <div className="w-full max-w-[780px] h-2.5 bg-amber-400 rounded-full mb-8" />
            <p className="max-w-4xl text-xl md:text-2xl font-semibold font-['Inter'] leading-relaxed">
              <span className="text-[#3B5418]">The heavy lifting, handled</span>
              <span className="text-amber-400">. </span>
              <span className="text-[#3B5418]">It’s everything you need to run your shop without the spreadsheet-induced migraines.</span>
            </p>
          </div>

          {/* Info Cards Section */}
          <div className="w-full flex justify-center shrink-0 pb-8">
            <LandingPageInfoCard 
              number="01"
              title="Smart Restock Alerts"
              description={`Never tell a customer "we're out" ever again. Set your own minimum stock thresholds, and our engine will trigger a digital "hey, look at this" notification before you hit zero.`}
            />
          </div>
          <div className="w-full flex justify-center shrink-0 pb-8">
            <LandingPageInfoCard 
              number="02"
              title="Sales Forecasting"
              description={`Stop guessing what will sell next month. After six months of data, Stockify synthesizes your transaction history into annual sales projections to help you make data-driven restocking decisions.`}
            />
          </div>
          <div className="w-full flex justify-center shrink-0 pb-8">
            <LandingPageInfoCard 
              number="03"
              title="Multi-Tenant Privacy"
              description={`Even though you're on a shared SaaS platform, your data is yours alone. Our architecture ensures a high degree of isolation, giving you a unique shop directory and individual settings tailored for you.`}
            />
          </div>
          <div className="w-full flex justify-center shrink-0 pb-8">
            <LandingPageInfoCard 
              number="04"
              title="Team Control"
              description={`Managing a crew? Use Role-Based Access Control (RBAC) to grant your staff access to inventory records or order fulfillment without giving away the keys to the entire castle.`}
            />
          </div>
          <div className="w-full flex justify-center shrink-0 pb-8">
            <LandingPageInfoCard 
              number="05"
              title="Your Brand, Your Rules"
              description={`It’s your storefront, not ours. Customize your colors, upload your logo, and choose exactly how you want to get paid—whether it's through QR codes or Cash-on-Delivery.`}
            />
          </div>
          <div className="w-full flex justify-center shrink-0 pb-8">
            <LandingPageInfoCard 
              number="06"
              title="Total Inventory CRUD"
              description={`From adding seasonal pastries to updating tech gear prices, our single interface gives you full Create, Read, Update, and Delete power over your entire product catalog.`}
            />
          </div>

        </div>
      </div>
      {/* End of Top */}


      {/* Objectives */}
      <div className="w-full bg-[#F7B71D] py-16 flex justify-center">
        <div className="w-full max-w-[1268px] px-8">
          
          <h2 className="text-[#3B5418] text-3xl md:text-4xl font-bold font-['Fredoka'] mb-8">
            The Objectives
          </h2>

          {/* Flexbox to arrange the cards and the 3D character */}
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
            
            {/* The 3 Cards */}
            <div className="flex flex-row flex-wrap lg:flex-nowrap justify-start gap-6">
              <LandingPageObjectiveCard 
                image_path="/icon-stocks.png" 
                title="Eliminate Loss in Sales and Revenue"
                description="We aim to prevent revenue loss caused by inventory stock-outs, a common issue that disrupts small business growth."
              />
              <LandingPageObjectiveCard 
                image_path="/icon-automation.png" 
                title="Automate Stock Monitoring"
                description="The system is designed to automate stock monitoring and to alert generation, ensuring you are always aware of your inventory levels without manual tracking."
              />
              <LandingPageObjectiveCard 
                image_path="/icon-decision.png" 
                title="Drive Data-Based Decisions"
                description="We provide business insights and analytics to assist owners in making restocking decisions and optimizing their overall inventory strategy."
              />
            </div>

            {/* The 3D Character Illustration */}
            <img 
              src="/stockify-kid.svg" 
              alt="Stockify User Character" 
              className="w-48 lg:w-72 h-auto object-contain hidden lg:block" 
            />

          </div>
        </div>
      </div>
      {/* End of Objectives */}


      {/* Bottom Section */}
      <div className="w-full flex justify-center py-24">
        <div className="flex flex-col items-center justify-center text-center w-full max-w-5xl px-4">
          
          {/* Title Row (Flex wrap in case it gets too tight on small mobile screens) */}
          <div className="flex flex-row flex-wrap items-center justify-center gap-3 md:gap-4 mb-10">
            <h2 className="text-[#3B5418] text-3xl md:text-5xl font-bold font-['Inter']">
              Get started with
            </h2>
            <img 
              className="w-12 md:w-20 h-auto" 
              src="/stockify-logo-1.svg" 
              alt="Stockify Box Icon" 
            />
            <h2 className="text-[#3B5418] text-3xl md:text-5xl font-bold font-['Fredoka'] tracking-wide">
              STOCKIFY 
            </h2>
            <h2 className="text-[#3B5418] text-3xl md:text-5xl font-bold font-['Inter']">
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
      {/* End of Bottom Section */}

    </div>
  );
}