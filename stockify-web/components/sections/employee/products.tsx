"use client";

import { useState, useEffect } from "react";
import {
  getCurrentUserContext,
  type BusinessType,
} from "@/lib/employee/inventory";
import ProductsTable    from "@/components/tables/employee/product-table";
import NfbProductsTable from "@/components/tables/employee/nfnb-table-modal";
import { Loader2 } from "lucide-react";

type UserContext = {
  userId:       string;
  tenantId:     string;
  businessType: BusinessType;
};

export default function ProductsSection() {
  const [ctx,     setCtx]     = useState<UserContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    getCurrentUserContext()
      .then((data) => {
        if (!data) throw new Error("Session not found. Please log in again.");
        setCtx(data);
      })
      .catch((e: any) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const businessTypeClean = ctx?.businessType?.toLowerCase().trim() || "";
  const isFnb = businessTypeClean === "food & beverage" || businessTypeClean === "food and beverage";

  return (
    <div className="w-full flex flex-col font-['Inter']">

      {/* Header */}
      <div className="w-full flex flex-col items-center mt-2 mb-10">
        <h1 className="text-[#385E31] text-[30px] font-extrabold tracking-wide uppercase">
          Products Inventory
        </h1>
        <div className="w-[900px] max-w-full h-1.5 bg-[#F7B71D] mt-1 rounded-full" />

        {/* Business type badge */}
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

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-24 gap-3 text-[#385E31]/60">
          <Loader2 size={24} className="animate-spin" />
          <span className="text-sm font-semibold">Loading…</span>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mx-auto max-w-lg px-6 py-5 bg-red-50 border border-red-200 rounded-2xl text-center">
          <p className="text-red-600 font-semibold text-sm">{error}</p>
        </div>
      )}

      {/* ── Route by business type ── */}
      {!loading && !error && ctx && (
        isFnb
          ? <ProductsTable    tenantId={ctx.tenantId} /> // F&B: menu items + recipe builder
          : <NfbProductsTable tenantId={ctx.tenantId} /> // NF&B: physical goods + variants
      )}
    </div>
  );
}