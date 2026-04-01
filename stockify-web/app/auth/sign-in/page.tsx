"use client";
import { useRouter } from "next/navigation";
import LoginModal from "@/components/modals/login-modal";

export default function SignInPage() {
  const router = useRouter();

  return (
    <div className="w-full min-h-screen bg-[#385E31]">
      <LoginModal
        isOpen={true}
        onClose={() => router.push("/")}
      />
    </div>
  );
}