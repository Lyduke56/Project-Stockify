"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { createClient } from "@/lib/supabase/client"; 

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Tab = "security" | "notifications";

// --- Icon Components (Matching your clean SVG line-art theme) ---
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

// --- Custom Toggle Switch ---
function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="relative inline-flex items-center shrink-0 cursor-pointer border-0 bg-transparent"
      style={{ width: 44, height: 24 }}
    >
      <div
        className="w-full h-full rounded-full transition-colors duration-200"
        style={{ backgroundColor: checked ? "#3E6135" : "#D1D5DB" }}
      />
      <div
        className="absolute top-[3px] w-[18px] h-[18px] bg-white rounded-full shadow transition-transform duration-200"
        style={{ transform: checked ? "translateX(23px)" : "translateX(3px)" }}
      />
    </button>
  );
}

// --- Card Input Field ---
function InputField({
  label, value, onChange, type = "text", placeholder = "", disabled = false, rightElement,
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
    <div className="flex flex-col gap-1.5 w-full text-left">
      <label className="text-stone-400 text-[10px] font-bold tracking-wider uppercase ml-0.5">
        {label}
      </label>
      <div className="relative w-full">
        <input
          type={type}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className={`w-full h-11 px-4 rounded-xl border text-[13px] font-['Inter'] font-medium outline-none transition-all duration-150 ${
            disabled
              ? "bg-stone-100 border-stone-200 text-stone-400 cursor-not-allowed"
              : "bg-white border-stone-200 text-[#3E6135] placeholder-stone-300 focus:border-[#3E6135]/50"
          } ${rightElement ? "pr-10" : ""}`}
        />
        {rightElement && (
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-300 flex items-center justify-center">
            {rightElement}
          </div>
        )}
      </div>
    </div>
  );
}

// ================= FLOATING SCREEN MODAL COMPONENT =================
export default function AdminSettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("security");

  // Security password state
  const [currentPass, setCurrentPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passError, setPassError] = useState("");
  const [passSaved, setPassSaved] = useState(false);

  // Notifications toggle state
  const [isSaving, setIsSaving] = useState(false);
  const [notifSaved, setNotifSaved] = useState(false);
  const [notifs, setNotifs] = useState({
    systemAlerts: true,
    newTenants: true,
    subscriptionUpdates: true,
    auditWarnings: false,
    emailDigest: true,
    smsAlerts: false,
  });

  // Client-side execution portal safety synchronization mount check
  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch live workspace preferences from Supabase DB on opening
  useEffect(() => {
    const fetchPrefs = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (data && !error) {
        setNotifs({
          systemAlerts: data.system_alerts,
          newTenants: data.new_tenants,
          subscriptionUpdates: data.subscription_updates,
          auditWarnings: data.audit_warnings,
          emailDigest: data.email_digest,
          smsAlerts: data.sms_alerts,
        });
      }
    };

    if (isOpen) fetchPrefs();
  }, [isOpen]);

  if (!mounted) return null;
  if (!isOpen) return null;

  // Supabase secure re-authentication execution pipeline
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
      const { data: sessionData } = await supabase.auth.getSession();
      const userEmail = sessionData.session?.user.email;
      if (!userEmail) throw new Error("User session not found.");

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: userEmail,
        password: currentPass,
      });

      if (signInError) {
        setPassError("The 'Current Password' you entered is incorrect.");
        return;
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: newPass,
      });

      if (updateError) {
        setPassError(updateError.message);
        return;
      }

      setPassSaved(true);
      setCurrentPass("");
      setNewPass("");
      setConfirmPass("");
      setTimeout(() => setPassSaved(false), 5000);

    } catch (err: any) {
      setPassError("An unexpected error occurred. Please try again.");
    }
  };

  const handleNotifSave = async () => {
    const supabase = createClient();
    setIsSaving(true);
    setNotifSaved(false);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          system_alerts: notifs.systemAlerts,
          new_tenants: notifs.newTenants,
          subscription_updates: notifs.subscriptionUpdates,
          audit_warnings: notifs.auditWarnings,
          email_digest: notifs.emailDigest,
          sms_alerts: notifs.smsAlerts,
          updated_at: new Date()
        }, { onConflict: 'user_id' });

      if (error) throw error;

      setNotifSaved(true);
      setTimeout(() => setNotifSaved(false), 3000);
    } catch (err) {
      console.error("Save failed:", err);
      alert("Failed to save preferences. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const tabs = [
    { key: "security" as const, label: "Security", Icon: ShieldIcon },
    { key: "notifications" as const, label: "Notifications", Icon: BellIcon },
  ];

  const notifItems = [
    { key: "systemAlerts" as const, label: "System Alerts", desc: "Critical platform health and uptime notifications." },
    { key: "newTenants" as const, label: "New Tenant Registrations", desc: "Get notified when a new tenant signs up." },
    { key: "subscriptionUpdates" as const, label: "Subscription Updates", desc: "Billing events, renewals, and plan changes." },
    { key: "auditWarnings" as const, label: "Audit Log Warnings", desc: "Flag suspicious or high-priority audit events." },
    { key: "emailDigest" as const, label: "Email Digest", desc: "Receive a daily summary of platform activity." },
  { key: "smsAlerts" as const, label: "SMS Alerts", desc: "Text alerts for critical system outages." }
  ];

  return createPortal(
    <>
      {/* Dark backdrop element behind the floating panel layout wrapper box */}
      <div
        className="fixed inset-0 z-[9998] bg-black/40 backdrop-blur-[2px] transition-opacity duration-200"
        onClick={onClose}
      />

      {/* Primary Floating Centered Viewport Container Box wrapper */}
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-none">
        <div
          className="bg-[#FFFDF4] w-[880px] h-[550px] rounded-[30px] shadow-2xl overflow-hidden flex relative border border-stone-200/40 pointer-events-auto"
          style={{ maxHeight: "90vh" }}
        >
          
          {/* ================= LEFT SIDEBAR (DARK GREEN) ================= */}
          <div className="w-[285px] bg-[#3E6135] p-8 flex flex-col justify-between shrink-0 text-left relative">
            <div className="flex flex-col gap-7">
              
              {/* Header Titles block */}
              <div className="flex flex-col gap-2 text-white">
                <div className="w-9 h-[4px] bg-[#EBB12B] rounded-full mb-1" />
                <h2 className="text-3xl font-extrabold tracking-wide uppercase m-0">Settings</h2>
                <p className="text-[11px] text-white/70 leading-relaxed font-normal m-0">
                  Manage your account security, passwords, and notification preferences here.
                </p>
              </div>

              {/* Functional tabs selector component array blocks */}
              <nav className="flex flex-col gap-2 mt-4">
                {tabs.map(({ key, label, Icon }) => {
                  const isSelected = activeTab === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setActiveTab(key)}
                      className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer border-0 ${
                        isSelected
                          ? "bg-[#EBB12B] text-[#3E6135] shadow-sm"
                          : "text-white/60 hover:text-white hover:bg-white/5 bg-transparent"
                      }`}
                    >
                      <div className="w-5 h-5 flex items-center justify-center shrink-0">
                        <Icon />
                      </div>
                      <span className="tracking-wider uppercase">{label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Bottom track bar accents visual design markers block */}
            <div className="flex items-center gap-1.5 ml-1">
              <div className={`h-[4px] rounded-full transition-all duration-300 ${activeTab === 'security' ? 'w-7 bg-[#EBB12B]' : 'w-2 bg-[#EBB12B]/30'}`} />
              <div className={`h-[4px] rounded-full transition-all duration-300 ${activeTab === 'notifications' ? 'w-7 bg-[#EBB12B]' : 'w-2 bg-[#EBB12B]/30'}`} />
            </div>
          </div>

          {/* ================= RIGHT WORKSPACE SCREEN PANEL AREA ================= */}
          <div className="flex-1 bg-[#FFFDF4] flex flex-col justify-between relative overflow-hidden text-left">
            
            {/* Absolute Top-Right Dismiss Cross Button */}
            <button
              onClick={onClose}
              className="absolute right-6 top-6 z-10 text-stone-400 hover:text-stone-600 bg-transparent border-0 cursor-pointer p-1 rounded-lg hover:bg-stone-100/50 transition-colors"
            >
              <XIcon />
            </button>

            {/* Main Interactive Form Fields Container Viewport block area */}
            <div className="flex-1 p-10 overflow-y-auto">
              
              {/* ── SECURITY DISPLAY WORKSPACE ── */}
{activeTab === "security" && (
  <div className="flex flex-col gap-5 max-w-xl text-left transition-all duration-300 ease-out animate-in fade-in slide-in-from-bottom-4">
    <div>
      <h3 className="text-[#385E31] text-lg font-bold tracking-tight m-0">Security & Password</h3>
      <p className="text-stone-400 text-[11px] mt-1 font-medium leading-relaxed max-w-xl m-0">
        For your security, choose a strong password with at least 8 characters, including uppercase letters, numbers, and symbols.
      </p>
    </div>

    <div className="flex flex-col gap-4 mt-2">
      <InputField
        label="Current Password"
        value={currentPass}
        onChange={setCurrentPass}
        type={showCurrent ? "text" : "password"}
        placeholder="Enter current password"
        rightElement={
          <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="border-0 bg-transparent p-0 flex items-center cursor-pointer text-stone-400 hover:text-stone-600">
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
          <button type="button" onClick={() => setShowNew(!showNew)} className="border-0 bg-transparent p-0 flex items-center cursor-pointer text-stone-400 hover:text-stone-600">
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
          <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="border-0 bg-transparent p-0 flex items-center cursor-pointer text-stone-400 hover:text-stone-600">
            <EyeIcon show={showConfirm} />
          </button>
        }
      />
    </div>

    {/* Password Track Line Status metrics */}
    {newPass.length > 0 && (
      <div className="flex flex-col gap-1.5 text-left">
        <div className="flex justify-between text-[11px] font-['Inter'] font-semibold">
          <span className="text-stone-400">Password strength</span>
          <span className={
            newPass.length < 6 ? "text-red-500"
            : newPass.length < 10 ? "text-amber-500"
            : "text-[#385E31]" /* 🟢 Fixed color token */
          }>
            {newPass.length < 6 ? "Weak" : newPass.length < 10 ? "Fair" : "Strong"}
          </span>
        </div>
        <div className="w-full h-1 bg-stone-200 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              newPass.length < 6 ? "bg-red-500 w-1/4"
              : newPass.length < 10 ? "bg-amber-400 w-1/2"
              : "bg-[#385E31] w-full" /* 🟢 Fixed color token */
            }`}
          />
        </div>
      </div>
    )}

    {passError && (
      <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-2.5 text-left">
        <p className="text-red-600 text-[12px] font-['Inter'] font-medium m-0">{passError}</p>
      </div>
    )}
    {passSaved && (
      <div className="bg-green-50 border border-green-100 rounded-xl px-4 py-2.5 text-left">
        <p className="text-[#385E31] text-[12px] font-['Inter'] font-medium m-0"> {/* 🟢 Fixed color token */}
          Password updated successfully.
        </p>
      </div>
    )}
  </div>
)}

{/* ── NOTIFICATIONS DISPLAY WORKSPACE ── */}
{activeTab === "notifications" && (
  <div className="flex flex-col gap-5 max-w-xl text-left transition-all duration-300 ease-out animate-in fade-in slide-in-from-bottom-4">
    <div>
      <h3 className="text-[#385E31] text-lg font-bold tracking-tight m-0">Alerts & Notifications</h3>
      <p className="text-stone-400 text-[11px] mt-1 font-medium leading-relaxed max-w-xl m-0">
        Choose which events you'd like to be alerted about. These settings apply to your admin account across the platform.
      </p>
    </div>

    <div className="flex flex-col gap-3 mt-2 max-w-xl">
      {notifItems.map(({ key, label, desc }) => (
        <div
          key={key}
          className="flex items-center justify-between p-4 bg-white rounded-2xl border border-stone-100 shadow-sm text-left hover:border-stone-200/80 transition-colors"
        >
          <div className="flex flex-col pr-4">
            <span className="text-[#385E31] text-xs font-bold font-['Inter']">{label}</span>
            <span className="text-[11px] text-stone-400 font-medium mt-0.5 leading-tight">{desc}</span>
          </div>
          <Toggle
            checked={notifs[key]}
            onChange={(v) => setNotifs((prev) => ({ ...prev, [key]: v }))}
          />
        </div>
      ))}
    </div>
  </div>
)}

              {/* ── NOTIFICATIONS DISPLAY WORKSPACE ── */}
{activeTab === "notifications" && (
  <div className="flex flex-col gap-5 max-w-xl text-left transition-all duration-300 ease-out animate-in fade-in slide-in-from-bottom-4">
    <div>
      <h3 className="text-[#385E31] text-lg font-bold tracking-tight m-0">Alerts & Notifications</h3>
      <p className="text-stone-400 text-[11px] mt-1 font-medium leading-relaxed max-w-xl m-0">
        Choose which events you'd like to be alerted about. These settings apply to your admin account across the platform.
      </p>
    </div>

    <div className="flex flex-col gap-3 mt-2 max-w-xl">
      {notifItems.map(({ key, label, desc }) => (
        <div
          key={key}
          className="flex items-center justify-between p-4 bg-white rounded-2xl border border-stone-100 shadow-sm text-left hover:border-stone-200/80 transition-colors"
        >
          <div className="flex flex-col pr-4">
            {/* 🟢 Synchronized color hex to match your layout theme */}
            <span className="text-[#385E31] text-xs font-bold font-['Inter']">{label}</span>
            <span className="text-[11px] text-stone-400 font-medium mt-0.5 leading-tight">{desc}</span>
          </div>
          <Toggle
            checked={notifs[key]}
            onChange={(v) => setNotifs((prev) => ({ ...prev, [key]: v }))}
          />
        </div>
      ))}
    </div>
  </div>
)}
            </div>

            {/* ================= ACTIONS BUTTONS FOOTER BAR ================= */}
            <div className="w-full bg-white border-t border-stone-100 px-8 py-4 flex items-center justify-end shrink-0 gap-4">
              {activeTab === "security" ? (
                <button
                  type="button"
                  onClick={handlePasswordSave}
                  className="bg-[#3E6135] text-white px-8 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider hover:brightness-110 transition-all shadow-sm cursor-pointer border-0"
                >
                  Update Password
                </button>
              ) : (
                <>
                  {notifSaved && (
                    <span className="text-[#3E6135] text-xs font-bold animate-pulse font-['Inter']">
                      Preferences saved!
                  </span>
                  )}
                  <button
                    type="button"
                    onClick={handleNotifSave}
                    disabled={isSaving}
                    className="bg-[#3E6135] text-white px-8 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider hover:brightness-110 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all border-0 flex items-center justify-center"
                  >
                    {isSaving ? (
                      <div className="flex items-center gap-2">
                        <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Saving...
                      </div>
                    ) : (
                      "Save Preferences"
                    )}
                  </button>
                </>
              )}
            </div>

          </div>
        </div>
      </div>
    </>,
    document.body
  );
}