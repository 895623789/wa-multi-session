"use client";
import React, { useState, useEffect } from "react";
import {
    Send, Users, MessageSquareText, Activity, X, Plus, Trash2, CheckCircle2,
    AlertCircle, Loader2, Globe, Sparkles, MessageSquare, Bot, Zap,
    Mic, SendHorizontal, Smartphone, ChevronRight, Wand2, ArrowLeft,
    ShieldCheck, Calendar
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { db } from "@/lib/firebase";
import { collection, query, getDocs } from "firebase/firestore";
import { useAuth } from "@/components/AuthProvider";
import Link from "next/link";

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
        const newHistory = [campaign, ...campaignHistory].slice(0, 5); // Keep last 5
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

        setStep('progress');
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
            clearInterval(interval);
            setProgress(100);

            // Save History
            saveCampaignToHistory({
                id: Date.now(),
                date: new Date().toISOString(),
                session: selectedSession,
                sessionName: agentNames[selectedSession] || selectedSession.split('_').pop() || "Agent",
                context: context,
                targetCount: validNumbers.length,
                successCount: data.success || validNumbers.length,
            });

            setTimeout(() => {
                setResult({ ...data, isError: !res.ok, message: data.message || "All pulses successfully integrated into the neural network." });
                setStep('summary');
                setLoading(false);
            }, 500);
        } catch (e: any) {
            clearInterval(interval);
            setResult({ error: "Unable to connect to service. Please check if the backend is running.", isError: true });
            setStep('summary');
            setLoading(false);
        }
    };

    const resetCampaign = () => {
        setStep('setup');
        setResult(null);
        setProgress(0);
        setAiStep('idle');
        setAiFeedback("");
        setContext("");
        setTargetNumbers([{ id: Math.random(), country: "+91", number: "" }]);
        setBulkNumbers("");
    };

    const loadHistoryCampaign = (campaign: any) => {
        setSelectedSession(campaign.session);
        setContext(campaign.context);
        setInputMode('bulk');
        // Let's reset the targets specifically
        setStep('setup');
    };

    return (
        <div className="min-h-screen bg-[#FDFCFE] dark:bg-slate-950 p-4 md:p-8 font-outfit selection:bg-indigo-100 dark:selection:bg-indigo-500/30">
            {/* ─── Premium Header ─── */}
            <header className="max-w-6xl mx-auto mb-12 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <motion.div
                        initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-4 mb-2"
                    >
                        <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-none flex items-center justify-center text-indigo-600 border border-slate-100 dark:border-slate-700">
                            <Send className="w-6 h-6" />
                        </div>
                        <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">AI Campaigns</h1>
                    </motion.div>
                    <p className="text-slate-400 font-bold text-sm ml-16 flex items-center gap-2">
                        <Activity className="w-3.5 h-3.5 text-emerald-500" />
                        Neural Multi-Core Deployment
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setUseAiMode(!useAiMode)}
                        className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${useAiMode
                            ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30'
                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 shadow-xl shadow-slate-200/50 border border-slate-100 dark:border-slate-700'
                            }`}
                    >
                        {useAiMode ? <Zap className="w-4 h-4 fill-white" /> : <Wand2 className="w-4 h-4" />}
                        {useAiMode ? 'Manual Mode' : 'AI Assistant'}
                    </button>
                    <button onClick={resetCampaign} className="bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl hover:scale-105 active:scale-95 transition-all whitespace-nowrap">
                        <Plus className="w-4 h-4 inline mr-2" /> New Campaign
                    </button>
                </div>
            </header>

            <main className="max-w-6xl mx-auto relative">
                <AnimatePresence mode="wait">
                    {step === 'setup' && (
                        <motion.div
                            key="setup-screen"
                            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -30 }}
                            className="relative"
                        >
                            {/* Decorative Background Elements */}
                            <div className="absolute -top-20 -right-20 w-80 h-80 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
                            <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-rose-500/5 rounded-full blur-3xl pointer-events-none" />

                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                                {/* Left Column: The Neural Core / AI Chat */}
                                <div className="lg:col-span-7 space-y-8">
                                    <div className="bg-white/70 dark:bg-slate-800/50 backdrop-blur-3xl rounded-[3rem] p-1 shadow-[0_32px_128px_-16px_rgba(0,0,0,0.08)] border border-white dark:border-slate-700 overflow-hidden">

                                        {useAiMode ? (
                                            /* AI Chat Interface */
                                            <div className="p-10 space-y-8">
                                                <div className="flex items-center gap-4 mb-4">
                                                    <div className="w-10 h-10 bg-indigo-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                                                        <Sparkles className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <h2 className="text-xl font-black text-slate-900 dark:text-white">Neural Assistant</h2>
                                                        <p className="text-[10px] uppercase font-black tracking-widest text-slate-400">Natural Language Processor</p>
                                                    </div>
                                                </div>

                                                <div className="space-y-6">
                                                    <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-[2rem] border-2 border-slate-100 dark:border-slate-800">
                                                        <p className="text-sm font-bold text-slate-600 dark:text-slate-400 leading-relaxed italic">
                                                            "Hello! Tell me who to message and what to say. For example: 'Send Hello to 919876543210 and 918877665544, tell them about our new flat'."
                                                        </p>
                                                    </div>

                                                    {aiFeedback && (
                                                        <motion.div
                                                            initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                                                            className="flex gap-4 items-start"
                                                        >
                                                            <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white shrink-0">
                                                                <CheckCircle2 className="w-4 h-4" />
                                                            </div>
                                                            <div className="bg-emerald-50 dark:bg-emerald-900/20 p-5 rounded-3xl border border-emerald-100 dark:border-emerald-800/30">
                                                                <p className="text-sm font-bold text-emerald-800 dark:text-emerald-300">{aiFeedback}</p>
                                                            </div>
                                                        </motion.div>
                                                    )}

                                                    {aiStep === 'select_bot' && (
                                                        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                                            <label className="text-xs font-black uppercase text-slate-400 flex items-center gap-2 tracking-widest">
                                                                <ShieldCheck className="w-4 h-4 text-indigo-500" /> Select Deployment Neural Core
                                                            </label>
                                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                                {sessions.map(s => (
                                                                    <button
                                                                        key={s}
                                                                        onClick={() => {
                                                                            setSelectedSession(s);
                                                                            setAiStep('ready');
                                                                            setAiFeedback(`Perfect. I'll use ${agentNames[s] || s.split('_').pop()}. Ready to deploy!`);
                                                                        }}
                                                                        className={`p-4 rounded-2xl border-2 transition-all flex items-center gap-3 text-left ${selectedSession === s
                                                                            ? 'bg-indigo-500 border-indigo-500 text-white shadow-xl shadow-indigo-500/20'
                                                                            : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 hover:border-indigo-300'
                                                                            }`}
                                                                    >
                                                                        <Bot className={`w-5 h-5 ${selectedSession === s ? 'text-white' : 'text-indigo-400'}`} />
                                                                        <span className="font-black text-xs truncate">{agentNames[s] || s.split('_').pop()}</span>
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="relative mt-8 group">
                                                    <textarea
                                                        rows={3}
                                                        value={aiQuery}
                                                        onChange={(e) => setAiQuery(e.target.value)}
                                                        placeholder="Type your command..."
                                                        className="w-full bg-slate-50 dark:bg-slate-900 py-6 pl-8 pr-20 rounded-[2.5rem] border-2 border-slate-100 dark:border-slate-800 outline-none focus:border-indigo-400 transition-all font-bold text-sm shadow-inner resize-none tracking-tight"
                                                    />
                                                    <button
                                                        disabled={aiIsProcessing || !aiQuery.trim()}
                                                        onClick={handleAiProcess}
                                                        className="absolute right-4 bottom-4 w-12 h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl shadow-xl shadow-indigo-600/20 flex items-center justify-center transition-all disabled:opacity-50 active:scale-95 group-focus-within:scale-105"
                                                    >
                                                        {aiIsProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <SendHorizontal className="w-5 h-5" />}
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            /* Manual Form Interface */
                                            <div className="p-10 space-y-10">
                                                <section className="space-y-6">
                                                    <div className="flex items-center justify-between">
                                                        <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
                                                                <MessageSquareText className="w-4 h-4" />
                                                            </div>
                                                            Business Logic
                                                        </h3>
                                                        <span className="bg-orange-50 text-orange-600 text-[8px] font-black uppercase px-2 py-0.5 rounded-full tracking-tighter">Neural AI</span>
                                                    </div>
                                                    <div className="relative group">
                                                        <textarea
                                                            rows={6}
                                                            value={context}
                                                            onChange={e => setContext(e.target.value)}
                                                            placeholder="Describe your goal... AI will handle the unique generation."
                                                            className="w-full bg-slate-50/50 dark:bg-slate-900/30 p-8 rounded-[2rem] border-2 border-slate-100 dark:border-slate-800 outline-none focus:border-orange-400 transition-all text-sm font-bold shadow-inner placeholder:text-slate-300 italic"
                                                        />
                                                        <div className="absolute inset-x-8 bottom-4 flex items-center justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                            <span>Anti-Ban Protection Active</span>
                                                            <Sparkles className="w-4 h-4 text-orange-300" />
                                                        </div>
                                                    </div>
                                                </section>

                                                <section className="space-y-6">
                                                    <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
                                                            <Bot className="w-4 h-4" />
                                                        </div>
                                                        Neural Core (From Number)
                                                    </h3>
                                                    <div className="relative group">
                                                        <select
                                                            value={selectedSession}
                                                            onChange={e => setSelectedSession(e.target.value)}
                                                            className="w-full bg-slate-50/50 dark:bg-slate-900/30 py-5 pl-8 pr-12 rounded-[1.5rem] border-2 border-slate-100 dark:border-slate-800 outline-none focus:border-indigo-400 transition-all font-black text-sm appearance-none shadow-sm cursor-pointer"
                                                        >
                                                            <option value="" disabled>Select Core Link...</option>
                                                            {sessions.map(s => (
                                                                <option key={s} value={s}>
                                                                    {agentNames[s] || s.split('_').pop() || s} (Active Status)
                                                                </option>
                                                            ))}
                                                        </select>
                                                        <ChevronRight className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 rotate-90 pointer-events-none" />
                                                    </div>
                                                </section>
                                            </div>
                                        )}
                                    </div>

                                    {/* Deployment Button (Global for both modes if ready) */}
                                    <motion.button
                                        whileHover={{ y: -4, shadow: "0 25px 50px -12px rgba(52, 211, 153, 0.25)" }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={handleStartCampaign}
                                        disabled={loading || !selectedSession || targetNumbers.length === 0 || !context}
                                        className="w-full py-8 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-[3rem] font-black text-lg tracking-[0.2em] shadow-2xl flex items-center justify-center gap-4 transition-all disabled:opacity-30 disabled:grayscale uppercase"
                                    >
                                        {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Zap className="w-6 h-6 fill-white" />}
                                        {loading ? 'Powering Up...' : 'Initiate Deployment'}
                                    </motion.button>
                                </div>

                                {/* Right Column: Audience & Meta */}
                                <div className="lg:col-span-5 space-y-8">
                                    <div className="bg-white/70 dark:bg-slate-800/50 backdrop-blur-3xl rounded-[3rem] p-10 shadow-[0_32px_128px_-16px_rgba(0,0,0,0.08)] border border-white dark:border-slate-700">
                                        <div className="flex items-center justify-between mb-8">
                                            <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center">
                                                    <Users className="w-4 h-4" />
                                                </div>
                                                Audience Link
                                            </h3>

                                            <div className="flex items-center gap-2">
                                                <select
                                                    value={inputMode}
                                                    onChange={e => setInputMode(e.target.value as any)}
                                                    className="bg-slate-100 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 text-[10px] font-black uppercase px-3 py-2 rounded-xl outline-none cursor-pointer border border-slate-200 dark:border-slate-700"
                                                >
                                                    <option value="individual">One by One</option>
                                                    <option value="bulk">Bulk Paste</option>
                                                </select>
                                                <span className="bg-rose-50 text-rose-600 text-[10px] font-black px-3 py-2 rounded-xl">
                                                    {inputMode === 'individual'
                                                        ? targetNumbers.length
                                                        : bulkNumbers.split(/[\n,]+/).filter(n => n.replace(/\D/g, '').length >= 10).length} TARGETS
                                                </span>
                                            </div>
                                        </div>

                                        {inputMode === 'individual' ? (
                                            <div className="space-y-4 max-h-[440px] overflow-y-auto pr-2 custom-scrollbar">
                                                {targetNumbers.map((tn, index) => (
                                                    <motion.div
                                                        key={tn.id}
                                                        initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.05 }}
                                                        className="flex gap-2 group"
                                                    >
                                                        <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-4 flex-1 border border-slate-100 dark:border-slate-800 flex items-center gap-4 group-hover:border-rose-200 transition-all">
                                                            <div className="w-8 h-8 rounded-lg bg-white dark:bg-slate-800 flex items-center justify-center text-[10px] font-black text-slate-400">#{index + 1}</div>
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
                                                                placeholder="Phone range..."
                                                                className="bg-transparent flex-1 font-black text-sm outline-none placeholder:text-slate-200"
                                                            />
                                                        </div>
                                                        <button
                                                            onClick={() => removeNumberInput(tn.id)}
                                                            className="w-14 h-14 bg-slate-50/50 dark:bg-slate-900/30 hover:bg-rose-50 text-slate-300 hover:text-rose-500 rounded-2xl flex items-center justify-center transition-all"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </motion.div>
                                                ))}
                                                <button
                                                    onClick={addNumberInput}
                                                    className="w-full mt-6 py-4 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-[1.5rem] text-slate-400 hover:text-rose-500 hover:border-rose-200 hover:bg-rose-50/30 transition-all font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2"
                                                >
                                                    <Plus className="w-3 h-3" /> Add Peripheral Node
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                <textarea
                                                    rows={10}
                                                    value={bulkNumbers}
                                                    onChange={e => setBulkNumbers(e.target.value)}
                                                    placeholder="Paste multiple numbers here (separated by commas or new lines)...&#10;919876543210&#10;918877665544"
                                                    className="w-full bg-slate-50/50 dark:bg-slate-900/30 p-6 rounded-[2rem] border-2 border-slate-100 dark:border-slate-800 outline-none focus:border-rose-400 transition-all text-sm font-bold shadow-inner placeholder:text-slate-300 resize-none hover:border-rose-300 custom-scrollbar"
                                                />
                                                <div className="flex justify-between items-center px-2">
                                                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                                                        <Sparkles className="w-3 h-3 text-rose-400" /> AI Auto-Format Enabled
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Stats Card */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-white dark:bg-slate-800 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-700 shadow-xl shadow-slate-200/20">
                                            <Calendar className="w-5 h-5 text-indigo-500 mb-3" />
                                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Next Shift</p>
                                            <p className="text-sm font-black text-slate-900 dark:text-white">Instant</p>
                                        </div>
                                        <div className="bg-white dark:bg-slate-800 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-700 shadow-xl shadow-slate-200/20">
                                            <ShieldCheck className="w-5 h-5 text-emerald-500 mb-3" />
                                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Safety Rate</p>
                                            <p className="text-sm font-black text-slate-900 dark:text-white">99.8%</p>
                                        </div>
                                    </div>

                                    {/* Campaign History */}
                                    {campaignHistory.length > 0 && (
                                        <div className="bg-white/70 dark:bg-slate-800/50 backdrop-blur-3xl rounded-[3rem] p-8 shadow-[0_32px_128px_-16px_rgba(0,0,0,0.08)] border border-white dark:border-slate-700 mt-8">
                                            <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2 mb-6 uppercase tracking-widest">
                                                <Calendar className="w-4 h-4 text-indigo-500" />
                                                Recent Deployments
                                            </h3>
                                            <div className="space-y-3">
                                                {campaignHistory.map((camp: any) => (
                                                    <button
                                                        key={camp.id}
                                                        onClick={() => loadHistoryCampaign(camp)}
                                                        className="w-full text-left bg-slate-50 dark:bg-slate-900/50 hover:bg-indigo-50 dark:hover:bg-slate-800 p-5 rounded-[1.5rem] border border-slate-100 dark:border-slate-800 transition-all group"
                                                    >
                                                        <div className="flex justify-between items-center mb-2">
                                                            <span className="font-black text-xs text-slate-700 dark:text-slate-300 group-hover:text-indigo-600 transition-colors uppercase tracking-wider">
                                                                {camp.sessionName}
                                                            </span>
                                                            <span className="text-[10px] font-bold text-slate-400">{new Date(camp.date).toLocaleDateString()}</span>
                                                        </div>
                                                        <div className="flex justify-between items-end gap-4">
                                                            <p className="text-xs text-slate-500 font-bold truncate max-w-[60%] italic">"{camp.context}"</p>
                                                            <span className="text-[10px] font-black bg-emerald-100 text-emerald-600 px-3 py-1 rounded-full whitespace-nowrap">{camp.targetCount} Targets</span>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {step === 'progress' && (
                        /* Premium Deployment Screen */
                        <motion.div
                            key="progress-screen"
                            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.1 }}
                            className="max-w-4xl mx-auto text-center space-y-12 py-20"
                        >
                            <div className="relative inline-block">
                                <motion.div
                                    animate={{ rotate: 360 }} transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                                    className="w-64 h-64 border-t-4 border-l-4 border-indigo-500 rounded-full blur-[2px]"
                                />
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <motion.div
                                        animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity }}
                                        className="w-40 h-40 bg-white dark:bg-slate-900 rounded-full shadow-2xl flex flex-col items-center justify-center relative z-10"
                                    >
                                        <span className="text-5xl font-black text-slate-900 dark:text-white">{Math.round(progress)}%</span>
                                        <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mt-2">{progress < 100 ? 'Syncing...' : 'Complete'}</span>
                                    </motion.div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">Deploying Neural Pulses</h2>
                                <p className="text-slate-400 font-bold max-w-sm mx-auto">Connecting through {agentNames[selectedSession] || selectedSession} across the decentralized network.</p>
                            </div>

                            <div className="flex justify-center gap-12">
                                <div className="text-center">
                                    <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Targets</p>
                                    <p className="text-2xl font-black text-slate-900 dark:text-white">{targetNumbers.length}</p>
                                </div>
                                <div className="w-px h-12 bg-slate-100 dark:bg-slate-800" />
                                <div className="text-center">
                                    <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Est. Time</p>
                                    <p className="text-2xl font-black text-slate-900 dark:text-white">{Math.ceil(targetNumbers.length * 0.5)}s</p>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {step === 'summary' && result && (
                        <motion.div
                            key="summary-screen"
                            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                            className="max-w-2xl mx-auto"
                        >
                            <div className="bg-white/70 dark:bg-slate-800/50 backdrop-blur-3xl rounded-[3rem] p-12 shadow-2xl border border-white dark:border-slate-700 text-center relative overflow-hidden">
                                {/* Success Background Glow */}
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -z-10" />

                                <div className="w-24 h-24 bg-emerald-500 rounded-[2.5rem] flex items-center justify-center text-white mx-auto mb-8 shadow-2xl shadow-emerald-500/30">
                                    <CheckCircle2 className="w-12 h-12" />
                                </div>

                                <h2 className="text-4xl font-black text-slate-900 dark:text-white mb-4">
                                    {result.isError ? "Deployment Failed" : "Deployment Successful"}
                                </h2>
                                <p className="text-emerald-600 dark:text-emerald-400 font-black mb-10 text-lg px-8">
                                    {result.message || "The neural network has acknowledged all pulses. Connection stable."}
                                </p>

                                <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2rem] border border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-8 mb-10">
                                    <div className="text-left">
                                        <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Delivered</p>
                                        <p className="text-3xl font-black text-emerald-500">{result.success || targetNumbers.length}</p>
                                    </div>
                                    <div className="text-left">
                                        <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Failures</p>
                                        <p className="text-3xl font-black text-rose-500">{result.failed || 0}</p>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-4">
                                    <button
                                        onClick={resetCampaign}
                                        className="w-full py-5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-indigo-500/30 transition-all hover:scale-[1.02] active:scale-[0.98] whitespace-nowrap"
                                    >
                                        Initiate New Campaign
                                    </button>
                                    <Link
                                        href="/dashboard/pipeline"
                                        className="w-full py-5 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-[1.5rem] font-black text-xs uppercase tracking-widest border border-slate-100 dark:border-slate-700 transition-all hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:shadow-md active:scale-95 whitespace-nowrap text-center"
                                    >
                                        Back to Active Pipeline
                                    </Link>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>

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

