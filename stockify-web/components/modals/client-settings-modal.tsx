"use client";

import { useState } from "react";

export default function ClientSettingsModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<"security" | "notifications">("security");

  // State to make your notification switches functional
  const [notifications, setNotifications] = useState({
    emailNotif: true,
    twoFactor: false,
  });

  // Password Input States
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Container Size matches the aspect ratio of the 2-column Superadmin UI */}
      <div className="bg-[#FFFCF0] w-[800px] h-[500px] rounded-[32px] shadow-2xl overflow-hidden grid grid-cols-12 font-['Inter']">
        
        {/* ── LEFT SIDEBAR PANEL (1/3 Width) ── */}
        <div className="col-span-4 bg-[#385E31] p-8 flex flex-col justify-between relative">
          <div className="space-y-8">
            <div>
              <h2 className="text-[#FFFCF0] text-2xl font-black uppercase tracking-wider">Settings</h2>
              <p className="text-[11px] text-[#FFFCF0]/70 mt-1 leading-relaxed">
                Manage your account security, passwords, and notification preferences here.
              </p>
            </div>

            {/* Navigation Tabs */}
            <nav className="flex flex-col gap-2">
              <button
                onClick={() => setActiveTab("security")}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all ${
                  activeTab === "security"
                    ? "bg-[#FFAE00] text-[#385E31]"
                    : "text-[#FFFCF0]/80 hover:bg-white/5 hover:text-[#FFFCF0]"
                }`}
              >
                {/* Shield Icon */}
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                Security
              </button>

              <button
                onClick={() => setActiveTab("notifications")}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all ${
                  activeTab === "notifications"
                    ? "bg-[#FFAE00] text-[#385E31]"
                    : "text-[#FFFCF0]/80 hover:bg-white/5 hover:text-[#FFFCF0]"
                }`}
              >
                {/* Bell Icon */}
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                Notifications
              </button>
            </nav>
          </div>

          {/* Bottom Pagination Slider Accent Line */}
          <div className="flex gap-1.5 justify-start pl-2">
            <div className={`h-1 rounded-full transition-all duration-300 ${activeTab === 'security' ? 'w-6 bg-[#FFAE00]' : 'w-1.5 bg-white/30'}`} />
            <div className={`h-1 rounded-full transition-all duration-300 ${activeTab === 'notifications' ? 'w-6 bg-[#FFAE00]' : 'w-1.5 bg-white/30'}`} />
          </div>
        </div>

        {/* ── RIGHT CONTENT SIDE PANEL (2/3 Width) ── */}
        <div className="col-span-8 p-10 flex flex-col justify-between relative bg-[#FFFCF0]">
          {/* Close Action Button */}
          <button onClick={onClose} className="absolute right-6 top-6 text-[#385E31] text-lg font-bold hover:scale-110 transition-transform">✕</button>

          {/* TAB CONTENT: SECURITY VIEW */}
          {activeTab === "security" && (
            <div className="flex-1 flex flex-col justify-between">
              <div className="space-y-6">
                <div>
                  <h3 className="text-[#385E31] text-xl font-extrabold tracking-tight italic">Security & Password</h3>
                  <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                    For your security, choose a strong password with at least 8 characters, including uppercase letters, numbers, and symbols.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex flex-col gap-1 relative">
                    <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Current Password</label>
                    <input 
                      type="password" 
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter current password"
                      className="w-full text-xs px-4 py-3 bg-white border border-stone-100 rounded-xl focus:outline-none focus:border-[#385E31]"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest">New Password</label>
                    <input 
                      type="password" 
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                      className="w-full text-xs px-4 py-3 bg-white border border-stone-100 rounded-xl focus:outline-none focus:border-[#385E31]"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Confirm New Password</label>
                    <input 
                      type="password" 
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter new password"
                      className="w-full text-xs px-4 py-3 bg-white border border-stone-100 rounded-xl focus:outline-none focus:border-[#385E31]"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button className="bg-[#385E31] text-white px-8 py-2.5 rounded-full font-black uppercase tracking-widest text-[10px] shadow-md hover:bg-lime-900 transition-colors">
                  Update Password
                </button>
              </div>
            </div>
          )}

          {/* TAB CONTENT: NOTIFICATIONS VIEW */}
          {activeTab === "notifications" && (
            <div className="flex-1 flex flex-col justify-between">
              <div className="space-y-6">
                <div>
                  <h3 className="text-[#385E31] text-xl font-extrabold tracking-tight italic">Alerts & Notifications</h3>
                  <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                    Choose which events you'd like to be alerted about. These settings apply to your admin account across the platform.
                  </p>
                </div>

                <div className="space-y-4">
                  {/* Toggle Option 1 */}
                  <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-stone-100">
                    <div>
                      <p className="text-[#385E31] text-xs font-black uppercase tracking-wider">Email Notifications</p>
                      <p className="text-[10px] text-stone-400 font-medium mt-0.5">Receive daily inventory reports</p>
                    </div>
                    <button 
                      type="button"
                      onClick={() => setNotifications(p => ({ ...p, emailNotif: !p.emailNotif }))}
                      className={`w-12 h-6 rounded-full relative transition-colors ${notifications.emailNotif ? "bg-[#385E31]" : "bg-stone-200"}`}
                    >
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${notifications.emailNotif ? "right-1" : "left-1"}`}/>
                    </button>
                  </div>

                  {/* Toggle Option 2 */}
                  <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-stone-100">
                    <div>
                      <p className="text-[#385E31] text-xs font-black uppercase tracking-wider">Two-Factor Auth</p>
                      <p className="text-[10px] text-stone-400 font-medium mt-0.5">Secure your administrator account</p>
                    </div>
                    <button 
                      type="button"
                      onClick={() => setNotifications(p => ({ ...p, twoFactor: !p.twoFactor }))}
                      className={`w-12 h-6 rounded-full relative transition-colors ${notifications.twoFactor ? "bg-[#385E31]" : "bg-stone-200"}`}
                    >
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${notifications.twoFactor ? "right-1" : "left-1"}`}/>
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button className="bg-[#385E31] text-white px-8 py-2.5 rounded-full font-black uppercase tracking-widest text-[10px] shadow-md hover:bg-lime-900 transition-colors">
                  Save Preferences
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}