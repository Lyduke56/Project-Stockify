"use client";

import { motion, AnimatePresence, Variants } from "framer-motion";
import { useRouter, useParams } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { getUserData } from "@/backend/hooks/getUserRole";
import { getBusinessNameByUserId } from "@/backend/hooks/getTenantBName";


// ─── Slideshow slides ────────────────────────────────────────────────────────
const SLIDES = [
  {
    id: 0,
    gradient: "linear-gradient(135deg, #1a3a14 0%, #2d5a25 40%, #385E31 70%, #4a7a3d 100%)",
    pattern: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.04'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
    headline: "Manage Smarter,",
    subline: "Grow Faster.",
    accent: "#F7B71D",
  },
  {
    id: 1,
    gradient: "linear-gradient(135deg, #0f2d0a 0%, #1e4a17 40%, #2a5c22 70%, #385E31 100%)",
    pattern: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23F7B71D' fill-opacity='0.05' fill-rule='evenodd'%3E%3Ccircle cx='40' cy='40' r='20'/%3E%3Ccircle cx='0' cy='0' r='20'/%3E%3Ccircle cx='80' cy='0' r='20'/%3E%3Ccircle cx='0' cy='80' r='20'/%3E%3Ccircle cx='80' cy='80' r='20'/%3E%3C/g%3E%3C/svg%3E")`,
    headline: "Your Business,",
    subline: "Your Control.",
    accent: "#FFD980",
  },
  {
    id: 2,
    gradient: "linear-gradient(135deg, #243b1c 0%, #385E31 50%, #4f7a42 100%)",
    pattern: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Cpolygon points='50,5 95,27.5 95,72.5 50,95 5,72.5 5,27.5' fill='none' stroke='%23ffffff' stroke-opacity='0.04' stroke-width='1'/%3E%3C/svg%3E")`,
    headline: "Every Item",
    subline: "Tracked. Trusted.",
    accent: "#F7B71D",
  },
];

const SLIDE_DURATION = 5000;

// ─── Animation Variants ──────────────────────────────────────────────────────
const containerVariants: Variants = {
  hidden: { opacity: 0, x: 40 },
  show: {
    opacity: 1,
    x: 0,
    transition: {
      type: "spring",
      stiffness: 280,
      damping: 28,
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  show: { 
    opacity: 1, 
    y: 0, 
    transition: { type: "spring", stiffness: 300, damping: 24 } 
  },
};

export default function BusinessLoginPage() {
  const router = useRouter();
  const params = useParams();
  const businessName = params?.businessName as string;

  // ─── Slideshow state ───────────────────────────────────────────────────────
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % SLIDES.length);
    }, SLIDE_DURATION);
    return () => clearInterval(interval);
  }, []);

  // ─── Form state ────────────────────────────────────────────────────────────
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const supabase = createClient();

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError("");
      setLoading(true);

      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setLoading(false);
        if (authError.message.toLowerCase().includes("email not confirmed")) {
          setError("Please confirm your email address before signing in.");
        } else {
          setError(authError.message);
        }
        return;
      }

      if (data?.user) {
        const userRole = await getUserData(data.user.id);

        if (userRole === "Superadmin") {
          await supabase.auth.signOut();
          setLoading(false);
          setError("Superadmin accounts must use the admin portal.");
          return;
        }

        if (userRole === null) {
          setLoading(false);
          router.push(`/${businessName}/customer/complete-profile`);
          return;
        }

        const { data: userData } = await supabase
          .from("users")
          .select("is_active")
          .eq("user_id", data.user.id)
          .single();

        if (!userData?.is_active) {
          await supabase.auth.signOut();
          setLoading(false);
          router.push("/auth/account/waiting-approved");
          return;
        }

        const tenantData = await getBusinessNameByUserId(data.user.id);
        const shopName = tenantData?.business_name;
        const businessType = tenantData?.business_type;

        const normalizedShop = shopName?.toLowerCase().replace(/\s+/g, "-").trim();
        const normalizedParam = businessName?.toLowerCase().trim();

        if (!shopName || normalizedShop !== normalizedParam) {
          await supabase.auth.signOut();
          setLoading(false);
          setError(`Access denied. Shop: "${shopName}", URL: "${businessName}"`);
          return;
        }
        setLoading(false);

        switch (userRole) {
          case "Administrator":
            router.push(`/${businessName}/administrator/dashboard`);
            break;
          case "Manager":
            router.push(`/${businessName}/employee/dashboard`);
            break;
          case "Employee":
            router.push(`/${businessName}/employee/dashboard`);
            break;
          case "Customer": {
            const typeSlug =
              businessType === "Food & Beverage"
                ? "food-and-beverage"
                : "non-food-and-beverage";
            router.push(`/${businessName}/customer/${typeSlug}/storefront`);
            break;
          }
          default:
            setError("Unrecognized role. Please contact support.");
        }

        router.refresh();
      }
    },
    [email, password, businessName, router, supabase]
  );

  const slide = SLIDES[currentSlide];

  return (
    <div className="relative w-full min-h-screen overflow-hidden flex items-center justify-center md:justify-end md:pr-[5%] lg:pr-[8%]">
      {/* ── Animated Slideshow Background ── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={slide.id}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 1.4, ease: "easeInOut" }}
          className="absolute inset-0 z-0"
          style={{
            background: slide.gradient,
            backgroundSize: "cover",
          }}
        >
          {/* Texture overlay */}
          <div
            className="absolute inset-0"
            style={{ backgroundImage: slide.pattern, backgroundRepeat: "repeat" }}
          />
          {/* Noise grain */}
          <div
            className="absolute inset-0 opacity-20 mix-blend-overlay"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.4'/%3E%3C/svg%3E")`,
            }}
          />
          {/* Vignette effect for depth */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/10" />
        </motion.div>
      </AnimatePresence>

      {/* ── Slide headline (left side) ── */}
      <div className="absolute left-8 md:left-[8%] lg:left-[10%] bottom-[20%] z-10 hidden md:block max-w-[50%]">
        <AnimatePresence mode="wait">
          <motion.div
            key={`headline-${slide.id}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <h2 className="font-['Fredoka'] font-bold leading-[1.1] text-white tracking-wide drop-shadow-lg"
                style={{ fontSize: "clamp(2.5rem, 5vw, 4.5rem)" }}>
              {slide.headline}
            </h2>
            <h2 className="font-['Fredoka'] font-bold leading-[1.1] drop-shadow-lg"
                style={{ fontSize: "clamp(2.5rem, 5vw, 4.5rem)", color: slide.accent }}>
              {slide.subline}
            </h2>
          </motion.div>
        </AnimatePresence>
        
        {/* Slide dots */}
        <div className="flex gap-3 mt-8">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentSlide(i)}
              className="transition-all duration-500 rounded-full"
              style={{
                width: i === currentSlide ? "32px" : "10px",
                height: "10px",
                background: i === currentSlide ? slide.accent : "rgba(255,255,255,0.4)",
                boxShadow: i === currentSlide ? `0 0 10px ${slide.accent}80` : "none",
              }}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      </div>

      {/* ── Floating Login Panel ── */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="relative z-20 w-full max-w-[440px] min-h-screen md:min-h-0 bg-white/95 backdrop-blur-xl md:rounded-[32px] flex flex-col justify-center shadow-[0_20px_50px_rgba(0,0,0,0.2)] md:border border-white/40 overflow-hidden"
      >
        {/* Subtle top inner glow */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#F7B71D]/80 to-transparent opacity-80" />

        <div className="px-8 py-12 md:px-10">
          {/* Header */}
          <motion.div variants={itemVariants} className="mb-8">
            <div className="inline-flex items-center gap-2.5 bg-[#385E31]/10 border border-[#385E31]/10 rounded-full px-4 py-1.5 mb-6">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#F7B71D] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#F7B71D]"></span>
              </span>
              <span className="font-['Fredoka'] text-[12px] text-[#385E31] font-bold tracking-widest uppercase">
                {businessName?.replace(/-/g, " ") ?? "Store"}
              </span>
            </div>
            <h1 className="font-['Fredoka'] font-bold text-4xl leading-tight text-gray-900 mb-2">
              Welcome Back
            </h1>
            <p className="font-['Fredoka'] text-[15px] text-gray-500 font-medium">
              Sign in to access your workspace.
            </p>
          </motion.div>

          {/* Error Message */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                animate={{ opacity: 1, height: "auto", marginBottom: 20 }}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                className="overflow-hidden"
              >
                <div className="font-['Fredoka'] text-[14px] font-medium text-red-600 bg-red-50 border border-red-100 px-4 py-3 rounded-2xl flex items-start gap-2">
                  <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{error}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {/* Email */}
            <motion.div variants={itemVariants} className="flex flex-col gap-1.5">
              <label className="font-['Fredoka'] text-[14px] text-gray-700 pl-1 font-semibold">
                Email Address
              </label>
              <input
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 font-['Fredoka'] text-[15px] px-4 py-3.5 rounded-2xl outline-none focus:bg-white focus:border-[#385E31] focus:ring-4 focus:ring-[#385E31]/10 transition-all duration-200"
              />
            </motion.div>

            {/* Password */}
            <motion.div variants={itemVariants} className="flex flex-col gap-1.5">
              <div className="flex justify-between items-end pr-1">
                <label className="font-['Fredoka'] text-[14px] text-gray-700 pl-1 font-semibold">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => router.push("/auth/forgot-password")}
                  className="font-['Fredoka'] text-[13px] text-[#385E31] hover:text-[#2A4725] font-medium transition-colors"
                >
                  Forgot?
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 font-['Fredoka'] text-[15px] px-4 py-3.5 pr-12 rounded-2xl outline-none focus:bg-white focus:border-[#385E31] focus:ring-4 focus:ring-[#385E31]/10 transition-all duration-200"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none"
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                </button>
              </div>
            </motion.div>

            {/* Submit Button */}
            <motion.div variants={itemVariants} className="pt-2">
              <motion.button
                type="submit"
                disabled={loading}
                whileHover={{ scale: loading ? 1 : 1.015 }}
                whileTap={{ scale: loading ? 1 : 0.98 }}
                className="relative w-full bg-[#385E31] text-[#FFFCEB] font-['Fredoka'] font-bold tracking-wide text-[17px] py-4 rounded-2xl hover:bg-[#2A4725] shadow-[0_8px_20px_rgba(56,94,49,0.3)] disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-300 overflow-hidden"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Signing in...
                  </span>
                ) : (
                  "Sign In"
                )}
                {/* Subtle highlight effect on button */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent pointer-events-none" />
              </motion.button>
            </motion.div>
          </form>

          {/* Register link */}
          <motion.p variants={itemVariants} className="font-['Fredoka'] text-[14px] text-gray-500 text-center mt-8">
            New customer?{" "}
            <button
              type="button"
              onClick={() => router.push(`/${businessName}/customer/registration`)}
              className="text-[#385E31] font-bold hover:text-[#F7B71D] transition-colors"
            >
              Register here
            </button>
          </motion.p>
        </div>
      </motion.div>
    </div>
  );
}