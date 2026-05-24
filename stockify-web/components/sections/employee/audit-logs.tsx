"use client";

import { useState } from "react";
import AuditLogs from "@/components/tables/audit-logs-table";
import LoadingScreen from "@/app/loading-screen/loading";

export default function EmployeeAuditLogs() {
  const [isLoading, setIsLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(false);

  const handleLoadComplete = () => {
    setIsLoading(false);
    // Small delay so the DOM renders before the transition kicks in
    setTimeout(() => setIsVisible(true), 50);
  };

  return (
    <>
      {isLoading && <LoadingScreen fullScreen={false} />}

      <div
        className={`flex min-h-screen w-full bg-[#FFFCEB] font-['Inter'] transition-all duration-700 ease-out ${
          isLoading
            ? "hidden"
            : isVisible
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-4"
        }`}
      >
        <div className="flex-1 flex flex-col w-full font-['Inter']">
          <div className="w-full flex flex-col items-center mt-2 mb-10">
            <h1 className="text-primary text-[30px] font-extrabold tracking-wide uppercase">
              Audit Logs
            </h1>
            <div className="w-[900px] max-w-full h-1.5 bg-accent mt-1 rounded-full" />
          </div>

          <AuditLogs onLoadComplete={handleLoadComplete} />
        </div>
      </div>
    </>
  );
}