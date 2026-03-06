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
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [users, setUsers] = useState([]);
    const [userSearchTerm, setUserSearchTerm] = useState("");
    const [selectedUser, setSelectedUser] = useState(null);
    const [manualAmount, setManualAmount] = useState("");
    const [manualMethod, setManualMethod] = useState("Bank Transfer");
    const [manualNote, setManualNote] = useState("");
    const [isSaving, setIsSaving] = useState(false);

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

    useEffect(() => {
        if (userSearchTerm.length < 2) {
            setUsers([]);
            return;
        }
        const unsub = onSnapshot(collection(db, "users"), (snapshot) => {
            const list = snapshot.docs.map(d => ({ uid: d.id, ...d.data() }));
            const filtered = list.filter((u) =>
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

    const getStats = () => {
        const totalRevenue = payments.reduce((acc, p) => acc + (p.amount || 0), 0);
        return [
            { name: "Total Revenue", value: `₹${totalRevenue.toLocaleString()}`, count: `${payments.length} payments`, color: "violet" },
        ];
    };

    return (
        <div className="space-y-8 p-8">
            <h1 className="text-2xl font-black text-indigo-900">Payments & Revenue</h1>
            <p className="text-slate-500">Financial ledger and real-time transaction monitoring.</p>

            <button
                onClick={() => setIsAddingPayment(true)}
                className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold"
            >
                Add Manual Payment
            </button>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {payments.map((p) => (
                    <div key={p.id} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <p className="font-bold text-slate-900">{p.user}</p>
                                <p className="text-xs text-slate-400 capitalize">{p.plan}</p>
                            </div>
                            <span className="text-indigo-600 font-black">₹{p.amount}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">
                            {p.method} • {p.status}
                        </div>
                    </div>
                ))}
            </div>

            {isAddingPayment && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-white rounded-[32px] w-full max-w-lg p-8">
                        <h2 className="text-2xl font-black mb-6">Manual Payment Entry</h2>
                        <input
                            type="text"
                            placeholder="Search user..."
                            value={userSearchTerm}
                            onChange={(e) => setUserSearchTerm(e.target.value)}
                            className="w-full p-4 bg-slate-50 border rounded-2xl mb-4"
                        />
                        {users.map(u => (
                            <button key={u.uid} onClick={() => { setSelectedUser(u); setUserSearchTerm(u.displayName); }} className="block w-full text-left p-2 hover:bg-slate-50">
                                {u.displayName}
                            </button>
                        ))}
                        <input
                            type="number"
                            placeholder="Amount"
                            value={manualAmount}
                            onChange={(e) => setManualAmount(e.target.value)}
                            className="w-full p-4 bg-slate-50 border rounded-2xl mb-4"
                        />
                        <div className="flex justify-end gap-4 mt-6">
                            <button onClick={() => setIsAddingPayment(false)} className="px-6 py-2 text-slate-500">Cancel</button>
                            <button onClick={handleRecordManualPayment} className="px-6 py-2 bg-slate-900 text-white rounded-xl">Record</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}