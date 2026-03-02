"use client";
import React, { useState, useRef, useEffect } from "react";
import { Bot, Send, User, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";

interface Message {
    role: "user" | "ai";
    content: string;
}

export function ChatTab() {
    const [query, setQuery] = useState("");
    const [messages, setMessages] = useState<Message[]>([
        { role: "ai", content: "Hello! I am your BulkReply Admin Assistant. How can I help you manage your sessions today?" }
    ]);
    const [loading, setLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        scrollRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const sendMessage = async () => {
        if (!query.trim()) return;
        const userMsg = query.trim();
        setMessages(prev => [...prev, { role: "user", content: userMsg }]);
        setQuery("");
        setLoading(true);

        try {
            const res = await axios.post("http://localhost:3000/admin/chat", {
                query: userMsg,
                sessionId: "my-first-session" // Default for now
            });
            setMessages(prev => [...prev, { role: "ai", content: res.data.reply }]);
        } catch (e) {
            setMessages(prev => [...prev, { role: "ai", content: "⚠️ Sorry, I'm having trouble connecting to the system pulse." }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="glass rounded-[2rem] overflow-hidden flex flex-col h-[calc(100vh-220px)] relative">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-secondary to-primary opacity-30" />

            <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/5 backdrop-blur-md relative z-10">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary shadow-inner">
                        <Bot size={28} />
                    </div>
                    <div>
                        <h3 className="font-bold text-lg text-white">System Manager AI</h3>
                        <div className="flex items-center gap-2 mt-0.5">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            <p className="text-[10px] text-green-500 font-bold uppercase tracking-[0.2em]">Neural Link Active</p>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-secondary/10 rounded-full border border-secondary/20">
                    <Sparkles size={16} className="text-secondary animate-pulse" />
                    <span className="text-[10px] text-secondary font-bold uppercase tracking-widest text-[10px]">Premium Assistant</span>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar relative z-10">
                {messages.map((msg, idx) => (
                    <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 15, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                        <div className={`flex gap-4 max-w-[75%] ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-lg ${msg.role === "user" ? "bg-primary text-white" : "bg-slate-900 border border-white/10 text-slate-400"}`}>
                                {msg.role === "user" ? <User size={20} /> : <Bot size={20} />}
                            </div>
                            <div className={`p-5 rounded-2xl text-sm leading-relaxed shadow-xl ${msg.role === "user"
                                    ? "bg-primary text-white"
                                    : "bg-slate-900/80 border border-white/5 text-slate-200"
                                }`}>
                                {msg.content}
                            </div>
                        </div>
                    </motion.div>
                ))}
                {loading && (
                    <div className="flex justify-start items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-slate-900 border border-white/10 flex items-center justify-center text-slate-400">
                            <Bot size={20} />
                        </div>
                        <div className="bg-slate-900/80 border border-white/5 p-5 rounded-2xl flex gap-3 shadow-xl">
                            <motion.div animate={{ opacity: [0.3, 1, 0.3], scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1 }} className="w-2 h-2 rounded-full bg-primary" />
                            <motion.div animate={{ opacity: [0.3, 1, 0.3], scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-2 h-2 rounded-full bg-primary" />
                            <motion.div animate={{ opacity: [0.3, 1, 0.3], scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-2 h-2 rounded-full bg-primary" />
                        </div>
                    </div>
                )}
                <div ref={scrollRef} />
            </div>

            <div className="p-8 bg-white/5 border-t border-white/5 relative z-10">
                <div className="relative max-w-4xl mx-auto">
                    <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                        placeholder="Ask AI for system diagnostics or campaign advice..."
                        className="w-full bg-slate-950/50 border border-white/5 rounded-full px-8 py-6 pr-20 text-white focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all text-sm font-medium shadow-2xl"
                    />
                    <button
                        onClick={sendMessage}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-4 bg-primary text-white rounded-full hover:bg-primary/90 transition-all shadow-lg shadow-primary/30 active:scale-90 neon-shadow"
                    >
                        <Send size={20} />
                    </button>
                </div>
            </div>
        </div>
    );
}
