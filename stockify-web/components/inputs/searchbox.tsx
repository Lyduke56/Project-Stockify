"use client";

import React from "react";

interface SearchBoxProps {
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
}

export default function SearchBox({
  placeholder = "Search",
  value,
  onChange,
}: SearchBoxProps) {
  return (
    <div
      className="w-150 h-10 px-4 flex items-center justify-between rounded-[10px] outline outline-1"
      style={{ backgroundColor: "#FFFCF0", outlineColor: "#385E31" }}
    >
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        className="flex-1 bg-transparent text-sm font-['Inter'] outline-none border-none"
        style={{ color: "#385E31" }}
      />
      <button className="w-5 h-5 flex items-center justify-center shrink-0">
        <img
          src="/icon-search.svg"
          alt="Search"
          className="w-5 h-5"
          style={{
            filter: "brightness(0) saturate(100%) invert(27%) sepia(40%) saturate(600%) hue-rotate(80deg)",
          }}
        />
      </button>
    </div>
  );
}