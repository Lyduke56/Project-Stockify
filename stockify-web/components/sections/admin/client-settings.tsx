"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { X, Shield, Eye, EyeOff, Loader2, Check } from "lucide-react";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Tab = "security";

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
  const [activeTab] = useState<Tab>("security");

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

  useEffect(() => {
    setMounted(true);
  }, []);

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

  if (!mounted) return null;

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
                    Manage your admin account security and update your password.
                  </p>
                  
                  <div className="flex flex-col gap-8">
                    <div className="flex items-center gap-4 transition-all duration-300 w-full text-left bg-transparent border-0 p-0 translate-x-2">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-[#F7B71D] text-[#385E31] shadow-lg shadow-[#F7B71D]/20">
                        <Shield size={18} strokeWidth={2.5} />
                      </div>
                      <span className="text-sm font-bold tracking-wide text-[#FFFCEB]">
                        Security & Password
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-auto relative z-10">
                  <div className="flex gap-2">
                    <div className="w-8 h-1.5 rounded-full bg-[#F7B71D]" />
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
                  
                  <button
                    type="button"
                    onClick={handlePasswordSave}
                    disabled={isSavingPass}
                    className="bg-[#3A6131] text-[#FFFCEB] px-8 py-3 rounded-2xl text-sm font-bold flex items-center gap-2 hover:opacity-90 transition-opacity shadow-md disabled:opacity-60 disabled:cursor-not-allowed border-0 cursor-pointer"
                  >
                    {isSavingPass ? <><Loader2 size={16} className="animate-spin" /> Updating...</> : "Update Password"}
                  </button>
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