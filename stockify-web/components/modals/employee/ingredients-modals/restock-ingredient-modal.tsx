"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, PackagePlus, Loader2, CheckCircle2, AlertCircle, 
  ChevronRight, FlaskConical, Scale
} from "lucide-react";
import ModalBackdrop from "./modals-backdrop";
import { updateFnbItem, type FnbItem } from "@/lib/employee/inventory";

interface RestockIngredientModalProps {
  item:      FnbItem;
  tenantId:  string;
  onClose:   () => void;
  onSuccess: () => void;
}

export default function RestockIngredientModal({
  item, tenantId, onClose, onSuccess,
}: RestockIngredientModalProps) {
  const [addQuantity, setAddQuantity] = useState("");
  const [useBaseUnits, setUseBaseUnits] = useState(false); // false = Purchase Units (Bags), true = Base Units (g/ml)
  
  const [saving,   setSaving]   = useState(false);
  const [feedback, setFeedback] = useState<{ ok: boolean; msg: string } | null>(null);

  const conversion = Number(item.conversion) || 1;
  const currentInPurchaseUnits = (Number(item.stock) / conversion).toFixed(2);

  const handleRestock = async () => {
    const amount = Number(addQuantity);
    if (!amount || amount <= 0) return;

    try {
      setSaving(true);
      
      const addedBaseAmount = useBaseUnits ? amount : amount * conversion;
      const newTotalStock = Math.floor(Number(item.stock) + addedBaseAmount);

      await updateFnbItem(item.item_id, { stock: newTotalStock });

      setFeedback({ ok: true, msg: `Successfully added ${amount} ${useBaseUnits ? item.base_unit : item.purchase_unit}${amount !== 1 ? "s" : ""} to stock.` });
      
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (err: any) {
      setFeedback({ ok: false, msg: err.message || "Failed to update stock." });
      setSaving(false);
    }
  };

  const labelStyle = "text-[10px] font-black uppercase tracking-widest text-[#3A6131]/40 mb-2 block";
  const inputStyle = "w-full bg-white border-2 border-[#3A6131]/10 rounded-2xl px-5 py-4 text-sm text-[#3A6131] font-bold focus:outline-none focus:border-[#F7B71D] transition-all placeholder:text-[#3A6131]/20";

  return (
    <ModalBackdrop onClose={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-[#FFFCEB] w-full max-w-[450px] rounded-[32px] overflow-hidden shadow-2xl border border-[#385E31]/10"
      >
        {/* Header */}
        <div className="bg-[#3A6131] p-8 text-[#FFFCEB] relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-4">
              <div className="bg-[#F7B71D] p-3 rounded-2xl shadow-lg">
                <PackagePlus size={24} className="text-[#3A6131]" />
              </div>
              <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>
            <h2 className="text-2xl font-black italic font-raleway">Restock Material</h2>
            <p className="text-white/60 text-xs font-bold uppercase tracking-widest mt-1">{item.name}</p>
          </div>
          {/* Abstract background shape */}
          <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-white/5 rounded-full blur-3xl" />
        </div>

        <div className="p-8 space-y-6">
          <AnimatePresence mode="wait">
            {feedback ? (
              <motion.div
                key="feedback"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-6 rounded-[24px] flex flex-col items-center text-center gap-3 ${
                  feedback.ok ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                }`}
              >
                {feedback.ok ? <CheckCircle2 size={40} /> : <AlertCircle size={40} />}
                <p className="font-bold text-sm">{feedback.msg}</p>
              </motion.div>
            ) : (
              <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                
                {/* Current Stock Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white p-4 rounded-2xl border border-[#3A6131]/5 shadow-sm">
                    <span className={labelStyle}>Current Inventory</span>
                    <p className="text-lg font-black text-[#3A6131]">{currentInPurchaseUnits} <span className="text-xs font-bold text-[#3A6131]/40">{item.purchase_unit}s</span></p>
                  </div>
                  <div className="bg-white p-4 rounded-2xl border border-[#3A6131]/5 shadow-sm">
                    <span className={labelStyle}>Exact Units</span>
                    <p className="text-lg font-black text-[#3A6131]">{item.stock} <span className="text-xs font-bold text-[#3A6131]/40">{item.base_unit}</span></p>
                  </div>
                </div>

                {/* Input Section */}
                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <span className={labelStyle}>Restock Amount</span>
                    <div className="flex gap-1 bg-[#3A6131]/5 p-1 rounded-xl mb-2">
                      <button 
                        onClick={() => setUseBaseUnits(false)}
                        className={`px-3 py-1 text-[10px] font-black rounded-lg transition-all ${!useBaseUnits ? "bg-[#3A6131] text-[#FFFCEB] shadow-md" : "text-[#3A6131]/50 hover:text-[#3A6131]"}`}
                      >
                        {item.purchase_unit}s
                      </button>
                      <button 
                        onClick={() => setUseBaseUnits(true)}
                        className={`px-3 py-1 text-[10px] font-black rounded-lg transition-all ${useBaseUnits ? "bg-[#3A6131] text-[#FFFCEB] shadow-md" : "text-[#3A6131]/50 hover:text-[#3A6131]"}`}
                      >
                        {item.base_unit}
                      </button>
                    </div>
                  </div>

                  <div className="relative">
                    <input
                      type="number"
                      step="any"
                      placeholder={`Enter amount in ${useBaseUnits ? item.base_unit : item.purchase_unit + "s"}...`}
                      value={addQuantity}
                      onChange={(e) => setAddQuantity(e.target.value)}
                      className={inputStyle}
                      autoFocus
                    />
                    <div className="absolute right-5 top-1/2 -translate-y-1/2 text-[#3A6131]/20">
                      {useBaseUnits ? <Scale size={20} /> : <FlaskConical size={20} />}
                    </div>
                  </div>

                  {addQuantity && Number(addQuantity) > 0 && (
                    <motion.p 
                      initial={{ opacity: 0, x: -10 }} 
                      animate={{ opacity: 1, x: 0 }}
                      className="text-[11px] font-bold text-[#3A6131]/50 pl-2"
                    >
                      New Total: <span className="text-[#3A6131]">
                        {useBaseUnits 
                          ? (Number(item.stock) + Number(addQuantity)) 
                          : ((Number(item.stock) + (Number(addQuantity) * conversion)) / conversion).toFixed(2)
                        } {useBaseUnits ? item.base_unit : item.purchase_unit + "s"}
                      </span>
                    </motion.p>
                  )}
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    onClick={onClose}
                    className="flex-1 bg-white border-2 border-[#3A6131]/10 text-[#3A6131] py-4 rounded-2xl text-sm font-black hover:bg-gray-50 active:scale-95 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleRestock}
                    disabled={saving || !addQuantity || Number(addQuantity) <= 0}
                    className="flex-[1.5] bg-[#3A6131] text-[#FFFCEB] py-4 rounded-2xl text-sm font-black flex items-center justify-center gap-2 shadow-xl shadow-[#3A6131]/20 hover:opacity-90 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {saving ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <>Confirm Restock <ChevronRight size={18} /></>
                    )}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </ModalBackdrop>
  );
}
