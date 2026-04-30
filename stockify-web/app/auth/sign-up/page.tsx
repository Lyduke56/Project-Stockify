"use client";

import { useRouter } from "next/navigation";
import { useState, useRef, ChangeEvent, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import NavbarLandingPage from "@/components/navbars/navbar-landing-page";
import RegistrationSubmittedModal from "@/components/modals/sign-up-modals/RegSubmitModal";

interface OwnerForm {
  lastName: string;
  firstName: string;
  middleName: string;
  suffix: string;
  gender: string;
  email: string;
  citizenship: string;
  contactNumber: string;
  address: string;
  password: string;
  confirmPassword: string;
  profilePicture: File | null;
  profilePicturePreview: string;
}

interface BusinessForm {
  businessName: string;
  businessType: string;
  ownerFullName: string;
  ownerValidId: File | null;
  businessPermit: File | null;
  businessWarehouseAddress: string;
  logo: File | null;
  logoPreview: string;
  ownerValidIdName: string;
  businessPermitName: string;
}

async function uploadFile(
  supabase: ReturnType<typeof createClient>,
  bucket: string,
  path: string,
  file: File
): Promise<string> {
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw new Error(`Upload failed: ${error.message}`);

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
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
    <div className="w-full px-5 sm:px-8 pt-4 pb-8 bg-[#3A6131] rounded-[10px] shadow-lg flex flex-col gap-4 transition-all duration-500 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex justify-start items-center gap-3">
        <div className="w-12 h-12 flex justify-center items-center text-[#FFF9D7]">
          {icon}
        </div>
        <div className="flex-1 text-[#FFF9D7] text-xl sm:text-2xl font-bold font-['Inter']">
          {title}
        </div>
      </div>
      <div className="w-full p-6 bg-[#FFF9D7] rounded-[5px] flex flex-col gap-5">
        {children}
      </div>
    </div>
  );
}

function InputField({
  placeholder,
  value,
  onChange,
  type = "text",
  required = false,
  className = "",
  rightElement,
}: {
  placeholder: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  required?: boolean;
  className?: string;
  rightElement?: React.ReactNode;
}) {
  return (
    <div className="relative w-full">
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        className={`bg-[#FFD980] placeholder-[#3A6131]/70 text-[#3A6131] font-medium text-sm px-4 py-2.5 rounded-[5px] outline outline-1 outline-offset-[-1px] outline-[#3A6131]/40 focus:outline-2 focus:outline-offset-0 focus:outline-[#3A6131] transition w-full ${
          rightElement ? "pr-10" : ""
        } ${className}`}
      />
      {rightElement && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center">
          {rightElement}
        </div>
      )}
    </div>
  );
}

function SelectField({
  placeholder,
  value,
  onChange,
  options,
  required = false,
}: {
  placeholder: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLSelectElement>) => void;
  options: string[];
  required?: boolean;
}) {
  return (
    <div className="relative w-full">
      <select
        value={value}
        onChange={onChange}
        required={required}
        className={`bg-[#FFD980] font-medium text-sm px-4 py-2.5 rounded-[5px] outline outline-1 outline-offset-[-1px] outline-[#3A6131]/40 focus:outline-2 focus:outline-offset-0 focus:outline-[#3A6131] transition w-full appearance-none cursor-pointer pr-10 ${
          value === "" ? "text-[#3A6131]/70" : "text-[#3A6131]"
        }`}
      >
        <option value="" disabled className="text-[#3A6131]/70">
          {placeholder}
        </option>
        {options.map((opt) => (
          <option key={opt} value={opt} className="text-[#3A6131]">
            {opt}
          </option>
        ))}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-[#3A6131]">
        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
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
    <div className="flex items-center gap-2 w-full h-full relative">
      <input
        value={fileName || ""}
        readOnly
        placeholder={label}
        className="bg-[#FFD980] placeholder-[#3A6131]/70 text-[#3A6131] font-medium text-sm px-4 py-2.5 rounded-[5px] outline outline-1 outline-offset-[-1px] outline-[#3A6131]/40 w-full truncate cursor-default pr-24"
      />
      <button
        type="button"
        onClick={onClick}
        className="absolute right-1.5 shrink-0 bg-[#3A6131] text-[#FFD980] font-semibold text-xs px-3 py-1.5 rounded-[3px] hover:bg-[#2D4B24] transition"
      >
        Upload
      </button>
    </div>
  );
}

export default function SignUp() {
  const router = useRouter();
  const supabase = createClient();

  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const profilePicInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const validIdInputRef = useRef<HTMLInputElement>(null);
  const permitInputRef = useRef<HTMLInputElement>(null);

  const isSubmitting = useRef(false);

  const [owner, setOwner] = useState<OwnerForm>({
    lastName: "",
    firstName: "",
    middleName: "",
    suffix: "",
    gender: "",
    email: "",
    citizenship: "",
    contactNumber: "",
    address: "",
    // ✅ Restored from original
    password: "",
    confirmPassword: "",
    profilePicture: null,
    profilePicturePreview: "",
  });

  const [business, setBusiness] = useState<BusinessForm>({
    businessName: "",
    businessType: "",
    ownerFullName: "",
    ownerValidId: null,
    businessPermit: null,
    businessWarehouseAddress: "",
    logo: null,
    logoPreview: "",
    ownerValidIdName: "",
    businessPermitName: "",
  });

  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const setOwnerField = <K extends keyof OwnerForm>(key: K, val: OwnerForm[K]) =>
    setOwner((p) => ({ ...p, [key]: val }));

  const setBusinessField = <K extends keyof BusinessForm>(
    key: K,
    val: BusinessForm[K]
  ) => setBusiness((p) => ({ ...p, [key]: val }));

  // ✅ Validation — password fields included in Step 1 check
  const isOwnerValid =
    owner.lastName.trim() !== "" &&
    owner.firstName.trim() !== "" &&
    owner.middleName.trim() !== "" &&
    owner.gender !== "" &&
    owner.email.trim() !== "" &&
    owner.citizenship !== "" &&
    owner.contactNumber.trim() !== "" &&
    owner.address.trim() !== "" &&
    owner.password.trim() !== "" &&
    owner.confirmPassword.trim() !== "";

  const isBusinessValid =
    business.businessName.trim() !== "" &&
    business.businessType !== "" &&
    business.ownerFullName.trim() !== "" &&
    business.businessWarehouseAddress.trim() !== "" &&
    business.ownerValidId !== null &&
    business.businessPermit !== null;

  const handleProfilePic = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setOwnerField("profilePicture", file);
    setOwnerField("profilePicturePreview", URL.createObjectURL(file));
  };

  const handleLogo = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusinessField("logo", file);
    setBusinessField("logoPreview", URL.createObjectURL(file));
  };

  const handleValidId = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusinessField("ownerValidId", file);
    setBusinessField("ownerValidIdName", file.name);
  };

  const handlePermit = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusinessField("businessPermit", file);
    setBusinessField("businessPermitName", file.name);
  };

  // ✅ Restored password validation from original before going to Step 2
  const handleNextStep = () => {
    setError("");

    if (owner.password !== owner.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (owner.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (loading || isSubmitting.current) return;
    setError("");

    if (!agreed) {
      setError("Please accept the Terms and Conditions.");
      return;
    }

    isSubmitting.current = true;
    setLoading(true);

    try {
      const tempId = `${Date.now()}-${owner.email.replace(/[^a-z0-9]/gi, "")}`;
      let profilePictureUrl = "";
      let logoUrl = "";
      let ownerValidIdUrl = "";
      let businessPermitUrl = "";

      if (owner.profilePicture) {
        profilePictureUrl = await uploadFile(
          supabase,
          "profile-assets",
          `avatars/${tempId}/profile.${owner.profilePicture.name.split(".").pop()}`,
          owner.profilePicture
        );
      }
      if (business.logo) {
        logoUrl = await uploadFile(
          supabase,
          "profile-assets",
          `logos/${tempId}/logo.${business.logo.name.split(".").pop()}`,
          business.logo
        );
      }
      if (business.ownerValidId) {
        ownerValidIdUrl = await uploadFile(
          supabase,
          "registration-docs",
          `${tempId}/valid-id.${business.ownerValidId.name.split(".").pop()}`,
          business.ownerValidId
        );
      }
      if (business.businessPermit) {
        businessPermitUrl = await uploadFile(
          supabase,
          "registration-docs",
          `${tempId}/business-permit.${business.businessPermit.name.split(".").pop()}`,
          business.businessPermit
        );
      }

      // ✅ password restored in API body
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: owner.email,
          password: owner.password,
          firstName: owner.firstName,
          lastName: owner.lastName,
          middleName: owner.middleName,
          suffix: owner.suffix,
          gender: owner.gender,
          contactNumber: owner.contactNumber,
          address: owner.address,
          citizenship: owner.citizenship,
          profilePictureUrl,
          businessName: business.businessName,
          businessType: business.businessType,
          ownerFullName: business.ownerFullName,
          businessWarehouseAddress: business.businessWarehouseAddress,
          ownerValidIdUrl,
          businessPermitUrl,
          logoUrl,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || "Something went wrong.");
      }

      setSuccess(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
      isSubmitting.current = false;
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#FFFCEB] flex flex-col items-center relative overflow-x-hidden">
      <div className="w-full max-w-[1268px] flex flex-col h-full px-6 pt-5 pb-16">
        {/* Navbar Section */}
        <div className="w-full flex justify-center shrink-0">
          <NavbarLandingPage />
        </div>

        {/* Form Container */}
        <div
          className={`w-full max-w-5xl mx-auto pt-10 font-['Inter'] transition-all duration-700 ease-in-out transform ${
            mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          {/* Header & Progress Indicator */}
          <div className="flex flex-col items-center text-center mb-6">
            <h1 className="font-extrabold font-Inter text-3xl sm:text-4xl text-[#3A6131]">
              Get Started with Stockify
            </h1>
            <p className="text-sm sm:text-base font-medium text-[#3A6131] mt-2 mb-5">
              Fill out the details below to submit your registration for approval.
            </p>

            {/* Visual Progress Bar */}
            <p className="text-xs font-bold text-[#3A6131]/70 mt-2 tracking-widest uppercase">
              Step {step} of 2
            </p>
            <div className="flex items-center gap-3 mt-3">
              <div
                className={`h-2.5 w-24 sm:w-32 rounded-full transition-all duration-500 ease-in-out ${
                  step >= 1 ? "bg-[#F7B71D] shadow-[0_0_8px_rgba(247,183,29,0.5)]" : "bg-[#3A6131]/20"
                }`}
              />
              <div
                className={`h-2.5 w-24 sm:w-32 rounded-full transition-all duration-500 ease-in-out ${
                  step === 2 ? "bg-[#F7B71D] shadow-[0_0_8px_rgba(247,183,29,0.5)]" : "bg-[#3A6131]/20"
                }`}
              />
            </div>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-6 w-full">
            {/* Step 1: Business Owner */}
            {step === 1 && (
              <div className="flex flex-col gap-5 w-full">
                <SectionCard
                  icon={<img src="/business-owner.svg" alt="Business Owner" className="w-full h-full object-contain" />}
                  title="Business Owner's Information"
                >
                  {/* Name Fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 w-full">
                    <InputField
                      placeholder="Last Name *"
                      value={owner.lastName}
                      onChange={(e) => setOwnerField("lastName", e.target.value)}
                      required
                    />
                    <InputField
                      placeholder="First Name *"
                      value={owner.firstName}
                      onChange={(e) => setOwnerField("firstName", e.target.value)}
                      required
                    />
                    <InputField
                      placeholder="Middle Name *"
                      value={owner.middleName}
                      onChange={(e) => setOwnerField("middleName", e.target.value)}
                      required
                    />
                    <InputField
                      placeholder="Suffix"
                      value={owner.suffix}
                      onChange={(e) => setOwnerField("suffix", e.target.value)}
                    />
                  </div>

                  {/* Profile Picture + Details */}
                  <div className="flex flex-col md:flex-row gap-5 items-stretch w-full">
                    {/* Profile Picture Box */}
                    <div className="w-full md:w-[180px] shrink-0">
                      <div className="relative w-full aspect-square bg-[#FFD980] rounded-[5px] outline outline-1 outline-[#3A6131]/40 flex flex-col items-center justify-center overflow-hidden">
                        {owner.profilePicturePreview ? (
                          <img
                            src={owner.profilePicturePreview}
                            alt="Profile"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center mb-6">
                            <img src="/business-owner.svg" alt="Upload Owner Picture" className="w-28 h-28 object-contain opacity-70" />
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => profilePicInputRef.current?.click()}
                          className="absolute bottom-3 bg-[#3A6131] text-white text-[10px] sm:text-xs font-semibold px-4 py-2 rounded-full hover:bg-[#2D4B24] transition z-10"
                        >
                          Upload 2×2 Pic
                        </button>
                        <input
                          ref={profilePicInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleProfilePic}
                        />
                      </div>
                    </div>

                    {/* Right Column: Fields */}
                    <div className="flex-1 flex flex-col justify-between gap-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <SelectField
                          placeholder="Gender *"
                          value={owner.gender}
                          onChange={(e) => setOwnerField("gender", e.target.value)}
                          options={["Male", "Female", "Non-binary", "Prefer not to say"]}
                          required
                        />
                        <InputField
                          placeholder="Email *"
                          type="email"
                          value={owner.email}
                          onChange={(e) => setOwnerField("email", e.target.value)}
                          required
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <SelectField
                          placeholder="Citizenship *"
                          value={owner.citizenship}
                          onChange={(e) => setOwnerField("citizenship", e.target.value)}
                          options={["Filipino", "American", "Chinese", "Japanese", "Korean", "Other"]}
                          required
                        />
                        <InputField
                          placeholder="Contact No. *"
                          value={owner.contactNumber}
                          onChange={(e) => setOwnerField("contactNumber", e.target.value)}
                          required
                        />
                      </div>
                      <div className="w-full">
                        <InputField
                          placeholder="Address *"
                          value={owner.address}
                          onChange={(e) => setOwnerField("address", e.target.value)}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* ✅ Password Fields — restored from original with visibility toggles */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                    <InputField
                      placeholder="Password *"
                      type={showPassword ? "text" : "password"}
                      value={owner.password}
                      onChange={(e) => setOwnerField("password", e.target.value)}
                      required
                      rightElement={
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="text-[#3A6131]/70 hover:text-[#3A6131] transition focus:outline-none"
                        >
                          {showPassword ? (
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                            </svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                          )}
                        </button>
                      }
                    />
                    <InputField
                      placeholder="Confirm Password *"
                      type={showConfirmPassword ? "text" : "password"}
                      value={owner.confirmPassword}
                      onChange={(e) => setOwnerField("confirmPassword", e.target.value)}
                      required
                      rightElement={
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="text-[#3A6131]/70 hover:text-[#3A6131] transition focus:outline-none"
                        >
                          {showConfirmPassword ? (
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                            </svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                          )}
                        </button>
                      }
                    />
                  </div>
                </SectionCard>

                {/* ✅ Error shown on Step 1 too (e.g. password mismatch) */}
                {error && (
                  <p className="text-red-700 bg-red-100 border border-red-300 px-4 py-2 rounded-[5px] text-sm text-center font-medium">
                    {error}
                  </p>
                )}

                {/* Next Button */}
                <div className="flex justify-end mt-2">
                  <button
                    type="button"
                    disabled={!isOwnerValid}
                    onClick={handleNextStep}
                    className="bg-[#3A6131] text-[#FFF9D7] font-bold text-sm px-10 py-3 rounded-[5px] shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed enabled:hover:bg-[#2D4B24]"
                  >
                    Next ➔
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Business Details */}
            {step === 2 && (
              <div className="flex flex-col gap-5 w-full">
                <SectionCard
                  icon={<img src="/business-details.svg" alt="Business Details" className="w-full h-full object-contain" />}
                  title="Business Details"
                >
                  <div className="flex flex-col md:flex-row gap-5 items-start">
                    {/* Logo Upload Box */}
                    <div className="w-full md:w-[180px] shrink-0 relative">
                      <div className="relative w-full aspect-square bg-[#FFD980] rounded-[5px] outline outline-1 outline-[#3A6131]/40 flex flex-col items-center justify-center overflow-hidden">
                        {business.logoPreview ? (
                          <img
                            src={business.logoPreview}
                            alt="Logo"
                            className="w-full h-full object-contain bg-white"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center mb-6">
                            <img src="/business-details.svg" alt="Upload Business Logo" className="w-28 h-28 object-contain opacity-70" />
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => logoInputRef.current?.click()}
                          className="absolute bottom-3 bg-[#3A6131] text-white text-[10px] sm:text-xs font-semibold px-4 py-2 rounded-full hover:bg-[#2D4B24] transition z-10"
                        >
                          Upload Logo
                        </button>
                      </div>
                      <input
                        ref={logoInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleLogo}
                      />
                    </div>

                    {/* Detail Fields */}
                    <div className="flex-1 w-full flex flex-col gap-4">
                      <div className="w-full">
                        <InputField
                          placeholder="Business Name *"
                          value={business.businessName}
                          onChange={(e) => setBusinessField("businessName", e.target.value)}
                          required
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <SelectField
                          placeholder="Business Type *"
                          value={business.businessType}
                          onChange={(e) => setBusinessField("businessType", e.target.value)}
                          options={["Food & Beverage", "Non-Food & Beverage"]}
                          required
                        />
                        <InputField
                          placeholder="Owner Full Name (as on permit) *"
                          value={business.ownerFullName}
                          onChange={(e) => setBusinessField("ownerFullName", e.target.value)}
                          required
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <UploadButton
                            label="Owner's Valid ID *"
                            fileName={business.ownerValidIdName}
                            onClick={() => validIdInputRef.current?.click()}
                          />
                          <input
                            ref={validIdInputRef}
                            type="file"
                            accept="image/*,application/pdf"
                            className="hidden"
                            onChange={handleValidId}
                          />
                        </div>
                        <div>
                          <UploadButton
                            label="Business Permit *"
                            fileName={business.businessPermitName}
                            onClick={() => permitInputRef.current?.click()}
                          />
                          <input
                            ref={permitInputRef}
                            type="file"
                            accept="image/*,application/pdf"
                            className="hidden"
                            onChange={handlePermit}
                          />
                        </div>
                      </div>
                      <div className="w-full">
                        <InputField
                          placeholder="Business/Warehouse Address *"
                          value={business.businessWarehouseAddress}
                          onChange={(e) =>
                            setBusinessField("businessWarehouseAddress", e.target.value)
                          }
                          required
                        />
                      </div>
                    </div>
                  </div>
                </SectionCard>

                {/* Error Message */}
                {error && (
                  <p className="text-red-700 bg-red-100 border border-red-300 px-4 py-2 mt-2 rounded-[5px] text-sm text-center font-medium">
                    {error}
                  </p>
                )}

                {/* Terms & Navigation */}
                <div className="flex flex-col items-center gap-4 mt-6">
                  <div className="flex flex-col items-center gap-2">
                    <p className="font-semibold font-Inter text-[#3A6131] text-sm">
                      Before submitting, please read our{" "}
                      <button
                        type="button"
                        onClick={() => router.push("/terms")}
                        className="font-bold text-[#F7B71D] underline hover:opacity-75 transition"
                      >
                        Terms and Conditions.
                      </button>
                    </p>

                    <label className="flex items-center gap-2 cursor-pointer text-[#3A6131] text-sm font-medium">
                      <input
                        type="checkbox"
                        checked={agreed}
                        onChange={(e) => setAgreed(e.target.checked)}
                        className="w-4 h-4 accent-[#3A6131] cursor-pointer"
                      />
                      I have read and agree with the Terms and Conditions.
                    </label>
                  </div>

                  <div className="flex flex-col sm:flex-row justify-center gap-4 w-full sm:w-auto mt-2 pb-8">
                    <button
                      type="button"
                      onClick={() => { setStep(1); setError(""); }}
                      className="bg-transparent text-[#3A6131] outline outline-2 outline-[#3A6131] font-bold text-sm px-12 py-3 rounded-[5px] hover:bg-[#3A6131] hover:text-[#FFF9D7] transition-all w-full sm:w-auto"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={loading || !agreed || !isBusinessValid}
                      className="bg-[#F7B71D] text-[#3A6131] font-bold text-sm px-12 py-3 rounded-[5px] shadow-md transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed enabled:hover:bg-[#2D4B24] enabled:hover:text-[#F7B71D] w-full sm:w-auto"
                    >
                      {loading ? "Submitting..." : "Submit for Approval"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>

      <RegistrationSubmittedModal
        open={success}
        onClose={() => setSuccess(false)}
      />
    </div>
  );
}