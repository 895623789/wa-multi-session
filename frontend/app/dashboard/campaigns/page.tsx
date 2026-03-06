"use client";
import React, { useState, useEffect } from "react";
import { Send, Users, MessageSquareText, Activity, X, Plus, Trash2, CheckCircle2, AlertCircle, Loader2, Globe } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const COUNTRY_CODES = [
    { code: "+91", name: "India", flag: "🇮🇳" },
    { code: "+92", name: "Pakistan", flag: "🇵🇰" },
    { code: "+1", name: "USA/Canada", flag: "🇺🇸" },
    { code: "+44", name: "UK", flag: "🇬🇧" },
    { code: "+971", name: "UAE", flag: "🇦🇪" },
    { code: "+61", name: "Australia", flag: "🇦🇺" },
];

export default function CampaignsPage() {
    const [sessions, setSessions] = useState<string[]>([]);
    const [selectedSession, setSelectedSession] = useState("");
    const [targetNumbers, setTargetNumbers] = useState([{ id: Math.random(), country: "+91", number: "" }]);
    const [context, setContext] = useState("");
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState<'setup' | 'progress' | 'summary'>('setup');
    const [progress, setProgress] = useState(0);
    const [result, setResult] = useState<any>(null);

    useEffect(() => {
        const fetchSessions = async () => {
            try {
                const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";
                const res = await fetch(`${baseUrl}/session/list`);
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
        fetchSessions();
    }, []);

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
        const validNumbers = targetNumbers
            .map(n => `${n.country.replace('+', '')}${n.number.trim()}`)
            .filter(n => n.length > 5);

        if (!selectedSession || validNumbers.length === 0 || !context) return;

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
            const data = await res.json();
            clearInterval(interval);
            setProgress(100);

            setTimeout(() => {
                setResult({ ...data, isError: !res.ok });
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
    };

    return (
        <div className="w-full h-full min-h-screen p-4 lg:p-8 flex flex-col bg-slate-50 dark:bg-slate-900 overflow-y-auto pb-32">
            {/* Header */}
            <div className="w-full max-w-4xl mb-6 mx-auto">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                        <Send className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white font-outfit uppercase tracking-tight">AI Campaigns</h2>
                        <p className="text-slate-500 text-xs font-bold uppercase tracking-widest opacity-60">Neural Multi-Core Deployment</p>
                    </div>
                </div>
            </div>

            <main className="w-full max-w-4xl mx-auto">
                <AnimatePresence mode="wait">
                    {step === 'setup' && (
                        <motion.div
                            key="setup"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xl shadow-slate-200/50 dark:shadow-none overflow-hidden"
                        >
                            <form onSubmit={handleStartCampaign} className="p-6 md:p-8 space-y-8">
                                {/* Session Selection */}
                                <div className="space-y-3">
                                    <label className="flex items-center gap-2 text-sm font-black text-slate-700 dark:text-slate-300 uppercase tracking-tighter">
                                        <Activity className="w-4 h-4 text-blue-500" /> 01. Select WhatsApp Core
                                    </label>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                        {sessions.map(s => (
                                            <button
                                                key={s}
                                                type="button"
                                                onClick={() => setSelectedSession(s)}
                                                className={`p-4 rounded-2xl border-2 text-left transition-all relative overflow-hidden group ${selectedSession === s
                                                    ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-900/20'
                                                    : 'border-slate-100 dark:border-slate-700 hover:border-slate-200'
                                                    }`}
                                            >
                                                {selectedSession === s && (
                                                    <motion.div layoutId="active-session" className="absolute top-2 right-2 text-blue-600">
                                                        <CheckCircle2 className="w-4 h-4" />
                                                    </motion.div>
                                                )}
                                                <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">Session ID</p>
                                                <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{s}</p>
                                            </button>
                                        ))}
                                        {sessions.length === 0 && (
                                            <div className="md:col-span-2 p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 text-amber-700 dark:text-amber-400 text-sm font-medium">
                                                No active sessions found. Please connect a device first.
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Target Numbers */}
                                <div className="space-y-3">
                                    <label className="flex items-center gap-2 text-sm font-black text-slate-700 dark:text-slate-300 uppercase tracking-tighter">
                                        <Users className="w-4 h-4 text-emerald-500" /> 02. Target Audience
                                    </label>
                                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                        {targetNumbers.map((n, index) => (
                                            <motion.div
                                                key={n.id}
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                className="flex items-center gap-2"
                                            >
                                                <span className="w-8 text-[10px] font-black text-slate-300">#{index + 1}</span>
                                                <div className="flex-1 flex gap-2">
                                                    <div className="relative w-32 shrink-0">
                                                        <Globe className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                                        <select
                                                            value={n.country}
                                                            onChange={(e) => updateNumber(n.id, 'country', e.target.value)}
                                                            className="w-full pl-9 pr-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all appearance-none"
                                                        >
                                                            {COUNTRY_CODES.map(c => (
                                                                <option key={c.code} value={c.code}>{c.flag} {c.code}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <input
                                                        type="tel"
                                                        placeholder="Number..."
                                                        value={n.number}
                                                        onChange={(e) => updateNumber(n.id, 'number', e.target.value.replace(/\D/g, ''))}
                                                        className="flex-1 px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                                                    />
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => removeNumberInput(n.id)}
                                                    className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </motion.div>
                                        ))}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={addNumberInput}
                                        className="flex items-center gap-2 text-blue-600 font-bold text-xs uppercase tracking-widest px-4 py-2 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all"
                                    >
                                        <Plus className="w-4 h-4" /> Add Another Recipient
                                    </button>
                                </div>

                                {/* Context Input */}
                                <div className="space-y-3">
                                    <label className="flex items-center gap-2 text-sm font-black text-slate-700 dark:text-slate-300 uppercase tracking-tighter">
                                        <MessageSquareText className="w-4 h-4 text-amber-500" /> 03. Business Context
                                    </label>
                                    <textarea
                                        value={context}
                                        onChange={e => setContext(e.target.value)}
                                        placeholder="Describe what you want to send. The AI will write the perfect copy for each recipient..."
                                        className="w-full h-40 px-5 py-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-3xl text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all resize-none"
                                        required
                                    />
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                        AI will automatically handle formatting, personalization and anti-ban phrasing.
                                    </p>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading || !selectedSession}
                                    className="w-full bg-slate-900 dark:bg-white dark:text-slate-900 text-white font-black py-4 rounded-2xl transition-all shadow-xl hover:scale-[1.01] active:scale-95 flex items-center justify-center gap-3 text-sm uppercase tracking-widest disabled:opacity-50"
                                >
                                    <Send className="w-4 h-4" /> Initialize Deployment
                                </button>
                            </form>
                        </motion.div>
                    )}

                    {step === 'progress' && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="absolute inset-0 bg-slate-900/90 backdrop-blur-xl"
                            />

                            {/* Mobile Modal-style or Desktop Center-style */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                className="relative w-full max-w-lg bg-white dark:bg-slate-800 rounded-[40px] shadow-2xl p-8 md:p-12 text-center overflow-hidden"
                            >
                                {/* Neural Pulse Background */}
                                <div className="absolute top-0 left-0 w-full h-1 bg-slate-100 dark:bg-slate-700">
                                    <motion.div
                                        className="h-full bg-blue-600"
                                        initial={{ width: "0%" }}
                                        animate={{ width: `${progress}%` }}
                                    />
                                </div>

                                <div className="relative mb-8">
                                    <div className="w-24 h-24 rounded-full border-4 border-slate-100 dark:border-slate-700 mx-auto flex items-center justify-center relative">
                                        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
                                        <div className="absolute inset-0 rounded-full border-t-4 border-blue-600 animate-[spin_1.5s_linear_infinite]" />
                                    </div>
                                    <motion.p
                                        key={progress}
                                        initial={{ opacity: 0, y: 5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="mt-6 text-2xl font-black text-slate-900 dark:text-white font-outfit"
                                    >
                                        Deploying {progress}%
                                    </motion.p>
                                    <p className="text-slate-500 text-sm font-medium mt-2">
                                        {progress < 40 ? "Initializing Neural Engine..." :
                                            progress < 70 ? "Generating Personalization..." :
                                                "Queuing Anti-Ban Threads..."}
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex justify-between text-[10px] font-black uppercase text-slate-400">
                                        <span>Status</span>
                                        <span>Engine: V2.1 Neural</span>
                                    </div>
                                    <div className="w-full h-10 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-700 flex items-center px-4 overflow-hidden relative">
                                        <motion.div
                                            animate={{ x: [0, 400] }}
                                            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                            className="w-40 h-full bg-gradient-to-r from-transparent via-blue-500/10 to-transparent absolute top-0"
                                        />
                                        <span className="text-[10px] font-mono text-slate-400 relative z-10 truncate">
                                            {progress < 30 ? "> Loading sessions..." :
                                                progress < 60 ? "> Fetching AI context..." :
                                                    "> Handshaking with WhatsApp Gateway..."}
                                        </span>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    )}

                    {step === 'summary' && result && (
                        <motion.div
                            key="summary"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xl p-8 text-center"
                        >
                            <div className={`w-20 h-20 rounded-full mx-auto flex items-center justify-center mb-6 shadow-lg ${result.isError ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'
                                }`}>
                                {result.isError ? <AlertCircle className="w-10 h-10" /> : <CheckCircle2 className="w-10 h-10" />}
                            </div>

                            <h3 className="text-3xl font-black text-slate-900 dark:text-white font-outfit mb-3 uppercase tracking-tighter">
                                {result.isError ? "Launch Failed" : "Campaign Queued"}
                            </h3>
                            <p className="text-slate-500 font-medium mb-8 max-w-md mx-auto">
                                {result.message || result.error || "The AI is currently processing and queuing your messages for sequential delivery."}
                            </p>

                            {result.preview && (
                                <div className="text-left mb-8 bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-6 border border-slate-100 dark:border-slate-700">
                                    <div className="flex justify-between items-center mb-4">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">AI Generated Preview</span>
                                        <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 bg-blue-100 text-blue-600 rounded">Handled by Neural Lab</span>
                                    </div>
                                    <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed font-medium">
                                        {result.preview}
                                    </p>
                                </div>
                            )}

                            <div className="flex flex-col sm:flex-row gap-4">
                                <button
                                    onClick={resetCampaign}
                                    className="flex-1 bg-blue-600 text-white font-black py-4 rounded-2xl transition-all shadow-lg shadow-blue-500/20 hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2 text-sm uppercase tracking-widest"
                                >
                                    <Plus className="w-4 h-4" /> Create New Campaign
                                </button>
                                <button
                                    onClick={() => window.location.href = '/dashboard'}
                                    className="flex-1 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-white font-black py-4 rounded-2xl transition-all hover:bg-slate-200 dark:hover:bg-slate-600 flex items-center justify-center gap-2 text-sm uppercase tracking-widest"
                                >
                                    Back to Dashboard
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>

            {/* Custom Scrollbar CSS */}
            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #e2e8f0;
                    border-radius: 10px;
                }
                .dark .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #334155;
                }
            `}</style>
        </div>
    );
}
