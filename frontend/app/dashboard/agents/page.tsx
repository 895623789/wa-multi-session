"use client";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
    Bot, User, MessageSquare, Settings, Save, Plus, Trash2, Sparkles,
    ShieldCheck, ChevronRight, ChevronLeft, Wand2, Briefcase, PhoneCall,
    CheckCircle2, QrCode, RefreshCw, Smartphone, AlertTriangle, Power,
    MoreVertical, Navigation, HeartHandshake, FileText, Check, Search, Languages, X
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import QRCode from "react-qr-code";
import { useAuth } from "@/components/AuthProvider";
import { doc, updateDoc, arrayUnion, arrayRemove, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

// ─── Interfaces ─────────────────────────────────────────────────────────────
interface AgentConfig {
    id: string; // This is also the fullSessionId
    name: string;
    role: string;
    gender: string;
    age: number;
    businessInfo: string;
    instructions: string;
    ownerNumbers: string[];
    replyDelay: number;
    autoGreet: boolean;
    isActive: boolean; // For pause/resume
    updatedAt: number;
}

const DEFAULT_INSTRUCTIONS = `You are a professional real estate agent named [Your Name]. Your goal is to guide clients through buying, selling, or renting properties. Be polite, concise, and helpful. Always ask for their budget and preferred location if they haven't provided it. If a user asks a question outside of real estate, politely redirect the conversation back to properties or our specific offers.`;

// ─── Shared Components ──────────────────────────────────────────────────────
const ImageFallback = ({ type, role }: { type: string, role: string }) => {
    const isFemale = type === 'Female';
    const colorClass = role === 'Girlfriend' ? 'text-pink-400' : isFemale ? 'text-purple-400' : 'text-blue-500';
    return (
        <svg viewBox="0 0 100 100" className={`w-full h-full ${colorClass}`} fill="currentColor">
            <circle cx="50" cy="40" r="25" fillOpacity="0.8" />
            <path d="M10,100 C10,75 30,60 50,60 C70,60 90,75 90,100" fillOpacity="0.9" />
        </svg>
    );
};

// ─── Main Page Component ────────────────────────────────────────────────────
export default function UnifiedAgentsPage() {
    const { user } = useAuth();
    const uid = user?.uid || '';

    const [agents, setAgents] = useState<AgentConfig[]>([]);
    const [connectedSessions, setConnectedSessions] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    // Current App State
    const [viewState, setViewState] = useState<'list' | 'wizard' | 'qr'>('list');

    // Wizard State
    const [wizardStep, setWizardStep] = useState(1);
    const [draftAgent, setDraftAgent] = useState<Partial<AgentConfig>>({
        name: "",
        role: "Sales Representative",
        gender: "Female",
        age: 25,
        businessInfo: "",
        instructions: "",
        ownerNumbers: [""],
        replyDelay: 2,
        autoGreet: true,
        isActive: true,
    });

    // Connection & QR State
    const [qrCode, setQrCode] = useState("");
    const [connectionStatus, setConnectionStatus] = useState("");
    const [isPolling, setIsPolling] = useState(false);
    const [activeFullSessionId, setActiveFullSessionId] = useState("");
    const [isChangingNumber, setIsChangingNumber] = useState(false); // If true, only reconnecting

    // Edit State
    const [editingAgentId, setEditingAgentId] = useState<string | null>(null);

    // Delete Modal State
    const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean, agent: AgentConfig | null, lang: 'en' | 'hi' }>({
        isOpen: false,
        agent: null,
        lang: 'hi'
    });

    // Reconnect Guard State
    const [reconnectGuard, setReconnectGuard] = useState<{ isOpen: boolean, agent: AgentConfig | null }>({
        isOpen: false,
        agent: null
    });

    // Toasts
    const [toastMsg, setToastMsg] = useState<{ title: string, msg: string, type: 'success' | 'error' } | null>(null);

    const showToast = (title: string, msg: string, type: 'success' | 'error') => {
        setToastMsg({ title, msg, type });
        setTimeout(() => setToastMsg(null), 4000);
    };

    // ─── Data Fetching & Sync ──────────────────────────────────────────────────
    const fetchBackendSessions = useCallback(async () => {
        if (!uid) return;
        try {
            const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";
            const res = await fetch(`${baseUrl}/session/list?uid=${uid}`);
            if (res.ok) {
                const data = await res.json();
                setConnectedSessions(data.sessions || []);
            }
        } catch (e) {
            console.error("Fetch Sessions Error:", e);
        }
    }, [uid]);

    const loadLocalAgents = useCallback(() => {
        const savedAgents = localStorage.getItem(`bulkreply_agents_${uid}`);
        if (savedAgents) {
            try { setAgents(JSON.parse(savedAgents)); } catch (e) { }
        }
    }, [uid]);

    useEffect(() => {
        if (uid) {
            loadLocalAgents();
            fetchBackendSessions().then(() => setLoading(false));
        }
    }, [uid, fetchBackendSessions, loadLocalAgents]);

    const saveAgentLocally = (finalAgent: AgentConfig) => {
        const updated = [...agents];
        const idx = updated.findIndex(a => a.id === finalAgent.id);
        if (idx >= 0) updated[idx] = finalAgent;
        else updated.push(finalAgent);

        setAgents(updated);
        localStorage.setItem(`bulkreply_agents_${uid}`, JSON.stringify(updated));
    };

    const deleteAgentAction = async (agentId: string) => {
        // Remove locally
        const updated = agents.filter(a => a.id !== agentId);
        setAgents(updated);
        localStorage.setItem(`bulkreply_agents_${uid}`, JSON.stringify(updated));

        // Attempt Backend Disconnect
        try {
            const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";
            await fetch(`${baseUrl}/session/delete/${agentId}?uid=${uid}`, { method: "DELETE" });

            // Note: In a real app, you'd perform Firebase removal here if needed
            // await updateDoc(doc(db, "users", uid), { sessions: arrayRemove(agentId) });

            await fetchBackendSessions();
            showToast("Agent Deleted", "Recruitment terminated successfully.", "success");
        } catch (e) {
            showToast("Success", "Agent removed from pipeline.", "success");
        }
        setDeleteModal({ isOpen: false, agent: null, lang: 'hi' });
    };

    // ─── Connection Logic ─────────────────────────────────────────────────────
    const handleGenerateQR = async () => {
        if (!uid) return;
        setConnectionStatus("Initiating Secure Pipeline...");
        setQrCode("");
        setIsPolling(false);
        setViewState('qr');

        // If not changing number, generate new ID
        let sessionIdToUse = activeFullSessionId;
        if (!isChangingNumber) {
            const shortId = `agent-${Date.now().toString().slice(-6)}`;
            sessionIdToUse = `${uid}_${shortId}`;
            setActiveFullSessionId(sessionIdToUse);
        }

        try {
            const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";
            if (isChangingNumber) {
                await fetch(`${baseUrl}/session/delete/${sessionIdToUse}?uid=${uid}`, { method: "DELETE" });
            }

            const res = await fetch(`${baseUrl}/session/start`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    sessionId: sessionIdToUse,
                    uid,
                    instructions: draftAgent.instructions,
                    businessInfo: draftAgent.businessInfo,
                    ownerNumber: draftAgent.ownerNumbers?.[0]
                })
            });
            const data = await res.json();
            setConnectionStatus(data.message || data.error);
            if (data.message?.includes('started')) {
                setIsPolling(true);
            } else if (data.message?.includes('already active')) {
                handleConnectionSuccess(sessionIdToUse);
            }
        } catch (e) {
            setConnectionStatus("Connection failed. Is server online?");
        }
    };

    const handleConnectionSuccess = async (connectedId: string) => {
        setIsPolling(false);
        setQrCode("");

        // Sync with backend session count
        await fetchBackendSessions();

        if (!isChangingNumber) {
            const newAgent: AgentConfig = {
                id: connectedId,
                name: draftAgent.name || "AI Agent",
                role: draftAgent.role || "Assistant",
                gender: draftAgent.gender || "Female",
                age: draftAgent.age || 25,
                businessInfo: draftAgent.businessInfo || "",
                instructions: draftAgent.instructions || "",
                ownerNumbers: draftAgent.ownerNumbers?.filter(n => n.trim() !== "") || [],
                replyDelay: draftAgent.replyDelay || 0,
                autoGreet: draftAgent.autoGreet ?? true,
                isActive: true,
                updatedAt: Date.now()
            };
            saveAgentLocally(newAgent);
            showToast("Hired Successfully!", `${newAgent.name} is now active in your pipeline.`, "success");
        } else {
            showToast("Refreshed!", "Session re-linked successfully.", "success");
        }
        resetWizard();
    };

    useEffect(() => {
        if (!isPolling || !activeFullSessionId) return;
        const interval = setInterval(async () => {
            try {
                const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";
                const res = await fetch(`${baseUrl}/session/status/${activeFullSessionId}`);
                const statusData = await res.json();

                if (statusData.qr) {
                    setQrCode(statusData.qr);
                    setConnectionStatus("Step 4: Scan with WhatsApp");
                }
                if (statusData.status === 'connected') {
                    handleConnectionSuccess(activeFullSessionId);
                }
                if (statusData.status === 'duplicate_rejected') {
                    setConnectionStatus("ERROR: Number already linked to another bot.");
                    setQrCode("");
                    setIsPolling(false);
                }
            } catch (e) { }
        }, 2000);
        return () => clearInterval(interval);
    }, [isPolling, activeFullSessionId]);

    // ─── Actions ──────────────────────────────────────────────────────────────
    const resetWizard = () => {
        setViewState('list');
        setWizardStep(1);
        setActiveFullSessionId("");
        setIsChangingNumber(false);
        setDraftAgent({
            name: "",
            role: "Sales Representative",
            gender: "Female",
            age: 25,
            businessInfo: "",
            instructions: "",
            ownerNumbers: [""],
            replyDelay: 2,
            autoGreet: true,
            isActive: true,
        });
        setEditingAgentId(null);
    };

    const handleEditSave = () => {
        if (!editingAgentId) return;
        const existing = agents.find(a => a.id === editingAgentId);
        if (existing) {
            saveAgentLocally({ ...existing, ...draftAgent as any, updatedAt: Date.now() });
            showToast("Configuration Saved", "Agent mental model updated.", "success");
        }
        resetWizard();
    };

    const filteredAgents = useMemo(() => {
        return agents.filter(a =>
            a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            a.role.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [agents, searchTerm]);

    const isStepValid = (step: number) => {
        if (step === 1) return (draftAgent.name?.length || 0) >= 3;
        if (step === 2) return true;
        return true;
    };

    // ─── UI Renderers ─────────────────────────────────────────────────────────
    const rolesList = [
        { name: "Sales Rep", icon: Briefcase, desc: "Handles product queries & sales" },
        { name: "Support AI", icon: HeartHandshake, desc: "Answers FAQs & issues" },
        { name: "Virtual Assistant", icon: User, desc: "Manages schedule & info" },
        { name: "Girlfriend", icon: Sparkles, desc: "Casual, friendly persona" },
        { name: "Custom", icon: Wand2, desc: "Define your own logic" },
    ];

    return (
        <div className="w-full h-full p-4 lg:p-8 flex flex-col items-center bg-slate-50 dark:bg-slate-900 overflow-y-auto">

            {/* HEADER & SEARCH BAR */}
            {viewState === 'list' && (
                <div className="w-full max-w-6xl mb-8 space-y-6 animate-in fade-in slide-in-from-top-4 duration-700">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <Bot className="w-6 h-6 text-primary" />
                                <h2 className="text-3xl font-black text-slate-900 dark:text-white font-outfit">Neural Pipeline</h2>
                            </div>
                            <p className="text-slate-500 text-sm font-semibold tracking-tight">Deploying and managing your high-performance AI workforce.</p>
                        </div>
                        <button
                            onClick={() => { resetWizard(); setViewState('wizard'); }}
                            className="bg-primary hover:bg-indigo-600 text-white px-8 py-3.5 rounded-2xl font-black flex items-center gap-2 transition-all shadow-xl shadow-primary/25 hover:-translate-y-1 active:scale-95"
                        >
                            <Plus className="w-5 h-5" /> Hire New Agent
                        </button>
                    </div>

                    <div className="relative group">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                        <input
                            type="text"
                            placeholder="Search by Agent Name or Role..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 py-5 pl-14 pr-6 rounded-[1.5rem] outline-none focus:border-primary/50 focus:ring-4 ring-primary/5 transition-all font-bold text-slate-800 dark:text-white placeholder:text-slate-300 shadow-sm"
                        />
                    </div>
                </div>
            )}

            {/* Toasts */}
            <AnimatePresence>
                {toastMsg && (
                    <motion.div
                        initial={{ opacity: 0, y: -20, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                        className={`fixed top-8 right-8 z-[100] px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 border border-white/20 backdrop-blur-xl ${toastMsg.type === 'success' ? 'bg-slate-900/90 text-white dark:bg-white dark:text-slate-900' : 'bg-rose-500 text-white'}`}
                    >
                        {toastMsg.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <AlertTriangle className="w-5 h-5" />}
                        <span className="font-black text-sm uppercase tracking-wide">{toastMsg.msg}</span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ─── PIPELINE LIST VIEW ─── */}
            {viewState === 'list' && (
                <div className="w-full max-w-6xl space-y-4 pb-24">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center p-20 gap-4">
                            <RefreshCw className="w-10 h-10 animate-spin text-primary opacity-50" />
                            <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Scanning Pipeline...</p>
                        </div>
                    ) : filteredAgents.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                            className="bg-white dark:bg-slate-800/50 rounded-[3rem] p-20 text-center border-4 border-dashed border-slate-100 dark:border-slate-800"
                        >
                            <Bot className="w-20 h-20 text-slate-200 dark:text-slate-700 mx-auto mb-6" />
                            <h3 className="text-2xl font-black text-slate-800 dark:text-white italic mb-2">"Your Pipeline is Empty"</h3>
                            <p className="text-slate-400 max-w-xs mx-auto font-medium mb-8">Ready to automate your business? Hire your first neural agent today.</p>
                            <button onClick={() => { resetWizard(); setViewState('wizard'); }} className="text-primary font-black uppercase text-sm flex items-center gap-2 mx-auto hover:gap-3 transition-all">
                                Start Recruitment <ChevronRight className="w-4 h-4" />
                            </button>
                        </motion.div>
                    ) : (
                        filteredAgents.map(agent => (
                            <motion.div
                                key={agent.id}
                                layout
                                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                className="bg-white dark:bg-slate-800/80 backdrop-blur-sm rounded-[2rem] p-5 md:p-6 border border-slate-100 dark:border-slate-700/50 shadow-sm flex flex-col md:flex-row items-center gap-6 group hover:shadow-xl hover:border-primary/20 transition-all duration-300"
                            >
                                {/* Identity Block */}
                                <div className="flex items-center gap-5 w-full md:w-1/3">
                                    <div className="w-16 h-16 rounded-[1.25rem] bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-1.5 border-2 border-white dark:border-slate-700 shadow-inner overflow-hidden group-hover:scale-105 transition-transform">
                                        <ImageFallback type={agent.gender} role={agent.role} />
                                    </div>
                                    <div className="truncate">
                                        <h4 className="text-lg font-black text-slate-900 dark:text-white truncate">{agent.name}</h4>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-black uppercase text-primary tracking-widest px-2 py-0.5 bg-primary/10 rounded-md">{agent.role}</span>
                                            <span className="text-[10px] font-bold text-slate-400">ID: {agent.id.slice(-6)}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Status & Toggle Block */}
                                <div className="flex items-center justify-between md:justify-around flex-1 w-full border-y md:border-y-0 md:border-x border-slate-100 dark:border-slate-700 py-4 md:py-0">
                                    <div className="flex flex-col">
                                        <span className="text-[9px] font-black uppercase text-slate-400 tracking-tighter mb-1">Live Status</span>
                                        {!agent.isActive ? (
                                            <div className="flex items-center gap-2">
                                                <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)]" />
                                                <span className="text-amber-500 text-xs font-black uppercase">Paused</span>
                                            </div>
                                        ) : connectedSessions.includes(agent.id) ? (
                                            <div className="flex items-center gap-2">
                                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                                <span className="text-emerald-500 text-xs font-black uppercase">Live</span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2">
                                                <span className="w-2 h-2 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.5)]" />
                                                <span className="text-purple-500 text-xs font-black uppercase tracking-tight">Pending Link</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex flex-col items-center">
                                        <span className="text-[9px] font-black uppercase text-slate-400 tracking-tighter mb-1">Logic Switch</span>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox" className="sr-only peer" checked={agent.isActive}
                                                onChange={() => {
                                                    const updated = { ...agent, isActive: !agent.isActive };
                                                    saveAgentLocally(updated);
                                                    showToast(updated.isActive ? "Logic Resumed" : "Logic Paused", `${agent.name} is now ${updated.isActive ? 'active' : 'idle'}.`, "success");
                                                }}
                                            />
                                            <div className="w-12 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary shadow-inner"></div>
                                        </label>
                                    </div>
                                </div>

                                {/* Actions Block */}
                                <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                                    <button
                                        onClick={() => { setEditingAgentId(agent.id); setDraftAgent(agent); setViewState('wizard'); setWizardStep(1); }}
                                        className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-700 text-slate-400 hover:text-primary hover:bg-blue-50 dark:hover:bg-primary/20 transition-all active:scale-90"
                                        title="Agent Persona"
                                    >
                                        <Settings className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (connectedSessions.includes(agent.id)) {
                                                setReconnectGuard({ isOpen: true, agent });
                                            } else {
                                                setActiveFullSessionId(agent.id);
                                                setIsChangingNumber(true);
                                                setDraftAgent(agent);
                                                handleGenerateQR();
                                            }
                                        }}
                                        className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-700 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-600/20 transition-all active:scale-90"
                                        title="WhatsApp Link"
                                    >
                                        <Smartphone className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={() => setDeleteModal({ isOpen: true, agent, lang: 'hi' })}
                                        className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-700 text-slate-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/20 transition-all active:scale-90"
                                        title="Remove Agent"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>
            )}

            {/* ─── MANDATORY STEPPER (STRICT 3-STEP PROCESS) ─── */}
            {viewState === 'wizard' && (
                <div className="w-full max-w-4xl bg-white dark:bg-slate-800 rounded-[3rem] shadow-soft overflow-hidden border border-slate-100 dark:border-slate-700 flex flex-col min-h-[650px] animate-in zoom-in-95 duration-500">
                    {/* Stepper Header */}
                    <div className="px-10 py-8 bg-slate-50/50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-700">
                        <div className="flex justify-between items-center mb-10">
                            <button onClick={resetWizard} className="flex items-center gap-2 text-slate-400 hover:text-slate-900 dark:hover:text-white font-black uppercase text-[10px] tracking-widest transition-colors">
                                <ChevronLeft className="w-4 h-4" /> Cancel Process
                            </button>
                            <div className="flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-primary" />
                                <span className="text-[10px] font-black uppercase text-slate-800 dark:text-white tracking-widest px-4 py-1.5 bg-white dark:bg-slate-800 rounded-full border border-slate-100 dark:border-slate-700">
                                    Step {wizardStep} of 3
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center gap-6 relative px-2">
                            <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-100 dark:bg-slate-800 -translate-y-1/2 -z-0 rounded-full" />
                            <div
                                className="absolute top-1/2 left-0 h-1 bg-primary -translate-y-1/2 -z-0 rounded-full transition-all duration-700"
                                style={{ width: `${((wizardStep - 1) / 2) * 100}%` }}
                            />

                            {[1, 2, 3].map(step => (
                                <div key={step} className="relative z-10 flex-1 flex flex-col items-center gap-3">
                                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black transition-all duration-500 shadow-sm ${wizardStep >= step ? 'bg-primary text-white scale-110' : 'bg-white dark:bg-slate-800 text-slate-300 border border-slate-100 dark:border-slate-700'}`}>
                                        {wizardStep > step ? <Check className="w-6 h-6" /> : step}
                                    </div>
                                    <span className={`text-[10px] font-black uppercase tracking-tighter ${wizardStep >= step ? 'text-primary' : 'text-slate-400'}`}>
                                        {step === 1 ? "Identity" : step === 2 ? "Knowledge" : "Finalize"}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 p-10 md:p-14 overflow-y-auto hide-scrollbar bg-white dark:bg-slate-800">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={wizardStep}
                                initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }}
                                className="space-y-10"
                            >
                                {wizardStep === 1 && (
                                    <div className="space-y-8">
                                        <div className="text-center md:text-left">
                                            <h3 className="text-3xl font-black text-slate-900 dark:text-white mb-2 font-outfit">Hiring Identity</h3>
                                            <p className="text-slate-400 font-medium italic">"A name shapes the personality. Choose wisely."</p>
                                        </div>

                                        <div className="space-y-3">
                                            <label className="text-xs font-black uppercase text-slate-400 flex items-center gap-2">
                                                Agent Display Name <span className="text-rose-500">*</span>
                                            </label>
                                            <input
                                                type="text" value={draftAgent.name}
                                                onChange={e => setDraftAgent({ ...draftAgent, name: e.target.value })}
                                                placeholder="e.g. Priya (Real Estate Assistant)"
                                                className="w-full bg-slate-50 dark:bg-slate-900/50 py-5 px-8 rounded-[1.5rem] border-2 border-slate-100 dark:border-slate-800 outline-none focus:border-primary transition-all font-black text-xl shadow-inner placeholder:text-slate-300"
                                            />
                                            {(draftAgent.name?.length || 0) < 3 && (
                                                <p className="text-[10px] text-slate-400 font-bold px-2">Minimum 3 characters expected for a professional profile.</p>
                                            )}
                                        </div>

                                        <div className="space-y-4">
                                            <label className="text-xs font-black uppercase text-slate-400">Persona Profile</label>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                {rolesList.map(r => (
                                                    <button
                                                        key={r.name} onClick={() => setDraftAgent({ ...draftAgent, role: r.name })}
                                                        className={`p-5 rounded-[1.5rem] border-2 transition-all text-left flex items-start gap-4 ${draftAgent.role === r.name ? 'border-primary bg-primary/5 shadow-lg scale-[1.02]' : 'border-slate-100 dark:border-slate-800 hover:border-slate-200 bg-slate-50/30'}`}
                                                    >
                                                        <div className={`p-2.5 rounded-xl ${draftAgent.role === r.name ? 'bg-primary text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-400'}`}>
                                                            <r.icon className="w-5 h-5" />
                                                        </div>
                                                        <div>
                                                            <h5 className={`font-black text-sm ${draftAgent.role === r.name ? 'text-primary' : 'text-slate-800 dark:text-white'}`}>{r.name}</h5>
                                                            <p className="text-[10px] text-slate-500 font-medium line-clamp-1">{r.desc}</p>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {wizardStep === 2 && (
                                    <div className="space-y-8">
                                        <div className="text-center md:text-left">
                                            <h3 className="text-3xl font-black text-slate-900 dark:text-white mb-2 font-outfit">Training Module</h3>
                                            <p className="text-slate-400 font-medium italic">"Upload the data and rules for your AI to follow."</p>
                                        </div>

                                        <div className="space-y-6">
                                            <div className="space-y-3">
                                                <label className="text-xs font-black uppercase text-slate-400">Business Knowledge Base</label>
                                                <textarea
                                                    rows={5} value={draftAgent.businessInfo}
                                                    onChange={e => setDraftAgent({ ...draftAgent, businessInfo: e.target.value })}
                                                    placeholder="Example: We provide 2BHK flats in Noida starting at ₹80L. Features: modular kitchen, high security, 24/7 water..."
                                                    className="w-full bg-slate-50 dark:bg-slate-900/50 p-6 rounded-[1.5rem] border-2 border-slate-100 dark:border-slate-800 outline-none focus:border-primary transition-all text-sm font-bold shadow-inner resize-none leading-relaxed"
                                                />
                                            </div>
                                            <div className="space-y-3">
                                                <label className="text-xs font-black uppercase text-slate-400">Mental Map (System Instructions)</label>
                                                <textarea
                                                    rows={5} value={draftAgent.instructions}
                                                    onChange={e => setDraftAgent({ ...draftAgent, instructions: e.target.value })}
                                                    placeholder={DEFAULT_INSTRUCTIONS}
                                                    className="w-full bg-slate-50 dark:bg-slate-900/50 p-6 rounded-[1.5rem] border-2 border-slate-100 dark:border-slate-800 outline-none focus:border-primary transition-all text-sm font-bold shadow-inner resize-none leading-relaxed italic text-slate-600 dark:text-slate-400"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {wizardStep === 3 && (
                                    <div className="space-y-8">
                                        <div className="text-center md:text-left">
                                            <h3 className="text-3xl font-black text-slate-900 dark:text-white mb-2 font-outfit">Protocol Activation</h3>
                                            <p className="text-slate-400 font-medium italic">"Almost there. Secure the session and verify controls."</p>
                                        </div>

                                        <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2rem] space-y-5 border-2 border-slate-100 dark:border-slate-800 shadow-inner">
                                            <label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-2 tracking-widest">
                                                <ShieldCheck className="w-4 h-4 text-emerald-500" /> Admin Access (WhatsApp Number)
                                            </label>
                                            {(draftAgent.ownerNumbers || [""]).map((num, i) => (
                                                <div key={i} className="relative group">
                                                    <Smartphone className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                                                    <input
                                                        type="text" value={num}
                                                        onChange={e => {
                                                            const newNums = [...(draftAgent.ownerNumbers || [])];
                                                            newNums[i] = e.target.value;
                                                            setDraftAgent({ ...draftAgent, ownerNumbers: newNums });
                                                        }}
                                                        placeholder="91xxxxxxxx (Phone number with country code)"
                                                        className="w-full bg-white dark:bg-slate-800 py-4 pl-12 pr-6 rounded-2xl border border-slate-100 dark:border-slate-700 font-black text-sm outline-none focus:border-primary transition-all"
                                                    />
                                                </div>
                                            ))}
                                            <p className="text-[10px] text-slate-400 font-bold italic leading-tight">Admin numbers can control the AI directly and bypass automated sales flows.</p>
                                        </div>

                                        <div className="flex items-center justify-between p-8 bg-blue-50/50 dark:bg-primary/5 rounded-[2rem] border-2 border-blue-50/50 dark:border-slate-800">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 flex items-center justify-center text-primary shadow-sm">
                                                    <Navigation className="w-6 h-6" />
                                                </div>
                                                <div>
                                                    <p className="font-black text-slate-900 dark:text-white">Auto-Greeting Protocol</p>
                                                    <p className="text-[10px] text-slate-500 font-bold">Initiate conversations immediately on new messages.</p>
                                                </div>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox" className="sr-only peer" checked={draftAgent.autoGreet}
                                                    onChange={e => setDraftAgent({ ...draftAgent, autoGreet: e.target.checked })}
                                                />
                                                <div className="w-14 h-7 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-emerald-500 shadow-inner"></div>
                                            </label>
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    {/* Footer Actions (Mandatory Flow) */}
                    <div className="px-10 py-8 bg-slate-50/50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-700 flex justify-between gap-6">
                        <button
                            onClick={() => wizardStep > 1 && setWizardStep(wizardStep - 1)}
                            disabled={wizardStep === 1}
                            className="px-8 py-3.5 font-black text-slate-400 hover:text-slate-900 dark:hover:text-white disabled:opacity-20 transition-all text-xs uppercase tracking-widest"
                        >
                            Previous Phase
                        </button>

                        <div className="flex gap-4">
                            {wizardStep < 3 ? (
                                <button
                                    onClick={() => setWizardStep(wizardStep + 1)}
                                    disabled={!isStepValid(wizardStep)}
                                    className="bg-primary hover:bg-indigo-600 text-white px-10 py-3.5 rounded-2xl font-black transition-all hover:scale-105 active:scale-95 disabled:opacity-50 shadow-xl shadow-primary/20"
                                >
                                    Next Phase
                                </button>
                            ) : (
                                <>
                                    <button
                                        onClick={editingAgentId ? handleEditSave : () => {
                                            saveAgentLocally({
                                                id: `draft-${Date.now()}`, name: draftAgent.name!, role: draftAgent.role!, gender: draftAgent.gender!, age: draftAgent.age!,
                                                businessInfo: draftAgent.businessInfo!, instructions: draftAgent.instructions!, ownerNumbers: draftAgent.ownerNumbers!,
                                                replyDelay: 2, autoGreet: draftAgent.autoGreet!, isActive: true, updatedAt: Date.now()
                                            });
                                            showToast("Recruitment Archived", "Profile saved for later activation.", "success");
                                            resetWizard();
                                        }}
                                        className={`${editingAgentId ? 'bg-primary text-white shadow-xl shadow-primary/20 hover:bg-indigo-600' : 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-white hover:bg-slate-300'} px-8 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all`}
                                    >
                                        {editingAgentId ? 'Update Profile' : 'Save Profile'}
                                    </button>
                                    {!editingAgentId && (
                                        <button
                                            onClick={handleGenerateQR}
                                            className="bg-primary text-white px-10 py-3.5 rounded-2xl font-black shadow-2xl shadow-primary/30 hover:scale-105 transition-all text-xs uppercase tracking-widest flex items-center gap-2"
                                        >
                                            <Smartphone className="w-4 h-4" /> Link & Deploy
                                        </button>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ─── PROFESSIONAL DELETE MODAL (IN-APP) ─── */}
            <AnimatePresence>
                {deleteModal.isOpen && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                            onClick={() => setDeleteModal({ ...deleteModal, isOpen: false })}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 30 }}
                            className="relative w-full max-w-md bg-white dark:bg-slate-800 rounded-[3rem] p-10 shadow-[0_32px_128px_-16px_rgba(0,0,0,0.3)] border border-slate-100 dark:border-slate-700 overflow-hidden"
                        >
                            {/* Warning Banner */}
                            <div className="absolute top-0 left-0 w-full h-2 bg-rose-500" />

                            <div className="flex justify-between items-start mb-8">
                                <div className="w-16 h-16 bg-rose-50 dark:bg-rose-900/20 rounded-[1.5rem] flex items-center justify-center text-rose-500 shadow-inner">
                                    <AlertTriangle className="w-9 h-9" />
                                </div>
                                <button
                                    onClick={() => setDeleteModal({ ...deleteModal, lang: deleteModal.lang === 'hi' ? 'en' : 'hi' })}
                                    className="flex items-center gap-2 px-4 py-2 bg-slate-50 dark:bg-slate-700/50 rounded-full text-[9px] font-black uppercase text-slate-500 hover:text-primary transition-all border border-slate-100 dark:border-slate-700 shadow-sm"
                                >
                                    <Languages className="w-4 h-4" /> {deleteModal.lang === 'hi' ? "Translate to EN" : "हिंदी में देखें"}
                                </button>
                            </div>

                            <h3 className="text-3xl font-black text-slate-900 dark:text-white mb-4 font-outfit leading-tight">
                                {deleteModal.lang === 'hi' ? "एजेंट को बाहर निकालें?" : "Terminate Agent?"}
                            </h3>
                            <p className="text-slate-500 text-sm font-bold leading-relaxed mb-10 opacity-80">
                                {deleteModal.lang === 'hi'
                                    ? `क्या आप वाकई "${deleteModal.agent?.name}" को हटाना चाहते हैं? यह प्रोसेस वापस नहीं किया जा सकता और व्हाट्सएप कनेक्शन टूट जाएगा।`
                                    : `Are you sure you want to fire ${deleteModal.agent?.name}? This action is irreversible and will permanently disconnect their neural processing.`}
                            </p>

                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={() => deleteAgentAction(deleteModal.agent!.id)}
                                    className="w-full py-4 bg-rose-500 hover:bg-rose-600 text-white rounded-[1.25rem] font-black shadow-xl shadow-rose-500/20 transition-all hover:-translate-y-1 active:scale-95 text-xs uppercase tracking-widest"
                                >
                                    {deleteModal.lang === 'hi' ? "हाँ, एजेंट हटाएं" : "Confirm Termination"}
                                </button>
                                <button
                                    onClick={() => setDeleteModal({ ...deleteModal, isOpen: false })}
                                    className="w-full py-4 bg-slate-50 dark:bg-slate-700/50 text-slate-500 dark:text-slate-300 rounded-[1.25rem] font-black transition-all hover:bg-slate-100 dark:hover:bg-slate-700 text-xs uppercase tracking-widest"
                                >
                                    {deleteModal.lang === 'hi' ? "नहीं, वापस जाएं" : "Cancel & Keep"}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* ─── RECONNECT GUARD MODAL ─── */}
            <AnimatePresence>
                {reconnectGuard.isOpen && (
                    <div className="fixed inset-0 z-[250] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                            onClick={() => setReconnectGuard({ ...reconnectGuard, isOpen: false })}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 30 }}
                            className="relative w-full max-w-md bg-white dark:bg-slate-800 rounded-[3rem] p-10 shadow-2xl border border-slate-100 dark:border-slate-700 overflow-hidden text-center"
                        >
                            <div className="w-20 h-20 bg-amber-50 dark:bg-amber-900/20 rounded-[2rem] flex items-center justify-center text-amber-500 mx-auto mb-6 shadow-inner">
                                <AlertTriangle className="w-10 h-10" />
                            </div>

                            <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-4 font-outfit">
                                पहले से लिंक है! (Link Detected)
                            </h3>
                            <p className="text-slate-500 text-sm font-bold leading-relaxed mb-8 opacity-80">
                                यह एजेंट पहले से व्हाट्सएप से जुड़ा हुआ है। नया नंबर जोड़ने के लिए आपको पुराने कनेक्शन को तोड़ना (Unlink) पड़ेगा।
                                <br /><span className="text-[10px] uppercase tracking-widest text-slate-400 mt-2 block">(You must unlink before connecting a new number)</span>
                            </p>

                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={async () => {
                                        const agentId = reconnectGuard.agent!.id;
                                        try {
                                            const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";
                                            await fetch(`${baseUrl}/session/delete/${agentId}?uid=${uid}`, { method: "DELETE" });
                                            await fetchBackendSessions();
                                            showToast("Unlinked Successfully", "Connection broken. You can now link a new number.", "success");

                                            const agent = reconnectGuard.agent!;
                                            setReconnectGuard({ isOpen: false, agent: null });
                                            setActiveFullSessionId(agent.id);
                                            setIsChangingNumber(true);
                                            setDraftAgent(agent);
                                            handleGenerateQR();
                                        } catch (e) {
                                            showToast("Error", "Failed to unlink session.", "error");
                                        }
                                    }}
                                    className="w-full py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-[1.25rem] font-black shadow-xl shadow-purple-500/20 transition-all hover:-translate-y-1 active:scale-95 text-xs uppercase tracking-widest"
                                >
                                    पुरानी लिंक तोड़ें (Unlink Old Connection)
                                </button>
                                <button
                                    onClick={() => setReconnectGuard({ isOpen: false, agent: null })}
                                    className="w-full py-4 bg-slate-50 dark:bg-slate-700/50 text-slate-500 dark:text-slate-300 rounded-[1.25rem] font-black transition-all hover:bg-slate-100 dark:hover:bg-slate-700 text-xs uppercase tracking-widest"
                                >
                                    कैंसिल (Cancel)
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* ─── MODAL QR CONNECTION OVERLAY ─── */}
            <AnimatePresence>
                {viewState === 'qr' && (
                    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-slate-900/80 backdrop-blur-md"
                            onClick={resetWizard}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 40 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 40 }}
                            transition={{ type: "spring", damping: 20 }}
                            className="relative w-full max-w-sm bg-white dark:bg-slate-800 rounded-[3rem] p-6 md:p-8 flex flex-col items-center text-center shadow-[0_64px_128px_-16px_rgba(0,0,0,0.5)] border border-white/10"
                        >
                            {/* Close Button */}
                            <button
                                onClick={resetWizard}
                                className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all active:scale-95 z-20"
                            >
                                <X size={20} strokeWidth={3} />
                            </button>

                            <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center mb-4 shadow-inner border-2 border-white dark:border-slate-700">
                                <QrCode className="w-6 h-6 text-primary" />
                            </div>

                            <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-1 font-outfit">Bridge Connection</h3>
                            <p className="text-[10px] text-slate-400 mb-6 font-bold px-4">Open WhatsApp → Linked Devices → Scan QR</p>

                            <div className="bg-slate-50 dark:bg-slate-900 shadow-inner p-4 rounded-[2rem] border-2 border-slate-100 dark:border-slate-800 w-full flex items-center justify-center min-h-[240px] relative overflow-hidden group">
                                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-50 group-hover:opacity-100 transition-opacity" />

                                {isPolling && !qrCode ? (
                                    <div className="flex flex-col items-center gap-4">
                                        <RefreshCw className="w-10 h-10 animate-spin text-primary" />
                                        <p className="text-[9px] font-black uppercase tracking-widest text-primary animate-pulse">Generating...</p>
                                    </div>
                                ) : qrCode ? (
                                    <motion.div
                                        initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                                        className="bg-white p-4 rounded-[1.5rem] shadow-xl relative z-10"
                                    >
                                        <QRCode value={qrCode} size={180} />
                                    </motion.div>
                                ) : (
                                    <div className="flex flex-col items-center gap-3 py-4">
                                        <AlertTriangle className="w-10 h-10 text-rose-500" />
                                        <p className="text-rose-500 font-black uppercase text-[10px] tracking-tighter px-6 leading-tight max-w-[200px]">{connectionStatus}</p>
                                        <button onClick={handleGenerateQR} className="text-[9px] font-black uppercase tracking-widest text-primary hover:underline">Retry</button>
                                    </div>
                                )}
                            </div>

                            <div className="mt-6 flex items-center gap-3 bg-slate-50 dark:bg-slate-900/50 px-6 py-2 rounded-full border border-slate-100 dark:border-slate-700">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                </span>
                                <span className="text-[9px] font-black uppercase text-slate-500 dark:text-slate-300 tracking-widest">{connectionStatus}</span>
                            </div>

                            <button
                                onClick={resetWizard}
                                className="mt-6 text-slate-400 hover:text-slate-900 dark:hover:text-white font-black text-[10px] uppercase tracking-widest transition-all hover:underline underline-offset-4"
                            >
                                Abort Deployment
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

