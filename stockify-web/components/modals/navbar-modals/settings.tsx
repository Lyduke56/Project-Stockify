"use client";

import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Tab =  "security" | "notifications";

// --- Icon Components ---
const XIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);


const EyeIcon = ({ show }: { show: boolean }) =>
  show ? (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );

const BellIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);

const ShieldIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

const UserIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

// --- Toggle Component ---
function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="relative inline-flex items-center shrink-0 cursor-pointer"
      style={{ width: 44, height: 24 }}
    >
      <div
        className="w-full h-full rounded-full transition-colors duration-200"
        style={{ backgroundColor: checked ? "#385E31" : "#D1D5DB" }}
      />
      <div
        className="absolute top-[3px] w-[18px] h-[18px] bg-white rounded-full shadow transition-transform duration-200"
        style={{ transform: checked ? "translateX(23px)" : "translateX(3px)" }}
      />
    </button>
  );
}

// --- Input Field Component ---
function InputField({
  label, value, onChange, type = "text", placeholder = "", disabled = false,
  rightElement,
}: {
  label: string;
  value: string;
  onChange?: (v: string) => void;
  type?: string;
  placeholder?: string;
  disabled?: boolean;
  rightElement?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      <label className="text-[#385E31] text-[13px] font-semibold font-['Inter']">
        {label}
      </label>
      <div className="relative w-full">
        <input
          type={type}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className={`w-full h-10 px-4 rounded-lg border text-[14px] font-['Inter'] outline-none transition-all duration-150 ${
            disabled
              ? "bg-[#F3F4F6] border-[#D1D5DB] text-[#6B7280] cursor-not-allowed"
              : "bg-white border-[#C4D6C1] text-[#1F2937] placeholder-[#9CA3AF] focus:border-[#385E31]"
          } ${rightElement ? "pr-10" : ""}`}
        />
        {rightElement && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7280]">
            {rightElement}
          </div>
        )}
      </div>
    </div>
  );
}

// --- Main Modal Component ---
export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  // SSR Check: Only render on the client side
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const [activeTab, setActiveTab] = useState<Tab>("security");

  // Security state
  const [currentPass, setCurrentPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passError, setPassError] = useState("");
  const [passSaved, setPassSaved] = useState(false);

  // Notification state
  const [notifs, setNotifs] = useState({
    systemAlerts: true,
    newTenants: true,
    subscriptionUpdates: true,
    auditWarnings: false,
    emailDigest: true,
    smsAlerts: false,
  });

  if (!isOpen || !mounted) return null;


  const handlePasswordSave = () => {
    setPassError("");
    setPassSaved(false);
    if (!currentPass || !newPass || !confirmPass) {
      setPassError("All password fields are required.");
      return;
    }
    if (newPass.length < 8) {
      setPassError("New password must be at least 8 characters.");
      return;
    }
    if (newPass !== confirmPass) {
      setPassError("New passwords do not match.");
      return;
    }
    setPassSaved(true);
    setCurrentPass("");
    setNewPass("");
    setConfirmPass("");
    setTimeout(() => setPassSaved(false), 3000);
  };

  const tabs: { key: Tab; label: string; Icon: React.FC }[] = [
    { key: "security", label: "Security", Icon: ShieldIcon },
    { key: "notifications", label: "Notifications", Icon: BellIcon },
  ];

  const notifItems = [
    { key: "systemAlerts" as const, label: "System Alerts", desc: "Critical platform health and uptime notifications." },
    { key: "newTenants" as const, label: "New Tenant Registrations", desc: "Get notified when a new tenant signs up." },
    { key: "subscriptionUpdates" as const, label: "Subscription Updates", desc: "Billing events, renewals, and plan changes." },
    { key: "auditWarnings" as const, label: "Audit Log Warnings", desc: "Flag suspicious or high-priority audit events." },
    { key: "emailDigest" as const, label: "Email Digest", desc: "Receive a daily summary of platform activity." },
    { key: "smsAlerts" as const, label: "SMS Alerts", desc: "Text alerts for critical system outages." },
  ];

  // TELEPORT TO BODY
  return createPortal(
    <>
      {/* Backdrop - High Z-Index */}
      <div
        className="fixed inset-0 z-[9998] bg-black/40 backdrop-blur-[2px]"
        onClick={onClose}
      />

      {/* Modal Container - Highest Z-Index */}
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-none">
        <div
          className="w-full max-w-[640px] bg-[#FFFCEB] rounded-2xl shadow-2xl flex flex-col pointer-events-auto overflow-hidden"
          style={{ maxHeight: "90vh" }}
        >
          {/* Header */}
          <div className="bg-[#385E31] px-7 py-5 flex items-center justify-between shrink-0">
            <div>
              <h2 className="text-white text-[20px] font-extrabold font-['Inter'] tracking-wide uppercase">
                Settings
              </h2>
              <div className="w-16 h-1 bg-[#F7B71D] rounded-full mt-1" />
            </div>
            <button
              onClick={onClose}
              className="text-white/70 hover:text-white transition-colors duration-150"
            >
              <XIcon />
            </button>
          </div>

          {/* Tab Bar */}
          <div className="flex bg-[#2E4E28] shrink-0">
            {tabs.map(({ key, label, Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-[13px] font-bold font-['Inter'] transition-all duration-150 ${
                  activeTab === key
                    ? "bg-[#FFFCEB] text-[#385E31] shadow-sm"
                    : "text-white/60 hover:text-white/90"
                }`}
              >
                <Icon />
                {label}
              </button>
            ))}
          </div>

          {/* Scrollable Body */}
          <div className="flex-1 overflow-y-auto px-7 py-6">

            {/* ── SECURITY TAB ── */}
            {activeTab === "security" && (
              <div className="flex flex-col gap-6">
                <div className="bg-[#385E31]/8 border border-[#385E31]/20 rounded-xl px-5 py-4">
                  <p className="text-[#385E31] text-[13px] font-['Inter'] font-medium leading-relaxed">
                    For your security, choose a strong password with at least 8 characters, including
                    uppercase letters, numbers, and symbols.
                  </p>
                </div>

                <div className="flex flex-col gap-4">
                  <InputField
                    label="Current Password"
                    value={currentPass}
                    onChange={setCurrentPass}
                    type={showCurrent ? "text" : "password"}
                    placeholder="Enter current password"
                    rightElement={
                      <button type="button" onClick={() => setShowCurrent(!showCurrent)}>
                        <EyeIcon show={showCurrent} />
                      </button>
                    }
                  />
                  <InputField
                    label="New Password"
                    value={newPass}
                    onChange={setNewPass}
                    type={showNew ? "text" : "password"}
                    placeholder="Enter new password"
                    rightElement={
                      <button type="button" onClick={() => setShowNew(!showNew)}>
                        <EyeIcon show={showNew} />
                      </button>
                    }
                  />
                  <InputField
                    label="Confirm New Password"
                    value={confirmPass}
                    onChange={setConfirmPass}
                    type={showConfirm ? "text" : "password"}
                    placeholder="Re-enter new password"
                    rightElement={
                      <button type="button" onClick={() => setShowConfirm(!showConfirm)}>
                        <EyeIcon show={showConfirm} />
                      </button>
                    }
                  />
                </div>

                {newPass.length > 0 && (
                  <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between text-[12px] font-['Inter'] font-semibold">
                      <span className="text-[#385E31]/60">Password strength</span>
                      <span className={
                        newPass.length < 6 ? "text-red-500"
                        : newPass.length < 10 ? "text-amber-500"
                        : "text-[#385E31]"
                      }>
                        {newPass.length < 6 ? "Weak" : newPass.length < 10 ? "Fair" : "Strong"}
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-[#D1D5DB] rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          newPass.length < 6 ? "bg-red-500 w-1/4"
                          : newPass.length < 10 ? "bg-amber-400 w-1/2"
                          : "bg-[#385E31] w-full"
                        }`}
                      />
                    </div>
                  </div>
                )}

                {passError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-2.5">
                    <p className="text-red-600 text-[13px] font-['Inter'] font-medium">{passError}</p>
                  </div>
                )}
                {passSaved && (
                  <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-2.5">
                    <p className="text-green-700 text-[13px] font-['Inter'] font-medium">
                      Password updated successfully.
                    </p>
                  </div>
                )}

                <div className="flex justify-end pt-2">
                  <button
                    onClick={handlePasswordSave}
                    className="bg-[#385E31] text-white text-[14px] font-bold font-['Inter'] px-8 py-2.5 rounded-full hover:bg-[#2E4E28] transition-colors duration-150"
                  >
                    Update Password
                  </button>
                </div>
              </div>
            )}

            {/* ── NOTIFICATIONS TAB ── */}
            {activeTab === "notifications" && (
              <div className="flex flex-col gap-2">
                <p className="text-[#385E31]/70 text-[13px] font-['Inter'] mb-3">
                  Choose which events you&apos;d like to be alerted about.
                </p>
                {notifItems.map(({ key, label, desc }) => (
                  <div
                    key={key}
                    className="flex items-center justify-between gap-4 px-4 py-4 bg-white rounded-xl border border-[#C4D6C1] hover:border-[#385E31]/40 transition-colors duration-150"
                  >
                    <div className="flex flex-col">
                      <span className="text-[#1F2937] text-[14px] font-bold font-['Inter']">
                        {label}
                      </span>
                      <span className="text-[#6B7280] text-[12px] font-['Inter'] mt-0.5">
                        {desc}
                      </span>
                    </div>
                    <Toggle
                      checked={notifs[key]}
                      onChange={(v) => setNotifs((prev) => ({ ...prev, [key]: v }))}
                    />
                  </div>
                ))}

                <div className="flex justify-end pt-4">
                  <button
                    onClick={() => {}}
                    className="bg-[#385E31] text-white text-[14px] font-bold font-['Inter'] px-8 py-2.5 rounded-full hover:bg-[#2E4E28] transition-colors duration-150"
                  >
                    Save Preferences
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </>,
    document.body
  );
}