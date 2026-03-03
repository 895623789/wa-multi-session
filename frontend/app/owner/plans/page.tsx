"use client";
import React, { useState } from "react";
import {
    Package,
    Plus,
    Edit3,
    Trash2,
    CheckCircle2,
    XCircle,
    Users,
    MessageCircle,
    Bot,
    Zap,
    Shield,
    Smartphone,
    ArrowRight,
    ArrowUpRight,
    MoreVertical,
    Check,
    X,
    Clock,
    Info,
    LayoutDashboard
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { db } from "@/lib/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

const plans = [
    {
        id: "personal",
        name: "Personal Assistant",
        price: "₹99",
        duration: "30 Days",
        limits: {
            maxMsgsPerDay: 200,
            aiReply: true,
            agents: 1,
            apiAccess: false
        },
        users: 142,
        active: true,
        color: "indigo"
    },
    {
        id: "starter",
        name: "Business Starter",
        price: "₹499",
        duration: "30 Days",
        limits: {
            maxMsgsPerDay: 1000,
            aiReply: true,
            agents: 2,
            apiAccess: false
        },
        users: 285,
        active: true,
        color: "blue"
    },
    {
        id: "pro",
        name: "Pro Scale (API)",
        price: "₹1,999",
        duration: "30 Days",
        limits: {
            maxMsgsPerDay: 50000,
            aiReply: true,
            agents: 10,
            apiAccess: true
        },
        users: 94,
        active: true,
        color: "emerald"
    },
    {
        id: "custom",
        name: "Custom Enterprise",
        price: "Custom",
        duration: "TBD",
        limits: {
            maxMsgsPerDay: "Unlimited",
            aiReply: true,
            agents: "Custom",
            apiAccess: true
        },
        users: 12,
        active: true,
        color: "slate"
    }
];

export default function PlansManagement() {
    const [isAddingPlan, setIsAddingPlan] = useState(false);
    const [assignTarget, setAssignTarget] = useState({ uid: '', planId: 'personal' });
    const [isAssigning, setIsAssigning] = useState(false);

    const handleAssignPlan = async () => {
        if (!assignTarget.uid) return alert("Enter User ID");
        setIsAssigning(true);
        try {
            const expiryDate = new Date();
            expiryDate.setDate(expiryDate.getDate() + 30);

            await setDoc(doc(db, 'users', assignTarget.uid), {
                subscription: {
                    plan: assignTarget.planId,
                    status: 'active',
                    expiresAt: expiryDate,
                    startedAt: serverTimestamp(),
                }
            }, { merge: true });
            alert(`Plan ${assignTarget.planId} assigned to ${assignTarget.uid} successfully! ✨`);
            setAssignTarget({ uid: '', planId: 'personal' });
        } catch (err) {
            console.error(err);
            alert("Error assigning plan");
        }
        setIsAssigning(false);
    };

    return (
        <div className="space-y-8">
            <div className="bg-gradient-to-r from-indigo-600 to-violet-700 rounded-[32px] p-8 text-white shadow-xl shadow-indigo-200">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="space-y-2">
                        <h2 className="text-2xl font-black font-outfit">Quick Plan Assistant ⚡</h2>
                        <p className="text-indigo-100 text-sm font-medium">Instantly activate a plan for any user via their UID.</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                        <input
                            type="text"
                            placeholder="Enter User UID"
                            value={assignTarget.uid}
                            onChange={(e) => setAssignTarget({ ...assignTarget, uid: e.target.value })}
                            className="bg-white/10 border border-white/20 rounded-2xl px-4 py-3 text-sm font-bold placeholder:text-white/40 focus:outline-none focus:bg-white/20 transition-all flex-1 min-w-[200px]"
                        />
                        <select
                            value={assignTarget.planId}
                            onChange={(e) => setAssignTarget({ ...assignTarget, planId: e.target.value })}
                            className="bg-white/10 border border-white/20 rounded-2xl px-4 py-3 text-sm font-bold focus:outline-none focus:bg-white/20 transition-all appearance-none pr-10 relative"
                        >
                            {plans.map(p => <option key={p.id} value={p.id} className="text-slate-900">{p.name}</option>)}
                        </select>
                        <button
                            onClick={handleAssignPlan}
                            disabled={isAssigning}
                            className="bg-white text-indigo-600 px-6 py-3 rounded-2xl font-black text-sm hover:bg-indigo-50 transition-all active:scale-95 disabled:opacity-50"
                        >
                            {isAssigning ? 'Activating...' : 'Activate Plan'}
                        </button>
                    </div>
                </div>
            </div>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight font-outfit text-indigo-900">Manage Pricing Plans</h1>
                    <p className="text-sm text-slate-500 font-medium">Configure features, limits and pricing for all user segments.</p>
                </div>
                <button
                    onClick={() => setIsAddingPlan(true)}
                    className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 flex items-center gap-2 active:scale-95"
                >
                    <Plus size={18} />
                    Create New Plan
                </button>
            </div>

            {/* Plan Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {plans.map((plan, idx) => (
                    <motion.div
                        key={plan.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className={`bg-white rounded-[32px] border shadow-sm overflow-hidden flex flex-col group ${plan.id === 'pro' ? 'border-emerald-200 ring-4 ring-emerald-500/5' : 'border-slate-100'
                            }`}
                    >
                        <div className="p-6 border-b border-slate-50 relative overflow-hidden">
                            {plan.id === 'pro' && (
                                <div className="absolute -right-12 top-6 bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest py-1 px-12 rotate-45 shadow-sm active:scale-95">
                                    Best Seller
                                </div>
                            )}
                            <div className="flex items-center justify-between mb-4">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${plan.color === 'emerald' ? 'bg-emerald-50 text-emerald-600' :
                                    plan.color === 'indigo' ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-50 text-slate-500'
                                    }`}>
                                    <Package size={24} />
                                </div>
                                <div className="flex items-center gap-1">
                                    <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded-lg transition-all">
                                        <Edit3 size={18} />
                                    </button>
                                    <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-all">
                                        <MoreVertical size={18} />
                                    </button>
                                </div>
                            </div>
                            <h3 className="text-xl font-black text-slate-900 font-outfit leading-none mb-1">{plan.name}</h3>
                            <div className="flex items-baseline gap-1">
                                <span className="text-2xl font-black text-indigo-600 font-outfit">{plan.price}</span>
                                <span className="text-xs font-bold text-slate-400">/ {plan.duration}</span>
                            </div>
                        </div>

                        <div className="p-6 space-y-4 flex-1">
                            <div className="flex items-center justify-between p-3 bg-slate-50/50 rounded-2xl border border-slate-100">
                                <div className="flex items-center gap-2">
                                    <Users size={16} className="text-slate-400" />
                                    <span className="text-xs font-bold text-slate-600">Active Users</span>
                                </div>
                                <span className="text-sm font-black text-slate-900 leading-none">{plan.users}</span>
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                                    <MessageCircle size={14} className="text-indigo-400" />
                                    <span>Msgs / Day</span>
                                </div>
                                <span className="text-xs font-black text-slate-800 tracking-tight">{plan.limits.maxMsgsPerDay}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                                    <Bot size={14} className="text-indigo-400" />
                                    <span>AI Reply Agent</span>
                                </div>
                                {plan.limits.aiReply ? <Check size={16} className="text-emerald-500" /> : <X size={16} className="text-rose-400" />}
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                                    <Shield size={14} className="text-indigo-400" />
                                    <span>API Access</span>
                                </div>
                                {plan.limits.apiAccess ? <Check size={16} className="text-emerald-500" /> : <X size={16} className="text-rose-400" />}
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                                    <Zap size={14} className="text-indigo-400" />
                                    <span>Max Agents</span>
                                </div>
                                <span className="text-xs font-black text-slate-800 tracking-tight">{plan.limits.agents}</span>
                            </div>
                        </div>

                        <div className="p-6 bg-slate-50/50 border-t border-slate-50">
                            <div className="flex items-center justify-between mb-4">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Status: <span className={plan.active ? 'text-emerald-600' : 'text-rose-500'}>{plan.active ? 'Active' : 'Inactive'}</span></p>
                                <button className={`w-10 h-5 rounded-full relative transition-all ${plan.active ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                                    <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${plan.active ? 'right-1' : 'left-1'}`}></div>
                                </button>
                            </div>
                            <button className="w-full py-3 bg-white border border-slate-200 text-slate-700 rounded-2xl text-xs font-black hover:bg-slate-100 hover:border-slate-300 transition-all flex items-center justify-center gap-2">
                                View Enrolled Users
                                <ArrowUpRight size={14} />
                            </button>
                        </div>
                    </motion.div>
                ))}

                {/* Create New Card Placeholder */}
                <motion.button
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    onClick={() => setIsAddingPlan(true)}
                    className="rounded-[32px] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-4 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 hover:border-indigo-200 transition-all min-h-[400px]"
                >
                    <div className="w-16 h-16 rounded-3xl bg-slate-50 flex items-center justify-center transition-colors group-hover:bg-indigo-50">
                        <Plus size={32} />
                    </div>
                    <div className="text-center">
                        <p className="text-lg font-black font-outfit">Create New Plan</p>
                        <p className="text-xs font-bold uppercase tracking-wider">Define new limits & pricing</p>
                    </div>
                </motion.button>
            </div>

            {/* Comparison Table */}
            <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-8 border-b border-slate-50">
                    <h2 className="text-xl font-bold text-slate-900 font-outfit">Feature Comparison Matrix</h2>
                    <p className="text-sm text-slate-500 font-medium tracking-tight">Cross-analyze plan capabilities across tiers.</p>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50">
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Capability</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Personal</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Starter</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 bg-emerald-50/50 text-emerald-600">Pro Scale</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Custom</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {[
                                { feat: "WA Sessions", pers: "1", start: "2", pro: "10", cust: "Custom" },
                                { feat: "Messages / Day", pers: "200", start: "1,000", pro: "50,000", cust: "Unlimited" },
                                { feat: "AI Engine", pers: true, start: true, pro: true, cust: true },
                                { feat: "Bulk Messaging", pers: true, start: true, pro: true, cust: true },
                                { feat: "API Access", pers: false, start: false, pro: true, cust: true },
                                { feat: "Priority Support", pers: false, start: false, pro: true, cust: true },
                            ].map((row, i) => (
                                <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-8 py-4 text-sm font-bold text-slate-700">{row.feat}</td>
                                    <td className="px-8 py-4 text-xs font-black text-slate-500">{typeof row.pers === 'boolean' ? (row.pers ? <Check className="text-emerald-500" size={16} /> : <X className="text-rose-400" size={16} />) : row.pers}</td>
                                    <td className="px-8 py-4 text-xs font-black text-slate-500">{typeof row.start === 'boolean' ? (row.start ? <Check className="text-emerald-500" size={16} /> : <X className="text-rose-400" size={16} />) : row.start}</td>
                                    <td className="px-8 py-4 text-xs font-black text-emerald-600 bg-emerald-50/20">{typeof row.pro === 'boolean' ? (row.pro ? <Check className="text-emerald-600" size={16} /> : <X className="text-rose-400" size={16} />) : row.pro}</td>
                                    <td className="px-8 py-4 text-xs font-black text-slate-500">{typeof row.cust === 'boolean' ? (row.cust ? <Check className="text-emerald-500" size={16} /> : <X className="text-rose-400" size={16} />) : row.cust}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal Overlay Placeholder */}
            {isAddingPlan && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        className="bg-white rounded-[32px] w-full max-w-2xl shadow-2xl overflow-hidden border border-slate-100"
                    >
                        <div className="p-8 border-b border-slate-50 bg-slate-50/50 flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-black text-slate-900 font-outfit tracking-tight">Create Subscription Plan</h2>
                                <p className="text-sm text-slate-500 font-medium">Define price, duration and feature constraints.</p>
                            </div>
                            <button
                                onClick={() => setIsAddingPlan(false)}
                                className="p-2 hover:bg-white rounded-xl text-slate-400 hover:text-slate-600 transition-all shadow-none hover:shadow-sm"
                            >
                                <X size={24} />
                            </button>
                        </div>
                        <div className="p-8 gap-6 grid grid-cols-1 md:grid-cols-2">
                            <div className="space-y-4 md:col-span-2">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Plan Identity</label>
                                <input type="text" placeholder="Plan Name (e.g. Enterprise)" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold" />
                            </div>
                            <div className="space-y-4">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Price (₹)</label>
                                <input type="number" placeholder="999" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold" />
                            </div>
                            <div className="space-y-4">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Duration (Days)</label>
                                <select className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold appearance-none">
                                    <option>30 Days</option>
                                    <option>90 Days</option>
                                    <option>1 Year</option>
                                    <option>Custom</option>
                                </select>
                            </div>
                            <div className="md:col-span-2 space-y-4">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Feature Bundle</label>
                                <div className="grid grid-cols-2 gap-3">
                                    {["AI Reply Engine", "Campaign Support", "Anti-Ban Protection", "Excel Exports"].map(f => (
                                        <label key={f} className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-2xl cursor-pointer hover:bg-slate-100 transition-all">
                                            <input type="checkbox" className="w-5 h-5 rounded-lg text-indigo-600 focus:ring-indigo-500 border-slate-300" />
                                            <span className="text-xs font-bold text-slate-700">{f}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="p-8 bg-slate-50 flex items-center justify-end gap-3">
                            <button
                                onClick={() => setIsAddingPlan(false)}
                                className="px-6 py-3 font-bold text-slate-500 hover:text-slate-700 text-sm transition-all"
                            >
                                Cancel
                            </button>
                            <button className="px-8 py-3 bg-indigo-600 text-white rounded-2xl text-sm font-black shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-[0.98]">
                                Deploy New Plan
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
