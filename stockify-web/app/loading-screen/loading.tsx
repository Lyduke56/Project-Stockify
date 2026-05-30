"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { fetchStorefrontConfig } from "@/lib/admin/storefront-actions";

interface LoadingScreenProps {
  fullScreen?: boolean;
  bgColor?: string;
}

export default function LoadingScreen({ 
  fullScreen = true,
  bgColor: propBgColor 
}: LoadingScreenProps) {
  const pathname = usePathname();
  const [bgColor, setBgColor] = useState(propBgColor || "#FFFCF0");
  const [accentColor, setAccentColor] = useState("#385E31");

  useEffect(() => {
    if (propBgColor) {
      setBgColor(propBgColor);
      return;
    }

    const loadColor = async () => {
      if (!pathname) return;
      const parts = pathname.split("/").filter(Boolean);
      if (parts.length === 0) return;
      const businessName = parts[0];

      // Ignore non-business paths
      const ignored = ["superadmin", "auth", "api", "loading-screen"];
      if (ignored.includes(businessName.toLowerCase())) return;

      try {
        const supabase = createClient();
        const { data: allTenants } = await supabase
          .from("tenants")
          .select("tenant_id, business_name");
        
        const tenant = allTenants?.find((t: any) => 
          t.business_name.toLowerCase().replace(/[\s-]/g, "") === businessName.toLowerCase().replace(/[\s-]/g, "")
        );

        if (tenant?.tenant_id) {
          const cfg = await fetchStorefrontConfig(tenant.tenant_id);
          if (cfg?.color_background) {
            setBgColor(cfg.color_background);
          }
          if (cfg?.color_primary) {
            setAccentColor(cfg.color_primary);
          }
        }
      } catch (err) {
        console.error("Failed to load storefront config in LoadingScreen:", err);
      }
    };

    loadColor();
  }, [pathname, propBgColor]);

  return (
    <div 
      className={`flex flex-col items-center justify-center gap-4 ${fullScreen ? "min-h-screen" : "h-[calc(100vh-160px)]"}`}
      style={{ backgroundColor: bgColor }}
    >
      <img src="/loading1.gif" alt="Loading..." className="w-70 h-70 object-contain" />
      <p 
        className="text-sm font-semibold tracking-widest uppercase animate-pulse -translate-y-13"
        style={{ color: accentColor }}
      >
        Loading
      </p>
    </div>
  );
}