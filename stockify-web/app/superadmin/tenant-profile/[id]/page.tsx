"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Sidebar from "@/components/navbars/sidebar-superadmin";
import NavbarApp from "@/components/navbars/navbar-superadmin";
import NotificationModal from "@/components/modals/notification-modal";
import ClientProfileModal from "@/components/modals/client-profile-modal";

// ── Inline Confirmation Modal ─────────────────────────────────────────────────

type ActionType = "suspend" | "terminate";

interface ConfirmModalProps {
  isOpen: boolean;
  actionType: ActionType;
  tenantName: string;
  isLoading: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

const ACTION_CONFIG: Record<
  ActionType,
  {
    title: string;
    description: (name: string) => string;
    confirmLabel: string;
    accentColor: string;
    confirmStyle: string;
    icon: React.ReactNode;
  }
> = {
  suspend: {
    title:        "Suspend Tenant",
    description:  (name) =>
      `You're about to temporarily suspend "${name}". Their access will be blocked until manually restored. This action can be undone.`,
    confirmLabel: "Yes, Suspend",
    accentColor:  "bg-[#E5AD24]",
    confirmStyle: "bg-[#E5AD24] text-[#385E31] hover:bg-[#D19D1F]",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24"
        fill="none" stroke="#E5AD24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="10" y1="15" x2="10" y2="9" />
        <line x1="14" y1="15" x2="14" y2="9" />
      </svg>
    ),
  },
  terminate: {
    title:        "Terminate Tenant",
    description:  (name) =>
      `You're about to permanently terminate "${name}". All account data will be deleted and this action cannot be undone.`,
    confirmLabel: "Yes, Terminate",
    accentColor:  "bg-[#E91F22]",
    confirmStyle: "bg-[#E91F22] text-[#FFFCEB] hover:bg-[#C41A1D]",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24"
        fill="none" stroke="#E91F22" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="3 6 5 6 21 6" />
        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
        <path d="M10 11v6" /><path d="M14 11v6" />
        <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
      </svg>
    ),
  },
};

function ConfirmModal({ isOpen, actionType, tenantName, isLoading, onConfirm, onClose }: ConfirmModalProps) {
  const cfg = ACTION_CONFIG[actionType];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={!isLoading ? onClose : undefined}
          />

          {/* Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 16 }}
            transition={{ type: "spring", stiffness: 320, damping: 26 }}
            className="relative z-10 w-full max-w-[420px] mx-4 bg-[#FFFCEB] rounded-[14px] shadow-2xl border border-[#385E31]/20 overflow-hidden"
          >
            {/* Top accent bar */}
            <div className={`h-1.5 w-full ${cfg.accentColor}`} />

            <div className="p-7 flex flex-col items-center gap-5">
              {/* Icon */}
              <div className="w-16 h-16 rounded-full bg-[#385E31]/5 border border-[#385E31]/10 flex items-center justify-center">
                {cfg.icon}
              </div>

              {/* Text */}
              <div className="text-center flex flex-col gap-2">
                <h3 className="text-[#385E31] text-[20px] font-extrabold">{cfg.title}</h3>
                <p className="text-[#385E31]/75 text-[13px] font-medium leading-relaxed">
                  {cfg.description(tenantName)}
                </p>
              </div>

              {/* Warning note for terminate */}
              {actionType === "terminate" && (
                <div className="w-full bg-[#E91F22]/8 border border-[#E91F22]/20 rounded-[8px] px-4 py-3 flex items-start gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
                    fill="none" stroke="#E91F22" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                    className="shrink-0 mt-0.5">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                  <p className="text-[#E91F22] text-[12px] font-semibold leading-relaxed">
                    This will permanently delete all user accounts, subscription records, and data linked to this tenant.
                  </p>
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-3 w-full mt-1">
                <button
                  onClick={onClose}
                  disabled={isLoading}
                  className="flex-1 border-2 border-[#385E31] text-[#385E31] font-bold text-[14px] py-2.5 rounded-[40px] hover:bg-[#385E31]/5 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={onConfirm}
                  disabled={isLoading}
                  className={`flex-1 font-bold text-[14px] py-2.5 rounded-[40px] transition-colors disabled:opacity-60 ${cfg.confirmStyle}`}
                >
                  {isLoading ? "Processing…" : cfg.confirmLabel}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── Stat Card ─────────────────────────────────────────────────────────────────

interface StatCardProps {
  title: string;
  value: string | number;
  trendText: string;
  svgName: string;
  className?: string;
}

function StatCard({ title, value, trendText, svgName, className = "" }: StatCardProps) {
  return (
    <div className={`bg-[#385E31] rounded-[8px] p-4 flex flex-col shadow-sm border border-[#385E31] ${className}`}>
      <h3 className="text-[#FFFCEB] text-[16px] font-bold mb-3">{title}</h3>
      <div className="bg-[#FFFCEB] rounded-[6px] flex flex-col items-center justify-center py-5 flex-1">
        <div className="flex items-center justify-center gap-3">
          <img src={`/${svgName}.svg`} alt={title} className="w-12 h-12 object-contain" />
          <span className="text-[#385E31] text-[3rem] font-black leading-none">{value}</span>
        </div>
        <p className="text-[#385E31] text-[12px] mt-2 font-medium">{trendText}</p>
      </div>
    </div>
  );
}

// ── Info Item ─────────────────────────────────────────────────────────────────

const InfoItem = ({
  label,
  value,
  colSpan = false,
}: {
  label: string;
  value: React.ReactNode;
  colSpan?: boolean;
}) => (
  <div className={`flex flex-col ${colSpan ? "col-span-1 md:col-span-2" : ""}`}>
    <span className="text-[10px] text-[#385E31]/70 font-bold uppercase tracking-wider mb-1">{label}</span>
    <div className="text-[13px] text-[#385E31] font-semibold bg-[#385E31]/5 px-3 py-2 rounded-[6px] border border-[#385E31]/10 min-h-[36px] flex items-center">
      {value || "N/A"}
    </div>
  </div>
);

// ── Monthly Payment Chart ──────────────────────────────────────────────────────

function MonthlyPaymentChart() {
  const chartData = [
    { month: "Jan", status: "paid",    amount: "₱2,725.00" },
    { month: "Feb", status: "paid",    amount: "₱2,725.00" },
    { month: "Mar", status: "paid",    amount: "₱2,725.00" },
    { month: "Apr", status: "overdue", amount: "₱2,725.00" },
    { month: "May", status: "paid",    amount: "₱2,725.00" },
    { month: "Jun", status: "paid",    amount: "₱2,725.00" },
    { month: "Jul", status: "missed",  amount: "₱0.00"     },
    { month: "Aug", status: "overdue", amount: "₱2,725.00" },
    { month: "Sep", status: "paid",    amount: "₱2,725.00" },
    { month: "Oct", status: "paid",    amount: "₱2,725.00" },
    { month: "Nov", status: "paid",    amount: "₱2,725.00" },
    { month: "Dec", status: "paid",    amount: "₱2,725.00" },
  ];
  const statusColors = { paid: "#385E31", overdue: "#E5AD24", missed: "#E91F22" };
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <div className="w-full flex flex-col mt-2">
      <h2 className="text-xl font-extrabold text-[#385E31] mb-4 text-center font-['Inter']">
        Monthly Payment Status
      </h2>
      <div className="relative w-full h-[260px] border border-[#385E31] rounded-[8px] bg-[#FFFCEB] flex items-end px-4 pb-0 pt-8 shadow-sm">
        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none z-0 py-8">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="w-full flex items-center">
              <span className="text-[10px] font-bold text-[#385E31]/60 w-14 text-right pr-2">Amount</span>
              <div className="flex-1 border-b border-[#385E31]/10" />
            </div>
          ))}
        </div>
        <div className="absolute top-[33%] left-14 right-4 border-b-2 border-dashed border-[#385E31]/30 z-10 pointer-events-none" />
        <div className="flex-1 flex justify-between h-[80%] ml-14 mr-4 z-20 gap-2">
          {chartData.map((data, index) => (
            <div
              key={index}
              className="relative w-full h-full flex flex-col justify-end group cursor-pointer"
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              {hoveredIndex === index && (
                <div className="absolute -top-16 left-1/2 -translate-x-1/2 bg-[#385E31] text-[#FFFCEB] text-[11px] px-3 py-2 rounded-[6px] shadow-lg whitespace-nowrap z-30 flex flex-col gap-1 border border-[#F7B71D]">
                  <div className="font-bold text-[12px] text-[#F7B71D]">{data.month} 2026</div>
                  <div className="font-medium">Status: <span className="capitalize">{data.status}</span></div>
                  <div className="font-medium">Expected: {data.amount}</div>
                </div>
              )}
              <div
                className="w-full h-full rounded-t-[3px] transition-all duration-300 group-hover:opacity-80 group-hover:-translate-y-1 shadow-sm"
                style={{ backgroundColor: statusColors[data.status as keyof typeof statusColors] }}
              />
              <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[11px] font-bold text-[#385E31]">
                {data.month}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="flex justify-end gap-5 mt-8 text-[12px] font-bold text-[#385E31]">
        {Object.entries(statusColors).map(([key, color]) => (
          <div key={key} className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-[2px]" style={{ backgroundColor: color }} />
            <span className="capitalize">{key}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Total Revenue Chart ────────────────────────────────────────────────────────

function TotalRevenueChart() {
  const revenueData = [
    { month: "Jan", amount: 2725,  display: "₱2,725.00",  status: "paid"    },
    { month: "Feb", amount: 5450,  display: "₱5,450.00",  status: "paid"    },
    { month: "Mar", amount: 8175,  display: "₱8,175.00",  status: "paid"    },
    { month: "Apr", amount: 10900, display: "₱10,900.00", status: "overdue" },
    { month: "May", amount: 13625, display: "₱13,625.00", status: "paid"    },
    { month: "Jun", amount: 16350, display: "₱16,350.00", status: "paid"    },
    { month: "Jul", amount: 16350, display: "₱16,350.00", status: "missed"  },
    { month: "Aug", amount: 19075, display: "₱19,075.00", status: "overdue" },
    { month: "Sep", amount: 21800, display: "₱21,800.00", status: "paid"    },
    { month: "Oct", amount: 24525, display: "₱24,525.00", status: "paid"    },
    { month: "Nov", amount: 27250, display: "₱27,250.00", status: "paid"    },
    { month: "Dec", amount: 29975, display: "₱29,975.00", status: "paid"    },
  ];
  const maxAmount = 30000;
  const statusColors = { paid: "#385E31", overdue: "#E5AD24", missed: "#E91F22" };
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const polylinePoints = revenueData
    .map((d, i) => `${(i / (revenueData.length - 1)) * 100},${100 - (d.amount / maxAmount) * 100}`)
    .join(" ");

  return (
    <div className="w-full flex flex-col mt-4">
      <h2 className="text-xl font-extrabold text-[#385E31] mb-4 text-center font-['Inter']">
        Total Revenue
      </h2>
      <div className="relative w-full h-[260px] border border-[#385E31] rounded-[8px] bg-[#FFFCEB] flex shadow-sm">
        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none z-0 py-8">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="w-full flex items-center">
              <span className="text-[10px] font-bold text-[#385E31]/60 w-14 text-right pr-2">Amount</span>
              <div className="flex-1 border-b border-[#385E31]/10" />
            </div>
          ))}
        </div>
        <div className="absolute left-14 right-6 top-8 bottom-8 z-10">
          <svg className="absolute inset-0 w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 100">
            <polyline points={polylinePoints} fill="none" stroke="#E5AD24" strokeWidth="2.5" vectorEffect="non-scaling-stroke" />
          </svg>
          {revenueData.map((data, index) => {
            const xPos = (index / (revenueData.length - 1)) * 100;
            const yPos = 100 - (data.amount / maxAmount) * 100;
            return (
              <div
                key={index}
                className="absolute w-3.5 h-3.5 cursor-pointer group"
                style={{ left: `${xPos}%`, top: `${yPos}%`, transform: "translate(-50%,-50%)" }}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {hoveredIndex === index && (
                  <div className="absolute -top-16 left-1/2 -translate-x-1/2 bg-[#385E31] text-[#FFFCEB] text-[11px] px-3 py-2 rounded-[6px] shadow-lg whitespace-nowrap z-30 flex flex-col gap-1 border border-[#F7B71D]">
                    <div className="font-bold text-[12px] text-[#F7B71D]">{data.month} 2026</div>
                    <div className="font-medium">Status: <span className="capitalize">{data.status}</span></div>
                    <div className="font-medium">Total: {data.display}</div>
                  </div>
                )}
                <div
                  className="w-full h-full rotate-45 border border-white shadow-sm transition-transform duration-200 group-hover:scale-125"
                  style={{ backgroundColor: statusColors[data.status as keyof typeof statusColors] }}
                />
                <div className="absolute top-8 left-1/2 -translate-x-1/2 text-[11px] font-bold text-[#385E31]">
                  {data.month}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="flex justify-end gap-5 mt-8 text-[12px] font-bold text-[#385E31]">
        {Object.entries(statusColors).map(([key, color]) => (
          <div key={key} className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-[2px]" style={{ backgroundColor: color }} />
            <span className="capitalize">{key}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Payment Log Table ─────────────────────────────────────────────────────────

function PaymentLogTable() {
  const logData = [
    { id: 1, date: "09/01/2026", amount: "₱2,725.00", status: "On Time", notes: "Auto-debited via Credit Card"     },
    { id: 2, date: "08/01/2026", amount: "₱2,725.00", status: "Late",    notes: "Paid 5 days after due date"       },
    { id: 3, date: "07/01/2026", amount: "₱0.00",      status: "Missed",  notes: "Payment failed, card declined"   },
    { id: 4, date: "06/01/2026", amount: "₱2,725.00", status: "On Time", notes: "Auto-debited via Credit Card"     },
    { id: 5, date: "05/01/2026", amount: "₱2,725.00", status: "On Time", notes: "Auto-debited via Credit Card"     },
  ];
  const getPill = (status: string) => {
    switch (status) {
      case "On Time": return { bg: "bg-[#385E31]", text: "text-[#FFFCEB]" };
      case "Late":    return { bg: "bg-[#FFD980]",  text: "text-[#385E31]" };
      case "Missed":  return { bg: "bg-[#E91F22]",  text: "text-[#FFFCEB]" };
      default:        return { bg: "bg-[#385E31]",  text: "text-[#FFFCEB]" };
    }
  };

  return (
    <div className="w-full flex flex-col mt-4 mb-4">
      <h2 className="text-xl font-extrabold text-[#385E31] mb-4 text-center font-['Inter']">
        Payment Log
      </h2>
      <div className="w-full bg-[#FFFCEB] rounded-[8px] border border-[#385E31] flex flex-col overflow-hidden shadow-sm">
        <div className="w-full flex bg-[#385E31] px-5 py-3">
          <div className="flex-1      text-left   text-[#FFFCEB] text-[13px] font-bold">Date</div>
          <div className="flex-1      text-center text-[#FFFCEB] text-[13px] font-bold">Amount</div>
          <div className="flex-1      text-center text-[#FFFCEB] text-[13px] font-bold">Status</div>
          <div className="flex-[1.5] text-left   text-[#FFFCEB] text-[13px] font-bold pl-6">Notes</div>
        </div>
        <div className="flex flex-col w-full">
          {logData.map((row, idx) => {
            const { bg, text } = getPill(row.status);
            return (
              <div key={row.id} className={`w-full flex px-5 py-3 items-center ${idx < logData.length - 1 ? "border-b border-[#385E31]/20" : ""}`}>
                <div className="flex-1      text-left   text-[#3A6131] text-[12px] font-bold">{row.date}</div>
                <div className="flex-1      text-center text-[#3A6131] text-[12px] font-bold">{row.amount}</div>
                <div className="flex-1      flex justify-center items-center">
                  <div className={`w-[80px] py-1 rounded-[40px] flex justify-center items-center ${bg}`}>
                    <span className={`${text} text-[10px] font-bold leading-none`}>{row.status}</span>
                  </div>
                </div>
                <div className="flex-[1.5] text-left   text-[#3A6131] text-[12px] font-medium pl-6">{row.notes}</div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="w-full flex justify-end mt-4">
        <button className="bg-[#F7B71D] text-[#385E31] text-[13px] font-bold px-8 py-2 rounded-[40px] shadow-sm hover:opacity-90 transition-opacity">
          Load More
        </button>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function TenantProfile() {
  const params   = useParams();
  const router   = useRouter();
  const tenantId = params?.tenantId as string;

  // Modal state
  const [activeAction, setActiveAction] = useState<ActionType | null>(null);
  const [isLoading,    setIsLoading]    = useState(false);
  const [successMsg,   setSuccessMsg]   = useState("");
  const [errorMsg,     setErrorMsg]     = useState("");

  // Navbar modals
  const [isNotifsOpen,  setIsNotifsOpen]  = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // ── Action handler ──────────────────────────────────────────────────────────

  const handleConfirm = async () => {
    if (!activeAction) return;
    setIsLoading(true);
    setErrorMsg("");

    try {
      const endpoint =
        activeAction === "suspend"
          ? "/api/superadmin/active-tenants/suspend"
          : "/api/superadmin/active-tenants/terminate";

      const res    = await fetch(endpoint, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ tenantId }),
      });
      const result = await res.json();
      if (!result.success) throw new Error(result.error ?? "Action failed.");

      setActiveAction(null);
      setSuccessMsg(
        activeAction === "suspend"
          ? "Tenant has been suspended successfully."
          : "Tenant has been terminated successfully.",
      );
      setTimeout(() => setSuccessMsg(""), 4000);

      if (activeAction === "terminate") {
        setTimeout(() => router.push("/superadmin/tenant-management"), 1500);
      }
    } catch (err: unknown) {
      setActiveAction(null);
      setErrorMsg(err instanceof Error ? err.message : "Action failed.");
    } finally {
      setIsLoading(false);
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="flex h-screen w-full bg-[#FFFCEB] overflow-hidden font-['Inter']">

      <Sidebar />

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="flex-1 flex flex-col h-full overflow-y-auto px-8 md:px-16 pt-5 pb-12"
      >
        <NavbarApp
          onHome={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          openNotifs={() => setIsNotifsOpen(true)}
          openProfile={() => setIsProfileOpen(true)}
        />

        <div className="w-full flex flex-col items-center mt-8 mb-6 gap-6 max-w-[1070px] mx-auto">

          {/* Feedback banners */}
          <AnimatePresence>
            {successMsg && (
              <motion.p
                initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="w-full bg-[#e8f5e2] border border-[#385E31]/30 text-[#385E31] px-4 py-2 rounded text-sm font-medium"
              >
                ✓ {successMsg}
              </motion.p>
            )}
            {errorMsg && (
              <motion.p
                initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="w-full bg-red-100 border border-red-300 text-red-700 px-4 py-2 rounded text-sm font-medium"
              >
                {errorMsg}
              </motion.p>
            )}
          </AnimatePresence>

          {/* Green header banner */}
          <div className="w-full p-8 bg-[#385E31] rounded-[10px] shadow-sm flex items-center justify-between gap-8 border border-[#385E31]">
            <div className="flex items-center gap-8">
              <div className="w-28 h-28 relative shrink-0">
                <div className="absolute inset-0 bg-[#FFD980] rounded-[5px] border border-lime-800/40" />
                <div className="absolute inset-0 flex items-center justify-center p-3">
                  <img src="/business-details.svg" alt="Business" className="w-full h-full object-contain" />
                </div>
              </div>
              <div className="flex flex-col gap-3">
                <h1 className="text-orange-100 text-[26px] font-bold font-['Inter']">
                  Tech IT Hub &nbsp;|&nbsp; Payment History
                </h1>
                <div className="flex flex-col gap-1.5">
                  <span className="text-orange-100 text-[14px] font-semibold">Owner: Benideck Longakit</span>
                  <span className="text-orange-100 text-[14px] font-semibold">Date Registered: 02/21/2026</span>
                </div>
              </div>
            </div>

            {/* Action buttons — live in the header banner */}
            <div className="flex flex-col gap-3 shrink-0">
              <button
                onClick={() => setActiveAction("suspend")}
                className="border-2 border-[#E5AD24] text-[#E5AD24] font-bold text-[13px] px-8 py-2 rounded-[40px] hover:bg-[#E5AD24]/15 transition-colors whitespace-nowrap"
              >
                Suspend Tenant
              </button>
              <button
                onClick={() => setActiveAction("terminate")}
                className="border-2 border-[#E91F22] text-[#E91F22] font-bold text-[13px] px-8 py-2 rounded-[40px] hover:bg-[#E91F22]/15 transition-colors whitespace-nowrap"
              >
                Terminate Tenant
              </button>
            </div>
          </div>

          {/* Stat cards */}
          <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard title="Total Paid"       value="32.7k" trendText="4 of 12 months"          svgName="SA-rev-stat"        />
            <StatCard title="Late Payments"    value="12"    trendText="Avg. 24.8 days late"      svgName="SA-late-payments"   />
            <StatCard title="Missed Payments"  value="3"     trendText="As of September 2026"     svgName="SA-missed-payments" />
          </div>

          {/* Owner + Business details cards */}
          <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-6 mt-1">

            {/* Owner Info */}
            <div className="bg-[#FFFCEB] rounded-[8px] border border-[#385E31] p-5 flex flex-col shadow-sm">
              <div className="flex items-center gap-2 mb-4 border-b border-[#385E31]/20 pb-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#385E31" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                </svg>
                <h2 className="text-[16px] font-extrabold text-[#385E31]">Business Owner's Information</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3">
                <InfoItem label="Last Name"    value="Longakit"                                />
                <InfoItem label="First Name"   value="Benideck"                                />
                <InfoItem label="Middle Name"  value="M."                                      />
                <InfoItem label="Suffix"       value="N/A"                                     />
                <InfoItem label="Gender"       value="Male"                                    />
                <InfoItem label="Email"        value="benideck@techithub.com"                  />
                <InfoItem label="Citizenship"  value="Filipino"                                />
                <InfoItem label="Contact No."  value="+63 917 123 4567"                        />
                <InfoItem label="Address"      value="123 Tech Avenue, IT Park, Cebu City" colSpan />
              </div>
            </div>

            {/* Business Details */}
            <div className="bg-[#FFFCEB] rounded-[8px] border border-[#385E31] p-5 flex flex-col shadow-sm">
              <div className="flex items-center gap-2 mb-4 border-b border-[#385E31]/20 pb-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#385E31" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
                </svg>
                <h2 className="text-[16px] font-extrabold text-[#385E31]">Business Details</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3">
                <InfoItem label="Business Name" value="Tech IT Hub"           colSpan />
                <InfoItem label="Business Type" value="Sole Proprietorship"           />
                <InfoItem label="Full Name"      value="Tech IT Hub Trading"          />
                <InfoItem label="Owner's Valid ID" value={
                  <button className="flex items-center gap-1.5 text-[#E5AD24] hover:text-[#D19D1F] transition-colors font-bold text-[12px] group">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
                    </svg>
                    <span className="group-hover:underline">View Document</span>
                  </button>
                } />
                <InfoItem label="Business Permit" value={
                  <button className="flex items-center gap-1.5 text-[#E5AD24] hover:text-[#D19D1F] transition-colors font-bold text-[12px] group">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
                    </svg>
                    <span className="group-hover:underline">View Document</span>
                  </button>
                } />
                <InfoItem label="Business/Warehouse Address" value="123 Tech Avenue, IT Park, Cebu City" colSpan />
              </div>
            </div>
          </div>

          {/* Charts */}
          <MonthlyPaymentChart />
          <TotalRevenueChart   />

          {/* Payment log */}
          <PaymentLogTable />

        </div>
      </motion.div>

      {/* Confirm Modal */}
      {activeAction && (
        <ConfirmModal
          isOpen={!!activeAction}
          actionType={activeAction}
          tenantName="Tech IT Hub"
          isLoading={isLoading}
          onConfirm={handleConfirm}
          onClose={() => !isLoading && setActiveAction(null)}
        />
      )}

      {/* Navbar modals */}
      <NotificationModal  isOpen={isNotifsOpen}  onClose={() => setIsNotifsOpen(false)}  />
      <ClientProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
    </div>
  );
}