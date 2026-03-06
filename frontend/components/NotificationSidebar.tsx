"use client";
import React from "react";
import { X, Bell, Info, AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface NotificationSidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

const mockNotifications = [
    {
        id: "1",
        title: "System Update",
        description: "New AI model Gemini 1.5 Flash is now active for all your bots.",
        time: "2 mins ago",
        type: "info",
        icon: Info,
        color: "text-blue-500 bg-blue-50"
    },
    {
        id: "2",
        title: "Campaign Completed",
        description: "Your 'Summer Sale' campaign has finished sending to 150 contacts.",
        time: "1 hour ago",
        type: "success",
        icon: CheckCircle2,
        color: "text-emerald-500 bg-emerald-50"
    },
    {
        id: "3",
        title: "Connection Lost",
        description: "WhatsApp session 'Agent-Alpha' disconnected. Please re-scan QR.",
        time: "3 hours ago",
        type: "warning",
        icon: AlertCircle,
        color: "text-amber-500 bg-amber-50"
    }
];

export default function NotificationSidebar({ isOpen, onClose }: NotificationSidebarProps) {
    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-[200]"
                    />

                    {/* Sidebar */}
                    <motion.div
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="fixed right-0 top-0 h-screen w-full max-w-[380px] bg-white shadow-2xl z-[201] flex flex-col border-l border-slate-100"
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-slate-50 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                                    <Bell size={20} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black text-slate-900 tracking-tight">Notifications</h3>
                                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">{mockNotifications.length} New Alerts</p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 hover:text-slate-900 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {mockNotifications.map((notif) => {
                                const Icon = notif.icon;
                                return (
                                    <div
                                        key={notif.id}
                                        className="group p-4 rounded-2xl bg-white border border-slate-100 hover:border-indigo-100 hover:shadow-sm transition-all cursor-pointer"
                                    >
                                        <div className="flex gap-4">
                                            <div className={`w-10 h-10 rounded-xl shrink-0 flex items-center justify-center ${notif.color}`}>
                                                <Icon size={18} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between mb-1">
                                                    <h4 className="text-sm font-black text-slate-900 truncate tracking-tight">{notif.title}</h4>
                                                    <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold">
                                                        <Clock size={10} />
                                                        {notif.time}
                                                    </div>
                                                </div>
                                                <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                                                    {notif.description}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}

                            <div className="py-8 text-center">
                                <p className="text-xs text-slate-400 font-medium italic">That's all for now!</p>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-4 bg-slate-50/50 border-t border-slate-100">
                            <button className="w-full py-3 bg-white border border-slate-200 rounded-xl text-xs font-black text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-all uppercase tracking-widest shadow-sm">
                                Clear All Notifications
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
