"use client";
import React, { useEffect, useState } from "react";
import { Send, Activity, MessageSquare, Settings, RefreshCw, BarChart2, ShieldCheck, Users, Zap, Search, Bell } from "lucide-react";
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
        { label: "Campaigns", icon: Send, color: "bg-gradient-to-br from-blue-400 to-blue-600", href: "/dashboard/campaigns" },
        { label: "Sessions", icon: MessageSquare, color: "bg-gradient-to-br from-indigo-400 to-indigo-600", href: "/dashboard/sessions" },
        { label: "Neural AI", icon: Zap, color: "bg-gradient-to-br from-amber-400 to-amber-600", href: "/dashboard/ai" },
        { label: "Audience", icon: Users, color: "bg-gradient-to-br from-teal-400 to-teal-600", href: "#" },
    ];

    return (
        <div className="w-full h-full relative z-10 p-4 lg:p-8">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <p className="text-primary text-sm font-medium mb-1 flex items-center gap-1">
                        <ShieldCheck className="w-4 h-4" /> System secured
                    </p>
                    <h2 className="text-3xl font-bold text-slate-800 dark:text-white font-outfit">Dashboard</h2>
                </div>
                <div className="flex items-center space-x-4 self-end md:self-auto">
                    <button className="p-2 text-slate-400 hover:text-primary transition-colors dark:text-slate-500 dark:hover:text-white">
                        <Search className="w-6 h-6" />
                    </button>
                    <button className="p-2 text-slate-400 hover:text-primary transition-colors relative dark:text-slate-500 dark:hover:text-white">
                        <Bell className="w-6 h-6" />
                        <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white dark:border-slate-800"></span>
                    </button>
                    <div className="flex items-center space-x-3 pl-2">
                        <div className="w-10 h-10 rounded-full bg-slate-200 border-2 border-white dark:border-slate-700 shadow-sm flex items-center justify-center">
                            <span className="text-sm font-bold text-slate-600">JD</span>
                        </div>
                        <span className="hidden md:block font-medium text-slate-700 dark:text-slate-200 text-sm">John Doe</span>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pb-20 lg:pb-0">
                {/* Left Column (Span 5) */}
                <div className="md:col-span-12 lg:col-span-5 space-y-6">
                    {/* Active Connections */}
                    <div className="bg-white dark:bg-card-dark rounded-2xl p-6 shadow-soft relative overflow-hidden glass">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-slate-700 dark:text-slate-300 font-bold">Active Devices</h3>
                            <Link href="/dashboard/sessions" className="text-primary text-sm font-bold hover:underline">Manage sessions</Link>
                        </div>

                        {loading ? (
                            <div className="flex items-center justify-center py-8">
                                <RefreshCw className="w-6 h-6 animate-spin text-slate-400" />
                            </div>
                        ) : sessions.length === 0 ? (
                            <div className="text-center py-8 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700">
                                <div className="inline-flex items-center justify-center space-x-2 bg-slate-100 dark:bg-slate-700/50 rounded-full px-4 py-1.5 mb-2">
                                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Offline</span>
                                </div>
                                <p className="text-slate-400 dark:text-slate-500 text-xs mt-1 mb-4">No active WhatsApp connections.</p>
                                <Link href="/dashboard/sessions" className="px-4 py-2 bg-primary text-white text-xs font-semibold rounded-full hover:bg-teal-700 transition">Connect Device</Link>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {sessions.slice(0, 3).map((id, idx) => (
                                    <div key={id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700 transition-colors hover:bg-slate-100">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center">
                                                <MessageSquare className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-slate-800 dark:text-white line-clamp-1 break-all max-w-[140px]">{id}</p>
                                                <p className="text-[10px] text-teal-600 dark:text-teal-400 font-bold uppercase tracking-wider">Connected</p>
                                            </div>
                                        </div>
                                        <button className="w-8 h-8 flex items-center justify-center rounded-full bg-white dark:bg-slate-700 shadow-sm border border-slate-200 dark:border-slate-600 text-slate-400 hover:text-primary transition-colors">
                                            <BarChart2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Explore Quick Actions directly below Active Devices */}
                    <div className="bg-white dark:bg-card-dark rounded-2xl p-6 shadow-soft glass">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-slate-700 dark:text-slate-200 font-medium">Quick Actions</h3>
                        </div>
                        <div className="grid grid-cols-4 gap-4">
                            {quickActions.map((action, idx) => {
                                const Icon = action.icon;
                                return (
                                    <Link href={action.href} key={idx} className="flex flex-col items-center gap-2 group">
                                        <div className={`w-14 h-14 rounded-[18px] flex items-center justify-center text-white ${action.color} shadow-lg shadow-${action.color.split('-')[2]}/20 group-hover:scale-105 transition-transform`}>
                                            <Icon className="w-6 h-6" />
                                        </div>
                                        <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 group-hover:text-primary transition-colors">{action.label}</span>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Right Column (Span 7) */}
                <div className="md:col-span-12 lg:col-span-7 space-y-6">
                    {/* Games statistic -> Account statistic */}
                    <div className="bg-white dark:bg-card-dark rounded-2xl p-6 shadow-soft glass">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-slate-700 dark:text-slate-300 font-bold">Account statistic</h3>
                            <a href="#" className="text-primary text-sm font-bold hover:underline">View all statistic</a>
                        </div>
                        <div className="py-4">
                            <div className="w-full h-3 bg-slate-100 dark:bg-slate-700 rounded-full flex overflow-hidden mb-6">
                                <div className="h-full bg-primary" style={{ width: '82%' }}></div>
                                <div className="h-full bg-gray-300 dark:bg-slate-500" style={{ width: '13%' }}></div>
                                <div className="h-full bg-red-400" style={{ width: '5%' }}></div>
                            </div>
                            <div className="grid grid-cols-4 gap-4 text-center divide-x divide-slate-100 dark:divide-slate-700">
                                <div className="px-2">
                                    <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1">Total</p>
                                    <p className="text-lg font-bold text-slate-800 dark:text-white">14,029</p>
                                </div>
                                <div className="px-2">
                                    <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1">Delivered</p>
                                    <p className="text-lg font-bold text-slate-800 dark:text-white">11,500</p>
                                </div>
                                <div className="px-2">
                                    <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1">Failed</p>
                                    <p className="text-lg font-bold text-slate-800 dark:text-white">2,029</p>
                                </div>
                                <div className="px-2">
                                    <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1">Errors</p>
                                    <p className="text-lg font-bold text-slate-800 dark:text-white">500</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 4 Bento Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="bg-white dark:bg-card-dark rounded-2xl p-6 shadow-soft flex items-center glass hover:scale-[1.02] transition-transform cursor-pointer">
                            <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center mr-4">
                                <Send className="w-6 h-6 text-indigo-500" />
                            </div>
                            <div>
                                <p className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Delivery Rate</p>
                                <p className="text-2xl font-bold text-slate-800 dark:text-white">82%</p>
                            </div>
                        </div>
                        <div className="bg-white dark:bg-card-dark rounded-2xl p-6 shadow-soft flex items-center glass hover:scale-[1.02] transition-transform cursor-pointer">
                            <div className="w-12 h-12 rounded-full bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center mr-4">
                                <Users className="w-6 h-6 text-pink-500" />
                            </div>
                            <div>
                                <p className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Audience Engaged</p>
                                <p className="text-2xl font-bold text-slate-800 dark:text-white">2,841</p>
                            </div>
                        </div>
                        <div className="bg-white dark:bg-card-dark rounded-2xl p-6 shadow-soft flex items-center glass hover:scale-[1.02] transition-transform cursor-pointer">
                            <div className="w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center mr-4">
                                <Activity className="w-6 h-6 text-orange-500" />
                            </div>
                            <div>
                                <p className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Queue Load</p>
                                <p className="text-2xl font-bold text-slate-800 dark:text-white">412</p>
                            </div>
                        </div>
                        <div className="bg-white dark:bg-card-dark rounded-2xl p-6 shadow-soft flex items-center glass hover:scale-[1.02] transition-transform cursor-pointer">
                            <div className="w-12 h-12 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center mr-4">
                                <ShieldCheck className="w-6 h-6 text-primary" />
                            </div>
                            <div>
                                <p className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">System Health</p>
                                <p className="text-2xl font-bold text-slate-800 dark:text-white">99.9%</p>
                            </div>
                        </div>
                    </div>

                    {/* Wide Hero Banner */}
                    <div className="relative w-full h-40 rounded-3xl overflow-hidden shadow-lg group">
                        <div className="absolute inset-0 bg-gradient-to-r from-teal-700 to-blue-600 z-0 transition-transform duration-700 group-hover:scale-105"></div>
                        <div className="absolute right-10 top-1/2 transform -translate-y-1/2 z-10 hidden sm:block">
                            <div className="w-32 h-32 relative">
                                <div className="absolute top-0 right-0 w-12 h-12 bg-lime-400 rounded-full shadow-lg opacity-90 animate-bounce" style={{ animationDuration: '3s' }}></div>
                                <div className="absolute bottom-4 left-0 w-10 h-10 bg-white/90 rounded-xl transform rotate-12 shadow-lg backdrop-blur-sm"></div>
                                <div className="absolute top-10 left-10 w-8 h-8 bg-pink-500 rounded-full shadow-lg opacity-80"></div>
                                <div className="absolute bottom-0 right-10 w-16 h-4 bg-blue-400/50 rounded-full filter blur-md"></div>
                            </div>
                        </div>
                        <div className="relative z-20 flex flex-col justify-center h-full px-8 sm:px-10">
                            <p className="text-teal-200 text-xs font-semibold uppercase tracking-wider mb-1">Ready to scale</p>
                            <h3 className="text-2xl font-bold text-white mb-4 leading-tight">Setup a new <br />campaign today</h3>
                            <Link href="/dashboard/campaigns" className="inline-flex items-center justify-center px-5 py-2.5 bg-white text-teal-800 text-sm font-semibold rounded-full w-max hover:bg-teal-50 hover:scale-105 transition-all shadow-md">
                                Send Messages
                            </Link>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
