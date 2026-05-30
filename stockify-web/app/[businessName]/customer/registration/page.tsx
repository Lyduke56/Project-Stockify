"use client";

import { useParams } from "next/navigation";
import { motion, Variants } from "framer-motion";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client"; // Adjust path if needed
import { fetchStorefrontConfig } from "@/lib/admin/storefront-actions"; // Adjust path if needed
import LoadingScreen from "@/app/loading-screen/loading";

import SlideshowBackground from "@/components/sections/customer/slideshow-background";
import RegistrationForm from "@/components/sections/customer/registration-form";

// ─── Animation Variants ──────────────────────────────────────────────────────
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

  // ─── State ───────────────────────────────────────────────────────
  const [sfConfig, setSfConfig] = useState<any>(null);
  const [isConfigLoading, setIsConfigLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    const loadConfig = async () => {
      try {
        if (!businessName) return;
        const { data: allTenants } = await supabase
          .from("tenants")
          .select("tenant_id, business_name");
        
        const tenant = allTenants?.find((t: any) => 
          t.business_name.toLowerCase().replace(/[\s-]/g, "") === businessName.toLowerCase().replace(/[\s-]/g, "")
        );
        
        if (tenant?.tenant_id) {
          const cfg = await fetchStorefrontConfig(tenant.tenant_id);
          setSfConfig(cfg);
        }
      } catch (err) {
        console.error("Failed to load storefront config:", err);
      } finally {
        setIsConfigLoading(false);
      }
    };
    loadConfig();
  }, [businessName, supabase]);

  // ── Show loading screen until colors are fetched ──
  if (isConfigLoading) {
    return <LoadingScreen fullScreen={true} />;
  }

  return (
    <div 
      className="relative w-full min-h-screen overflow-hidden flex items-center justify-center md:justify-end md:pr-[5%] lg:pr-[8%]"
      style={
        {
          // Injecting CSS variables to the parent so <SlideshowBackground /> can inherit them
          backgroundColor: sfConfig?.color_secondary ?? "#2A4725",
          "--color-primary": sfConfig?.color_primary ?? "#385E31",
          "--color-secondary": sfConfig?.color_secondary ?? "#2A4725",
          "--color-accent": sfConfig?.color_accent ?? "#E5AC24",
        } as React.CSSProperties
      }
    >
      {/* Animated slideshow */}
      <SlideshowBackground />

      {/* ── Floating Registration Panel ──────────────────────────────────────── */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="relative z-20 w-full max-w-[440px] min-h-screen md:min-h-0 bg-white/95 backdrop-blur-xl md:rounded-[32px] flex flex-col justify-center shadow-[0_20px_50px_rgba(0,0,0,0.2)] md:border border-white/40 overflow-hidden"
      >
        {/* Top shimmer line */}
        <div 
          className="absolute top-0 left-0 right-0 h-[2px] opacity-80" 
          style={{ background: `linear-gradient(to right, transparent, ${sfConfig?.color_accent ?? '#F7B71D'}cc, transparent)` }} 
        />

        <div className="px-8 py-12 md:px-10">
          <motion.div variants={itemVariants} className="mb-8">
            <div
              className="inline-flex items-center gap-2.5 rounded-full px-4 py-1.5 mb-6 border"
              style={{
                backgroundColor: `${sfConfig?.color_primary ?? '#385E31'}1a`,
                borderColor: `${sfConfig?.color_primary ?? '#385E31'}1a`,
              }}
            >
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 duration-1000" style={{ backgroundColor: sfConfig?.color_accent ?? '#F7B71D' }}></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5" style={{ backgroundColor: sfConfig?.color_accent ?? '#F7B71D' }}></span>
              </span>
              <span className="font-['Fredoka'] text-[12px] font-bold tracking-widest uppercase" style={{ color: sfConfig?.color_primary ?? '#385E31' }}>
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

          {/* Form */}
          <motion.div variants={itemVariants}>
            <RegistrationForm 
              businessName={businessName} 
              sfConfig={sfConfig} 
            />
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}