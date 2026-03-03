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

            {/* Client List */}
            <div className="flex flex-col gap-4">
                {isLoading ? (
                    Array(3).fill(0).map((_, i) => (
                        <div key={i} className="h-32 bg-slate-100 rounded-[2rem] animate-pulse" />
                    ))
                ) : filteredClients.length > 0 ? (
                    filteredClients.map((client) => (
                        <ClientCard key={client.id} client={client} onDeleteClick={(c) => setDeleteModal({ isOpen: true, client: c, lang: 'hi' })} />
                    ))
                ) : (
                    <div className="w-full py-20 flex flex-col items-center justify-center bg-slate-50 border-2 border-dashed border-slate-200 rounded-[3rem] text-center">
                        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm mb-4">
                            <Briefcase className="text-slate-300" size={32} />
                        </div>
                        <h3 className="text-lg font-black text-slate-900">No agency clients yet</h3>
                        <p className="text-slate-400 text-xs font-bold mt-1">Click "New Client" to start scaling your high-ticket model.</p>
                    </div>
                )}
            </div>

            {/* Professional Delete Modal */}
            <AnimatePresence>
                {deleteModal.isOpen && (
                    <div className="fixed inset-0 z-[600] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                            onClick={() => setDeleteModal({ ...deleteModal, isOpen: false })}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 30 }}
                            className="relative w-full max-w-md bg-white rounded-[3rem] p-10 shadow-2xl overflow-hidden"
                        >
                            <div className="absolute top-0 left-0 w-full h-2 bg-rose-500" />
                            <div className="flex justify-between items-start mb-8">
                                <div className="w-16 h-16 bg-rose-50 rounded-[1.5rem] flex items-center justify-center text-rose-500 shadow-inner">
                                    <AlertCircle className="w-9 h-9" />
                                </div>
                                <button
                                    onClick={() => setDeleteModal({ ...deleteModal, lang: deleteModal.lang === 'hi' ? 'en' : 'hi' })}
                                    className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-full text-[9px] font-black uppercase text-slate-500 hover:text-indigo-600 transition-all border border-slate-100 shadow-sm"
                                >
                                    {deleteModal.lang === 'hi' ? "Translate to EN" : "हिंदी में देखें"}
                                </button>
                            </div>

                            <h3 className="text-3xl font-black text-slate-900 mb-4 font-outfit leading-tight">
                                {deleteModal.lang === 'hi' ? "क्लाइंट डिलीट करें?" : "Delete Client?"}
                            </h3>
                            <p className="text-slate-500 text-sm font-bold leading-relaxed mb-10">
                                {deleteModal.lang === 'hi'
                                    ? `क्या आप वाकई "${deleteModal.client?.businessName}" को डिलीट करना चाहते हैं? इससे उनका सारा डेटा हट जाएगा।`
                                    : `Are you sure you want to delete "${deleteModal.client?.businessName}"? This action is irreversible.`}
                            </p>

                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={() => deleteClient(deleteModal.client!.id)}
                                    className="w-full py-4 bg-rose-500 hover:bg-rose-600 text-white rounded-[1.25rem] font-black shadow-xl shadow-rose-500/20 transition-all hover:-translate-y-1 active:scale-95 text-xs uppercase tracking-widest"
                                >
                                    {deleteModal.lang === 'hi' ? "हाँ, डिलीट करें" : "Confirm Delete"}
                                </button>
                                <button
                                    onClick={() => setDeleteModal({ ...deleteModal, isOpen: false })}
                                    className="w-full py-4 bg-slate-50 text-slate-500 hover:text-slate-900 rounded-[1.25rem] font-black transition-all hover:bg-slate-100 text-xs uppercase tracking-widest"
                                >
                                    {deleteModal.lang === 'hi' ? "नहीं, वापस जाएं" : "Cancel"}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

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

function ClientCard({ client, onDeleteClick }: { client: AgencyClient, onDeleteClick: (client: AgencyClient) => void }) {
    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-[2rem] p-5 md:p-6 border border-slate-100 shadow-sm flex flex-col md:flex-row items-center gap-6 group hover:shadow-xl hover:border-indigo-600/20 transition-all duration-300"
        >
            {/* Identity Block */}
            <div className="flex items-center gap-5 w-full md:w-1/3">
                <div className="w-16 h-16 rounded-[1.25rem] bg-slate-50 flex items-center justify-center p-1.5 border-2 border-white shadow-inner overflow-hidden group-hover:scale-105 transition-transform shrink-0">
                    <div className="w-full h-full bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 font-black text-xl border border-indigo-100/50">
                        {client.name.charAt(0)}
                    </div>
                </div>
                <div className="truncate">
                    <h4 className="text-lg font-black text-slate-900 truncate">{client.businessName}</h4>
                    <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] font-black uppercase text-indigo-600 tracking-widest px-2 py-0.5 bg-indigo-50 border border-indigo-100 rounded-md truncate max-w-[120px]">{client.name}</span>
                        <span className="text-[10px] font-bold text-slate-400 truncate flex items-center gap-1"><MapPin size={10} /> {client.location || 'Remote'}</span>
                    </div>
                </div>
            </div>

            {/* Status Block */}
            <div className="flex items-center justify-between md:justify-around flex-1 w-full border-y md:border-y-0 md:border-x border-slate-100 py-4 md:py-0 gap-4">
                <div className="flex flex-col">
                    <span className="text-[9px] font-black uppercase text-slate-400 tracking-tighter mb-1">Monthly Fee</span>
                    <div className="flex items-center gap-1">
                        <IndianRupee className="text-emerald-500" size={14} />
                        <span className="text-slate-900 text-sm font-black">{client.monthlyFee}</span>
                    </div>
                </div>
                <div className="flex flex-col">
                    <span className="text-[9px] font-black uppercase text-slate-400 tracking-tighter mb-1">Bots Connected</span>
                    <div className="flex items-center gap-1.5">
                        <Bot className="text-slate-400" size={14} />
                        <span className="text-slate-900 text-sm font-black">?</span>
                    </div>
                </div>
                <div className="flex flex-col">
                    <span className="text-[9px] font-black uppercase text-slate-400 tracking-tighter mb-1">Status</span>
                    <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                        <span className="text-emerald-500 text-xs font-black uppercase tracking-tight">Active</span>
                    </div>
                </div>
            </div>

            {/* Actions Block */}
            <div className="flex items-center gap-3 w-full md:w-auto justify-end shrink-0">
                <button
                    className="p-3 rounded-2xl bg-slate-50 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all active:scale-90"
                    title="Edit Client"
                >
                    <Edit className="w-5 h-5" />
                </button>
                <button
                    onClick={() => onDeleteClick(client)}
                    className="p-3 rounded-2xl bg-slate-50 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all active:scale-90"
                    title="Delete Client"
                >
                    <Trash2 className="w-5 h-5" />
                </button>
                <Link
                    href={`/owner/agency/${client.id}`}
                    className="px-5 py-3 h-[44px] bg-slate-900 text-white hover:bg-indigo-600 rounded-2xl text-[11px] font-black uppercase tracking-widest flex items-center gap-2 transition-all shadow-xl shadow-slate-900/10 active:scale-95 whitespace-nowrap"
                >
                    <Bot size={16} />
                    Manage Bots
                </Link>
            </div>
        </motion.div>
    );
}
