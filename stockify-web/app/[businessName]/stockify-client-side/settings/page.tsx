"use client";

import { useState } from "react";
import SidebarClient from "@/components/navbars/sidebar-client";
import NavbarClient from "@/components/navbars/navbar-client";

export default function ClientSettings() {
  const [activeTab, setActiveTab] = useState<"security" | "notifications">("security");

  // Notification states
  const [notifications, setNotifications] = useState({
    important: true,
    lowStock: true,
    orders: false,
    reports: true,
  });

  // Password form states
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const toggle = (key: keyof typeof notifications) => {
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      alert("New passwords do not match!");
      return;
    }
    
    setIsUpdatingPassword(true);
    try {
      alert("Password updated successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      console.error(error);
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFFFF] flex overflow-x-hidden font-['Inter']">
      {/* BACKGROUND NAVIGATION PANELS */}
      <SidebarClient active="settings" />

      <main className="ml-0 lg:ml-64 flex-1 px-4 py-6 sm:px-6 sm:py-8 relative">
        {/* Background Dashboard content layout layer */}
        <div className="mx-auto w-full max-w-6xl space-y-8 opacity-40 blur-[2px] pointer-events-none select-none">
          <NavbarClient />
          <header className="flex flex-col gap-1">
            <h1 className="text-lime-900 text-3xl font-extrabold leading-tight tracking-tight pl-2 mt-4">Settings</h1>
            <p className="text-lime-800/70 text-sm font-medium pl-3">Manage preferences and security configurations</p>
          </header>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start w-full">
            <div className="h-64 bg-slate-100 rounded-3xl"></div>
            <div className="h-64 bg-slate-100 rounded-3xl lg:col-span-2"></div>
          </div>
        </div>

        {/* ── COHESIVE OVERLAY MODAL (Looks exactly like reference 2 and 3) ── */}
        <div className="fixed inset-0 z-[100] ml-0 lg:ml-64 flex items-center justify-center bg-black/20 backdrop-blur-sm">
          <div className="bg-[#FFFCF0] w-[820px] h-[520px] rounded-[32px] shadow-2xl overflow-hidden grid grid-cols-12 border border-stone-200/40">
            
            {/* LEFT SIDEBAR (1/3 Width) */}
            <div className="col-span-4 bg-[#385E31] p-8 flex flex-col justify-between relative">
              <div className="space-y-8">
                <div>
                  <h2 className="text-[#FFFCF0] text-2xl font-black uppercase tracking-wider">Settings</h2>
                  <p className="text-[11px] text-[#FFFCF0]/70 mt-1 leading-relaxed">
                    Manage your account security, passwords, and notification preferences here.
                  </p>
                </div>

                {/* Tabs Buttons */}
                <nav className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab("security")}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all ${
                      activeTab === "security"
                        ? "bg-[#FFAE00] text-[#385E31]"
                        : "text-[#FFFCF0]/80 hover:bg-white/5 hover:text-[#FFFCF0]"
                    }`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                    Security
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab("notifications")}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all ${
                      activeTab === "notifications"
                        ? "bg-[#FFAE00] text-[#385E31]"
                        : "text-[#FFFCF0]/80 hover:bg-white/5 hover:text-[#FFFCF0]"
                    }`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                    Notifications
                  </button>
                </nav>
              </div>

              {/* Bottom Navigation Sliders indicator */}
              <div className="flex gap-1.5 justify-start pl-2">
                <div className={`h-1 rounded-full transition-all duration-300 ${activeTab === 'security' ? 'w-6 bg-[#FFAE00]' : 'w-1.5 bg-white/30'}`} />
                <div className={`h-1 rounded-full transition-all duration-300 ${activeTab === 'notifications' ? 'w-6 bg-[#FFAE00]' : 'w-1.5 bg-white/30'}`} />
              </div>
            </div>

            {/* RIGHT MAIN CORE PANELS (2/3 Width) */}
            <div className="col-span-8 p-10 flex flex-col justify-between relative bg-[#FFFCF0]">
              
              {/* TAB CONTAINER VIEW: SECURITY */}
              {activeTab === "security" && (
                <form onSubmit={handlePasswordUpdate} className="flex-1 flex flex-col justify-between">
                  <div className="space-y-5">
                    <div>
                      <h3 className="text-[#385E31] text-xl font-extrabold tracking-tight italic">Security & Password</h3>
                      <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                        For your security, choose a strong password with at least 8 characters, including uppercase letters, numbers, and symbols.
                      </p>
                    </div>

                    <div className="space-y-3">
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Current Password</label>
                        <input 
                          type="password" 
                          required
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          placeholder="Enter current password"
                          className="w-full text-xs px-4 py-2.5 bg-white border border-stone-200 rounded-xl focus:outline-none focus:border-[#385E31]"
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest">New Password</label>
                        <input 
                          type="password" 
                          required
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Enter new password"
                          className="w-full text-xs px-4 py-2.5 bg-white border border-stone-200 rounded-xl focus:outline-none focus:border-[#385E31]"
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Confirm New Password</label>
                        <input 
                          type="password" 
                          required
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Re-enter new password"
                          className="w-full text-xs px-4 py-2.5 bg-white border border-stone-200 rounded-xl focus:outline-none focus:border-[#385E31]"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-4">
                    <button type="submit" disabled={isUpdatingPassword} className="bg-[#385E31] text-white px-8 py-2.5 rounded-full font-black uppercase tracking-widest text-[10px] shadow-md hover:bg-lime-900 transition-colors disabled:opacity-50">
                      {isUpdatingPassword ? "Updating..." : "Update Password"}
                    </button>
                  </div>
                </form>
              )}

              {/* TAB CONTAINER VIEW: NOTIFICATIONS */}
              {activeTab === "notifications" && (
                <div className="flex-1 flex flex-col justify-between">
                  <div className="space-y-5">
                    <div>
                      <h3 className="text-[#385E31] text-xl font-extrabold tracking-tight italic">Alerts & Notifications</h3>
                      <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                        Choose which events you'd like to be alerted about. These settings apply to your admin account across the platform.
                      </p>
                    </div>

                    <div className="space-y-3">
                      {/* Toggle 1 */}
                      <div className="flex items-center justify-between p-3.5 bg-white rounded-2xl border border-stone-100">
                        <div>
                          <p className="text-[#385E31] text-xs font-black uppercase tracking-wider">Important Updates</p>
                          <p className="text-[10px] text-stone-400 font-medium mt-0.5">Critical system notifications and updates.</p>
                        </div>
                        <button 
                          type="button"
                          onClick={() => toggle("important")}
                          className={`w-11 h-5 rounded-full relative transition-colors ${notifications.important ? "bg-[#385E31]" : "bg-stone-200"}`}
                        >
                          <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${notifications.important ? "right-0.5" : "left-0.5"}`}/>
                        </button>
                      </div>

                      {/* Toggle 2 */}
                      <div className="flex items-center justify-between p-3.5 bg-white rounded-2xl border border-stone-100">
                        <div>
                          <p className="text-[#385E31] text-xs font-black uppercase tracking-wider">Low Stock Alerts</p>
                          <p className="text-[10px] text-stone-400 font-medium mt-0.5">Get notified immediately when inventory items are running low.</p>
                        </div>
                        <button 
                          type="button"
                          onClick={() => toggle("lowStock")}
                          className={`w-11 h-5 rounded-full relative transition-colors ${notifications.lowStock ? "bg-[#385E31]" : "bg-stone-200"}`}
                        >
                          <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${notifications.lowStock ? "right-0.5" : "left-0.5"}`}/>
                        </button>
                      </div>

                      {/* Toggle 3 */}
                      <div className="flex items-center justify-between p-3.5 bg-white rounded-2xl border border-stone-100">
                        <div>
                          <p className="text-[#385E31] text-xs font-black uppercase tracking-wider">Order Notifications</p>
                          <p className="text-[10px] text-stone-400 font-medium mt-0.5">Receive alerts for new incoming orders and status shifts.</p>
                        </div>
                        <button 
                          type="button"
                          onClick={() => toggle("orders")}
                          className={`w-11 h-5 rounded-full relative transition-colors ${notifications.orders ? "bg-[#385E31]" : "bg-stone-200"}`}
                        >
                          <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${notifications.orders ? "right-0.5" : "left-0.5"}`}/>
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-4">
                    <button type="button" className="bg-[#385E31] text-white px-8 py-2.5 rounded-full font-black uppercase tracking-widest text-[10px] shadow-md hover:bg-lime-900 transition-colors">
                      Save Preferences
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>

      </main>
    </div>
  );
}