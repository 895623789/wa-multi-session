"use client";
import React, { useState, useEffect } from "react";
import {
    Plus, Search, Briefcase, MapPin, Calendar,
    MoreVertical, Bot, ExternalLink, Trash2, Edit,
    IndianRupee, Clock, CheckCircle2, AlertCircle, X
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { db } from "@/lib/firebase";
import { collection, query, onSnapshot, addDoc, serverTimestamp, deleteDoc, doc, updateDoc, getDoc } from "firebase/firestore";
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
    expiresAt?: any; // To track manual access cycles
    status: 'active' | 'pending' | 'expired';
    notes: string;
}

export default function AgencyPortal() {
    const { user } = useAuth();
    const [clients, setClients] = useState<AgencyClient[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean, client: AgencyClient | null, lang: 'en' | 'hi' }>({ isOpen: false, client: null, lang: 'en' });
    const [extendModal, setExtendModal] = useState<{ isOpen: boolean, client: AgencyClient | null, daysToAdd: number }>({ isOpen: false, client: null, daysToAdd: 30 });

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editClientId, setEditClientId] = useState<string | null>(null);

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
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    const handleAddClient = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const expiryDate = new Date();
            expiryDate.setDate(expiryDate.getDate() + 3); // 3 days default trial for agency clients

            await addDoc(collection(db, "agencyClients"), {
                ...formData,
                status: 'active',
                startDate: serverTimestamp(),
                expiresAt: expiryDate,
                createdAt: serverTimestamp()
            });
            setIsAddModalOpen(false);
            setFormData({ name: "", businessName: "", location: "", purpose: "", monthlyFee: 1500, notes: "" });
        } catch (error) {
            console.error("Error adding client:", error);
        }
    };

    const handleEditClick = (client: AgencyClient) => {
        setFormData({
            name: client.name,
            businessName: client.businessName,
            location: client.location || "",
            purpose: client.purpose || "",
            monthlyFee: client.monthlyFee || 1500,
            notes: client.notes || ""
        });
        setEditClientId(client.id);
        setIsEditModalOpen(true);
    };

    const handleUpdateClient = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editClientId) return;

        try {
            await updateDoc(doc(db, "agencyClients", editClientId), {
                ...formData,
                updatedAt: serverTimestamp()
            });
            setIsEditModalOpen(false);
            setEditClientId(null);
            setFormData({ name: "", businessName: "", location: "", purpose: "", monthlyFee: 1500, notes: "" });
        } catch (error) {
            console.error("Error updating client:", error);
        }
    };

    const handleExtendAccess = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!extendModal.client) return;
        try {
            const client = extendModal.client;
            let currentExpiry = client.expiresAt?.toDate ? client.expiresAt.toDate() : (client.expiresAt?.seconds ? new Date(client.expiresAt.seconds * 1000) : new Date());

            // If already expired, start from today. If active, add to current expiry.
            if (currentExpiry < new Date()) {
                currentExpiry = new Date();
            }

            currentExpiry.setDate(currentExpiry.getDate() + extendModal.daysToAdd);

            await updateDoc(doc(db, "agencyClients", client.id), {
                expiresAt: currentExpiry,
                updatedAt: serverTimestamp()
            });
            setExtendModal({ isOpen: false, client: null, daysToAdd: 30 });
        } catch (error) {
            console.error("Error extending access:", error);
        }
    };

    const deleteClient = async (id: string) => {
        if (confirm("Are you sure you want to delete this agency client? All historical data for this client will be lost.")) {
            try {
                // Bulk delete sessions from backend first to clear RAM
                const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";
                await fetch(`${baseUrl}/session/bulk-delete`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ prefix: `agency_${id}` })
                }).catch(e => console.error("Bulk delete failed", e));

                // Then delete from Firestore
                await deleteDoc(doc(db, "agencyClients", id));
                // Optional: also delete their agents collection doc
                await deleteDoc(doc(db, "agencyAgents", id)).catch(() => { });
            } catch (error) {
                console.error("Error deleting client:", error);
            }
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
                        onClick={() => {
                            setFormData({ name: "", businessName: "", location: "", purpose: "", monthlyFee: 1500, notes: "" });
                            setIsAddModalOpen(true);
                        }}
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
                        <ClientCard
                            key={client.id}
                            client={client}
                            onDeleteClick={(c) => setDeleteModal({ isOpen: true, client: c, lang: 'hi' })}
                            onEditClick={(c) => handleEditClick(c)}
                            onExtendClick={(c) => setExtendModal({ isOpen: true, client: c, daysToAdd: 30 })}
                        />
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

            {/* Extend Access Modal */}
            <AnimatePresence>
                {extendModal.isOpen && (
                    <div className="fixed inset-0 z-[600] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                            onClick={() => setExtendModal({ ...extendModal, isOpen: false })}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 30 }}
                            className="relative w-full max-w-md bg-white rounded-[3rem] p-10 shadow-2xl overflow-hidden"
                        >
                            <div className="absolute top-0 left-0 w-full h-2 bg-emerald-500" />
                            <div className="flex justify-between items-start mb-6">
                                <div className="w-16 h-16 bg-emerald-50 rounded-[1.5rem] flex items-center justify-center text-emerald-500 shadow-inner">
                                    <Calendar className="w-9 h-9" />
                                </div>
                                <button
                                    onClick={() => setExtendModal({ ...extendModal, isOpen: false })}
                                    className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-900 transition-all active:scale-95"
                                >
                                    <X size={20} strokeWidth={3} />
                                </button>
                            </div>

                            <h3 className="text-2xl font-black text-slate-900 mb-2 font-outfit leading-tight">Extend Client Access</h3>
                            <p className="text-slate-500 text-sm font-bold leading-relaxed mb-6">
                                Add active days for <strong>{extendModal.client?.businessName}</strong>.
                                Their bot will automatically stop when these days expire.
                            </p>

                            <form onSubmit={handleExtendAccess} className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase text-slate-500 ml-1">Days to Add</label>
                                    <select
                                        value={extendModal.daysToAdd}
                                        onChange={(e) => setExtendModal({ ...extendModal, daysToAdd: parseInt(e.target.value) })}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-900"
                                    >
                                        <option value={7}>+7 Days (Trial Extension)</option>
                                        <option value={15}>+15 Days (Half Month)</option>
                                        <option value={30}>+30 Days (One Month)</option>
                                        <option value={90}>+90 Days (Quarterly)</option>
                                        <option value={365}>+365 Days (Annual)</option>
                                    </select>
                                </div>

                                <button
                                    type="submit"
                                    className="w-full mt-4 py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-[1.25rem] font-black shadow-xl shadow-emerald-500/20 transition-all hover:-translate-y-1 active:scale-95 text-sm"
                                >
                                    Confirm Extension
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Add/Edit Client Modal */}
            <AnimatePresence>
                {(isAddModalOpen || isEditModalOpen) && (
                    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => {
                                setIsAddModalOpen(false);
                                setIsEditModalOpen(false);
                            }}
                            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative w-full max-w-lg bg-white rounded-[2.5rem] p-8 shadow-2xl overflow-hidden shadow-indigo-500/20"
                        >
                            <button
                                onClick={() => {
                                    setIsAddModalOpen(false);
                                    setIsEditModalOpen(false);
                                }}
                                className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-900 transition-all active:scale-95"
                            >
                                <X size={20} strokeWidth={3} />
                            </button>

                            <div className="mb-6">
                                <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                                    {isEditModalOpen ? "Edit Client Details" : "Onboard New Client"}
                                </h2>
                                <p className="text-slate-500 text-sm font-bold">
                                    {isEditModalOpen ? "Update service-based client information." : "Register a service-based client to manage their automation."}
                                </p>
                            </div>

                            <form onSubmit={isEditModalOpen ? handleUpdateClient : handleAddClient} className="space-y-4">
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
                                    {isEditModalOpen ? "Save Changes" : "Confirm Registration"}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

function ClientCard({ client, onDeleteClick, onEditClick, onExtendClick }: { client: AgencyClient, onDeleteClick: (client: AgencyClient) => void, onEditClick: (client: AgencyClient) => void, onExtendClick: (client: AgencyClient) => void }) {
    const [botCount, setBotCount] = useState<number | null>(null);

    useEffect(() => {
        const fetchBotCount = async () => {
            try {
                const agentsRef = doc(db, "agencyAgents", client.id);
                const agentsSnap = await getDoc(agentsRef);
                if (agentsSnap.exists()) {
                    setBotCount(agentsSnap.data().agents?.length || 0);
                } else {
                    setBotCount(0);
                }
            } catch (err) {
                console.error("Error fetching bot count for", client.id, err);
                setBotCount(0);
            }
        };
        fetchBotCount();
    }, [client.id]);

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
                        <span className="text-slate-900 text-sm font-black">{botCount !== null ? botCount : "..."}</span>
                    </div>
                </div>
                {/* Dynamically Computed Status Block */}
                {(() => {
                    const expiresAt = client.expiresAt;
                    let daysLeftStr = 'N/A';
                    let isWarning = false;
                    let isOverdue = false;

                    if (expiresAt) {
                        const endMs = expiresAt.toMillis ? expiresAt.toMillis() : (expiresAt.seconds * 1000);
                        const remaining = endMs - Date.now();
                        const days = Math.ceil(remaining / (1000 * 60 * 60 * 24));
                        daysLeftStr = days < 0 ? `${Math.abs(days)}d Overdue` : `${days}d Left`;
                        isOverdue = days < 0;
                        isWarning = days >= 0 && days <= 3;
                    } else {
                        isOverdue = true;
                        daysLeftStr = 'Expired';
                    }

                    return (
                        <div className="flex flex-col">
                            <span className="text-[9px] font-black uppercase text-slate-400 tracking-tighter mb-1">Access Tracking</span>
                            <div className="flex items-center gap-1.5">
                                <span className={`w-2 h-2 rounded-full ${isOverdue ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]' : isWarning ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]' : 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'} ${isOverdue || isWarning ? 'animate-pulse' : ''}`} />
                                <span className={`${isOverdue ? 'text-rose-600' : isWarning ? 'text-amber-600' : 'text-emerald-500'} text-xs font-black uppercase tracking-tight`}>
                                    {daysLeftStr}
                                </span>
                            </div>
                        </div>
                    );
                })()}
            </div>

            {/* Actions Block */}
            <div className="flex items-center gap-2 w-full md:w-auto justify-end shrink-0">
                <button
                    onClick={() => onExtendClick(client)}
                    className="p-3 rounded-2xl bg-slate-50 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all active:scale-90"
                    title="Extend Access"
                >
                    <Calendar className="w-5 h-5" />
                </button>
                <button
                    onClick={() => onEditClick(client)}
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
                    className="px-5 py-3 ml-2 h-[44px] bg-slate-900 text-white hover:bg-indigo-600 rounded-2xl text-[11px] font-black uppercase tracking-widest flex items-center gap-2 transition-all shadow-xl shadow-slate-900/10 active:scale-95 whitespace-nowrap"
                >
                    <Bot size={16} />
                    Manage Bots
                </Link>
            </div>
        </motion.div>
    );
}
