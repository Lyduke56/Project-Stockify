import React from "react";

export interface LandingPageInfoCardProps {
  number: string;
  title: string;
  description: string;
}

export default function LandingPageInfoCard({
  number,
  title,
  description,
}: LandingPageInfoCardProps) {
  return (
    <div className="flex flex-row items-center gap-6 w-full max-w-[1128px]">
      
      {/* The Number */}
      <div className="w-24 shrink-0 text-amber-400 text-7xl md:text-8xl font-semibold font-['Fredoka'] drop-shadow-md text-center">
        {number}
      </div>

      {/* The Green Card */}
      <div className="flex flex-col justify-center flex-1 min-h-[144px] bg-[#3B5418] rounded-[30px] outline outline-2 outline-amber-400 shadow-lg px-8 py-6">
        <h3 className="text-amber-400 text-xl md:text-2xl font-bold font-['Inter'] mb-2">
          {title}
        </h3>
        <p className="text-amber-100 text-lg md:text-xl font-medium font-['Raleway'] leading-relaxed">
          {description}
        </p>
      </div>

    </div>
  );
}