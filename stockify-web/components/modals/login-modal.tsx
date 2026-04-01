"use client";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";
import { getBusinessNameByUserId } from "@/backend/hooks/getTenantBName";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
  
  const router = useRouter();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  
  const supabase = createClient();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }
   

    if (data?.user) {
    const businessName = await getBusinessNameByUserId(data.user.id);
    
    setLoading(false); // Stop loading after the hook finishes

    if (businessName) {
      onClose();
      router.push(`/admin/${businessName}/dashboard/`);
      router.refresh();   
    } else {
      setError("Could not find your business name. Please contact support.");
    }
  }
           
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative flex w-[900px] min-h-[520px] rounded-[24px] bg-[#385E31] border-[3px] border-[#F7B71D] shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-5 text-[#F7B71D] text-2xl font-bold hover:opacity-75 transition-opacity z-10 font-['Fredoka']"
        >
          ✕
        </button>

        <div className="flex flex-1 items-end justify-center px-6 pt-10">
          <img src="/auth/left-login-illus.svg" alt="Stockify illustration" className="w-120 h-120 object-contain" />
        </div>

        <div className="flex flex-col justify-center w-[430px] bg-[#F5F0C8] rounded-[20px] my-5 mr-5 px-10 py-10 shadow-inner">
          <h1 className="font-['Fredoka'] font-bold text-[42px] leading-tight text-[#2D4B24] mb-1">SIGN IN</h1>
          <p className="font-['Fredoka'] font-normal text-[14px] text-[#4a4a4a] mb-7">Please enter your details to continue.</p>

          {/* Error Message */}
          {error && (
            <p className="font-['Fredoka'] text-[13px] text-red-600 bg-red-100 px-4 py-2 rounded-xl mb-4">
              {error}
            </p>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <input
              type="email"
              placeholder="Email:"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-[#EEBB46] placeholder-[#7a5c00] text-[#3A3A3A] font-['Fredoka'] text-[16px] px-5 py-3 rounded-full outline-none focus:ring-2 focus:ring-[#385E31] transition"
            />
            <input
              type="password"
              placeholder="Password:"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-[#EEBB46] placeholder-[#7a5c00] text-[#3A3A3A] font-['Fredoka'] text-[16px] px-5 py-3 rounded-full outline-none focus:ring-2 focus:ring-[#385E31] transition"
            />
            <div className="flex justify-end -mt-2">
              <button
                type="button"
                onClick={() => router.push("/auth/forgot-password")}
                className="font-['Fredoka'] text-[13px] text-[#555] hover:text-[#385E31] transition-colors"
              >
                Forgot Password?
              </button>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="mt-4 w-full bg-[#3A6131] text-[#EEBE4E] font-['Fredoka'] font-bold text-[22px] py-3 rounded-full hover:bg-[#385E31] hover:scale-[1.02] active:scale-95 transition-all shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? "Signing in..." : "SIGN IN"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}