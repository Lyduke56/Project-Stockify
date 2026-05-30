"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";

export interface SuperadminNotifItem {
  id: string;
  title: string;
  description: string;
  time: string;
  isUnread: boolean;
  type: "tenant" | "alert" | "billing";
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  notifications: SuperadminNotifItem[];
  onRemove: (id: string, e: React.MouseEvent) => void;
  onClearAll: () => void;
  onMarkAsRead: (id: string) => void;
}

export default function SuperadminNotificationModal({
  isOpen,
  onClose,
  notifications,
  onRemove,
  onClearAll,
  onMarkAsRead,
}: Props) {
  const [mounted, setMounted] = useState(false);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!isOpen || !mounted) return null;

  const primaryColor = "#385E31";
  const borderColor = "rgba(56,94,49,0.15)";
  const itemBorderColor = "rgba(56,94,49,0.10)";
  const hoverBg = "hover:bg-black/[0.02]";

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-[600px] rounded-2xl shadow-2xl overflow-hidden flex flex-col" style={{ backgroundColor: "#FFFCF0" }}>
        
        {/* Header */}
        <header className="px-8 py-5 flex justify-between items-center shrink-0" style={{ borderBottom: `1px solid ${borderColor}` }}>
          <h2 className="text-2xl font-bold uppercase tracking-widest font-['Inter']" style={{ color: primaryColor }}>
            System Notifications
          </h2>
          <button onClick={onClose} className="text-lg font-bold hover:scale-110 transition-transform" style={{ color: primaryColor }}>
            ✕
          </button>
        </header>

        {/* Content */}
        <div className="flex flex-col max-h-[440px] overflow-y-auto flex-1">
          {notifications.length === 0 ? (
            <div className="px-8 py-16 text-center flex flex-col gap-1.5 items-center justify-center font-['Inter']" style={{ color: primaryColor }}>
              <span className="text-base font-semibold">All Caught Up!</span>
              <span className="text-sm font-normal opacity-60">No system alerts or registration tasks found.</span>
            </div>
          ) : (
            notifications.map((notif, i) => {
              const isExpanded = expandedIndex === i;
              const titleLower = notif.title.toLowerCase();
              const isRedAlert = notif.type === "alert" || titleLower.includes("suspended") || titleLower.includes("suspension") || titleLower.includes("missed") || titleLower.includes("expired") || titleLower.includes("terminated") || titleLower.includes("rejection");
              const isOrangeAlert = notif.type === "billing" || titleLower.includes("overdue") || titleLower.includes("warning") || titleLower.includes("limit") || titleLower.includes("low");
              
              let tagBg = "rgba(56,94,49,0.10)";
              let tagColor = primaryColor;
              let rowBg = "transparent";

              if (isRedAlert) {
                tagBg = "rgba(239,68,68,0.15)";
                tagColor = "#ef4444";
                rowBg = "rgba(239,68,68,0.04)";
              } else if (isOrangeAlert) {
                tagBg = "rgba(245,158,11,0.15)";
                tagColor = "#d97706";
                rowBg = "rgba(245,158,11,0.04)";
              } else if (notif.isUnread) {
                rowBg = "rgba(56,94,49,0.04)";
              }

              return (
                <div
                  key={notif.id}
                  onClick={() => {
                    setExpandedIndex(isExpanded ? null : i);
                    if (notif.isUnread) onMarkAsRead(notif.id);
                  }}
                  className={`flex flex-col px-8 py-5 cursor-pointer ${hoverBg} transition-colors`}
                  style={{
                    backgroundColor: rowBg,
                    borderBottom: `1px solid ${itemBorderColor}`,
                  }}
                >
                  <div className="flex items-start justify-between w-full gap-4">
                    <div className="flex flex-col gap-1 flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                         {notif.isUnread && (
                           <span className="w-2 h-2 rounded-full bg-red-500 mr-1 animate-pulse" />
                         )}
                         <span 
                           className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded"
                           style={{
                             backgroundColor: tagBg,
                             color: tagColor
                           }}
                         >
                           {notif.type}
                         </span>
                      </div>
                      <span className={`text-base font-semibold font-['Inter'] mt-1 ${isExpanded ? "" : "line-clamp-1"}`} style={{ color: primaryColor }}>
                        {notif.title}
                      </span>
                      {isExpanded && (
                        <p className="text-sm font-normal font-['Inter'] mt-2 leading-relaxed whitespace-pre-wrap" style={{ color: primaryColor, opacity: 0.8 }}>
                          {notif.description}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex flex-col items-end gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                      <span className="text-sm font-normal font-['Inter']" style={{ color: primaryColor, opacity: 0.6 }}>
                        {notif.time}
                      </span>
                      <div className="flex gap-2.5 items-center">
                        <button 
                          onClick={() => {
                            setExpandedIndex(isExpanded ? null : i);
                            if (notif.isUnread) onMarkAsRead(notif.id);
                          }}
                          className="text-[10px] font-bold text-[#385E31]/60 hover:underline"
                        >
                          {isExpanded ? "Collapse" : "Expand"}
                        </button>
                        <span style={{ color: primaryColor, opacity: 0.2 }}>|</span>
                        <button 
                          onClick={(e) => onRemove(notif.id, e)}
                          className="text-[10px] font-bold text-red-600 hover:underline"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Action Controls Footer */}
        {notifications.length > 0 && (
          <footer className="px-8 py-4 flex justify-end items-center shrink-0 bg-black/[0.01]" style={{ borderTop: `1px solid ${borderColor}` }}>
            <button 
              onClick={onClearAll}
              className="text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-lg hover:bg-black/[0.04] active:scale-95 transition-all"
              style={{ color: primaryColor }}
            >
              Clear All
            </button>
          </footer>
        )}
      </div>
    </div>,
    document.body
  );
}