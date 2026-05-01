"use client";

import { useRouter, useParams } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { getUserData } from "@/backend/hooks/getUserRole";
import { getBusinessNameByUserId } from "@/backend/hooks/getTenantBName";
import { motion, AnimatePresence } from "framer-motion";

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

        // Block Superadmin from this page
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

        // Check if active
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

        // Verify user belongs to this tenant
            // AFTER
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
    <div className="relative w-full min-h-screen overflow-hidden flex items-center justify-end pr-0 md:pr-16">
      {/* ── Animated Slideshow Background ── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={slide.id}
          initial={{ opacity: 0, scale: 1.04 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.97 }}
          transition={{ duration: 1.2, ease: "easeInOut" }}
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
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.4'/%3E%3C/svg%3E")`,
            }}
          />
        </motion.div>
      </AnimatePresence>

      {/* ── Slide headline (left side) ── */}
      <div className="absolute left-8 md:left-16 bottom-1/3 z-10 hidden md:block">
        <AnimatePresence mode="wait">
          <motion.div
            key={`headline-${slide.id}`}
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <p
              className="font-['Fredoka'] font-bold leading-tight text-white/90"
              style={{ fontSize: "clamp(2rem, 4vw, 3.5rem)" }}
            >
              {slide.headline}
            </p>
            <p
              className="font-['Fredoka'] font-bold leading-tight"
              style={{
                fontSize: "clamp(2rem, 4vw, 3.5rem)",
                color: slide.accent,
              }}
            >
              {slide.subline}
            </p>
          </motion.div>
        </AnimatePresence>
        {/* Slide dots */}
        <div className="flex gap-2 mt-6">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentSlide(i)}
              className="transition-all duration-500 rounded-full"
              style={{
                width: i === currentSlide ? "28px" : "8px",
                height: "8px",
                background: i === currentSlide ? slide.accent : "rgba(255,255,255,0.35)",
              }}
            />
          ))}
        </div>
      </div>

      {/* ── Floating Login Panel ── */}
      <motion.div
        initial={{ opacity: 0, x: 60 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ type: "spring", stiffness: 280, damping: 28, delay: 0.2 }}
        className="relative z-20 w-full md:w-[420px] min-h-screen md:min-h-0 md:rounded-[28px] flex flex-col justify-center bg-[#FFFCEB] md:shadow-2xl overflow-hidden md:mr-0"
        style={{ boxShadow: "0 32px 80px rgba(0,0,0,0.35), 0 0 0 3px #F7B71D" }}
      >
        {/* Gold top bar */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#F7B71D]" />

        <div className="px-10 py-12">
          {/* Logo / Business Name */}
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 bg-[#385E31] rounded-full px-4 py-1.5 mb-5">
              <span className="w-2 h-2 rounded-full bg-[#F7B71D] animate-pulse" />
              <span className="font-['Fredoka'] text-[13px] text-[#F7B71D] font-semibold tracking-widest uppercase">
                {businessName?.replace(/-/g, " ") ?? "Store"}
              </span>
            </div>
            <h1 className="font-['Fredoka'] font-bold text-[40px] leading-tight text-[#385E31]">
              Welcome Back!
            </h1>
            <p className="font-['Fredoka'] text-[14px] text-[#8C9B85] mt-1">
              Sign in to access your workspace.
            </p>
          </div>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="font-['Fredoka'] text-[13px] text-red-600 bg-red-50 border border-red-200 px-4 py-2.5 rounded-2xl mb-5 text-center"
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Email */}
            <div className="flex flex-col gap-1">
              <label className="font-['Fredoka'] text-[13px] text-[#6B7C65] pl-3 font-semibold">
                Email
              </label>
              <input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-[#FFD980]/60 placeholder-[#A88D40] text-[#3A3A3A] font-['Fredoka'] text-[15px] px-5 py-3.5 rounded-2xl outline-none focus:ring-2 focus:ring-[#385E31] focus:bg-[#FFD980]/80 transition-all shadow-sm border border-[#F7B71D]/30"
              />
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1">
              <label className="font-['Fredoka'] text-[13px] text-[#6B7C65] pl-3 font-semibold">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full bg-[#FFD980]/60 placeholder-[#A88D40] text-[#3A3A3A] font-['Fredoka'] text-[15px] px-5 py-3.5 pr-12 rounded-2xl outline-none focus:ring-2 focus:ring-[#385E31] focus:bg-[#FFD980]/80 transition-all shadow-sm border border-[#F7B71D]/30"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8B6B2B] hover:text-[#385E31] transition-colors focus:outline-none"
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
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => router.push("/auth/forgot-password")}
                  className="font-['Fredoka'] text-[12px] text-[#A3A3A3] hover:text-[#385E31] transition-colors pr-1 mt-0.5"
                >
                  Forgot Password?
                </button>
              </div>
            </div>

            {/* Submit */}
            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: loading ? 1 : 1.02 }}
              whileTap={{ scale: loading ? 1 : 0.97 }}
              className="mt-4 w-full bg-[#385E31] text-[#F7B71D] font-['Fredoka'] font-bold tracking-wide text-[19px] py-3.5 rounded-2xl hover:bg-[#2A4725] shadow-md disabled:opacity-60 disabled:cursor-not-allowed transition-colors duration-200"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  SIGNING IN...
                </span>
              ) : (
                "SIGN IN"
              )}
            </motion.button>
          </form>

          {/* Register link for customers */}
          <p className="font-['Fredoka'] text-[13px] text-[#8C9B85] text-center mt-6">
            New customer?{" "}
            <button
              type="button"
              onClick={() => router.push(`/${businessName}/customer/registration`)}
              className="text-[#385E31] font-semibold hover:underline"
            >
              Register here
            </button>
          </p>
        </div>

        {/* Bottom accent */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-[#385E31] via-[#F7B71D] to-[#385E31]" />
      </motion.div>
    </div>
  );
}