"use client";
import React, { useState, useEffect } from "react";
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
import { doc, setDoc, serverTimestamp, collection, getDocs, onSnapshot, updateDoc, deleteDoc, query, orderBy, addDoc } from "firebase/firestore";
import { toast } from "@/components/Toast";

const INITIAL_PLANS = [
    {
        id: "personal",
        name: "Personal Assistant",
        price: "₹99",
        duration: "30 Days",
        limits: {
            maxMsgsPerDay: 200,
            aiReply: true,
            agents: 1,
            apiAccess: false,
            apiFreeCredits: 0,
            apiCostPerReq: 0
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
            apiAccess: false,
            apiFreeCredits: 0,
            apiCostPerReq: 0
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
            apiAccess: true,
            apiFreeCredits: 15,
            apiCostPerReq: 5
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
            apiAccess: true,
            apiFreeCredits: 9999,
            apiCostPerReq: 0
        },
        users: 12,
        active: true,
        color: "slate"
    }
];

export default function PlansManagement() {
    const [plans, setPlans] = useState<any[]>([]);
    const [isAddingPlan, setIsAddingPlan] = useState(false);
    const [assignTarget, setAssignTarget] = useState({ uid: '', planId: 'personal' });
    const [isAssigning, setIsAssigning] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [editingPlan, setEditingPlan] = useState<any>(null);

    // Form State
    const [formState, setFormState] = useState({
        name: "",
        price: "",
        duration: "30 Days",
        active: true,
        color: "indigo",
        limits: {
            maxMsgsPerDay: 500,
            aiReply: true,
            agents: 1,
            apiAccess: false,
            apiFreeCredits: 15,
            apiCostPerReq: 5
        }
    });

    useEffect(() => {
        const unsubscribe = onSnapshot(collection(db, "plans"), (snapshot) => {
            if (snapshot.empty) {
                // Seed initial plans if collection is empty
                INITIAL_PLANS.forEach(async (p) => {
                    await setDoc(doc(db, "plans", p.id), p);
                });
            } else {
                const plansData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
                setPlans(plansData);
            }
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const resetForm = () => {
        setFormState({
            name: "",
            price: "",
            duration: "30 Days",
            active: true,
            color: "indigo",
            limits: {
                maxMsgsPerDay: 500,
                aiReply: true,
                agents: 1,
                apiAccess: false,
                apiFreeCredits: 15,
                apiCostPerReq: 5
            }
        });
        setEditingPlan(null);
    };

    const handleAssignPlan = async () => {
        if (!assignTarget.uid) return toast("Error", "Enter User UID", "error");
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
            toast("Success", `Plan ${assignTarget.planId} assigned successfully! ✨`, "success");
            setAssignTarget({ uid: '', planId: 'personal' });
        } catch (err) {
            console.error(err);
            toast("Error", "Failed to assign plan", "error");
        }
        setIsAssigning(false);
    };

    const togglePlanStatus = async (id: string, currentStatus: boolean) => {
        try {
            await updateDoc(doc(db, "plans", id), { active: !currentStatus });
            toast("Updated", `Plan is now ${!currentStatus ? 'Active' : 'Inactive'}`, "info");
        } catch (err) {
            toast("Error", "Failed to update status", "error");
        }
    };

    const handleDeletePlan = async (id: string) => {
        if (!window.confirm("Are you sure you want to delete this plan?")) return;
        try {
            await deleteDoc(doc(db, "plans", id));
            toast("Deleted", "Plan removed successfully", "success");
        } catch (err) {
            toast("Error", "Failed to delete plan", "error");
        }
    };

    const handleEditClick = (plan: any) => {
        setEditingPlan(plan);
        setFormState({
            name: plan.name,
            price: plan.price,
            duration: plan.duration,
            active: plan.active,
            color: plan.color || "indigo",
            limits: {
                maxMsgsPerDay: plan.limits?.maxMsgsPerDay || 0,
                aiReply: plan.limits?.aiReply || false,
                agents: plan.limits?.agents || 0,
                apiAccess: plan.limits?.apiAccess || false,
                apiFreeCredits: plan.limits?.apiFreeCredits || 0,
                apiCostPerReq: plan.limits?.apiCostPerReq || 0
            }
        });
        setIsAddingPlan(true);
    };

    const handleSavePlan = async () => {
        if (!formState.name || !formState.price) return toast("Missing Info", "Please fill name and price", "warning");

        try {
            if (editingPlan) {
                await updateDoc(doc(db, "plans", editingPlan.id), formState);
                toast("Saved", "Plan updated successfully! ✨", "success");
            } else {
                const planId = formState.name.toLowerCase().replace(/\s+/g, '-');
                await setDoc(doc(db, "plans", planId), {
                    ...formState,
                    users: 0,
                    id: planId
                });
                toast("Created", "New plan deployed successfully! 🚀", "success");
            }
            setIsAddingPlan(false);
            resetForm();
        } catch (err) {
            console.error(err);
            toast("Error", "Failed to save plan", "error");
        }
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
                    onClick={() => { resetForm(); setIsAddingPlan(true); }}
                    className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 flex items-center gap-2 active:scale-95"
                >
                    <Plus size={18} />
                    Create New Plan
                </button>
            </div>

            {/* Plan Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {isLoading ? (
                    <div className="col-span-full py-20 text-center text-slate-400 font-bold">Loading plans...</div>
                ) : (
                    plans.map((plan, idx) => (
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
                                        plan.color === 'indigo' ? 'bg-indigo-50 text-indigo-600' :
                                            plan.color === 'blue' ? 'bg-blue-50 text-blue-600' : 'bg-slate-50 text-slate-500'
                                        }`}>
                                        <Package size={24} />
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => handleEditClick(plan)}
                                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded-lg transition-all"
                                        >
                                            <Edit3 size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleDeletePlan(plan.id)}
                                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                                        >
                                            <Trash2 size={18} />
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
                                    <span className="text-sm font-black text-slate-900 leading-none">{plan.users || 0}</span>
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                                        <MessageCircle size={14} className="text-indigo-400" />
                                        <span>Msgs / Day</span>
                                    </div>
                                    <span className="text-xs font-black text-slate-800 tracking-tight">{plan.limits?.maxMsgsPerDay}</span>
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                                        <Bot size={14} className="text-indigo-400" />
                                        <span>AI Reply Agent</span>
                                    </div>
                                    {plan.limits?.aiReply ? <Check size={16} className="text-emerald-500" /> : <X size={16} className="text-rose-400" />}
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                                        <Shield size={14} className="text-indigo-400" />
                                        <span>API Access</span>
                                    </div>
                                    {plan.limits?.apiAccess ? <Check size={16} className="text-emerald-500" /> : <X size={16} className="text-rose-400" />}
                                </div>

                                {plan.limits?.apiAccess && (
                                    <div className="p-3 bg-indigo-50/30 rounded-2xl border border-indigo-50 space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-black text-indigo-400 uppercase">Free API Quota</span>
                                            <span className="text-[10px] font-black text-indigo-600">{plan.limits?.apiFreeCredits} Units</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-black text-indigo-400 uppercase">Cost Per Req</span>
                                            <span className="text-[10px] font-black text-indigo-600">₹{plan.limits?.apiCostPerReq}</span>
                                        </div>
                                    </div>
                                )}

                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                                        <Zap size={14} className="text-indigo-400" />
                                        <span>Max Agents</span>
                                    </div>
                                    <span className="text-xs font-black text-slate-800 tracking-tight">{plan.limits?.agents}</span>
                                </div>
                            </div>

                            <div className="p-6 bg-slate-50/50 border-t border-slate-50">
                                <div className="flex items-center justify-between mb-4">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Status: <span className={plan.active ? 'text-emerald-600' : 'text-rose-500'}>{plan.active ? 'Active' : 'Inactive'}</span></p>
                                    <button
                                        onClick={() => togglePlanStatus(plan.id, plan.active)}
                                        className={`w-10 h-5 rounded-full relative transition-all ${plan.active ? 'bg-emerald-500' : 'bg-slate-300'}`}
                                    >
                                        <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${plan.active ? 'right-1' : 'left-1'}`}></div>
                                    </button>
                                </div>
                                <button className="w-full py-3 bg-white border border-slate-200 text-slate-700 rounded-2xl text-xs font-black hover:bg-slate-100 hover:border-slate-300 transition-all flex items-center justify-center gap-2">
                                    View Enrolled Users
                                    <ArrowUpRight size={14} />
                                </button>
                            </div>
                        </motion.div>
                    ))
                )}

                {/* Create New Card Placeholder */}
                <motion.button
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    onClick={() => { resetForm(); setIsAddingPlan(true); }}
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
                                {plans.map(p => (
                                    <th key={p.id} className={`px-8 py-5 text-[10px] font-black uppercase tracking-widest border-b border-slate-100 ${p.id === 'pro' ? 'text-emerald-600 bg-emerald-50/50' : 'text-slate-400'}`}>
                                        {p.name}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {[
                                { feat: "WA Sessions", key: "agents" },
                                { feat: "Messages / Day", key: "maxMsgsPerDay" },
                                { feat: "AI Engine", key: "aiReply" },
                                { feat: "Bulk Messaging", key: "aiReply" },
                                { feat: "API Access", key: "apiAccess" },
                                { feat: "Free API Cr.", key: "apiFreeCredits" },
                                { feat: "API Cost/Req", key: "apiCostPerReq", prefix: "₹" },
                            ].map((row, i) => (
                                <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-8 py-4 text-sm font-bold text-slate-700">{row.feat}</td>
                                    {plans.map(p => {
                                        const val = p.limits[row.key];
                                        return (
                                            <td key={p.id} className={`px-8 py-4 text-xs font-black ${p.id === 'pro' ? 'text-emerald-600 bg-emerald-50/20' : 'text-slate-500'}`}>
                                                {typeof val === 'boolean' ? (val ? <Check className="text-emerald-500" size={16} /> : <X className="text-rose-400" size={16} />) : (row.prefix ? row.prefix + val : val)}
                                            </td>
                                        );
                                    })}
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
                                <h2 className="text-2xl font-black text-slate-900 font-outfit tracking-tight">
                                    {editingPlan ? "Edit Subscription Plan" : "Create Subscription Plan"}
                                </h2>
                                <p className="text-sm text-slate-500 font-medium">Define price, duration and feature constraints.</p>
                            </div>
                            <button
                                onClick={() => { setIsAddingPlan(false); resetForm(); }}
                                className="p-2 hover:bg-white rounded-xl text-slate-400 hover:text-slate-600 transition-all shadow-none hover:shadow-sm"
                            >
                                <X size={24} />
                            </button>
                        </div>
                        <div className="p-8 gap-6 grid grid-cols-1 md:grid-cols-2 max-h-[60vh] overflow-y-auto">
                            <div className="space-y-4 md:col-span-2">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Plan Identity</label>
                                <input
                                    type="text"
                                    placeholder="Plan Name (e.g. Enterprise)"
                                    value={formState.name}
                                    onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold"
                                />
                            </div>
                            <div className="space-y-4">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Price (e.g. ₹999)</label>
                                <input
                                    type="text"
                                    placeholder="₹999"
                                    value={formState.price}
                                    onChange={(e) => setFormState({ ...formState, price: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold"
                                />
                            </div>
                            <div className="space-y-4">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Duration</label>
                                <select
                                    value={formState.duration}
                                    onChange={(e) => setFormState({ ...formState, duration: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold appearance-none"
                                >
                                    <option>7 Days</option>
                                    <option>30 Days</option>
                                    <option>90 Days</option>
                                    <option>1 Year</option>
                                    <option>TBD</option>
                                </select>
                            </div>

                            <div className="space-y-4">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Msgs / Day</label>
                                <input
                                    type="text"
                                    value={formState.limits.maxMsgsPerDay}
                                    onChange={(e) => setFormState({ ...formState, limits: { ...formState.limits, maxMsgsPerDay: e.target.value as any } })}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold"
                                />
                            </div>

                            <div className="space-y-4">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Max Agents</label>
                                <input
                                    type="text"
                                    value={formState.limits.agents}
                                    onChange={(e) => setFormState({ ...formState, limits: { ...formState.limits, agents: e.target.value as any } })}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold"
                                />
                            </div>

                            <AnimatePresence>
                                {formState.limits.apiAccess && (
                                    <>
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="space-y-4"
                                        >
                                            <label className="text-xs font-black text-indigo-400 uppercase tracking-widest">Free API Credits</label>
                                            <input
                                                type="number"
                                                value={formState.limits.apiFreeCredits}
                                                onChange={(e) => setFormState({ ...formState, limits: { ...formState.limits, apiFreeCredits: parseInt(e.target.value) || 0 } })}
                                                className="w-full px-4 py-3 bg-indigo-50/50 border border-indigo-100 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold"
                                            />
                                        </motion.div>
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="space-y-4"
                                        >
                                            <label className="text-xs font-black text-indigo-400 uppercase tracking-widest">Cost Per API Req (₹)</label>
                                            <input
                                                type="number"
                                                value={formState.limits.apiCostPerReq}
                                                onChange={(e) => setFormState({ ...formState, limits: { ...formState.limits, apiCostPerReq: parseInt(e.target.value) || 0 } })}
                                                className="w-full px-4 py-3 bg-indigo-50/50 border border-indigo-100 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold"
                                            />
                                        </motion.div>
                                    </>
                                )}
                            </AnimatePresence>

                            <div className="md:col-span-2 space-y-4">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Feature Bundle</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <label className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-2xl cursor-pointer hover:bg-slate-100 transition-all">
                                        <input
                                            type="checkbox"
                                            checked={formState.limits.aiReply}
                                            onChange={(e) => setFormState({ ...formState, limits: { ...formState.limits, aiReply: e.target.checked } })}
                                            className="w-5 h-5 rounded-lg text-indigo-600 focus:ring-indigo-500 border-slate-300"
                                        />
                                        <span className="text-xs font-bold text-slate-700">AI Reply Engine</span>
                                    </label>
                                    <label className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-2xl cursor-pointer hover:bg-slate-100 transition-all">
                                        <input
                                            type="checkbox"
                                            checked={formState.limits.apiAccess}
                                            onChange={(e) => setFormState({ ...formState, limits: { ...formState.limits, apiAccess: e.target.checked } })}
                                            className="w-5 h-5 rounded-lg text-indigo-600 focus:ring-indigo-500 border-slate-300"
                                        />
                                        <span className="text-xs font-bold text-slate-700">API Access</span>
                                    </label>
                                    <label className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-2xl cursor-pointer hover:bg-slate-100 transition-all">
                                        <input
                                            type="checkbox"
                                            checked={formState.active}
                                            onChange={(e) => setFormState({ ...formState, active: e.target.checked })}
                                            className="w-5 h-5 rounded-lg text-emerald-600 focus:ring-emerald-500 border-slate-300"
                                        />
                                        <span className="text-xs font-bold text-slate-700">Set as Active</span>
                                    </label>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Color:</span>
                                        {['indigo', 'blue', 'emerald', 'slate'].map(c => (
                                            <button
                                                key={c}
                                                onClick={() => setFormState({ ...formState, color: c })}
                                                className={`w-6 h-6 rounded-full border-2 ${formState.color === c ? 'border-slate-900' : 'border-transparent'} ${c === 'indigo' ? 'bg-indigo-500' : c === 'blue' ? 'bg-blue-500' : c === 'emerald' ? 'bg-emerald-500' : 'bg-slate-500'}`}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="p-8 bg-slate-50 flex items-center justify-end gap-3">
                            <button
                                onClick={() => { setIsAddingPlan(false); resetForm(); }}
                                className="px-6 py-3 font-bold text-slate-500 hover:text-slate-700 text-sm transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSavePlan}
                                className="px-8 py-3 bg-indigo-600 text-white rounded-2xl text-sm font-black shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-[0.98]"
                            >
                                {editingPlan ? "Update Plan" : "Deploy New Plan"}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
