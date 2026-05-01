"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import type { User } from "@supabase/supabase-js";

interface Props {
  user: User;
  businessName: string;
}

type Gender = "Male" | "Female" | "Prefer not to say" | "";

interface FormData {
  firstName: string;
  lastName: string;
  middleName: string;
  suffix: string;
  contactNumber: string;
  address: string;
  gender: Gender;
  citizenship: string;
}

const INITIAL: FormData = {
  firstName: "",
  lastName: "",
  middleName: "",
  suffix: "",
  contactNumber: "",
  address: "",
  gender: "",
  citizenship: "",
};

const CITIZENSHIP_OPTIONS = [
  { code: "PH", flag: "🇵🇭", label: "Filipino" },
  { code: "US", flag: "🇺🇸", label: "American" },
  { code: "CN", flag: "🇨🇳", label: "Chinese" },
  { code: "JP", flag: "🇯🇵", label: "Japanese" },
  { code: "KR", flag: "🇰🇷", label: "Korean" },
  { code: "GB", flag: "🇬🇧", label: "British" },
  { code: "AU", flag: "🇦🇺", label: "Australian" },
  { code: "CA", flag: "🇨🇦", label: "Canadian" },
  { code: "DE", flag: "🇩🇪", label: "German" },
  { code: "FR", flag: "🇫🇷", label: "French" },
  { code: "IN", flag: "🇮🇳", label: "Indian" },
  { code: "SG", flag: "🇸🇬", label: "Singaporean" },
  { code: "MY", flag: "🇲🇾", label: "Malaysian" },
  { code: "ID", flag: "🇮🇩", label: "Indonesian" },
  { code: "TH", flag: "🇹🇭", label: "Thai" },
  { code: "VN", flag: "🇻🇳", label: "Vietnamese" },
  { code: "OTHER", flag: "🌐", label: "Other" },
];

function CitizenshipDropdown({
  value,
  onChange,
}: {
  value: string;
  onChange: (val: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const selected = CITIZENSHIP_OPTIONS.find((c) => c.label === value);
  const filtered = CITIZENSHIP_OPTIONS.filter((c) =>
    c.label.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => searchRef.current?.focus(), 50);
  }, [open]);

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => { setOpen((o) => !o); setSearch(""); }}
        className="w-full bg-[#FFD980]/60 text-[#3A3A3A] font-['Fredoka'] text-[14px] px-4 py-3 rounded-2xl outline-none focus:ring-2 focus:ring-[#385E31] focus:bg-[#FFD980]/80 transition-all border border-[#F7B71D]/30 flex items-center justify-between gap-2"
      >
        <span className="flex items-center gap-2 truncate">
          {selected ? (
            <>
              <span className="text-base leading-none">{selected.flag}</span>
              <span>{selected.label}</span>
            </>
          ) : (
            <span className="text-[#A88D40]">Select citizenship...</span>
          )}
        </span>
        <svg
          className={`w-4 h-4 shrink-0 text-[#385E31] transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
        </svg>
      </button>

      {/* Dropdown panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 mt-1.5 w-full bg-[#FFFCEB] border border-[#F7B71D]/40 rounded-2xl shadow-xl overflow-hidden"
          >
            {/* Search */}
            <div className="p-2.5 border-b border-[#F7B71D]/20">
              <div className="relative">
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#385E31]/50"
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                </svg>
                <input
                  ref={searchRef}
                  type="text"
                  placeholder="Search..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-[#FFD980]/60 text-[#3A3A3A] font-['Fredoka'] text-[13px] pl-8 pr-3 py-2 rounded-xl outline-none focus:ring-2 focus:ring-[#385E31] border border-[#F7B71D]/30 placeholder-[#A88D40]"
                />
              </div>
            </div>

            {/* Options */}
            <ul className="max-h-44 overflow-y-auto py-1">
              {filtered.length === 0 ? (
                <li className="px-4 py-2 text-[13px] font-['Fredoka'] text-[#A88D40] text-center">
                  No results
                </li>
              ) : (
                filtered.map((c) => (
                  <li key={c.code}>
                    <button
                      type="button"
                      onClick={() => { onChange(c.label); setOpen(false); setSearch(""); }}
                      className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-left font-['Fredoka'] text-[14px] transition-colors hover:bg-[#FFD980]/50 ${
                        value === c.label
                          ? "bg-[#FFD980]/70 text-[#385E31] font-semibold"
                          : "text-[#3A3A3A]"
                      }`}
                    >
                      <span className="text-base leading-none">{c.flag}</span>
                      <span>{c.label}</span>
                      {value === c.label && (
                        <svg className="ml-auto w-3.5 h-3.5 text-[#385E31]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                  </li>
                ))
              )}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function CompleteProfileForm({ user, businessName }: Props) {
  const router = useRouter();
  const supabase = createClient();

  const [form, setForm] = useState<FormData>(INITIAL);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError("");
  };

  const validate = () => {
    if (!form.firstName.trim()) return "First name is required.";
    if (!form.lastName.trim()) return "Last name is required.";
    if (!form.contactNumber.trim()) return "Contact number is required.";
    if (!form.address.trim()) return "Address is required.";
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validate();
    if (err) { setError(err); return; }
    setError("");
    setLoading(true);

    const { data: tenant, error: tenantErr } = await supabase
      .from("tenants")
      .select("tenant_id, business_type")
      .ilike("business_name", businessName.replace(/-/g, " "))
      .maybeSingle();

    if (tenantErr || !tenant) {
      setLoading(false);
      setError("Could not find the business. Please contact support.");
      return;
    }

    const typeSlug =
      tenant.business_type === "Food & Beverage"
        ? "food-and-beverage"
        : "non-food-and-beverage";

    const { error: insertErr } = await supabase.from("users").insert({
      user_id: user.id,
      tenant_id: tenant.tenant_id,
      email: user.email,
      role: "Customer",
      first_name: form.firstName.trim(),
      last_name: form.lastName.trim(),
      middle_name: form.middleName.trim() || null,
      suffix: form.suffix.trim() || null,
      display_name: `${form.firstName.trim()} ${form.lastName.trim()}`,
      contact_number: form.contactNumber.trim(),
      address: form.address.trim(),
      gender: form.gender || null,
      citizenship: form.citizenship.trim() || null,
      is_active: true,
    });

    setLoading(false);

    if (insertErr) {
      if (insertErr.code === "23505") {
        router.push(`/${businessName}/customer/${typeSlug}/storefront`);
        return;
      }
      setError("Failed to save profile: " + insertErr.message);
      return;
    }

    router.push(`/${businessName}/customer/${typeSlug}/storefront`);
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="font-['Fredoka'] text-[13px] text-red-600 bg-red-50 border border-red-200 px-4 py-2.5 rounded-2xl text-center"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>

      {/* Linked email — read-only */}
      <div className="flex flex-col gap-1">
        <label className="font-['Fredoka'] text-[12px] text-[#6B7C65] pl-2 font-semibold">
          Email (confirmed)
        </label>
        <div className="flex items-center gap-2 bg-[#E8EDDE] px-5 py-3 rounded-2xl border border-[#C8D5B9]">
          <svg className="w-4 h-4 text-[#385E31] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          <span className="font-['Fredoka'] text-[14px] text-[#385E31] font-semibold truncate">
            {user.email}
          </span>
        </div>
      </div>

      {/* Name row */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label className="font-['Fredoka'] text-[12px] text-[#6B7C65] pl-2 font-semibold">
            First Name <span className="text-red-400">*</span>
          </label>
          <input
            name="firstName" type="text" placeholder="Juan"
            value={form.firstName} onChange={handleChange}
            className="w-full bg-[#FFD980]/60 placeholder-[#A88D40] text-[#3A3A3A] font-['Fredoka'] text-[14px] px-4 py-3 rounded-2xl outline-none focus:ring-2 focus:ring-[#385E31] focus:bg-[#FFD980]/80 transition-all border border-[#F7B71D]/30"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="font-['Fredoka'] text-[12px] text-[#6B7C65] pl-2 font-semibold">
            Last Name <span className="text-red-400">*</span>
          </label>
          <input
            name="lastName" type="text" placeholder="Dela Cruz"
            value={form.lastName} onChange={handleChange}
            className="w-full bg-[#FFD980]/60 placeholder-[#A88D40] text-[#3A3A3A] font-['Fredoka'] text-[14px] px-4 py-3 rounded-2xl outline-none focus:ring-2 focus:ring-[#385E31] focus:bg-[#FFD980]/80 transition-all border border-[#F7B71D]/30"
          />
        </div>
      </div>

      {/* Middle name + suffix */}
      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-2 flex flex-col gap-1">
          <label className="font-['Fredoka'] text-[12px] text-[#6B7C65] pl-2 font-semibold">
            Middle Name
          </label>
          <input
            name="middleName" type="text" placeholder="Santos"
            value={form.middleName} onChange={handleChange}
            className="w-full bg-[#FFD980]/60 placeholder-[#A88D40] text-[#3A3A3A] font-['Fredoka'] text-[14px] px-4 py-3 rounded-2xl outline-none focus:ring-2 focus:ring-[#385E31] focus:bg-[#FFD980]/80 transition-all border border-[#F7B71D]/30"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="font-['Fredoka'] text-[12px] text-[#6B7C65] pl-2 font-semibold">
            Suffix
          </label>
          <input
            name="suffix" type="text" placeholder="Jr."
            value={form.suffix} onChange={handleChange}
            className="w-full bg-[#FFD980]/60 placeholder-[#A88D40] text-[#3A3A3A] font-['Fredoka'] text-[14px] px-4 py-3 rounded-2xl outline-none focus:ring-2 focus:ring-[#385E31] focus:bg-[#FFD980]/80 transition-all border border-[#F7B71D]/30"
          />
        </div>
      </div>

      {/* Contact + Gender */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label className="font-['Fredoka'] text-[12px] text-[#6B7C65] pl-2 font-semibold">
            Contact No. <span className="text-red-400">*</span>
          </label>
          <input
            name="contactNumber" type="tel" placeholder="+63 9XX XXX XXXX"
            value={form.contactNumber} onChange={handleChange}
            className="w-full bg-[#FFD980]/60 placeholder-[#A88D40] text-[#3A3A3A] font-['Fredoka'] text-[14px] px-4 py-3 rounded-2xl outline-none focus:ring-2 focus:ring-[#385E31] focus:bg-[#FFD980]/80 transition-all border border-[#F7B71D]/30"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="font-['Fredoka'] text-[12px] text-[#6B7C65] pl-2 font-semibold">
            Gender
          </label>
          <select
            name="gender" value={form.gender} onChange={handleChange}
            className="w-full bg-[#FFD980]/60 text-[#3A3A3A] font-['Fredoka'] text-[14px] px-4 py-3 rounded-2xl outline-none focus:ring-2 focus:ring-[#385E31] focus:bg-[#FFD980]/80 transition-all border border-[#F7B71D]/30 appearance-none cursor-pointer"
          >
            <option value="">Select...</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Prefer not to say">Prefer not to say</option>
          </select>
        </div>
      </div>

      {/* Address */}
      <div className="flex flex-col gap-1">
        <label className="font-['Fredoka'] text-[12px] text-[#6B7C65] pl-2 font-semibold">
          Address <span className="text-red-400">*</span>
        </label>
        <input
          name="address" type="text" placeholder="Cebu City, Cebu, Philippines"
          value={form.address} onChange={handleChange}
          className="w-full bg-[#FFD980]/60 placeholder-[#A88D40] text-[#3A3A3A] font-['Fredoka'] text-[14px] px-4 py-3 rounded-2xl outline-none focus:ring-2 focus:ring-[#385E31] focus:bg-[#FFD980]/80 transition-all border border-[#F7B71D]/30"
        />
      </div>

      {/* Citizenship — searchable dropdown */}
      <div className="flex flex-col gap-1">
        <label className="font-['Fredoka'] text-[12px] text-[#6B7C65] pl-2 font-semibold">
          Citizenship
        </label>
        <CitizenshipDropdown
          value={form.citizenship}
          onChange={(val) => { setForm((prev) => ({ ...prev, citizenship: val })); setError(""); }}
        />
      </div>

      {/* Submit */}
      <motion.button
        type="submit"
        disabled={loading}
        whileHover={{ scale: loading ? 1 : 1.02 }}
        whileTap={{ scale: loading ? 1 : 0.97 }}
        className="mt-2 w-full bg-[#385E31] text-[#F7B71D] font-['Fredoka'] font-bold tracking-wide text-[19px] py-3.5 rounded-2xl hover:bg-[#2A4725] shadow-md disabled:opacity-60 disabled:cursor-not-allowed transition-colors duration-200"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            SAVING...
          </span>
        ) : (
          "COMPLETE REGISTRATION"
        )}
      </motion.button>
    </form>
  );
}