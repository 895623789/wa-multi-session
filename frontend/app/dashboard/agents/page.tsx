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

            {/* ─── CREATION WIZARD / EDIT (now Tabs in a split layout) ─── */}
            {viewState === 'wizard' && (
                <div className="w-full max-w-6xl glass rounded-[2rem] shadow-card relative z-10 overflow-hidden bg-white/60 dark:bg-slate-900/60 border border-white/50 dark:border-slate-800 flex flex-col md:flex-row">

                    {/* LEFT PANEL: TABS & PREVIEW */}
                    <div className="md:w-[320px] bg-white/50 dark:bg-slate-900 border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-700 flex flex-col">
                        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                            <div className="flex items-center gap-3">
                                <button onClick={resetWizard} className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg transition-colors bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                <span className="font-bold text-slate-800 dark:text-white truncate">
                                    {editingAgentId ? draftAgent.name : "New AI Agent"}
                                </span>
                            </div>
                        </div>

                        <div className="p-4 flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-y-auto w-full hide-scrollbar">
                            <button
                                onClick={() => setWizardStep(1)}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all whitespace-nowrap text-left ${wizardStep === 1 ? 'bg-indigo-50 dark:bg-indigo-900/20 text-primary font-bold shadow-sm ring-1 ring-primary/20' : 'text-slate-600 dark:text-slate-400 font-medium hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                            >
                                <User className="w-5 h-5 shrink-0" />
                                <div className="hidden md:block">
                                    <div className="text-sm">Identity & Persona</div>
                                    <div className="text-[10px] font-normal opacity-70 mt-0.5">Name, Role, Voice</div>
                                </div>
                            </button>
                            <button
                                onClick={() => setWizardStep(2)}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all whitespace-nowrap text-left ${wizardStep === 2 ? 'bg-indigo-50 dark:bg-indigo-900/20 text-primary font-bold shadow-sm ring-1 ring-primary/20' : 'text-slate-600 dark:text-slate-400 font-medium hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                            >
                                <Briefcase className="w-5 h-5 shrink-0" />
                                <div className="hidden md:block">
                                    <div className="text-sm">Business logic</div>
                                    <div className="text-[10px] font-normal opacity-70 mt-0.5">Rules, Data, Prompts</div>
                                </div>
                            </button>
                            <button
                                onClick={() => setWizardStep(3)}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all whitespace-nowrap text-left ${wizardStep === 3 ? 'bg-indigo-50 dark:bg-indigo-900/20 text-primary font-bold shadow-sm ring-1 ring-primary/20' : 'text-slate-600 dark:text-slate-400 font-medium hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                            >
                                <ShieldCheck className="w-5 h-5 shrink-0" />
                                <div className="hidden md:block">
                                    <div className="text-sm">Admin & Settings</div>
                                    <div className="text-[10px] font-normal opacity-70 mt-0.5">Owners, Behavior</div>
                                </div>
                            </button>
                        </div>

                        <div className="mt-auto p-4 hidden md:block border-t border-slate-200 dark:border-slate-700">
                            <div className="bg-gradient-to-br from-slate-100 to-white dark:from-slate-800 dark:to-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 relative overflow-hidden">
                                <div className="text-xs font-bold text-slate-500 mb-4 inline-flex items-center gap-1.5 uppercase tracking-wider">
                                    <MessageSquare className="w-3.5 h-3.5" /> Live Preview
                                </div>
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden flex items-center justify-center border-2 border-white dark:border-slate-600 flex-shrink-0">
                                        <ImageFallback type={draftAgent.gender || "Female"} role={draftAgent.role || "Assistant"} />
                                    </div>
                                    <div>
                                        <div className="text-sm font-bold text-slate-800 dark:text-white line-clamp-1">{draftAgent.name || "AI Agent"}</div>
                                        <div className="text-[10px] text-emerald-500 font-medium tracking-wide">Online • {(draftAgent.role || "Agent").split(' ')[0]}</div>
                                    </div>
                                </div>
                                <div className="bg-primary/10 text-primary dark:bg-primary/20 p-2.5 rounded-xl text-xs rounded-tl-none inline-block font-medium w-full">
                                    {draftAgent.autoGreet ? `Hi! I'm ${draftAgent.name || 'your AI'}, how can I help you?` : "Waiting for message..."}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT PANEL: CONTENT */}
                    <div className="flex-1 flex flex-col relative">
                        <div className="p-6 md:p-8 xl:p-10 flex-1 overflow-y-auto max-h-[70vh] hide-scrollbar">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={wizardStep}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.2 }}
                                    className="w-full max-w-2xl mx-auto"
                                >

                                    {/* TAB 1: IDENTITY */}
                                    {wizardStep === 1 && (
                                        <div className="space-y-8">
                                            <div className="border-b border-slate-200 dark:border-slate-700 pb-5 mb-6">
                                                <h3 className="text-2xl font-bold text-slate-800 dark:text-white -mb-1">Identity & Persona</h3>
                                                <p className="text-sm text-slate-500 mt-2">Define who your agent is and how they present themselves.</p>
                                            </div>

                                            <div>
                                                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 block mb-3">Agent Name</label>
                                                <input
                                                    type="text"
                                                    value={draftAgent.name || ""}
                                                    onChange={e => setDraftAgent({ ...draftAgent, name: e.target.value })}
                                                    placeholder="e.g. Sarah, Max, Jarvis..."
                                                    className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-base font-semibold focus:border-primary focus:ring-4 ring-primary/10 outline-none transition-all text-slate-900 dark:text-white shadow-sm"
                                                />
                                            </div>

                                            <div>
                                                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 block mb-4">Primary Role Focus</label>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                    {roles.map(role => {
                                                        const Icon = role.icon;
                                                        const isSelected = draftAgent.role === role.name;
                                                        return (
                                                            <button
                                                                key={role.name}
                                                                onClick={() => setDraftAgent({ ...draftAgent, role: role.name })}
                                                                className={`text-left p-4 rounded-xl border-2 transition-all duration-200 ${isSelected
                                                                    ? 'bg-blue-50/80 dark:bg-blue-900/40 border-primary shadow-sm'
                                                                    : 'bg-white dark:bg-slate-800/50 border-slate-100 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                                                                    }`}
                                                            >
                                                                <div className="flex items-center gap-3 mb-1">
                                                                    <div className={`p-1.5 rounded-lg flex items-center justify-center ${isSelected ? 'bg-primary text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300'}`}>
                                                                        <Icon className="w-4 h-4" />
                                                                    </div>
                                                                    <h4 className={`font-bold text-sm ${isSelected ? 'text-primary' : 'text-slate-800 dark:text-white'}`}>{role.name}</h4>
                                                                </div>
                                                                <p className="text-xs font-medium text-slate-500 mt-1.5 line-clamp-1">{role.desc}</p>
                                                            </button>
                                                        )
                                                    })}
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                                                <div className="space-y-3">
                                                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300 block">Gender Alignment</label>
                                                    <div className="flex bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl">
                                                        {['Female', 'Male', 'Neutral'].map(g => (
                                                            <button
                                                                key={g}
                                                                onClick={() => setDraftAgent({ ...draftAgent, gender: g })}
                                                                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${draftAgent.gender === g
                                                                    ? 'bg-white dark:bg-slate-700 text-primary shadow-sm'
                                                                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
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
                                                        <span className="text-xs font-bold text-primary">{draftAgent.age}</span>
                                                    </div>
                                                    <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                                                        <input
                                                            type="range"
                                                            min="18" max="65"
                                                            value={draftAgent.age}
                                                            onChange={e => setDraftAgent({ ...draftAgent, age: parseInt(e.target.value) })}
                                                            className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-xl appearance-none cursor-pointer accent-primary"
                                                        />
                                                        <div className="flex justify-between text-[10px] uppercase font-bold text-slate-400 mt-2 px-0.5">
                                                            <span>Young</span>
                                                            <span>Mature</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* TAB 2: RULES AND KNOWLEDGE */}
                                    {wizardStep === 2 && (
                                        <div className="space-y-8">
                                            <div className="border-b border-slate-200 dark:border-slate-700 pb-5 mb-6">
                                                <h3 className="text-2xl font-bold text-slate-800 dark:text-white -mb-1">Business Logic</h3>
                                                <p className="text-sm text-slate-500 mt-2">What does your agent know? How should they respond?</p>
                                            </div>

                                            <div>
                                                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between mb-3">
                                                    <span>Business Data / Offers Catalog</span>
                                                    <span className="text-[10px] font-normal px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500">Context</span>
                                                </label>
                                                <div className="relative group">
                                                    <textarea
                                                        rows={4}
                                                        value={draftAgent.businessInfo || ""}
                                                        onChange={e => setDraftAgent({ ...draftAgent, businessInfo: e.target.value })}
                                                        placeholder="Paste price lists, service details, or FAQs here..."
                                                        className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:border-primary focus:ring-4 ring-primary/10 outline-none transition-all resize-none font-sans"
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between mb-3">
                                                    <span className="flex items-center gap-2"><FileText className="w-4 h-4 text-primary" /> Core System Prompt</span>
                                                    <span className="text-[10px] font-normal px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">Instructions</span>
                                                </label>
                                                <div className="relative border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden focus-within:ring-4 ring-primary/10 transition-all focus-within:border-primary">
                                                    <div className="bg-slate-100 dark:bg-slate-800 px-3 py-2 text-[10px] font-mono text-slate-500 border-b border-slate-200 dark:border-slate-700">
                                                        system_directive.txt
                                                    </div>
                                                    <textarea
                                                        rows={7}
                                                        value={draftAgent.instructions || ""}
                                                        onChange={e => setDraftAgent({ ...draftAgent, instructions: e.target.value })}
                                                        placeholder={DEFAULT_INSTRUCTIONS}
                                                        className="w-full bg-slate-50 dark:bg-slate-900/50 px-4 py-3 text-sm font-medium outline-none resize-none font-mono text-slate-700 dark:text-slate-300 leading-relaxed"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* TAB 3: SETTINGS AND ADMIN */}
                                    {wizardStep === 3 && (
                                        <div className="space-y-8">
                                            <div className="border-b border-slate-200 dark:border-slate-700 pb-5 mb-6">
                                                <h3 className="text-2xl font-bold text-slate-800 dark:text-white -mb-1">Admin & Settings</h3>
                                                <p className="text-sm text-slate-500 mt-2">Manage owner controls and behavioral toggles.</p>
                                            </div>

                                            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                                                <div className="p-5 border-b border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/80">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <ShieldCheck className="w-5 h-5 text-emerald-500" />
                                                        <h4 className="font-bold text-slate-800 dark:text-white">Owner Numbers</h4>
                                                    </div>
                                                    <p className="text-xs text-slate-500">The AI will obey direct commands and skip sales spiels for these numbers.</p>
                                                </div>
                                                <div className="p-5 space-y-3">
                                                    {(draftAgent.ownerNumbers || [""]).map((num, i) => (
                                                        <div key={i} className="flex items-center gap-3">
                                                            <div className="flex-1 relative">
                                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">+</span>
                                                                <input
                                                                    type="text"
                                                                    value={num}
                                                                    onChange={e => {
                                                                        const newNums = [...(draftAgent.ownerNumbers || [])];
                                                                        newNums[i] = e.target.value;
                                                                        setDraftAgent({ ...draftAgent, ownerNumbers: newNums });
                                                                    }}
                                                                    placeholder="919876543210"
                                                                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl pl-8 pr-4 py-2.5 text-sm font-medium focus:border-primary focus:ring-2 ring-primary/20 outline-none transition-all font-mono shadow-sm"
                                                                />
                                                            </div>
                                                            {((draftAgent.ownerNumbers?.length || 0) > 1) && (
                                                                <button
                                                                    onClick={() => {
                                                                        const newNums = (draftAgent.ownerNumbers || []).filter((_, idx) => idx !== i);
                                                                        setDraftAgent({ ...draftAgent, ownerNumbers: newNums });
                                                                    }}
                                                                    className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition"
                                                                    title="Remove"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            )}
                                                        </div>
                                                    ))}
                                                    {((draftAgent.ownerNumbers?.length || 0) < 3) && (
                                                        <button
                                                            onClick={() => setDraftAgent({ ...draftAgent, ownerNumbers: [...(draftAgent.ownerNumbers || []), ""] })}
                                                            className="text-xs font-bold text-slate-500 hover:text-primary flex items-center gap-1.5 transition-colors p-1"
                                                        >
                                                            <Plus className="w-3.5 h-3.5" /> Add Another Admin
                                                        </button>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="bg-blue-50/50 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-slate-700 overflow-hidden">
                                                <div className="p-5 flex items-center justify-between">
                                                    <div className="flex items-start gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 mt-0.5"><Navigation className="w-4 h-4" /></div>
                                                        <div>
                                                            <h4 className="font-bold text-slate-800 dark:text-white">Auto-Greeting</h4>
                                                            <p className="text-xs text-slate-500 mt-0.5 w-4/5">Agent initiates contact automatically when a new unread conversation opens.</p>
                                                        </div>
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
                                </motion.div>
                            </AnimatePresence>
                        </div>

                        {/* TABS FOOTER & SAVE BUTTONS */}
                        <div className="p-4 md:p-6 border-t border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-900/80 flex items-center justify-between mt-auto z-20">
                            <div className="hidden sm:block text-xs text-slate-500 font-medium">
                                {draftAgent.name ? `Configuring: ${draftAgent.name}` : "Setup Configuration"}
                            </div>

                            <div className="flex gap-3 w-full sm:w-auto justify-end">
                                {editingAgentId ? (
                                    <button
                                        onClick={handleEditSave}
                                        disabled={!draftAgent.name?.trim()}
                                        className="px-6 py-2.5 bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 dark:hover:bg-slate-600 text-white rounded-xl text-sm font-bold transition-all disabled:opacity-50 flex items-center gap-2"
                                    >
                                        <Save className="w-4 h-4" /> Save Setup
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => {
                                            saveAgentLocally({
                                                id: `dummy-${Date.now()}`, // Temporary ID for pending state if we needed one, or directly generate
                                                name: draftAgent.name || "AI Agent",
                                                role: draftAgent.role || "Assistant",
                                                gender: draftAgent.gender || "Female",
                                                age: draftAgent.age || 25,
                                                businessInfo: draftAgent.businessInfo || "",
                                                instructions: draftAgent.instructions || "",
                                                ownerNumbers: draftAgent.ownerNumbers || [],
                                                replyDelay: draftAgent.replyDelay || 0,
                                                autoGreet: draftAgent.autoGreet ?? true,
                                                isActive: true,
                                                updatedAt: Date.now()
                                            });
                                            showToast("Agent Draft Saved", "You can now connect to WhatsApp.", "success");
                                        }}
                                        disabled={!draftAgent.name?.trim()}
                                        className="px-6 py-2.5 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700 rounded-xl text-sm font-bold transition-all disabled:opacity-50"
                                    >
                                        Quick Save
                                    </button>
                                )}

                                <button
                                    onClick={handleGenerateQR}
                                    disabled={!draftAgent.name?.trim()}
                                    className="px-6 py-2.5 bg-primary hover:bg-indigo-600 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-primary/30 flex items-center gap-2 disabled:opacity-50 disabled:shadow-none"
                                >
                                    <Smartphone className="w-4 h-4" /> Connect WhatsApp
                                </button>
                            </div>
                        </div>

                    </div>
                </div>
            )}

            {/* ─── QR CONNECTION OVERLAY (Triggered by Connect Button) ─── */}
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
