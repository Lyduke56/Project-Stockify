"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  businessName: string;
}

const easeOutQuint: [number, number, number, number] = [0.22, 1, 0.36, 1];

// Shared input className — identical to the login page inputs
const inputClass =
  "w-full bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 font-['Fredoka'] text-[15px] px-4 py-3.5 rounded-2xl outline-none focus:bg-white focus:border-[#385E31] focus:ring-4 focus:ring-[#385E31]/10 transition-all duration-300";

export default function RegistrationForm({ businessName }: Props) {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  // Password strength: 0–4
  const passwordStrength = (() => {
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    return score;
  })();

  const strengthLabel = ["", "Weak", "Fair", "Good", "Strong"][passwordStrength];
  const strengthColor = ["", "#ef4444", "#f97316", "#eab308", "#22c55e"][passwordStrength];

  const validate = () => {
    if (!email.trim()) return "Email is required.";
    if (!/\S+@\S+\.\S+/.test(email)) return "Enter a valid email address.";
    if (!password) return "Password is required.";
    if (password.length < 8) return "Password must be at least 8 characters.";
    if (password !== confirmPassword) return "Passwords do not match.";
    return null;
  };

  if (!businessName) {
    setError("Invalid business URL. Please check the link.");
    setLoading(false);
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validate();
    if (err) { setError(err); return; }
    setError("");
    setLoading(true);

    const { data: tenant, error: tenantErr } = await supabase
      .from("tenants")
      .select("tenant_id, is_active, subscription_status")
      .ilike("business_name", businessName.replace(/-/g, " "))
      .maybeSingle();

    if (tenantErr || !tenant) {
      setLoading(false);
      setError("Business not found. Please check the URL.");
      return;
    }

    if (!tenant.is_active || tenant.subscription_status === "Suspended") {
      setLoading(false);
      setError("This store is currently unavailable.");
      return;
    }

    const redirectTo = `${window.location.origin}/${businessName}/customer/complete-profile`;

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectTo,
        data: { business_name: businessName },
      },
    });

    setLoading(false);

    if (signUpError) {
      if (signUpError.message.toLowerCase().includes("already registered")) {
        setError("This email is already registered. Try signing in instead.");
      } else {
        setError(signUpError.message);
      }
      return;
    }

    setSent(true);
  };

  // ── Success state ─────────────────────────────────────────────────────────
  if (sent) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: easeOutQuint }}
        className="flex flex-col items-center text-center gap-4 py-4"
      >
        <motion.div
          initial={{ scale: 0, rotate: -15 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", bounce: 0.5, delay: 0.1 }}
          className="w-20 h-20 rounded-full bg-[#385E31] flex items-center justify-center shadow-[0_8px_20px_rgba(56,94,49,0.3)] mb-2"
        >
          <svg className="w-10 h-10 text-[#F7B71D]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </motion.div>
        <h2 className="font-['Fredoka'] font-bold text-[28px] text-gray-900">Check Your Email!</h2>
        <p className="font-['Fredoka'] text-[15px] text-gray-500 leading-relaxed max-w-[280px]">
          We sent a confirmation link to{" "}
          <span className="font-semibold text-[#385E31]">{email}</span>
        </p>
        <div className="mt-2 w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4">
          <p className="font-['Fredoka'] text-[13px] text-gray-500 leading-relaxed">
            <span className="mr-1">💡</span> Didn't get it? Check your spam folder. The link expires in 24 hours.
          </p>
        </div>
        <button
          type="button"
          onClick={() => router.push(`/${businessName}/login`)}
          className="mt-2 font-['Fredoka'] text-[14px] text-[#385E31] font-bold hover:text-[#F7B71D] transition-colors duration-300"
        >
          Back to Sign In
        </button>
      </motion.div>
    );
  }

  // ── Registration form ─────────────────────────────────────────────────────
  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>

      {/* Error message — same style as login page */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: -6 }}
            animate={{ opacity: 1, height: "auto", y: 0 }}
            exit={{ opacity: 0, height: 0, y: -6 }}
            transition={{ duration: 0.35, ease: easeOutQuint }}
            className="overflow-hidden"
          >
            <div className="font-['Fredoka'] text-[14px] font-medium text-red-600 bg-red-50 border border-red-100 px-4 py-3 rounded-2xl flex items-start gap-2">
              <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Email */}
      <div className="flex flex-col gap-1.5">
        <label className="font-['Fredoka'] text-[14px] text-gray-700 pl-1 font-semibold">
          Email Address
        </label>
        <input
          type="email"
          placeholder="name@example.com"
          value={email}
          onChange={(e) => { setEmail(e.target.value); setError(""); }}
          required
          className={inputClass}
        />
      </div>

      {/* Password */}
      <div className="flex flex-col gap-1.5">
        <label className="font-['Fredoka'] text-[14px] text-gray-700 pl-1 font-semibold">
          Password
        </label>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Min. 8 characters"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(""); }}
            required
            className={`${inputClass} pr-12`}
          />
          <EyeToggle show={showPassword} onToggle={() => setShowPassword(!showPassword)} />
        </div>

        {/* Strength bar */}
        <AnimatePresence>
          {password && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: easeOutQuint }}
              className="flex items-center gap-2.5 px-1 mt-0.5"
            >
              <div className="flex gap-1.5 flex-1">
                {[1, 2, 3, 4].map((n) => (
                  <div
                    key={n}
                    className="h-1.5 flex-1 rounded-full transition-all duration-300"
                    style={{ background: passwordStrength >= n ? strengthColor : "#e5e7eb" }}
                  />
                ))}
              </div>
              <span
                className="font-['Fredoka'] text-[12px] font-bold w-12 text-right"
                style={{ color: strengthColor }}
              >
                {strengthLabel}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Confirm Password */}
      <div className="flex flex-col gap-1.5">
        <label className="font-['Fredoka'] text-[14px] text-gray-700 pl-1 font-semibold">
          Confirm Password
        </label>
        <div className="relative">
          <input
            type={showConfirm ? "text" : "password"}
            placeholder="Re-enter your password"
            value={confirmPassword}
            onChange={(e) => { setConfirmPassword(e.target.value); setError(""); }}
            required
            className={`${inputClass} pr-12 ${
              confirmPassword && password !== confirmPassword
                ? "border-red-300 focus:border-red-400 focus:ring-red-500/10"
                : ""
            }`}
          />
          <EyeToggle show={showConfirm} onToggle={() => setShowConfirm(!showConfirm)} />
        </div>
        {confirmPassword && password !== confirmPassword && (
          <p className="font-['Fredoka'] text-[12px] text-red-500 pl-1">Passwords do not match</p>
        )}
      </div>

      {/* Submit button — identical to login's Sign In button */}
      <div className="pt-2">
        <motion.button
          type="submit"
          disabled={loading}
          whileHover={{ scale: loading ? 1 : 1.015 }}
          whileTap={{ scale: loading ? 1 : 0.98 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="relative w-full bg-[#385E31] text-[#FFFCEB] font-['Fredoka'] font-bold tracking-wide text-[17px] py-4 rounded-2xl hover:bg-[#2A4725] shadow-[0_8px_20px_rgba(56,94,49,0.3)] disabled:opacity-70 disabled:cursor-not-allowed transition-colors duration-300 overflow-hidden"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Creating Account...
            </span>
          ) : (
            "Create Account"
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent pointer-events-none" />
        </motion.button>
      </div>

      {/* Sign in link — same style as login's register link */}
      <p className="font-['Fredoka'] text-[14px] text-gray-500 text-center mt-1">
        Already have an account?{" "}
        <button
          type="button"
          onClick={() => router.push(`/${businessName}/login`)}
          className="text-[#385E31] font-bold hover:text-[#F7B71D] transition-colors duration-300"
        >
          Sign in here
        </button>
      </p>
    </form>
  );
}

// ── Eye toggle — same icon set as login page ──────────────────────────────────
function EyeToggle({ show, onToggle }: { show: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none"
    >
      {show ? (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      )}
    </button>
  );
}