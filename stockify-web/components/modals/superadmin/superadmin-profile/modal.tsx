"use client";

import React, { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";

// ── Types & Mock Data ─────────────────────────────────────────────────────────

interface AdminProfileData {
  name: string;
  email: string;
  contactNumber: string;
  location: string;
  role: string;
  status: string;
  lastLogin: string;
  twoFactorEnabled: boolean;
  avatarUrl: string | null;
}

const MOCK_ADMIN_DATA: AdminProfileData = {
  name: "John Doe",
  email: "johndoe@superadmin.com",
  contactNumber: "+63 912 345 6789",
  location: "Cebu City, Philippines",
  role: "System Superadmin",
  status: "Active",
  lastLogin: "Today, 08:42 AM",
  twoFactorEnabled: true,
  avatarUrl: null,
};

// ── SVGs ──────────────────────────────────────────────────────────────────────

const XIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);
const MailIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </svg>
);
const PhoneIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);
const MapPinIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" />
  </svg>
);
const ShieldCheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" /><path d="m9 12 2 2 4-4" />
  </svg>
);
const ClockIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
  </svg>
);
const LogOutIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" x2="9" y1="12" y2="12" />
  </svg>
);
const LoaderIcon = () => (
  <svg className="animate-spin" xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </svg>
);
const CameraIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
    <circle cx="12" cy="13" r="3" />
  </svg>
);

// ── Field Row ─────────────────────────────────────────────────────────────────

interface FieldRowProps {
  icon: React.ReactNode;
  label: string;
  name: string;
  value: string;
  isEditing: boolean;
  inputType?: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

function FieldRow({ icon, label, name, value, isEditing, inputType = "text", onChange }: FieldRowProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-full bg-[#385E31]/[0.06] flex items-center justify-center shrink-0 text-[#385E31]">
        {icon}
      </div>
      <div className="flex flex-col flex-1">
        <span className="text-[9.5px] font-bold text-[#385E31]/45 uppercase tracking-[0.08em] mb-0.5">
          {label}
        </span>
        {isEditing ? (
          <input
            type={inputType}
            name={name}
            value={value}
            onChange={onChange}
            className="w-full bg-white border border-[#385E31]/20 rounded-lg px-2.5 py-1 text-[13px] font-semibold text-[#385E31] outline-none focus:border-[#F7B71D] transition-colors"
          />
        ) : (
          <span className="text-[13px] font-semibold text-[#385E31]">{value}</span>
        )}
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

interface SuperadminProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  adminData?: AdminProfileData;
}

export default function SuperadminProfileModal({
  isOpen,
  onClose,
  adminData = MOCK_ADMIN_DATA,
}: SuperadminProfileModalProps) {
  const [mounted, setMounted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<AdminProfileData>(adminData);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(adminData.avatarUrl);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setFormData(adminData);
      setAvatarPreview(adminData.avatarUrl);
      setIsEditing(false);
    }
  }, [isOpen, adminData]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setAvatarPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setIsEditing(false);
    }, 1000);
  };

  const handleCancel = () => {
    setFormData(adminData);
    setAvatarPreview(adminData.avatarUrl);
    setIsEditing(false);
  };

  if (!mounted) return null;

  const initials = (formData.name || "A")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-[3px]"
            onClick={!isSaving ? onClose : undefined}
          />

          {/* Hidden File Input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />

          {/* Modal */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ type: "spring", duration: 0.35, bounce: 0.15 }}
            className="relative w-full max-w-[460px] bg-[#FFFCEB] rounded-[28px] overflow-hidden border border-[#385E31]/10 shadow-[0_24px_64px_rgba(56,94,49,0.18)] flex flex-col max-h-[620px] z-10"
          >
            {/* ── BANNER ── */}
            <div className="bg-[#385E31] px-5 pt-5 pb-0 relative flex-shrink-0">
              {/* Close button — hidden while editing */}
              {!isEditing && (
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/35 transition-colors z-10"
                >
                  <XIcon />
                </button>
              )}

              {/* Avatar — overflows banner into scroll body via translateY */}
              <div
                className={`w-20 h-20 rounded-[18px] bg-[#FFFCEB] p-[5px] mx-auto translate-y-10 relative z-20 group ${isEditing ? "cursor-pointer" : ""}`}
                onClick={() => isEditing && fileInputRef.current?.click()}
              >
                <div className="w-full h-full rounded-[13px] overflow-hidden relative bg-[#F7B71D] flex items-center justify-center text-[#385E31] text-2xl font-black">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    initials
                  )}
                  {isEditing && (
                    <div className="absolute inset-0 bg-black/55 flex flex-col items-center justify-center text-white gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <CameraIcon />
                      <span className="text-[9px] font-bold uppercase tracking-wider">Change</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ── SCROLLABLE BODY ── */}
            <div
              className="flex-1 overflow-y-auto px-6 pb-4 [scrollbar-width:thin] [scrollbar-color:rgba(56,94,49,0.2)_transparent]
                [&::-webkit-scrollbar]:w-[4px]
                [&::-webkit-scrollbar-track]:bg-transparent
                [&::-webkit-scrollbar-thumb]:bg-[#385E31]/20
                [&::-webkit-scrollbar-thumb]:rounded-full"
            >
              {/* Identity block — pt-14 offsets the avatar overflow */}
              <div className="pt-14 text-center mb-5">
                {isEditing ? (
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Full Name"
                    className="w-full text-xl font-black text-[#385E31] text-center bg-transparent border-b-2 border-[#385E31]/20 focus:border-[#F7B71D] outline-none transition-colors px-2 py-1 mb-2"
                  />
                ) : (
                  <h2 className="text-xl font-black text-[#385E31] tracking-wide mb-2">
                    {formData.name}
                  </h2>
                )}
                <div className="flex items-center justify-center gap-2">
                  <span className="bg-[#385E31]/10 text-[#385E31] px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest">
                    {formData.role}
                  </span>
                  <div className="w-1 h-1 rounded-full bg-[#385E31]/30" />
                  <span className="flex items-center gap-1.5 text-[#385E31]/55 text-[11px] font-semibold">
                    <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.5)]" />
                    {formData.status}
                  </span>
                </div>
              </div>

              {/* Contact card */}
              <div className="bg-white/65 border border-[#385E31]/10 rounded-2xl p-4 mb-2.5 flex flex-col gap-3.5">
                <h3 className="text-[9.5px] font-bold text-[#385E31]/45 uppercase tracking-[0.1em] flex items-center justify-between">
                  Contact information
                  {isEditing && (
                    <span className="text-[#c9920d] normal-case tracking-normal text-[10px] font-semibold">
                      Editing profile…
                    </span>
                  )}
                </h3>

                <FieldRow
                  icon={<MailIcon />}
                  label="Email address"
                  name="email"
                  value={formData.email}
                  isEditing={isEditing}
                  inputType="email"
                  onChange={handleInputChange}
                />
                <FieldRow
                  icon={<PhoneIcon />}
                  label="Phone number"
                  name="contactNumber"
                  value={formData.contactNumber}
                  isEditing={isEditing}
                  onChange={handleInputChange}
                />
                <FieldRow
                  icon={<MapPinIcon />}
                  label="Location"
                  name="location"
                  value={formData.location}
                  isEditing={isEditing}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            {/* ── FOOTER ── */}
            <div className="px-6 py-4 border-t border-[#385E31]/10 bg-[#FFFCEB] flex-shrink-0">
              <div className="flex gap-2.5">
                {isEditing ? (
                  <>
                    <button
                      onClick={handleCancel}
                      disabled={isSaving}
                      className="flex-1 bg-transparent border border-[#385E31]/30 text-[#385E31] py-3 rounded-xl text-[13px] font-bold hover:bg-[#385E31]/5 transition-colors disabled:opacity-60"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={isSaving}
                      className="flex-1 bg-[#385E31] text-[#FFFCEB] py-3 rounded-xl text-[13px] font-bold flex items-center justify-center gap-2 hover:brightness-110 transition-all disabled:opacity-60"
                    >
                      {isSaving ? (
                        <>
                          <LoaderIcon /> Saving…
                        </>
                      ) : (
                        "Save changes"
                      )}
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => setIsEditing(true)}
                      className="flex-1 bg-[#F7B71D] text-[#385E31] py-3 rounded-xl text-[13px] font-bold hover:brightness-105 transition-all"
                    >
                      Edit profile
                    </button>
                    <button
                      onClick={() => alert("Trigger Logout")}
                      title="Sign out"
                      className="w-[46px] bg-transparent border-2 border-[#E91F22]/25 text-[#c0282a] rounded-xl flex items-center justify-center hover:bg-[#E91F22]/5 transition-colors"
                    >
                      <LogOutIcon />
                    </button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}