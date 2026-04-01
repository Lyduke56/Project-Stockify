"use client";
import NavbarLandingPage from "@/components/navbars/navbar-landing-page";
import LoginModal from "@/components/modals/login-modal";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Home() {
  const router = useRouter();
  const [loginOpen, setLoginOpen] = useState(false);

  return (
    <div className="w-full min-h-screen bg-[#385E31]">
      <NavbarLandingPage />

      <button
        onClick={() => router.push("/auth/sign-up")}
        className="absolute font-['Fredoka'] font-medium text-[25px] leading-[30px] text-white cursor-pointer hover:opacity-75 transition-opacity"
        style={{ left: "72.05%", right: "19.02%", top: "26.23%", bottom: "30.46%" }}
      >
        Get Started
      </button>

      <button
        onClick={() => setLoginOpen(true)}  // ← opens modal, no navigation
        className="absolute font-['Fredoka'] font-medium text-[25px] leading-[30px] text-white cursor-pointer hover:opacity-75 transition-opacity"
        style={{ left: "80%", right: "5%", top: "26.23%", bottom: "30.46%" }}
      >
        Login
      </button>

      {/* Modal lives here, overlaying this page */}
      <LoginModal
        isOpen={loginOpen}
        onClose={() => setLoginOpen(false)}
      />
    </div>
  );
}