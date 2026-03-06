"use client";
import React, { useEffect, useState } from "react";
import { Send, Activity, MessageSquare, Settings, RefreshCw, BarChart2, ShieldCheck, Users, Zap, Search, Bell, Bot, Rocket, ChevronRight } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import DashboardNavbar from "@/components/DashboardNavbar";
import NotificationSidebar from "@/components/NotificationSidebar";

export default function DashboardHome() {
    const [sessions, setSessions] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [backendStatus, setBackendStatus] = useState("Connecting...");
    const [isNotifOpen, setIsNotifOpen] = useState(false);

    useEffect(() => {
        const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";
        fetch(`${baseUrl}/session/list`).catch(() => null)
            .then(res => {
                if (!res || !res.ok) {
                    setBackendStatus("Connection Failed");
                    return null;
                }
                setBackendStatus("Connected to API");
                return res.json();
            })
            .then(data => {
                if (data) {
                    setSessions(data.sessions || []);
                }
                setLoading(false);
            })
            .catch(error => {
                console.error("Error fetching sessions:", error);
                setLoading(false);
                if (backendStatus === "Connecting...") { // Only set to failed if not already set by the .then block
                    setBackendStatus("Connection Failed");
                }
            });
    }, []);

    // Action Grid
    const quickActions = [
        { label: "Campaigns", icon: Send, color: "bg-gradient-to-br from-blue-400 to-blue-600", href: "/dashboard/campaigns" },
        { label: "Agents", icon: Bot, color: "bg-gradient-to-br from-indigo-400 to-indigo-600", href: "/dashboard/agents" },
        { label: "AI", icon: Zap, color: "bg-gradient-to-br from-amber-400 to-amber-600", href: "/dashboard/ai" },
        { label: "Audience", icon: Users, color: "bg-gradient-to-br from-teal-400 to-teal-600", href: "#" },
    ];

    return (
        <div className="flex flex-col flex-1 min-w-0 h-full overflow-hidden">
            <DashboardNavbar onOpenNotifications={() => setIsNotifOpen(true)} />

            {/* Upgrade / Promo Banner */}
            <div className="shrink-0 bg-indigo-600 text-white px-2 lg:px-6 py-2 flex items-center justify-between group overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-700 to-indigo-500 opacity-50"></div>
                <div className="flex items-center gap-2 lg:gap-3 relative z-10 w-full lg:w-auto">
                    <div className="hidden lg:flex w-8 h-8 rounded-lg bg-white/20 items-center justify-center backdrop-blur-md">
                        <Rocket size={16} className="animate-bounce" />
                    </div>
                    <p className="text-[10px] lg:text-xs font-black tracking-tight uppercase truncate">
                        Ready to scale? <span className="text-indigo-100 opacity-80 font-bold ml-1 hidden lg:inline">Unlock premium AI features and higher limits today!</span>
                    </p>
                </div>
                <Link
                    href="/dashboard/profile"
                    className="px-3 lg:px-4 py-1.5 bg-white text-indigo-600 text-[9px] lg:text-[10px] font-black rounded-xl hover:scale-105 transition-all shadow-lg shadow-black/10 flex items-center gap-1.5 lg:gap-2 relative z-10 shrink-0"
                >
                    UPGRADE NOW
                    <ChevronRight size={12} className="lg:w-[14px] lg:h-[14px]" />
                </Link>
            </div>

            <div className="w-full relative z-10 p-3 lg:p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pb-20 lg:pb-0">
                    {/* Left Column (Span 5) */}
                    <div className="md:col-span-12 lg:col-span-5 space-y-6">
                        {/* Quick Actions at the TOP of the column */}
                        <div className="rounded-2xl p-5 lg:p-6 shadow-soft glass bg-white/50 border border-white/20">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-base lg:text-lg font-black text-slate-900 dark:text-white tracking-tight">Quick Actions</h3>
                            </div>
                            <div className="grid grid-cols-4 gap-2 lg:gap-3">
                                {quickActions.map((action, idx) => {
                                    const Icon = action.icon;
                                    return (
                                        <Link href={action.href} key={idx} className="flex flex-col items-center gap-1.5 lg:gap-2 p-2 rounded-xl bg-white/40 border border-white hover:bg-white hover:shadow-lg hover:scale-[1.03] transition-all group">
                                            <div className={`w-9 h-9 lg:w-11 lg:h-11 rounded-lg lg:rounded-xl flex items-center justify-center text-white ${action.color} shadow-md transition-transform active:scale-95`}>
                                                <Icon className="w-4 h-4 lg:w-5 lg:h-5" />
                                            </div>
                                            <span className="text-[8px] lg:text-[10px] font-black text-slate-700 dark:text-slate-300 group-hover:text-indigo-600 transition-colors uppercase tracking-tight text-center truncate w-full">{action.label}</span>
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Active Connections */}
                        <div className="rounded-2xl p-5 lg:p-6 shadow-soft relative overflow-hidden glass bg-white/30">
                            <div className="flex justify-between items-center mb-4 lg:mb-5">
                                <div>
                                    <h3 className="text-sm lg:text-base font-black text-slate-900 dark:text-white tracking-tight">WhatsApp Devices</h3>
                                    <p className="text-[8px] lg:text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{sessions.length} Active Sessions</p>
                                </div>
                                <Link href="/dashboard/agents" className="px-2.5 py-1 bg-indigo-50 text-indigo-600 text-[9px] font-black uppercase rounded-lg hover:bg-indigo-600 hover:text-white transition-all">Manage</Link>
                            </div>

                            {loading ? (
                                <div className="flex items-center justify-center py-6 lg:py-8">
                                    <RefreshCw className="w-6 h-6 animate-spin text-indigo-500" />
                                </div>
                            ) : sessions.length === 0 ? (
                                <div className="text-center py-6 lg:py-8 bg-white/40 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700">
                                    <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl bg-indigo-50 flex items-center justify-center mx-auto mb-3 border border-white shadow-inner">
                                        <MessageSquare className="w-5 h-5 lg:w-6 lg:h-6 text-indigo-500" />
                                    </div>
                                    <h4 className="text-xs lg:text-sm font-black text-slate-900 dark:text-white mb-1">No WhatsApp Linked</h4>
                                    <p className="text-[9px] lg:text-[10px] text-slate-500 dark:text-slate-400 mb-4 max-w-[180px] mx-auto leading-relaxed">
                                        Connect your device to unlock AI.
                                    </p>
                                    <Link href="/dashboard/agents" className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white text-[9px] font-black uppercase rounded-lg hover:bg-indigo-700 transition-all shadow-lg active:scale-95">
                                        <Zap className="w-3 h-3 fill-white" />
                                        Link Device
                                    </Link>
                                </div>
                            ) : (
                                <div className="space-y-2 lg:space-y-3">
                                    {sessions.slice(0, 3).map((id, idx) => (
                                        <div key={id} className="flex items-center justify-between p-3 lg:p-4 bg-white/60 hover:bg-white rounded-xl border border-white shadow-sm transition-all group hover:shadow-md cursor-pointer">
                                            <div className="flex items-center gap-2.5 lg:gap-3">
                                                <div className="w-8 h-8 lg:w-9 lg:h-9 rounded-lg bg-indigo-50 flex items-center justify-center group-hover:rotate-6 transition-transform">
                                                    <MessageSquare className="w-4 h-4 lg:w-5 lg:h-5 text-indigo-600" />
                                                </div>
                                                <div>
                                                    <p className="text-[11px] lg:text-xs font-black text-slate-900 dark:text-white line-clamp-1 break-all max-w-[100px] sm:max-w-[140px] tracking-tight">{id}</p>
                                                    <div className="flex items-center gap-1 mt-0.5">
                                                        <span className="w-1 h-1 rounded-full bg-emerald-500"></span>
                                                        <p className="text-[8px] text-emerald-600 font-black uppercase tracking-widest leading-none">Active</p>
                                                    </div>
                                                </div>
                                            </div>
                                            <button className="w-7 h-7 lg:w-8 lg:h-8 flex items-center justify-center rounded-lg bg-slate-50 text-slate-400 hover:text-indigo-600 hover:bg-white transition-all">
                                                <BarChart2 className="w-3 h-3 lg:w-3.5 lg:h-3.5" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column (Span 7) */}
                    <div className="md:col-span-12 lg:col-span-7 space-y-6">
                        {/* Account statistic */}
                        <div className="rounded-2xl p-5 lg:p-6 shadow-soft glass bg-white/30 border border-white/40">
                            <div className="flex justify-between items-center mb-5 lg:mb-6">
                                <h3 className="text-sm lg:text-base font-black text-slate-900 dark:text-white tracking-tight">Account Statistics</h3>
                                <Link href="#" className="hidden sm:inline-block text-indigo-600 text-[9px] font-black uppercase tracking-widest hover:underline">View All</Link>
                            </div>
                            <div className="py-1">
                                <div className="w-full h-2.5 bg-slate-100 rounded-full flex overflow-hidden mb-6 border border-white relative shadow-inner">
                                    <div className="h-full bg-indigo-600" style={{ width: '82%' }}></div>
                                    <div className="h-full bg-slate-300" style={{ width: '13%' }}></div>
                                    <div className="h-full bg-rose-400" style={{ width: '5%' }}></div>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 lg:gap-3">
                                    {[
                                        { label: "Delivery Rate", val: "82%", icon: Activity, color: "text-indigo-500", bg: "bg-indigo-50" },
                                        { label: "Engaged", val: "2,841", icon: Users, color: "text-emerald-500", bg: "bg-emerald-50" },
                                        { label: "Queue Load", val: "412", icon: BarChart2, color: "text-amber-500", bg: "bg-amber-50" },
                                        { label: "Health", val: "99.9%", icon: ShieldCheck, color: "text-rose-500", bg: "bg-rose-50" }
                                    ].map((stat, i) => (
                                        <div key={i} className="p-3 lg:p-4 rounded-xl bg-white/60 border border-white shadow-sm hover:shadow-md transition-all group">
                                            <div className={`w-7 h-7 lg:w-8 lg:h-8 rounded-lg ${stat.bg} ${stat.color} flex items-center justify-center mb-2 active:scale-95 transition-transform`}>
                                                <stat.icon size={14} className="lg:size-16" />
                                            </div>
                                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">{stat.label}</p>
                                            <p className="text-sm lg:text-base font-black text-slate-900 mt-1">{stat.val}</p>
                                        </div>
                                    ))}
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
            <NotificationSidebar isOpen={isNotifOpen} onClose={() => setIsNotifOpen(false)} />
        </div>
    );
}
