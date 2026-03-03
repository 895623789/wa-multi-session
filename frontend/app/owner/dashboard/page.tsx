"use client";
import React from "react";
import {
    Users,
    CreditCard,
    IndianRupee,
    UserMinus,
    TrendingUp,
    ArrowUpRight,
    ArrowDownRight,
    Search,
    Filter,
    MoreVertical,
    Calendar,
    AlertCircle,
    UserPlus,
    Clock
} from "lucide-react";
import { motion } from "framer-motion";

const stats = [
    { name: "Total Users", value: "2,543", icon: Users, change: "+12.5%", trend: "up", color: "blue" },
    { name: "Active Subscriptions", value: "1,205", icon: CreditCard, change: "+4.2%", trend: "up", color: "indigo" },
    { name: "Monthly Revenue", value: "₹4,25,000", icon: IndianRupee, change: "+18.7%", trend: "up", color: "emerald" },
    { name: "Churned Users", value: "24", icon: UserMinus, change: "-2.4%", trend: "down", color: "rose" },
];

const recentSignups = [
    { id: 1, name: "Rahul Sharma", email: "rahul@example.com", plan: "Pro Plan", date: "2 mins ago", status: "Active" },
    { id: 2, name: "Amit Patel", email: "amit.p@gmail.com", plan: "Basic Plan", date: "15 mins ago", status: "Active" },
    { id: 3, name: "Priya Das", email: "priya@das-solutions.in", plan: "Pro Plan", date: "1 hour ago", status: "Trial" },
    { id: 4, name: "Vikram Singh", email: "vikram@singh.com", plan: "Free Plan", date: "3 hours ago", status: "Active" },
    { id: 5, name: "Sneha Reddy", email: "sneha.r@outlook.com", plan: "Basic Plan", date: "5 hours ago", status: "Active" },
];

const expiringSoon = [
    { id: 1, user: "Karan Johar", plan: "Pro Plan", expiry: "2 days", amount: "₹1,999" },
    { id: 2, user: "Sara Ali", plan: "Basic Plan", expiry: "4 days", amount: "₹999" },
    { id: 3, user: "Deepak Rawat", plan: "Pro Plan", expiry: "6 days", amount: "₹1,999" },
];

export default function OwnerDashboard() {
    return (
        <div className="space-y-8">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight font-outfit">SaaS Overview</h1>
                    <p className="text-sm text-slate-500 font-medium">Welcome back, Owner. Here's what's happening today.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all shadow-sm flex items-center gap-2">
                        <Calendar size={16} />
                        Last 30 Days
                    </button>
                    <button className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 flex items-center gap-2 active:scale-95">
                        <TrendingUp size={16} />
                        View Reports
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, idx) => (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        key={stat.name}
                        className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group"
                    >
                        <div className={`absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 rounded-full bg-opacity-5 rotate-12 transition-transform group-hover:scale-110 group-hover:rotate-45 ${stat.color === 'blue' ? 'bg-blue-600' :
                                stat.color === 'indigo' ? 'bg-indigo-600' :
                                    stat.color === 'emerald' ? 'bg-emerald-600' : 'bg-rose-600'
                            }`}></div>

                        <div className="flex items-center justify-between mb-4">
                            <div className={`p-3 rounded-2xl ${stat.color === 'blue' ? 'bg-blue-50 text-blue-600' :
                                    stat.color === 'indigo' ? 'bg-indigo-50 text-indigo-600' :
                                        stat.color === 'emerald' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                                }`}>
                                <stat.icon size={22} />
                            </div>
                            <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${stat.trend === 'up' ? 'text-emerald-600 bg-emerald-50' : 'text-rose-600 bg-rose-50'
                                }`}>
                                {stat.trend === 'up' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                                {stat.change}
                            </div>
                        </div>
                        <div>
                            <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">{stat.name}</p>
                            <h3 className="text-3xl font-black text-slate-900 font-outfit">{stat.value}</h3>
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Revenue Chart Placeholder */}
                <div className="lg:col-span-2 bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-xl font-bold text-slate-900 font-outfit">Revenue Growth</h2>
                            <p className="text-sm text-slate-500 font-medium tracking-tight">Financial performance over time</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-100 text-xs font-bold text-slate-500">
                                <div className="w-2 h-2 rounded-full bg-indigo-600"></div>
                                Revenue
                            </div>
                        </div>
                    </div>

                    <div className="h-64 flex items-end gap-2 px-2">
                        {/* Mock Bar Chart */}
                        {[40, 65, 45, 80, 55, 90, 75, 60, 85, 50, 70, 95].map((val, i) => (
                            <div key={i} className="flex-1 flex flex-col items-center gap-2 group cursor-pointer">
                                <div className="w-full relative bg-slate-50 rounded-lg overflow-hidden h-full flex items-end">
                                    <motion.div
                                        initial={{ height: 0 }}
                                        animate={{ height: `${val}%` }}
                                        transition={{ delay: 0.5 + i * 0.05, type: "spring", stiffness: 100 }}
                                        className="w-full bg-indigo-500 group-hover:bg-indigo-600 transition-colors"
                                    ></motion.div>
                                    <div className="absolute top-0 left-0 w-full h-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                                        <div className="px-2 py-1 bg-slate-900 text-white text-[10px] font-bold rounded shadow-xl -mt-8">
                                            ₹{(val * 5000).toLocaleString()}
                                        </div>
                                    </div>
                                </div>
                                <span className="text-[10px] font-bold text-slate-400">M{i + 1}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Expiring Soon Section */}
                <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm flex flex-col">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-slate-900 font-outfit">Expiring Soon</h2>
                        <span className="px-2 py-1 bg-amber-50 text-amber-600 text-[10px] font-black rounded-lg uppercase">7 Days</span>
                    </div>

                    <div className="space-y-4 flex-1">
                        {expiringSoon.map((item) => (
                            <div key={item.id} className="p-4 rounded-2xl bg-slate-50/50 border border-slate-100 hover:border-indigo-200 transition-all group">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 group-hover:text-indigo-500 group-hover:border-indigo-100 transition-colors shadow-sm">
                                            <AlertCircle size={20} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-800">{item.user}</p>
                                            <p className="text-xs text-slate-500 font-medium">{item.plan}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs font-black text-rose-500 underline underline-offset-4 decoration-rose-200">In {item.expiry}</p>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase">{item.amount}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <button className="mt-6 w-full py-3 bg-slate-900 text-white rounded-2xl text-sm font-bold hover:bg-slate-800 transition-all active:scale-[0.98] shadow-lg shadow-slate-200">
                        View Renewals List
                    </button>
                </div>
            </div>

            {/* Recent Signups Table */}
            <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900 font-outfit">Recent Signups</h2>
                        <p className="text-sm text-slate-500 font-medium tracking-tight">Monitor new customer acquisition</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                            <input
                                type="text"
                                placeholder="Search users..."
                                className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 w-48"
                            />
                        </div>
                        <button className="p-2 bg-slate-50 text-slate-500 rounded-xl border border-slate-100 hover:bg-slate-100 transition-all">
                            <Filter size={16} />
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50">
                                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">User</th>
                                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Subscription</th>
                                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Joined At</th>
                                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {recentSignups.map((user) => (
                                <tr key={user.id} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-sm">
                                                {user.name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-900">{user.name}</p>
                                                <p className="text-xs text-slate-400 font-medium">{user.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase ${user.status === 'Active' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                                            }`}>
                                            {user.status}
                                        </span>
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                                            <CreditCard size={14} className="text-slate-400" />
                                            {user.plan}
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                                            <Clock size={14} className="text-slate-300" />
                                            {user.date}
                                        </div>
                                    </td>
                                    <td className="px-8 py-5 text-right">
                                        <button className="p-2 text-slate-300 hover:text-indigo-600 hover:bg-white rounded-lg transition-all">
                                            <MoreVertical size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="p-6 bg-slate-50/50 flex justify-center">
                    <button className="text-xs font-black text-indigo-600 hover:text-indigo-700 uppercase tracking-widest flex items-center gap-1 active:scale-95 transition-all">
                        View All Registered Users
                        <ArrowUpRight size={14} />
                    </button>
                </div>
            </div>
        </div>
    );
}
