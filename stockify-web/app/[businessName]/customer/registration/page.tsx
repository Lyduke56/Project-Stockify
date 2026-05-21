"use client";

import { motion, Variants } from "framer-motion";
import { useRouter, useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { fetchStorefrontConfig } from "@/lib/admin/storefront-actions";
import SlideshowBackground from "@/components/sections/customer/slideshow-background";
import RegistrationForm from "@/components/sections/customer/registration-form";

// ─── Easing & timing — identical to login page ────────────────────────────────
const SWIPE_DURATION = 0.75;
const SWIPE_EASE: [number, number, number, number] = [0.25, 1, 0.35, 1];
const easeOutQuint: [number, number, number, number] = [0.22, 1, 0.36, 1];

const containerVariants: Variants = {
  hidden: { opacity: 0, x: 60 },
  show: {
    opacity: 1,
    x: 0,
    transition: {
      duration: SWIPE_DURATION,
      ease: SWIPE_EASE,
      staggerChildren: 0.055,
      delayChildren: 0.1,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, x: 16 },
  show: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.45, ease: easeOutQuint },
  },
};

export default function CustomerRegistrationPage() {
  const params = useParams();
  const businessName = params?.businessName as string;

  const [sfConfig, setSfConfig] = useState<any>(null);
  const [hasHydrated, setHasHydrated] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    const raf = requestAnimationFrame(() => setHasHydrated(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    const loadConfig = async () => {
      if (!businessName) return;
      const { data: tenant } = await supabase
        .from("tenants")
        .select("tenant_id")
        .ilike("business_name", businessName.replace(/-/g, " "))
        .single();
      if (tenant?.tenant_id) {
        const cfg = await fetchStorefrontConfig(tenant.tenant_id);
        setSfConfig(cfg);
      }
    };
    loadConfig();
  }, [businessName, supabase]);

  return (
    <div
      className="relative w-full min-h-screen overflow-hidden flex items-center justify-center md:justify-end md:pr-[5%] lg:pr-[8%]"
      style={{
        backgroundColor: sfConfig?.color_secondary ?? "#2A4725",
        "--color-primary": sfConfig?.color_primary ?? "#385E31",
        "--color-secondary": sfConfig?.color_secondary ?? "#2A4725",
        "--color-accent": sfConfig?.color_accent ?? "#E5AC24",
      } as React.CSSProperties}
    >
      {/* ── Slideshow background ── */}
      <SlideshowBackground hasHydrated={hasHydrated} />

      {/* ── Floating panel — pixel-perfect match to login ── */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="relative z-20 w-full max-w-[440px] min-h-screen md:min-h-0 bg-white/95 backdrop-blur-xl md:rounded-[32px] flex flex-col justify-center shadow-[0_20px_50px_rgba(0,0,0,0.2)] md:border border-white/40 overflow-hidden"
      >
        {/* Top shimmer line */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#F7B71D]/80 to-transparent opacity-80" />

        <div className="px-8 py-12 md:px-10">

          {/* Header */}
          <motion.div variants={itemVariants} className="mb-8">
            <div className="inline-flex items-center gap-2.5 bg-[#385E31]/10 border border-[#385E31]/10 rounded-full px-4 py-1.5 mb-6">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#F7B71D] opacity-75 duration-1000" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#F7B71D]" />
              </span>
              <span className="font-['Fredoka'] text-[12px] text-[#385E31] font-bold tracking-widest uppercase">
                {businessName?.replace(/-/g, " ") ?? "Store"}
              </span>
            </div>
            <h1 className="font-['Fredoka'] font-bold text-4xl leading-tight text-gray-900 mb-2">
              Create Account
            </h1>
            <p className="font-['Fredoka'] text-[15px] text-gray-500 font-medium">
              We'll send a confirmation link to your email.
            </p>
          </motion.div>

          {/* Form — staggered in as one item so internal layout is untouched */}
          <motion.div variants={itemVariants}>
            <RegistrationForm businessName={businessName} />
          </motion.div>

        </div>
      </motion.div>
    </div>
  );
}