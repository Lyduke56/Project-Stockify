"use client";

import React, { useState, useEffect } from "react"; // <-- IMPORT REACT HOOKS
import { createPortal } from "react-dom"; // <-- IMPORT PORTAL
import { AlertTriangle, X, XCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface DeleteEmployeeModalProps {
  isOpen: boolean;
  user: any; 
  isDeleting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function DeleteEmployeeModal({
  isOpen,
  user,
  isDeleting,
  onClose,
  onConfirm,
}: DeleteEmployeeModalProps) {
  
  // <-- MOUNT STATE FOR PORTAL
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // <-- PREVENT RENDER UNTIL MOUNTED
  if (!mounted) return null;

  // <-- PORTAL THE ENTIRE MODAL TO document.body
  return createPortal(
    <AnimatePresence>
      {isOpen && user && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-9999 bg-black/40 backdrop-blur-sm"
            onClick={onClose} // Optional: clicking backdrop closes modal
          />

          {/* Modal Container */}
          <div className="fixed inset-0 z-9999 flex items-center justify-center pointer-events-none">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              transition={{ duration: 0.3, type: "spring", bounce: 0.25 }}
              className="bg-[#FFFCEB] rounded-2xl shadow-2xl w-[420px] max-w-[95vw] overflow-hidden border border-red-200 font-['Inter'] pointer-events-auto"
            >
              
              {/* Header */}
              <div className="bg-red-600 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2 text-white">
                  <XCircle size={18} strokeWidth={2.5} />
                  <h2 className="font-bold text-lg tracking-wide">Delete Employee</h2>
                </div>

                <button
                  onClick={onClose}
                  disabled={isDeleting}
                  className="text-white/70 hover:text-white transition-colors disabled:opacity-50"
                >
                  <X size={20} strokeWidth={2.5} />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 flex flex-col items-center text-center gap-4">
                
                <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                  <AlertTriangle size={32} />
                </div>

                <div>
                  <p className="text-[#385E31] font-bold text-lg">Are you sure?</p>
                  <p className="text-gray-500 text-sm mt-1 leading-relaxed">
                    You are about to delete the account of <span className="font-bold text-[#385E31]">{user.display_name}</span>.
                  </p>
                </div>

                <div className="w-full p-3 bg-red-50 rounded-xl border border-red-100 text-left mt-2">
                  <p className="text-xs text-red-600 font-medium leading-relaxed">
                    <span className="font-bold">Note:</span> This action is permanent and cannot be undone. This employee will lose all access to the system immediately.
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 pb-6 flex gap-3">
                <button
                  onClick={onClose}
                  disabled={isDeleting}
                  className="flex-1 py-2.5 border-2 border-[#385E31] text-[#385E31] font-semibold rounded-xl hover:bg-[#385E31]/5 transition-colors disabled:opacity-50"
                >
                  Go Back
                </button>

                <button
                  onClick={onConfirm}
                  disabled={isDeleting}
                  className="flex-1 py-2.5 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-colors shadow-md disabled:opacity-50 flex justify-center items-center"
                >
                  {isDeleting ? "Deleting..." : "Confirm Delete"}
                </button>
              </div>

            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}