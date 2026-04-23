"use client";
import { useState } from "react";

const ROLE_OPTIONS = ["Manager", "Employee"];

interface NewEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

// ── Eye icon helper ───────────────────────────────────────────────────────────
function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    // Eye open
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7A6200" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  ) : (
    // Eye closed
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7A6200" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/>
      <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  );
}

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
        className="w-full px-4 py-2 pr-10 rounded-xl bg-[#FFD980] placeholder-[#7A6200] text-[#3B2E00] font-medium outline-none border-2 border-transparent focus:border-[#385E31] transition disabled:opacity-60"
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        disabled={disabled}
        className="absolute right-3 top-1/2 -translate-y-1/2 opacity-70 hover:opacity-100 transition disabled:opacity-30"
        tabIndex={-1}
      >
        <EyeIcon open={visible} />
      </button>
    </div>
  );
}

// ── Main modal ────────────────────────────────────────────────────────────────
export default function NewEmployeeModal({ isOpen, onClose, onSuccess }: NewEmployeeModalProps) {
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

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError("");
  };

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, role: e.target.value }));
    setError("");
  };

  const handleConfirm = async () => {
    if (!form.name || !form.email || !form.password || !form.confirmPassword || !form.role) {
      setError("All fields are required.");
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
        setForm({ name: "", email: "", password: "", confirmPassword: "", role: "" });
        setSuccess("");
        onSuccess?.();
        onClose();
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

  return (
    <>
      <div className="fixed inset-0 z-200 bg-black/60" onClick={handleClose} />

      <div className="fixed inset-0 z-200 flex items-center justify-center pointer-events-none">
        <div
          className="bg-[#FFFCEB] rounded-2xl w-full max-w-md mx-4 shadow-2xl pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-8 pt-8 pb-0">
            <div className="flex items-center justify-center relative mb-1">
              <h2 className="text-[#385E31] text-2xl font-bold uppercase tracking-widest text-center">
                New Employee
              </h2>
              <button
                onClick={handleClose}
                disabled={loading}
                className="absolute right-0 top-1/2 -translate-y-1/2 text-[#385E31] hover:opacity-60 transition disabled:opacity-30"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M15 5L5 15M5 5l10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
            <div className="h-1 w-full bg-[#F7B71D] rounded-full opacity-60 mt-2" />
          </div>

          {/* Body */}
          <div className="px-10 py-6 flex flex-col gap-4">
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Name"
              disabled={loading}
              className="w-full px-4 py-2 rounded-xl bg-[#FFD980] placeholder-[#7A6200] text-[#3B2E00] font-medium outline-none border-2 border-transparent focus:border-[#385E31] transition disabled:opacity-60"
            />

            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="Email"
              disabled={loading}
              className="w-full px-4 py-2 rounded-xl bg-[#FFD980] placeholder-[#7A6200] text-[#3B2E00] font-medium outline-none border-2 border-transparent focus:border-[#385E31] transition disabled:opacity-60"
            />

            {/* ← password fields now use the toggle component */}
            <PasswordInput
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Password"
              disabled={loading}
            />

            <PasswordInput
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm Password"
              disabled={loading}
            />

            {/* Role select */}
            <div className="relative">
              <select
                value={form.role}
                onChange={handleRoleChange}
                disabled={loading}
                className="w-full px-4 py-2 rounded-xl bg-[#FFD980] text-[#7A6200] font-medium outline-none border-2 border-transparent focus:border-[#385E31] transition appearance-none cursor-pointer disabled:opacity-60"
              >
                <option value="" disabled>Role</option>
                {ROLE_OPTIONS.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
              <svg className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M4 6l4 4 4-4" stroke="#7A6200" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>

            {error   && <p className="text-red-600 text-sm font-medium">{error}</p>}
            {success && <p className="text-[#385E31] text-sm font-medium">{success}</p>}
          </div>

          {/* Footer */}
          <div className="flex justify-center gap-4 px-8 pb-8">
            <button
              onClick={handleConfirm}
              disabled={loading}
              className="px-8 py-1 rounded-full bg-[#24481F] text-white font-bold hover:brightness-150 active:scale-95 transition disabled:opacity-60"
            >
              {loading ? "Creating..." : "Confirm"}
            </button>
            <button
              onClick={handleClose}
              disabled={loading}
              className="px-8 py-1 rounded-full bg-[#E5AC24] text-[#24481F] font-bold hover:brightness-80 active:scale-95 transition disabled:opacity-60"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </>
  );
}