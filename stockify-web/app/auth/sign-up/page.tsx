"use client";

import { useRouter } from "next/navigation";
import { useState, useRef, ChangeEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import NavbarLandingPage from "@/components/navbars/navbar-landing-page";


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
    <div className="rounded-[20px] bg-[#385E31] border border-[#4a7a3a] p-6 shadow-lg">
      <div className="flex items-center gap-3 mb-5">
        <span className="text-[#F7B71D] text-3xl">{icon}</span>
        <h2 className="font-['Fredoka'] font-semibold text-[26px] text-[#F5F0C8]">
          {title}
        </h2>
      </div>
      <div className="bg-[#F5EFB8] rounded-[14px] p-5">{children}</div>
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
      className={`bg-[#EEBB46] placeholder-[#7a5c00] text-[#3A3A3A] font-['Fredoka'] text-[15px] px-4 py-2.5 rounded-full outline-none focus:ring-2 focus:ring-[#385E31] transition w-full ${className}`}
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
    <select
      value={value}
      onChange={onChange}
      required={required}
      className="bg-[#EEBB46] text-[#3A3A3A] font-['Fredoka'] text-[15px] px-4 py-2.5 rounded-full outline-none focus:ring-2 focus:ring-[#385E31] transition w-full appearance-none cursor-pointer"
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
    <div className="flex items-center gap-2 w-full">
      <input
        value={fileName || label}
        readOnly
        placeholder={label}
        className="bg-[#EEBB46] placeholder-[#7a5c00] text-[#3A3A3A] font-['Fredoka'] text-[14px] px-4 py-2.5 rounded-full outline-none w-full truncate cursor-default"
      />
      <button
        type="button"
        onClick={onClick}
        className="shrink-0 bg-[#385E31] text-[#F7B71D] font-['Fredoka'] font-semibold text-[13px] px-4 py-2.5 rounded-full hover:bg-[#2D4B24] transition"
      >
        Upload
      </button>
    </div>
  );
}


export default function SignUp() {

  const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
  const router = useRouter();
  const supabase = createClient();

  const profilePicInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const validIdInputRef = useRef<HTMLInputElement>(null);
  const permitInputRef = useRef<HTMLInputElement>(null);

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

    if (loading) return;

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

    setLoading(true);
    console.log("Redirect URL:", `${siteUrl}/auth/callback`);

    try {
      const { data: authData, error: authError } =
        await supabase.auth.signUp({
          email: owner.email,
          password: owner.password,
          options: {
            emailRedirectTo: `${siteUrl}/auth/callback`,
          },
        });

      if (authError) throw new Error(authError.message);
      const authUserId = authData.user?.id;
      if (!authUserId) throw new Error("Failed to create account.");

      let profilePictureUrl = "";
      let logoUrl = "";
      let ownerValidIdUrl = "";
      let businessPermitUrl = "";

      if (owner.profilePicture) {
        profilePictureUrl = await uploadFile(
          supabase,
          "profile-assets",
          `avatars/${authUserId}/profile.${owner.profilePicture.name.split(".").pop()}`,
          owner.profilePicture
        );
      }

      if (business.logo) {
        logoUrl = await uploadFile(
          supabase,
          "profile-assets",
          `logos/${authUserId}/logo.${business.logo.name.split(".").pop()}`,
          business.logo
        );
      }

      if (business.ownerValidId) {
        ownerValidIdUrl = await uploadFile(
          supabase,
          "registration-docs",
          `${authUserId}/valid-id.${business.ownerValidId.name.split(".").pop()}`,
          business.ownerValidId
        );
      }

      if (business.businessPermit) {
        businessPermitUrl = await uploadFile(
          supabase,
          "registration-docs",
          `${authUserId}/business-permit.${business.businessPermit.name.split(".").pop()}`,
          business.businessPermit
        );
      }

      const { data: tenantData, error: tenantError } = await supabase
        .from("tenants")
        .insert({
          business_name: business.businessName,
          owner_email: owner.email,
          business_type: business.businessType || null,
          owner_full_name: business.ownerFullName,
          business_warehouse_address: business.businessWarehouseAddress,
          owner_valid_id_url: ownerValidIdUrl || null,
          business_permit_url: businessPermitUrl || null,
        })
        .select("tenant_id")
        .single();

      if (tenantError) throw new Error(tenantError.message);
      const tenantId = tenantData.tenant_id;

      const { error: userError } = await supabase.from("users").insert({
        user_id: authUserId,
        tenant_id: tenantId,
        email: owner.email,
        role: "Administrator", // owner of the tenant
        display_name: `${owner.firstName} ${owner.lastName}`,
        first_name: owner.firstName,
        last_name: owner.lastName,
        middle_name: owner.middleName || null,
        suffix: owner.suffix || null,
        gender: owner.gender || null,
        contact_number: owner.contactNumber || null,
        address: owner.address || null,
        citizenship: owner.citizenship || null,
        profile_picture_url: profilePictureUrl || null,
        is_active: false, 
      });

      if (userError) throw new Error(userError.message);

      setSuccess(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };


  if (success) {
    return (
      <div className="w-full min-h-screen bg-[#FFFCEB] flex flex-col">
        <NavbarLandingPage />
        <div className="flex flex-1 items-center justify-center px-4 py-16">
          <div className="bg-[#385E31] rounded-[24px] border border-[#F7B71D] px-12 py-14 text-center max-w-md shadow-xl">
            <div className="text-6xl mb-5">🎉</div>
            <h2 className="font-['Fredoka'] font-bold text-[32px] text-[#F7B71D] mb-3">
              Registration Submitted!
            </h2>
            <p className="font-['Fredoka'] text-[16px] text-[#F5F0C8] mb-6 leading-relaxed">
              Thank you for registering with Stockify. Our team will review your
              application and notify you via email once your account is approved.
            </p>
            <button
              onClick={() => router.push("/")}
              className="bg-[#F7B71D] text-[#2D4B24] font-['Fredoka'] font-bold text-[18px] px-8 py-3 rounded-full hover:opacity-90 transition"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }


  return (
    <div className="w-full min-h-screen bg-[#FFFCEB]">
      <NavbarLandingPage />

      <div className="max-w-3xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="font-['Fredoka'] font-bold text-[30px] text-[#2D4B24]">
            Get Started with Stockify
          </h1>
          <p className="font-['Fredoka'] text-[15px] text-[#555]">
            Fill out the details below to submit your registration for approval
            by our team.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          {/* Section 1: Business Owner */}
          <SectionCard
            icon={
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7">
                <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
              </svg>
            }
            title="Business Owner's Information"
          >
            <div className="flex gap-4">
              {/* Profile Picture */}
              <div className="flex flex-col items-center gap-2 shrink-0">
                <div
                  onClick={() => profilePicInputRef.current?.click()}
                  className="w-[110px] h-[110px] rounded-[10px] bg-[#EEBB46] flex items-center justify-center overflow-hidden cursor-pointer border-2 border-[#c49800] hover:opacity-90 transition"
                >
                  {owner.profilePicturePreview ? (
                    <img
                      src={owner.profilePicturePreview}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <svg
                      viewBox="0 0 24 24"
                      fill="#7a5c00"
                      className="w-14 h-14 opacity-60"
                    >
                      <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
                    </svg>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => profilePicInputRef.current?.click()}
                  className="bg-[#385E31] text-[#F7B71D] font-['Fredoka'] text-[12px] font-semibold px-3 py-1 rounded-full hover:bg-[#2D4B24] transition"
                >
                  Upload 2×2
                </button>
                <input
                  ref={profilePicInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleProfilePic}
                />
              </div>

              {/* Owner Fields */}
              <div className="flex-1 flex flex-col gap-3">
                {/* Row 1: Name fields */}
                <div className="grid grid-cols-4 gap-2">
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
                    placeholder="Middle Name"
                    value={owner.middleName}
                    onChange={(e) =>
                      setOwnerField("middleName", e.target.value)
                    }
                  />
                  <InputField
                    placeholder="Suffix"
                    value={owner.suffix}
                    onChange={(e) => setOwnerField("suffix", e.target.value)}
                  />
                </div>

                {/* Row 2: Gender + Email */}
                <div className="grid grid-cols-2 gap-2">
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

                {/* Row 3: Citizenship + Contact */}
                <div className="grid grid-cols-2 gap-2">
                  <SelectField
                    placeholder="Citizenship *"
                    value={owner.citizenship}
                    onChange={(e) =>
                      setOwnerField("citizenship", e.target.value)
                    }
                    options={[
                      "Filipino",
                      "American",
                      "Chinese",
                      "Japanese",
                      "Korean",
                      "Other",
                    ]}
                    required
                  />
                  <InputField
                    placeholder="Contact No. *"
                    value={owner.contactNumber}
                    onChange={(e) =>
                      setOwnerField("contactNumber", e.target.value)
                    }
                    required
                  />
                </div>

                {/* Row 4: Address */}
                <InputField
                  placeholder="Address *"
                  value={owner.address}
                  onChange={(e) => setOwnerField("address", e.target.value)}
                  required
                />

                {/* Row 5: Password */}
                <div className="grid grid-cols-2 gap-2">
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
                    onChange={(e) =>
                      setOwnerField("confirmPassword", e.target.value)
                    }
                    required
                  />
                </div>
              </div>
            </div>
          </SectionCard>

          {/* Section 2: Business Details */}
          <SectionCard
            icon={
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7">
                <path d="M3 9l1-6h16l1 6H3zm0 0v11h18V9H3zm7 2h4v4h-4v-4z" />
              </svg>
            }
            title="Business Details"
          >
            <div className="flex gap-4">
              {/* Logo */}
              <div className="flex flex-col items-center gap-2 shrink-0">
                <div
                  onClick={() => logoInputRef.current?.click()}
                  className="w-[110px] h-[110px] rounded-[10px] bg-[#EEBB46] flex items-center justify-center overflow-hidden cursor-pointer border-2 border-[#c49800] hover:opacity-90 transition"
                >
                  {business.logoPreview ? (
                    <img
                      src={business.logoPreview}
                      alt="Logo"
                      className="w-full h-full object-contain p-2"
                    />
                  ) : (
                    <svg
                      viewBox="0 0 24 24"
                      fill="#7a5c00"
                      className="w-14 h-14 opacity-60"
                    >
                      <path d="M3 9l1-6h16l1 6H3zm0 0v11h18V9H3zm7 2h4v4h-4v-4z" />
                    </svg>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => logoInputRef.current?.click()}
                  className="bg-[#385E31] text-[#F7B71D] font-['Fredoka'] text-[12px] font-semibold px-3 py-1 rounded-full hover:bg-[#2D4B24] transition"
                >
                  Upload Logo
                </button>
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleLogo}
                />
              </div>

              {/* Business Fields */}
              <div className="flex-1 flex flex-col gap-3">
                {/* Business Name */}
                <InputField
                  placeholder="Business Name *"
                  value={business.businessName}
                  onChange={(e) =>
                    setBusinessField("businessName", e.target.value)
                  }
                  required
                />

                {/* Business Type + Owner Full Name */}
                <div className="grid grid-cols-2 gap-2">
                  <SelectField
                    placeholder="Business Type *"
                    value={business.businessType}
                    onChange={(e) =>
                      setBusinessField("businessType", e.target.value)
                    }
                    options={[
                      "Food & Beverage",
                      "Non-Food & Beverage",
                    ]}
                    required
                  />
                  <InputField
                    placeholder="Full Name (as on permit) *"
                    value={business.ownerFullName}
                    onChange={(e) =>
                      setBusinessField("ownerFullName", e.target.value)
                    }
                    required
                  />
                </div>

                {/* Valid ID + Business Permit uploads */}
                <div className="grid grid-cols-2 gap-2">
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

                {/* Business/Warehouse Address */}
                <InputField
                  placeholder="Business/Warehouse Address *"
                  value={business.businessWarehouseAddress}
                  onChange={(e) =>
                    setBusinessField(
                      "businessWarehouseAddress",
                      e.target.value
                    )
                  }
                  required
                />
              </div>
            </div>
          </SectionCard>

          {/* Error */}
          {error && (
            <p className="font-['Fredoka'] text-[14px] text-red-700 bg-red-100 border border-red-300 px-5 py-3 rounded-xl text-center">
              {error}
            </p>
          )}

          {/* Terms + Submit */}
          <div className="flex flex-col items-center gap-4 mt-2">
            <p className="font-['Fredoka'] text-[14px] text-[#3A3A3A]">
              Before submitting, please read our{" "}
              <button
                type="button"
                onClick={() => router.push("/terms")}
                className="text-[#385E31] font-semibold underline hover:opacity-75 transition"
              >
                Terms and Conditions.
              </button>
            </p>

            <label className="flex items-center gap-2 cursor-pointer font-['Fredoka'] text-[14px] text-[#3A3A3A]">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="w-4 h-4 accent-[#385E31] cursor-pointer"
              />
              I have read and agree with the Terms and Conditions.
            </label>

            <button
              type="submit"
              disabled={loading || !agreed}
              className="bg-[#EEBB46] text-[#2D4B24] font-['Fredoka'] font-bold text-[20px] px-16 py-3 rounded-full hover:bg-[#F7B71D] hover:scale-[1.02] active:scale-95 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Submitting..." : "Submit for Approval"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
