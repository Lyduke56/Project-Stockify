"use client";

import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import SlideshowBackground from "@/components/sections/customer/slideshow-background";
import RegistrationForm from "@/components/sections/customer/registration-form";


export default function CustomerRegistrationPage() {
  const params = useParams();
  const businessName = params?.businessName as string;

  return (
    <div className="relative w-full min-h-screen overflow-hidden flex items-center justify-end pr-0 md:pr-16">
      {/* Animated slideshow */}
      <SlideshowBackground />

      {/* Floating panel */}q
      <motion.div
        initial={{ opacity: 0, x: 60 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ type: "spring", stiffness: 280, damping: 28, delay: 0.2 }}
        className="relative z-20 w-full md:w-[440px] min-h-screen md:min-h-0 md:rounded-[28px] flex flex-col justify-center bg-[#FFFCEB] md:shadow-2xl overflow-hidden md:mr-0"
        style={{ boxShadow: "0 32px 80px rgba(0,0,0,0.35), 0 0 0 3px #F7B71D" }}
      >
        {/* Top accent bar */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#F7B71D]" />

        <div className="px-10 py-12">
          {/* Header */}
          <div className="mb-7">
            <div className="inline-flex items-center gap-2 bg-[#385E31] rounded-full px-4 py-1.5 mb-4">
              <span className="w-2 h-2 rounded-full bg-[#F7B71D] animate-pulse" />
              <span className="font-['Fredoka'] text-[12px] text-[#F7B71D] font-semibold tracking-widest uppercase">
                {businessName?.replace(/-/g, " ") ?? "Store"}
              </span>
            </div>
            <h1 className="font-['Fredoka'] font-bold text-[38px] leading-tight text-[#385E31]">
              Create Account
            </h1>
            <p className="font-['Fredoka'] text-[13px] text-[#8C9B85] mt-1">
              We'll send a confirmation link to your email.
            </p>
          </div>

          {/* Form */}
          <RegistrationForm businessName={businessName} />
        </div>

        {/* Bottom accent */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-[#385E31] via-[#F7B71D] to-[#385E31]" />
      </motion.div>
    </div>
  );
}