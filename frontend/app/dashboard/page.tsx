"use client";
import React, { useEffect, useState } from "react";
import { Link2, Send, Activity, Settings, RefreshCw } from "lucide-react";
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

    const stats = [
        { label: "Active Connections", value: sessions.length.toString(), icon: Link2, color: "text-blue-600", bg: "bg-blue-50" },
        { label: "Messages Sent (MTD)", value: "14,029", icon: Send, color: "text-green-600", bg: "bg-green-50" },
        { label: "System Health", value: "99.9%", icon: Activity, color: "text-amber-600", bg: "bg-amber-50" },
    ];

    return (
        <div className="space-y-8">
            {/* Welcome Banner */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden"
            >
                <div className="absolute right-0 top-0 w-64 h-full bg-gradient-to-l from-blue-50 to-transparent pointer-events-none" />
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 font-outfit mb-2">Welcome back to BulkReply</h2>
                    <p className="text-slate-500">Your anti-ban core is active and securing your marketing pipeline.</p>
                </div>
                <div className="flex gap-3">
                    <button onClick={() => window.location.href = "/dashboard/sessions"} className="px-5 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-900 text-sm font-medium rounded-xl shadow-sm transition-colors">
                        Manage Sessions
                    </button>
                    <button onClick={() => window.location.href = "/dashboard/campaigns"} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl shadow-sm transition-colors flex items-center gap-2">
                        <Send className="w-4 h-4" /> New Campaign
                    </button>
                </div>
            </motion.div>

            {/* Stats Grid */}
            <div className="grid md:grid-cols-3 gap-6">
                {stats.map((stat, idx) => {
                    const Icon = stat.icon;
                    return (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            key={idx}
                            className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.bg}`}>
                                    <Icon className={`w-6 h-6 ${stat.color}`} />
                                </div>
                            </div>
                            <p className="text-sm font-medium text-slate-500 mb-1">{stat.label}</p>
                            <p className="text-3xl font-black text-slate-900 font-outfit">{stat.value}</p>
                        </motion.div>
                    );
                })}
            </div>

            {/* Quick Actions & Recent Sessions */}
            <div className="grid lg:grid-cols-2 gap-8">
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold text-slate-900 font-outfit">Active Connections</h3>
                        <Link href="/dashboard/sessions" className="text-sm font-medium text-blue-600 hover:text-blue-700">View All</Link>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center py-8 text-slate-400">
                            <RefreshCw className="w-5 h-5 animate-spin" />
                        </div>
                    ) : sessions.length === 0 ? (
                        <div className="text-center py-8 border-2 border-dashed border-slate-100 rounded-xl">
                            <p className="text-slate-500 text-sm mb-4">No WhatsApp sessions currently active.</p>
                            <button onClick={() => window.location.href = "/dashboard/sessions"} className="text-sm text-blue-600 font-medium">Connect Now &rarr;</button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {sessions.slice(0, 3).map(id => (
                                <div key={id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                                            <Link2 className="w-5 h-5 text-green-600" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-900">{id}</p>
                                            <p className="text-xs text-green-600 font-medium">Connected</p>
                                        </div>
                                    </div>
                                    <Activity className="w-4 h-4 text-slate-300" />
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 relative overflow-hidden">
                    <div className="absolute right-0 bottom-0 w-32 h-32 bg-amber-50 rounded-tl-full -z-0"></div>
                    <h3 className="text-lg font-bold text-slate-900 font-outfit mb-2 relative z-10">Neural Link Diagnostics</h3>
                    <p className="text-slate-500 text-sm mb-6 relative z-10">Talk to the built-in system admin to query database logs and queue metrics.</p>

                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 relative z-10">
                        <div className="flex items-start gap-4 mb-4 opacity-50">
                            <div className="w-8 h-8 rounded-full bg-slate-200 flex-shrink-0"></div>
                            <div className="space-y-2 flex-1">
                                <div className="h-2 w-1/3 bg-slate-200 rounded"></div>
                                <div className="h-2 w-2/3 bg-slate-200 rounded"></div>
                            </div>
                        </div>
                        <button onClick={() => window.location.href = "/dashboard/admin"} className="w-full py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:text-slate-900 hover:border-slate-300 transition-all flex items-center justify-center gap-2">
                            <Settings className="w-4 h-4" /> Open Admin Chat
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
