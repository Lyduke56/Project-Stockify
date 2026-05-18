import React from "react";

export interface StatCardProps {
  title: string;
  value: string | number | React.ReactNode;
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
      className={`w-80 p-5 bg-primary rounded-[10px] flex flex-col gap-3 shadow-md ${className}`}
    >
      {/* Title */}
      <div 
        className="text-[18px] font-bold font-['Inter']"
        style={{ color: 'var(--color-sidebar-text, #FFF9D7)' }}
      >
        {title}
      </div>

      {/* Inner Content Box */}
      <div 
        className="w-full pt-4 pb-4 rounded-[5px] flex flex-col items-center justify-center"
        style={{ backgroundColor: 'var(--color-sidebar-text, #FFF9D7)' }}
      >
        
        {/* Icon & Value Row */}
        <div className="flex items-center justify-center gap-3">
          <div className="w-16 h-16 text-primary shrink-0 flex items-center justify-center">
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

          <div className="text-primary text-[3.8rem] leading-none font-black font-['Inter'] tracking-tight">
            {value}
          </div>
        </div>

        {/* Trend Text */}
        {trendText && (
          <div className="mt-2 text-primary text-[13px] font-medium font-['Inter']">
            {trendText}
          </div>
        )}
      </div>
    </div>
  );
}