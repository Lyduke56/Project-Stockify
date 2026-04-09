"use client";

import { useState } from "react";
import ModalBackdrop from "./modals-bakcdrop";
import { CATEGORIES } from "@/types/product";

export default function ManageCategoriesModal({ onClose }: { onClose: () => void }) {
  const [cats, setCats] = useState<string[]>([...CATEGORIES]);
  const [newCat, setNewCat] = useState("");

  const addCat = () => {
    const trimmed = newCat.trim();
    if (trimmed && !cats.includes(trimmed)) {
      setCats([...cats, trimmed]);
      setNewCat("");
    }
  };

  const removeCat = (c: string) => setCats(cats.filter((x) => x !== c));

  return (
    <ModalBackdrop onClose={onClose}>
      <div className="bg-[#FFFCEB] rounded-2xl shadow-2xl w-[420px] border border-[#E2D88A]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E2D88A]">
          <h2 className="text-[#385E31] font-extrabold text-lg uppercase tracking-wide flex items-center gap-2">
            <img src="/icons/tag.svg" alt="tag" className="w-4 h-4" /> Manage Categories
          </h2>
          <button onClick={onClose} className="text-[#385E31] hover:text-red-500 transition-colors">
            <img src="/icons/x.png" alt="close" className="w-5 h-5" />
          </button>
        </div>
        <div className="px-6 py-5">
          <div className="flex gap-2 mb-4">
            <input
              className="flex-1 border border-[#C8D9C5] rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#F7B71D] text-[#2A3F25]"
              placeholder="New category name..."
              value={newCat}
              onChange={(e) => setNewCat(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addCat()}
            />
            <button onClick={addCat} className="px-3 py-2 rounded-lg bg-[#385E31] text-white hover:bg-[#2D4A27] transition-colors">
              <img src="/icons/plus.png" alt="add" className="w-4 h-4" />
            </button>
          </div>
          <ul className="space-y-2 max-h-56 overflow-y-auto">
            {cats.map((c) => (
              <li key={c} className="flex items-center justify-between bg-white rounded-lg px-4 py-2 border border-[#E2D88A]">
                <span className="text-sm font-semibold text-[#385E31]">{c}</span>
                <button onClick={() => removeCat(c)} className="text-gray-400 hover:text-red-500 transition-colors">
                  <img src="/icons/x.png" alt="remove" className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
        </div>
        <div className="flex justify-end px-6 py-4 border-t border-[#E2D88A]">
          <button onClick={onClose} className="px-5 py-2 rounded-full bg-[#385E31] text-white text-sm font-bold hover:bg-[#2D4A27] transition-colors shadow">
            Done
          </button>
        </div>
      </div>
    </ModalBackdrop>
  );
}