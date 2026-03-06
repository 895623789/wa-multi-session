"use client";
import React, { useState, useEffect } from "react";
import {
    Send, Users, MessageSquareText, Activity, X, Plus, Trash2, CheckCircle2,
    AlertCircle, Loader2, Globe, Sparkles, MessageSquare, Bot, Zap,
    Mic, SendHorizontal, Smartphone, ChevronRight, Wand2, ArrowLeft,
    ShieldCheck, Calendar, History, ListRestart, MoreHorizontal, Check,
    AlertTriangle, ArrowRight, RotateCcw
} from "lucide-react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { db } from "@/lib/firebase";
import { collection, query, getDocs, orderBy, limit } from "firebase/firestore";
import { useAuth } from "@/components/AuthProvider";
import Link from "next/link";
import { useRouter } from "next/navigation";

const COUNTRY_CODES = [
    { code: "+91", name: "India", flag: "🇮🇳" },
    { code: "+92", name: "Pakistan", flag: "🇵🇰" },
    { code: "+1", name: "USA/Canada", flag: "🇺🇸" },
    { code: "+44", name: "UK", flag: "🇬🇧" },
    { code: "+971", name: "UAE", flag: "🇦🇪" },
    { code: "+61", name: "Australia", flag: "🇦🇺" },
];

export default function CampaignsPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [sessions, setSessions] = useState<string[]>([]);
    const [agentNames, setAgentNames] = useState<Record<string, string>>({});
    const [selectedSession, setSelectedSession] = useState("");
    const [targetNumbers, setTargetNumbers] = useState([{ id: Math.random(), country: "+91", number: "" }]);
    const [context, setContext] = useState("");
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState<'setup' | 'progress' | 'summary'>('setup');
    const [progress, setProgress] = useState(0);
    const [result, setResult] = useState<any>(null);

    // AI Assistant States
    const [useAiMode, setUseAiMode] = useState(false);
    const [aiQuery, setAiQuery] = useState("");
    const [aiIsProcessing, setAiIsProcessing] = useState(false);
    const [aiStep, setAiStep] = useState<'idle' | 'parsing' | 'select_bot' | 'ready'>('idle');
    const [aiFeedback, setAiFeedback] = useState("");

    // Number Input Mode
    const [inputMode, setInputMode] = useState<'individual' | 'bulk'>('individual');
    const [bulkNumbers, setBulkNumbers] = useState("");

    // Wizard States
    const [wizardOpen, setWizardOpen] = useState(false);
    const [wizardStep, setWizardStep] = useState(1);
    const [campaignName, setCampaignName] = useState("");

    // Campaign History State
    const [campaignHistory, setCampaignHistory] = useState<any[]>([]);

    useEffect(() => {
        const savedHistory = localStorage.getItem('campaignHistory');
        if (savedHistory) {
            try {
                setCampaignHistory(JSON.parse(savedHistory));
            } catch (e) {
                console.error("Failed to parse history");
            }
        }
    }, []);

    const saveCampaignToHistory = (campaign: any) => {
        const newHistory = [campaign, ...campaignHistory].slice(0, 7); // Keep last 7
        setCampaignHistory(newHistory);
        localStorage.setItem('campaignHistory', JSON.stringify(newHistory));
    };

    const handleAiProcess = async () => {
        if (!aiQuery.trim()) return;
        setAiIsProcessing(true);
        setAiStep('parsing');

        // Simulating AI parsing logic
        setTimeout(() => {
            const numbers = aiQuery.match(/\d{10,12}/g) || [];
            const msg = aiQuery.replace(/\d{10,12}/g, "").replace(/send|to|the|message|/gi, "").trim();

            if (numbers.length > 0) {
                setTargetNumbers(numbers.map(n => ({ id: Math.random(), country: "+91", number: n.slice(-10) })));
                setContext(msg || context);
                setAiStep('select_bot');
                setAiFeedback(`I found ${numbers.length} numbers and your message. Which bot should I use to send this?`);
            } else {
                setAiFeedback("I couldn't find any phone numbers in your message. Try saying 'Send Hello to 91XXXXXXXXXX'.");
                setAiStep('idle');
            }
            setAiIsProcessing(false);
        }, 1500);
    };

    useEffect(() => {
        const fetchSessionsAndAgents = async () => {
            if (!user?.uid) return;
            try {
                // 1. Fetch Agents from Firestore to get Names
                const agentsRef = collection(db, "users", user.uid, "agents");
                const agentsSnap = await getDocs(agentsRef);
                const nameMap: Record<string, string> = {};
                agentsSnap.forEach(doc => {
                    const data = doc.data();
                    nameMap[doc.id] = data.name || "Unnamed Agent";
                });
                setAgentNames(nameMap);

                // 2. Fetch Active Sessions from Backend
                const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";
                const res = await fetch(`${baseUrl}/session/list?uid=${user.uid}`);
                if (!res.ok) throw new Error("Could not fetch sessions");
                const data = await res.json();
                setSessions(data.sessions || []);
                if (data.sessions && data.sessions.length > 0) {
                    setSelectedSession(data.sessions[0]);
                }
            } catch (e) {
                console.error("Fetch sessions failed:", e);
            }
        };
        fetchSessionsAndAgents();
    }, [user?.uid]);

    const addNumberInput = () => {
        setTargetNumbers([...targetNumbers, { id: Math.random(), country: "+91", number: "" }]);
    };

    const removeNumberInput = (id: number) => {
        if (targetNumbers.length > 1) {
            setTargetNumbers(targetNumbers.filter(n => n.id !== id));
        }
    };

    const updateNumber = (id: number, field: 'country' | 'number', value: string) => {
        setTargetNumbers(targetNumbers.map(n => n.id === id ? { ...n, [field]: value } : n));
    };

    const handleStartCampaign = async (e: React.FormEvent) => {
        e.preventDefault();

        // Compute targets based on active mode
        let validNumbers: string[] = [];
        if (inputMode === 'individual') {
            validNumbers = targetNumbers
                .map(n => `${n.country.replace('+', '')}${n.number.trim()}`)
                .filter(n => n.length > 5);
        } else {
            // Bulk parsing
            validNumbers = bulkNumbers
                .split(/[\n,]+/)
                .map(n => n.replace(/\D/g, ''))
                .filter(n => n.length >= 10);
        }

        if (!selectedSession || validNumbers.length === 0 || !context) {
            alert("Please provide context, select a core, and add at least one valid number.");
            return;
        }

        setWizardStep(5);
        setLoading(true);
        setProgress(0);

        // Simulated progress steps for better UX animation
        const interval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 90) {
                    clearInterval(interval);
                    return 90;
                }
                return prev + 10;
            });
        }, 800);

        const enhancedContext = `
            STRATEGIC OBJECTIVE: Generate highly personalized, professional, and ethical WhatsApp outreach.
            
            BUSINESS CONTEXT PROVIDED:
            "${context}"
            
            GUIDELINES FOR GENERATION:
            1. PERSUASIVE COPYWRITING: Use high-conversion marketing principles (AIDA/PAS).
            2. ANTI-BAN PHRASING: Avoid spam-trigger words. Use natural, human-like variations.
            3. PERSONALIZATION: Adapt the tone to be conversational and respectful.
            4. FORMATTING: Use bolding and line breaks for readability. Ensure the language matches the target audience.
            5. CALL TO ACTION: Include a clear next step for the recipient.
        `.trim();

        try {
            const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";
            const res = await fetch(`${baseUrl}/campaign/start`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    sessionId: selectedSession,
                    numbers: validNumbers,
                    businessContext: enhancedContext,
                    enhancedAI: true
                })
            });
            const data = await res.json();
            clearInterval(interval);
            setProgress(100);

            // Save History
            saveCampaignToHistory({
                id: Date.now(),
                name: campaignName || `Campaign ${new Date().toLocaleDateString()}`,
                date: new Date().toISOString(),
                session: selectedSession,
                sessionName: agentNames[selectedSession] || selectedSession.split('_').pop() || "Agent",
                context: context,
                targetCount: validNumbers.length,
                successCount: res.ok ? validNumbers.length : 0,
                numbers: validNumbers,
            });

            setTimeout(() => {
                setResult({
                    isError: !res.ok,
                    message: res.ok ? "All pulses successfully integrated into the neural network." : (data.error || "Deployment failed. Please check core status."),
                    error: !res.ok ? (data.error || "Deployment failed") : null,
                    success: res.ok ? validNumbers.length : 0,
                    failed: res.ok ? 0 : validNumbers.length
                });
                setWizardStep(6);
                setLoading(false);
            }, 500);
        } catch (e: any) {
            clearInterval(interval);
            setResult({
                error: "Unable to connect to service. Please check if the backend is running.",
                isError: true,
                message: "Neural connection timeout. Verification failed."
            });
            setWizardStep(6);
            setLoading(false);
        }
    };

    const resetCampaign = () => {
        setWizardOpen(false);
        setWizardStep(1);
        setResult(null);
        setProgress(0);
        setAiStep('idle');
        setAiFeedback("");
        setContext("");
        setTargetNumbers([{ id: Math.random(), country: "+91", number: "" }]);
        setBulkNumbers("");
        setCampaignName("");
    };

    const loadHistoryCampaign = (campaign: any) => {
        setCampaignName(campaign.name + " (Copy)");
        setSelectedSession(campaign.session);
        setContext(campaign.context);
        setInputMode('bulk');
        setBulkNumbers(campaign.numbers?.join('\n') || "");
        setWizardOpen(true);
        setWizardStep(1);
    };

    return (
        <div className="min-h-screen bg-[#FDFCFE] dark:bg-slate-950 p-4 md:p-8 font-outfit selection:bg-indigo-100 dark:selection:bg-indigo-500/30">
            {/* ─── Premium Header ─── */}
            <header className="max-w-4xl mx-auto mb-12 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <motion.div
                        initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-4 mb-2"
                    >
                        <div className="w-12 h-12 bg-white dark:bg-slate-900 rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-none flex items-center justify-center text-indigo-600 border border-slate-100 dark:border-slate-800">
                            <Send className="w-6 h-6" />
                        </div>
                        <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">Campaigns</h1>
                    </motion.div>
                    <p className="text-slate-400 font-bold text-sm ml-16 flex items-center gap-2">
                        <Activity className="w-3.5 h-3.5 text-emerald-500" />
                        Latest deployments & history
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => {
                            setWizardOpen(true);
                            setWizardStep(1);
                            setCampaignName("");
                            setContext("");
                            setTargetNumbers([{ id: Math.random(), country: "+91", number: "" }]);
                            setBulkNumbers("");
                        }}
                        className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl hover:scale-105 active:scale-95 transition-all whitespace-nowrap flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" /> New Campaign
                    </button>
                </div>
            </header>

            <main className="max-w-4xl mx-auto space-y-12">
                {/* ─── History Section ─── */}
                <section className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-3 uppercase tracking-widest">
                            <History className="w-5 h-5 text-indigo-500" />
                            Recent Campaigns
                        </h2>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Showing last 7</span>
                    </div>

                    <div className="grid gap-4">
                        <AnimatePresence mode="popLayout">
                            {campaignHistory.length === 0 ? (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                    className="bg-white dark:bg-slate-900/50 rounded-[2rem] p-12 border border-dashed border-slate-200 dark:border-slate-800 text-center space-y-4"
                                >
                                    <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto text-slate-300">
                                        <History className="w-8 h-8" />
                                    </div>
                                    <p className="text-slate-400 font-bold">No campaign history found yet.</p>
                                </motion.div>
                            ) : (
                                campaignHistory.map((camp, idx) => (
                                    <motion.div
                                        key={camp.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        className="group bg-white dark:bg-slate-900/50 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-[2rem] p-6 border border-slate-100 dark:border-slate-800 transition-all flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm hover:shadow-xl hover:shadow-slate-200/20"
                                    >
                                        <div className="flex items-center gap-5">
                                            <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center text-indigo-500 group-hover:scale-110 transition-transform">
                                                <Zap className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h3 className="font-black text-slate-900 dark:text-white text-lg leading-none mb-2">{camp.name}</h3>
                                                <div className="flex items-center gap-3 text-xs font-bold text-slate-400">
                                                    <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {new Date(camp.date).toLocaleDateString()}</span>
                                                    <span className="w-1 h-1 bg-slate-200 dark:bg-slate-700 rounded-full" />
                                                    <span className="flex items-center gap-1.5"><Bot className="w-3.5 h-3.5" /> {camp.sessionName}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-6 ml-auto md:ml-0">
                                            <div className="text-right hidden sm:block">
                                                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Success Rate</p>
                                                <p className="text-sm font-black text-emerald-500">100%</p>
                                            </div>
                                            <button
                                                onClick={() => loadHistoryCampaign(camp)}
                                                className="bg-indigo-500 hover:bg-indigo-600 text-white p-4 rounded-2xl shadow-lg shadow-indigo-500/20 transition-all active:scale-90"
                                                title="Re-run Campaign"
                                            >
                                                <RotateCcw className="w-5 h-5 text-white" />
                                            </button>
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </AnimatePresence>
                    </div>
                </section>
            </main>

            {/* ─── Wizard Overlay ─── */}
            <AnimatePresence>
                {wizardOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => wizardOpen && wizardStep !== 5 && setWizardOpen(false)}
                            className="absolute inset-0 bg-slate-950/60 backdrop-blur-md"
                        />

                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[3rem] shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]"
                        >
                            {/* Wizard Progress Bar */}
                            <div className="absolute top-0 left-0 right-0 h-1.5 bg-slate-100 dark:bg-slate-800">
                                <motion.div
                                    className="h-full bg-indigo-500"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${(wizardStep / 6) * 100}%` }}
                                />
                            </div>

                            {/* Wizard Header */}
                            <div className="p-8 pb-4 flex items-center justify-between border-b border-slate-50 dark:border-slate-800/50">
                                <div>
                                    <h2 className="text-xl font-black text-slate-900 dark:text-white">
                                        {wizardStep === 1 && "Campaign Identity"}
                                        {wizardStep === 2 && "The Message"}
                                        {wizardStep === 3 && "Neural Core"}
                                        {wizardStep === 4 && "Target Audience"}
                                        {wizardStep === 5 && "Deploying..."}
                                        {wizardStep === 6 && "Deployment Report"}
                                    </h2>
                                    <p className="text-[10px] font-black uppercase text-indigo-500 tracking-[0.2em]">Step {wizardStep} of 6</p>
                                </div>
                                <button
                                    onClick={() => setWizardOpen(false)}
                                    className="w-10 h-10 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-400 hover:text-rose-500 transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Wizard Content */}
                            <div className="p-8 overflow-y-auto custom-scrollbar flex-1">
                                <AnimatePresence mode="wait">
                                    {wizardStep === 1 && (
                                        <motion.div
                                            key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                                            className="space-y-6"
                                        >
                                            <p className="text-slate-400 font-bold text-sm">Choose a memorable name for your campaign to track it in history.</p>
                                            <input
                                                autoFocus
                                                type="text"
                                                value={campaignName}
                                                onChange={(e) => setCampaignName(e.target.value)}
                                                placeholder="e.g., Summer Sale 2024"
                                                className="w-full bg-slate-50 dark:bg-slate-800/50 p-6 rounded-3xl border-2 border-slate-100 dark:border-slate-800 outline-none focus:border-indigo-500 transition-all font-black text-xl"
                                            />
                                        </motion.div>
                                    )}

                                    {wizardStep === 2 && (
                                        <motion.div
                                            key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                                            className="space-y-6"
                                        >
                                            <p className="text-slate-400 font-bold text-sm">Describe the context of your message. Our Neural AI will generate high-conversion phrasing for you.</p>
                                            <textarea
                                                autoFocus
                                                rows={6}
                                                value={context}
                                                onChange={(e) => setContext(e.target.value)}
                                                placeholder="e.g., Offer 20% discount on web development services for new clients..."
                                                className="w-full bg-slate-50 dark:bg-slate-800/50 p-6 rounded-3xl border-2 border-slate-100 dark:border-slate-800 outline-none focus:border-indigo-500 transition-all font-bold text-lg resize-none"
                                            />
                                        </motion.div>
                                    )}

                                    {wizardStep === 3 && (
                                        <motion.div
                                            key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                                            className="space-y-4"
                                        >
                                            <p className="text-slate-400 font-bold text-sm">Select which WhatsApp core will handle this deployment.</p>
                                            <div className="grid gap-3">
                                                {sessions.map(s => (
                                                    <button
                                                        key={s}
                                                        onClick={() => setSelectedSession(s)}
                                                        className={`p-6 rounded-3xl border-2 transition-all flex items-center justify-between text-left ${selectedSession === s
                                                            ? 'bg-indigo-500 border-indigo-500 text-white shadow-xl shadow-indigo-500/20'
                                                            : 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800 hover:border-indigo-300'
                                                            }`}
                                                    >
                                                        <div className="flex items-center gap-4">
                                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${selectedSession === s ? 'bg-white/20' : 'bg-white dark:bg-slate-800'}`}>
                                                                <Bot className={`w-5 h-5 ${selectedSession === s ? 'text-white' : 'text-indigo-500'}`} />
                                                            </div>
                                                            <div>
                                                                <p className="font-black text-sm uppercase tracking-wider">{agentNames[s] || s.split('_').pop()}</p>
                                                                <p className={`text-[10px] uppercase font-bold ${selectedSession === s ? 'text-indigo-100' : 'text-slate-400'}`}>Neural Core Active</p>
                                                            </div>
                                                        </div>
                                                        {selectedSession === s && <Check className="w-6 h-6" />}
                                                    </button>
                                                ))}
                                            </div>
                                        </motion.div>
                                    )}

                                    {wizardStep === 4 && (
                                        <motion.div
                                            key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                                            className="space-y-6"
                                        >
                                            <div className="flex items-center justify-between">
                                                <p className="text-slate-400 font-bold text-sm">Who should receive these messages?</p>
                                                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                                                    <button
                                                        onClick={() => setInputMode('individual')}
                                                        className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${inputMode === 'individual' ? 'bg-white dark:bg-slate-700 shadow-sm' : 'text-slate-400'}`}
                                                    >Individual</button>
                                                    <button
                                                        onClick={() => setInputMode('bulk')}
                                                        className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${inputMode === 'bulk' ? 'bg-white dark:bg-slate-700 shadow-sm' : 'text-slate-400'}`}
                                                    >Bulk Paste</button>
                                                </div>
                                            </div>

                                            {inputMode === 'individual' ? (
                                                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                                    {targetNumbers.map((tn, idx) => (
                                                        <div key={tn.id} className="flex gap-2">
                                                            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 flex-1 border border-slate-100 dark:border-slate-800 flex items-center gap-4">
                                                                <select
                                                                    value={tn.country}
                                                                    onChange={e => updateNumber(tn.id, 'country', e.target.value)}
                                                                    className="bg-transparent font-black text-xs outline-none w-16"
                                                                >
                                                                    {COUNTRY_CODES.map(c => <option key={c.code} value={c.code}>{c.flag} {c.code}</option>)}
                                                                </select>
                                                                <input
                                                                    type="text" value={tn.number}
                                                                    onChange={e => updateNumber(tn.id, 'number', e.target.value.replace(/\D/g, ""))}
                                                                    placeholder="9876543210"
                                                                    className="bg-transparent flex-1 font-black text-sm outline-none"
                                                                />
                                                            </div>
                                                            <button
                                                                onClick={() => removeNumberInput(tn.id)}
                                                                className="w-14 h-14 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-rose-400"
                                                            ><Trash2 className="w-5 h-5" /></button>
                                                        </div>
                                                    ))}
                                                    <button
                                                        onClick={addNumberInput}
                                                        className="w-full py-4 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-indigo-500 hover:border-indigo-300 transition-all"
                                                    >+ Add Another Number</button>
                                                </div>
                                            ) : (
                                                <textarea
                                                    rows={8}
                                                    value={bulkNumbers}
                                                    onChange={(e) => setBulkNumbers(e.target.value)}
                                                    placeholder="919876543210, 918877665544..."
                                                    className="w-full bg-slate-50 dark:bg-slate-800/50 p-6 rounded-3xl border-2 border-slate-100 dark:border-slate-800 outline-none focus:border-indigo-500 transition-all font-bold text-sm resize-none"
                                                />
                                            )}
                                        </motion.div>
                                    )}

                                    {wizardStep === 5 && (
                                        <motion.div
                                            key="step5" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                                            className="py-20 text-center space-y-12"
                                        >
                                            <div className="relative inline-block">
                                                <motion.div
                                                    animate={{ rotate: 360 }} transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                                                    className="w-48 h-48 border-t-4 border-l-4 border-indigo-500 rounded-full blur-[2px]"
                                                />
                                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                    <motion.div
                                                        animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity }}
                                                        className="w-32 h-32 bg-white dark:bg-slate-800 rounded-full shadow-2xl flex flex-col items-center justify-center relative z-10"
                                                    >
                                                        <span className="text-4xl font-black text-slate-900 dark:text-white">{Math.round(progress)}%</span>
                                                    </motion.div>
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <h3 className="text-2xl font-black text-slate-900 dark:text-white">Neural pulses deploying...</h3>
                                                <p className="text-slate-400 font-bold">Please wait while we establish connections.</p>
                                            </div>
                                        </motion.div>
                                    )}

                                    {wizardStep === 6 && result && (
                                        <motion.div
                                            key="step6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                                            className="text-center space-y-8 py-4"
                                        >
                                            <div className={`w-24 h-24 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-2xl ${result.isError ? 'bg-rose-500 text-white shadow-rose-500/30' : 'bg-emerald-500 text-white shadow-emerald-500/30'}`}>
                                                {result.isError ? <AlertTriangle className="w-12 h-12" /> : <CheckCircle2 className="w-12 h-12" />}
                                            </div>

                                            <div className="space-y-2">
                                                <h2 className="text-3xl font-black text-slate-900 dark:text-white">
                                                    {result.isError ? "Deployment Failed" : "Mission Successful"}
                                                </h2>
                                                <p className="text-slate-400 font-bold px-8">
                                                    {result.message}
                                                </p>
                                            </div>

                                            <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-4">
                                                <div className="text-left">
                                                    <p className="text-[10px] font-black uppercase text-slate-400 mb-1 tracking-widest">Delivered</p>
                                                    <p className="text-2xl font-black text-emerald-500">{result.success || 0}</p>
                                                </div>
                                                <div className="text-left">
                                                    <p className="text-[10px] font-black uppercase text-slate-400 mb-1 tracking-widest">Failures</p>
                                                    <p className="text-2xl font-black text-rose-500">{result.failed || 0}</p>
                                                </div>
                                            </div>

                                            {result.isError && (
                                                <button
                                                    onClick={() => setWizardStep(1)}
                                                    className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black uppercase tracking-widest text-xs"
                                                >
                                                    Edit and Retry
                                                </button>
                                            )}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Wizard Footer */}
                            {wizardStep < 5 && (
                                <div className="p-8 pt-0 flex gap-4">
                                    {wizardStep > 1 && (
                                        <button
                                            onClick={() => setWizardStep(prev => prev - 1)}
                                            className="flex-1 py-5 bg-slate-50 dark:bg-slate-800 text-slate-400 rounded-[1.5rem] font-black text-xs uppercase tracking-widest border border-slate-100 dark:border-slate-800 transition-all"
                                        >Back</button>
                                    )}
                                    <button
                                        disabled={
                                            (wizardStep === 1 && !campaignName) ||
                                            (wizardStep === 2 && !context) ||
                                            (wizardStep === 3 && !selectedSession) ||
                                            (wizardStep === 4 && (inputMode === 'bulk' ? !bulkNumbers : targetNumbers.every(n => !n.number)))
                                        }
                                        onClick={() => {
                                            if (wizardStep < 4) setWizardStep(prev => prev + 1);
                                            else handleStartCampaign(new Event('submit') as any);
                                        }}
                                        className="flex-[2] py-5 bg-indigo-500 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-30"
                                    >
                                        {wizardStep === 4 ? "Begin Deployment" : "Continue"} <ArrowRight className="w-4 h-4" />
                                    </button>
                                </div>
                            )}

                            {wizardStep === 6 && !result.isError && (
                                <div className="p-8 pt-0">
                                    <button
                                        onClick={() => setWizardOpen(false)}
                                        className="w-full py-5 bg-indigo-500 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-500/20"
                                    >Got it, Return to dashboard</button>
                                </div>
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #E2E8F0; border-radius: 20px; }
                .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; }
                @font-face {
                    font-family: 'Outfit';
                    src: url('https://fonts.googleapis.com/css2?family=Outfit:wght@100;400;700;900&display=swap');
                }
            `}</style>
        </div>
    );
}

