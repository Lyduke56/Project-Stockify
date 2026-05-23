"use client";

import React from "react";
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
  onRemove: (id: string) => void;
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
  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <div className="relative w-full max-w-2xl bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="px-6 py-4 flex items-center justify-between border-b">
          <h3 className="text-lg font-bold">System Notifications</h3>
          <div className="flex items-center gap-2">
            <button className="text-sm text-gray-600" onClick={onClearAll}>Clear all</button>
            <button className="text-sm font-semibold text-[#3A6131]" onClick={onClose}>Close</button>
          </div>
        </div>

        <div className="p-4 max-h-[60vh] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="text-center text-gray-500 py-10">No notifications</div>
          ) : (
            <ul className="space-y-3">
              {notifications.map((n) => (
                <li key={n.id} className="flex items-start gap-4 p-3 rounded-lg hover:bg-gray-50">
                  <div className={`w-3 h-3 mt-2 rounded-full ${n.isUnread ? "bg-red-500" : "bg-gray-300"}`} />
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="font-semibold text-sm">{n.title}</div>
                        <div className="text-xs text-gray-600">{n.description}</div>
                      </div>
                      <div className="text-xs text-gray-400">{n.time}</div>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <button
                        onClick={() => onMarkAsRead(n.id)}
                        className="text-xs text-[#3A6131] font-medium"
                      >
                        Mark as read
                      </button>
                      <button
                        onClick={() => onRemove(n.id)}
                        className="text-xs text-red-600"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
