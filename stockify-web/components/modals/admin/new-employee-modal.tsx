"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  User, Shield, X, Mail, Eye, EyeOff, 
  Loader2, AlertCircle, CheckCircle2, ChevronRight 
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const ROLE_OPTIONS = ["Administrator", "Manager", "Employee"];

interface NewEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  colors?: {
    color_primary?: string;
    color_background?: string;
    color_secondary?: string;
    color_accent?: string;
    color_text?: string;
    color_sidebar_text?: string;
  };
}

const STEPS = [
  { id: 1, label: "Personal Details", icon: User },
  { id: 2, label: "Security & Role", icon: Shield },
];

// ── Styles ────────────────────────────────────────────────────

const labelStyle = "text-[11px] font-black uppercase tracking-[0.12em] text-primary/50 mb-2 block";
const inputStyle = "w-full bg-background border-[1.5px] border-primary rounded-2xl px-4 py-3 text-sm text-primary font-medium focus:outline-none hover:border-accent focus:border-accent focus:ring-4 focus:ring-accent/10 transition-all placeholder:text-gray-300";
const selectStyle = "w-full bg-background border-[1.5px] border-primary rounded-2xl px-4 py-3 pr-10 text-sm text-primary font-medium focus:outline-none hover:border-accent focus:border-accent focus:ring-4 focus:ring-accent/10 transition-all placeholder:text-gray-300 appearance-none";

// ── Password input with toggle ────────────────────────────────────────────────
function PasswordInput({
  name,
  value,
  onChange,
  placeholder,
  disabled,
}: {
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder: string;
  disabled: boolean;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input
        name={name}
        type={visible ? "text" : "password"}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        className={`${inputStyle} pr-12`}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        disabled={disabled}
        className="absolute right-4 top-1/2 -translate-y-1/2 text-primary/40 hover:text-primary transition-colors disabled:opacity-30"
        tabIndex={-1}
      >
        {visible ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  );
}

// ── Main modal ────────────────────────────────────────────────────────────────
export default function NewEmployeeModal({ isOpen, onClose, onSuccess, colors }: NewEmployeeModalProps) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [success, setSuccess] = useState("");
  
  const [counts, setCounts] = useState({
    Administrator: 0,
    Manager: 0,
    Employee: 0
  });

  const supabase = createClient();

  useEffect(() => {
    if (isOpen) {
      setStep(1); // Reset to step 1 on open
      fetchRoleCounts();
    }
  }, [isOpen]);

  const fetchRoleCounts = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: userData } = await supabase
      .from("users")
      .select("tenant_id")
      .eq("user_id", user.id)
      .single();

    if (userData?.tenant_id) {
      const { data: users } = await supabase
        .from("users")
        .select("role")
        .eq("tenant_id", userData.tenant_id);

      if (users) {
        const roles = users.map((u: any) => u.role);
        setCounts({
          Administrator: roles.filter((r: string) => r === 'Administrator').length,
          Manager: roles.filter((r: string) => r === 'Manager').length,
          Employee: roles.filter((r: string) => r === 'Employee').length
        });
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError("");
  };

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, role: e.target.value }));
    setError("");
  };

  const handleNextStep = () => {
    if (!form.name.trim() || !form.email.trim()) {
      setError("Name and Email are required.");
      return;
    }
    // Basic email validation
    if (!/\S+@\S+\.\S+/.test(form.email)) {
      setError("Please enter a valid email address.");
      return;
    }
    setError("");
    setStep(2);
  };

  const handleConfirm = async () => {
    if (!form.role) {
      setError("Please select an access level.");
      return;
    }
    if (!form.password || !form.confirmPassword) {
      setError("Passwords are required.");
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res  = await fetch("/api/admin/create-employee", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create employee.");

      setSuccess("Employee created! A confirmation email has been sent.");
      setTimeout(() => {
        handleClose();
        onSuccess?.();
      }, 1500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (loading) return;
    setForm({ name: "", email: "", password: "", confirmPassword: "", role: "" });
    setError("");
    setSuccess("");
    onClose();
  };

  const modalStyles = {
    "--color-primary": colors?.color_primary || "#385E31",
    "--color-background": colors?.color_background || "#FFFCEB",
    "--color-secondary": colors?.color_secondary || "#2A4725",
    "--color-accent": colors?.color_accent || "#E5AC24",
  } as React.CSSProperties;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            key="new-employee-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[200]"
            onClick={handleClose}
          />
          
          <motion.div
            key="new-employee-modal"
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ duration: 0.3, type: "spring", bounce: 0.25 }}
            className="fixed inset-0 z-[201] flex items-center justify-center p-4 pointer-events-none"
          >
            <div
              style={modalStyles}
              className="w-full max-w-[920px] bg-background rounded-[32px] overflow-hidden border-[1.5px] border-accent/20 shadow-[0_32px_80px_rgba(58,97,49,0.2)] flex flex-col md:flex-row h-[600px] font-inter pointer-events-auto"
            >
              
              {/* LEFT SIDEBAR */}
              <div className="w-full md:w-[320px] bg-primary p-10 flex flex-col relative overflow-hidden shrink-0">
                <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-accent/10 rounded-full blur-3xl" />
                <div className="relative z-10">
                  <div className="bg-accent w-12 h-1 rounded-full mb-8" />
                  <h2 className="text-background font-raleway text-3xl font-black leading-tight mb-2">
                    Add Employee
                  </h2>
                  <p className="text-background/60 text-xs font-medium leading-relaxed mb-12">
                    Create a new staff account and assign their system permissions.
                  </p>
                  <nav className="flex flex-col gap-8">
                    {STEPS.map((s) => (
                      <div key={s.id} className={`flex items-center gap-4 transition-all duration-300 ${step === s.id ? "translate-x-2" : "opacity-40"}`}>
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${step === s.id ? "bg-accent text-primary shadow-lg shadow-accent/20" : "bg-white/10 text-white"}`}>
                          <s.icon size={18} strokeWidth={2.5} />
                        </div>
                        <span className={`text-sm font-bold tracking-wide ${step === s.id ? "text-background" : "text-white"}`}>{s.label}</span>
                      </div>
                    ))}
                  </nav>
                </div>
                <div className="mt-auto relative z-10">
                  <div className="flex gap-2">
                    {[1, 2].map((i) => (
                      <div key={i} className={`h-1.5 rounded-full transition-all duration-500 ${step === i ? "w-8 bg-accent" : "w-2 bg-white/20"}`} />
                    ))}
                  </div>
                </div>
              </div>

              {/* RIGHT CONTENT */}
              <div className="flex-1 flex flex-col relative bg-background backdrop-blur-sm">
                <button onClick={handleClose} disabled={loading} className="absolute top-6 right-6 w-10 h-10 rounded-full bg-background border border-primary/10 flex items-center justify-center text-primary hover:bg-primary hover:text-background transition-all z-20 disabled:opacity-50">
                  <X size={20} strokeWidth={2.5} />
                </button>

                <div className="flex-1 overflow-y-auto p-10 [&::-webkit-scrollbar]:w-[5px] [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-primary/15 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-primary/25">
                  
                  {/* Status Messages */}
                  {error && (
                    <div className="mb-6 px-4 py-3 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3">
                      <AlertCircle size={18} className="text-red-500 shrink-0 mt-0.5" />
                      <p className="text-red-700 text-[13px] font-semibold">{error}</p>
                    </div>
                  )}
                  {success && (
                    <div className="mb-6 px-4 py-3 bg-green-50 border border-green-200 rounded-2xl flex items-start gap-3">
                      <CheckCircle2 size={18} className="text-green-600 shrink-0 mt-0.5" />
                      <p className="text-green-700 text-[13px] font-semibold">{success}</p>
                    </div>
                  )}

                  <AnimatePresence mode="wait">
                    {/* ── STEP 1: PERSONAL INFO ── */}
                    {step === 1 && (
                      <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                        <div className="mb-8">
                          <span className="bg-accent/15 text-primary text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">Step 01</span>
                          <h3 className="text-2xl font-black text-primary mt-2 font-raleway italic">Personal Details</h3>
                        </div>
                        
                        <div className="space-y-6">
                          <div>
                            <label className={labelStyle}>Full Name</label>
                            <div className="relative">
                              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/40"><User size={18} /></div>
                              <input
                                name="name"
                                value={form.name}
                                onChange={handleChange}
                                placeholder="e.g. Juan Dela Cruz"
                                disabled={loading}
                                className={`${inputStyle} pl-11`}
                              />
                            </div>
                          </div>

                          <div>
                            <label className={labelStyle}>Email Address</label>
                            <div className="relative">
                              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/40"><Mail size={18} /></div>
                              <input
                                name="email"
                                type="email"
                                value={form.email}
                                onChange={handleChange}
                                placeholder="employee@company.com"
                                disabled={loading}
                                className={`${inputStyle} pl-11`}
                              />
                            </div>
                            <p className="text-[10px] text-primary/40 mt-1.5 pl-1 font-semibold">They will use this email to log in.</p>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* ── STEP 2: SECURITY & ROLE ── */}
                    {step === 2 && (
                      <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                        <div className="mb-6">
                          <span className="bg-accent/15 text-primary text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">Step 02</span>
                          <h3 className="text-2xl font-black text-primary mt-2 font-raleway italic">Security & Role</h3>
                        </div>

                        <div className="space-y-6">
                          <div>
                            <label className={labelStyle}>Assign Role</label>
                            <div className="relative">
                              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/40 z-10"><Shield size={18} /></div>
                              <select
                                value={form.role}
                                onChange={handleRoleChange}
                                disabled={loading}
                                className={`${selectStyle} pl-11 cursor-pointer`}
                              >
                                <option value="" disabled>Select access level</option>
                                {ROLE_OPTIONS.map((r) => {
                                  const isFull = counts[r as keyof typeof counts] >= 1;
                                  return (
                                    <option key={r} value={r} disabled={isFull}>
                                      {r} {isFull ? "(Limit Reached)" : ""}
                                    </option>
                                  );
                                })}
                              </select>
                              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-primary/40 pointer-events-none z-10">
                                <ChevronRight size={18} className="rotate-90" />
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className={labelStyle}>Password</label>
                              <PasswordInput
                                name="password"
                                value={form.password}
                                onChange={handleChange}
                                placeholder="Min. 8 chars"
                                disabled={loading}
                              />
                            </div>
                            <div>
                              <label className={labelStyle}>Confirm Password</label>
                              <PasswordInput
                                name="confirmPassword"
                                value={form.confirmPassword}
                                onChange={handleChange}
                                placeholder="Verify password"
                                disabled={loading}
                              />
                            </div>
                          </div>
                          
                          <div className="mt-4 p-4 rounded-2xl bg-primary/5 border border-primary/10 flex flex-col gap-1">
                            <span className="text-[11px] font-bold text-primary">Security Notice</span>
                            <span className="text-xs text-primary/60 font-medium">Please ensure the provided password is secure and shared safely with the new employee.</span>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Footer Actions */}
                <div className="px-8 py-5 border-t border-primary bg-background flex justify-between items-center z-20 shrink-0">
                  <button
                    onClick={() => step > 1 ? setStep(step - 1) : handleClose()}
                    disabled={loading}
                    className="text-primary/50 text-sm font-bold hover:text-primary transition-colors disabled:opacity-50"
                  >
                    {step === 1 ? "Cancel" : "Back"}
                  </button>
                  
                  <button
                    onClick={() => step === 1 ? handleNextStep() : handleConfirm()}
                    disabled={loading}
                    className="bg-primary text-background px-8 py-3 rounded-2xl text-sm font-bold flex items-center gap-2 hover:opacity-90 transition-opacity shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <><Loader2 size={16} className="animate-spin" /> Processing…</>
                    ) : (
                      <>{step === 1 ? "Continue" : "Create Employee"} <ChevronRight size={16} /></>
                    )}
                  </button>
                </div>

              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}