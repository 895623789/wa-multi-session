"use client";
import React, { useState } from "react";
import {
    User,
    Settings as SettingsIcon,
    Palette,
    ShieldAlert,
    Bell,
    Globe,
    Trash2,
    Save,
    Image as ImageIcon,
    Mail,
    Lock,
    Eye,
    EyeOff,
    Check,
    Moon,
    Sun,
    Info,
    Shield,
    Smartphone,
    Download
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/lib/ThemeContext";

type Tab = "profile" | "saas" | "appearance" | "security" | "notifications";

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState<Tab>("profile");
    const { theme, toggleTheme } = useTheme();
    const [showPassword, setShowPassword] = useState(false);

    const tabs = [
        { id: "profile", name: "My Profile", icon: User },
        { id: "saas", name: "SaaS Config", icon: SettingsIcon },
        { id: "appearance", name: "Appearance", icon: Palette },
        { id: "security", name: "Security & Guard", icon: Shield },
        { id: "notifications", name: "Notifications", icon: Bell },
    ];

    return (
        <div className="space-y-8 pb-12">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight font-outfit text-indigo-900">Platform Settings</h1>
                    <p className="text-sm text-slate-500 font-medium">Global configuration and account management.</p>
                </div>
                <button className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 flex items-center gap-2 active:scale-95">
                    <Save size={18} />
                    Save Changes
                </button>
            </div>

            <div className="flex flex-col lg:flex-row gap-8">
                {/* Tabs Sidebar */}
                <div className="w-full lg:w-64 shrink-0 space-y-1">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as Tab)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all ${activeTab === tab.id
                                    ? "bg-white text-indigo-600 shadow-sm border border-slate-100"
                                    : "text-slate-500 hover:bg-slate-50"
                                }`}
                        >
                            <tab.icon size={18} className={activeTab === tab.id ? "text-indigo-600" : "text-slate-400"} />
                            {tab.name}
                        </button>
                    ))}

                    <div className="pt-8 px-4">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Dangerous Area</p>
                        <button className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold text-rose-500 hover:bg-rose-50 transition-all border border-transparent hover:border-rose-100">
                            <Trash2 size={16} />
                            Reset All Settings
                        </button>
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 bg-white rounded-[32px] border border-slate-100 shadow-sm p-8 md:p-10 relative overflow-hidden">
                    <AnimatePresence mode="wait">
                        {activeTab === 'profile' && (
                            <motion.div
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                className="space-y-8"
                            >
                                <div className="flex flex-col md:flex-row items-center gap-8 pb-8 border-b border-slate-50">
                                    <div className="relative group">
                                        <div className="w-32 h-32 rounded-[40px] bg-slate-100 border-4 border-white shadow-xl flex items-center justify-center text-4xl font-black text-slate-300 overflow-hidden">
                                            <User size={64} />
                                        </div>
                                        <button className="absolute bottom-0 right-0 p-2 bg-indigo-600 text-white rounded-xl shadow-lg hover:scale-110 active:scale-95 transition-all">
                                            <ImageIcon size={18} />
                                        </button>
                                    </div>
                                    <div className="text-center md:text-left">
                                        <h3 className="text-xl font-bold text-slate-900 font-outfit">Profile Information</h3>
                                        <p className="text-sm text-slate-500 mb-4">This will be visible on the owner panel and communications.</p>
                                        <div className="flex items-center gap-2">
                                            <span className="px-3 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-black rounded-lg uppercase">System Super Admin</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                                        <input type="text" defaultValue="Aman Kumar" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                                        <input type="email" defaultValue="aman@bulkreply.io" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all" />
                                    </div>
                                    <div className="space-y-2 md:col-span-2">
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Change Password</label>
                                        <div className="relative">
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                placeholder="Enter new strong password"
                                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                                            />
                                            <button
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                            >
                                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'saas' && (
                            <motion.div
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                className="space-y-8"
                            >
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-6">
                                        <div className="space-y-2">
                                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">SaaS Application Name</label>
                                            <input type="text" defaultValue="BulkReply.io" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-black text-indigo-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Support / Contact Email</label>
                                            <input type="email" defaultValue="support@bulkreply.io" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Helpline Phone</label>
                                            <input type="text" defaultValue="+91 1234567890" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all" />
                                        </div>
                                    </div>
                                    <div className="space-y-6">
                                        <div className="p-6 bg-slate-50 border border-slate-200 rounded-[32px] flex flex-col items-center justify-center text-center">
                                            <div className="w-20 h-20 bg-white rounded-3xl border border-slate-100 flex items-center justify-center mb-4 shadow-sm overflow-hidden">
                                                <ImageIcon className="text-slate-200" size={32} />
                                            </div>
                                            <h4 className="text-sm font-bold text-slate-900">Platform Logo</h4>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter mb-4">Transparent SVG or PNG preferred</p>
                                            <button className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-black text-indigo-600 hover:bg-slate-100 transition-all active:scale-95 shadow-sm">Upload New Asset</button>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'appearance' && (
                            <motion.div
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                className="space-y-10"
                            >
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="text-lg font-bold text-slate-900 font-outfit">Visual Interface</h3>
                                            <p className="text-xs text-slate-500 font-medium">Control the global appearance of the owner panel.</p>
                                        </div>
                                        <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
                                            <button
                                                onClick={() => theme === 'dark' && toggleTheme()}
                                                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${theme === 'light' ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-500'}`}
                                            >
                                                <Sun size={14} />
                                                Light
                                            </button>
                                            <button
                                                onClick={() => theme === 'light' && toggleTheme()}
                                                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${theme === 'dark' ? 'bg-slate-800 text-white shadow-md' : 'text-slate-500'}`}
                                            >
                                                <Moon size={14} />
                                                Dark
                                            </button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-4 rounded-3xl border border-slate-100 bg-slate-50 flex flex-col items-center gap-3">
                                            <div className="w-full h-24 bg-white rounded-2xl border border-indigo-100 shadow-inner p-3 flex flex-col gap-2">
                                                <div className="w-1/2 h-2 bg-indigo-50 rounded-full"></div>
                                                <div className="w-3/4 h-2 bg-slate-50 rounded-full"></div>
                                                <div className="mt-auto flex gap-1">
                                                    <div className="w-4 h-4 bg-indigo-100 rounded-md"></div>
                                                    <div className="flex-1 h-4 bg-indigo-600 rounded-md"></div>
                                                </div>
                                            </div>
                                            <p className="text-[10px] font-black uppercase text-indigo-600 tracking-widest">Indigo Theme (Default)</p>
                                        </div>
                                        <div className="p-4 rounded-3xl border border-slate-100 bg-slate-50 flex flex-col items-center gap-3 opacity-40 grayscale pointer-events-none">
                                            <div className="w-full h-24 bg-white rounded-2xl border border-slate-100 shadow-inner p-3 flex flex-col gap-2">
                                                <div className="w-1/2 h-2 bg-slate-100 rounded-full"></div>
                                                <div className="w-3/4 h-2 bg-slate-50 rounded-full"></div>
                                                <div className="mt-auto flex gap-1">
                                                    <div className="w-4 h-4 bg-slate-200 rounded-md"></div>
                                                    <div className="flex-1 h-4 bg-amber-500 rounded-md"></div>
                                                </div>
                                            </div>
                                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Amber Premium (Coming Soon)</p>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'security' && (
                            <motion.div
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                className="space-y-8"
                            >
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-2xl border border-amber-100">
                                        <div className="w-10 h-10 rounded-xl bg-amber-200 flex items-center justify-center text-amber-700">
                                            <ShieldAlert size={20} />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-black text-amber-900">Anti-Ban Global Guard</h4>
                                            <p className="text-[10px] font-bold text-amber-700/80 uppercase tracking-tighter">These settings apply to all users by default.</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Default Daily Msg Limit</label>
                                            <input type="number" defaultValue="1000" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Default Min Delay (sec)</label>
                                            <input type="number" defaultValue="5" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Multi-Session Guard</label>
                                            <div className="flex items-center gap-2 p-1.5 bg-slate-50 rounded-2xl border border-slate-200">
                                                <button className="flex-1 py-2 rounded-xl text-xs font-black bg-white text-indigo-600 shadow-sm transition-all">Enabled</button>
                                                <button className="flex-1 py-2 rounded-xl text-xs font-black text-slate-400 transition-all">Disabled</button>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Auto-Ban Threshold</label>
                                            <input type="number" defaultValue="5000" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold" />
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-8 border-t border-slate-50">
                                    <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4">Advanced Guard Controls</h4>
                                    <div className="space-y-3">
                                        <label className="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl border border-slate-100 cursor-pointer hover:bg-slate-50 transition-all">
                                            <div className="flex items-center gap-3">
                                                <Check className="text-indigo-600" size={18} />
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-black text-slate-700">Hardware Fingerprinting</span>
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Unique browser session binding</span>
                                                </div>
                                            </div>
                                            <input type="checkbox" defaultChecked className="w-5 h-5 rounded-lg text-indigo-600 focus:ring-indigo-500 border-slate-300" />
                                        </label>
                                        <label className="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl border border-slate-100 cursor-pointer hover:bg-slate-50 transition-all">
                                            <div className="flex items-center gap-3">
                                                <Check className="text-indigo-600" size={18} />
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-black text-slate-700">Dynamic IP Cycling</span>
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Background proxy management</span>
                                                </div>
                                            </div>
                                            <input type="checkbox" className="w-5 h-5 rounded-lg text-indigo-600 focus:ring-indigo-500 border-slate-300" />
                                        </label>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'notifications' && (
                            <motion.div
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                className="space-y-6"
                            >
                                <h3 className="text-xl font-bold text-slate-900 font-outfit mb-6">Internal System Alerts</h3>
                                <div className="space-y-4">
                                    {[
                                        { title: "New User Registration", desc: "Notify via email when someone joins the SaaS.", checked: true },
                                        { title: "Subscription Expiration", desc: "Alert 3 days before any user's plan expires.", checked: true },
                                        { title: "New Support Ticket", desc: "Notification whenever a business user opens a ticket.", checked: true },
                                        { title: "Failed Payment Alerts", desc: "Email owner when a recurring payment fails.", checked: false },
                                        { title: "High Usage Warnings", desc: "Notify when a user hits 90% of their daily limit.", checked: false }
                                    ].map((notif, i) => (
                                        <div key={i} className="flex items-center justify-between p-5 rounded-[28px] border border-slate-50 group hover:bg-slate-50/50 transition-all">
                                            <div className="flex items-center gap-4">
                                                <div className={`p-2.5 rounded-xl ${notif.checked ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-400'}`}>
                                                    <Bell size={18} />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-slate-900">{notif.title}</p>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{notif.desc}</p>
                                                </div>
                                            </div>
                                            <button className={`w-12 h-6 rounded-full relative transition-all ${notif.checked ? 'bg-indigo-600' : 'bg-slate-200'}`}>
                                                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${notif.checked ? 'right-1' : 'left-1'}`}></div>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Bottom Indicator */}
                    <div className="absolute top-0 right-0 p-4">
                        <div className="px-3 py-1 bg-indigo-50/50 text-indigo-400 text-[10px] font-black uppercase tracking-widest rounded-full flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse"></span>
                            Live Sync Active
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
