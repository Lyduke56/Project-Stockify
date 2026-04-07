import React from "react";

export interface LandingPageObjectiveCardProps {
  image_path: string;
  title: string;
  description: string;
}

export default function LandingPageObjectiveCard({
  image_path,
  title,
  description
}: LandingPageObjectiveCardProps) {
  return (
    <div className="flex flex-col items-center w-[280px] p-3 text-center">
      
      {/* Applied #FFF9D7 for the background and #385E31 for the outline */}
      <div className="px-11 py-6 bg-[#FFF9D7] rounded-[10px] shadow-[3px_5px_18px_0px_rgba(0,0,0,0.25)] outline outline-[5px] outline-[#385E31] flex justify-center items-center">
        
        <div className="relative w-44 h-44 flex justify-center items-center">
          <img 
            src={image_path} 
            alt={title} 
            className="w-full h-full object-contain" 
          />
        </div>

      </div>
      
      {/* Applied #385E31 for the text colors */}
      <h3 className="text-[#385E31] text-[27px] text-base font-semibold font-['Fredoka'] mt-6 leading-tight">
        {title}
      </h3>
      <p className="text-[#385E31] text-[18px] font-normal font-['Fredoka'] mt-2">
        {description}
      </p>
    </div>
  );
}