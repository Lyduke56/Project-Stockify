"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  MapPin,
  Bell,
  LogOut,
  Camera,
  Edit2,
  Check,
  Package,
  ShieldCheck,
  ChevronRight,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { CustomerHeader } from "@/components/headers/customer-header";
import { getStorefrontTenant } from "@/backend/hooks/getStoreFront";
import { fetchStorefrontConfig } from "@/lib/admin/storefront-actions";
import LoadingScreen from "@/app/loading-screen/loading";

export default function CustomerProfilePage() {
  const params = useParams();
  const router = useRouter();
  const businessName = params?.businessName as string;
  const supabase = createClient();

  const [profile, setProfile] = useState<any>(null);
  const [tenant, setTenant] = useState<any>(null);
  const [sfConfig, setSfConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [orderCount, setOrderCount] = useState(0);

  const fetchProfile = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push(`/${businessName}/login`); return; }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [profileRes, tenantRes, countRes] = await Promise.all([
      supabase.from("users").select("*").eq("user_id", user.id).single(),
      getStorefrontTenant(user.id),
      supabase.from("orders").select("*", { count: "exact", head: true })
        .eq("customer_id", user.id).gte("created_at", thirtyDaysAgo.toISOString()),
    ]);

    if (!profileRes.error && profileRes.data) setProfile(profileRes.data);
    if (tenantRes) {
      setTenant(tenantRes);
      const sf = await fetchStorefrontConfig(tenantRes.tenant_id);
      setSfConfig(sf);
    }
    if (!countRes.error) setOrderCount(countRes.count ?? 0);
    setLoading(false);
  };

  useEffect(() => { fetchProfile(); }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push(`/${businessName}/login`);
  };

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase.from("users").update({
      first_name: profile.first_name,
      last_name: profile.last_name,
      contact_number: profile.contact_number,
      address: profile.address,
    }).eq("user_id", profile.user_id);
    if (!error) setIsEditing(false);
    setSaving(false);
  };

  const c = {
    primary:   sfConfig?.color_primary   ?? "#2E5128",
    secondary: sfConfig?.color_secondary ?? "#2A4725",
    accent:    sfConfig?.color_accent    ?? "#F7B71D",
    bg:        sfConfig?.color_background ?? "#FDFAF0",
    text:      sfConfig?.color_text      ?? "#1C3319",
  };

  const initials = profile
    ? `${profile.first_name?.[0] ?? ""}${profile.last_name?.[0] ?? ""}`.toUpperCase()
    : "?";

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen font-['Inter'] flex flex-col" style={{ backgroundColor: c.bg, color: c.text }}>
      <style>{`
        .profile-input { transition: border-color 0.18s, box-shadow 0.18s; }
        .profile-input:focus { border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-10); outline: none; }
        .stat-card { transition: transform 0.18s, box-shadow 0.18s; }
        .stat-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(28,51,25,0.09); }
      `}</style>

      <CustomerHeader
        businessName={businessName}
        tenantLogo={tenant?.logo_url ?? undefined}
        tenantName={tenant?.business_name}
        showSearch={false}
        showCart={false}
        isNfnb={tenant?.business_type === "non-food-and-beverage"}
        colors={c}
      />

      {/* ── Hero strip ── */}
      <div className="relative w-full h-44 overflow-hidden" style={{ backgroundColor: c.primary }}>
        {/* Decorative circles */}
        <div className="absolute -top-10 -right-10 w-56 h-56 rounded-full opacity-10" style={{ backgroundColor: c.accent }} />
        <div className="absolute -bottom-16 -left-6 w-44 h-44 rounded-full opacity-8" style={{ backgroundColor: c.accent }} />

        <div className="absolute inset-0 flex items-end px-6 pb-6">
          <button
            onClick={() => router.back()}
            className="absolute top-5 left-5 flex items-center gap-1.5 text-[13px] font-semibold px-3 py-1.5 rounded-lg transition-all"
            style={{ backgroundColor: "rgba(0,0,0,0.2)", color: c.accent }}
          >
            <ArrowLeft size={15} strokeWidth={2.5} />
            Back
          </button>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.15em] mb-1" style={{ color: c.accent + "99" }}>
              Account
            </p>
            <h1 className="text-[26px] font-black leading-none text-white">My Profile</h1>
          </div>
        </div>
      </div>

      <div className="w-full max-w-4xl mx-auto px-5 sm:px-6 -mt-12 pb-20 relative z-10 flex flex-col gap-5">

        {/* ── Profile card ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-white rounded-2xl border border-black/5 shadow-[0_4px_24px_rgba(28,51,25,0.08)] overflow-hidden"
        >
          {/* Avatar + name row */}
          <div className="px-6 pt-6 pb-5 flex flex-col sm:flex-row items-start sm:items-center gap-5 border-b border-black/5">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div
                className="w-20 h-20 rounded-2xl flex items-center justify-center text-[28px] font-black shadow-md"
                style={{ backgroundColor: c.accent, color: c.primary }}
              >
                {initials}
              </div>
              <button
                className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-lg flex items-center justify-center shadow-md transition-transform hover:scale-110"
                style={{ backgroundColor: c.primary, color: c.accent }}
              >
                <Camera size={13} strokeWidth={2.5} />
              </button>
            </div>

            {/* Name + email */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-[22px] font-black leading-tight" style={{ color: c.primary }}>
                  {profile?.display_name || `${profile?.first_name} ${profile?.last_name}`}
                </h2>
                <span
                  className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full border"
                  style={{ backgroundColor: c.primary + "10", color: c.primary, borderColor: c.primary + "20" }}
                >
                  Customer
                </span>
              </div>
              <p className="flex items-center gap-1.5 mt-1 text-[13px] font-medium" style={{ color: c.primary + "99" }}>
                <Mail size={13} strokeWidth={2} />
                {profile?.email}
              </p>
            </div>

            {/* Edit / Save button */}
            <button
              onClick={() => isEditing ? handleSave() : setIsEditing(true)}
              className="flex-shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13.5px] font-bold transition-all hover:-translate-y-0.5 hover:shadow-md active:scale-95"
              style={
                isEditing
                  ? { backgroundColor: c.primary, color: c.accent }
                  : { backgroundColor: c.accent + "18", color: c.primary }
              }
            >
              {isEditing ? (
                saving
                  ? <div className="w-4 h-4 rounded-full border-2 border-current/30 border-t-current animate-spin" />
                  : <><Check size={15} strokeWidth={2.5} /> Save</>
              ) : (
                <><Edit2 size={15} strokeWidth={2.5} /> Edit Profile</>
              )}
            </button>
          </div>

          {/* Form fields */}
          <div className="px-6 py-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ProfileField
              icon={User}
              label="First Name"
              value={profile?.first_name}
              isEditing={isEditing}
              c={c}
              onChange={(v: string) => setProfile({ ...profile, first_name: v })}
            />
            <ProfileField
              icon={User}
              label="Last Name"
              value={profile?.last_name}
              isEditing={isEditing}
              c={c}
              onChange={(v: string) => setProfile({ ...profile, last_name: v })}
            />
            <ProfileField
              icon={Phone}
              label="Contact Number"
              value={profile?.contact_number}
              isEditing={isEditing}
              c={c}
              onChange={(v: string) => setProfile({ ...profile, contact_number: v })}
            />
            <ProfileField
              icon={MapPin}
              label="Delivery Address"
              value={profile?.address}
              isEditing={isEditing}
              c={c}
              onChange={(v: string) => setProfile({ ...profile, address: v })}
            />
          </div>
        </motion.div>

        {/* ── Stat cards ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="grid grid-cols-1 sm:grid-cols-2 gap-4"
        >
          {/* Orders card */}
          <div
            className="stat-card bg-white rounded-2xl border border-black/5 shadow-[0_2px_12px_rgba(28,51,25,0.06)] p-5 flex items-start gap-4 cursor-pointer"
            onClick={() => router.push(`/${businessName}/customer/orders`)}
          >
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: c.accent + "20", color: c.accent }}
            >
              <Package size={20} strokeWidth={1.8} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-widest mb-0.5" style={{ color: c.text + "55" }}>
                Recent Orders
              </p>
              <p className="text-[22px] font-black leading-none" style={{ color: c.text }}>
                {orderCount}
                <span className="text-[13px] font-medium ml-1.5 opacity-50">last 30 days</span>
              </p>
              <p className="text-[12px] font-medium mt-1.5" style={{ color: c.text + "55" }}>
                {orderCount > 0
                  ? "Keep exploring our menu!"
                  : "Place your first order today."}
              </p>
            </div>
            <ChevronRight size={16} style={{ color: c.text + "40" }} className="mt-1 flex-shrink-0" />
          </div>

          {/* Security card */}
          <div className="stat-card bg-white rounded-2xl border border-black/5 shadow-[0_2px_12px_rgba(28,51,25,0.06)] p-5 flex items-start gap-4">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: c.primary + "12", color: c.primary }}
            >
              <ShieldCheck size={20} strokeWidth={1.8} />
            </div>
            <div className="flex-1">
              <p className="text-[11px] font-bold uppercase tracking-widest mb-0.5" style={{ color: c.text + "55" }}>
                Security
              </p>
              <p className="text-[15px] font-bold leading-snug" style={{ color: c.text }}>
                Account Protected
              </p>
              <p className="text-[12px] font-medium mt-1.5 leading-relaxed" style={{ color: c.text + "55" }}>
                Secured via email authentication. Keep your password confidential.
              </p>
            </div>
          </div>
        </motion.div>

        {/* ── Sign out ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18, duration: 0.4 }}
        >
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-between px-5 py-4 bg-white rounded-2xl border border-black/5 shadow-[0_2px_12px_rgba(28,51,25,0.04)] hover:bg-red-50 hover:border-red-100 transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-red-50 group-hover:bg-red-100 flex items-center justify-center transition-colors">
                <LogOut size={17} className="text-red-500" strokeWidth={2} />
              </div>
              <div className="text-left">
                <p className="text-[14px] font-bold text-red-500">Sign Out</p>
                <p className="text-[11.5px] text-red-400/70 font-medium">You'll be redirected to login</p>
              </div>
            </div>
            <ChevronRight size={16} className="text-red-300 group-hover:text-red-400 transition-colors" />
          </button>
        </motion.div>

      </div>
    </div>
  );
}

// ── Field Component ──────────────────────────────────────────────────────────
function ProfileField({
  icon: Icon, label, value, isEditing, onChange, c,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  isEditing: boolean;
  onChange: (v: string) => void;
  c: { primary: string; accent: string; text: string; bg: string };
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest"
        style={{ color: c.primary + "8C" }}
      >
        <Icon size={12} strokeWidth={2.5} />
        {label}
      </label>
      {isEditing ? (
        <input
          type="text"
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          className="profile-input px-3.5 py-2.5 rounded-xl border text-[14px] font-medium outline-none transition-all"
          style={{
            backgroundColor: c.bg,
            borderColor: c.primary + "25",
            color: c.primary,
            // @ts-ignore
            "--accent": c.accent,
            "--accent-10": c.accent + "18",
          }}
        />
      ) : (
        <div
          className="px-3.5 py-2.5 rounded-xl text-[14px] font-semibold"
          style={{ backgroundColor: c.primary + "0A", color: value ? c.primary : c.primary + "59" }}
        >
          {value || "Not set"}
        </div>
      )}
    </div>
  );
}