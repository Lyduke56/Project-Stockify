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
  Heart,
  Bell,
  LogOut,
  Camera,
  Edit2,
  Check,
  Package
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { CustomerHeader } from "@/components/headers/customer-header";
import { getStorefrontTenant } from "@/backend/hooks/getStoreFront";

export default function CustomerProfilePage() {
  const params = useParams();
  const router = useRouter();
  const businessName = params?.businessName as string;
  const supabase = createClient();

  const [profile, setProfile] = useState<any>(null);
  const [tenant, setTenant] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchProfile = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push(`/${businessName}/login`);
      return;
    }

    const [profileRes, tenantRes] = await Promise.all([
      supabase.from("users").select("*").eq("user_id", user.id).single(),
      getStorefrontTenant(user.id)
    ]);

    if (!profileRes.error && profileRes.data) {
      setProfile(profileRes.data);
    }
    if (tenantRes) {
      setTenant(tenantRes);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push(`/${businessName}/login`);
  };

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("users")
      .update({
        first_name: profile.first_name,
        last_name: profile.last_name,
        contact_number: profile.contact_number,
        address: profile.address
      })
      .eq("user_id", profile.user_id);

    if (!error) {
      setIsEditing(false);
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFFCEB] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#385E31]/10 border-t-[#F7B71D] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFFCEB] font-['Fredoka'] text-[#385E31] flex flex-col">
      <CustomerHeader 
        businessName={businessName}
        tenantLogo={tenant?.logo_url ?? undefined}
        tenantName={tenant?.business_name}
        showSearch={false}
      />

      {/* Top Banner */}
      <div className="h-48 bg-[#385E31] relative">
        <button
          onClick={() => router.back()}
          className="absolute top-6 left-6 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full transition-colors z-10"
        >
          <ArrowLeft size={24} />
        </button>
      </div>

      <div className="max-w-3xl w-full mx-auto px-6 -mt-32 pb-20 relative z-10">
        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[32px] shadow-xl border border-[#385E31]/5 overflow-hidden"
        >
          <div className="p-8">
            {/* Profile Picture & Basic Info */}
            <div className="flex flex-col md:flex-row items-center gap-6 mb-10">
              <div className="relative group">
                <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-[#F7B71D] to-[#FFD980] flex items-center justify-center border-4 border-white shadow-lg overflow-hidden">
                  <User size={64} className="text-[#385E31]/30" />
                </div>
                <button className="absolute -bottom-2 -right-2 p-2.5 bg-[#385E31] text-[#F7B71D] rounded-xl shadow-lg hover:scale-110 transition-transform">
                  <Camera size={18} />
                </button>
              </div>

              <div className="text-center md:text-left flex-1">
                <div className="flex items-center justify-center md:justify-start gap-3 mb-1">
                  <h1 className="text-3xl font-black">{profile?.display_name}</h1>
                  <span className="px-3 py-1 bg-[#385E31]/5 text-[#385E31] text-[11px] font-bold uppercase rounded-full border border-[#385E31]/10 tracking-widest">
                    Customer
                  </span>
                </div>
                <p className="text-[#8C9B85] font-medium flex items-center justify-center md:justify-start gap-2">
                  <Mail size={16} /> {profile?.email}
                </p>
              </div>

              <button
                onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                className={`px-6 py-3 rounded-2xl font-bold flex items-center gap-2 transition-all ${isEditing
                  ? "bg-[#385E31] text-[#F7B71D] hover:opacity-90"
                  : "bg-[#F7B71D]/10 text-[#385E31] hover:bg-[#F7B71D]/20"
                  }`}
              >
                {isEditing ? (
                  saving ? <div className="w-5 h-5 border-2 border-[#F7B71D]/30 border-t-[#F7B71D] rounded-full animate-spin" /> : <><Check size={18} /> Save Profile</>
                ) : (
                  <><Edit2 size={18} /> Edit Profile</>
                )}
              </button>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <DetailItem
                icon={<User size={20} />}
                label="First Name"
                value={profile?.first_name}
                isEditing={isEditing}
                onChange={(val: string) => setProfile({ ...profile, first_name: val })}
              />
              <DetailItem
                icon={<User size={20} />}
                label="Last Name"
                value={profile?.last_name}
                isEditing={isEditing}
                onChange={(val: string) => setProfile({ ...profile, last_name: val })}
              />
              <DetailItem
                icon={<Phone size={20} />}
                label="Contact Number"
                value={profile?.contact_number}
                isEditing={isEditing}
                onChange={(val: string) => setProfile({ ...profile, contact_number: val })}
              />
              <DetailItem
                icon={<MapPin size={20} />}
                label="Address"
                value={profile?.address}
                isEditing={isEditing}
                onChange={(val: string) => setProfile({ ...profile, address: val })}
              />
            </div>
          </div>

          {/* Quick Actions Footer */}
          <div className="bg-[#385E31]/5 px-8 py-6 flex flex-wrap gap-4 justify-between border-t border-[#385E31]/5">
            <div className="flex gap-4">
              <ActionButton
                icon={<Heart size={20} />}
                label="Favorites"
                onClick={() => router.push(`/${businessName}/customer/food-and-beverage/storefront`)}
              />
              <ActionButton
                icon={<Bell size={20} />}
                label="Alerts"
                onClick={() => { }}
              />
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-red-500 font-bold hover:bg-red-50 px-4 py-2 rounded-xl transition-colors"
            >
              <LogOut size={20} /> Sign Out
            </button>
          </div>
        </motion.div>

        {/* Info Cards */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-[24px] border border-[#385E31]/5 shadow-sm">
            <h3 className="font-bold mb-2 flex items-center gap-2">
              <Package size={20} className="text-[#F7B71D]" /> Recent Activity
            </h3>
            <p className="text-[#8C9B85] text-sm leading-relaxed">
              You have placed 0 orders in the last 30 days. Keep exploring our menu to find your favorites!
            </p>
          </div>
          <div className="bg-white p-6 rounded-[24px] border border-[#385E31]/5 shadow-sm">
            <h3 className="font-bold mb-2 flex items-center gap-2">
              <Bell size={20} className="text-[#F7B71D]" /> Security
            </h3>
            <p className="text-[#8C9B85] text-sm leading-relaxed">
              Your account is secured with email authentication. Always keep your password confidential.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailItem({ icon, label, value, isEditing, onChange }: any) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[12px] font-bold text-[#8C9B85] uppercase tracking-wider flex items-center gap-2">
        {React.cloneElement(icon, { size: 14 })} {label}
      </label>
      {isEditing ? (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="bg-[#FFFCEB] border border-[#385E31]/10 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-[#F7B71D] transition-all font-medium"
        />
      ) : (
        <div className="bg-[#FFFCEB] px-4 py-2.5 rounded-xl border border-transparent font-bold">
          {value || "Not set"}
        </div>
      )}
    </div>
  );
}

function ActionButton({ icon, label, onClick }: any) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-[#385E31]/10 font-bold text-sm shadow-sm hover:shadow-md transition-all active:scale-95"
    >
      <span className="text-[#F7B71D]">{icon}</span>
      {label}
    </button>
  );
}
