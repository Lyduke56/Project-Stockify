"use client";

import { useState, useEffect } from "react";
import { getCurrentUserContext, type BusinessType } from "@/lib/employee/inventory";
import FnbIngredientsTable from "@/components/tables/employee/fnb-table-modal";
import NfbIngredientsTable from "@/components/tables/employee/nfnb-table-modal";
import { Loader2, AlertCircle } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────

type UserContext = {
  userId:       string;
  tenantId:     string;
  businessType: BusinessType;
};

// ── Component ─────────────────────────────────────────────────

export default function IngredientsSection() {
  const [ctx, setCtx] = useState<UserContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadContext() {
      try {
        const data = await getCurrentUserContext();
        if (!data) {
          throw new Error("No active session found. Please log in.");
        }
        
        console.log("Tenant Context Loaded:", data);
        setCtx(data);
      } catch (e: any) {
        console.error("Context Error:", e);
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }

    loadContext();
  }, []);

  /**
   * ✅ FIXED LOGIC: 
   * Now checks for both "food & beverage" and "food and beverage" 
   * to match your Supabase DB value exactly.
   */
  const businessTypeClean = ctx?.businessType?.toLowerCase().trim() || "";
  const isFnb = businessTypeClean === "food & beverage" || businessTypeClean === "food and beverage";

  return (
    <div className="w-full flex flex-col font-['Inter']">

      {/* Header */}
      <div className="w-full flex flex-col items-center mt-2 mb-10">
        <h1 className="text-[#385E31] text-[30px] font-extrabold tracking-wide uppercase">
          Stock Inventory
        </h1>
        <div className="w-[900px] max-w-full h-1.5 bg-[#F7B71D] mt-1 rounded-full" />

        {/* Status Badge */}
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

      {/* 1. Loading State */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-24 gap-3 text-[#385E31]/60">
          <Loader2 size={32} className="animate-spin" />
          <span className="text-sm font-semibold italic">Verifying tenant access...</span>
        </div>
      )}

      {/* 2. Error State */}
      {error && (
        <div className="mx-auto max-w-lg px-6 py-8 bg-red-50 border border-red-100 rounded-2xl flex flex-col items-center gap-3">
          <AlertCircle className="text-red-500" size={32} />
          <p className="text-red-600 font-bold text-center">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="text-xs underline text-red-400 hover:text-red-600"
          >
            Try Refreshing
          </button>
        </div>
      )}

      {/* 3. Success State & Table Rendering */}
      {!loading && !error && ctx && (
        <div className="w-full animate-in fade-in duration-500">
          {isFnb ? (
            <FnbIngredientsTable tenantId={ctx.tenantId} />
          ) : (
            /* Non-F&B View */
            <div className="flex flex-col items-center justify-center py-24 text-[#385E31]/40 gap-3">
              <div className="p-4 bg-gray-50 rounded-full">
                <AlertCircle size={40} />
              </div>
              <p className="text-sm font-semibold max-w-md text-center">
                This section is reserved for F&B inventory. 
                NF&B stock is managed directly through your Products dashboard.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}