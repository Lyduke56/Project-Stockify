"use client";

import { useState, useEffect } from "react";
import { getCurrentUserContext, type BusinessType } from "@/lib/employee/inventory";
import FnbIngredientsTable from "@/components/tables/employee/fnb-table-modal";
import LoadingScreen from "@/app/loading-screen/loading";
import { AlertCircle } from "lucide-react";

import { type StorefrontConfig } from "@/lib/admin/storefront-actions";

type UserContext = {
  userId:       string;
  tenantId:     string;
  businessType: BusinessType;
};

export default function IngredientsSection({ colors }: { colors?: StorefrontConfig | null }) {
  const [ctx, setCtx] = useState<UserContext | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const businessTypeClean = ctx?.businessType?.toLowerCase().trim() || "";
  const isFnb = businessTypeClean === "food & beverage" || businessTypeClean === "food and beverage";

  const handleLoadComplete = () => {
    setIsLoading(false);
    setTimeout(() => setIsVisible(true), 50);
  };

  useEffect(() => {
    async function loadContext() {
      try {
        const data = await getCurrentUserContext();
        if (!data) throw new Error("No active session found. Please log in.");
        setCtx(data);
      } catch (e: any) {
        setError(e.message);
        handleLoadComplete();
      }
    }
    loadContext();
  }, []);

  useEffect(() => {
    if (!ctx) return;
    if (!isFnb) handleLoadComplete();
  }, [ctx, isFnb]);

  return (
    <>
      {isLoading && <LoadingScreen fullScreen={false} />}

      <div
        className={`w-full flex flex-col font-['Inter'] pb-30 transition-all duration-700 ease-out ${
          isLoading
            ? "hidden"
            : isVisible
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-4"
        }`}
      >
        <div className="w-full flex flex-col items-center mt-2 mb-10">
          <h1 className="text-primary text-[30px] font-extrabold tracking-wide uppercase">
            Stock Inventory
          </h1>
          <div className="w-[900px] max-w-full h-1.5 bg-accent mt-1 rounded-full" />
          {ctx && (
            <div className="mt-3">
              <span className={`text-[11px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest ${
                isFnb ? "bg-primary/10 text-primary" : "bg-accent/20 text-primary"
              }`}>
                {ctx.businessType}
              </span>
            </div>
          )}
        </div>

        {error && (
          <div className="mx-auto max-w-lg px-6 py-8 bg-red-50 border border-red-100 rounded-2xl flex flex-col items-center gap-3">
            <AlertCircle className="text-red-500" size={32} />
            <p className="text-red-600 font-bold text-center">{error}</p>
            <button onClick={() => window.location.reload()} className="text-xs underline text-red-400 hover:text-red-600">
              Try Refreshing
            </button>
          </div>
        )}

        {!error && ctx && (
          <div className="w-full">
            {isFnb ? (
              <FnbIngredientsTable
                tenantId={ctx.tenantId}
                onLoadComplete={handleLoadComplete}
                colors={colors}
              />
            ) : (
              <div className="flex flex-col items-center justify-center py-24 text-primary/40 gap-3">
                <div className="p-4 bg-gray-50 rounded-full">
                  <AlertCircle size={40} />
                </div>
                <p className="text-sm font-semibold max-w-md text-center">
                  This section is reserved for F&B inventory. NF&B stock is managed directly through your Products dashboard.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}