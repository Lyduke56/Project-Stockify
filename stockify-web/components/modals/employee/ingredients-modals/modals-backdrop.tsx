"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export default function ModalBackdrop({ children, onClose }: { children: React.ReactNode, onClose: () => void }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      {/* Click outside to close */}
      <div className="absolute inset-0" onClick={onClose} />
      
      {/* Modal Content */}
      <div className="relative z-10 w-full flex justify-center">
        {children}
      </div>
    </div>,
    document.body
  );
}