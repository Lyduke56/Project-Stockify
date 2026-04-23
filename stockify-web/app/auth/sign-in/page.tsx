"use client";
import { useRouter } from "next/navigation";
import LoginModal from "@/components/modals/login-modal";
import { motion } from "framer-motion";

export default function SignInPage() {
  const router = useRouter();

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="w-full min-h-screen bg-[#385E31]"
    >
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.15, ease: "easeOut" }}
      >
        <LoginModal
          isOpen={true}
          onClose={() => router.push("/")}
        />
      </motion.div>
    </motion.div>
  );
}