"use client";

import { useState } from "react";

type AlertSeverity = "critical" | "warning" | "info";

// 1. Added 'details' to the Alert interface
interface Alert {
  id: string | number;
  label: string;
  severity: AlertSeverity;
  details: string; 
}

interface AlertsCardProps {
  alerts?: Alert[];
  className?: string;
}

// 2. Softened the colors for a less "pigmented" look
const severityStyles: Record<AlertSeverity, { bg: string; text: string; detailsBg: string }> = {
  critical: {
    bg: "bg-[#FDECEC]",
    text: "text-[#B91C1C] font-bold",
    detailsBg: "bg-[#FAD4D4]",
  },
  warning: {
    bg: "bg-[#FFF8E6]",
    text: "text-[#9A6700] font-bold",
    detailsBg: "bg-[#FFEFB8]",
  },
  info: {
    bg: "bg-[#F4F6EC]",
    text: "text-[#385E31] font-bold",
    detailsBg: "bg-[#E6EBDE]",
  },
};

const defaultAlerts: Alert[] = [
  { id: 1, label: "Out of Stock Alert", severity: "critical", details: "Vanilla Syrup (0 bottles remaining)" },
  { id: 2, label: "Low Stock Alert", severity: "warning", details: "Espresso Beans (1.5 kg remaining)" },
  { id: 3, label: "Low Stock Alert", severity: "warning", details: "Medium Paper Cups (15 units remaining)" },
  { id: 4, label: "Order Confirmation", severity: "info", details: "Order #8023 requires manual approval." },
  { id: 5, label: "Order Confirmation", severity: "info", details: "Order #8024 requires manual approval." },
  { id: 6, label: "Order Confirmation", severity: "info", details: "Order #8025 requires manual approval." },
  { id: 7, label: "Order Confirmation", severity: "info", details: "Order #8025 requires manual approval." },
  { id: 8, label: "Order Confirmation", severity: "info", details: "Order #8025 requires manual approval." },
];

export default function AlertsCard({ alerts = defaultAlerts, className = "" }: AlertsCardProps) {
  // 3. State to track which alert is currently expanded
  const [expandedId, setExpandedId] = useState<string | number | null>(null);

  const toggleExpand = (id: string | number) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <div
      // Added h-full here so it stretches to fill vertical space
     className={`bg-[#385E31] rounded-[20px] p-6 flex flex-col shadow-lg min-w-[240px] h-[480px] ${className}`}
    >
      {/* Header */}
      <h2 className="text-[#FFF9D7] text-[18px] font-extrabold font-['Inter'] mb-5 shrink-0">
        Unresolved Alerts
      </h2>

      {/* Alert rows wrapper with flex-1 to fill remaining height 
        and discrete, custom scrollbar styling
      */}
      <div className="flex-1 overflow-y-auto pr-2 flex flex-col gap-3 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-white/25 transition-colors">
        {alerts.map((alert) => {
          const style = severityStyles[alert.severity];
          const isExpanded = expandedId === alert.id;

          return (
            <div key={alert.id} className="flex flex-col shrink-0">
              {/* Main Pill Button */}
              <button
                onClick={() => toggleExpand(alert.id)}
                className={`group flex items-center justify-between px-5 py-3.5 transition-all duration-200 cursor-pointer w-full shadow-sm ${style.bg} hover:opacity-90 active:scale-[0.98] ${
                  isExpanded ? "rounded-t-xl" : "rounded-xl"
                }`}
              >
                <span className={`text-[14px] tracking-wide ${style.text}`}>{alert.label}</span>
                
                {/* SVG Chevron that rotates when clicked */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={`shrink-0 opacity-60 group-hover:opacity-100 transition-transform duration-300 ${style.text} ${
                    isExpanded ? "rotate-90" : "rotate-0"
                  }`}
                >
                  <path d="m9 18 6-6-6-6"/>
                </svg>
              </button>

              {/* Dropdown Content */}
              <div
                className={`overflow-hidden transition-all duration-300 ease-in-out ${
                  isExpanded ? "max-h-24 opacity-100" : "max-h-0 opacity-0"
                }`}
              >
                <div className={`p-4 text-[13px] font-medium text-[#2D2D2D] rounded-b-xl shadow-inner ${style.detailsBg}`}>
                  {alert.details}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}