"use client";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { getUserData } from "@/backend/hooks/getUserData";
import { getBusinessNameByUserId } from "@/backend/hooks/getTenantBName";
import { motion } from "framer-motion"; // <-- Imported Framer Motion

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const router = useRouter();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
      if (error.message.toLowerCase().includes("email not confirmed")) {
        setError("Please check your email and confirm your address before logging in.");
      } else {
        setError(error.message);
      }
      return;
    }

    if (data?.user) {
      const shopName = await getBusinessNameByUserId(data.user.id);
      const userRole = await getUserData(data.user.id); 

      setLoading(false);

      if (userRole === "Superadmin") {
        onClose();
        router.push(`/superadmin/dashboard`);
        router.refresh();
        return; 
      }

      const { data: userData } = await supabase
        .from("users")
        .select("is_active")
        .eq("user_id", data.user.id)
        .single();

      if (!userData?.is_active) {
        await supabase.auth.signOut(); 
        onClose();
        router.push("/auth/account/waiting-approved");
        return;
      }

      if (shopName) {
        onClose();
        
        if (userRole === "Administrator") {
          router.push(`/${shopName}/administrator/dashboard`); 
        } else {
          router.push(`/${shopName}/employee/dashboard`);
        }
        
        router.refresh();   
      } else {
        setError("Could not find your business name. Please contact support.");
      }
    }
  };

  return (
   
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ 
          type: "spring", 
          stiffness: 300, 
          damping: 25, 
          delay: 0.1 
        }}
        className="relative flex flex-col md:flex-row w-full max-w-[900px] min-h-[400px] md:min-h-[520px] rounded-[24px] bg-[#385E31] border-[3px] border-[#F7B71D] shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Left Side: Illustration (Hidden on Mobile) */}
        <div className="hidden md:flex flex-1 items-center justify-center px-8 pt-11 pb-5">
          <img 
            src="/auth/left-login-illus.svg" 
            alt="Stockify illustration" 
            className="w-full max-w-[380px] object-contain drop-shadow-xl" 
          />
        </div>

        {/* Right Side: Form Panel */}
        <div className="flex flex-col justify-center w-full md:w-[430px] bg-[#FFFCEB] rounded-[20px] m-3 md:my-5 md:mr-5 p-8 md:px-10 shadow-inner shrink-0 relative">
          
          <div className="mb-8">
            <h1 className="font-['Fredoka'] font-bold text-[36px] md:text-[42px] leading-tight text-[#385E31] mb-1">
              SIGN IN
            </h1>
            <p className="font-['Fredoka'] font-normal text-[14px] text-[#8C9B85] mb-30">
              Please enter your details to continue.
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <p className="font-['Fredoka'] text-[13px] text-red-600 bg-red-100 border border-red-200 px-4 py-2 rounded-xl mb-4 text-center">
              {error}
            </p>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <input
              type="email"
              placeholder="Email:"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-[#FFD980] placeholder-[#8B6B2B] text-[#3A3A3A] font-['Fredoka'] text-[16px] px-6 py-3.5 rounded-full outline-none focus:ring-2 focus:ring-[#385E31] transition-all shadow-md"
            />
            
            <div className="flex flex-col gap-1.5">
              <div className="relative w-full">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password:"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full bg-[#FFD980] placeholder-[#8B6B2B] text-[#3A3A3A] font-['Fredoka'] text-[16px] px-6 py-3.5 pr-12 rounded-full outline-none focus:ring-2 focus:ring-[#385E31] transition-all shadow-md"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8B6B2B] hover:text-[#385E31] focus:outline-none transition-colors"
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                </button>
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => router.push("/auth/forgot-password")}
                  className="font-['Fredoka'] text-[12px] text-[#A3A3A3] hover:text-[#385E31] transition-colors pr-2 mt-1"
                >
                  Forgot Password?
                </button>
              </div>
            </div>

            {/* Centered Submit Button */}
            <div className="flex justify-center mt-6">
              <button
                type="submit"
                disabled={loading}
                className="w-[85%] bg-[#385E31] text-[#F7B71D] font-['Fredoka'] font-bold tracking-wide text-[20px] py-3.5 rounded-full hover:bg-[#2A4725] hover:shadow-lg active:scale-95 transition-all duration-200 shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? "SIGNING IN..." : "SIGN IN"}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </motion.div>
  );
}