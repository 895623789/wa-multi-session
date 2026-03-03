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
import Filter from "bad-words";
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

    const countries = [
        { name: "India", code: "91", flag: "🇮🇳", digits: 10 },
        { name: "Pakistan", code: "92", flag: "🇵🇰", digits: 10 },
        { name: "USA", code: "1", flag: "🇺🇸", digits: 10 },
    ];

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
            setClient({ id: docSnap.id, ...docSnap.data() } as AgencyClient);
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
            const res = await fetch(`${baseUrl}/session/list?uid=agency_${clientId}`);
            if (res.ok) {
                const data = await res.json();
                setConnectedSessions(data.sessions || []);
            }
        } catch (e) {
            console.error("Fetch Sessions Error:", e);
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
            const body: any = {
                uid: `agency_${clientId}`,
                sessionId: agentId,
                instructions: agents.find(a => a.id === agentId)?.instructions || "",
                businessInfo: agents.find(a => a.id === agentId)?.businessInfo || ""
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

            if (res.ok) {
                // Polling logic for QR / Pairing Code / Status
                const pollInterval = setInterval(async () => {
                    try {
                        const sRes = await fetch(`${baseUrl}/session/status/${agentId}`);
                        if (sRes.ok) {
                            const sData = await sRes.json();
                            if (sData.qr) setQrCode(sData.qr);
                            if (sData.pairingCode) {
                                setPairingCode(sData.pairingCode);
                                setIsGenerating(false);
                            }
                            if (sData.status === 'connected') {
                                clearInterval(pollInterval);
                                setViewState('list');
                                setIsGenerating(false);
                                fetchBackendSessions();
                            }
                            if (sData.status === 'disconnected' || sData.status === 'duplicate_rejected') {
                                setIsGenerating(false);
                                clearInterval(pollInterval);
                                // don't close the modal immediately, let the user see it failed, or close it?
                                // actually, we can leave it.
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
            await fetch(`${baseUrl}/session/delete?uid=agency_${clientId}&sessionId=${agentId}`, { method: "DELETE" });
            fetchBackendSessions();
        } catch (e) { }
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
                            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-amber-500 rounded-lg text-white shadow-lg shadow-amber-100">
                                        <Clock size={16} />
                                    </div>
                                    <span className="text-xs font-black text-slate-900 uppercase">Days Left</span>
                                </div>
                                <span className="text-lg font-black text-slate-900">22</span>
                            </div>
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
                            onClick={() => setViewState('create')}
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
                                        <button className="w-[44px] h-[44px] bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center hover:text-indigo-600 hover:bg-indigo-50 transition-all active:scale-90 shrink-0" title="Edit Agent Settings">
                                            <Edit size={16} />
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
                {viewState === 'create' && (
                    <div className="fixed inset-0 z-[600] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setViewState('list')} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
                        <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="relative w-full max-w-lg bg-white rounded-[2.5rem] p-8 shadow-2xl">
                            <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-6">Setup New AI Agent</h2>
                            <form onSubmit={handleCreateAgent} className="space-y-4">
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
                                <button type="submit" className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-xl shadow-indigo-100 mt-2 transition-all active:scale-95">Deploy Agent</button>
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
        </div>
    );
}
