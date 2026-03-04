"use client";
import React, { useState } from "react";
import { ShieldAlert, Send, CheckCircle2, HelpCircle } from "lucide-react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "./AuthProvider";

export default function BlockedScreen() {
    const { user, userData } = useAuth();
    const [name, setName] = useState(userData?.displayName || "");
    const [email, setEmail] = useState(userData?.email || "");
    const [message, setMessage] = useState("");
    const [submitted, setSubmitted] = useState(false);
    const [sending, setSending] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !email.trim() || !message.trim()) return;
        setSending(true);
        try {
            await addDoc(collection(db, "support_tickets"), {
                uid: user?.uid || "unknown",
                name: name.trim(),
                email: email.trim(),
                message: message.trim(),
                type: "unblock_request",
                status: "open",
                createdAt: serverTimestamp(),
            });
            setSubmitted(true);
        } catch (err) {
            console.error("Failed to submit ticket:", err);
            alert("फॉर्म भेजने में समस्या हुई। कृपया दोबारा कोशिश करें।");
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "linear-gradient(135deg, #0f0f0f 0%, #1a0a0a 50%, #0f0f0f 100%)" }}>
            <div className="w-full max-w-md">
                {/* Icon */}
                <div className="flex justify-center mb-6">
                    <div className="w-20 h-20 rounded-full bg-red-500/10 border-2 border-red-500/30 flex items-center justify-center animate-pulse">
                        <ShieldAlert size={40} className="text-red-500" />
                    </div>
                </div>

                {/* Title */}
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-black text-white mb-2 tracking-tight">Account Blocked</h1>
                    <p className="text-sm text-slate-400 font-medium leading-relaxed">
                        Your account has been temporarily blocked by the administrator.
                        <br />If you think this is a mistake, please submit a help request below.
                    </p>
                </div>

                {/* Form or Success */}
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl">
                    {submitted ? (
                        <div className="text-center py-8">
                            <CheckCircle2 size={48} className="text-emerald-400 mx-auto mb-4" />
                            <h3 className="text-lg font-bold text-white mb-1">Request Submitted!</h3>
                            <p className="text-sm text-slate-400">We have received your request. The admin will review it shortly.</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="flex items-center gap-2 mb-4 text-slate-300">
                                <HelpCircle size={16} />
                                <span className="text-xs font-bold uppercase tracking-widest">Help Request</span>
                            </div>

                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Name</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500/50 transition-all placeholder-slate-600"
                                    placeholder="Your name"
                                />
                            </div>

                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Email</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500/50 transition-all placeholder-slate-600"
                                    placeholder="your@email.com"
                                />
                            </div>

                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Message</label>
                                <textarea
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    required
                                    rows={3}
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500/50 transition-all resize-none placeholder-slate-600"
                                    placeholder="Please explain why you think this is a mistake..."
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={sending}
                                className="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 shadow-lg shadow-red-900/30"
                            >
                                {sending ? (
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <Send size={14} />
                                        Submit Help Request
                                    </>
                                )}
                            </button>
                        </form>
                    )}
                </div>

                <p className="text-center text-[10px] text-slate-600 mt-6 font-medium">
                    BulkReply.io &bull; Contact support if you need immediate assistance.
                </p>
            </div>
        </div>
    );
}
