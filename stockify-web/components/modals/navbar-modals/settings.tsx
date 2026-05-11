"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Tab = "security" | "notifications";

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
    fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);

const ShieldIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

const LoaderIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    className="animate-spin">
    <line x1="12" y1="2" x2="12" y2="6" />
    <line x1="12" y1="18" x2="12" y2="22" />
    <line x1="4.93" y1="4.93" x2="7.76" y2="7.76" />
    <line x1="16.24" y1="16.24" x2="19.07" y2="19.07" />
    <line x1="2" y1="12" x2="6" y2="12" />
    <line x1="18" y1="12" x2="22" y2="12" />
    <line x1="4.93" y1="19.07" x2="7.76" y2="16.24" />
    <line x1="16.24" y1="7.76" x2="19.07" y2="4.93" />
  </svg>
);

// --- Toggle Component ---
function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="relative inline-flex items-center shrink-0 cursor-pointer rounded-full transition-colors duration-300 focus:outline-none focus:ring-4 focus:ring-[#F7B71D]/20"
      style={{ width: 48, height: 26, backgroundColor: checked ? "#3A6131" : "#D1D5DB" }}
    >
      <div
        className="absolute top-[3px] w-[20px] h-[20px] bg-white rounded-full shadow-md transition-transform duration-300"
        style={{ transform: checked ? "translateX(25px)" : "translateX(3px)" }}
      />
    </button>
  );
}

// --- Main Modal Component ---
export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const [activeTab, setActiveTab] = useState<Tab>("security");
  const [saving, setSaving] = useState(false);

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

  const handlePasswordSave = async () => {
    const supabase = createClient();
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

    try {
      setSaving(true);
      const { data: sessionData } = await supabase.auth.getSession();
      const userEmail = sessionData.session?.user.email;

      if (!userEmail) throw new Error("User session not found.");

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: userEmail,
        password: currentPass,
      });

      if (signInError) {
        setPassError("The 'Current Password' you entered is incorrect.");
        setSaving(false);
        return;
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: newPass,
      });

      if (updateError) {
        setPassError(updateError.message);
        setSaving(false);
        return;
      }

      setPassSaved(true);
      setCurrentPass("");
      setNewPass("");
      setConfirmPass("");
      setTimeout(() => setPassSaved(false), 5000);
    } catch (err: any) {
      setPassError("An unexpected error occurred. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleNotificationSave = async () => {
    setSaving(true);
    // Simulate API call for saving preferences
    setTimeout(() => {
      setSaving(false);
      setPassSaved(true);
      setTimeout(() => setPassSaved(false), 5000);
    }, 800);
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

  // ── Styles matched to FnbItemModal ──
  const labelStyle = "text-[11px] font-black uppercase tracking-[0.12em] text-[#3A6131]/50 mb-2 block";
  const inputStyle = "w-full bg-white border-[1.5px] border-[#3A6131]/10 rounded-2xl px-4 py-3 text-sm text-[#3A6131] font-medium focus:outline-none focus:border-[#F7B71D] focus:ring-4 focus:ring-[#F7B71D]/10 transition-all placeholder:text-gray-300";

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        onClick={onClose}
      />

      {/* Modal Container */}
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="w-full max-w-[920px] bg-[#FFFCEB] rounded-[32px] overflow-hidden border-[1.5px] border-[#F7B71D]/20 shadow-[0_32px_80px_rgba(58,97,49,0.2)] flex flex-col md:flex-row h-[650px] font-['Inter'] relative z-10"
      >
        {/* LEFT SIDEBAR */}
        <div className="w-full md:w-[320px] bg-[#3A6131] p-10 flex flex-col relative overflow-hidden shrink-0">
          <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-[#F7B71D]/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10">
            <div className="bg-[#F7B71D] w-12 h-1 rounded-full mb-8" />
            <h2 className="text-[#FFFCEB] text-3xl font-black leading-tight mb-2 tracking-wide uppercase">
              Settings
            </h2>
            <p className="text-[#FFFCEB]/60 text-xs font-medium leading-relaxed mb-12">
              Manage your account security, passwords, and notification preferences here.
            </p>
            <nav className="flex flex-col gap-8">
              {tabs.map((t) => (
                <button
                  key={t.key}
                  onClick={() => {
                    setActiveTab(t.key);
                    setPassError("");
                    setPassSaved(false);
                  }}
                  className={`flex items-center gap-4 transition-all duration-300 w-full text-left outline-none ${
                    activeTab === t.key ? "translate-x-2" : "opacity-40 hover:opacity-70"
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                      activeTab === t.key
                        ? "bg-[#F7B71D] text-[#385E31] shadow-lg shadow-[#F7B71D]/20"
                        : "bg-white/10 text-white"
                    }`}
                  >
                    <t.Icon />
                  </div>
                  <span
                    className={`text-sm font-bold tracking-wide ${
                      activeTab === t.key ? "text-[#FFFCEB]" : "text-white"
                    }`}
                  >
                    {t.label}
                  </span>
                </button>
              ))}
            </nav>
          </div>
          <div className="mt-auto relative z-10">
            <div className="flex gap-2">
              {tabs.map((t) => (
                <div
                  key={t.key}
                  className={`h-1.5 rounded-full transition-all duration-500 ${
                    activeTab === t.key ? "w-8 bg-[#F7B71D]" : "w-2 bg-white/20"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT CONTENT */}
        <div className="flex-1 flex flex-col relative bg-white/50 backdrop-blur-sm">

          <div className="flex-1 overflow-y-auto p-10 [&::-webkit-scrollbar]:w-[5px] [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[#3A6131]/15 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-[#3A6131]/25">
            {/* Feedback Banners */}
            {passError && (
              <div className="mb-6 px-4 py-3 bg-red-50 border border-red-200 rounded-2xl text-red-600 text-xs font-semibold">
                {passError}
              </div>
            )}
            {passSaved && (
              <div className="mb-6 px-4 py-3 bg-[#3A6131]/10 border border-[#3A6131]/20 rounded-2xl text-[#3A6131] text-xs font-semibold">
                ✓ Successfully updated {activeTab === "security" ? "password" : "preferences"}.
              </div>
            )}

            <AnimatePresence mode="wait">
              {/* STEP 1: SECURITY */}
              {activeTab === "security" && (
                <motion.div
                  key="security"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="mb-8">
                    <h3 className="text-2xl font-black text-[#3A6131] mt-2 italic font-['Raleway']">
                      Security & Password
                    </h3>
                    <p className="text-[12px] text-[#3A6131]/60 font-medium leading-relaxed mt-2">
                      For your security, choose a strong password with at least 8 characters, including
                      uppercase letters, numbers, and symbols.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-5">
                    <div>
                      <label className={labelStyle}>Current Password</label>
                      <div className="relative w-full">
                        <input
                          className={`${inputStyle} pr-12`}
                          type={showCurrent ? "text" : "password"}
                          value={currentPass}
                          onChange={(e) => setCurrentPass(e.target.value)}
                          placeholder="Enter current password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrent(!showCurrent)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-[#3A6131]/40 hover:text-[#3A6131] transition-colors"
                        >
                          <EyeIcon show={showCurrent} />
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className={labelStyle}>New Password</label>
                      <div className="relative w-full">
                        <input
                          className={`${inputStyle} pr-12`}
                          type={showNew ? "text" : "password"}
                          value={newPass}
                          onChange={(e) => setNewPass(e.target.value)}
                          placeholder="Enter new password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNew(!showNew)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-[#3A6131]/40 hover:text-[#3A6131] transition-colors"
                        >
                          <EyeIcon show={showNew} />
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className={labelStyle}>Confirm New Password</label>
                      <div className="relative w-full">
                        <input
                          className={`${inputStyle} pr-12`}
                          type={showConfirm ? "text" : "password"}
                          value={confirmPass}
                          onChange={(e) => setConfirmPass(e.target.value)}
                          placeholder="Re-enter new password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirm(!showConfirm)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-[#3A6131]/40 hover:text-[#3A6131] transition-colors"
                        >
                          <EyeIcon show={showConfirm} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Password Strength Indicator */}
                  {newPass.length > 0 && (
                    <div className="flex flex-col gap-2 mt-2">
                      <div className="flex justify-between text-[11px] font-bold uppercase tracking-wider">
                        <span className="text-[#3A6131]/50">Password strength</span>
                        <span
                          className={
                            newPass.length < 6
                              ? "text-red-500"
                              : newPass.length < 10
                              ? "text-[#F7B71D]"
                              : "text-[#3A6131]"
                          }
                        >
                          {newPass.length < 6 ? "Weak" : newPass.length < 10 ? "Fair" : "Strong"}
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-[#3A6131]/10 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            newPass.length < 6
                              ? "bg-red-500 w-1/4"
                              : newPass.length < 10
                              ? "bg-[#F7B71D] w-1/2"
                              : "bg-[#3A6131] w-full"
                          }`}
                        />
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {/* STEP 2: NOTIFICATIONS */}
              {activeTab === "notifications" && (
                <motion.div
                  key="notifications"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="mb-6">
                    <h3 className="text-2xl font-black text-[#3A6131] mt-2 italic font-['Raleway']">
                      Alerts & Notifications
                    </h3>
                    <p className="text-[12px] text-[#3A6131]/60 font-medium leading-relaxed mt-2">
                      Choose which events you'd like to be alerted about. These settings apply to your admin account across the platform.
                    </p>
                  </div>

                  <div className="flex flex-col gap-3">
                    {notifItems.map(({ key, label, desc }) => (
                      <div
                        key={key}
                        className="flex items-center justify-between gap-4 p-5 bg-white rounded-[20px] border-[1.5px] border-[#3A6131]/10 hover:border-[#F7B71D]/50 transition-all shadow-sm"
                      >
                        <div className="flex flex-col">
                          <span className="text-[#3A6131] text-[14px] font-bold">
                            {label}
                          </span>
                          <span className="text-[#3A6131]/60 text-[12px] font-medium mt-1">
                            {desc}
                          </span>
                        </div>
                        <Toggle
                          checked={notifs[key]}
                          onChange={(v) => setNotifs((prev) => ({ ...prev, [key]: v }))}
                        />
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer */}
          <div className="px-8 py-5 border-t border-[#3A6131]/10 bg-white/80 flex justify-end items-center z-20 shrink-0">
            <button
              onClick={activeTab === "security" ? handlePasswordSave : handleNotificationSave}
              disabled={saving}
              className="bg-[#3A6131] text-[#FFFCEB] px-8 py-3 rounded-2xl text-sm font-bold flex items-center gap-2 hover:opacity-90 transition-opacity shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <LoaderIcon /> Saving...
                </>
              ) : (
                <>{activeTab === "security" ? "Update Password" : "Save Preferences"}</>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>,
    document.body
  );
}