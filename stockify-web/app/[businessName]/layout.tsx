"use client";

import { useEffect, useState } from "react";
import { useParams, usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";

export default function TenantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const businessName = params?.businessName as string;
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSuspension = async () => {
      if (!businessName) {
        setLoading(false);
        return;
      }
      
      // Avoid infinite loop if already on the suspended page
      if (pathname === `/${businessName}/suspended`) {
        setLoading(false);
        return;
      }

      // Skip check for stockify-client-side
      if (pathname?.startsWith(`/${businessName}/stockify-client-side`)) {
        setLoading(false);
        return;
      }

      const supabase = createClient();
      
      // Fetch tenant by slug (approximate by replacing hyphens with spaces)
      const { data: tenant } = await supabase
        .from("tenants")
        .select("subscription_status")
        .ilike("business_name", businessName.replace(/-/g, " "))
        .single();

      if (tenant?.subscription_status === "Suspended") {
        router.push(`/${businessName}/suspended`);
      } else {
        setLoading(false);
      }
    };

    checkSuspension();
  }, [businessName, pathname, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#FFFCEB] text-[#385E31]">
        <Loader2 size={40} className="animate-spin mb-4 opacity-70" />
        <p className="font-['Fredoka'] font-bold text-lg opacity-70">Verifying store status...</p>
      </div>
    );
  }

  return <>{children}</>;
}
