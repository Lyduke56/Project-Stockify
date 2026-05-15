"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { motion } from "framer-motion";
import type { User, AuthChangeEvent, Session } from "@supabase/supabase-js";
import SlideshowBackground from "@/components/sections/customer/slideshow-background";
import CompleteProfileForm from "@/components/sections/customer/complete-profile-form";

type PageState = "loading" | "ready" | "already_complete";

export default function CompleteProfilePage() {
  const router = useRouter();
  const params = useParams();
  const businessName = params?.businessName as string;

  const [pageState, setPageState] = useState<PageState>("loading");
  const [authUser, setAuthUser] = useState<User | null>(null);

  const supabase = createClient();

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event: AuthChangeEvent, session: Session | null) => {
        if (!session?.user) {
          router.replace(`/${businessName}/customer/registration`);
          return;
        }

        const user = session.user;
        setAuthUser(user);

        // Check if this auth user already has a row in public.users
        const { data: existing } = await supabase
          .from("users")
          .select("user_id, role, tenant_id")
          .eq("user_id", user.id)
          .maybeSingle();

        if (existing) {
          setPageState("already_complete");

          // Fetch business_type for the correct storefront slug
          const { data: tenantInfo } = await supabase
            .from("tenants")
            .select("business_type")
            .eq("tenant_id", (existing as any).tenant_id ?? "")
            .maybeSingle();

          const typeSlug =
            tenantInfo?.business_type === "Food & Beverage"
              ? "food-and-beverage"
              : "non-food-and-beverage";

          const role: string = existing.role ?? "Customer";
          const dashboardMap: Record<string, string> = {
            Administrator: `/${businessName}/administrator/dashboard`,
            Manager: `/${businessName}/manager/dashboard`,
            Employee: `/${businessName}/employee/dashboard`,
            Customer: `/${businessName}/customer/${typeSlug}/storefront`,
          };
          router.replace(dashboardMap[role] ?? `/${businessName}/customer/${typeSlug}/storefront`);
          return;
        }

        // No profile yet — show the form
        setPageState("ready");
      }
    );

    return () => listener.subscription.unsubscribe();
  }, [businessName, router, supabase]);

  // ── Loading skeleton ────────────────────────────────────────────────────────
  if (pageState === "loading" || pageState === "already_complete") {
    return (
      <div className="relative w-full min-h-screen overflow-hidden flex items-center justify-end pr-0 md:pr-16">
        <SlideshowBackground />
        <div
          className="relative z-20 w-full md:w-[440px] min-h-screen md:min-h-0 md:rounded-[28px] flex flex-col items-center justify-center bg-[#FFFCEB] md:mr-0 gap-4"
          style={{ boxShadow: "0 32px 80px rgba(0,0,0,0.35), 0 0 0 3px #F7B71D" }}
        >
          <svg className="animate-spin h-10 w-10 text-[#385E31]" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="font-['Fredoka'] text-[15px] text-[#8C9B85]">
            {pageState === "already_complete" ? "Redirecting..." : "Verifying your session..."}
          </p>
        </div>
      </div>
    );
  }

  // ── Profile completion form ─────────────────────────────────────────────────
  return (
    <div className="relative w-full min-h-screen overflow-hidden flex items-center justify-end pr-0 md:pr-16">
      <SlideshowBackground />

      <motion.div
        initial={{ opacity: 0, x: 60 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ type: "spring", stiffness: 280, damping: 28, delay: 0.1 }}
        className="relative z-20 w-full md:w-[480px] min-h-screen md:min-h-0 md:rounded-[28px] flex flex-col justify-center bg-[#FFFCEB] md:shadow-2xl overflow-hidden md:mr-0"
        style={{ boxShadow: "0 32px 80px rgba(0,0,0,0.35), 0 0 0 3px #F7B71D" }}
      >
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#F7B71D]" />

        {/* Scrollable content — form can be tall */}
        <div className="px-10 py-10 overflow-y-auto max-h-screen">
          {/* Header */}
          <div className="mb-6">
            <div className="inline-flex items-center gap-2 bg-[#385E31] rounded-full px-4 py-1.5 mb-4">
              <span className="w-2 h-2 rounded-full bg-[#F7B71D] animate-pulse" />
              <span className="font-['Fredoka'] text-[12px] text-[#F7B71D] font-semibold tracking-widest uppercase">
                {businessName?.replace(/-/g, " ") ?? "Store"}
              </span>
            </div>
            <h1 className="font-['Fredoka'] font-bold text-[36px] leading-tight text-[#385E31]">
              Almost There! 🎉
            </h1>
            <p className="font-['Fredoka'] text-[13px] text-[#8C9B85] mt-1">
              Complete your profile to finish registration.
            </p>
          </div>

          {/* Progress indicator */}
          <div className="flex items-center gap-3 mb-7">
            {/* Step 1 — done */}
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 rounded-full bg-[#385E31] flex items-center justify-center">
                <svg className="w-3.5 h-3.5 text-[#F7B71D]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="font-['Fredoka'] text-[12px] text-[#385E31] font-semibold">Account</span>
            </div>
            <div className="h-px flex-1 bg-gradient-to-r from-[#385E31] to-[#F7B71D]" />
            {/* Step 2 — active */}
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 rounded-full bg-[#F7B71D] flex items-center justify-center">
                <span className="font-['Fredoka'] font-bold text-[12px] text-[#385E31]">2</span>
              </div>
              <span className="font-['Fredoka'] text-[12px] text-[#385E31] font-semibold">Profile</span>
            </div>
          </div>

          {authUser && (
            <CompleteProfileForm user={authUser} businessName={businessName} />
          )}
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-[#385E31] via-[#F7B71D] to-[#385E31]" />
      </motion.div>
    </div>
  );
}