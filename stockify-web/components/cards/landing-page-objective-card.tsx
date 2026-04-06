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
    // The main container is now a flex column, allowing content to stack naturally.
    // It has a maximum width and text is centered for the whole card.
    <div className="flex flex-col items-center max-w-[280px] p-4 text-center">
      
      {/* Icon/Image Container with border and off-white background */}
      <div className="w-full h-40 bg-orange-100 rounded-[10px] border-[5px] border-lime-900 flex items-center justify-center p-6 shadow-[3px_5px_18px_0px_rgba(0,0,0,0.25)]">
        {/* The image now uses the `image_path` prop */}
        <img src={image_path} alt={title} className="w-24 h-24" />
      </div>
      
      {/* The title now uses the `title` prop */}
      <h3 className="text-lime-900 text-2xl font-semibold font-['Fredoka'] mt-6 leading-tight">
        {title}
      </h3>
      
      {/* The description now uses the `description` prop */}
      <p className="text-lime-900 text-base font-normal font-['Fredoka'] mt-4">
        {description}
      </p>
    </div>
  );
}