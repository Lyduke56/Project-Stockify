"use client";

type AlertSeverity = "critical" | "warning" | "info";

interface Alert {
  id: string | number;
  label: string;
  severity: AlertSeverity;
}

interface AlertsCardProps {
  alerts?: Alert[];
  className?: string;
}

const severityStyles: Record<AlertSeverity, { bg: string; text: string; chevron: string }> = {
  critical: {
    bg: "bg-[#D32F2F]",
    text: "text-white font-bold",
    chevron: "text-white",
  },
  warning: {
    bg: "bg-[#F7B71D]",
    text: "text-[#2D2D2D] font-semibold",
    chevron: "text-[#2D2D2D]",
  },
  info: {
    bg: "bg-[#EDE8C8]",
    text: "text-[#385E31] font-semibold",
    chevron: "text-[#385E31]",
  },
};

const defaultAlerts: Alert[] = [
  { id: 1, label: "Out of Stock Alert", severity: "critical" },
  { id: 2, label: "Low Stock Alert", severity: "warning" },
  { id: 3, label: "Low Stock Alert", severity: "warning" },
  { id: 4, label: "Order Confirmation", severity: "info" },
  { id: 5, label: "Order Confirmation", severity: "info" },
];

export default function AlertsCard({ alerts = defaultAlerts, className = "" }: AlertsCardProps) {
  return (
    <div
      className={`bg-[#385E31] rounded-2xl p-5 flex flex-col gap-3 shadow-lg min-w-[220px] ${className}`}
    >
      {/* Header */}
      <h2 className="text-[#FFF9D7] text-center text-[15px] font-extrabold tracking-widest uppercase mb-1">
        Unresolved Alerts
      </h2> 

      {/* Alert rows */}
      <div className="flex flex-col gap-2">
        {alerts.map((alert) => {
          const style = severityStyles[alert.severity];
          return (
            <button
              key={alert.id}
              className={`flex items-center justify-between rounded-xl px-4 py-3 ${style.bg} transition-opacity hover:opacity-90 active:opacity-80 cursor-pointer w-full`}
            >
              <span className={`text-[13.5px] tracking-wide ${style.text}`}>{alert.label}</span>
              <img
                src="/employee-icons/right-arrow.svg" 
                alt="arrow"
                className="w-[18px] h-[18px] shrink-0"
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
