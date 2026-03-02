"use client";
import React, { useEffect, useState } from "react";
import { Send, Activity, MessageSquare, Settings, RefreshCw, BarChart2, ShieldCheck, Users, Zap } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function DashboardHome() {
    const [sessions, setSessions] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("http://localhost:5000/session/list")
            .then(r => r.ok ? r.json() : { sessions: [] })
            .then(data => {
                setSessions(data.sessions || []);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    // Action Grid
    const quickActions = [
        { label: "Campaigns", icon: Send, color: "bg-blue-500", href: "/dashboard/campaigns" },
        { label: "Sessions", icon: MessageSquare, color: "bg-indigo-500", href: "/dashboard/sessions" },
        { label: "Neural AI", icon: Zap, color: "bg-amber-500", href: "/dashboard/ai" },
        { label: "Audience", icon: Users, color: "bg-emerald-500", href: "#" },
    ];

    return (
        <div className="max-w-3xl mx-auto space-y-6 px-3 sm:px-4 pb-12 pt-4">

            {/* Header Area */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between pb-2"
            >
                <div>
                    <h2 className="text-xl font-extrabold text-slate-900 font-outfit tracking-tight">BulkReply</h2>
                    <p className="text-xs text-slate-500 font-medium flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-green-500" /> System secured
                    </p>
                </div>
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200">
                    <span className="text-sm font-bold text-slate-600">JD</span>
                </div>
            </motion.div>

            {/* Quick Actions Grid (Native App Style) */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-[24px] p-5 shadow-[0_2px_20px_rgba(0,0,0,0.03)] border border-slate-100"
            >
                <div className="flex justify-between font-outfit mb-4 px-1">
                    <h3 className="font-bold text-slate-900">Explore</h3>
                </div>
                <div className="grid grid-cols-4 gap-3">
                    {quickActions.map((action, idx) => {
                        const Icon = action.icon;
                        return (
                            <Link href={action.href} key={idx} className="flex flex-col items-center gap-2 group">
                                <div className={`w-12 h-12 rounded-[16px] flex items-center justify-center text-white ${action.color} shadow-sm group-hover:scale-105 transition-transform`}>
                                    <Icon className="w-5 h-5" />
                                </div>
                                <span className="text-[10px] font-semibold text-slate-600">{action.label}</span>
                            </Link>
                        );
                    })}
                </div>
            </motion.div>

            {/* Compact Stats Grid */}
            <div className="grid grid-cols-2 gap-3">
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white p-4 rounded-[20px] border border-slate-100 shadow-[0_2px_15px_rgba(0,0,0,0.02)] flex flex-col justify-between h-[110px]"
                >
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-md bg-blue-50 flex items-center justify-center">
                            <Send className="w-3.5 h-3.5 text-blue-600" />
                        </div>
                        <span className="text-xs font-semibold text-slate-500">Sent (MTD)</span>
                    </div>
                    <div>
                        <div className="text-2xl font-black text-slate-900 tracking-tight">14,029</div>
                        <div className="text-[10px] text-green-500 font-medium">+12% this week</div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-white p-4 rounded-[20px] border border-slate-100 shadow-[0_2px_15px_rgba(0,0,0,0.02)] flex flex-col justify-between h-[110px]"
                >
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-md bg-amber-50 flex items-center justify-center">
                            <Activity className="w-3.5 h-3.5 text-amber-600" />
                        </div>
                        <span className="text-xs font-semibold text-slate-500">Health</span>
                    </div>
                    <div>
                        <div className="text-2xl font-black text-slate-900 tracking-tight">99.9<span className="text-lg">%</span></div>
                        <div className="text-[10px] text-slate-400 font-medium">All systems operational</div>
                    </div>
                </motion.div>
            </div>

            {/* Active Connections List (Compact) */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white rounded-[24px] border border-slate-100 shadow-[0_2px_20px_rgba(0,0,0,0.03)] p-5"
            >
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-slate-900 font-outfit text-sm">Active Connections</h3>
                    <div className="text-xs font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{sessions.length}</div>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-4">
                        <RefreshCw className="w-4 h-4 animate-spin text-slate-400" />
                    </div>
                ) : sessions.length === 0 ? (
                    <div className="bg-slate-50 rounded-xl p-4 text-center border border-slate-100">
                        <p className="text-[11px] text-slate-500 mb-2">No active WhatsApp connections.</p>
                        <Link href="/dashboard/sessions" className="text-xs font-bold text-blue-600">Connect Device</Link>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {sessions.slice(0, 3).map((id, idx) => (
                            <div key={id} className="flex items-center justify-between p-3 bg-slate-50 rounded-[14px] border border-slate-100">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                                        <MessageSquare className="w-4 h-4 text-green-600" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-slate-900 line-clamp-1 break-all pr-2 max-w-[150px]">{id}</p>
                                        <p className="text-[9px] text-green-600 font-bold uppercase tracking-wider">Connected</p>
                                    </div>
                                </div>
                                <button className="w-7 h-7 flex items-center justify-center rounded-full bg-white border border-slate-200 text-slate-400 hover:text-blue-600 transition-colors shadow-sm">
                                    <BarChart2 className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
                {sessions.length > 3 && (
                    <Link href="/dashboard/sessions" className="block text-center text-xs font-semibold text-blue-600 mt-4">View All Sessions</Link>
                )}
            </motion.div>

        </div>
    );
}
