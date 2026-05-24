import React from "react";

export interface StatCardProps {
  title: string;
  value: string | number | React.ReactNode;
  trendText?: string;
  svgName?: string;
  icon?: React.ReactNode;
  className?: string;
  iconClassName?: string; 
  hideIcon?: boolean; // 👈 Add this new prop
  primaryColor?: string; // 👈 Add primaryColor prop
  backgroundColor?: string; // 👈 Add backgroundColor prop
}

export default function StatCard({
  title,
  value,
  trendText,
  svgName,
  icon,
  className = "",
  iconClassName = "w-16 h-16", 
  hideIcon = false, // 👈 Default it to false so it doesn't break your other pages
  primaryColor,
  backgroundColor,
}: StatCardProps) {
  // Determine actual styles
  const outerBg = primaryColor ?? "#3A6131";
  const headerText = backgroundColor ?? "#FFFCEB";
  const innerBg = backgroundColor ?? "#FFFCEB";
  const innerText = primaryColor ?? "#3A6131";

  return (
    <div 
      className={`w-80 p-5 rounded-[10px] flex flex-col gap-3 shadow-md ${className}`}
      style={{ backgroundColor: outerBg }}
    >
      {/* Title */}
      <div 
        className="text-[18px] font-bold font-['Inter']"
        style={{ color: headerText }}
      >
        {title}
      </div>

      {/* Inner Content Box */}
      <div 
        className="w-full pt-4 pb-4 rounded-[5px] flex flex-col items-center justify-center"
        style={{ backgroundColor: innerBg }}
      >
        
        {/* Icon & Value Row */}
        <div className="flex items-center justify-center gap-3">
          {/* Conditionally render the icon block based on hideIcon */}
          {!hideIcon && (
            <div 
              className={`shrink-0 flex items-center justify-center ${iconClassName}`}
              style={{ color: innerText }}
            >
              {icon ? (
                icon
              ) : svgName ? (
                <div 
                  className="w-full h-full bg-current" 
                  style={{ 
                    WebkitMask: `url(/${svgName}.svg) no-repeat center`, 
                    WebkitMaskSize: 'contain',
                    mask: `url(/${svgName}.svg) no-repeat center`,
                    maskSize: 'contain'
                  }} 
                />
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
                  <circle cx="12" cy="6" r="2.5" /><circle cx="6" cy="18" r="2.5" /><circle cx="12" cy="18" r="2.5" /><circle cx="18" cy="18" r="2.5" />
                  <path d="M10.5 8L7.5 15.5" /><path d="M12 8.5v7" /><path d="M13.5 8l3 7.5" />
                </svg>
              )}
            </div>
          )}

          <div 
            className="text-[3.8rem] leading-none font-black font-['Inter'] tracking-tight"
            style={{ color: innerText }}
          >
            {value}
          </div>
        </div>

        {/* Trend Text */}
        {trendText && (
          <div 
            className="mt-1 text-[13px] font-medium font-['Inter']"
            style={{ color: innerText }}
          >
            {trendText}
          </div>
        )}
      </div>
    </div>
  );
}