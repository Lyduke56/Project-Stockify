"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { Loader2, Save, Upload, CheckCircle2, AlertCircle, Trash2, Store, CreditCard, QrCode, Info } from "lucide-react";
import { 
  fetchTenantSettings, 
  updateTenantSettings, 
  uploadStoreAsset, 
  type TenantSettings 
} from "@/lib/admin/settings-actions";
import { createClient } from "@/lib/supabase/client";
import LoadingScreen from "@/app/loading-screen/loading";

// ─── Animation Variants ──────────────────────────────────────────────────────

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.5,
      staggerChildren: 0.1,
      when: "beforeChildren",
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { type: "spring", stiffness: 300, damping: 24 }
  },
};

// ─── Main Component ───────────────────────────────────────────────────────────

interface StoreSettingsSectionProps {
  colors?: {
    color_primary?: string;
    color_background?: string;
    color_secondary?: string;
    color_accent?: string;
    color_text?: string;
    color_sidebar_text?: string;
  };
}

export default function StoreSettingsSection({ colors }: StoreSettingsSectionProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tenantId, setTenantId] = useState("");
  const [settings, setSettings] = useState<TenantSettings | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  
  const qrInputRef = useRef<HTMLInputElement>(null);

  // ─── Data Fetching ──────────────────────────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const { data: u } = await supabase.from("users").select("tenant_id").eq("user_id", user.id).single();
      if (!u?.tenant_id) return;
      
      setTenantId(u.tenant_id);
      const data = await fetchTenantSettings(u.tenant_id);
      setSettings(data);
      setLoading(false);
    };
    init();
  }, []);

  // ─── Handlers ───────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!settings || !tenantId) return;
    setSaving(true);
    setFeedback(null);
    
    const { error } = await updateTenantSettings(tenantId, settings);
    
    setSaving(false);
    if (error) {
      setFeedback({ type: "error", msg: error });
    } else {
      setFeedback({ type: "success", msg: "Settings saved successfully!" });
      setTimeout(() => setFeedback(null), 3000);
    }
  };

  const handleQRUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !tenantId) return;

    setSaving(true);
    const { url, error } = await uploadStoreAsset(file, `tenants/${tenantId}/qrcodes`);
    
    if (error) {
      setFeedback({ type: "error", msg: "Failed to upload QR code: " + error });
      setSaving(false);
    } else if (url) {
      setSettings(prev => prev ? { ...prev, gcash_qr_url: url } : null);
      await updateTenantSettings(tenantId, { gcash_qr_url: url });
      setSaving(false);
      setFeedback({ type: "success", msg: "QR code uploaded!" });
      setTimeout(() => setFeedback(null), 3000);
    }
  };

  if (loading) {
    return (
      <LoadingScreen fullScreen={false} bgColor={colors?.color_background}/>
    );
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="flex flex-col w-full min-h-screen font-['Inter'] pt-5 pb-12"
      style={{ backgroundColor: "var(--color-background)" }}
    >
      {/* PAGE HEADER */}
      <motion.header variants={itemVariants} className="w-full flex flex-col items-center mb-8 gap-2 px-4">
        <h1 className="text-primary text-[30px] font-extrabold uppercase tracking-tight">
          Store Settings
        </h1>
        <div className="w-full max-w-[900px] h-1.5 bg-accent rounded-full opacity-60" />
      </motion.header>

      {/* MAIN CONTENT WRAPPER */}
      <div className="w-full max-w-5xl mx-auto flex flex-col gap-6 lg:gap-8">
        
        {/* INFO BANNER */}
        <motion.div variants={itemVariants} className="flex items-start gap-3 bg-primary/5 border border-primary/20 rounded-2xl p-4">
          <Info className="text-primary shrink-0 mt-0.5" size={18} />
          <p className="text-primary/80 text-sm font-medium leading-relaxed">
            Update your core business details, payment preferences, and delivery options here. These settings directly affect what your customers see and how they check out on your storefront.
          </p>
        </motion.div>

        {/* TOP ROW: Business Profile & Payment Delivery (Perfectly balanced side-by-side) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-start">
          
          {/* COLUMN 1: BUSINESS INFORMATION */}
          <motion.div variants={itemVariants} className="flex flex-col gap-6 p-7 w-full bg-background rounded-[20px] border border-primary shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-primary/20" />
            
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 bg-primary/10 rounded-xl">
                <Store className="text-primary" size={20} />
              </div>
              <h3 className="text-primary text-[17px] font-black uppercase tracking-wide">Business Profile</h3>
            </div>
            
            <div className="flex flex-col gap-5">
              {[
                { label: "Business Name", key: "business_name", placeholder: "e.g., Green Earth Grocery" },
                { label: "Contact Number", key: "contact_number", placeholder: "e.g., +63 900 000 0000" },
                { label: "Operating Hours", key: "operating_hours", placeholder: "e.g., Mon-Fri, 9AM - 6PM" },
              ].map((item) => (
                <div key={item.label} className="flex flex-col gap-1.5 group">
                  <label className="text-primary font-bold text-[13px] ml-1 opacity-80 group-focus-within:opacity-100 transition-opacity">
                    {item.label}
                  </label>
                  <input
                    type="text"
                    value={settings?.[item.key as keyof TenantSettings] as string || ""}
                    onChange={(e) => setSettings(prev => prev ? { ...prev, [item.key]: e.target.value } : null)}
                    placeholder={item.placeholder}
                    className="w-full border border-primary hover:border-primary focus:border-primary focus:ring-4 focus:ring-primary/10 rounded-xl px-4 py-3 bg-background focus:bg-background text-primary placeholder-primary/30 outline-none font-medium text-sm transition-all"
                  />
                </div>
              ))}
            </div>
          </motion.div>

          {/* COLUMN 2: PAYMENT METHODS */}
          <motion.div variants={itemVariants} className="flex flex-col gap-5 p-7 w-full bg-background rounded-[20px] border border-primary shadow-sm relative overflow-hidden h-full">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-accent/40" />
            
            <div className="flex items-center gap-3 mb-1">
              <div className="p-2.5 bg-accent/10 rounded-xl">
                <CreditCard className="text-accent drop-shadow-sm" size={20} />
              </div>
              <h3 className="text-primary text-[17px] font-black uppercase tracking-wide">Payment & Delivery</h3>
            </div>

            <div className="flex flex-col gap-3">
              {[
                { label: "Enable Cash-on-Delivery (COD)", key: "cod_enabled" },
                { label: "Enable QR Code Payment", key: "qr_enabled" },
                { label: "Enable Nationwide Delivery", key: "nationwide_delivery" },
              ].map((method) => {
                const isActive = settings?.[method.key as keyof TenantSettings];
                return (
                  <div 
                    key={method.key}
                    className={`flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer group ${
                      isActive ? 'bg-primary/5 border-primary/30' : 'bg-transparent border-primary/10 hover:border-primary/30'
                    }`}
                    onClick={() => setSettings(prev => prev ? { ...prev, [method.key]: !isActive } : null)}
                  >
                    <span className="text-primary font-bold text-sm select-none">{method.label}</span>
                    <div className={`w-12 h-6 rounded-full relative transition-colors duration-300 ${isActive ? 'bg-primary' : 'bg-primary/20'}`}>
                      <motion.div 
                        layout
                        className={`absolute top-1 w-4 h-4 rounded-full shadow-sm transition-colors ${isActive ? 'bg-white' : 'bg-white'}`}
                        initial={false}
                        animate={{ x: isActive ? 28 : 4 }}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </div>

        {/* BOTTOM ROW: GCASH QR CODE (Full Width, Horizontal Layout) */}
        <motion.div variants={itemVariants} className="flex flex-col md:flex-row items-center justify-between gap-8 p-7 w-full bg-background rounded-[20px] border border-primary shadow-md relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-500/40 hidden md:block" />
          <div className="absolute top-0 left-0 w-full h-1.5 bg-blue-500/40 block md:hidden" />
          
          {/* Left Text Side */}
          <div className="flex flex-col gap-3 flex-1 md:pl-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-50 rounded-xl shrink-0">
                <QrCode className="text-blue-500" size={20} />
              </div>
              <h3 className="text-primary text-[17px] font-black uppercase tracking-wide">GCash QR Code</h3>
            </div>
            <p className="text-primary/70 text-[14px] font-medium leading-relaxed max-w-lg">
              Upload your official GCash QR code here. When customers choose to pay via QR, they will scan this image at checkout to send payments directly to your account.
            </p>
          </div>

          {/* Right Upload Side */}
          <div className="flex flex-col items-center justify-center gap-3 bg-background rounded-xl border border-primary p-4 w-full md:w-auto shrink-0">
            {settings?.gcash_qr_url ? (
              <div className="relative group w-40 h-40">
                <img 
                  src={settings.gcash_qr_url} 
                  alt="GCash QR Code" 
                  className="w-full h-full object-contain rounded-xl border-2 border-primary p-2 bg-background shadow-sm transition-transform group-hover:scale-[1.02]" 
                />
                <button 
                  onClick={() => setSettings(prev => prev ? { ...prev, gcash_qr_url: null } : null)}
                  className="absolute -top-3 -right-3 w-8 h-8 bg-white border-2 border-red-100 text-red-500 rounded-full flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-all hover:bg-red-50 hover:border-red-200 hover:scale-110"
                  title="Remove QR Code"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ) : (
              <div 
                onClick={() => qrInputRef.current?.click()}
                className="w-40 h-40 bg-background border-2 border-dashed border-primary hover:border-accent hover:bg-primary/5 rounded-2xl flex flex-col items-center justify-center gap-3 cursor-pointer transition-all group"
              >
                <div className="p-3 bg-primary/5 rounded-full group-hover:scale-110 transition-transform">
                  <Upload size={24} className="text-primary/60" />
                </div>
                <p className="text-primary/60 text-[11px] font-bold uppercase tracking-widest text-center px-2">Click to Upload</p>
              </div>
            )}
            
            <input 
              type="file" 
              ref={qrInputRef} 
              onChange={handleQRUpload} 
              className="hidden" 
              accept="image/*" 
            />

            {settings?.gcash_qr_url && (
              <button
                onClick={() => qrInputRef.current?.click()}
                className="mt-1 px-5 py-2 rounded-full border-2 border-primary/10 text-primary font-bold text-[12px] hover:bg-primary hover:text-[var(--color-background)] hover:border-primary transition-all shadow-sm"
              >
                Replace Image
              </button>
            )}
          </div>
        </motion.div>

        {/* FEEDBACK & ACTIONS */}
        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-2 pt-6 border-t border-primary/10">
          <div className="flex-1 min-h-[44px] flex items-center">
            <AnimatePresence mode="wait">
              {feedback && (
                <motion.div 
                  key="feedback"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={`flex items-center gap-2.5 px-5 py-2.5 rounded-full font-bold text-[13px] w-fit shadow-sm border ${
                    feedback.type === "success" 
                      ? "bg-green-50 text-green-700 border-green-200" 
                      : "bg-red-50 text-red-700 border-red-200"
                  }`}
                >
                  {feedback.type === "success" ? <CheckCircle2 size={16} className="text-green-600" /> : <AlertCircle size={16} className="text-red-600" />}
                  {feedback.msg}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2.5 px-8 py-3.5 rounded-full font-bold text-[14px] transition-all hover:brightness-110 active:scale-95 shadow-md disabled:opacity-60 bg-primary shrink-0 w-full sm:w-auto justify-center group"
            style={{ color: "var(--color-sidebar-text, #FFF9D7)" }}
          >
            {saving ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Save size={18} className="group-hover:scale-110 transition-transform" />
            )}
            {saving ? "Saving Changes..." : "Save Settings"}
          </button>
        </motion.div>
        
      </div>
    </motion.div>
  );
}