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
    <div className="flex flex-col items-center w-[200px] p-3 text-center">
      <div className="w-full h-40 bg-[#F5F0DC] rounded-[10px] border-[2px] border-lime-900 flex items-center justify-center p-4 shadow-[3px_5px_18px_0px_rgba(0,0,0,0.25)]">
        <img src={image_path} alt={title} className="w-24 h-24 object-contain" />
      </div>
      <h3 className="text-lime-900 text-base font-semibold font-['Fredoka'] mt-3 leading-tight">
        {title}
      </h3>
      <p className="text-lime-900 text-xs font-normal font-['Fredoka'] mt-2">
        {description}
      </p>
    </div>
  );
}