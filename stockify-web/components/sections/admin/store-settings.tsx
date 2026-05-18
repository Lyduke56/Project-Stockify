"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Loader2, Save, Upload, CheckCircle2, AlertCircle, Trash2 } from "lucide-react";
import { 
  fetchTenantSettings, 
  updateTenantSettings, 
  uploadStoreAsset, 
  type TenantSettings 
} from "@/lib/admin/settings-actions";
import { createClient } from "@/lib/supabase/client";

// Animation Variants
const containerVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
};

export default function StoreSettingsSection() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tenantId, setTenantId] = useState("");
  const [settings, setSettings] = useState<TenantSettings | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  
  const qrInputRef = useRef<HTMLInputElement>(null);

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
      // Automatically save the URL to settings
      await updateTenantSettings(tenantId, { gcash_qr_url: url });
      setSaving(false);
      setFeedback({ type: "success", msg: "QR code uploaded!" });
      setTimeout(() => setFeedback(null), 3000);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#FFFCEB] text-[#385E31] gap-4">
        <Loader2 className="animate-spin" size={40} />
        <p className="font-bold uppercase tracking-widest text-sm">Loading Settings...</p>
      </div>
    );
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="flex flex-col w-full min-h-screen bg-[#FFFCEB] font-['Inter'] pt-5 pb-12"
    >
      {/* PAGE HEADER */}
      <motion.header variants={itemVariants} className="w-full flex flex-col items-center mb-12 gap-2">
        <h1 className="text-[#385E31] text-[30px] font-extrabold uppercase tracking-tight">
          Store Settings
        </h1>
        <div className="w-full max-w-[900px] h-1.5 bg-[#F7B71D] rounded-full opacity-60" />
      </motion.header>

      <motion.div variants={itemVariants} className="flex flex-col gap-8 w-full max-w-5xl mx-auto px-4">
        
        {/* BUSINESS INFORMATION SECTION */}
        <div className="flex flex-col gap-6 p-8 w-full bg-white rounded-[24px] border border-[#385E31]/10 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-[#F7B71D]" />
          <div className="flex flex-col gap-1">
            <h3 className="text-[#385E31] text-[18px] font-black uppercase">
              Business Information
            </h3>
            <p className="text-[#385E31]/60 text-sm font-medium">
              Update your core business details visible to customers in the storefront top bar.
            </p>
          </div>
          
          <div className="flex flex-col gap-5">
            {[
              { label: "Business Name", key: "business_name", placeholder: "e.g., Green Earth Grocery" },
              { label: "Contact Number", key: "contact_number", placeholder: "e.g., +63 900 000 0000" },
              { label: "Operating Hours", key: "operating_hours", placeholder: "e.g., Mon-Fri, 9AM - 6PM" },
            ].map((item) => (
              <div key={item.label} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                <label className="text-[#385E31] font-bold text-sm sm:w-48 shrink-0">
                  {item.label}
                </label>
                <input
                  type="text"
                  value={settings?.[item.key as keyof TenantSettings] as string || ""}
                  onChange={(e) => setSettings(prev => prev ? { ...prev, [item.key]: e.target.value } : null)}
                  placeholder={item.placeholder}
                  className="flex-1 border border-[#385E31]/20 rounded-xl px-5 py-3 bg-[#385E31]/5 text-[#385E31] placeholder-[#385E31]/30 outline-none font-medium text-sm transition-all focus:ring-2 focus:ring-[#F7B71D]/50 focus:bg-white"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* PAYMENT METHODS SECTION */}
          <div className="flex flex-col gap-6 p-8 w-full bg-white rounded-[24px] border border-[#385E31]/10 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-[#385E31]" />
            <div className="flex flex-col gap-1 mb-2">
              <h3 className="text-[#385E31] text-[18px] font-black uppercase">
                Payment & Delivery
              </h3>
              <p className="text-[#385E31]/60 text-sm font-medium">
                Select which checkout and delivery options are available.
              </p>
            </div>

            <div className="flex flex-col gap-4">
              {[
                { label: "Enable Cash-on-Delivery (COD)", key: "cod_enabled" },
                { label: "Enable QR Code Payment", key: "qr_enabled" },
                { label: "Enable Nationwide Delivery", key: "nationwide_delivery" },
              ].map((method) => (
                <div 
                  key={method.key}
                  className="flex items-center justify-between p-4 rounded-2xl border border-[#385E31]/10 hover:bg-[#385E31]/5 transition-colors cursor-pointer group"
                  onClick={() => setSettings(prev => prev ? { ...prev, [method.key]: !prev[method.key as keyof TenantSettings] } : null)}
                >
                  <span className="text-[#385E31] font-bold text-sm">{method.label}</span>
                  <div className={`w-12 h-6 rounded-full relative transition-all duration-300 ${settings?.[method.key as keyof TenantSettings] ? 'bg-[#385E31]' : 'bg-[#385E31]/20'}`}>
                    <motion.div 
                      layout
                      className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm"
                      initial={false}
                      animate={{ 
                        x: settings?.[method.key as keyof TenantSettings] ? 28 : 4 
                      }}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* GCASH QR CODE SECTION */}
          <div className="flex flex-col gap-6 p-8 w-full bg-white rounded-[24px] border border-[#385E31]/10 shadow-sm relative overflow-hidden">
             <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-500" />
             <div className="flex flex-col gap-1 mb-2">
              <h3 className="text-[#385E31] text-[18px] font-black uppercase">
                GCash QR Code
              </h3>
              <p className="text-[#385E31]/60 text-sm font-medium">
                Upload your GCash QR code for customer payments.
              </p>
            </div>

            <div className="flex flex-col items-center justify-center gap-6 h-full min-h-[200px]">
              {settings?.gcash_qr_url ? (
                <div className="relative group w-48 h-48">
                  <img 
                    src={settings.gcash_qr_url} 
                    alt="GCash QR Code" 
                    className="w-full h-full object-contain rounded-2xl border-2 border-[#385E31]/10 p-2 bg-white" 
                  />
                  <button 
                    onClick={() => setSettings(prev => prev ? { ...prev, gcash_qr_url: null } : null)}
                    className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ) : (
                <div 
                  onClick={() => qrInputRef.current?.click()}
                  className="w-48 h-48 bg-[#385E31]/5 border-2 border-dashed border-[#385E31]/20 rounded-2xl flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-[#385E31]/10 transition-colors"
                >
                  <Upload size={32} className="text-[#385E31]/40" />
                  <p className="text-[#385E31]/40 text-xs font-bold uppercase tracking-wider">Upload QR Code</p>
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
                  className="px-6 py-2.5 rounded-full border border-[#385E31]/20 text-[#385E31] font-bold text-xs hover:bg-[#385E31]/5 transition-colors"
                >
                  Replace Image
                </button>
              )}
            </div>
          </div>
        </div>

        {/* FEEDBACK & ACTIONS */}
        <div className="flex flex-col gap-4 mt-4">
          {feedback && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex items-center gap-3 px-6 py-4 rounded-2xl font-bold text-sm ${
                feedback.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"
              }`}
            >
              {feedback.type === "success" ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
              {feedback.msg}
            </motion.div>
          )}

          <div className="flex justify-center pt-4">
            <button
              onClick={handleSave}
              disabled={saving}
              className="group relative flex items-center justify-center gap-3 bg-[#385E31] text-[#F7B71D] px-12 py-4 rounded-full font-black text-[15px] uppercase tracking-widest shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-70 disabled:scale-100"
            >
              {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
              {saving ? "Saving Changes..." : "Save Store Settings"}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}