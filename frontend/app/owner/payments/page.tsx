"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Plus, TrendingUp, CreditCard, DollarSign, Search, Filter, Calendar,
    CheckCircle2, Clock, XCircle, Download, ChevronLeft, ChevronRight, X, User
} from "lucide-react";
import {
    collection,
    onSnapshot,
    query,
    orderBy,
    addDoc,
    serverTimestamp,
    where,
    Timestamp
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "@/components/Toast";

export default function PaymentsPage() {
    const [isAddingPayment, setIsAddingPayment] = useState(false);
    const [payments, setPayments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [users, setUsers] = useState<any[]>([]);
    const [userSearchTerm, setUserSearchTerm] = useState("");
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [manualAmount, setManualAmount] = useState("");
    const [manualMethod, setManualMethod] = useState("Bank Transfer");
    const [manualNote, setManualNote] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    // Real-time Firestore listener for payments
    useEffect(() => {
        const q = query(collection(db, "payments"), orderBy("timestamp", "desc"));
        const unsub = onSnapshot(q, (snapshot) => {
            const list = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setPayments(list);
            setLoading(false);
        });
        return () => unsub();
    }, []);

    // User search logic for modal
    useEffect(() => {
        if (userSearchTerm.length < 2) {
            setUsers([]);
            return;
        }
        const unsub = onSnapshot(collection(db, "users"), (snapshot) => {
            const list = snapshot.docs.map(d => ({ uid: d.id, ...d.data() }));
            const filtered = list.filter((u: any) =>
                u.displayName?.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
                u.email?.toLowerCase().includes(userSearchTerm.toLowerCase())
            );
            setUsers(filtered);
        });
        return () => unsub();
    }, [userSearchTerm]);

    const handleRecordManualPayment = async () => {
        if (!selectedUser || !manualAmount) {
            toast("Error", "Please select a user and enter amount.", "error");
            return;
        }
        setIsSaving(true);
        try {
            await addDoc(collection(db, "payments"), {
                amount: Number(manualAmount),
                user: selectedUser.displayName || "Unknown",
                email: selectedUser.email || "",
                plan: selectedUser.plan || "N/A",
                method: manualMethod,
                status: "Paid",
                timestamp: serverTimestamp(),
                internalNote: manualNote,
                uid: selectedUser.uid
            });
            toast("Success", "Manual payment recorded successfully.", "success");
            setIsAddingPayment(false);
            setManualAmount("");
            setManualNote("");
            setSelectedUser(null);
            setUserSearchTerm("");
        } catch (err) {
            console.error(err);
            toast("Error", "Failed to record payment.", "error");
        }
        setIsSaving(false);
    };

    // Calculations for Summary Stats
    const now = new Date();
    const todayStart = new Date(now.setHours(0, 0, 0, 0));
    const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const getStats = () => {
        const todayPayments = payments.filter(p => p.timestamp?.toDate() >= todayStart);
        const weekPayments = payments.filter(p => p.timestamp?.toDate() >= weekStart);
        const monthPayments = payments.filter(p => p.timestamp?.toDate() >= monthStart);

        const totalRevenue = payments.reduce((acc, p) => acc + (p.amount || 0), 0);
        const todayRev = todayPayments.reduce((acc, p) => acc + (p.amount || 0), 0);
        const weekRev = weekPayments.reduce((acc, p) => acc + (p.amount || 0), 0);
        const monthRev = monthPayments.reduce((acc, p) => acc + (p.amount || 0), 0);

        return [
            { name: "Today", value: `₹${todayRev.toLocaleString()}`, count: `${todayPayments.length} payments`, color: "blue" },
            { name: "This Week", value: `₹${weekRev.toLocaleString()}`, count: `${weekPayments.length} payments`, color: "indigo" },
            { name: "This Month", value: `₹${monthRev.toLocaleString()}`, count: `${monthPayments.length} payments`, color: "emerald" },
            { name: "Total Revenue", value: `₹${totalRevenue.toLocaleString()}`, count: `${payments.length} payments`, color: "violet" },
        ];
    };

    const summaryStats = getStats();

    // Distribution
    const razorpayVol = payments.filter(p => p.method === "Razorpay").reduce((acc, p) => acc + (p.amount || 0), 0);
    const upiVol = payments.filter(p => p.method === "UPI" || p.method === "UPI / Direct" || p.method === "UPI / GPay").reduce((acc, p) => acc + (p.amount || 0), 0);
    const manualVol = payments.filter(p => p.method === "Manual" || p.method === "Cash" || p.method === "Bank Transfer" || p.method === "Cash Receipt").reduce((acc, p) => acc + (p.amount || 0), 0);
    const totalVol = razorpayVol + upiVol + manualVol || 1;

    const razorpayPerc = Math.round((razorpayVol / totalVol) * 100);
    const upiPerc = Math.round((upiVol / totalVol) * 100);
    const manualPerc = 100 - razorpayPerc - upiPerc;

    // Filtered logs
    const filteredLogs = payments.filter(p =>
        p.user?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight font-outfit text-indigo-900">Payments & Revenue</h1>
                    <p className="text-sm text-slate-500 font-medium tracking-tight">Financial ledger and real-time transaction monitoring.</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setIsAddingPayment(true)}
                        className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 flex items-center gap-2 active:scale-95"
                    >
                        <Plus size={18} />
                        Add Manual Payment
                    </button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {summaryStats.map((stat, idx) => (
                    <motion.div
                        key={stat.name}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.1 }}
                        className="bg-white p-6 rounded-[28px] border border-slate-100 shadow-sm flex flex-col group hover:border-indigo-100 transition-all"
                    >
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-3">{stat.name}</p>
                        <h3 className="text-2xl font-black text-slate-900 font-outfit mb-1">{stat.value}</h3>
                        <p className={`text-[10px] font-bold px-2 py-0.5 rounded-lg w-fit ${stat.color === 'blue' ? 'bg-blue-50 text-blue-600' :
                            stat.color === 'indigo' ? 'bg-indigo-50 text-indigo-600' :
                                stat.color === 'emerald' ? 'bg-emerald-50 text-emerald-600' : 'bg-violet-50 text-violet-600'
                            }`}>
                            {stat.count}
                        </p>
                    </motion.div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Revenue Timeline Chart Placeholder */}
                <div className="lg:col-span-2 bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-xl font-bold text-slate-900 font-outfit flex items-center gap-2">
                                <TrendingUp size={22} className="text-indigo-600" />
                                Monthly Revenue Trend
                            </h2>
                            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-1">FY 2024-25 Performance</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-100 text-[10px] font-black text-slate-400 uppercase">
                                <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                                Revenue (₹)
                            </div>
                        </div>
                    </div>

                    <div className="h-64 flex items-end justify-between gap-1 sm:gap-4 px-2">
                        {/* Mock Monthly Bar Chart */}
                        {["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"].map((month, i) => (
                            <div key={month} className="flex-1 flex flex-col items-center gap-3 group relative h-full justify-end">
                                <motion.div
                                    initial={{ height: 0 }}
                                    animate={{ height: `${20 + (i * 7) % 80}%` }}
                                    transition={{ delay: 0.5 + i * 0.05, type: "spring", stiffness: 80 }}
                                    className={`w-full max-w-[32px] rounded-t-xl transition-all ${i === 11 ? 'bg-indigo-600 shadow-lg shadow-indigo-100' : 'bg-indigo-100 group-hover:bg-indigo-200'
                                        }`}
                                ></motion.div>
                                <span className={`text-[10px] font-black uppercase text-slate-400 ${i === 11 ? 'text-indigo-600' : ''}`}>{month}</span>

                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                                    <div className="px-3 py-1.5 bg-slate-900 text-white text-[10px] font-black rounded-lg shadow-xl whitespace-nowrap">
                                        ₹{(20 + (i * 7) % 80) * 5000}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Quick Payment History Summary */}
                <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm flex flex-col">
                    <h2 className="text-xl font-bold text-slate-900 font-outfit mb-6">Payment Overview</h2>
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                                    <CreditCard size={20} />
                                </div>
                                <div>
                                    <p className="text-xs font-black text-slate-900">Razorpay Auto</p>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{razorpayPerc}% of total volume</p>
                                </div>
                            </div>
                            <span className="text-sm font-black text-slate-700">₹{razorpayVol.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                    <DollarSign size={20} />
                                </div>
                                <div className="flex flex-col">
                                    <p className="text-xs font-black text-slate-900">UPI / Direct</p>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{upiPerc}% of total volume</p>
                                </div>
                            </div>
                            <span className="text-sm font-black text-slate-700">₹{upiVol.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                                    <User size={20} />
                                </div>
                                <div className="flex flex-col">
                                    <p className="text-xs font-black text-slate-900">Manual / Cash</p>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{manualPerc}% of total volume</p>
                                </div>
                            </div>
                            <span className="text-sm font-black text-slate-700">₹{manualVol.toLocaleString()}</span>
                        </div>
                    </div>

                    <div className="mt-auto pt-6">
                        <div className="h-1.5 w-full bg-slate-50 rounded-full overflow-hidden flex">
                            <div className="h-full bg-indigo-600" style={{ width: `${razorpayPerc}%` }}></div>
                            <div className="h-full bg-emerald-500" style={{ width: `${upiPerc}%` }}></div>
                            <div className="h-full bg-amber-500" style={{ width: `${manualPerc}%` }}></div>
                        </div>
                        <p className="text-[10px] font-bold text-slate-400 mt-3 text-center uppercase tracking-widest">Revenue Source Distribution</p>
                    </div>
                </div>
            </div>

            {/* Payment Logs Table */}
            <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-8 border-b border-slate-50 flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900 font-outfit">Transaction Logs</h2>
                        <p className="text-xs text-slate-400 font-black uppercase tracking-widest mt-1 italic">Real-time update stream</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input
                                type="text"
                                placeholder="Search payments..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 w-64"
                            />
                        </div>
                        <button className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-500 transition-all flex items-center gap-2 px-3">
                            <Filter size={18} />
                            <span className="text-xs font-bold">Filters</span>
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50">
                                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Transaction ID</th>
                                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">User & Plan</th>
                                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Amount</th>
                                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Date & Time</th>
                                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Gateway</th>
                                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 text-right">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredLogs.map((log) => {
                                const dateStr = log.timestamp?.toDate ? log.timestamp.toDate().toLocaleString() : "Pending...";
                                return (
                                    <tr key={log.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-8 py-5">
                                            <span className="text-xs font-black text-slate-400 group-hover:text-indigo-600 transition-colors uppercase">{log.id.slice(-8)}</span>
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-black text-slate-900">{log.user}</span>
                                                <span className="text-[10px] text-slate-400 font-bold uppercase">{log.plan}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5 text-sm font-black text-slate-900">₹{log.amount?.toLocaleString()}</td>
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                                                <Calendar size={14} className="text-slate-300" />
                                                {dateStr}
                                            </div>
                                        </td>
                                        <td className="px-8 py-5 text-xs font-bold text-slate-600">{log.method}</td>
                                        <td className="px-8 py-5 text-right">
                                            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-black uppercase ${log.status === 'Paid' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                                log.status === 'Pending' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-rose-50 text-rose-600 border-rose-100'
                                                }`}>
                                                {log.status === 'Paid' ? <CheckCircle2 size={12} /> : log.status === 'Pending' ? <Clock size={12} /> : <XCircle size={12} />}
                                                {log.status}
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>

                <div className="p-8 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
                    <button className="text-xs font-black text-indigo-600 hover:text-indigo-700 uppercase tracking-widest flex items-center gap-1 active:scale-95 transition-all">
                        Download Comprehensive Report
                        <Download size={14} />
                    </button>
                    <div className="flex items-center gap-2">
                        <button className="p-2 border border-slate-200 rounded-xl text-slate-400 hover:bg-white transition-all disabled:opacity-50" disabled>
                            <ChevronLeft size={18} />
                        </button>
                        <button className="p-2 border border-slate-200 rounded-xl text-slate-400 hover:bg-white transition-all">
                            <ChevronRight size={18} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Modal Overlay Placeholder */}
            {
                isAddingPayment && (
                    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            className="bg-white rounded-[32px] w-full max-w-lg shadow-2xl overflow-hidden border border-slate-100"
                        >
                            <div className="p-8 border-b border-slate-50 bg-slate-50/50 flex items-center justify-between">
                                <div>
                                    <h2 className="text-2xl font-black text-slate-900 font-outfit tracking-tight">Manual Payment Entry</h2>
                                    <p className="text-sm text-slate-500 font-medium">Record offline or manual transaction.</p>
                                </div>
                                <button
                                    onClick={() => setIsAddingPayment(false)}
                                    className="p-2 hover:bg-white rounded-xl text-slate-400 hover:text-slate-600 transition-all shadow-none hover:shadow-sm"
                                >
                                    <X size={24} />
                                </button>
                            </div>
                            <div className="p-8 space-y-6">
                                <div className="space-y-4">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Search User</label>
                                    <div className="relative">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                        <input
                                            type="text"
                                            placeholder="Type name or email..."
                                            value={userSearchTerm}
                                            onChange={(e) => {
                                                setUserSearchTerm(e.target.value);
                                                setSelectedUser(null);
                                            }}
                                            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold"
                                        />

                                        {users.length > 0 && !selectedUser && (
                                            <div className="absolute top-full left-0 right-0 bg-white border border-slate-100 shadow-xl rounded-2xl mt-2 z-50 max-h-48 overflow-y-auto">
                                                {users.map(u => (
                                                    <button
                                                        key={u.uid}
                                                        onClick={() => {
                                                            setSelectedUser(u);
                                                            setUserSearchTerm(u.displayName);
                                                        }}
                                                        className="w-full text-left px-5 py-3 hover:bg-slate-50 flex flex-col border-b border-slate-50 last:border-0"
                                                    >
                                                        <span className="text-sm font-bold text-slate-900">{u.displayName}</span>
                                                        <span className="text-[10px] text-slate-400 uppercase font-black">{u.email}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    {selectedUser && (
                                        <div className="px-4 py-2 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center gap-2">
                                            <CheckCircle2 size={16} className="text-emerald-500" />
                                            <span className="text-xs font-bold text-emerald-700">Selected: {selectedUser.displayName} ({selectedUser.plan || 'Free'})</span>
                                        </div>
                                    )}
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-4">
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Amount Paid</label>
                                        <input
                                            type="number"
                                            placeholder="₹"
                                            value={manualAmount}
                                            onChange={(e) => setManualAmount(e.target.value)}
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-black text-indigo-600"
                                        />
                                    </div>
                                    <div className="space-y-4">
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Payment Method</label>
                                        <select
                                            value={manualMethod}
                                            onChange={(e) => setManualMethod(e.target.value)}
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold appearance-none"
                                        >
                                            <option>Bank Transfer</option>
                                            <option>UPI / GPay</option>
                                            <option>Cash Receipt</option>
                                            <option>Other</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Internal Note</label>
                                    <textarea
                                        rows={3}
                                        placeholder="Reference number or reason for manual entry..."
                                        value={manualNote}
                                        onChange={(e) => setManualNote(e.target.value)}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium"
                                    ></textarea>
                                </div>
                            </div>
                            <div className="p-8 bg-slate-50 flex items-center justify-end gap-3">
                                <button
                                    onClick={() => setIsAddingPayment(false)}
                                    className="px-6 py-3 font-bold text-slate-500 hover:text-slate-700 text-sm transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleRecordManualPayment}
                                    disabled={isSaving}
                                    className="px-10 py-3 bg-slate-900 text-white rounded-2xl text-sm font-black shadow-lg shadow-slate-200 hover:bg-slate-800 transition-all active:scale-[0.98] disabled:opacity-50"
                                >
                                    {isSaving ? "Saving..." : "Record Payment"}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )
            }
        </div >
    );
}
