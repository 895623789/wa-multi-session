"use client";
import React, { useState } from "react";
import {
    Search,
    Filter,
    Download,
    MoreVertical,
    Eye,
    Edit2,
    ShieldAlert,
    Trash2,
    ChevronLeft,
    ChevronRight,
    UserPlus,
    CheckCircle2,
    XCircle,
    Clock,
    UserMinus,
    ExternalLink
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

const mockUsers = [
    { uid: "user1", name: "Rahul Sharma", email: "rahul@example.com", plan: "Pro Plan", status: "Active", joined: "2024-02-15", expiry: "2025-02-15", phone: "+91 98765 43210" },
    { uid: "user2", name: "Amit Patel", email: "amit.p@gmail.com", plan: "Basic Plan", status: "Expired", joined: "2024-01-10", expiry: "2024-02-10", phone: "+91 87654 32109" },
    { uid: "user3", name: "Priya Das", email: "priya@das-solutions.in", plan: "Pro Plan", status: "Trial", joined: "2024-03-01", expiry: "2024-03-08", phone: "+91 76543 21098" },
    { uid: "user4", name: "Vikram Singh", email: "vikram@singh.com", plan: "Free Plan", status: "Active", joined: "2023-12-05", expiry: "N/A", phone: "+91 65432 10987" },
    { uid: "user5", name: "Sneha Reddy", email: "sneha.r@outlook.com", plan: "Basic Plan", status: "Suspended", joined: "2023-11-20", expiry: "2024-11-20", phone: "+91 54321 09876" },
    { uid: "user6", name: "Meera Iyer", email: "meera.i@company.com", plan: "Pro Plan", status: "Active", joined: "2024-02-28", expiry: "2025-02-28", phone: "+91 43210 98765" },
    { uid: "user7", name: "Anil Kapoor", email: "anil.k@bolly.com", plan: "Basic Plan", status: "Active", joined: "2024-02-05", expiry: "2025-02-05", phone: "+91 32109 87654" },
    { uid: "user8", name: "Sita Ram", email: "sita.ram@divine.in", plan: "Free Plan", status: "Expired", joined: "2023-10-15", expiry: "2023-11-15", phone: "+91 21098 76543" },
];

export default function UsersList() {
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

    const filteredUsers = mockUsers.filter(user => {
        const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.phone.includes(searchQuery);
        const matchesStatus = statusFilter === "All" || user.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const toggleSelectAll = () => {
        if (selectedUsers.length === filteredUsers.length) {
            setSelectedUsers([]);
        } else {
            setSelectedUsers(filteredUsers.map(u => u.uid));
        }
    };

    const toggleSelectUser = (uid: string) => {
        if (selectedUsers.includes(uid)) {
            setSelectedUsers(selectedUsers.filter(id => id !== uid));
        } else {
            setSelectedUsers([...selectedUsers, uid]);
        }
    };

    const getStatusStyles = (status: string) => {
        switch (status) {
            case 'Active': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
            case 'Expired': return 'bg-rose-50 text-rose-600 border-rose-100';
            case 'Trial': return 'bg-amber-50 text-amber-600 border-amber-100';
            case 'Suspended': return 'bg-slate-100 text-slate-600 border-slate-200';
            default: return 'bg-slate-50 text-slate-500 border-slate-100';
        }
    };

    return (
        <div className="space-y-6">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight font-outfit">Users Management</h1>
                    <p className="text-sm text-slate-500 font-medium">Manage and monitor all BulkReply.io users.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-100 transition-all flex items-center gap-2">
                        <Download size={16} />
                        Export CSV
                    </button>
                    <button className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 flex items-center gap-2 active:scale-95">
                        <UserPlus size={16} />
                        Add New User
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
                        {["All", "Active", "Expired", "Trial"].map((tab) => (
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
                    <button className="p-2.5 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-500 transition-all">
                        <Filter size={18} />
                    </button>
                </div>
            </div>

            {/* Selected Bulk Actions */}
            <AnimatePresence>
                {selectedUsers.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="p-4 bg-indigo-600 rounded-2xl flex items-center justify-between shadow-lg shadow-indigo-100"
                    >
                        <div className="flex items-center gap-3 text-white">
                            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center font-bold text-sm">
                                {selectedUsers.length}
                            </div>
                            <span className="font-bold text-sm">Users Selected</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <button className="px-4 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-2">
                                <UserMinus size={14} />
                                Suspend Selected
                            </button>
                            <button className="px-4 py-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-2">
                                <Trash2 size={14} />
                                Delete
                            </button>
                            <button
                                onClick={() => setSelectedUsers([])}
                                className="p-1.5 text-white/60 hover:text-white transition-colors"
                            >
                                <XCircle size={18} />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Table */}
            <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50">
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest w-12 text-center border-b border-slate-100">
                                    <input
                                        type="checkbox"
                                        checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                                        onChange={toggleSelectAll}
                                        className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 transition-all"
                                    />
                                </th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Name & Contact</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Status</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Current Plan</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Expiry Date</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredUsers.length > 0 ? filteredUsers.map((user) => (
                                <tr key={user.uid} className={`hover:bg-slate-50/80 transition-all group ${selectedUsers.includes(user.uid) ? 'bg-indigo-50/30' : ''}`}>
                                    <td className="px-6 py-5 text-center">
                                        <input
                                            type="checkbox"
                                            checked={selectedUsers.includes(user.uid)}
                                            onChange={() => toggleSelectUser(user.uid)}
                                            className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 transition-all"
                                        />
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold group-hover:scale-105 transition-transform overflow-hidden border border-slate-200">
                                                {user.name.charAt(0)}
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                                <p className="text-sm font-black text-slate-900 truncate">{user.name}</p>
                                                <div className="flex flex-col space-y-0.5">
                                                    <p className="text-[10px] text-slate-400 font-medium truncate">{user.email}</p>
                                                    <p className="text-[10px] text-indigo-500 font-bold truncate">{user.phone}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-black uppercase ${getStatusStyles(user.status)}`}>
                                            <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse"></span>
                                            {user.status}
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex flex-col">
                                            <span className="text-xs font-bold text-slate-700">{user.plan}</span>
                                            <span className="text-[10px] text-slate-400 font-medium">Joined: {user.joined}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-2">
                                            <Clock size={14} className="text-slate-300" />
                                            <span className={`text-xs font-bold ${user.status === 'Expired' ? 'text-rose-500' : 'text-slate-600'}`}>
                                                {user.expiry}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            <Link
                                                href={`/owner/users/${user.uid}`}
                                                className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-xl transition-all shadow-none hover:shadow-sm"
                                                title="View Profile"
                                            >
                                                <Eye size={18} />
                                            </Link>
                                            <button
                                                className="p-2 text-slate-400 hover:text-amber-600 hover:bg-white rounded-xl transition-all"
                                                title="Edit User"
                                            >
                                                <Edit2 size={18} />
                                            </button>
                                            <div className="relative group/menu">
                                                <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-white rounded-xl transition-all">
                                                    <MoreVertical size={18} />
                                                </button>
                                                <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-slate-100 rounded-xl shadow-xl opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible transition-all z-10 py-1 overflow-hidden">
                                                    <button className="w-full text-left px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 flex items-center gap-2">
                                                        <ShieldAlert size={14} />
                                                        Suspend Account
                                                    </button>
                                                    <button className="w-full text-left px-4 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 flex items-center gap-2">
                                                        <Trash2 size={14} />
                                                        Delete Permanently
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center">
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

                {/* Pagination */}
                <div className="px-8 py-5 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
                    <p className="text-xs font-bold text-slate-500">
                        Showing <span className="text-slate-900">1 to {filteredUsers.length}</span> of <span className="text-slate-900">{mockUsers.length}</span> users
                    </p>
                    <div className="flex items-center gap-2">
                        <button className="p-2 border border-slate-200 rounded-xl text-slate-400 hover:bg-white hover:text-slate-600 transition-all disabled:opacity-50" disabled>
                            <ChevronLeft size={18} />
                        </button>
                        <div className="flex items-center gap-1">
                            {[1, 2, 3].map(p => (
                                <button key={p} className={`w-8 h-8 rounded-xl text-xs font-bold transition-all ${p === 1 ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-slate-500 hover:bg-white border border-transparent hover:border-slate-100'}`}>
                                    {p}
                                </button>
                            ))}
                        </div>
                        <button className="p-2 border border-slate-200 rounded-xl text-slate-400 hover:bg-white hover:text-slate-600 transition-all">
                            <ChevronRight size={18} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
