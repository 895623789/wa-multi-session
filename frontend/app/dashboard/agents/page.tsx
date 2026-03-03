"use client";
import React, { useState, useEffect, useCallback } from "react";
import {
    Bot, User, MessageSquare, Settings, Save, Plus, Trash2, Sparkles,
    ShieldCheck, ChevronRight, ChevronLeft, Wand2, Briefcase, PhoneCall,
    CheckCircle2, QrCode, RefreshCw, Smartphone, AlertTriangle, Power,
    MoreVertical, Navigation, HeartHandshake, FileText, Check
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import QRCode from "react-qr-code";
import { useAuth } from "@/components/AuthProvider";
import { doc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";
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

    // Toasts
    const [toastMsg, setToastMsg] = useState<{ title: string, msg: string, type: 'success' | 'error' } | null>(null);

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

    const deleteAgentData = async (agentId: string) => {
        // Remove locally
        const updated = agents.filter(a => a.id !== agentId);
        setAgents(updated);
        localStorage.setItem(`bulkreply_agents_${uid}`, JSON.stringify(updated));

        // Attempt Backend Disconnect
        try {
            const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";
            await fetch(`${baseUrl}/session/delete/${agentId}?uid=${uid}`, { method: "DELETE" });
            await updateDoc(doc(db, "users", uid), { sessions: arrayRemove(agentId) });
            await fetchBackendSessions();
            showToast("Agent Deleted", "All rules and connection removed.", "success");
        } catch (e) {
            showToast("Warning", "Agent deleted locally, but session cleanup failed.", "error");
        }
    };

    const showToast = (title: string, msg: string, type: 'success' | 'error') => {
        setToastMsg({ title, msg, type });
        setTimeout(() => setToastMsg(null), 4000);
    };

    // ─── Connection Logic ─────────────────────────────────────────────────────
    const handleGenerateQR = async () => {
        if (!uid) return;
        setConnectionStatus("Generating connection...");
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
            // If changing number, first disconnect old session on backend
            const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";
            if (isChangingNumber) {
                await fetch(`${baseUrl}/session/delete/${sessionIdToUse}?uid=${uid}`, { method: "DELETE" });
            }

            const res = await fetch(`${baseUrl}/session/start`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ sessionId: sessionIdToUse, uid })
            });
            const data = await res.json();
            setConnectionStatus(data.message || data.error);
            if (data.message?.includes('started')) {
                setIsPolling(true);
            } else if (data.message?.includes('already active')) {
                handleConnectionSuccess(sessionIdToUse);
            }
        } catch (e) {
            setConnectionStatus("Failed to initiate connection. Is the backend running?");
        }
    };

    const handleConnectionSuccess = async (connectedId: string) => {
        setIsPolling(false);
        setQrCode("");

        // Save to firestore
        if (uid) {
            await updateDoc(doc(db, "users", uid), { sessions: arrayUnion(connectedId) });
        }
        await fetchBackendSessions();

        // Save Agent Config
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
            showToast("Agent Created!", `${newAgent.name} is now online.`, "success");
        } else {
            showToast("Number Changed!", "Agent is now connected to the new number.", "success");
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
                    setConnectionStatus("Please scan the QR code with WhatsApp.");
                }
                if (statusData.status === 'connected') {
                    handleConnectionSuccess(activeFullSessionId);
                }
                if (statusData.status === 'duplicate_rejected') {
                    setConnectionStatus(`❌ This WhatsApp number is already connected! Use a different one.`);
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
            showToast("Settings Updated", "Agent configuration saved successfully.", "success");
        }
        resetWizard();
    };

    // ─── UI Renderers ─────────────────────────────────────────────────────────
    const roles = [
        { name: "Sales Rep", icon: Briefcase, desc: "Handles product queries & sales" },
        { name: "Personal Assistant", icon: User, desc: "Manages schedule & reminders" },
        { name: "Customer Support", icon: HeartHandshake, desc: "Answers FAQs & issues" },
        { name: "Girlfriend", icon: Sparkles, desc: "Casual, friendly persona" },
        { name: "Custom Role", icon: Wand2, desc: "Define your own behavior" },
    ];

    const isConnected = (id: string) => connectedSessions.includes(id);

    return (
        <div className="w-full h-full p-4 lg:p-8 flex flex-col items-center bg-slate-50/50 dark:bg-slate-900/50 relative overflow-hidden">

            {/* Header */}
            <header className="w-full max-w-6xl flex justify-between items-center mb-8 relative z-10 transition-all">
                <div>
                    <p className="text-primary text-sm font-bold mb-1 flex items-center gap-1.5 uppercase tracking-wider">
                        <Bot className="w-4 h-4" /> Neural Agents
                    </p>
                    <h2 className="text-3xl font-bold text-slate-800 dark:text-white font-outfit tracking-tight">
                        {viewState === 'list' ? "My AI Team" : viewState === 'wizard' ? (editingAgentId ? "Edit Agent Settings" : "Hire an AI Agent") : "Connect WhatsApp"}
                    </h2>
                </div>
                {viewState === 'list' && (
                    <button
                        onClick={() => { resetWizard(); setViewState('wizard'); }}
                        className="px-5 py-2.5 bg-primary hover:bg-indigo-600 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-indigo-500/25 flex items-center gap-2 hover:-translate-y-0.5"
                    >
                        <Plus className="w-4 h-4" /> Create New Agent
                    </button>
                )}
            </header>

            {/* Toasts */}
            <AnimatePresence>
                {toastMsg && (
                    <motion.div
                        initial={{ opacity: 0, y: -20, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className={`fixed top-6 right-6 z-50 px-5 py-3.5 rounded-2xl shadow-2xl flex items-start gap-3 min-w-[300px] border border-white/20 backdrop-blur-md
                            ${toastMsg.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}
                    >
                        <div className="shrink-0 mt-0.5">
                            {toastMsg.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                        </div>
                        <div>
                            <h4 className="font-bold text-sm tracking-wide">{toastMsg.title}</h4>
                            <p className="text-xs opacity-90 font-medium leading-relaxed">{toastMsg.msg}</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ─── LIST VIEW ─── */}
            {viewState === 'list' && (
                <div className="w-full max-w-6xl relative z-10">
                    {loading ? (
                        <div className="flex justify-center p-12">
                            <RefreshCw className="w-6 h-6 animate-spin text-primary" />
                        </div>
                    ) : agents.length === 0 ? (
                        <div className="glass rounded-[2rem] p-12 text-center flex flex-col items-center justify-center min-h-[50vh] border border-white/40 shadow-soft">
                            <div className="w-20 h-20 bg-blue-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6">
                                <Bot className="w-10 h-10 text-primary" />
                            </div>
                            <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">No Agents Hired Yet</h3>
                            <p className="text-slate-500 max-w-sm mb-8">Create your first AI agent to automate sales, handle customer support, and manage your WhatsApp session.</p>
                            <button
                                onClick={() => { resetWizard(); setViewState('wizard'); }}
                                className="px-6 py-3 bg-primary hover:bg-indigo-600 text-white rounded-xl text-sm font-bold transition-all shadow-xl shadow-indigo-500/25 flex items-center gap-2 hover:-translate-y-1"
                            >
                                <Plus className="w-5 h-5" /> Hire First Agent
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {agents.map(agent => {
                                const live = isConnected(agent.id);
                                return (
                                    <div key={agent.id} className="glass rounded-3xl p-6 border border-white/60 dark:border-slate-700/50 shadow-soft hover:shadow-card transition-all group flex flex-col relative overflow-hidden bg-white/70 dark:bg-slate-800/80">
                                        {/* Status Header */}
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="flex items-center gap-2">
                                                {live ? (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase tracking-wider">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Live
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-100 text-red-700 text-[10px] font-bold uppercase tracking-wider">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span> Offline
                                                    </span>
                                                )}
                                                {!agent.isActive && (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300 text-[10px] font-bold uppercase tracking-wider">
                                                        Paused
                                                    </span>
                                                )}
                                            </div>

                                            {/* AI Toggle */}
                                            <label className="relative inline-flex items-center cursor-pointer" title={agent.isActive ? "Pause AI Replies" : "Resume AI Replies"}>
                                                <input
                                                    type="checkbox"
                                                    className="sr-only peer"
                                                    checked={agent.isActive}
                                                    onChange={() => {
                                                        const updated = { ...agent, isActive: !agent.isActive };
                                                        saveAgentLocally(updated);
                                                    }}
                                                />
                                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-primary"></div>
                                            </label>
                                        </div>

                                        {/* Identity */}
                                        <div className="flex items-center gap-4 mb-6">
                                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-50 to-blue-100 dark:from-slate-700 dark:to-slate-800 border-2 border-white dark:border-slate-600 shadow-sm flex items-center justify-center p-1 shrink-0">
                                                <ImageFallback type={agent.gender} role={agent.role} />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-bold text-slate-800 dark:text-white line-clamp-1">{agent.name}</h3>
                                                <p className="text-xs font-semibold text-primary/80 line-clamp-1">{agent.role}</p>
                                            </div>
                                        </div>

                                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-6 font-medium leading-relaxed flex-1">
                                            {agent.businessInfo || "No business details provided."}
                                        </p>

                                        {/* Actions */}
                                        <div className="grid grid-cols-2 gap-2 mt-auto">
                                            <button
                                                onClick={() => {
                                                    setEditingAgentId(agent.id);
                                                    setDraftAgent(agent);
                                                    setViewState('wizard');
                                                    setWizardStep(1);
                                                }}
                                                className="py-2.5 px-3 bg-slate-100/50 hover:bg-slate-100 dark:bg-slate-700/50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition text-center flex items-center justify-center gap-1.5"
                                            >
                                                <Settings className="w-3.5 h-3.5" /> Edit Rules
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setActiveFullSessionId(agent.id);
                                                    setDraftAgent(agent); // keep in case
                                                    setIsChangingNumber(true);
                                                    handleGenerateQR();
                                                }}
                                                className="py-2.5 px-3 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/20 dark:hover:bg-indigo-900/40 text-indigo-700 dark:text-indigo-400 text-xs font-bold rounded-xl transition text-center flex items-center justify-center gap-1.5"
                                            >
                                                <Smartphone className="w-3.5 h-3.5" /> Reconnect
                                            </button>
                                        </div>

                                        {/* Delete Action Overlay */}
                                        <button
                                            onClick={() => {
                                                if (confirm(`Are you sure you want to fire ${agent.name}? This removes the AI and logs out the WhatsApp session.`)) {
                                                    deleteAgentData(agent.id);
                                                }
                                            }}
                                            className="absolute top-4 right-1/2 translate-x-[200%] opacity-0 group-hover:opacity-100 group-hover:translate-x-0 group-hover:right-4 transition-all duration-300 w-8 h-8 bg-red-100 text-red-600 rounded-lg flex items-center justify-center hover:bg-red-500 hover:text-white"
                                            title="Fire Agent (Delete)"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* ─── CREATION WIZARD / EDIT ─── */}
            {viewState === 'wizard' && (
                <div className="w-full max-w-4xl glass rounded-[2rem] shadow-card relative z-10 overflow-hidden bg-white/60 dark:bg-slate-900/60 border border-white/50 dark:border-slate-800">

                    {/* Wizard Progress Header */}
                    <div className="bg-slate-50/80 dark:bg-slate-800/80 border-b border-slate-100 dark:border-slate-700 px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="flex items-center gap-2">
                            <button onClick={resetWizard} className="p-2 text-slate-400 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-colors mr-2">
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <span className="font-bold text-slate-800 dark:text-white">
                                {editingAgentId ? "Editing:" : "Step"} {editingAgentId ? draftAgent.name : wizardStep}
                            </span>
                            {!editingAgentId && <span className="text-slate-400 font-medium ml-1">of 3</span>}
                        </div>

                        {!editingAgentId && (
                            <div className="flex gap-2 w-full md:w-auto px-4 md:px-0">
                                {[1, 2, 3].map(step => (
                                    <div key={step} className={`h-1.5 rounded-full flex-1 md:w-16 transition-all duration-300 ${step <= wizardStep ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-700'}`} />
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="p-6 md:p-10 hide-scrollbar overflow-y-auto max-h-[70vh]">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={wizardStep}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.2 }}
                                className="w-full"
                            >
                                {/* STEP 1: IDENTITY & ROLE */}
                                {wizardStep === 1 && (
                                    <div className="space-y-8">
                                        <div>
                                            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Give Your Agent a Name</h3>
                                            <p className="text-sm text-slate-500 mb-6">This gives your AI personality and makes commands feel natural.</p>
                                            <input
                                                type="text"
                                                value={draftAgent.name || ""}
                                                onChange={e => setDraftAgent({ ...draftAgent, name: e.target.value })}
                                                placeholder="e.g. Sarah, Max, Jarvis..."
                                                className="w-full bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-4 text-lg font-bold focus:border-primary focus:ring-4 ring-primary/10 outline-none transition-all text-slate-900 dark:text-white shadow-sm"
                                            />
                                        </div>

                                        <div>
                                            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Select a Primary Role</h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                                {roles.map(role => {
                                                    const Icon = role.icon;
                                                    const isSelected = draftAgent.role === role.name;
                                                    return (
                                                        <button
                                                            key={role.name}
                                                            onClick={() => setDraftAgent({ ...draftAgent, role: role.name })}
                                                            className={`text-left p-4 rounded-2xl border-2 transition-all duration-200 ${isSelected
                                                                    ? 'bg-blue-50/50 dark:bg-blue-900/20 border-primary shadow-sm'
                                                                    : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 hover:border-slate-300'
                                                                }`}
                                                        >
                                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${isSelected ? 'bg-primary text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300'}`}>
                                                                <Icon className="w-5 h-5" />
                                                            </div>
                                                            <h4 className={`font-bold text-sm mb-1 ${isSelected ? 'text-primary' : 'text-slate-800 dark:text-white'}`}>{role.name}</h4>
                                                            <p className="text-xs font-medium text-slate-500 line-clamp-2">{role.desc}</p>
                                                        </button>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* STEP 2: PERSONALIZATION */}
                                {wizardStep === 2 && (
                                    <div className="space-y-8">
                                        <div>
                                            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-6">Personalize the AI</h3>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                <div className="space-y-3">
                                                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300 block">Gender Profile</label>
                                                    <div className="flex gap-3">
                                                        {['Female', 'Male', 'Neutral'].map(g => (
                                                            <button
                                                                key={g}
                                                                onClick={() => setDraftAgent({ ...draftAgent, gender: g })}
                                                                className={`flex-1 py-3 px-2 rounded-xl border-2 text-sm font-bold transition-all ${draftAgent.gender === g
                                                                        ? 'border-primary bg-primary text-white shadow-md'
                                                                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                                                                    }`}
                                                            >
                                                                {g}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>

                                                <div className="space-y-3">
                                                    <div className="flex justify-between items-center">
                                                        <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Perceived Age</label>
                                                        <span className="bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-lg text-xs font-bold text-primary">{draftAgent.age} Years</span>
                                                    </div>
                                                    <input
                                                        type="range"
                                                        min="18" max="65"
                                                        value={draftAgent.age}
                                                        onChange={e => setDraftAgent({ ...draftAgent, age: parseInt(e.target.value) })}
                                                        className="w-full h-2.5 bg-slate-200 dark:bg-slate-700 rounded-xl appearance-none cursor-pointer accent-primary mt-4"
                                                    />
                                                    <div className="flex justify-between text-xs font-medium text-slate-400 px-1">
                                                        <span>18 (Gen Z)</span>
                                                        <span>65 (Senior)</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-blue-50/50 dark:bg-slate-800/50 rounded-2xl p-6 border border-blue-100 dark:border-slate-700">
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center"><Navigation className="w-4 h-4" /></div>
                                                <h4 className="font-bold text-slate-800 dark:text-white">Chat Behavior Setting</h4>
                                            </div>
                                            <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                                                <div>
                                                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Auto-Greeting</p>
                                                    <p className="text-xs text-slate-500 mt-1">Send a welcome message to new contacts automatically.</p>
                                                </div>
                                                <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-4">
                                                    <input
                                                        type="checkbox"
                                                        className="sr-only peer"
                                                        checked={draftAgent.autoGreet}
                                                        onChange={e => setDraftAgent({ ...draftAgent, autoGreet: e.target.checked })}
                                                    />
                                                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-primary"></div>
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* STEP 3: RULES & KNOWLEDGE */}
                                {wizardStep === 3 && (
                                    <div className="space-y-8">
                                        <div>
                                            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Train Your Agent</h3>
                                            <p className="text-sm text-slate-500 mb-6">Tell the AI what you sell, and provide rules on how to respond.</p>

                                            <div className="space-y-5">
                                                <div>
                                                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300 block mb-2">Business Data / Offers</label>
                                                    <textarea
                                                        rows={3}
                                                        value={draftAgent.businessInfo || ""}
                                                        onChange={e => setDraftAgent({ ...draftAgent, businessInfo: e.target.value })}
                                                        placeholder="E.g. We sell SAAS subscriptions. Basic tier is $10/mo, Pro is $25/mo..."
                                                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 ring-primary/20 outline-none transition-shadow resize-none"
                                                    />
                                                </div>

                                                <div>
                                                    <div className="flex justify-between items-center mb-2">
                                                        <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                                            <FileText className="w-4 h-4 text-primary" /> Core Prompt (System Instructions)
                                                        </label>
                                                    </div>
                                                    <textarea
                                                        rows={6}
                                                        value={draftAgent.instructions || ""}
                                                        onChange={e => setDraftAgent({ ...draftAgent, instructions: e.target.value })}
                                                        placeholder={DEFAULT_INSTRUCTIONS}
                                                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-4 text-sm font-medium focus:ring-2 ring-primary/20 outline-none transition-shadow resize-none font-mono leading-relaxed"
                                                    />
                                                    <p className="text-[11px] text-slate-400 mt-2">Write clearly. Example: "Never offer discounts unless asked twice."</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl p-5">
                                            <label className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2 mb-1">
                                                <ShieldCheck className="w-4 h-4 text-emerald-500" /> Admin/Owner Numbers
                                            </label>
                                            <p className="text-xs text-slate-500 mb-4 block">AI will obey direct commands from these numbers without sales talk.</p>

                                            <div className="space-y-3">
                                                {(draftAgent.ownerNumbers || [""]).map((num, i) => (
                                                    <div key={i} className="flex items-center gap-2">
                                                        <input
                                                            type="text"
                                                            value={num}
                                                            onChange={e => {
                                                                const newNums = [...(draftAgent.ownerNumbers || [])];
                                                                newNums[i] = e.target.value;
                                                                setDraftAgent({ ...draftAgent, ownerNumbers: newNums });
                                                            }}
                                                            placeholder="e.g. 919876543210"
                                                            className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-sm font-medium focus:ring-2 ring-primary/20 outline-none transition-shadow font-mono"
                                                        />
                                                        {((draftAgent.ownerNumbers?.length || 0) > 1) && (
                                                            <button
                                                                onClick={() => {
                                                                    const newNums = (draftAgent.ownerNumbers || []).filter((_, idx) => idx !== i);
                                                                    setDraftAgent({ ...draftAgent, ownerNumbers: newNums });
                                                                }}
                                                                className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                    </div>
                                                ))}
                                                {((draftAgent.ownerNumbers?.length || 0) < 5) && (
                                                    <button
                                                        onClick={() => setDraftAgent({ ...draftAgent, ownerNumbers: [...(draftAgent.ownerNumbers || []), ""] })}
                                                        className="mt-2 text-xs font-bold text-primary hover:text-indigo-700 flex items-center gap-1 integration-hover p-2 rounded-lg"
                                                    >
                                                        <Plus className="w-3.5 h-3.5" /> Add Number
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    {/* Wizard Footer / Buttons */}
                    <div className="bg-slate-50/80 dark:bg-slate-800/80 border-t border-slate-100 dark:border-slate-700 p-6 flex justify-between items-center rounded-b-[2rem]">
                        <button
                            onClick={editingAgentId ? resetWizard : (wizardStep === 1 ? resetWizard : () => setWizardStep(wizardStep - 1))}
                            className="px-6 py-3 text-sm font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors"
                        >
                            {editingAgentId ? "Cancel" : (wizardStep === 1 ? "Cancel" : "Back")}
                        </button>

                        {editingAgentId ? (
                            <button
                                onClick={handleEditSave}
                                className="px-8 py-3 bg-primary hover:bg-indigo-600 text-white rounded-xl text-sm font-bold transition-all shadow-lg flex items-center gap-2"
                            >
                                <Save className="w-4 h-4" /> Save Changes
                            </button>
                        ) : (
                            wizardStep < 3 ? (
                                <button
                                    onClick={() => setWizardStep(wizardStep + 1)}
                                    // Make sure name is provided to proceed from step 1
                                    disabled={wizardStep === 1 && !draftAgent.name?.trim()}
                                    className="px-8 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-sm font-bold transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    Continue <ChevronRight className="w-4 h-4" />
                                </button>
                            ) : (
                                <button
                                    onClick={handleGenerateQR}
                                    className="px-8 py-3 bg-primary hover:bg-indigo-600 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-indigo-500/25 flex items-center gap-2 hover:-translate-y-0.5"
                                >
                                    <Check className="w-5 h-5" /> Finish & Connect
                                </button>
                            )
                        )}
                    </div>
                </div>
            )}

            {/* ─── QR CONNECTION OVERLAY (Step 4 implicit) ─── */}
            {viewState === 'qr' && (
                <div className="w-full max-w-lg glass rounded-3xl p-8 border border-white/40 shadow-card relative z-20 flex flex-col items-center justify-center animate-in zoom-in-95 bg-white/95 dark:bg-slate-900/95 my-auto">

                    <div className="w-16 h-16 bg-blue-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
                        <Smartphone className="w-8 h-8 text-primary" />
                    </div>

                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2 text-center">
                        {isChangingNumber ? "Connect New Number" : "Connect WhatsApp"}
                    </h2>
                    <p className="text-sm text-slate-500 text-center mb-8 px-4">
                        Open WhatsApp on your phone, go to Linked Devices, and scan this QR code to activate <span className="font-bold text-slate-700 dark:text-white">"{draftAgent.name}"</span>.
                    </p>

                    <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-6 shadow-inner w-full flex items-center justify-center min-h-[256px]">
                        {isPolling && !qrCode ? (
                            <div className="flex flex-col items-center justify-center text-primary">
                                <RefreshCw className="w-8 h-8 animate-spin mb-4" />
                                <span className="text-sm font-bold animate-pulse">Generating Secure QR...</span>
                            </div>
                        ) : qrCode ? (
                            <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-200 relative animate-in fade-in zoom-in duration-300">
                                <QRCode value={qrCode} size={200} />
                                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none rounded-xl"></div>
                            </div>
                        ) : (
                            <div className="text-red-500 text-sm font-bold text-center">
                                <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
                                {connectionStatus}
                            </div>
                        )}
                    </div>

                    <div className="mt-6 flex items-center gap-2 bg-slate-100 dark:bg-slate-800/60 px-4 py-2 rounded-full">
                        <span className="relative flex h-2.5 w-2.5">
                            <span className={`${isPolling ? 'animate-ping' : ''} absolute inline-flex h-full w-full rounded-full bg-primary opacity-75`}></span>
                            <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isPolling ? 'bg-primary' : 'bg-slate-400'}`}></span>
                        </span>
                        <span className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-widest">
                            {connectionStatus || "Awaiting Scan"}
                        </span>
                    </div>

                    <button
                        onClick={resetWizard}
                        className="mt-8 text-sm font-bold text-slate-400 hover:text-slate-600 dark:hover:text-white transition underline underline-offset-4"
                    >
                        Cancel Connection
                    </button>
                </div>
            )}
        </div>
    );
}
