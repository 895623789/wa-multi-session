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
    const [lastSync, setLastSync] = useState<string | null>(null);
    const [hasFetched, setHasFetched] = useState(false);
    const [logs, setLogs] = useState<any[]>([]);
    const [stats, setStats] = useState({
        logs24h: 0,
        alerts: 0,
        messagesSent: 0,
        botsTotal: 0,
        botsActive: 0,
        botsDeleted: 0,
        botsOffline: 0
    });
    const [loading, setLoading] = useState(false);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const res = await fetch("http://localhost:5000/owner/logs");
            if (res.ok) {
                const data = await res.json();
                if (data.logs) setLogs(data.logs);
                if (data.stats) setStats({
                    ...stats,
                    logs24h: data.stats.logs24h ?? stats.logs24h,
                    alerts: data.stats.alerts ?? stats.alerts,
                    messagesSent: data.stats.messagesSent ?? stats.messagesSent,
                    botsTotal: data.stats.botsTotal ?? stats.botsTotal,
                    botsActive: data.stats.botsActive ?? stats.botsActive,
                    botsDeleted: data.stats.botsDeleted ?? stats.botsDeleted,
                    botsOffline: data.stats.botsOffline ?? stats.botsOffline
                });
                setLastSync(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
                setHasFetched(true);
            }
        } catch (err) {
            console.error("Failed to fetch logs:", err);
        } finally {
            setLoading(false);
        }
    };

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
                    <button
                        onClick={fetchLogs}
                        disabled={loading}
                        className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-black uppercase tracking-widest shadow-lg shadow-indigo-500/30 hover:bg-indigo-700 hover:shadow-indigo-500/50 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:hover:translate-y-0"
                    >
                        <RotateCw size={16} className={loading ? 'animate-spin' : ''} />
                        {loading ? 'Syncing...' : 'Sync Dashboard'}
                    </button>
                    {lastSync && (
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            Last Sync: {lastSync}
                        </span>
                    )}
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
                                        {!hasFetched ? "Dashboard is in Ultra-Budget Mode. Click 'Sync Dashboard' to fetch real data safely." : "No real system audit logs found. System is currently quiet."}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="p-8 border-t border-slate-800 flex items-center justify-between">
                    <button onClick={fetchLogs} className="flex items-center gap-2 text-slate-500 hover:text-slate-300 transition-all font-black uppercase tracking-widest text-[10px]">
                        <RotateCw size={14} className={loading ? 'animate-spin' : ''} />
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

            {/* Log Stats grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <div className="p-5 rounded-[24px] border border-slate-100 bg-white shadow-sm hover:shadow-md transition-shadow">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Action Logs (24h)</p>
                    <div className="flex items-baseline gap-2">
                        <span className="text-xl font-black text-slate-900 font-outfit">{stats.logs24h.toLocaleString()}</span>
                    </div>
                </div>
                <div className="p-5 rounded-[24px] border border-slate-100 bg-white shadow-sm hover:shadow-md transition-shadow">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">System Errors</p>
                    <div className="flex items-baseline gap-2">
                        <span className="text-xl font-black text-rose-600 font-outfit">{stats.alerts.toLocaleString()}</span>
                    </div>
                </div>
                <div className="p-5 rounded-[24px] border border-slate-100 bg-white shadow-sm hover:shadow-md transition-shadow">
                    <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1.5">Total Messages</p>
                    <div className="flex items-baseline gap-2">
                        <span className="text-xl font-black text-slate-900 font-outfit">{stats.messagesSent.toLocaleString()}</span>
                    </div>
                </div>
                <div className="p-5 rounded-[24px] border border-slate-100 bg-white shadow-sm hover:shadow-md transition-shadow">
                    <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-1.5">Total Bots Created</p>
                    <div className="flex items-baseline gap-2">
                        <span className="text-xl font-black text-slate-900 font-outfit">{stats.botsTotal.toLocaleString()}</span>
                    </div>
                </div>
                <div className="p-5 rounded-[24px] border border-slate-100 bg-white shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                    <div className="absolute inset-0 bg-emerald-500/5 group-hover:bg-emerald-500/10 transition-colors"></div>
                    <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1.5 relative z-10">Active Bots</p>
                    <div className="flex items-baseline gap-2 relative z-10">
                        <span className="text-xl font-black text-emerald-600 font-outfit">{stats.botsActive.toLocaleString()}</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    </div>
                </div>
                <div className="p-5 rounded-[24px] border border-slate-100 bg-white shadow-sm hover:shadow-md transition-shadow">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Deleted / Offline</p>
                    <div className="flex items-baseline gap-2">
                        <span className="text-xl font-black text-slate-500 font-outfit">
                            {stats.botsDeleted.toLocaleString()} <span className="text-sm">/ {stats.botsOffline.toLocaleString()}</span>
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
