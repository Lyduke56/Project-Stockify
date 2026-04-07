"use client";


interface LogoutModalProps {
  isOpen: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function LogoutModal({
  isOpen,
  onCancel,
  onConfirm,
}: LogoutModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-[500px] bg-[#F5F1DC] border-2 border-[#385E31] rounded-2xl shadow-xl p-8 text-center">

        {/* Title */}
        <h2 className="text-3xl font-bold text-[#385E31] mb-4 tracking-wide">
          LOG OUT CONFIRMATION
        </h2>

        {/* Divider */}
        <div className="w-full h-1 bg-[#E5AD24] mb-6"></div>

        {/* Message */}
        <p className="text-lg text-[#385E31] mb-8">
          Are you sure you want to log out?
        </p>

        {/* Buttons */}
        <div className="flex justify-center gap-6">
          {/* Cancel */}
          <button
            onClick={onCancel}
            className="px-8 py-3 rounded-full bg-[#E5AD24] text-[#385E31] font-semibold shadow-md hover:opacity-90 transition"
          >
            Cancel
          </button>

          {/* Confirm */}
          <button
            onClick={onConfirm}
            className="px-8 py-3 rounded-full bg-[#385E31] text-white font-semibold shadow-md hover:opacity-90 transition"
          >
            Log Out
          </button>
        </div>
      </div>
    </div>
  );
}