"use client";

import { useRouter } from "next/navigation";

export default function RegistrationSubmittedModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-[#FFFCEB] rounded-md px-5 py-4 max-w-md w-full text-center shadow-sm">
        
        <h2 className="text-2xl font-bold text-[#3A6131] mb-2">
          REGISTRATION SUBMITTED!
        </h2>

        <div className="w-full h-[3px] bg-[#F7B71D] mb-3 opacity-50 rounded-full" />

        <p className="text-[#3A6131] text-sm leading-relaxed mb-3">
          An email has been sent to your email account for confirmation. Thank you for choosing Stockify to power your business. Your
          application is now in the hands of our platform administrators
          for review. We are working to get your dedicated supply-chain
          manager ready for you. Please keep an eye on your email for
          your activation link. If you have any questions during this
          time, our support team is here to help.
        </p>

        <button
          onClick={() => {
            onClose();
            router.push("/");
          }}
          className="bg-[#F7B71D] text-[#3A6131] font-semibold px-8 py-2.5 rounded-full shadow-[0px_4px_6px_rgba(0,0,0,0.15)]"
        >
          Confirm
        </button>
      </div>
    </div>
  );
}