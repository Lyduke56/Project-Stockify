"use client";

import { useState } from "react";

export default function AdminSettingsSection() {
  const [toggles, setToggles] = useState({
    notifications: true,
    lowStock: true,
    orderNotifications: true,
    weeklyReports: true,
  });

  const toggle = (key: keyof typeof toggles) =>
    setToggles((prev) => ({ ...prev, [key]: !prev[key] }));

  const Toggle = ({ active, onToggle }: { active: boolean; onToggle: () => void }) => (
    <button
      onClick={onToggle}
      className={`w-10 h-6 rounded-full flex items-center transition-colors duration-200 ${
        active ? "bg-gray-900 justify-end pr-1" : "bg-gray-300 justify-start pl-1"
      }`}
    >
      <div className="w-4 h-4 bg-white rounded-full shadow" />
    </button>
  );

  const settings: { key: keyof typeof toggles; label: string; desc: string }[] = [
    { key: "notifications", label: "Notifications", desc: "Receive notifications for important updates" },
    { key: "lowStock", label: "Low Stock Alerts", desc: "Get notified when inventory items are running low" },
    { key: "orderNotifications", label: "Order Notifications", desc: "Receive alerts for new orders and order updates" },
    { key: "weeklyReports", label: "Weekly Reports", desc: "Get a weekly summary of your business performance" },
  ];

  return (
    <div className="flex flex-col gap-8 w-full px-8 py-8 animate-in fade-in duration-500">

      {/* Header */}
      <header className="flex flex-col items-center w-full">
        <h1 className="text-[#385E31] text-3xl font-bold font-['Inter'] uppercase tracking-widest">
          Client Settings
        </h1>
        <div className="w-[900px] h-1.5 bg-[#F7B71D] mt-2 rounded-full opacity-50" />
      </header>

      {/* Section label */}
      <div className="flex flex-col gap-1">
        <span className="text-lime-800 text-2xl font-bold font-['Inter']">SETTINGS</span>
        <span className="text-lime-800/70 text-xs font-['Inter']">Manage notification preferences</span>
      </div>

      {/* Card */}
      <div className="w-full bg-white rounded-[10px] outline outline-[0.81px] outline-lime-800/50">
        <div className="px-6 pt-5 pb-3">
          <p className="text-lime-800 text-xs font-medium font-['Inter']">Notifications</p>
          <p className="text-gray-500 text-xs font-['Inter'] mt-1">Choose what notifications you want to receive</p>
        </div>

        <div className="px-6 flex flex-col pb-5">
          {settings.map((s, i) => (
            <div key={s.key}>
              <div className="flex justify-between items-center py-3">
                <div className="flex flex-col gap-[3px]">
                  <span className="text-neutral-950 text-xs font-medium font-['Inter']">{s.label}</span>
                  <span className="text-lime-800/60 text-xs font-['Inter']">{s.desc}</span>
                </div>
                <Toggle active={toggles[s.key as keyof typeof toggles]} onToggle={() => toggle(s.key)} />
              </div>
              {i < settings.length - 1 && <div className="h-[0.81px] bg-black/10" />}
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}