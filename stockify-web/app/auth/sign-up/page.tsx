"use client";

import { useRouter } from "next/navigation";
import { useState, useRef, ChangeEvent } from "react";
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
    <div className="w-full px-6 sm:px-9 pt-4 pb-9 bg-[#3A6131] rounded-[10px] shadow-[2px_4px_18px_0px_rgba(0,0,0,0.25)] flex flex-col gap-4">
      <div className="flex justify-start items-center gap-3">
        <div className="w-18 h-18 flex justify-center items-center text-[#FFF9D7]">
          {icon}
        </div>
        <div className="flex-1 text-[#FFF9D7] text-2xl sm:text-3xl lg:text-4xl font-bold font-['Inter']">
          {title}
        </div>
      </div>
      <div className="w-full p-6 bg-[#FFF9D7] rounded-[5px] flex flex-col gap-7">
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
}: {
  placeholder: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  required?: boolean;
  className?: string;
}) {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      required={required}
      className={`bg-[#FFD980] placeholder-[#3A6131]/70 text-[#3A6131] font-medium text-base px-5 py-2.5 rounded-[5px] outline outline-1 outline-offset-[-1px] outline-[#3A6131]/40 focus:outline-2 focus:outline-offset-0 focus:outline-[#3A6131] transition w-full ${className}`}
    />
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
        className="bg-[#FFD980] text-[#3A6131] font-medium text-base px-5 py-2.5 rounded-[5px] outline outline-1 outline-offset-[-1px] outline-[#3A6131]/40 focus:outline-2 focus:outline-offset-0 focus:outline-[#3A6131] transition w-full appearance-none cursor-pointer pr-10"
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-[#3A6131]">
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
        className="bg-[#FFD980] placeholder-[#3A6131]/70 text-[#3A6131] font-medium text-base px-5 py-2.5 rounded-[5px] outline outline-1 outline-offset-[-1px] outline-[#3A6131]/40 w-full truncate cursor-default pr-24"
      />
      <button
        type="button"
        onClick={onClick}
        className="absolute right-2 shrink-0 bg-[#3A6131] text-[#FFD980] font-semibold text-sm px-4 py-1.5 rounded-[3px] hover:bg-[#2D4B24] transition"
      >
        Upload
      </button>
    </div>
  );
}

export default function SignUp() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const router = useRouter();
  const supabase = createClient();

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

  const setOwnerField = <K extends keyof OwnerForm>(key: K, val: OwnerForm[K]) =>
    setOwner((p) => ({ ...p, [key]: val }));

  const setBusinessField = <K extends keyof BusinessForm>(
    key: K,
    val: BusinessForm[K]
  ) => setBusiness((p) => ({ ...p, [key]: val }));

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (loading || isSubmitting.current) return;

    setError("");

    if (owner.password !== owner.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (owner.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (!agreed) {
      setError("Please accept the Terms and Conditions.");
      return;
    }

    isSubmitting.current = true;
    setLoading(true);

    try {
      // --- FILE UPLOADS (still client-side via Supabase Storage) ---
      // We need a temp ID for storage paths — use email hash or timestamp
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

      // --- CALL SERVER API ROUTE (handles auth + DB inserts with service role) ---
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
    <div className="w-full min-h-screen bg-[#FFFCEB] flex flex-col items-center relative">
      <div className="w-full max-w-[1268px] flex flex-col h-full px-8 pt-5 pb-16">
        {/* Navbar Section */}
        <div className="w-full flex justify-center shrink-0">
          <NavbarLandingPage />
        </div>

        {/* Form Container */}
        <div className="w-full max-w-5xl mx-auto pt-13 font-['Inter']">
          <div className="text-center mb-7">
            <h1 className="font-extrabold font-Inter text-4xl text-[#3A6131]">
              Get Started with Stockify
            </h1>
            <p className="text-lg font-medium text-[#3A6131] mt-1">
              Fill out the details below to submit your registration for approval.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-10">
            {/* Section 1: Business Owner */}
            <SectionCard
              icon={<img src="/business-owner.svg" alt="Business Owner" className="w-full h-full object-contain" />}
              title="Business Owner's Information"
            >
              {/* Top Row: Name Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-5 w-full">
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

              {/* Bottom Section: Profile Picture + Details */}
              <div className="flex flex-col md:flex-row gap-5 items-stretch w-full">
                {/* Left Column: Profile Picture Box */}
                <div className="w-full md:w-[220px] shrink-0">
                  <div className="relative w-full aspect-square bg-[#FFD980] rounded-[5px] outline outline-1 outline-[#3A6131]/40 flex flex-col items-center justify-center overflow-hidden">
                    {owner.profilePicturePreview ? (
                      <img
                        src={owner.profilePicturePreview}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center mb-6">
                        <img src="/business-owner.svg" alt="Upload Owner Picture" className="w-40 h-40 object-contain opacity-70" />
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => profilePicInputRef.current?.click()}
                      className="absolute bottom-4 bg-[#3A6131] text-white text-xs font-semibold px-4 py-1.5 rounded-full hover:bg-[#2D4B24] transition z-10"
                    >
                      Upload 2×2 Picture
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
                <div className="flex-1 flex flex-col justify-between gap-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
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

              {/* Password Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 w-full">
                <InputField
                  placeholder="Password *"
                  type="password"
                  value={owner.password}
                  onChange={(e) => setOwnerField("password", e.target.value)}
                  required
                />
                <InputField
                  placeholder="Confirm Password *"
                  type="password"
                  value={owner.confirmPassword}
                  onChange={(e) => setOwnerField("confirmPassword", e.target.value)}
                  required
                />
              </div>
            </SectionCard>

            {/* Section 2: Business Details */}
            <SectionCard
              icon={<img src="/business-details.svg" alt="Business Details" className="w-full h-full object-contain" />}
              title="Business Details"
            >
              <div className="flex flex-col md:flex-row gap-5 items-start">
                {/* Logo Upload Box */}
                <div className="w-full md:w-[220px] shrink-0 relative">
                  <div className="relative w-full aspect-square bg-[#FFD980] rounded-[5px] outline outline-1 outline-[#3A6131]/40 flex flex-col items-center justify-center overflow-hidden">
                    {business.logoPreview ? (
                      <img
                        src={business.logoPreview}
                        alt="Logo"
                        className="w-full h-full object-contain bg-white"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center mb-6">
                        <img src="/business-details.svg" alt="Upload Business Logo" className="w-40 h-40 object-contain opacity-70" />
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => logoInputRef.current?.click()}
                      className="absolute bottom-4 bg-[#3A6131] text-white text-xs font-semibold px-4 py-1.5 rounded-full hover:bg-[#2D4B24] transition z-10"
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
                <div className="flex-1 w-full flex flex-col gap-5">
                  <div className="w-full">
                    <InputField
                      placeholder="Business Name *"
                      value={business.businessName}
                      onChange={(e) => setBusinessField("businessName", e.target.value)}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
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
              <p className="text-red-700 bg-red-100 border border-red-300 px-5 py-3 rounded-[5px] text-center font-medium">
                {error}
              </p>
            )}

            {/* Terms & Submit */}
            <div className="flex flex-col items-center gap-2 mt-4 pb-12">
              <p className="font-semibold font-Inter text-[#3A6131] text-lg">
                Before submitting, please read our{" "}
                <button
                  type="button"
                  onClick={() => router.push("/terms")}
                  className="font-bold font-Inter text-x1 text-[#F7B71D] underline hover:opacity-75 transition"
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

              <button
                type="submit"
                disabled={loading || !agreed}
                className="bg-[#F7B71D] text-[#3A6131] font-bold text-xl px-16 py-3.5 rounded-[30px] hover:bg-[#2D4B24] hover:text-[#F7B71D] transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed mt-7 w-full sm:w-auto"
              >
                {loading ? "Submitting..." : "Submit for Approval"}
              </button>
            </div>
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
