"use client";

import { useState, useEffect } from "react";
import {
  getCurrentUserContext,
  type BusinessType,
} from "@/lib/employee/inventory";
import ProductsTable    from "@/components/tables/employee/product-table";
import NfbProductsTable from "@/components/tables/employee/nfnb-table-modal";
import LoadingScreen    from "@/app/loading-screen/loading";
import { type StorefrontConfig } from "@/lib/admin/storefront-actions";

type UserContext = {
  userId:       string;
  tenantId:     string;
  businessType: BusinessType;
};

export default function ProductsSection({ colors }: { colors?: StorefrontConfig | null }) {
  const [ctx,          setCtx]          = useState<UserContext | null>(null);
  const [ctxLoading,   setCtxLoading]   = useState(true);
  const [tableLoading, setTableLoading] = useState(true);
  const [isVisible,    setIsVisible]    = useState(false);
  const [error,        setError]        = useState<string | null>(null);

  useEffect(() => {
    getCurrentUserContext()
      .then((data) => {
        if (!data) throw new Error("Session not found. Please log in again.");
        setCtx(data);
      })
      .catch((e: any) => setError(e.message))
      .finally(() => setCtxLoading(false));
  }, []);

  const isLoading = ctxLoading || tableLoading;

  const handleLoadComplete = () => {
    setTableLoading(false);
    setTimeout(() => setIsVisible(true), 50);
  };

  const businessTypeClean = ctx?.businessType?.toLowerCase().trim() || "";
  const isFnb = businessTypeClean === "food & beverage" || businessTypeClean === "food and beverage";

  return (
    <>
      {isLoading && !error && <LoadingScreen fullScreen={false} />}
        <div
            className={`w-full flex flex-col font-['Inter'] transition-all duration-700 ease-out ${
              isLoading || error
                ? "invisible pointer-events-none"  
                : isVisible
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-4"
            }`}
          >
        {/* Header */}
        <div className="w-full flex flex-col items-center mt-2 mb-10">
          <h1 className="text-primary text-[30px] font-extrabold tracking-wide uppercase">
            Products Inventory
          </h1>
          <div className="w-[900px] max-w-full h-1.5 bg-accent mt-1 rounded-full" />

          {ctx && (
            <div className="mt-3">
              <span className={`text-[11px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest ${
                isFnb
                  ? "bg-[#385E31]/10 text-[#385E31]"
                  : "bg-[#F7B71D]/20 text-[#7a5c00]"
              }`}>
                {ctx.businessType}
              </span>
            </div>
          )}
        </div>

        {/* Route by business type */}
        {ctx && (
          isFnb
            ? <ProductsTable    tenantId={ctx.tenantId} onLoadComplete={handleLoadComplete} colors={colors} />
            : <NfbProductsTable tenantId={ctx.tenantId} onLoadComplete={handleLoadComplete} colors={colors} />
        )}
      </div>

      {/* Error state — shown outside the hidden wrapper */}
      {error && (
        <div className="mx-auto max-w-lg px-6 py-5 bg-red-50 border border-red-200 rounded-2xl text-center">
          <p className="text-red-600 font-semibold text-sm">{error}</p>
        </div>
      )}
    </>
  );
}