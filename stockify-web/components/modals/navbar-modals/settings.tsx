"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  colors?: {
    color_primary?: string;
    color_background?: string;
    color_secondary?: string;
    color_accent?: string;
    color_text?: string;
    color_sidebar_text?: string;
  };
}

type Tab = "security";

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


// --- Main Modal Component ---
export default function SettingsModal({ isOpen, onClose, colors }: SettingsModalProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const [activeTab] = useState<Tab>("security");
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

  const tabs: { key: Tab; label: string; Icon: React.FC }[] = [
    { key: "security", label: "Security", Icon: ShieldIcon },
  ];

  // ── Styles matched to FnbItemModal ──
  const labelStyle = "text-[11px] font-black uppercase tracking-[0.12em] text-primary/50 mb-2 block";
  const inputStyle = "w-full bg-background border-[1.5px] border-primary rounded-2xl px-4 py-3 text-sm text-primary font-medium focus:outline-none hover:border-accent focus:border-accent focus:ring-4 focus:ring-accent/10 transition-all placeholder:text-gray-300";

  const modalStyles = {
    "--color-primary": colors?.color_primary || "#385E31",
    "--color-background": colors?.color_background || "#FFFCEB",
    "--color-secondary": colors?.color_secondary || "#2A4725",
    "--color-accent": colors?.color_accent || "#E5AC24",
    "--color-sidebar-text": colors?.color_sidebar_text || "#FFF9D7",
  } as React.CSSProperties;

  return createPortal(
    <div style={modalStyles} className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
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
        className="w-full max-w-[920px] bg-background rounded-[32px] overflow-hidden border-[1.5px] border-accent/20 shadow-[0_32px_80px_rgba(58,97,49,0.2)] flex flex-col md:flex-row h-[650px] font-['Inter'] relative z-10"
      >
        {/* LEFT SIDEBAR */}
        <div className="w-full md:w-[320px] bg-primary p-10 flex flex-col relative overflow-hidden shrink-0">
          <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-accent/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10">
            <div className="bg-accent w-12 h-1 rounded-full mb-8" />
            <h2 className="text-sidebar-text text-3xl font-black leading-tight mb-2 tracking-wide uppercase">
              Settings
            </h2>
            <p className="text-sidebar-text/60 text-xs font-medium leading-relaxed mb-12">
              Manage your account security, passwords, and notification preferences here.
            </p>
            <nav className="flex flex-col gap-8">
              {tabs.map((t) => (
                <button
                  key={t.key}
                  className="flex items-center gap-4 transition-all duration-300 w-full text-left outline-none translate-x-2"
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                      activeTab === t.key
                        ? "bg-accent text-primary shadow-lg shadow-accent/20"
                        : "bg-sidebar-text/10 text-sidebar-text"
                    }`}
                  >
                    <t.Icon />
                  </div>
                  <span
                    className={`text-sm font-bold tracking-wide ${
                      activeTab === t.key ? "text-sidebar-text" : "text-sidebar-text/80"
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
                    activeTab === t.key ? "w-8 bg-accent" : "w-2 bg-sidebar-text/20"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT CONTENT */}
        <div className="flex-1 flex flex-col relative bg-background/50 backdrop-blur-sm">

          <div className="flex-1 overflow-y-auto p-10 [&::-webkit-scrollbar]:w-[5px] [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-primary/15 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-primary/25">
            {/* Feedback Banners */}
            {passError && (
              <div className="mb-6 px-4 py-3 bg-red-50 border border-red-200 rounded-2xl text-red-600 text-xs font-semibold">
                {passError}
              </div>
            )}
            {passSaved && (
              <div className="mb-6 px-4 py-3 bg-primary/10 border border-primary/20 rounded-2xl text-primary text-xs font-semibold">
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
                    <h3 className="text-2xl font-black text-primary mt-2 italic font-['Raleway']">
                      Security & Password
                    </h3>
                    <p className="text-[12px] text-primary/60 font-medium leading-relaxed mt-2">
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
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-primary/40 hover:text-primary transition-colors"
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
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-primary/40 hover:text-primary transition-colors"
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
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-primary/40 hover:text-primary transition-colors"
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
                        <span className="text-primary/50">Password strength</span>
                        <span
                          className={
                            newPass.length < 6
                              ? "text-red-500"
                              : newPass.length < 10
                              ? "text-accent"
                              : "text-primary"
                          }
                        >
                          {newPass.length < 6 ? "Weak" : newPass.length < 10 ? "Fair" : "Strong"}
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-primary/10 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            newPass.length < 6
                              ? "bg-red-500 w-1/4"
                              : newPass.length < 10
                              ? "bg-accent w-1/2"
                              : "bg-primary w-full"
                          }`}
                        />
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer */}
          <div className="px-8 py-5 border-t border-primary/10 bg-background/80 flex justify-end items-center z-20 shrink-0">
            <button
              onClick={handlePasswordSave}
              disabled={saving}
              className="bg-primary text-background px-8 py-3 rounded-2xl text-sm font-bold flex items-center gap-2 hover:opacity-90 transition-opacity shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <LoaderIcon /> Saving...
                </>
              ) : (
                <>Update Password</>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>,
    document.body
  );
}