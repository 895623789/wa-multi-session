"use client";
import React, { useState, useEffect } from "react";
import {
    History,
    Search,
    Filter,
    Download,
    Activity,
    ShieldAlert,
    User,
    Globe,
    Database,
    Zap,
    Terminal,
    AlertTriangle,
    Info,
    XCircle,
    RotateCw,
    ChevronLeft,
    ChevronRight,
    ArrowUpRight,
    ExternalLink
} from "lucide-react";
import { motion } from "framer-motion";

export default function ActivityLogsPage() {
    const [liveStream, setLiveStream] = useState(true);
    const [logs, setLogs] = useState<any[]>([]);
    const [stats, setStats] = useState({ logs24h: 0, alerts: 0, queriesPerSec: 0, uptime: "100%" });
    const [loading, setLoading] = useState(true);

    const fetchLogs = async () => {
        try {
            const res = await fetch("http://localhost:5000/owner/logs");
            if (res.ok) {
                const data = await res.json();
                if (data.logs) setLogs(data.logs);
                if (data.stats) setStats({
                    ...stats,
                    logs24h: data.stats.logs24h || stats.logs24h,
                    alerts: data.stats.alerts || stats.alerts,
                    queriesPerSec: data.stats.queriesPerSec || stats.queriesPerSec,
                    uptime: data.stats.uptime || stats.uptime
                });
            }
        } catch (err) {
            console.error("Failed to fetch logs:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, []);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (liveStream) {
            interval = setInterval(() => {
                fetchLogs();
            }, 10000);
        }
        return () => clearInterval(interval);
    }, [liveStream]);

    return (
        <div className="space-y-8 pb-12">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight font-outfit text-indigo-900">System Activity Audit</h1>
                    <p className="text-sm text-slate-500 font-medium">Detailed session logs and security events tracking.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100 text-[10px] font-black uppercase tracking-widest">
                        <Terminal size={14} />
                        Instance: Production-01
                    </div>
                    <button className="px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all shadow-sm flex items-center gap-2">
                        <Download size={18} />
                        Export Audit Log
                    </button>
                </div>
            </div>

            {/* Live Feed Toggle & Filters */}
            <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex flex-wrap items-center justify-between gap-6">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setLiveStream(!liveStream)}
                            className={`w-12 h-6 rounded-full relative transition-all ${liveStream ? 'bg-emerald-500' : 'bg-slate-200'}`}
                        >
                            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${liveStream ? 'right-1' : 'left-1'}`}></div>
                        </button>
                        <span className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                            {liveStream ? (
                                <>
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                    Live Stream Active
                                </>
                            ) : 'Feed Paused'}
                        </span>
                    </div>

                    <div className="h-8 w-[1px] bg-slate-100 hidden md:block"></div>

                    <div className="flex items-center gap-3">
                        <button className="p-2.5 rounded-xl border border-slate-100 text-slate-400 hover:text-indigo-600 transition-all">
                            <Filter size={18} />
                        </button>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                            <input
                                type="text"
                                placeholder="Search by user or IP..."
                                className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-4 focus:ring-indigo-500/10 w-64"
                            />
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-1">
                    {["All", "Errors", "Auth", "System", "Billing"].map((cat) => (
                        <button key={cat} className="px-4 py-1.5 text-[10px] font-black uppercase text-slate-400 hover:text-indigo-600 transition-all">
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* Log Table */}
            <div className="bg-slate-900 rounded-[32px] overflow-hidden shadow-2xl border border-slate-800">
                <div className="p-6 bg-slate-800/50 border-b border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Activity size={18} className="text-indigo-400" />
                        <h2 className="text-xs font-black text-slate-300 uppercase tracking-widest">Real-time System Logs</h2>
                    </div>
                    {loading && (
                        <div className="flex items-center gap-2 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full">
                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></div>
                            <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Syncing with Backend...</span>
                        </div>
                    )}
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr>
                                <th className="px-8 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-800">Status</th>
                                <th className="px-8 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-800">Timestamp</th>
                                <th className="px-8 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-800">Identity / User</th>
                                <th className="px-8 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-800">Action Performed</th>
                                <th className="px-8 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-800 text-right">Source IP</th>
                            </tr>
                        </thead>
                        <tbody className="font-mono text-[11px]">
                            {logs.length > 0 ? logs.map((log) => (
                                <tr key={log.id} className="hover:bg-slate-800/40 transition-colors group">
                                    <td className="px-8 py-4 border-b border-slate-800/50">
                                        <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${log.level === 'Critical' ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' :
                                            log.level === 'Error' ? 'bg-orange-500/10 text-orange-500 border border-orange-500/20' :
                                                log.level === 'Warning' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                                            }`}>
                                            <div className={`w-1 h-1 rounded-full ${log.level === 'Critical' ? 'bg-rose-500 animate-pulse' :
                                                log.level === 'Error' ? 'bg-orange-500' :
                                                    log.level === 'Warning' ? 'bg-amber-500' : 'bg-emerald-500'
                                                }`}></div>
                                            {log.level}
                                        </div>
                                    </td>
                                    <td className="px-8 py-4 border-b border-slate-800/50 text-slate-500">{log.time}</td>
                                    <td className="px-8 py-4 border-b border-slate-800/50">
                                        <div className="flex items-center gap-2">
                                            <span className="text-indigo-400 font-bold">{log.user}</span>
                                            <span className="px-1.5 py-0.5 bg-slate-800 text-slate-500 rounded text-[9px] uppercase font-black">{log.category}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-4 border-b border-slate-800/50 text-slate-300 font-bold">{log.action}</td>
                                    <td className="px-8 py-4 border-b border-slate-800/50 text-right text-indigo-400 group-hover:text-indigo-300 transition-colors">
                                        <span className="flex items-center justify-end gap-1.5">
                                            {log.ip}
                                            <Globe size={10} className="text-slate-700" />
                                        </span>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={5} className="px-8 py-12 text-center text-slate-500 italic uppercase text-[10px] font-black tracking-widest">
                                        No real system audit logs found. System is currently quiet.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="p-8 border-t border-slate-800 flex items-center justify-between">
                    <button onClick={fetchLogs} className="flex items-center gap-2 text-slate-500 hover:text-slate-300 transition-all font-black uppercase tracking-widest text-[10px]">
                        <RotateCw size={14} className={loading ? 'animate-spin' : liveStream ? 'animate-spin-slow' : ''} />
                        Fetch Previous 100 Logs
                    </button>
                    <div className="flex items-center gap-1">
                        <button className="p-2 bg-slate-800 text-slate-500 rounded-xl hover:text-white transition-all disabled:opacity-30" disabled>
                            <ChevronLeft size={18} />
                        </button>
                        <button className="p-2 bg-slate-800 text-slate-500 rounded-xl hover:text-white transition-all">
                            <ChevronRight size={18} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Log Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="p-6 rounded-[32px] border border-slate-100 bg-white shadow-sm">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Logs (24h)</p>
                    <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-black text-slate-900 font-outfit">{stats.logs24h.toLocaleString()}</span>
                        <span className="text-xs font-bold text-emerald-500 flex items-center gap-0.5">
                            <ArrowUpRight size={12} />
                            4.2%
                        </span>
                    </div>
                </div>
                <div className="p-6 rounded-[32px] border border-slate-100 bg-white shadow-sm">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Security Alerts</p>
                    <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-black text-rose-600 font-outfit">{stats.alerts}</span>
                        <span className="text-xs font-bold text-slate-300 uppercase italic tracking-tighter ml-1">Requires Action</span>
                    </div>
                </div>
                <div className="p-6 rounded-[32px] border border-slate-100 bg-white shadow-sm">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">DB Queries / sec</p>
                    <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-black text-slate-900 font-outfit">{stats.queriesPerSec}</span>
                        <Database size={16} className="text-indigo-200" />
                    </div>
                </div>
                <div className="p-6 rounded-[32px] border border-slate-100 bg-white shadow-sm">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">System Uptime</p>
                    <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-black text-emerald-600 font-outfit">{stats.uptime}</span>
                        <Zap size={16} className="text-emerald-200" fill="currentColor" />
                    </div>
                </div>
            </div>
        </div>
    );
}
