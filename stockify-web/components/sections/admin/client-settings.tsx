"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { X, Shield, Bell, Eye, EyeOff, Loader2, Check } from "lucide-react";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Tab = "security" | "notifications";

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
        className="w-full h-full rounded-full transition-colors duration-300"
        style={{ backgroundColor: checked ? "#F7B71D" : "#E5E7EB" }}
      />
      <div
        className="absolute top-[3px] w-[18px] h-[18px] bg-white rounded-full shadow transition-transform duration-300"
        style={{ transform: checked ? "translateX(23px)" : "translateX(3px)" }}
      />
    </button>
  );
}

// ── Styles ────────────────────────────────────────────────────
const labelStyle = "text-[11px] font-black uppercase tracking-[0.12em] text-[#3A6131]/50 mb-2 block";
const inputStyle = "w-full bg-white border-[1.5px] border-[#3A6131]/10 rounded-2xl px-4 py-3 text-sm text-[#3A6131] font-medium focus:outline-none focus:border-[#F7B71D] focus:ring-4 focus:ring-[#F7B71D]/10 transition-all placeholder:text-[#3A6131]/30";

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
    <div className="w-full text-left">
      <label className={labelStyle}>{label}</label>
      <div className="relative w-full">
        <input
          type={type}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className={`${inputStyle} ${disabled ? "bg-stone-50 cursor-not-allowed opacity-60" : ""} ${rightElement ? "pr-12" : ""}`}
        />
        {rightElement && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[#3A6131]/40 hover:text-[#3A6131] transition-colors flex items-center justify-center">
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
  const [isSavingPass, setIsSavingPass] = useState(false);

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
      setIsSavingPass(true);
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
    } finally {
      setIsSavingPass(false);
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

  if (!mounted) return null;

  const TABS = [
    { key: "security" as const, label: "Security & Password", icon: Shield },
    { key: "notifications" as const, label: "Alerts & Notifications", icon: Bell },
  ];

  const notifItems = [
    { key: "systemAlerts" as const, label: "System Alerts", desc: "Critical platform health and uptime notifications." },
    { key: "newTenants" as const, label: "New Registrations", desc: "Get notified when a new tenant signs up." },
    { key: "subscriptionUpdates" as const, label: "Subscription Updates", desc: "Billing events, renewals, and plan changes." },
    { key: "auditWarnings" as const, label: "Audit Log Warnings", desc: "Flag suspicious or high-priority audit events." },
    { key: "emailDigest" as const, label: "Email Digest", desc: "Receive a daily summary of platform activity." },
    { key: "smsAlerts" as const, label: "SMS Alerts", desc: "Text alerts for critical system outages." }
  ];

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9998] bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Main Container Wrapper */}
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="w-full max-w-[920px] bg-[#FFFCEB] rounded-[32px] overflow-hidden border-[1.5px] border-[#F7B71D]/20 shadow-[0_32px_80px_rgba(58,97,49,0.2)] flex flex-col md:flex-row h-[650px] font-inter pointer-events-auto"
            >
              
              {/* ================= LEFT SIDEBAR ================= */}
              <div className="w-full md:w-[320px] bg-[#3A6131] p-10 flex flex-col relative overflow-hidden shrink-0">
                <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-[#F7B71D]/10 rounded-full blur-3xl" />
                <div className="relative z-10">
                  <div className="bg-[#F7B71D] w-12 h-1 rounded-full mb-8" />
                  <h2 className="text-[#FFFCEB] font-raleway text-3xl font-black leading-tight mb-2">
                    Settings
                  </h2>
                  <p className="text-[#FFFCEB]/60 text-xs font-medium leading-relaxed mb-12">
                    Manage your admin account security and customize your platform notification preferences.
                  </p>
                  
                  <nav className="flex flex-col gap-8">
                    {TABS.map((tab) => {
                      const isActive = activeTab === tab.key;
                      return (
                        <button
                          key={tab.key}
                          onClick={() => setActiveTab(tab.key)}
                          className={`flex items-center gap-4 transition-all duration-300 w-full text-left bg-transparent border-0 cursor-pointer p-0 ${isActive ? "translate-x-2" : "opacity-40 hover:opacity-70"}`}
                        >
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all ${isActive ? "bg-[#F7B71D] text-[#385E31] shadow-lg shadow-[#F7B71D]/20" : "bg-white/10 text-white"}`}>
                            <tab.icon size={18} strokeWidth={2.5} />
                          </div>
                          <span className={`text-sm font-bold tracking-wide ${isActive ? "text-[#FFFCEB]" : "text-white"}`}>
                            {tab.label}
                          </span>
                        </button>
                      );
                    })}
                  </nav>
                </div>

                <div className="mt-auto relative z-10">
                  <div className="flex gap-2">
                    <div className={`h-1.5 rounded-full transition-all duration-500 ${activeTab === 'security' ? 'w-8 bg-[#F7B71D]' : 'w-2 bg-white/20'}`} />
                    <div className={`h-1.5 rounded-full transition-all duration-500 ${activeTab === 'notifications' ? 'w-8 bg-[#F7B71D]' : 'w-2 bg-white/20'}`} />
                  </div>
                </div>
              </div>

              {/* ================= RIGHT CONTENT AREA ================= */}
              <div className="flex-1 flex flex-col relative bg-white/50 backdrop-blur-sm">
                <button 
                  onClick={onClose} 
                  className="absolute top-6 right-6 w-10 h-10 rounded-full bg-[#FFFCEB] border border-[#3A6131]/10 flex items-center justify-center text-[#3A6131] hover:bg-[#3A6131] hover:text-[#FFFCEB] transition-all z-20 cursor-pointer"
                >
                  <X size={20} strokeWidth={2.5} />
                </button>

                <div className="flex-1 overflow-y-auto p-10 [&::-webkit-scrollbar]:w-[5px] [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[#3A6131]/15 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-[#3A6131]/25">
                  <AnimatePresence mode="wait">

                    {/* ── SECURITY TAB ── */}
                    {activeTab === "security" && (
                      <motion.div key="security" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                        <div className="mb-8">
                          <span className="bg-[#F7B71D]/15 text-[#385E31] text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">Admin Account</span>
                          <h3 className="text-2xl font-black text-[#3A6131] mt-2 font-raleway italic">Security & Password</h3>
                        </div>

                        <div className="grid grid-cols-1 gap-5 max-w-md">
                          <InputField
                            label="Current Password"
                            value={currentPass}
                            onChange={setCurrentPass}
                            type={showCurrent ? "text" : "password"}
                            placeholder="Enter current password"
                            rightElement={
                              <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="border-0 bg-transparent p-0 flex items-center cursor-pointer">
                                {showCurrent ? <EyeOff size={18} /> : <Eye size={18} />}
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
                              <button type="button" onClick={() => setShowNew(!showNew)} className="border-0 bg-transparent p-0 flex items-center cursor-pointer">
                                {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
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
                              <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="border-0 bg-transparent p-0 flex items-center cursor-pointer">
                                {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                              </button>
                            }
                          />

                          {/* Password Track Line Status metrics */}
                          {newPass.length > 0 && (
                            <div className="flex flex-col gap-2 text-left mt-1">
                              <div className="flex justify-between text-[11px] font-black uppercase tracking-wider">
                                <span className="text-[#3A6131]/50">Password strength</span>
                                <span className={
                                  newPass.length < 6 ? "text-red-500"
                                  : newPass.length < 10 ? "text-[#F7B71D]"
                                  : "text-[#3A6131]"
                                }>
                                  {newPass.length < 6 ? "Weak" : newPass.length < 10 ? "Fair" : "Strong"}
                                </span>
                              </div>
                              <div className="w-full h-1.5 bg-[#3A6131]/10 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all duration-300 ${
                                    newPass.length < 6 ? "bg-red-500 w-1/4"
                                    : newPass.length < 10 ? "bg-[#F7B71D] w-1/2"
                                    : "bg-[#3A6131] w-full"
                                  }`}
                                />
                              </div>
                            </div>
                          )}

                          <AnimatePresence>
                            {passError && (
                              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="bg-red-50 border border-red-100 rounded-2xl p-4 text-left">
                                <p className="text-red-600 text-xs font-bold m-0">{passError}</p>
                              </motion.div>
                            )}
                            {passSaved && (
                              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="bg-[#3A6131]/10 border border-[#3A6131]/20 rounded-2xl p-4 text-left flex items-center gap-2">
                                <Check size={16} className="text-[#3A6131]" />
                                <p className="text-[#3A6131] text-xs font-bold m-0">Password updated successfully.</p>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </motion.div>
                    )}

                    {/* ── NOTIFICATIONS TAB ── */}
                    {activeTab === "notifications" && (
                      <motion.div key="notifications" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                        <div className="mb-6">
                          <span className="bg-[#F7B71D]/15 text-[#385E31] text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">Global Settings</span>
                          <h3 className="text-2xl font-black text-[#3A6131] mt-2 font-raleway italic">Alerts & Notifications</h3>
                          <p className="text-[11px] text-[#3A6131]/50 leading-relaxed mt-2 font-bold max-w-md">
                            Choose which events you'd like to be alerted about. These apply globally across the tenant platform.
                          </p>
                        </div>

                        <div className="grid grid-cols-1 gap-3 max-w-lg">
                          {notifItems.map(({ key, label, desc }) => (
                            <div
                              key={key}
                              className="flex items-center justify-between p-5 bg-white rounded-[24px] border border-[#3A6131]/10 shadow-sm text-left hover:border-[#3A6131]/30 transition-all"
                            >
                              <div className="flex flex-col pr-4">
                                <span className="text-[#3A6131] text-sm font-bold font-inter">{label}</span>
                                <span className="text-[11px] text-[#3A6131]/50 font-bold mt-1 leading-tight">{desc}</span>
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

                {/* ================= FOOTER BUTTONS ================= */}
                <div className="px-8 py-5 border-t border-[#3A6131]/10 bg-white/80 flex justify-between items-center z-20 shrink-0">
                  <button
                    onClick={onClose}
                    className="text-[#3A6131]/50 text-sm font-bold hover:text-[#3A6131] transition-colors cursor-pointer border-0 bg-transparent"
                  >
                    Cancel
                  </button>
                  
                  {activeTab === "security" ? (
                    <button
                      type="button"
                      onClick={handlePasswordSave}
                      disabled={isSavingPass}
                      className="bg-[#3A6131] text-[#FFFCEB] px-8 py-3 rounded-2xl text-sm font-bold flex items-center gap-2 hover:opacity-90 transition-opacity shadow-md disabled:opacity-60 disabled:cursor-not-allowed border-0 cursor-pointer"
                    >
                      {isSavingPass ? <><Loader2 size={16} className="animate-spin" /> Updating...</> : "Update Password"}
                    </button>
                  ) : (
                    <div className="flex items-center gap-4">
                      <AnimatePresence>
                        {notifSaved && (
                          <motion.span initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="text-[#3A6131] text-xs font-bold flex items-center gap-1">
                            <Check size={14} /> Saved!
                          </motion.span>
                        )}
                      </AnimatePresence>
                      <button
                        type="button"
                        onClick={handleNotifSave}
                        disabled={isSaving}
                        className="bg-[#3A6131] text-[#FFFCEB] px-8 py-3 rounded-2xl text-sm font-bold flex items-center gap-2 hover:opacity-90 transition-opacity shadow-md disabled:opacity-60 disabled:cursor-not-allowed border-0 cursor-pointer"
                      >
                        {isSaving ? <><Loader2 size={16} className="animate-spin" /> Saving...</> : "Save Preferences"}
                      </button>
                    </div>
                  )}
                </div>

              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}