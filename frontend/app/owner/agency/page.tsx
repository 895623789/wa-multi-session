"use client";
import React, { useState, useEffect } from "react";
import {
    Plus, Search, Briefcase, MapPin, Calendar,
    MoreVertical, Bot, ExternalLink, Trash2, Edit,
    IndianRupee, Clock, CheckCircle2, AlertCircle, X
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { db } from "@/lib/firebase";
import { collection, query, onSnapshot, addDoc, serverTimestamp, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { useAuth } from "@/components/AuthProvider";
import Link from "next/link";

interface AgencyClient {
    id: string;
    name: string;
    businessName: string;
    location: string;
    purpose: string;
    monthlyFee: number;
    startDate: any;
    status: 'active' | 'pending' | 'expired';
    notes: string;
}

export default function AgencyPortal() {
    const { user } = useAuth();
    const [clients, setClients] = useState<AgencyClient[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Form State
    const [formData, setFormData] = useState({
        name: "",
        businessName: "",
        location: "",
        purpose: "",
        monthlyFee: 1500,
        notes: ""
    });

    useEffect(() => {
        if (!user) return;

        const q = query(collection(db, "agencyClients"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const clientData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as AgencyClient[];
            setClients(clientData);
            setIsLoading(isLoading);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    const handleAddClient = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await addDoc(collection(db, "agencyClients"), {
                ...formData,
                status: 'active',
                startDate: serverTimestamp(),
                createdAt: serverTimestamp()
            });
            setIsAddModalOpen(false);
            setFormData({ name: "", businessName: "", location: "", purpose: "", monthlyFee: 1500, notes: "" });
        } catch (error) {
            console.error("Error adding client:", error);
        }
    };

    const deleteClient = async (id: string) => {
        if (confirm("Are you sure you want to delete this agency client? All historical data for this client will be lost.")) {
            await deleteDoc(doc(db, "agencyClients", id));
        }
    };

    const filteredClients = clients.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.businessName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto pb-24 md:pb-8">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <div className="p-2 bg-indigo-600 rounded-xl text-white shadow-lg shadow-indigo-200">
                            <Briefcase size={24} />
                        </div>
                        Agency Portal
                    </h1>
                    <p className="text-slate-500 text-sm font-bold mt-1">Manage high-ticket service-based clients & automation.</p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
                        <input
                            type="text"
                            placeholder="Search clients..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all w-full md:w-64 shadow-sm"
                        />
                    </div>
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-black flex items-center gap-2 shadow-lg shadow-indigo-200 transition-all active:scale-95 shrink-0"
                    >
                        <Plus size={18} strokeWidth={3} />
                        New Client
                    </button>
                </div>
            </div>

            {/* Client Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {isLoading ? (
                    Array(3).fill(0).map((_, i) => (
                        <div key={i} className="h-64 bg-slate-100 rounded-[32px] animate-pulse" />
                    ))
                ) : filteredClients.length > 0 ? (
                    filteredClients.map((client) => (
                        <ClientCard key={client.id} client={client} onDelete={deleteClient} />
                    ))
                ) : (
                    <div className="col-span-full py-20 flex flex-col items-center justify-center bg-slate-50 border-2 border-dashed border-slate-200 rounded-[40px] text-center">
                        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm mb-4">
                            <Briefcase className="text-slate-300" size={32} />
                        </div>
                        <h3 className="text-lg font-black text-slate-900">No agency clients yet</h3>
                        <p className="text-slate-400 text-xs font-bold mt-1">Click "New Client" to start scaling your high-ticket model.</p>
                    </div>
                )}
            </div>

            {/* Add Client Modal */}
            <AnimatePresence>
                {isAddModalOpen && (
                    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsAddModalOpen(false)}
                            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative w-full max-w-lg bg-white rounded-[2.5rem] p-8 shadow-2xl overflow-hidden shadow-indigo-500/20"
                        >
                            <button
                                onClick={() => setIsAddModalOpen(false)}
                                className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-900 transition-all active:scale-95"
                            >
                                <X size={20} strokeWidth={3} />
                            </button>

                            <div className="mb-6">
                                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Onboard New Client</h2>
                                <p className="text-slate-500 text-sm font-bold">Register a service-based client to manage their automation.</p>
                            </div>

                            <form onSubmit={handleAddClient} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-black uppercase text-slate-500 ml-1">Client Name</label>
                                        <input
                                            required
                                            type="text"
                                            value={formData.name}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                            placeholder="e.g. Rahul Sharma"
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-black uppercase text-slate-500 ml-1">Business Name</label>
                                        <input
                                            required
                                            type="text"
                                            value={formData.businessName}
                                            onChange={e => setFormData({ ...formData, businessName: e.target.value })}
                                            placeholder="e.g. Digital Solutions"
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-black uppercase text-slate-500 ml-1">Location</label>
                                        <div className="relative">
                                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                            <input
                                                type="text"
                                                value={formData.location}
                                                onChange={e => setFormData({ ...formData, location: e.target.value })}
                                                placeholder="City, State"
                                                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-black uppercase text-slate-500 ml-1">Monthly Fee (₹)</label>
                                        <div className="relative">
                                            <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                            <input
                                                required
                                                type="number"
                                                value={formData.monthlyFee}
                                                onChange={e => setFormData({ ...formData, monthlyFee: parseInt(e.target.value) })}
                                                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-black uppercase text-slate-500 ml-1">Purpose / Bot Description</label>
                                    <textarea
                                        rows={3}
                                        value={formData.purpose}
                                        onChange={e => setFormData({ ...formData, purpose: e.target.value })}
                                        placeholder="What kind of automation are we building for them?"
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[1.5rem] font-black text-base shadow-xl shadow-indigo-200 transition-all active:scale-[0.98] mt-4"
                                >
                                    Confirm Registration
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

function ClientCard({ client, onDelete }: { client: AgencyClient, onDelete: (id: string) => void }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="group bg-white rounded-[32px] p-6 border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-500 hover:-translate-y-1 overflow-hidden relative"
        >
            {/* Background Glow */}
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl group-hover:bg-indigo-500/10 transition-all duration-700" />

            {/* Content */}
            <div className="relative z-10">
                <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 font-black text-xl border border-indigo-100 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500">
                        {client.name.charAt(0)}
                    </div>
                    <div className="flex items-center gap-1">
                        <button className="p-2 text-slate-300 hover:text-indigo-600 transition-colors">
                            <Edit size={16} />
                        </button>
                        <button
                            onClick={() => onDelete(client.id)}
                            className="p-2 text-slate-300 hover:text-rose-600 transition-colors"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                </div>

                <div className="mb-4">
                    <h3 className="text-lg font-black text-slate-900 leading-tight group-hover:text-indigo-600 transition-colors">{client.businessName}</h3>
                    <p className="text-sm font-bold text-slate-400">{client.name}</p>
                </div>

                <div className="space-y-2 mb-6">
                    <div className="flex items-center gap-2 text-[11px] font-black text-slate-500 uppercase tracking-tight">
                        <MapPin size={14} className="text-indigo-500" />
                        <span>{client.location || 'Remote'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] font-black text-slate-500 uppercase tracking-tight">
                        <IndianRupee size={14} className="text-emerald-500" />
                        <span>₹{client.monthlyFee} <span className="text-[9px] text-slate-300">/ MONTH</span></span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] font-black text-slate-500 uppercase tracking-tight">
                        <Calendar size={14} className="text-amber-500" />
                        <span>Since {client.startDate?.toDate ? client.startDate.toDate().toLocaleDateString() : 'N/A'}</span>
                    </div>
                </div>

                {/* Tracking & Manage */}
                <div className="flex items-center gap-2 mb-6">
                    <div className="flex-1 bg-slate-50 rounded-2xl p-3 flex flex-col items-center justify-center border border-slate-100">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Bots</span>
                        <span className="text-base font-black text-slate-900">0</span>
                    </div>
                    <div className="flex-1 bg-slate-50 rounded-2xl p-3 flex flex-col items-center justify-center border border-slate-100">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Status</span>
                        <div className="flex items-center gap-1 text-emerald-600 mt-0.5">
                            <CheckCircle2 size={12} strokeWidth={3} />
                            <span className="text-[10px] font-black uppercase">Active</span>
                        </div>
                    </div>
                </div>

                <Link
                    href={`/owner/agency/${client.id}`}
                    className="w-full h-11 bg-white border border-slate-200 hover:border-indigo-600 hover:bg-indigo-50 text-slate-900 hover:text-indigo-600 rounded-2xl font-black text-xs flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.98]"
                >
                    <Bot size={16} />
                    Manage Bot System
                </Link>
            </div>
        </motion.div>
    );
}
