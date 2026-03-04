"use client";
import React, { useState, useEffect } from "react";
import {
    Search,
    Filter,
    Download,
    MoreVertical,
    Eye,
    ShieldAlert,
    ShieldOff,
    ChevronLeft,
    ChevronRight,
    CheckCircle2,
    XCircle,
    Clock,
    Loader2
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { collection, onSnapshot, doc, updateDoc, deleteField } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "@/components/Toast";

interface FirestoreUser {
    uid: string;
    displayName: string;
    email: string;
    phone: string;
    plan: string;
    blocked?: boolean;
    onboardingComplete: boolean;
    createdAt: any;
    subscription?: {
        status: string;
        plan: string;
        expiresAt: any;
    };
}

export default function UsersList() {
    const [users, setUsers] = useState<FirestoreUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    // Real-time Firestore listener
    useEffect(() => {
        const unsub = onSnapshot(
            collection(db, "users"),
            (snapshot) => {
                const list: FirestoreUser[] = [];
                snapshot.forEach((d) => {
                    const data = d.data();
                    list.push({
                        uid: d.id,
                        displayName: data.displayName || "Unknown",
                        email: data.email || "",
                        phone: data.phone || "",
                        plan: data.subscription?.plan || data.plan || "Free",
                        blocked: data.blocked || false,
                        onboardingComplete: data.onboardingComplete || false,
                        createdAt: data.createdAt,
                        subscription: data.subscription,
                    });
                });
                setUsers(list);
                setLoading(false);
            },
            (err) => {
                console.error("Firestore users listener error:", err);
                setLoading(false);
            }
        );
        return () => unsub();
    }, []);

    // Block user
    const handleBlock = async (uid: string) => {
        setActionLoading(uid);
        try {
            // Bulk pause sessions in backend
            const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";
            await fetch(`${baseUrl}/session/bulk-status`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ prefix: uid, isActive: false })
            }).catch(e => console.error("Bulk status update failed", e));

            await updateDoc(doc(db, "users", uid), { blocked: true });
            toast("User Blocked", "The user has been locked out immediately.", "warning");
        } catch (err) {
            console.error("Block failed:", err);
            toast("Block Failed", "Could not block user. Check console.", "error");
        }
        setActionLoading(null);
    };

    // Unblock user
    const handleUnblock = async (uid: string) => {
        setActionLoading(uid);
        try {
            await updateDoc(doc(db, "users", uid), { blocked: deleteField() });
            toast("User Unblocked", "Access has been restored successfully.", "success");
        } catch (err) {
            console.error("Unblock failed:", err);
            toast("Unblock Failed", "Could not unblock user. Check console.", "error");
        }
        setActionLoading(null);
    };

    // Derive status
    const getUserStatus = (u: FirestoreUser) => {
        if (u.blocked) return "Blocked";
        if (!u.subscription || u.subscription.status !== "active") return "Expired";
        if (u.subscription.expiresAt) {
            try {
                const exp = u.subscription.expiresAt.toDate();
                if (new Date() > exp) return "Expired";
            } catch { }
        }
        return "Active";
    };

    const getStatusStyles = (status: string) => {
        switch (status) {
            case 'Active': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
            case 'Expired': return 'bg-amber-50 text-amber-600 border-amber-100';
            case 'Blocked': return 'bg-red-50 text-red-600 border-red-100';
            default: return 'bg-slate-50 text-slate-500 border-slate-100';
        }
    };

    const filteredUsers = users.filter(user => {
        const matchesSearch = user.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.phone.includes(searchQuery);
        const status = getUserStatus(user);
        const matchesStatus = statusFilter === "All" || status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    if (loading) {
        return (
            <div className="flex items-center justify-center py-32">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">Users Management</h1>
                    <p className="text-sm text-slate-500 font-medium">
                        {users.length} total users &bull; {users.filter(u => u.blocked).length} blocked
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-100 transition-all flex items-center gap-2">
                        <Download size={16} />
                        Export CSV
                    </button>
                </div>
            </div>

            {/* Filters & Search */}
            <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                <div className="flex items-center gap-3 flex-1 min-w-[300px]">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search by name, email or phone..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                        />
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex items-center bg-slate-50 p-1 rounded-xl border border-slate-200">
                        {["All", "Active", "Expired", "Blocked"].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setStatusFilter(tab)}
                                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${statusFilter === tab
                                    ? "bg-white text-indigo-600 shadow-sm"
                                    : "text-slate-500 hover:text-slate-700"
                                    }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50">
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Name & Contact</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Status</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Plan</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">UID</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredUsers.length > 0 ? filteredUsers.map((user) => {
                                const status = getUserStatus(user);
                                return (
                                    <tr key={user.uid} className="hover:bg-slate-50/80 transition-all group">
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold group-hover:scale-105 transition-transform overflow-hidden border border-slate-200">
                                                    {user.displayName.charAt(0)}
                                                </div>
                                                <div className="flex flex-col min-w-0">
                                                    <p className="text-sm font-black text-slate-900 truncate">{user.displayName}</p>
                                                    <p className="text-[10px] text-slate-400 font-medium truncate">{user.email}</p>
                                                    {user.phone && <p className="text-[10px] text-indigo-500 font-bold truncate">{user.phone}</p>}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-black uppercase ${getStatusStyles(status)}`}>
                                                <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse"></span>
                                                {status}
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className="text-xs font-bold text-slate-700 capitalize">{user.plan}</span>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className="text-[10px] font-mono text-slate-400">{user.uid.slice(0, 12)}...</span>
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                {user.blocked ? (
                                                    <button
                                                        onClick={() => handleUnblock(user.uid)}
                                                        disabled={actionLoading === user.uid}
                                                        className="px-3 py-1.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-xl text-[10px] font-black uppercase hover:bg-emerald-100 transition-all flex items-center gap-1.5 disabled:opacity-50"
                                                    >
                                                        {actionLoading === user.uid ? (
                                                            <Loader2 size={12} className="animate-spin" />
                                                        ) : (
                                                            <ShieldOff size={12} />
                                                        )}
                                                        Unblock
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => handleBlock(user.uid)}
                                                        disabled={actionLoading === user.uid}
                                                        className="px-3 py-1.5 bg-red-50 text-red-600 border border-red-100 rounded-xl text-[10px] font-black uppercase hover:bg-red-100 transition-all flex items-center gap-1.5 disabled:opacity-50"
                                                    >
                                                        {actionLoading === user.uid ? (
                                                            <Loader2 size={12} className="animate-spin" />
                                                        ) : (
                                                            <ShieldAlert size={12} />
                                                        )}
                                                        Block
                                                    </button>
                                                )}
                                                <Link
                                                    href={`/owner/users/${user.uid}`}
                                                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-xl transition-all shadow-none hover:shadow-sm"
                                                    title="View Profile"
                                                >
                                                    <Eye size={18} />
                                                </Link>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            }) : (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center gap-2 text-slate-400">
                                            <XCircle size={48} className="opacity-20" />
                                            <p className="text-lg font-bold">No users found</p>
                                            <p className="text-sm">Try adjusting your filters or search terms.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Footer */}
                <div className="px-8 py-5 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
                    <p className="text-xs font-bold text-slate-500">
                        Showing <span className="text-slate-900">{filteredUsers.length}</span> of <span className="text-slate-900">{users.length}</span> users
                    </p>
                </div>
            </div>
        </div>
    );
}
