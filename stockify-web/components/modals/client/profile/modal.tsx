"use client";

import React, { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";

// ── Types ─────────────────────────────────────────────────────────────────────

interface ClientProfileData {
  // Owner Info (Users table)
  ownerLastName: string;
  ownerFirstName: string;
  ownerMiddleName: string;
  ownerSuffix: string;
  gender: string;
  email: string;
  contactNo: string;
  citizenship: string;
  permanentAddress: string;
  avatarUrl: string | null;

  // Business Info (Tenants table)
  businessName: string;
  businessAddress: string;
  businessType: string;
  businessPermitUrl: string | null;
  ownerIdUrl: string | null;
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
const BuildingIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect><path d="M9 22v-4h6v4"></path><path d="M8 6h.01"></path><path d="M16 6h.01"></path><path d="M12 6h.01"></path><path d="M12 10h.01"></path><path d="M12 14h.01"></path><path d="M16 10h.01"></path><path d="M16 14h.01"></path><path d="M8 10h.01"></path><path d="M8 14h.01"></path>
  </svg>
);
const UserIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle>
  </svg>
);
const FileIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline>
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
  icon?: React.ReactNode;
  label: string;
  name: string;
  value: string;
  isEditing: boolean;
  inputType?: string;
  colSpan?: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  options?: string[];
}

function FieldRow({ icon, label, name, value, isEditing, inputType = "text", colSpan = false, onChange, options }: FieldRowProps) {
  return (
    <div className={`flex items-start gap-3 ${colSpan ? 'col-span-1 sm:col-span-2' : 'col-span-1'}`}>
      {icon && (
        <div className="w-8 h-8 rounded-full bg-[#385E31]/[0.06] flex items-center justify-center shrink-0 text-[#385E31] mt-0.5">
          {icon}
        </div>
      )}
      <div className="flex flex-col flex-1 w-full">
        <span className="text-[9.5px] font-bold text-[#385E31]/45 uppercase tracking-[0.08em] mb-1">
          {label}
        </span>
        {isEditing ? (
          options ? (
            <select
              name={name}
              value={value}
              onChange={onChange}
              className="w-full bg-white border border-[#385E31]/20 rounded-lg px-2.5 py-1.5 text-[13px] font-semibold text-[#385E31] outline-none focus:border-[#F7B71D] transition-colors"
            >
              <option value="" disabled>Select {label}</option>
              {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          ) : (
            <input
              type={inputType}
              name={name}
              value={value}
              onChange={onChange}
              className="w-full bg-white border border-[#385E31]/20 rounded-lg px-2.5 py-1.5 text-[13px] font-semibold text-[#385E31] outline-none focus:border-[#F7B71D] transition-colors"
            />
          )
        ) : (
          <span className="text-[13px] font-semibold text-[#385E31] break-words leading-tight">
            {value || <span className="text-[#385E31]/30 italic">Not set</span>}
          </span>
        )}
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

interface ClientProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  isAdmin?: boolean;
}

const DEFAULT_DATA: ClientProfileData = {
  ownerLastName: "",
  ownerFirstName: "",
  ownerMiddleName: "",
  ownerSuffix: "",
  gender: "",
  email: "",
  contactNo: "",
  citizenship: "",
  permanentAddress: "",
  avatarUrl: null,
  businessName: "",
  businessAddress: "",
  businessType: "",
  businessPermitUrl: null,
  ownerIdUrl: null,
};

export default function ClientProfileModal({
  isOpen,
  onClose,
  isAdmin = false,
}: ClientProfileModalProps) {
  const supabase = createClient();
  const [mounted, setMounted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const permitInputRef = useRef<HTMLInputElement>(null);
  const idInputRef = useRef<HTMLInputElement>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<ClientProfileData>(DEFAULT_DATA);
  const [savedData, setSavedData] = useState<ClientProfileData>(DEFAULT_DATA);

  // Redefine FieldRow locally to capture isAdmin for theme mapping
  const FieldRow = ({ icon, label, name, value, isEditing, inputType = "text", colSpan = false, onChange, options }: FieldRowProps) => {
    const borderFocus = isAdmin ? "focus:border-[#385E31]" : "focus:border-[#F7B71D]";
    return (
      <div className={`flex items-start gap-3 ${colSpan ? 'col-span-1 sm:col-span-2' : 'col-span-1'}`}>
        {icon && (
          <div className="w-8 h-8 rounded-full bg-[#385E31]/[0.06] flex items-center justify-center shrink-0 text-[#385E31] mt-0.5">
            {icon}
          </div>
        )}
        <div className="flex flex-col flex-1 w-full">
          <span className="text-[9.5px] font-bold text-[#385E31]/45 uppercase tracking-[0.08em] mb-1">
            {label}
          </span>
          {isEditing ? (
            options ? (
              <select
                name={name}
                value={value}
                onChange={onChange}
                className={`w-full bg-white border border-[#385E31]/20 rounded-lg px-2.5 py-1.5 text-[13px] font-semibold text-[#385E31] outline-none ${borderFocus} transition-colors`}
              >
                <option value="" disabled>Select {label}</option>
                {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            ) : (
              <input
                type={inputType}
                name={name}
                value={value}
                onChange={onChange}
                className={`w-full bg-white border border-[#385E31]/20 rounded-lg px-2.5 py-1.5 text-[13px] font-semibold text-[#385E31] outline-none ${borderFocus} transition-colors`}
              />
            )
          ) : (
            <span className="text-[13px] font-semibold text-[#385E31] break-words leading-tight">
              {value || <span className="text-[#385E31]/30 italic">Not set</span>}
            </span>
          )}
        </div>
      </div>
    );
  };

  const primaryBg = isAdmin ? "bg-[#385E31]" : "bg-[#F7B71D]";
  const primaryText = isAdmin ? "text-[#FFFCEB]" : "text-[#385E31]";
  const primaryHover = isAdmin ? "hover:brightness-110" : "hover:brightness-105";

  const bannerBg = isAdmin ? "bg-[#385E31]" : "bg-[#F7B71D]";
  const closeBtnClass = isAdmin 
    ? "absolute top-4 right-4 w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/35 transition-colors z-10"
    : "absolute top-4 right-4 w-7 h-7 rounded-full bg-[#385E31]/20 flex items-center justify-center text-[#385E31] hover:bg-[#385E31]/35 transition-colors z-10";
  const avatarBg = isAdmin ? "bg-[#F7B71D]" : "bg-[#385E31]";
  const avatarText = isAdmin ? "text-[#385E31]" : "text-[#FFFCEB]";

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      localStorage.clear();
      sessionStorage.clear();
      
      const pathname = typeof window !== "undefined" ? window.location.pathname : "";
      const businessName = pathname.split("/")[1];
      const targetPath = businessName ? `/${businessName}/login` : "/";
      window.location.href = targetPath;
    } catch (e) {
      console.error("Logout error:", e);
      onClose();
    }
  };

  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [newAvatarFile, setNewAvatarFile] = useState<File | null>(null);

  const [newPermitFile, setNewPermitFile] = useState<File | null>(null);
  const [permitPreviewName, setPermitPreviewName] = useState<string | null>(null);

  const [newIdFile, setNewIdFile] = useState<File | null>(null);
  const [idPreviewName, setIdPreviewName] = useState<string | null>(null);

  const [userId, setUserId] = useState<string | null>(null);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Fetch real data from Supabase when modal opens
  useEffect(() => {
    if (!isOpen) return;

    const fetchProfile = async () => {
      setIsLoading(true);
      setErrorMsg("");

      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const authUser = sessionData.session?.user;
        if (!authUser) return;

        setUserId(authUser.id);

        // 1. Fetch user data
        const { data: userRow, error: userError } = await supabase
          .from("users")
          .select("first_name, last_name, middle_name, suffix, email, contact_number, address, gender, citizenship, profile_picture_url, tenant_id")
          .eq("user_id", authUser.id)
          .single();

        if (userError || !userRow) return;
        setTenantId(userRow.tenant_id);

        let tenantDetails = {
          businessName: "",
          businessAddress: "",
          businessType: "",
          businessPermitUrl: null as string | null,
          ownerIdUrl: null as string | null,
        };

        // 2. Fetch tenant details if tenant_id exists
        if (userRow.tenant_id) {
          const { data: tenantRow, error: tenantError } = await supabase
            .from("tenants")
            .select("business_name, business_warehouse_address, business_type, business_permit_url, owner_valid_id_url")
            .eq("tenant_id", userRow.tenant_id)
            .single();

          if (!tenantError && tenantRow) {
            tenantDetails = {
              businessName: tenantRow.business_name || "",
              businessAddress: tenantRow.business_warehouse_address || "",
              businessType: tenantRow.business_type || "",
              businessPermitUrl: tenantRow.business_permit_url || null,
              ownerIdUrl: tenantRow.owner_valid_id_url || null,
            };
          }
        }

        const profile: ClientProfileData = {
          ownerLastName: userRow.last_name || "",
          ownerFirstName: userRow.first_name || "",
          ownerMiddleName: userRow.middle_name || "",
          ownerSuffix: userRow.suffix || "",
          gender: userRow.gender || "",
          email: userRow.email || authUser.email || "",
          contactNo: userRow.contact_number || "",
          citizenship: userRow.citizenship || "",
          permanentAddress: userRow.address || "",
          avatarUrl: userRow.profile_picture_url || null,
          ...tenantDetails,
        };

        setFormData(profile);
        setSavedData(profile);
        setAvatarPreview(userRow.profile_picture_url || null);
        setPermitPreviewName(tenantDetails.businessPermitUrl ? "business_permit.pdf" : null);
        setIdPreviewName(tenantDetails.ownerIdUrl ? "owner_id.pdf" : null);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
    setIsEditing(false);
    setNewAvatarFile(null);
    setNewPermitFile(null);
    setNewIdFile(null);
  }, [isOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: "avatar" | "permit" | "id") => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (type === "avatar") {
      setNewAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setAvatarPreview(reader.result as string);
      reader.readAsDataURL(file);
    } else if (type === "permit") {
      setNewPermitFile(file);
      setPermitPreviewName(file.name);
    } else if (type === "id") {
      setNewIdFile(file);
      setIdPreviewName(file.name);
    }
  };

  const handleSave = async () => {
    if (!userId) return;
    setIsSaving(true);
    setErrorMsg("");

    try {
      let profile_picture_url = formData.avatarUrl;
      let business_permit_url = formData.businessPermitUrl;
      let owner_valid_id_url = formData.ownerIdUrl;

      // 1. Upload new avatar if selected
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

      // 2. Upload tenant documents if selected
      if (tenantId) {
        if (newPermitFile) {
          const ext = newPermitFile.name.split(".").pop();
          const filePath = `permits/${tenantId}.${ext}`;
          const { error: uploadError } = await supabase.storage
            .from("tenant-documents")
            .upload(filePath, newPermitFile, { upsert: true });

          if (!uploadError) {
            const { data: urlData } = supabase.storage
              .from("tenant-documents")
              .getPublicUrl(filePath);
            business_permit_url = urlData.publicUrl;
          }
        }

        if (newIdFile) {
          const ext = newIdFile.name.split(".").pop();
          const filePath = `ids/${tenantId}.${ext}`;
          const { error: uploadError } = await supabase.storage
            .from("tenant-documents")
            .upload(filePath, newIdFile, { upsert: true });

          if (!uploadError) {
            const { data: urlData } = supabase.storage
              .from("tenant-documents")
              .getPublicUrl(filePath);
            owner_valid_id_url = urlData.publicUrl;
          }
        }
      }

      // 3. Update users table
      const { error: userUpdateError } = await supabase
        .from("users")
        .update({
          first_name: formData.ownerFirstName,
          last_name: formData.ownerLastName,
          middle_name: formData.ownerMiddleName,
          suffix: formData.ownerSuffix,
          gender: formData.gender,
          contact_number: formData.contactNo,
          citizenship: formData.citizenship,
          address: formData.permanentAddress,
          profile_picture_url,
        })
        .eq("user_id", userId);

      if (userUpdateError) {
        setErrorMsg("Failed to save owner profile information.");
        setIsSaving(false);
        return;
      }

      // 4. Update tenants table
      if (tenantId) {
        const { error: tenantUpdateError } = await supabase
          .from("tenants")
          .update({
            business_name: formData.businessName,
            business_warehouse_address: formData.businessAddress,
            business_type: formData.businessType,
            business_permit_url,
            owner_valid_id_url,
          })
          .eq("tenant_id", tenantId);

        if (tenantUpdateError) {
          setErrorMsg("Failed to save business settings details.");
          setIsSaving(false);
          return;
        }
      }

      const updatedData: ClientProfileData = {
        ...formData,
        avatarUrl: profile_picture_url,
        businessPermitUrl: business_permit_url,
        ownerIdUrl: owner_valid_id_url,
      };

      setFormData(updatedData);
      setSavedData(updatedData);
      setIsEditing(false);
      setNewAvatarFile(null);
      setNewPermitFile(null);
      setNewIdFile(null);
    } catch (e) {
      setErrorMsg("An unexpected error occurred.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData(savedData);
    setAvatarPreview(savedData.avatarUrl);
    setPermitPreviewName(savedData.businessPermitUrl ? "business_permit.pdf" : null);
    setIdPreviewName(savedData.ownerIdUrl ? "owner_id.pdf" : null);
    setNewAvatarFile(null);
    setNewPermitFile(null);
    setNewIdFile(null);
    setIsEditing(false);
    setErrorMsg("");
  };

  if (!mounted) return null;

  const initials = (formData.ownerFirstName?.[0] || "O") + (formData.ownerLastName?.[0] || "W");
  const fullName = `${formData.ownerFirstName} ${formData.ownerMiddleName ? formData.ownerMiddleName[0] + '.' : ''} ${formData.ownerLastName} ${formData.ownerSuffix}`.trim();

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

          {/* Hidden File Inputs */}
          <input type="file" ref={fileInputRef} onChange={(e) => handleFileChange(e, "avatar")} accept="image/*" className="hidden" />
          <input type="file" ref={permitInputRef} onChange={(e) => handleFileChange(e, "permit")} accept="application/pdf,image/*" className="hidden" />
          <input type="file" ref={idInputRef} onChange={(e) => handleFileChange(e, "id")} accept="application/pdf,image/*" className="hidden" />

          {/* Modal */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ type: "spring", duration: 0.35, bounce: 0.15 }}
            className="relative w-full max-w-[540px] bg-[#FFFCEB] rounded-[28px] overflow-hidden border border-[#385E31]/10 shadow-[0_24px_64px_rgba(56,94,49,0.18)] flex flex-col max-h-[85vh] z-10"
          >
             {/* ── BANNER (Theme-aware cover banner) ── */}
            <div className={`${bannerBg} px-5 pt-5 pb-0 relative flex-shrink-0 h-[60px]`}>
              {/* Close button */}
              {!isEditing && (
                <button
                  onClick={onClose}
                  className={closeBtnClass}
                >
                  <XIcon />
                </button>
              )}

              {/* Avatar — overflows banner */}
              <div
                className={`w-20 h-20 rounded-[18px] bg-[#FFFCEB] p-[5px] mx-auto translate-y-3 relative z-20 group ${isEditing ? "cursor-pointer" : ""}`}
                onClick={() => isEditing && fileInputRef.current?.click()}
              >
                <div className={`w-full h-full rounded-[13px] overflow-hidden relative ${avatarBg} flex items-center justify-center ${avatarText} text-2xl font-black`}>
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
              {/* Identity Header */}
              <div className="pt-14 text-center mb-6">
                <h2 className="text-xl font-black text-[#385E31] tracking-wide mb-1.5">
                  {isLoading ? (
                    <span className="inline-block w-40 h-6 bg-[#385E31]/10 rounded animate-pulse" />
                  ) : (
                    fullName || formData.email
                  )}
                </h2>
                <div className="flex items-center justify-center gap-2">
                  <span className="bg-[#385E31]/10 text-[#385E31] px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest">
                    Business Owner
                  </span>
                </div>
              </div>

              {/* Error Box */}
              {errorMsg && (
                <div className="mb-4 px-4 py-2 bg-red-50 border border-red-200 rounded-xl text-red-600 text-xs font-semibold">
                  {errorMsg}
                </div>
              )}

              {/* SECTION: Owner Information */}
              <div className="bg-white/65 border border-[#385E31]/10 rounded-2xl p-5 mb-4 flex flex-col gap-4">
                <h3 className="text-[11px] font-extrabold text-[#385E31] uppercase tracking-[0.1em] flex items-center justify-between pb-2 border-b border-[#385E31]/10">
                  <div className="flex items-center gap-2"><UserIcon /> Owner Information</div>
                  {isEditing && (
                    <span className="text-[#c9920d] normal-case tracking-normal text-[10px] font-bold">
                      Editing Profile…
                    </span>
                  )}
                </h3>

                {isEditing ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-4">
                    <FieldRow label="First Name" name="ownerFirstName" value={formData.ownerFirstName} isEditing={isEditing} onChange={handleInputChange} />
                    <FieldRow label="Last Name" name="ownerLastName" value={formData.ownerLastName} isEditing={isEditing} onChange={handleInputChange} />
                    <FieldRow label="Middle Name" name="ownerMiddleName" value={formData.ownerMiddleName} isEditing={isEditing} onChange={handleInputChange} />
                    <FieldRow label="Suffix" name="ownerSuffix" value={formData.ownerSuffix} isEditing={isEditing} onChange={handleInputChange} />
                    <FieldRow label="Gender" name="gender" value={formData.gender} isEditing={isEditing} onChange={handleInputChange} options={["Male", "Female", "Other"]} />
                    <FieldRow label="Citizenship" name="citizenship" value={formData.citizenship} isEditing={isEditing} onChange={handleInputChange} />
                    <FieldRow label="Email Address (read-only)" name="email" value={formData.email} isEditing={false} inputType="email" colSpan onChange={() => {}} />
                    <FieldRow label="Contact No." name="contactNo" value={formData.contactNo} isEditing={isEditing} colSpan onChange={handleInputChange} />
                    <FieldRow label="Permanent Address" name="permanentAddress" value={formData.permanentAddress} isEditing={isEditing} colSpan onChange={handleInputChange} />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-4">
                    <FieldRow icon={<MailIcon />} label="Email Address" name="email" value={formData.email} isEditing={false} colSpan onChange={() => {}} />
                    <FieldRow icon={<PhoneIcon />} label="Contact No." name="contactNo" value={formData.contactNo} isEditing={false} onChange={() => {}} />
                    <FieldRow icon={<UserIcon />} label="Gender & Citizenship" name="genderInfo" value={`${formData.gender || '—'}, ${formData.citizenship || '—'}`} isEditing={false} onChange={() => {}} />
                    <FieldRow icon={<MapPinIcon />} label="Permanent Address" name="permanentAddress" value={formData.permanentAddress} isEditing={false} colSpan onChange={() => {}} />
                  </div>
                )}
              </div>

              {/* SECTION: Business Details */}
              <div className="bg-white/65 border border-[#385E31]/10 rounded-2xl p-5 mb-2.5 flex flex-col gap-4">
                <h3 className="text-[11px] font-extrabold text-[#385E31] uppercase tracking-[0.1em] flex items-center justify-between pb-2 border-b border-[#385E31]/10">
                  <div className="flex items-center gap-2"><BuildingIcon /> Business Details</div>
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-4">
                  <FieldRow label="Business Name" name="businessName" value={formData.businessName} isEditing={isEditing} colSpan onChange={handleInputChange} />
                  <FieldRow label="Business Type" name="businessType" value={formData.businessType} isEditing={isEditing} onChange={handleInputChange} options={["Food & Beverage", "Retail", "Services", "Manufacturing", "Other"]} />
                  <FieldRow label="Business Address" name="businessAddress" value={formData.businessAddress} isEditing={isEditing} colSpan onChange={handleInputChange} />
                  
                  {/* Documents Section */}
                  <div className="col-span-1 sm:col-span-2 mt-2 pt-4 border-t border-[#385E31]/10 flex flex-col gap-3">
                    <span className="text-[9.5px] font-bold text-[#385E31]/45 uppercase tracking-[0.08em]">Submitted Documents</span>
                    <div className="flex flex-col sm:flex-row gap-3">
                      
                      {/* Business Permit */}
                      <div className="flex-1 flex items-center justify-between bg-white border border-[#385E31]/15 p-2.5 rounded-lg">
                        <div className="flex flex-col gap-0.5 text-[#385E31] truncate max-w-[140px]">
                          <div className="flex items-center gap-1.5">
                            <FileIcon /> <span className="text-xs font-bold">Business Permit</span>
                          </div>
                          {permitPreviewName && (
                            <span className="text-[9px] text-[#385E31]/50 truncate">{permitPreviewName}</span>
                          )}
                        </div>
                        {isEditing ? (
                          <button
                            onClick={() => permitInputRef.current?.click()}
                            className="text-[10px] bg-[#385E31]/10 text-[#385E31] px-2 py-1 rounded font-bold hover:bg-[#385E31]/20"
                          >
                            Upload
                          </button>
                        ) : formData.businessPermitUrl ? (
                          <a
                            href={formData.businessPermitUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] bg-[#F7B71D]/20 text-[#c9920d] px-2.5 py-1 rounded font-bold uppercase tracking-wide hover:bg-[#F7B71D]/30 transition-all"
                          >
                            View
                          </a>
                        ) : (
                          <span className="text-[9px] text-gray-400 font-semibold italic">Not uploaded</span>
                        )}
                      </div>

                      {/* Owner Valid ID */}
                      <div className="flex-1 flex items-center justify-between bg-white border border-[#385E31]/15 p-2.5 rounded-lg">
                        <div className="flex flex-col gap-0.5 text-[#385E31] truncate max-w-[140px]">
                          <div className="flex items-center gap-1.5">
                            <FileIcon /> <span className="text-xs font-bold">Owner Valid ID</span>
                          </div>
                          {idPreviewName && (
                            <span className="text-[9px] text-[#385E31]/50 truncate">{idPreviewName}</span>
                          )}
                        </div>
                        {isEditing ? (
                          <button
                            onClick={() => idInputRef.current?.click()}
                            className="text-[10px] bg-[#385E31]/10 text-[#385E31] px-2 py-1 rounded font-bold hover:bg-[#385E31]/20"
                          >
                            Upload
                          </button>
                        ) : formData.ownerIdUrl ? (
                          <a
                            href={formData.ownerIdUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] bg-[#F7B71D]/20 text-[#c9920d] px-2.5 py-1 rounded font-bold uppercase tracking-wide hover:bg-[#F7B71D]/30 transition-all"
                          >
                            View
                          </a>
                        ) : (
                          <span className="text-[9px] text-gray-400 font-semibold italic">Not uploaded</span>
                        )}
                      </div>

                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ── FOOTER (Accents match client's yellow primary color) ── */}
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
                      className={`flex-1 ${primaryBg} ${primaryText} py-3 rounded-xl text-[13px] font-bold flex items-center justify-center gap-2 ${primaryHover} transition-all disabled:opacity-60`}
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
                      className="flex-1 bg-[#385E31] text-[#FFFCEB] py-3 rounded-xl text-[13px] font-bold hover:brightness-110 transition-all disabled:opacity-60"
                    >
                      Edit profile
                    </button>
                    <button
                      onClick={handleLogout}
                      title="Log out"
                      className="w-[46px] bg-transparent border-2 border-[#E91F22]/25 text-[#c0282a] rounded-xl flex items-center justify-center hover:bg-[#E91F22]/5 transition-colors shadow-sm"
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