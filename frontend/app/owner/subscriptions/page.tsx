"use client";
import React, { useState } from "react";
import {
    CreditCard,
    Filter,
    Download,
    ArrowUpRight,
    Clock,
    AlertCircle,
    CheckCircle2,
    XCircle,
    Search,
    Calendar,
    ChevronLeft,
    ChevronRight,
    MoreVertical,
    RefreshCw,
    TrendingUp,
    FileText
} from "lucide-react";
import { motion } from "framer-motion";

const stats = [
    { name: "Active Subscriptions", value: "1,205", icon: CheckCircle2, color: "emerald" },
    { name: "Expiring (7 Days)", value: "42", icon: Clock, color: "amber" },
    { name: "Expired Recently", value: "85", icon: AlertCircle, color: "rose" },
    { name: "Cancelled", value: "12", icon: XCircle, color: "slate" },
];

const subscriptions = [
    { id: "S101", user: "Rahul Sharma", email: "rahul@example.com", plan: "Pro Plan", amount: "₹1,999", start: "2024-02-15", end: "2025-02-15", status: "Active", method: "Razorpay" },
    { id: "S102", user: "Amit Patel", email: "amit.p@gmail.com", plan: "Basic Plan", amount: "₹999", start: "2024-01-10", end: "2024-02-10", status: "Expired", method: "UPI" },
    { id: "S103", user: "Karan Johar", email: "karan@example.com", plan: "Pro Plan", amount: "₹1,999", start: "2024-02-28", end: "2024-03-07", status: "Expiring", method: "Razorpay" },
    { id: "S104", user: "Vikram Singh", email: "vikram@singh.com", plan: "Free Plan", amount: "₹0", start: "2023-12-05", end: "N/A", status: "Trial", method: "System" },
    { id: "S105", user: "Sneha Reddy", email: "sneha.r@outlook.com", plan: "Basic Plan", amount: "₹999", start: "2023-11-20", end: "2024-11-20", status: "Active", method: "Razorpay" },
];

export default function SubscriptionsPage() {
    const [filterStatus, setFilterStatus] = useState("All");

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight font-outfit text-indigo-900">Subscriptions Management</h1>
                    <p className="text-sm text-slate-500 font-medium">Monitor renewals, expirations and subscription revenue.</p>
                </div>
                <div className="flex items-center gap-2">
                    <button className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all flex items-center gap-2">
                        <FileText size={16} />
                        Export PDF
                    </button>
                    <button className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all flex items-center gap-2">
                        <Download size={16} />
                        Export CSV
                    </button>
                </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat, idx) => (
                    <motion.div
                        key={stat.name}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.1 }}
                        className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4"
                    >
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${stat.color === 'emerald' ? 'bg-emerald-50 text-emerald-600' :
                                stat.color === 'amber' ? 'bg-amber-50 text-amber-600' :
                                    stat.color === 'rose' ? 'bg-rose-50 text-rose-600' : 'bg-slate-50 text-slate-500'
                            }`}>
                            <stat.icon size={24} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{stat.name}</p>
                            <p className="text-2xl font-black text-slate-900 font-outfit leading-none">{stat.value}</p>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Revenue Mini Chart */}
            <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-bold text-slate-900 font-outfit flex items-center gap-2">
                        <TrendingUp size={20} className="text-indigo-500" />
                        Revenue Timeline
                    </h2>
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-400">Total YTD: <span className="text-indigo-600">₹12,45,000</span></span>
                    </div>
                </div>
                <div className="h-24 flex items-end gap-1.5">
                    {Array.from({ length: 40 }).map((_, i) => (
                        <div
                            key={i}
                            style={{ height: `${20 + Math.random() * 80}%` }}
                            className="flex-1 bg-indigo-100 rounded-t-md hover:bg-indigo-300 transition-colors cursor-help group relative"
                        >
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-900 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 font-bold">
                                Day {i + 1}: ₹{Math.floor(Math.random() * 5000 + 2000)}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Subscriptions Table */}
            <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-50 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3 bg-slate-50 p-1 rounded-xl border border-slate-200">
                        {["All", "Active", "Expiring", "Expired", "Trial"].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setFilterStatus(tab)}
                                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${filterStatus === tab
                                        ? "bg-white text-indigo-600 shadow-sm"
                                        : "text-slate-500 hover:text-slate-700"
                                    }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input
                                type="text"
                                placeholder="Search subscriptions..."
                                className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 w-64"
                            />
                        </div>
                        <button className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-500 transition-all">
                            <Filter size={18} />
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50">
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">User / Account</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Subscription</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Amount</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Validity Period</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Status</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {subscriptions.map((sub) => (
                                <tr key={sub.id} className={`hover:bg-slate-50/50 transition-colors group ${sub.status === 'Expired' ? 'bg-rose-50/30' : sub.status === 'Expiring' ? 'bg-amber-50/30' : ''
                                    }`}>
                                    <td className="px-6 py-5">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-black text-slate-900 leading-none mb-1">{sub.user}</span>
                                            <span className="text-[10px] text-slate-400 font-bold uppercase">{sub.id} • {sub.email}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                                                <CreditCard size={16} />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-xs font-bold text-slate-700">{sub.plan}</span>
                                                <span className="text-[10px] text-slate-400 font-medium">via {sub.method}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <span className="text-sm font-black text-slate-900">{sub.amount}</span>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex flex-col">
                                            <div className="flex items-center gap-1 text-[10px] font-black text-slate-400 uppercase mb-1">
                                                <span>{sub.start}</span>
                                                <ArrowUpRight size={10} className="text-slate-300" />
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Clock size={12} className={sub.status === 'Expiring' ? 'text-amber-500' : 'text-slate-300'} />
                                                <span className={`text-xs font-bold ${sub.status === 'Expired' ? 'text-rose-500' : 'text-slate-600'}`}>{sub.end}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-black uppercase ${sub.status === 'Active' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                                sub.status === 'Expiring' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                                    sub.status === 'Expired' ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-slate-50 text-slate-500 border-slate-100'
                                            }`}>
                                            {sub.status === 'Expiring' && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping"></span>}
                                            {sub.status}
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            <button className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-black text-slate-600 hover:bg-slate-50 hover:text-indigo-600 transition-all flex items-center gap-1.5 active:scale-95">
                                                <RefreshCw size={14} />
                                                Renew
                                            </button>
                                            <button className="p-2 text-slate-300 hover:text-slate-600 hover:bg-white rounded-lg transition-all">
                                                <MoreVertical size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="px-8 py-5 bg-slate-50/50 flex items-center justify-between border-t border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Page 1 of 65</p>
                    <div className="flex items-center gap-2">
                        <button className="p-2 border border-slate-200 rounded-xl text-slate-400 hover:bg-white hover:text-slate-600 transition-all disabled:opacity-50" disabled>
                            <ChevronLeft size={18} />
                        </button>
                        <button className="p-2 border border-slate-200 rounded-xl text-slate-400 hover:bg-white hover:text-slate-600 transition-all">
                            <ChevronRight size={18} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
