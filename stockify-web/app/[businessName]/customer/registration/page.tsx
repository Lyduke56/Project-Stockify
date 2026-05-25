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

const CUSTOM_SLIDES = [
  {
    id: 0,
    gradient: "linear-gradient(135deg, var(--color-secondary, #2A4725) 0%, var(--color-primary, #385E31) 100%)",
    pattern: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.04'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
    headline: "Manage Smarter,",
    subline: "Grow Faster.",
    accent: "var(--color-accent, #E5AC24)",
  },
  {
    id: 1,
    gradient: "linear-gradient(135deg, var(--color-primary, #385E31) 0%, var(--color-secondary, #2A4725) 100%)",
    pattern: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.04'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
    headline: "Your Business,",
    subline: "Your Control.",
    accent: "var(--color-accent, #E5AC24)",
  },
  {
    id: 2,
    gradient: "linear-gradient(135deg, var(--color-secondary, #2A4725) 50%, var(--color-primary, #385E31) 100%)",
    pattern: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Cpolygon points='50,5 95,27.5 95,72.5 50,95 5,72.5 5,27.5' fill='none' stroke='%23ffffff' stroke-opacity='0.04' stroke-width='1'/%3E%3C/svg%3E")`,
    headline: "Every Item",
    subline: "Tracked. Trusted.",
    accent: "var(--color-accent, #E5AC24)",
  },
];

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
      <SlideshowBackground hasHydrated={hasHydrated} slides={CUSTOM_SLIDES} />

      {/* ── Floating panel — pixel-perfect match to login ── */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="relative z-20 w-full max-w-[440px] min-h-screen md:min-h-0 bg-white/95 backdrop-blur-xl md:rounded-[32px] flex flex-col justify-center shadow-[0_20px_50px_rgba(0,0,0,0.2)] md:border border-white/40 overflow-hidden"
      >
        {/* Top shimmer line */}
        <div className="absolute top-0 left-0 right-0 h-[2px] opacity-80" style={{ background: `linear-gradient(to right, transparent, ${sfConfig?.color_accent ?? '#F7B71D'}cc, transparent)` }} />

        <div className="px-8 py-12 md:px-10">

          {/* Header */}
          <motion.div variants={itemVariants} className="mb-8">
            <div
              className="inline-flex items-center gap-2.5 rounded-full px-4 py-1.5 mb-6 border"
              style={{
                backgroundColor: `${sfConfig?.color_primary ?? '#385E31'}1a`,
                borderColor: `${sfConfig?.color_primary ?? '#385E31'}1a`,
              }}
            >
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 duration-1000" style={{ backgroundColor: sfConfig?.color_accent ?? '#F7B71D' }} />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5" style={{ backgroundColor: sfConfig?.color_accent ?? '#F7B71D' }} />
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

          {/* Form — staggered in as one item so internal layout is untouched */}
          <motion.div variants={itemVariants}>
            <RegistrationForm businessName={businessName} sfConfig={sfConfig} />
          </motion.div>

        </div>
      </motion.div>
    </div>
  );
}