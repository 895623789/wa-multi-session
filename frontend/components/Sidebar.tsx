"use client";
import React from "react";
import {
    LayoutDashboard,
    MessageSquare,
    Zap,
    Settings,
    Link as LinkIcon,
    LogOut,
    ChevronRight
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const menuItems = [
    { icon: LinkIcon, label: "Connection", id: "connection" },
    { icon: Zap, label: "Campaigns", id: "campaigns" },
    { icon: MessageSquare, label: "Admin AI Chat", id: "chat" },
];

export function Sidebar({ activeTab, setActiveTab }: { activeTab: string, setActiveTab: (id: string) => void }) {
    return (
        <div className="w-[280px] h-screen glass border-r border-white/5 flex flex-col p-8 sticky top-0 z-50">
            <div className="flex items-center gap-4 mb-12 px-2">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-2xl shadow-lg shadow-primary/30">
                    B
                </div>
                <div className="flex flex-col">
                    <span className="font-bold text-xl tracking-tight text-white leading-none">BulkReply</span>
                    <span className="text-[10px] text-primary font-bold tracking-[0.2em] uppercase mt-1">SaaS Edition</span>
                </div>
            </div>

            <nav className="flex-1 space-y-3">
                <div className="text-[10px] uppercase text-slate-500 font-bold mb-4 px-4 tracking-[0.2em]">Dashboard</div>
                {menuItems.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        className={cn(
                            "w-full flex items-center justify-between px-6 py-4 rounded-full transition-all duration-300 group relative overflow-hidden",
                            activeTab === item.id
                                ? "bg-primary text-white shadow-neon scale-[1.02]"
                                : "text-slate-400 hover:bg-white/5 hover:text-white"
                        )}
                    >
                        <div className="flex items-center gap-4 relative z-10">
                            <item.icon size={20} className={cn(activeTab === item.id ? "text-white" : "text-slate-500 group-hover:text-primary transition-colors")} />
                            <span className="font-semibold tracking-wide">{item.label}</span>
                        </div>
                        {activeTab === item.id && (
                            <motion.div
                                layoutId="active-pill"
                                className="absolute inset-0 bg-primary z-0"
                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            />
                        )}
                    </button>
                ))}
            </nav>

            <div className="pt-8 border-t border-white/5 mt-8 space-y-4">
                <button className="w-full flex items-center gap-4 px-6 py-4 rounded-full text-slate-500 hover:bg-destructive/10 hover:text-destructive transition-all group font-semibold">
                    <LogOut size={20} />
                    <span>Sign Out</span>
                </button>

                <div className="mt-4 p-5 rounded-3xl bg-slate-900/50 border border-white/5 relative overflow-hidden group hover:border-primary/30 transition-colors">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-primary/10 blur-2xl rounded-full -mr-10 -mt-10" />
                    <p className="text-[10px] text-primary font-bold mb-1 tracking-widest uppercase">Ultra Plan</p>
                    <p className="text-[11px] text-slate-400 leading-relaxed">Unlimited AI Power & Bulk Campaigns active.</p>
                </div>
            </div>
        </div>
    );
}
