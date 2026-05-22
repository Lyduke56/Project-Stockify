"use client";
import { useEffect, useState } from "react";
import { useParams, usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import LoadingScreen from "../loading-screen/loading";

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
      
      if (pathname === `/${businessName}/suspended`) {
        setLoading(false);
        return;
      }

      if (pathname?.startsWith(`/${businessName}/stockify-client-side`)) {
        setLoading(false);
        return;
      }

      const supabase = createClient();
      
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

  if (loading) return <LoadingScreen />;

  return <>{children}</>;
}