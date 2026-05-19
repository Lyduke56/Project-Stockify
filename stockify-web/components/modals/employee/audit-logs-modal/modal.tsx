"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, FileText, User, Tag, Calendar, Hash, Info, 
  ChevronRight, Activity, ShieldCheck, Database, History 
} from "lucide-react";
import type { AuditLog } from "@/lib/employee/order-actions";

// ─── Color & Label Formatters ─────────────────────────────────────────
const ENTITY_COLORS: Record<string, string> = {
  product:    "bg-blue-100 text-blue-700",
  ingredient: "bg-orange-100 text-orange-700",
  order:      "bg-purple-100 text-purple-700",
  inventory:  "bg-yellow-100 text-yellow-700",
  user:       "bg-green-100 text-green-700",
};

const ACTION_COLORS: Record<string, string> = {
  CREATE:   "bg-green-100 text-green-700",
  UPDATE:   "bg-blue-100 text-blue-700",
  DELETE:   "bg-red-100 text-red-700",
  CANCEL:   "bg-red-100 text-red-600",
  STATUS:   "bg-purple-100 text-purple-700",
};

const ACTION_LABELS: Record<string, string> = {
  CREATE:   "Created",
  UPDATE:   "Updated",
  DELETE:   "Deleted",
  CANCEL:   "Cancelled",
  RESTOCK:  "Restocked",
  COMPLETE: "Completed",
  STATUS_PENDING:     "Pending",
  STATUS_PROCESSING:  "Processing",
  STATUS_DISPATCHED:  "Dispatched",
  STATUS_RECEIVED:    "Received",
  STATUS_CANCELLED:   "Cancelled",
};

function getActionColor(action: string): string {
  const key = Object.keys(ACTION_COLORS).find((k) => action.toUpperCase().startsWith(k));
  return key ? ACTION_COLORS[key] : "bg-gray-100 text-gray-600";
}

function getActionLabel(action: string): string {
  return ACTION_LABELS[action.toUpperCase()] ?? action;
}

// ─── Main Component ───────────────────────────────────────────────────
interface DetailModalProps {
  log: AuditLog;
  onClose: () => void;
}

export default function DetailModal({ log, onClose }: DetailModalProps) {
  const [step, setStep] = useState(1);

  // Prettify the Details JSON
  const detailEntries = log.details ? Object.entries(log.details) : [];

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return {
      date: d.toLocaleDateString("en-PH", { month: "long", day: "numeric", year: "numeric" }),
      time: d.toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
    };
  };
  const { date, time } = formatDate(log.created_at);

  const labelStyle = "text-[11px] font-black uppercase tracking-[0.12em] text-[#3A6131]/50 mb-2 block";
  const cardStyle = "bg-white border-[1.5px] border-[#3A6131]/10 rounded-2xl px-5 py-4 flex items-center gap-4 shadow-sm";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#385E31]/40 backdrop-blur-sm p-4">
      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        className="w-full max-w-[920px] bg-[#FFFCEB] rounded-[32px] overflow-hidden border-[1.5px] border-[#F7B71D]/20 shadow-[0_32px_80px_rgba(58,97,49,0.2)] flex flex-col md:flex-row h-[600px] font-inter relative"
      >
        
        {/* ── LEFT SIDEBAR ── */}
        <div className="w-full md:w-[320px] bg-[#3A6131] p-10 flex flex-col relative overflow-hidden shrink-0">
            <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-[#F7B71D]/10 rounded-full blur-3xl" />
            
            <div className="relative z-10">
                <div className="bg-[#F7B71D] w-12 h-1 rounded-full mb-8" />
                <h2 className="text-[#FFFCEB] font-raleway text-3xl font-black leading-tight mb-2 italic">
                  Log Entry
                </h2>
                <p className="text-[#FFFCEB]/60 text-xs font-medium leading-relaxed mb-12 uppercase tracking-wider font-mono">
                    REF: {log.log_id.slice(0, 12).toUpperCase()}
                </p>

                <nav className="flex flex-col gap-8">
                    {[
                        { id: 1, label: "Activity Overview", icon: Activity },
                        { id: 2, label: "Target Entity", icon: Database },
                        { id: 3, label: "Change Metadata", icon: History },
                    ].map((s) => (
                        <button 
                            key={s.id}
                            onClick={() => setStep(s.id)}
                            className={`flex items-center gap-4 transition-all duration-300 w-full text-left ${step === s.id ? "translate-x-2" : "opacity-40 hover:opacity-80"}`}
                        >
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${step === s.id ? "bg-[#F7B71D] text-[#385E31] shadow-lg shadow-[#F7B71D]/20" : "bg-white/10 text-white"}`}>
                                <s.icon size={18} strokeWidth={2.5} />
                            </div>
                            <span className={`text-sm font-bold tracking-wide ${step === s.id ? "text-[#FFFCEB]" : "text-white"}`}>
                                {s.label}
                            </span>
                        </button>
                    ))}
                </nav>
            </div>

            <div className="mt-auto relative z-10">
                <div className="flex gap-2">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className={`h-1.5 rounded-full transition-all duration-500 ${step === i ? "w-8 bg-[#F7B71D]" : "w-2 bg-white/20"}`} />
                    ))}
                </div>
            </div>
        </div>

        {/* ── RIGHT CONTENT ── */}
        <div className="flex-1 flex flex-col relative bg-white/50 backdrop-blur-sm overflow-hidden">
            
            <button onClick={onClose} className="absolute top-6 right-6 w-10 h-10 rounded-full bg-[#FFFCEB] border border-[#3A6131]/10 flex items-center justify-center text-[#3A6131] hover:bg-[#3A6131] hover:text-[#FFFCEB] transition-all z-20 shadow-sm">
                <X size={20} strokeWidth={2.5} />
            </button>

            <div className="flex-1 overflow-y-auto p-10">
                
                <AnimatePresence mode="wait">
                    {/* STEP 1: ACTIVITY OVERVIEW */}
                    {step === 1 && (
                        <motion.div 
                            key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                            className="space-y-6"
                        >
                            <div className="mb-8">
                                <span className="bg-[#F7B71D]/15 text-[#385E31] text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">Step 01</span>
                                <h3 className="text-2xl font-black text-[#3A6131] mt-2 font-raleway italic">Activity Overview</h3>
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                                <div className={cardStyle}>
                                    <div className="w-10 h-10 rounded-xl bg-[#3A6131]/5 flex items-center justify-center text-[#3A6131]">
                                        <User size={18} />
                                    </div>
                                    <div>
                                        <p className={labelStyle + " !mb-0.5"}>User Responsible</p>
                                        <p className="text-[#3A6131] font-bold text-sm">{log.user_name || "System"}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                  <div className={cardStyle}>
                                      <div className="w-10 h-10 rounded-xl bg-[#3A6131]/5 flex items-center justify-center text-[#3A6131]">
                                          <Calendar size={18} />
                                      </div>
                                      <div>
                                          <p className={labelStyle + " !mb-0.5"}>Date</p>
                                          <p className="text-[#3A6131] font-bold text-sm">{date}</p>
                                      </div>
                                  </div>
                                  <div className={cardStyle}>
                                      <div className="w-10 h-10 rounded-xl bg-[#3A6131]/5 flex items-center justify-center text-[#3A6131]">
                                          <ShieldCheck size={18} />
                                      </div>
                                      <div>
                                          <p className={labelStyle + " !mb-0.5"}>Action Type</p>
                                          <span className={`inline-block text-[10px] px-2.5 py-0.5 rounded-md font-black uppercase tracking-wide ${getActionColor(log.action)}`}>
                                              {getActionLabel(log.action)}
                                          </span>
                                      </div>
                                  </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* STEP 2: TARGET ENTITY */}
                    {step === 2 && (
                        <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                            <div className="mb-8">
                                <span className="bg-[#F7B71D]/15 text-[#385E31] text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">Step 02</span>
                                <h3 className="text-2xl font-black text-[#3A6131] mt-2 font-raleway italic">Affected Entity</h3>
                            </div>

                            <div className="space-y-4">
                                <div className={cardStyle}>
                                    <div className="w-10 h-10 rounded-xl bg-[#3A6131]/5 flex items-center justify-center text-[#3A6131]"><Tag size={18} /></div>
                                    <div className="flex-1">
                                      <p className={labelStyle + " !mb-0.5"}>Entity Name</p>
                                      <p className="text-[#3A6131] font-bold text-sm">{log.entity_name || "N/A"}</p>
                                    </div>
                                    <span className="text-[10px] font-black text-[#3A6131]/40 border border-[#3A6131]/20 px-2 py-1 rounded-lg uppercase">{log.entity_type}</span>
                                </div>

                                <div className={`${cardStyle} items-start border-[#F7B71D]/40 bg-[#F7B71D]/5`}>
                                    <div className="w-10 h-10 rounded-xl bg-[#F7B71D]/20 flex items-center justify-center text-[#7a5800] shrink-0 mt-1">
                                        <Hash size={18} />
                                    </div>
                                    <div className="mt-1">
                                      <p className={labelStyle + " !text-[#7a5800]/60 !mb-0.5"}>Entity UUID</p>
                                      <p className="text-[#3A6131] font-mono text-xs break-all leading-relaxed">
                                          {log.entity_id || "N/A"}
                                      </p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* STEP 3: METADATA DETAILS */}
                    {step === 3 && (
                        <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                            <div className="mb-6">
                                <span className="bg-[#F7B71D]/15 text-[#385E31] text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">Step 03</span>
                                <h3 className="text-2xl font-black text-[#3A6131] mt-2 font-raleway italic">Change Metadata</h3>
                            </div>

                            {detailEntries.length > 0 ? (
                              <div className="bg-white rounded-2xl border border-[#3A6131]/10 shadow-sm overflow-hidden">
                                <div className="max-h-[300px] overflow-y-auto divide-y divide-[#3A6131]/5">
                                  {detailEntries.map(([key, val]) => (
                                    <div key={key} className="px-5 py-4 flex flex-col gap-1 hover:bg-[#FFFCEB]/50 transition-colors">
                                      <span className="text-[10px] font-black text-[#3A6131]/40 uppercase tracking-widest">{key.replace(/_/g, ' ')}</span>
                                      <span className="text-[#3A6131] font-bold text-sm">
                                        {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ) : (
                              // Enhanced Fallback Description
                              <div className="bg-white border-[1.5px] border-[#3A6131]/10 rounded-2xl p-8 text-center flex flex-col items-center gap-4 shadow-sm">
                                <div className="w-14 h-14 rounded-full bg-[#F7B71D]/20 text-[#7a5800] flex items-center justify-center">
                                  <Info size={28} />
                                </div>
                                <div>
                                  <p className="text-[#3A6131] font-black text-lg mb-2">No Extra Metadata</p>
                                  <p className="text-[#3A6131]/70 text-[13px] leading-relaxed max-w-[340px] mx-auto">
                                    <span className="font-bold">{log.user_name || "The system"}</span> recorded a <span className="font-bold">{getActionLabel(log.action).toLowerCase()}</span> event for the {log.entity_type.toLowerCase()} <span className="font-bold italic">"{log.entity_name || log.entity_id}"</span>. No additional field changes or parameters were logged for this specific interaction.
                                  </p>
                                </div>
                              </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>

            </div>

            {/* Footer Navigation */}
            <div className="px-8 py-5 border-t border-[#3A6131]/10 bg-white/80 flex justify-between items-center z-10 shrink-0">
                <button 
                    onClick={() => step > 1 ? setStep(step - 1) : onClose()}
                    className="text-[#3A6131]/50 text-sm font-bold hover:text-[#3A6131] transition-colors"
                >
                    {step === 1 ? "Close" : "Previous Step"}
                </button>
                <button 
                    onClick={() => step < 3 ? setStep(step + 1) : onClose()}
                    className="bg-[#3A6131] text-[#FFFCEB] px-8 py-3 rounded-2xl text-sm font-bold flex items-center gap-2 hover:opacity-90 transition-opacity"
                >
                    {step === 3 ? "Finish Review" : "Next Details"} <ChevronRight size={16} />
                </button>
            </div>

        </div>
      </motion.div>
    </div>
  );
}