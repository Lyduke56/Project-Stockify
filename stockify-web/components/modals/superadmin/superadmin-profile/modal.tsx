"use client";

import React, { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";

// ── Types ─────────────────────────────────────────────────────────────────────

interface AdminProfileData {
  name: string;
  email: string;
  contactNumber: string;
  address: string;
  role: string;
  status: string;
  gender: string;
  citizenship: string;
  avatarUrl: string | null;
}

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
const UserIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
  </svg>
);
const GlobeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
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
          <span className="text-[13px] font-semibold text-[#385E31]">
            {value || <span className="text-[#385E31]/30 italic">Not set</span>}
          </span>
        )}
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

interface SuperadminProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DEFAULT_DATA: AdminProfileData = {
  name: "",
  email: "",
  contactNumber: "",
  address: "",
  role: "Superadmin",
  status: "Active",
  gender: "",
  citizenship: "",
  avatarUrl: null,
};

export default function SuperadminProfileModal({
  isOpen,
  onClose,
}: SuperadminProfileModalProps) {
  const supabase = createClient();
  const [mounted, setMounted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<AdminProfileData>(DEFAULT_DATA);
  const [savedData, setSavedData] = useState<AdminProfileData>(DEFAULT_DATA);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [newAvatarFile, setNewAvatarFile] = useState<File | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Fetch real user data from Supabase when modal opens
  useEffect(() => {
    if (!isOpen) return;

    const fetchUserData = async () => {
      setIsLoading(true);
      setSaveError("");

      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const authUser = sessionData.session?.user;
        if (!authUser) return;

        setUserId(authUser.id);

        const { data: userRow, error } = await supabase
          .from("users")
          .select("first_name, last_name, middle_name, email, contact_number, address, role, is_active, gender, citizenship, profile_picture_url")
          .eq("user_id", authUser.id)
          .single();

        if (error || !userRow) return;

        const fullName = [userRow.first_name, userRow.middle_name, userRow.last_name]
          .filter(Boolean)
          .join(" ") || userRow.email;

        const profile: AdminProfileData = {
          name: fullName,
          email: userRow.email || authUser.email || "",
          contactNumber: userRow.contact_number || "",
          address: userRow.address || "",
          role: userRow.role || "Superadmin",
          status: userRow.is_active ? "Active" : "Inactive",
          gender: userRow.gender || "",
          citizenship: userRow.citizenship || "",
          avatarUrl: userRow.profile_picture_url || null,
        };

        setFormData(profile);
        setSavedData(profile);
        setAvatarPreview(userRow.profile_picture_url || null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
    setIsEditing(false);
    setNewAvatarFile(null);
  }, [isOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setNewAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setAvatarPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!userId) return;
    setIsSaving(true);
    setSaveError("");

    try {
      // Parse name back into parts (simple split: first + last)
      const nameParts = formData.name.trim().split(" ");
      const first_name = nameParts[0] || "";
      const last_name = nameParts.length > 1 ? nameParts[nameParts.length - 1] : "";
      const middle_name = nameParts.length > 2 ? nameParts.slice(1, -1).join(" ") : "";

      let profile_picture_url = formData.avatarUrl;

      // Upload new avatar if selected
      if (newAvatarFile) {
        const ext = newAvatarFile.name.split(".").pop();
        const filePath = `avatars/${userId}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("profile-pictures")
          .upload(filePath, newAvatarFile, { upsert: true });

        if (!uploadError) {
          const { data: urlData } = supabase.storage
            .from("profile-pictures")
            .getPublicUrl(filePath);
          profile_picture_url = urlData.publicUrl;
        }
      }

      const { error } = await supabase
        .from("users")
        .update({
          first_name,
          last_name,
          middle_name,
          contact_number: formData.contactNumber,
          address: formData.address,
          gender: formData.gender,
          citizenship: formData.citizenship,
          profile_picture_url,
        })
        .eq("user_id", userId);

      if (error) {
        setSaveError("Failed to save changes. Please try again.");
        return;
      }

      const updated = { ...formData, avatarUrl: profile_picture_url };
      setFormData(updated);
      setSavedData(updated);
      setNewAvatarFile(null);
      setIsEditing(false);
    } catch {
      setSaveError("An unexpected error occurred.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData(savedData);
    setAvatarPreview(savedData.avatarUrl);
    setNewAvatarFile(null);
    setIsEditing(false);
    setSaveError("");
  };

  if (!mounted) return null;

  const initials = (formData.name || formData.email || "A")
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
            className="relative w-full max-w-[460px] bg-[#FFFCEB] rounded-[28px] overflow-hidden border border-[#385E31]/10 shadow-[0_24px_64px_rgba(56,94,49,0.18)] flex flex-col max-h-[640px] z-10"
          >
            {/* ── BANNER ── */}
            <div className="bg-[#385E31] px-5 pt-5 pb-0 relative flex-shrink-0">
              {/* Close button */}
              {!isEditing && (
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/35 transition-colors z-10"
                >
                  <XIcon />
                </button>
              )}

              {/* Avatar */}
              <div
                className={`w-20 h-20 rounded-[18px] bg-[#FFFCEB] p-[5px] mx-auto translate-y-10 relative z-20 group ${isEditing ? "cursor-pointer" : ""}`}
                onClick={() => isEditing && fileInputRef.current?.click()}
              >
                <div className="w-full h-full rounded-[13px] overflow-hidden relative bg-[#F7B71D] flex items-center justify-center text-[#385E31] text-2xl font-black">
                  {isLoading ? (
                    <LoaderIcon />
                  ) : avatarPreview ? (
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
              {/* Identity block */}
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
                    {isLoading ? (
                      <span className="inline-block w-32 h-5 bg-[#385E31]/10 rounded animate-pulse" />
                    ) : (
                      formData.name || formData.email
                    )}
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

              {/* Save error */}
              {saveError && (
                <div className="mb-3 px-4 py-2 bg-red-50 border border-red-200 rounded-xl text-red-600 text-xs font-semibold">
                  {saveError}
                </div>
              )}

              {/* Contact card */}
              <div className="bg-white/65 border border-[#385E31]/10 rounded-2xl p-4 mb-2.5 flex flex-col gap-3.5">
                <h3 className="text-[9.5px] font-bold text-[#385E31]/45 uppercase tracking-[0.1em] flex items-center justify-between">
                  Contact Information
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
                  isEditing={false}
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
                  label="Address"
                  name="address"
                  value={formData.address}
                  isEditing={isEditing}
                  onChange={handleInputChange}
                />
              </div>

              {/* Additional Info card */}
              <div className="bg-white/65 border border-[#385E31]/10 rounded-2xl p-4 mb-2.5 flex flex-col gap-3.5">
                <h3 className="text-[9.5px] font-bold text-[#385E31]/45 uppercase tracking-[0.1em]">
                  Additional Information
                </h3>
                <FieldRow
                  icon={<UserIcon />}
                  label="Gender"
                  name="gender"
                  value={formData.gender}
                  isEditing={isEditing}
                  onChange={handleInputChange}
                />
                <FieldRow
                  icon={<GlobeIcon />}
                  label="Citizenship"
                  name="citizenship"
                  value={formData.citizenship}
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
                      disabled={isLoading}
                      className="flex-1 bg-[#F7B71D] text-[#385E31] py-3 rounded-xl text-[13px] font-bold hover:brightness-105 transition-all disabled:opacity-60"
                    >
                      Edit profile
                    </button>
                    <button
                      onClick={onClose}
                      title="Close"
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