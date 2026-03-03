"use client";
import React from "react";
import {
    ArrowLeft,
    Mail,
    Phone,
    Calendar,
    ShieldCheck,
    CreditCard,
    History,
    MessageSquare,
    Smartphone,
    AlertCircle,
    Trash2,
    Power,
    ExternalLink,
    ChevronRight,
    ArrowUpRight,
    Settings,
    MoreHorizontal
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";

const mockUserData = {
    uid: "user1",
    name: "Rahul Sharma",
    email: "rahul@example.com",
    phone: "+91 98765 43210",
    role: "user",
    company: "Rahul Tech Solutions",
    industry: "E-commerce",
    status: "Active",
    onboardingComplete: true,
    plan: "Pro Plan",
    planExpiry: "2025-02-15",
    createdAt: "2024-02-15",
    sessions: ["session_1", "session_2"],
    stats: {
        messagesUsed: 1250,
        aiRepliesUsed: 420,
        totalContacts: 5000
    }
};

const subscriptionHistory = [
    { id: "sub1", plan: "Pro Plan", amount: "₹1,999", date: "2024-02-15", status: "Paid", method: "Razorpay" },
    { id: "sub2", plan: "Basic Plan", amount: "₹999", date: "2024-01-15", status: "Paid", method: "UPI" },
];

export default function UserDetailPage() {
    const params = useParams();
    const uid = params?.uid as string;

    return (
        <div className="space-y-8">
            {/* Breadcrumb & Quick Actions */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Link
                        href="/owner/users"
                        className="p-2 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-indigo-600 hover:border-indigo-100 transition-all shadow-sm"
                    >
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <nav className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">
                            <span>Users</span>
                            <ChevronRight size={12} />
                            <span className="text-indigo-600">Profile Details</span>
                        </nav>
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight font-outfit">{mockUserData.name}</h1>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button className="px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all shadow-sm flex items-center gap-2">
                        <Settings size={18} />
                        Account Settings
                    </button>
                    <button className="flex items-center justify-center w-10 h-10 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-slate-600 transition-all shadow-sm">
                        <MoreHorizontal size={20} />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Profile Card & Stats */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 -mr-12 -mt-12 rounded-full bg-indigo-50 rotate-12 group-hover:scale-110 transition-transform"></div>

                        <div className="relative flex flex-col items-center text-center">
                            <div className="relative mb-6">
                                <div className="w-24 h-24 rounded-full bg-slate-100 border-4 border-white shadow-xl flex items-center justify-center text-3xl font-black text-indigo-500 overflow-hidden">
                                    {mockUserData.name.charAt(0)}
                                </div>
                                <div className="absolute bottom-0 right-0 w-7 h-7 bg-emerald-500 border-4 border-white rounded-full"></div>
                            </div>

                            <h2 className="text-xl font-black text-slate-900 font-outfit mb-1">{mockUserData.name}</h2>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-6">{mockUserData.company || 'Individual'}</p>

                            <div className="w-full space-y-3 pt-4 border-t border-slate-50">
                                <div className="flex items-center gap-3 text-sm font-medium text-slate-600">
                                    <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                                        <Mail size={16} />
                                    </div>
                                    <span className="truncate">{mockUserData.email}</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm font-medium text-slate-600">
                                    <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                                        <Phone size={16} />
                                    </div>
                                    <span>{mockUserData.phone}</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm font-medium text-slate-600">
                                    <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                                        <Calendar size={16} />
                                    </div>
                                    <span>Joined: {mockUserData.createdAt}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6 px-2">Usage Metrics</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100">
                                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-wider mb-1">Messages</p>
                                <p className="text-xl font-black text-indigo-600 font-outfit">{mockUserData.stats.messagesUsed}</p>
                            </div>
                            <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100">
                                <p className="text-[10px] font-black text-emerald-400 uppercase tracking-wider mb-1">AI Replies</p>
                                <p className="text-xl font-black text-emerald-600 font-outfit">{mockUserData.stats.aiRepliesUsed}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Subscription & History */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Active Plan Card */}
                    <div className="bg-indigo-600 p-8 rounded-[32px] shadow-lg shadow-indigo-100 text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 -mr-16 -mt-16 bg-white opacity-5 rounded-full"></div>
                        <div className="absolute bottom-0 left-0 w-32 h-32 -ml-8 -mb-8 bg-white opacity-5 rounded-full"></div>

                        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div className="space-y-4">
                                <div>
                                    <p className="text-xs font-black text-indigo-200 uppercase tracking-[0.2em] mb-2">Current Active Subscription</p>
                                    <h2 className="text-4xl font-black font-outfit tracking-tight">{mockUserData.plan}</h2>
                                </div>
                                <div className="flex flex-wrap items-center gap-4">
                                    <div className="flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-xl border border-white/20">
                                        <Clock size={16} className="text-indigo-200" />
                                        <span className="text-xs font-bold">Expires: {mockUserData.planExpiry}</span>
                                    </div>
                                    <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-400/20 rounded-xl border border-emerald-400/30">
                                        <ShieldCheck size={16} className="text-emerald-300" />
                                        <span className="text-xs font-bold text-emerald-50">Status: Active</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-col gap-2 min-w-[200px]">
                                <button className="w-full py-3 bg-white text-indigo-600 rounded-2xl text-sm font-black shadow-xl hover:bg-slate-50 transition-all active:scale-[0.98]">
                                    Manually Extend Plan
                                </button>
                                <button className="w-full py-3 bg-indigo-500 text-white rounded-2xl text-sm font-bold border border-indigo-400 hover:bg-indigo-400 transition-all transition-all">
                                    Change Subscription Plan
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Subscription History */}
                    <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-slate-50 flex items-center justify-between">
                            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                                <History size={16} className="text-indigo-500" />
                                Payment History
                            </h3>
                            <button className="text-xs font-bold text-indigo-600 hover:underline">Download Invoices</button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/50">
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Plan</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Method</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {subscriptionHistory.map((sub) => (
                                        <tr key={sub.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <CreditCard size={14} className="text-slate-400" />
                                                    <span className="text-xs font-bold text-slate-700">{sub.plan}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-xs font-black text-slate-900">{sub.amount}</td>
                                            <td className="px-6 py-4 text-xs font-medium text-slate-500">{sub.date}</td>
                                            <td className="px-6 py-4 text-xs font-bold text-slate-600">{sub.method}</td>
                                            <td className="px-6 py-4 text-right">
                                                <span className="px-2 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-black rounded-lg uppercase">
                                                    {sub.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Dangerous Actions */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Role Management Card */}
                        <div className="p-6 rounded-[28px] border border-indigo-100 bg-indigo-50/20 shadow-sm flex items-center justify-between group md:col-span-2">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center transition-colors">
                                    <ShieldCheck size={22} />
                                </div>
                                <div>
                                    <p className="text-sm font-black text-slate-900">Role Management</p>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Current Role: <span className="text-indigo-600">{mockUserData.role}</span></p>
                                </div>
                            </div>
                            <button className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-black hover:bg-indigo-700 transition-all shadow-md active:scale-95">
                                {mockUserData.role === 'owner' ? 'Demote to User' : 'Promote to Owner'}
                            </button>
                        </div>

                        <div className="p-6 rounded-[28px] border border-slate-100 bg-white shadow-sm flex items-center justify-between group">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center transition-colors group-hover:bg-amber-100">
                                    <Power size={22} />
                                </div>
                                <div>
                                    <p className="text-sm font-black text-slate-900">Account Access</p>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Suspend user access</p>
                                </div>
                            </div>
                            <button className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-all">
                                Suspend
                            </button>
                        </div>
                        <div className="p-6 rounded-[28px] border border-rose-100 bg-rose-50/30 shadow-sm flex items-center justify-between group">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-500 flex items-center justify-center transition-colors group-hover:bg-rose-200">
                                    <Trash2 size={22} />
                                </div>
                                <div>
                                    <p className="text-sm font-black text-rose-900">Danger Zone</p>
                                    <p className="text-[10px] text-rose-400 font-bold uppercase tracking-tighter">Delete everything</p>
                                </div>
                            </div>
                            <button className="px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold hover:bg-rose-700 transition-all">
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
