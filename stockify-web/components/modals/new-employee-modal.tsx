"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { createClient } from "@/lib/supabase/client";

interface NewEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface UserProfile {
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  created_at: string;
}

export default function NewEmployeeModal({ isOpen, onClose }: NewEmployeeModalProps) {
  const supabase = createClient();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!isOpen) return;

    const fetchUserProfile = async () => {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // FIXED SCHEMA MAPPING: Correctly points to 'user_id' matching your app database pattern
        const { data, error } = await supabase
          .from("users")
          .select("first_name, last_name, email, role, created_at")
          .eq("user_id", user.id) 
          .single();

        if (error) {
          console.error("Supabase payload lookup mismatch:", error.message);
        }

        if (data) {
          setProfile(data);
        }
      } catch (err) {
        console.error("Error fetching employee profile context:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [isOpen, supabase]);

  // SAFE STRUCTURAL Hydration Shield Loop Check
  if (!isOpen) return null;
  if (typeof window === "undefined" || !document.body) return null;

  // Safe Extraction fallbacks for names
  const firstName = profile?.first_name || "Employee";
  const lastName = profile?.last_name || "";
  const initials = ((firstName[0] || "") + (lastName[0] || "")).toUpperCase() || "E";

  return createPortal(
    <div
      // FIXED LAYOUT LAYER INDEX: Elevated to z-[999999] backdrop visibility matrix
      className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/50 backdrop-blur-[4px] p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[480px] bg-[#FFFCF0] border border-[#385E31]/20 rounded-[24px] shadow-2xl p-6 md:p-8 flex flex-col animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Block Row */}
        <div className="flex items-center justify-between pb-4 mb-6 border-b border-[#385E31]/10">
          <h2 className="text-xl font-bold uppercase tracking-wider text-[#385E31] font-sans">
            My Profile
          </h2>
          <button 
            onClick={onClose}
            className="text-[#385E31]/60 hover:text-[#385E31] text-lg font-bold transition-transform hover:scale-110 cursor-pointer focus:outline-none"
          >
            ✕
          </button>
        </div>

        {/* Dynamic Context Loading Spinner Layout */}
        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center gap-3 text-sm font-semibold text-[#385E31]/60">
            <svg className="animate-spin h-5 w-5 text-[#385E31]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Syncing workspace user context...</span>
          </div>
        ) : profile ? (
          <div className="flex flex-col gap-5">
            
            {/* User Profile Circular Avatar Badge Row Component */}
            <div className="flex items-center gap-4 pb-2">
              <div 
                className="w-16 h-16 rounded-full bg-[#385E31]/[0.08] border border-[#385E31]/20 flex items-center justify-center text-xl font-bold tracking-wider select-none text-[#385E31]"
              >
                {initials}
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-bold text-[#385E31] leading-tight">
                  {firstName} {lastName}
                </span>
                <span className="text-xs font-semibold uppercase tracking-wide text-[#E5AD24] mt-0.5">
                  {profile.role || "Workspace Employee"}
                </span>
              </div>
            </div>

            {/* Read-Only Profile Display Block Formats */}
            <div className="grid grid-cols-1 gap-4">
              
              <div className="flex flex-col border-b border-[#385E31]/10 pb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#385E31]/45 mb-0.5">
                  Email Address
                </span>
                <span className="text-[13px] font-semibold text-[#385E31] break-all">
                  {profile.email || "—"}
                </span>
              </div>

              <div className="flex flex-col border-b border-[#385E31]/10 pb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#385E31]/45 mb-0.5">
                  Joined Organization
                </span>
                <span className="text-[13px] font-semibold text-[#385E31]">
                  {profile.created_at ? new Date(profile.created_at).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  }) : "—"}
                </span>
              </div>

            </div>
          </div>
        ) : (
          <div className="py-12 text-center text-sm font-bold text-red-600 bg-red-50 rounded-xl border border-red-200">
            Failed to parse account context records.
          </div>
        )}

        {/* Footer Actions Action Control Center */}
        <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-[#385E31]/10">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-lg bg-[#385E31] text-[#FFFCF0] font-bold text-xs uppercase tracking-wider hover:brightness-110 active:scale-98 transition cursor-pointer focus:outline-none"
          >
            Close Profile
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}