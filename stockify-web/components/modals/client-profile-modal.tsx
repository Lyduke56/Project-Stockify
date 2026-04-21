"use client";

import { useState, useRef, ChangeEvent } from "react";

interface ClientProfileForm {
  businessName: string;
  businessContact: string;
  businessType: string;
  validBusinessPermit: File | null;
  validBusinessPermitName: string;
  businessOwnerValidId: File | null;
  businessOwnerValidIdName: string;
  businessWarehouseAddress: string;
  lastName: string;
  firstName: string;
  middleName: string;
  suffix: string;
  profilePicture: File | null;
  profilePicturePreview: string;
  gender: string;
  email: string;
  citizenship: string;
  contactNumber: string;
  permanentAddress: string;
}

function InputField({
  placeholder,
  value,
  onChange,
  type = "text",
}: {
  placeholder: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  type?: string;
}) {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className="bg-[#FFD980] placeholder-[#3A6131]/70 text-[#3A6131] font-medium text-base px-5 py-2.5 rounded-[5px] outline outline-1 outline-offset-[-1px] outline-[#3A6131]/40 focus:outline-2 focus:outline-[#3A6131] transition w-full"
    />
  );
}

function SelectField({
  placeholder,
  value,
  onChange,
  options,
}: {
  placeholder: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLSelectElement>) => void;
  options: string[];
}) {
  return (
    <div className="relative w-full">
      <select
        value={value}
        onChange={onChange}
        className="bg-[#FFD980] text-[#3A6131] font-medium text-base px-5 py-2.5 rounded-[5px] outline outline-1 outline-offset-[-1px] outline-[#3A6131]/40 focus:outline-2 focus:outline-[#3A6131] transition w-full appearance-none cursor-pointer pr-10"
      >
        <option value="" disabled>{placeholder}</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-[#3A6131]">
        <svg className="fill-current h-4 w-4" viewBox="0 0 20 20">
          <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
        </svg>
      </div>
    </div>
  );
}

function UploadButton({
  label,
  fileName,
  onClick,
}: {
  label: string;
  fileName: string;
  onClick: () => void;
}) {
  return (
    <div className="flex items-center gap-2 w-full relative">
      <input
        value={fileName || ""}
        readOnly
        placeholder={label}
        className="bg-[#FFD980] placeholder-[#3A6131]/70 text-[#3A6131] font-medium text-base px-5 py-2.5 rounded-[5px] outline outline-1 outline-offset-[-1px] outline-[#3A6131]/40 w-full truncate cursor-default pr-24"
      />
      <button
        type="button"
        onClick={onClick}
        className="absolute right-2 shrink-0 bg-[#3A6131] text-[#FFD980] font-semibold text-sm px-4 py-1.5 rounded-[3px] hover:bg-[#24481F] transition"
      >
        Upload
      </button>
    </div>
  );
}

function SectionCard({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="w-full px-6 pt-4 pb-6 rounded-[10px] flex flex-col gap-4" style={{ backgroundColor: "#385E31" }}>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 flex items-center justify-center text-[#FFD980]">
          {icon}
        </div>
        <span className="text-[#FFD980] text-2xl font-bold font-['Inter']">{title}</span>
      </div>
      <div className="w-full p-6 rounded-[5px] flex flex-col gap-4" style={{ backgroundColor: "#FFFCF0" }}>
        {children}
      </div>
    </div>
  );
}

export default function ClientProfileModal({
  isOpen,
  onClose,
  onSave,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (form: ClientProfileForm) => void;
}) {
  if (!isOpen) return null;

  const permitRef = useRef<HTMLInputElement>(null);
  const validIdRef = useRef<HTMLInputElement>(null);
  const profilePicRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<ClientProfileForm>({
    businessName: "",
    businessContact: "",
    businessType: "",
    validBusinessPermit: null,
    validBusinessPermitName: "",
    businessOwnerValidId: null,
    businessOwnerValidIdName: "",
    businessWarehouseAddress: "",
    lastName: "",
    firstName: "",
    middleName: "",
    suffix: "",
    profilePicture: null,
    profilePicturePreview: "",
    gender: "",
    email: "",
    citizenship: "",
    contactNumber: "",
    permanentAddress: "",
  });

  const set = <K extends keyof ClientProfileForm>(key: K, val: ClientProfileForm[K]) =>
    setForm((p) => ({ ...p, [key]: val }));

  const handleProfilePic = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    set("profilePicture", file);
    set("profilePicturePreview", URL.createObjectURL(file));
  };

  const handlePermit = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    set("validBusinessPermit", file);
    set("validBusinessPermitName", file.name);
  };

  const handleValidId = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    set("businessOwnerValidId", file);
    set("businessOwnerValidIdName", file.name);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div
        className="w-full max-w-5xl max-h-[90vh] overflow-hidden rounded-2xl shadow-2xl flex flex-col"
        style={{ backgroundColor: "#FFFCF0" }}
      >
        {/* Header */}
        <header
          className="px-8 py-5 flex justify-between items-center sticky top-0 z-10"
          style={{ backgroundColor: "#FFFCF0", borderBottom: "1px solid rgba(56,94,49,0.15)" }}
        >
          <h2 className="text-2xl font-bold uppercase tracking-widest font-['Inter']" style={{ color: "#385E31" }}>
            Client Profile
          </h2>
          <button onClick={onClose} className="text-lg font-bold hover:scale-110 transition-transform" style={{ color: "#385E31" }}>
            ✕
          </button>
        </header>

        {/* Body */}
        <div className="p-8 flex flex-col gap-6 overflow-y-auto scrollbar-hide">

          {/* Business Details */}
          <SectionCard
            icon={<img src="/business-details.svg" alt="Business" className="w-full h-full object-contain" />}
            title="Business Details"
          >
            {/* Business Name */}
            <InputField
              placeholder="Business Name *"
              value={form.businessName}
              onChange={(e) => set("businessName", e.target.value)}
            />

            {/* Logo + fields */}
            <div className="flex gap-4 items-start">
              {/* Logo placeholder */}
              <div
                className="w-28 h-28 rounded-[5px] shrink-0 flex items-center justify-center outline outline-1 outline-[#3A6131]/40"
                style={{ backgroundColor: "#FFD980" }}
              >
                <img src="/business-details.svg" alt="Logo" className="w-16 h-16 object-contain opacity-60" />
              </div>

              {/* Right fields */}
              <div className="flex-1 flex flex-col gap-3">
                <div className="grid grid-cols-2 gap-4">
                  <InputField
                    placeholder="Business Contact/Tel. No. *"
                    value={form.businessContact}
                    onChange={(e) => set("businessContact", e.target.value)}
                  />
                  <SelectField
                    placeholder="Business Type"
                    value={form.businessType}
                    onChange={(e) => set("businessType", e.target.value)}
                    options={["Food & Beverage", "Non-Food & Beverage"]}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <UploadButton
                      label="Valid Business Permit *"
                      fileName={form.validBusinessPermitName}
                      onClick={() => permitRef.current?.click()}
                    />
                    <input ref={permitRef} type="file" accept="image/*,application/pdf" className="hidden" onChange={handlePermit} />
                  </div>
                  <div>
                    <UploadButton
                      label="Business Owner Valid ID *"
                      fileName={form.businessOwnerValidIdName}
                      onClick={() => validIdRef.current?.click()}
                    />
                    <input ref={validIdRef} type="file" accept="image/*,application/pdf" className="hidden" onChange={handleValidId} />
                  </div>
                </div>
                <InputField
                  placeholder="Business/Warehouse Address *"
                  value={form.businessWarehouseAddress}
                  onChange={(e) => set("businessWarehouseAddress", e.target.value)}
                />
              </div>
            </div>
          </SectionCard>

          {/* Business Owner's Information */}
          <SectionCard
            icon={<img src="/business-owner.svg" alt="Owner" className="w-full h-full object-contain" />}
            title="Business Owner's Information"
          >
            {/* Name row */}
            <div className="grid grid-cols-4 gap-3">
              <InputField placeholder="Last Name *"   value={form.lastName}   onChange={(e) => set("lastName", e.target.value)} />
              <InputField placeholder="First Name *"  value={form.firstName}  onChange={(e) => set("firstName", e.target.value)} />
              <InputField placeholder="Middle Name *" value={form.middleName} onChange={(e) => set("middleName", e.target.value)} />
              <InputField placeholder="Suffix"        value={form.suffix}     onChange={(e) => set("suffix", e.target.value)} />
            </div>

            {/* Profile pic + fields */}
            <div className="flex gap-4 items-start">
              {/* Profile picture */}
              <div
                className="w-28 h-32 rounded-[5px] shrink-0 flex flex-col items-center justify-center overflow-hidden outline outline-1 outline-[#3A6131]/40 relative cursor-pointer"
                style={{ backgroundColor: "#FFD980" }}
                onClick={() => profilePicRef.current?.click()}
              >
                {form.profilePicturePreview ? (
                  <img src={form.profilePicturePreview} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <img src="/business-owner.svg" alt="Upload" className="w-16 h-16 object-contain opacity-60" />
                )}
                <input ref={profilePicRef} type="file" accept="image/*" className="hidden" onChange={handleProfilePic} />
              </div>

              {/* Right fields */}
              <div className="flex-1 flex flex-col gap-3">
                <div className="grid grid-cols-2 gap-4">
                  <SelectField
                    placeholder="Gender *"
                    value={form.gender}
                    onChange={(e) => set("gender", e.target.value)}
                    options={["Male", "Female", "Non-binary", "Prefer not to say"]}
                  />
                  <InputField
                    placeholder="Email Address *"
                    type="email"
                    value={form.email}
                    onChange={(e) => set("email", e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <SelectField
                    placeholder="Citizenship *"
                    value={form.citizenship}
                    onChange={(e) => set("citizenship", e.target.value)}
                    options={["Filipino", "American", "Chinese", "Japanese", "Korean", "Other"]}
                  />
                  <InputField
                    placeholder="Contact No. *"
                    value={form.contactNumber}
                    onChange={(e) => set("contactNumber", e.target.value)}
                  />
                </div>
                <InputField
                  placeholder="Permanent Address *"
                  value={form.permanentAddress}
                  onChange={(e) => set("permanentAddress", e.target.value)}
                />
              </div>
            </div>
          </SectionCard>
        </div>

        {/* Footer */}
        <footer
          className="px-8 py-5 flex items-center justify-between sticky bottom-0"
          style={{ backgroundColor: "#FFFCF0", borderTop: "1px solid rgba(56,94,49,0.15)" }}
        >
          {/* Help text */}
          <div className="flex items-center gap-2">
            <img src="/icon-info.svg" alt="info" className="w-4 h-4" />
            <p className="text-sm font-['Inter']" style={{ color: "#385E31" }}>
              Need help with billing? <a href="mailto:support@stockify.com" className="underline" style={{ color: "#E5AC24" }}>Contact our support team at support@stockify.com</a>
            </p>
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-4">
            <button
              onClick={onClose}
              className="px-10 py-2.5 rounded-[10px] font-bold font-['Inter'] text-sm transition-all hover:brightness-105 active:scale-95"
              style={{ backgroundColor: "#385E31", color: "#FFFCF0" }}
            >
              CANCEL CHANGES
            </button>
            <button
              onClick={() => onSave?.(form)}
              className="px-10 py-2.5 rounded-[10px] font-bold font-['Inter'] text-sm transition-all hover:brightness-105 active:scale-95"
              style={{ backgroundColor: "#E5AC24", color: "#24481F" }}
            >
              SAVE CHANGES
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}