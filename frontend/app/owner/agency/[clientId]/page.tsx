"use client";
import React, { useState, useEffect, useCallback } from "react";
import {
    Plus, Search, Briefcase, MapPin, Calendar,
    MoreVertical, Bot, ExternalLink, Trash2, Edit,
    IndianRupee, Clock, CheckCircle2, AlertCircle, X,
    ChevronLeft, Smartphone, QrCode, RefreshCw, Power,
    Bot as BotIcon
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { db } from "@/lib/firebase";
import { doc, getDoc, collection, query, onSnapshot, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { Filter } from "bad-words";
import { useAuth } from "@/components/AuthProvider";
import Link from "next/link";
import QRCode from "react-qr-code";
import { useParams, useRouter } from "next/navigation";

interface AgencyClient {
    id: string;
    name: string;
    businessName: string;
    location: string;
    purpose: string;
    monthlyFee: number;
    startDate: any;
    billingCycleStart?: any; // To track manual 30-day cycles
    status: 'active' | 'pending' | 'expired';
}

interface AgentConfig {
    id: string;
    name: string;
    role: string;
    gender: string;
    age: number;
    businessInfo: string;
    instructions: string;
    ownerNumbers: string[];
    replyDelay: number;
    autoGreet: boolean;
    isActive: boolean;
    botType?: string;
    updatedAt: number;
}

export default function ClientManagement() {
    const params = useParams();
    const router = useRouter();
    const clientId = params.clientId as string;

    const [client, setClient] = useState<AgencyClient | null>(null);
    const [agents, setAgents] = useState<AgentConfig[]>([]);
    const [connectedSessions, setConnectedSessions] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [viewState, setViewState] = useState<'list' | 'create' | 'auth'>('list');
    const [authMode, setAuthMode] = useState<'qr' | 'pairing'>('qr');
    const [pairingNumber, setPairingNumber] = useState("");
    const [pairingCode, setPairingCode] = useState("");
    const [selectedCountry, setSelectedCountry] = useState({ name: "India", code: "91", flag: "🇮🇳", digits: 10 });
    const [activeSessionId, setActiveSessionId] = useState("");
    const [qrCode, setQrCode] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);

    // Billing Cycle State
    const [daysLeft, setDaysLeft] = useState<number>(0);

    const countries = [
        { name: "India", code: "91", flag: "🇮🇳", digits: 10 },
        { name: "Pakistan", code: "92", flag: "🇵🇰", digits: 10 },
        { name: "USA", code: "1", flag: "🇺🇸", digits: 10 },
    ];

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editAgentId, setEditAgentId] = useState<string | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; agent: AgentConfig | null }>({ open: false, agent: null });
    const [isDeleting, setIsDeleting] = useState(false);

    // Create Agent Form State
    const [newAgent, setNewAgent] = useState({
        name: "",
        role: "Sales Assistant",
        businessInfo: "",
        instructions: ""
    });

    const fetchClientData = useCallback(async () => {
        if (!clientId) return;
        const docRef = doc(db, "agencyClients", clientId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            const clientData = docSnap.data();
            setClient({ id: docSnap.id, ...clientData } as AgencyClient);

            // Calculate Billing Cycle Days Left
            const cycleStart = clientData.billingCycleStart || clientData.startDate;
            if (cycleStart) {
                const startMs = cycleStart.toMillis ? cycleStart.toMillis() : (cycleStart.seconds * 1000);
                const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
                const endMs = startMs + thirtyDaysMs;
                const remaining = endMs - Date.now();
                setDaysLeft(Math.ceil(remaining / (1000 * 60 * 60 * 24)));
            }

            // Fetch agents associated with this client
            const agentsRef = doc(db, "agencyAgents", clientId);
            const agentsSnap = await getDoc(agentsRef);
            if (agentsSnap.exists()) {
                setAgents(agentsSnap.data().agents || []);
            }
        }
        setIsLoading(false);
    }, [clientId]);

    const fetchBackendSessions = useCallback(async () => {
        if (!clientId) return;
        try {
            const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";
            const res = await fetch(`${baseUrl}/session/list?uid=agency_${clientId}`).catch(() => null);
            if (res && res.ok) {
                const data = await res.json();
                setConnectedSessions(data.sessions || []);
            }
        } catch (e) {
            // Silently fail to avoid Next.js dev overlay freezing the screen when backend is restarting
        }
    }, [clientId]);

    useEffect(() => {
        fetchClientData();
        fetchBackendSessions();

        // Interval for session sync
        const interval = setInterval(fetchBackendSessions, 5000);
        return () => clearInterval(interval);
    }, [clientId, fetchClientData, fetchBackendSessions]);

    const handleCreateAgent = async (e: React.FormEvent) => {
        e.preventDefault();
        const shortId = `unit-${Date.now().toString().slice(-6)}`;
        const agentId = `agency_${clientId}_${shortId}`;
        const finalAgent: AgentConfig = {
            id: agentId,
            ...newAgent,
            gender: "Female",
            age: 25,
            ownerNumbers: [],
            replyDelay: 2,
            autoGreet: true,
            isActive: true,
            updatedAt: Date.now()
        };

        const updatedAgents = [...agents, finalAgent];
        setAgents(updatedAgents);

        // Persist to agencyAgents collection
        await updateDoc(doc(db, "agencyAgents", clientId), {
            agents: arrayUnion(finalAgent)
        }).catch(async () => {
            const { setDoc } = await import("firebase/firestore");
            await setDoc(doc(db, "agencyAgents", clientId), { agents: [finalAgent] });
        });

        setViewState('list');
        setNewAgent({ name: "", role: "Sales Assistant", businessInfo: "", instructions: "" });
    };

    const handleToggleActive = async (agent: AgentConfig) => {
        const newIsActive = agent.isActive !== undefined ? !agent.isActive : false;
        const updatedAgents = agents.map(a =>
            a.id === agent.id ? { ...a, isActive: newIsActive } : a
        );
        setAgents(updatedAgents);

        try {
            await updateDoc(doc(db, "agencyAgents", clientId), {
                agents: updatedAgents
            });

            // Sync with active WhatsApp session immediately
            const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";
            fetch(`${baseUrl}/session/update-status`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    sessionId: agent.id,
                    isActive: newIsActive
                })
            }).catch(e => console.error("Failed to sync logic status", e));
        } catch (err) {
            console.error("Failed to toggle agent logic:", err);
        }
    };

    const handleDeleteBot = async (agent: AgentConfig) => {
        setIsDeleting(true);
        try {
            const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";
            await fetch(`${baseUrl}/bot/delete`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ sessionId: agent.id, clientId })
            });
            setAgents(prev => prev.filter(a => a.id !== agent.id));
            setDeleteConfirm({ open: false, agent: null });
        } catch (err) {
            console.error("Delete bot failed:", err);
        } finally {
            setIsDeleting(false);
        }
    };

    const handleEditClick = (agent: AgentConfig) => {
        setNewAgent({
            name: agent.name,
            role: agent.role || "Sales Assistant",
            businessInfo: agent.businessInfo || "",
            instructions: agent.instructions || ""
        });
        setEditAgentId(agent.id);
        setIsEditModalOpen(true);
    };

    const handleUpdateAgent = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editAgentId) return;

        const updatedAgents = agents.map(agent => {
            if (agent.id === editAgentId) {
                return {
                    ...agent,
                    ...newAgent,
                    updatedAt: Date.now()
                };
            }
            return agent;
        });

        setAgents(updatedAgents);

        try {
            await updateDoc(doc(db, "agencyAgents", clientId), {
                agents: updatedAgents
            });

            // Sync with active WhatsApp session immediately
            const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";
            fetch(`${baseUrl}/session/update-config`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    sessionId: editAgentId,
                    name: newAgent.name,
                    role: newAgent.role,
                    instructions: newAgent.instructions,
                    businessInfo: newAgent.businessInfo
                })
            }).catch(e => console.error("Failed to sync live config", e));

            setIsEditModalOpen(false);
            setEditAgentId(null);
            setNewAgent({ name: "", role: "Sales Assistant", businessInfo: "", instructions: "" });
        } catch (error) {
            console.error("Error updating agent:", error);
        }
    };

    const startAuthFlow = async (agentId: string, type: 'qr' | 'pairing' = 'qr') => {
        setActiveSessionId(agentId);
        setViewState('auth');
        setAuthMode(type);
        setQrCode("");
        setPairingCode("");
        if (type === 'pairing') setIsGenerating(true);

        try {
            const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";
            const endpoint = type === 'qr' ? '/session/start' : '/session/start-pairing';
            const targetAgent = agents.find(a => a.id === agentId);
            const body: any = {
                uid: `agency_${clientId}`,
                sessionId: agentId,
                instructions: targetAgent?.instructions || "",
                businessInfo: targetAgent?.businessInfo || "",
                name: targetAgent?.name || "AI Agent",
                role: targetAgent?.role || "Business Representative",
                gender: targetAgent?.gender || "Female",
                age: targetAgent?.age || 25,
                botType: targetAgent?.botType || "business_bot"
            };

            if (type === 'pairing') {
                if (!pairingNumber) {
                    setIsGenerating(false);
                    return;
                }
                const fullNumber = selectedCountry.code + pairingNumber.replace(/\D/g, "");
                if (pairingNumber.replace(/\D/g, "").length < selectedCountry.digits) {
                    alert(`Invalid number! ${selectedCountry.name} numbers usually have ${selectedCountry.digits} digits.`);
                    setIsGenerating(false);
                    return;
                }
                body.phoneNumber = fullNumber;
            }

            const res = await fetch(`${baseUrl}${endpoint}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body)
            });

            const data = await res.json();

            if (data.message?.includes('already active')) {
                setViewState('list');
                setIsGenerating(false);
                fetchBackendSessions();
                return;
            }

            if (res.ok) {
                let pollCount = 0;
                const maxPolls = 20; // 60 seconds (20 * 3000ms)

                // Polling logic for QR / Pairing Code / Status
                const pollInterval = setInterval(async () => {
                    pollCount++;
                    try {
                        const sRes = await fetch(`${baseUrl}/session/status/${agentId}`);
                        if (sRes.ok) {
                            const sData = await sRes.json();

                            if (sData.qr) setQrCode(sData.qr);

                            if (sData.pairingCode) {
                                console.log("Frontend received code:", sData.pairingCode);
                                setPairingCode(sData.pairingCode);
                                setIsGenerating(false);
                            }

                            if (sData.status === 'connected') {
                                clearInterval(pollInterval);
                                setPairingCode(""); // clear it
                                setQrCode("");
                                setViewState('list');
                                setIsGenerating(false);
                                alert("Successfully connected Whatsapp Session!");
                                fetchBackendSessions();
                                // Also fetch agents again to reflect new status
                                fetchClientData();
                            }

                            if (sData.status === 'duplicate_rejected') { // Removed 'disconnected' check
                                setIsGenerating(false);
                                setPairingCode("");
                                setQrCode("");
                                clearInterval(pollInterval);
                                alert("Failed: This number is already connected to another agent in the system.");
                                setViewState('list');
                            }

                            // Timeout if no code generated
                            if (pollCount > maxPolls && !sData.pairingCode && type === 'pairing') {
                                clearInterval(pollInterval);
                                setIsGenerating(false);
                                alert("Taking too long to generate code. Please try again or use QR code.");
                            }
                        }
                    } catch (e) { }
                }, 3000);

                (window as any).agencyQrPoll = pollInterval;
            } else {
                const errData = await res.json();
                alert(`Error: ${errData.error || 'Failed to start session'}`);
                setIsGenerating(false);
                setViewState('list');
            }
        } catch (error) {
            console.error("Auth Flow Error:", error);
            alert("Connection Error: Backend unreachable");
            setIsGenerating(false);
            setViewState('list');
        }
    };

    const disconnectAgent = async (agentId: string) => {
        if (!confirm("Disconnect this WhatsApp session?")) return;
        try {
            const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";
            await fetch(`${baseUrl}/session/delete/${agentId}?uid=agency_${clientId}`, { method: "DELETE" });
            fetchBackendSessions();
        } catch (e) { }
    };

    const handleRenewBilling = async () => {
        if (!confirm(`Are you sure you want to renew the billing cycle for ${client?.businessName}? This will reset the tracker to 30 days.`)) return;

        try {
            const { serverTimestamp } = await import("firebase/firestore");
            await updateDoc(doc(db, "agencyClients", clientId), {
                billingCycleStart: serverTimestamp()
            });
            // Re-fetch to update calculation
            fetchClientData();
        } catch (error) {
            console.error("Error renewing billing:", error);
            alert("Failed to renew billing cycle. Check console.");
        }
    };

    if (isLoading) return <div className="p-8 animate-pulse text-indigo-600 font-black">Loading Client Environment...</div>;
    if (!client) return <div className="p-8 text-rose-600 font-bold tracking-tighter uppercase">Client Not Found</div>;

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto pb-24 md:pb-8">
            {/* Top Navigation / Breadcrumbs */}
            <div className="flex items-center gap-4 mb-8">
                <Link
                    href="/owner/agency"
                    className="p-2 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-indigo-600 hover:border-indigo-100 transition-all active:scale-95 shadow-sm"
                >
                    <ChevronLeft size={20} strokeWidth={3} />
                </Link>
                <div>
                    <h1 className="text-xl font-black text-slate-900 tracking-tight leading-none group flex items-center gap-2">
                        {client.businessName}
                        <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-600 text-[9px] font-black uppercase rounded-md border border-emerald-500/10">Agency Managed</span>
                    </h1>
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1">Client: {client.name} • Location: {client.location}</p>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Sidebar - Client Stats & Info */}
                <div className="space-y-6">
                    <div className="bg-white rounded-[32px] p-6 border border-slate-100 shadow-sm">
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Payment Tracking</h3>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-emerald-500 rounded-lg text-white shadow-lg shadow-emerald-100">
                                        <IndianRupee size={16} />
                                    </div>
                                    <span className="text-xs font-black text-slate-900 uppercase">Monthly Fee</span>
                                </div>
                                <span className="text-lg font-black text-slate-900">₹{client.monthlyFee}</span>
                            </div>
                            <div className={`flex items-center justify-between p-4 ${daysLeft <= 3 ? 'bg-rose-50 border-rose-200' : 'bg-slate-50 border-slate-100'} rounded-2xl border`}>
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 ${daysLeft <= 3 ? 'bg-rose-500 shadow-rose-100' : 'bg-amber-500 shadow-amber-100'} rounded-lg text-white shadow-lg`}>
                                        <Clock size={16} />
                                    </div>
                                    <span className={`text-xs font-black uppercase ${daysLeft <= 3 ? 'text-rose-600' : 'text-slate-900'}`}>
                                        {daysLeft < 0 ? 'Overdue' : 'Days Left'}
                                    </span>
                                </div>
                                <span className={`text-lg font-black ${daysLeft <= 3 ? 'text-rose-600 animate-pulse' : 'text-slate-900'}`}>
                                    {daysLeft < 0 ? Math.abs(daysLeft) + 'd' : daysLeft}
                                </span>
                            </div>
                            <button
                                onClick={handleRenewBilling}
                                className="w-full py-3 mt-2 bg-slate-900 hover:bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-md flex items-center justify-center gap-2"
                            >
                                <RefreshCw size={14} /> Mark Paid  & Renew Cycle
                            </button>
                        </div>
                    </div>

                    <div className="bg-slate-900 rounded-[32px] p-6 text-white shadow-2xl shadow-indigo-500/10 overflow-hidden relative group">
                        <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-500/20 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-700" />
                        <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-4">Internal Purpose</h3>
                        <p className="text-sm font-bold text-slate-300 leading-relaxed italic">"{client.purpose || 'No description provided'}"</p>
                    </div>
                </div>

                {/* Right Area - Bot Management */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                            <BotIcon className="text-indigo-600" size={24} />
                            Automation Units
                        </h2>
                        <button
                            onClick={() => {
                                // Reset any stale edit state before opening create form
                                setIsEditModalOpen(false);
                                setEditAgentId(null);
                                setNewAgent({ name: "", role: "Sales Assistant", businessInfo: "", instructions: "" });
                                setViewState('create');
                            }}
                            className="bg-slate-900 hover:bg-indigo-600 text-white px-5 py-2.5 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all active:scale-95 flex items-center gap-2 shadow-xl shadow-slate-900/10"
                        >
                            <Plus size={16} strokeWidth={3} />
                            Add Unit
                        </button>
                    </div>

                    {/* Bot List Pipeline */}
                    <div className="flex flex-col gap-4">
                        {agents.map((agent) => {
                            const isConnected = connectedSessions.includes(agent.id);
                            return (
                                <motion.div
                                    key={agent.id}
                                    layout
                                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                    className="bg-white rounded-[2rem] p-5 md:p-6 border border-slate-100 shadow-sm flex flex-col md:flex-row items-center gap-6 group hover:shadow-xl hover:border-indigo-600/20 transition-all duration-300"
                                >
                                    {/* Identity Block */}
                                    <div className="flex items-center gap-5 w-full md:w-1/3">
                                        <div className="w-16 h-16 rounded-[1.25rem] bg-slate-50 flex items-center justify-center p-1.5 border-2 border-white shadow-inner overflow-hidden group-hover:scale-105 transition-transform shrink-0">
                                            <div className="w-full h-full bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 border border-indigo-100/50">
                                                <Bot size={24} />
                                            </div>
                                        </div>
                                        <div className="truncate">
                                            <h4 className="text-lg font-black text-slate-900 truncate">{agent.name}</h4>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className="text-[10px] font-black uppercase text-indigo-600 tracking-widest px-2 py-0.5 bg-indigo-50 border border-indigo-100 rounded-md truncate max-w-[120px]">{agent.role}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Status Block */}
                                    <div className="flex flex-col md:flex-row items-center justify-between md:justify-around flex-1 w-full border-y md:border-y-0 md:border-x border-slate-100 py-4 md:py-0 gap-4">
                                        <div className="flex flex-col items-center">
                                            <span className="text-[9px] font-black uppercase text-slate-400 tracking-tighter mb-1">Live Status</span>
                                            {isConnected ? (
                                                <div className="flex items-center gap-1.5">
                                                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                                    <span className="text-emerald-500 text-xs font-black uppercase tracking-tight">Active</span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-1.5">
                                                    <span className="w-2 h-2 rounded-full bg-slate-300" />
                                                    <span className="text-slate-400 text-xs font-black uppercase tracking-tight">Offline</span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex flex-col items-center">
                                            <span className="text-[9px] font-black uppercase text-slate-400 tracking-tighter mb-1">Logic Switch</span>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox" className="sr-only peer" checked={agent.isActive ?? true}
                                                    onChange={() => handleToggleActive(agent)}
                                                />
                                                <div className="w-12 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600 shadow-inner"></div>
                                            </label>
                                        </div>
                                    </div>

                                    {/* Actions Block */}
                                    <div className="flex items-center gap-3 w-full md:w-auto justify-end shrink-0">
                                        {!isConnected ? (
                                            <button
                                                onClick={() => startAuthFlow(agent.id)}
                                                className="px-5 py-3 h-[44px] bg-indigo-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-indigo-700 active:scale-95 transition-all shadow-lg shadow-indigo-100 whitespace-nowrap"
                                            >
                                                <QrCode size={14} /> Connect
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => disconnectAgent(agent.id)}
                                                className="px-5 py-3 h-[44px] bg-rose-50 text-rose-600 rounded-2xl text-[11px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-rose-100 active:scale-95 transition-all border border-rose-100 whitespace-nowrap"
                                            >
                                                <Power size={14} /> Disconnect
                                            </button>
                                        )}
                                        <button
                                            onClick={() => handleEditClick(agent)}
                                            className="w-[44px] h-[44px] bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center hover:text-indigo-600 hover:bg-indigo-50 transition-all active:scale-90 shrink-0"
                                            title="Edit Agent Settings"
                                        >
                                            <Edit size={16} />
                                        </button>
                                        <button
                                            onClick={() => setDeleteConfirm({ open: true, agent })}
                                            className="w-[44px] h-[44px] bg-rose-50 text-rose-400 rounded-2xl flex items-center justify-center hover:text-rose-600 hover:bg-rose-100 transition-all active:scale-90 shrink-0 border border-rose-100"
                                            title="Delete Bot"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Overlays / Modals */}
            <AnimatePresence>
                {(viewState === 'create' || isEditModalOpen) && (
                    <div className="fixed inset-0 z-[600] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => {
                                setViewState('list');
                                setIsEditModalOpen(false);
                            }}
                            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                        />
                        <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="relative w-full max-w-lg bg-white rounded-[2.5rem] p-8 shadow-2xl">
                            <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-6">
                                {isEditModalOpen ? "Edit AI Agent" : "Setup New AI Agent"}
                            </h2>
                            <form onSubmit={isEditModalOpen ? handleUpdateAgent : handleCreateAgent} className="space-y-4">
                                <input
                                    required
                                    type="text"
                                    placeholder="Agent Name (e.g. Sales Bot)"
                                    value={newAgent.name}
                                    onChange={e => setNewAgent({ ...newAgent, name: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                />
                                <input
                                    type="text"
                                    placeholder="Bot Role"
                                    value={newAgent.role}
                                    onChange={e => setNewAgent({ ...newAgent, role: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                />
                                <textarea
                                    rows={4}
                                    placeholder="Instructions for the AI"
                                    value={newAgent.instructions}
                                    onChange={e => setNewAgent({ ...newAgent, instructions: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                />
                                <button type="submit" className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-xl shadow-indigo-100 mt-2 transition-all active:scale-95">
                                    {isEditModalOpen ? "Save Changes" : "Deploy Agent"}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}

                {viewState === 'auth' && (
                    <div className="fixed inset-0 z-[600] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setViewState('list')} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
                        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="relative bg-white rounded-[3rem] p-8 flex flex-col items-center text-center shadow-2xl w-full max-w-sm">
                            <button
                                onClick={() => {
                                    if ((window as any).agencyQrPoll) clearInterval((window as any).agencyQrPoll);
                                    setViewState('list');
                                    setPairingCode("");
                                    setPairingNumber("");
                                }}
                                className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-100 text-slate-400 transition-all"
                            >
                                <X size={20} strokeWidth={3} />
                            </button>
                            <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mb-4"><Smartphone className="text-indigo-600" /></div>
                            <h2 className="text-xl font-black text-slate-900 tracking-tight mb-2">Connect Client Device</h2>
                            <p className="text-slate-400 text-[10px] font-bold mb-6 italic px-4 pb-2 border-b border-slate-100">Setup for {client.businessName}</p>

                            {/* Mode Toggle */}
                            <div className="flex bg-slate-100 p-1 rounded-2xl mb-6 w-full">
                                <button
                                    onClick={() => setAuthMode('qr')}
                                    className={`flex-1 py-2 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all ${authMode === 'qr' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}
                                >QR Code</button>
                                <button
                                    onClick={() => setAuthMode('pairing')}
                                    className={`flex-1 py-2 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all ${authMode === 'pairing' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}
                                >Phone Number</button>
                            </div>

                            {authMode === 'qr' ? (
                                <div className="p-4 bg-white border-4 border-slate-100 rounded-[2.5rem] shadow-inner mb-6 relative group">
                                    {qrCode ? (
                                        <QRCode value={qrCode} size={200} />
                                    ) : (
                                        <div className="w-[200px] h-[200px] flex items-center justify-center bg-slate-50 rounded-3xl animate-pulse">
                                            <RefreshCw className="animate-spin text-slate-300" />
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="w-full mb-6">
                                    {!pairingCode ? (
                                        <div className="space-y-4">
                                            <div className="flex gap-2">
                                                <select
                                                    value={selectedCountry.code}
                                                    onChange={(e) => {
                                                        const country = countries.find(c => c.code === e.target.value);
                                                        if (country) setSelectedCountry(country);
                                                    }}
                                                    className="px-3 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-black focus:outline-none focus:ring-2 focus:ring-indigo-500/20 appearance-none cursor-pointer"
                                                >
                                                    {countries.map(c => (
                                                        <option key={c.code} value={c.code}>{c.flag} +{c.code}</option>
                                                    ))}
                                                </select>
                                                <div className="relative flex-1">
                                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 font-black text-sm">+{selectedCountry.code}</span>
                                                    <input
                                                        type="text"
                                                        placeholder={`Enter ${selectedCountry.digits} digits`}
                                                        value={pairingNumber}
                                                        onChange={e => {
                                                            const val = e.target.value.replace(/\D/g, "");
                                                            if (val.length <= selectedCountry.digits) setPairingNumber(val);
                                                        }}
                                                        className="w-full pl-14 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-left text-sm font-black tracking-widest focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                                    />
                                                </div>
                                            </div>
                                            <button
                                                disabled={pairingNumber.length < selectedCountry.digits || isGenerating}
                                                onClick={() => startAuthFlow(activeSessionId, 'pairing')}
                                                className={`w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-xl ${(pairingNumber.length < selectedCountry.digits || isGenerating) ? 'bg-slate-100 text-slate-400 grayscale cursor-not-allowed' : 'bg-slate-900 text-white hover:bg-indigo-600 shadow-indigo-100'}`}
                                            >
                                                {isGenerating ? (
                                                    <span className="flex items-center justify-center gap-2">
                                                        <RefreshCw className="w-3 h-3 animate-spin py-0 my-0" /> Generating Code...
                                                    </span>
                                                ) : "Generate Code"}
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="p-8 bg-indigo-600 rounded-[2.5rem] shadow-xl shadow-indigo-100 flex flex-col items-center">
                                            <span className="text-indigo-200 text-[10px] font-black uppercase tracking-[0.3em] mb-4">Pairing Code</span>
                                            <div className="flex gap-2">
                                                {pairingCode.split("").map((char, i) => (
                                                    <div key={i} className={`w-8 h-10 bg-white/10 rounded-lg flex items-center justify-center text-white text-xl font-black ${i === 3 ? 'mr-2' : ''}`}>
                                                        {char}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="flex flex-col gap-2 w-full">
                                <div className="flex items-center justify-center gap-2 text-emerald-600 font-bold text-[10px] uppercase">
                                    <CheckCircle2 size={14} />
                                    {authMode === 'qr' ? 'Waiting for scan...' : 'Enter code on phone'}
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* ── Delete Bot Confirmation Modal ───────────────── */}
            <AnimatePresence>
                {deleteConfirm.open && deleteConfirm.agent && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={() => !isDeleting && setDeleteConfirm({ open: false, agent: null })}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            transition={{ type: "spring", stiffness: 300, damping: 25 }}
                            onClick={e => e.stopPropagation()}
                            className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl"
                        >
                            {/* Icon */}
                            <div className="w-16 h-16 bg-rose-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
                                <Trash2 className="text-rose-500" size={28} />
                            </div>

                            {/* Title */}
                            <h2 className="text-xl font-black text-slate-800 text-center mb-2">Delete Bot?</h2>
                            <p className="text-slate-500 text-sm text-center mb-1">
                                You are about to permanently delete:
                            </p>
                            <p className="text-indigo-600 font-bold text-sm text-center mb-4 bg-indigo-50 rounded-xl px-4 py-2">
                                {deleteConfirm.agent.name || deleteConfirm.agent.id}
                            </p>

                            {/* Warning */}
                            <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 mb-6">
                                <p className="text-rose-600 text-xs font-semibold text-center">
                                    ⚠️ This will disconnect the WhatsApp session, remove all bot data from Firebase, and cannot be undone.
                                </p>
                            </div>

                            {/* Buttons */}
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setDeleteConfirm({ open: false, agent: null })}
                                    disabled={isDeleting}
                                    className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-2xl text-sm font-bold hover:bg-slate-200 transition-all disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => handleDeleteBot(deleteConfirm.agent!)}
                                    disabled={isDeleting}
                                    className="flex-1 py-3 bg-rose-500 text-white rounded-2xl text-sm font-bold hover:bg-rose-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-rose-100"
                                >
                                    {isDeleting ? (
                                        <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Deleting...</>
                                    ) : (
                                        <><Trash2 size={14} /> Yes, Delete</>
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
