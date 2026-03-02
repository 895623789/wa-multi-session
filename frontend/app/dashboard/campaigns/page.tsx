"use client";
import React, { useState, useEffect } from "react";
import { Send, Users, MessageSquareText, Activity, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function CampaignsPage() {
    const [sessions, setSessions] = useState<string[]>([]);
    const [selectedSession, setSelectedSession] = useState("");
    const [numbers, setNumbers] = useState("");
    const [context, setContext] = useState("");
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);

    useEffect(() => {
        fetch("http://localhost:5000/session/list")
            .then(r => r.ok ? r.json() : { sessions: [] })
            .then(data => {
                setSessions(data.sessions || []);
                if (data.sessions && data.sessions.length > 0) {
                    setSelectedSession(data.sessions[0]);
                }
            });
    }, []);

    const handleStartCampaign = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedSession || !numbers || !context) return;

        setLoading(true);
        setResult(null);

        const numberArray = numbers.split("\n").map(n => n.trim()).filter(n => n);

        try {
            const res = await fetch("http://localhost:5000/campaign/start", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    sessionId: selectedSession,
                    numbers: numberArray,
                    businessContext: context
                })
            });
            const data = await res.json();
            setResult({ ...data, isError: !res.ok });
        } catch (e: any) {
            setResult({ error: "Failed to connect to API", isError: true });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="grid lg:grid-cols-2 gap-8">
            {/* Campaign Form */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 md:p-8">
                <div className="mb-6">
                    <h2 className="text-xl font-bold text-slate-900 font-outfit">Launch Campaign</h2>
                    <p className="text-sm text-slate-500">Deploy AI-powered bulk messaging through your Anti-Ban core.</p>
                </div>

                <form onSubmit={handleStartCampaign} className="space-y-6">
                    <div>
                        <label className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-2">
                            <Activity className="w-4 h-4 text-blue-500" /> WhatsApp Session
                        </label>
                        <select
                            value={selectedSession}
                            onChange={e => setSelectedSession(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-slate-700"
                            required
                        >
                            <option value="" disabled>Select an active session...</option>
                            {sessions.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>

                    <div>
                        <label className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-2">
                            <Users className="w-4 h-4 text-amber-500" /> Target Audience
                        </label>
                        <p className="text-xs text-slate-400 mb-2">Enter phone numbers, one per line (include country code, e.g., 919876543210).</p>
                        <textarea
                            value={numbers}
                            onChange={e => setNumbers(e.target.value)}
                            placeholder="919876543210&#10;919876543211"
                            className="w-full h-32 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-mono text-sm resize-none"
                            required
                        />
                    </div>

                    <div>
                        <label className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-2">
                            <MessageSquareText className="w-4 h-4 text-green-500" /> Business Context
                        </label>
                        <p className="text-xs text-slate-400 mb-2">Tell the AI what you are selling or offering. It handles the copywriting.</p>
                        <textarea
                            value={context}
                            onChange={e => setContext(e.target.value)}
                            placeholder="We are offering a 50% discount on web development services..."
                            className="w-full h-32 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm resize-none"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading || !selectedSession}
                        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-medium py-3.5 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <span className="flex items-center gap-2"><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> Igniting Engine...</span>
                        ) : (
                            <><Send className="w-4 h-4" /> Deploy to Queue</>
                        )}
                    </button>
                </form>
            </div>

            {/* Results / Status Panel */}
            <div>
                <AnimatePresence mode="popLayout">
                    {result && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className={`bg-white rounded-2xl border shadow-sm p-6 overflow-hidden relative ${result.isError ? 'border-red-200' : 'border-green-200'}`}
                        >
                            <div className={`absolute top-0 left-0 w-1 h-full ${result.isError ? 'bg-red-500' : 'bg-green-500'}`} />
                            <button onClick={() => setResult(null)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
                                <X className="w-5 h-5" />
                            </button>

                            <h3 className={`text-lg font-bold mb-2 font-outfit ${result.isError ? 'text-red-700' : 'text-slate-900'}`}>
                                {result.isError ? 'Deployment Failed' : 'Campaign Queued'}
                            </h3>

                            <p className="text-sm text-slate-600 mb-4 bg-slate-50 p-3 rounded-lg border border-slate-100 font-medium">
                                {result.message || result.error}
                            </p>

                            {result.preview && (
                                <div className="mt-6">
                                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">AI Generated Message Preview</h4>
                                    <div className="bg-green-50/50 border border-green-100 rounded-xl p-4 relative">
                                        <p className="text-sm text-slate-700 whitespace-pre-wrap">{result.preview}</p>
                                        <div className="absolute right-2 bottom-2 bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">AI Written</div>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    )}

                    {!result && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 p-8 text-center h-full flex flex-col justify-center items-center text-slate-400"
                        >
                            <Send className="w-12 h-12 mb-4 text-blue-100" />
                            <p className="font-medium text-slate-500">Ready to launch.</p>
                            <p className="text-sm max-w-[200px] mt-2">Fill out the campaign configuration to generate and queue AI messages.</p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
