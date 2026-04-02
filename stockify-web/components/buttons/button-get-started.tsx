"use client";

import React from "react";

// 1. Add 'style' to the interface here
interface StockifyButtonProps {
  label: string;
  //onClick?: () => void;
  variant?: "primary" | "secondary";
  //type?: "button" | "submit" | "reset";
  className?: string;
  //style?: React.CSSProperties; // Use React.CSSProperties for style objects
}

const StockifyButton: React.FC<StockifyButtonProps> = ({
  label,
  //onClick,
  variant = "primary",
  //type = "button",
  className = "",
  ...props // This "...props" automatically grabs style, onClick, type, etc.
  //style, // 2. Destructure 'style' here
}: StockifyButtonProps) => {
  const baseStyles = "w-56 h-14 px-11 py-3 rounded-4xl shadow-[2px_4px_4px_1px_rgba(0,0,0,0.16)] inline-flex justify-center items-center gap-2.5 transition-all active:scale-95 hover:brightness-105 font-inter font-semibold text-2xl select-none";

  const variants = {
    primary: "bg-[#F7B71D] text-[#3A6131]",
    secondary: "bg-[#AFA04A] text-[#E6DA93]",
  };

  return (
    <button
      //type={type}
      //onClick={onClick}
      //style = {style} // 3. Pass the 'style' prop to the actual button
      className={`${baseStyles} ${variants[variant]} ${className}`}
    >
      {label}
    </button>
  );
};

export default StockifyButton;