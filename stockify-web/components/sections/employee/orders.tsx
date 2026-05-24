"use client";

import { useState } from "react";
import OrdersTable from "@/components/tables/order-table";
import LoadingScreen from "@/app/loading-screen/loading";
import { type StorefrontConfig } from "@/lib/admin/storefront-actions";

export default function OrdersSection({ colors }: { colors?: StorefrontConfig }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(false);

  const handleLoadComplete = () => {
    setIsLoading(false);
    setTimeout(() => setIsVisible(true), 50);
  };

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
            Orders
          </h1>
          <div className="w-[900px] max-w-full h-1.5 bg-accent mt-1 rounded-full" />
        </div>

        <OrdersTable onLoadComplete={handleLoadComplete} colors={colors} />
      </div>
    </>
  );
}