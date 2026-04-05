import React from "react";

export interface StatCardProps {
  title: string;
  value: string | number;
  trendText?: string;
  svgName?: string;
  icon?: React.ReactNode;
  className?: string;
}

export default function StatCard({
  title,
  value,
  trendText,
  svgName,
  icon,
  className = "",
}: StatCardProps) {
  return (
    <div
      className={`w-80 p-5 bg-[#385E31] rounded-[10px] flex flex-col gap-3 shadow-md ${className}`}
    >
      {/* Title */}
      <div className="text-[#FFFCEB] text-[22px] font-bold font-['Inter']">
        {title}
      </div>

      {/* Inner Content Box */}
      <div className="w-full pt-5 pb-4 bg-[#FFFCEB] rounded-[5px] flex flex-col items-center justify-center">
        
        {/* Icon & Value Row */}
        <div className="flex items-center justify-center gap-3">
          <div className="w-18 h-18 text-[#385E31] shrink-0 flex items-center justify-center">
            {icon ? (
              icon
            ) : svgName ? (
              <img 
                src={`/${svgName}.svg`} 
                alt={title} 
                className="w-full h-full object-contain"
              />
            ) : (
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-full h-full"
              >
                <circle cx="12" cy="6" r="2.5" />
                <circle cx="6" cy="18" r="2.5" />
                <circle cx="12" cy="18" r="2.5" />
                <circle cx="18" cy="18" r="2.5" />
                <path d="M10.5 8L7.5 15.5" />
                <path d="M12 8.5v7" />
                <path d="M13.5 8l3 7.5" />
              </svg>
            )}
          </div>

          <div className="text-[#385E31] text-[4.2rem] leading-none font-black font-['Inter'] tracking-tight">
            {value}
          </div>
        </div>

        {/* Trend Text */}
        {trendText && (
          <div className="mt-2 text-[#385E31] text-[13px] font-medium font-['Inter']">
            {trendText}
          </div>
        )}
      </div>
    </div>
  );
}