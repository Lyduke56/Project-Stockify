"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { motion } from "framer-motion";
import type { User, AuthChangeEvent, Session } from "@supabase/supabase-js";
import { fetchStorefrontConfig } from "@/lib/admin/storefront-actions";
import SlideshowBackground from "@/components/sections/customer/slideshow-background";
import CompleteProfileForm from "@/components/sections/customer/complete-profile-form";

type PageState = "loading" | "ready" | "already_complete";

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

export default function CompleteProfilePage() {
  const router = useRouter();
  const params = useParams();
  const businessName = params?.businessName as string;

  const [pageState, setPageState] = useState<PageState>("loading");
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [sfConfig, setSfConfig] = useState<any>(null);

  const supabase = createClient();

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

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event: AuthChangeEvent, session: Session | null) => {
        if (!session?.user) {
          router.replace(`/${businessName}/customer/registration`);
          return;
        }

        const user = session.user;
        setAuthUser(user);

        // Find tenant ID for current businessName
        const { data: allTenants } = await supabase
          .from("tenants")
          .select("tenant_id, business_name, business_type");

        const currentTenant = allTenants?.find((t: any) => 
          t.business_name.toLowerCase().replace(/[\s-]/g, "") === businessName.toLowerCase().replace(/[\s-]/g, "")
        );

        if (!currentTenant) {
          router.replace(`/${businessName}/customer/registration`);
          return;
        }

        const typeSlug =
          currentTenant.business_type === "Food & Beverage"
            ? "food-and-beverage"
            : "non-food-and-beverage";

        // Check if this auth user already has a row in public.users for THIS tenant
        const { data: existingCurrent } = await supabase
          .from("users")
          .select("user_id, role, tenant_id")
          .eq("user_id", user.id)
          .eq("tenant_id", currentTenant.tenant_id)
          .maybeSingle();

        if (existingCurrent) {
          setPageState("already_complete");
          const role: string = existingCurrent.role ?? "Customer";
          const dashboardMap: Record<string, string> = {
            Administrator: `/${businessName}/administrator/dashboard`,
            Manager: `/${businessName}/manager/dashboard`,
            Employee: `/${businessName}/employee/dashboard`,
            Customer: `/${businessName}/customer/${typeSlug}/storefront`,
          };
          router.replace(dashboardMap[role] ?? `/${businessName}/customer/${typeSlug}/storefront`);
          return;
        }

        // The user doesn't have a profile for THIS tenant yet.
        // Let's check if they have a profile for ANY other tenant.
        const { data: existingAny } = await supabase
          .from("users")
          .select("*")
          .eq("user_id", user.id)
          .limit(1)
          .maybeSingle();

        if (existingAny) {
          setPageState("already_complete");
          // Copy profile details and insert for the current tenant
          const { error: copyError } = await supabase.from("users").insert({
            user_id: user.id,
            tenant_id: currentTenant.tenant_id,
            email: user.email,
            role: "Customer", // Default role is Customer upon registration
            first_name: existingAny.first_name,
            last_name: existingAny.last_name,
            middle_name: existingAny.middle_name,
            suffix: existingAny.suffix,
            display_name: existingAny.display_name,
            contact_number: existingAny.contact_number,
            address: existingAny.address,
            gender: existingAny.gender,
            citizenship: existingAny.citizenship,
            profile_picture_url: existingAny.profile_picture_url,
            is_active: true,
          });

          if (!copyError || copyError.code === "23505") {
            router.replace(`/${businessName}/customer/${typeSlug}/storefront`);
            return;
          } else {
            console.error("Error auto-copying user profile:", copyError);
            // Fallback to manually showing the form if copy failed
          }
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
      <div
        className="relative w-full min-h-screen overflow-hidden flex items-center justify-center md:justify-end md:pr-[5%] lg:pr-[8%]"
        style={{
          backgroundColor: sfConfig?.color_secondary ?? "#2A4725",
          "--color-primary": sfConfig?.color_primary ?? "#385E31",
          "--color-secondary": sfConfig?.color_secondary ?? "#2A4725",
          "--color-accent": sfConfig?.color_accent ?? "#E5AC24",
        } as React.CSSProperties}
      >
        <SlideshowBackground slides={CUSTOM_SLIDES} />
        <div
          className="relative z-20 w-full max-w-[440px] min-h-screen md:min-h-0 bg-white/95 backdrop-blur-xl md:rounded-[32px] flex flex-col items-center justify-center gap-4 py-12 px-8 shadow-[0_20px_50px_rgba(0,0,0,0.2)] md:border border-white/40 overflow-hidden"
          style={{
            boxShadow: `0 20px 50px rgba(0,0,0,0.2), 0 0 0 3px ${(sfConfig?.color_accent ?? '#F7B71D')}2a`
          }}
        >
          <svg className="animate-spin h-10 w-10" style={{ color: sfConfig?.color_primary ?? '#385E31' }} fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="font-['Fredoka'] text-[15px] text-gray-500 font-medium">
            {pageState === "already_complete" ? "Redirecting..." : "Verifying your session..."}
          </p>
        </div>
      </div>
    );
  }

  // ── Profile completion form ─────────────────────────────────────────────────
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
      <SlideshowBackground slides={CUSTOM_SLIDES} />

      <motion.div
        initial={{ opacity: 0, x: 60 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ type: "spring", stiffness: 280, damping: 28, delay: 0.1 }}
        className="relative z-20 w-full max-w-[480px] min-h-screen md:min-h-0 bg-white/95 backdrop-blur-xl md:rounded-[32px] flex flex-col justify-center shadow-[0_20px_50px_rgba(0,0,0,0.2)] md:border border-white/40 overflow-hidden"
      >
        <div className="absolute top-0 left-0 right-0 h-[6px]" style={{ backgroundColor: sfConfig?.color_accent ?? '#F7B71D' }} />

        {/* Scrollable content — form can be tall */}
        <div className="px-8 py-10 md:px-10 overflow-y-auto max-h-screen">
          {/* Header */}
          <div className="mb-6">
            <div
              className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-4 border"
              style={{
                backgroundColor: `${sfConfig?.color_primary ?? '#385E31'}1a`,
                borderColor: `${sfConfig?.color_primary ?? '#385E31'}1a`,
              }}
            >
              <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: sfConfig?.color_accent ?? '#F7B71D' }} />
              <span className="font-['Fredoka'] text-[12px] font-semibold tracking-widest uppercase" style={{ color: sfConfig?.color_primary ?? '#385E31' }}>
                {businessName?.replace(/-/g, " ") ?? "Store"}
              </span>
            </div>
            <h1 className="font-['Fredoka'] font-bold text-[36px] leading-tight" style={{ color: sfConfig?.color_primary ?? '#385E31' }}>
              Almost There! 🎉
            </h1>
            <p className="font-['Fredoka'] text-[13px] text-gray-500 mt-1 font-medium">
              Complete your profile to finish registration.
            </p>
          </div>

          {/* Progress indicator */}
          <div className="flex items-center gap-3 mb-7">
            {/* Step 1 — done */}
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: sfConfig?.color_primary ?? '#385E31' }}>
                <svg className="w-3.5 h-3.5" style={{ color: sfConfig?.color_sidebar_text ?? '#FFFCEB' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="font-['Fredoka'] text-[12px] font-semibold" style={{ color: sfConfig?.color_primary ?? '#385E31' }}>Account</span>
            </div>
            <div className="h-px flex-1" style={{ background: `linear-gradient(to right, ${sfConfig?.color_primary ?? '#385E31'}, ${sfConfig?.color_accent ?? '#F7B71D'})` }} />
            {/* Step 2 — active */}
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: sfConfig?.color_accent ?? '#F7B71D' }}>
                <span className="font-['Fredoka'] font-bold text-[12px]" style={{ color: sfConfig?.color_primary ?? '#385E31' }}>2</span>
              </div>
              <span className="font-['Fredoka'] text-[12px] font-semibold" style={{ color: sfConfig?.color_primary ?? '#385E31' }}>Profile</span>
            </div>
          </div>

          {authUser && (
            <CompleteProfileForm user={authUser} businessName={businessName} sfConfig={sfConfig} />
          )}
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-1.5" style={{ background: `linear-gradient(to right, ${sfConfig?.color_primary ?? '#385E31'}, ${sfConfig?.color_accent ?? '#F7B71D'}, ${sfConfig?.color_primary ?? '#385E31'})` }} />
      </motion.div>
    </div>
  );
}