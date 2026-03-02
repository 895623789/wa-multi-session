"use client";
import React, { useState, useRef, useEffect } from "react";
import { BrainCircuit, Send, User, Sparkles } from "lucide-react";
import ReactMarkdown from 'react-markdown';

export default function NeuralAdminPage() {
    const [messages, setMessages] = useState<{ role: 'user' | 'ai', text: string }[]>([
        { role: 'ai', text: "Hello. I am the internal diagnostic core. You can ask me about active sessions, queued messages, or system health." }
    ]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || loading) return;

        const userMessage = input.trim();
        setInput("");
        setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
        setLoading(true);

        try {
            const res = await fetch("http://localhost:5000/admin/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                // Hardcoding session ID to 'admin' for demo purposes, in prod pass actual session token.
                body: JSON.stringify({ query: userMessage, sessionId: "admin" })
            });
            const data = await res.json();

            setMessages(prev => [...prev, { role: 'ai', text: data.reply || "Sorry, I couldn't process that query." }]);
        } catch (err) {
            setMessages(prev => [...prev, { role: 'ai', text: "❌ Connection to Neural Core failed." }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="h-[calc(100vh-10rem)] max-h-[800px] bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
            {/* Header */}
            <div className="h-16 border-b border-slate-100 flex items-center justify-between px-6 bg-slate-50/50">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                        <BrainCircuit className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                        <h2 className="text-sm font-bold text-slate-900 font-outfit">Neural Admin Link</h2>
                        <p className="text-xs text-green-600 font-medium flex items-center gap-1.5 flex-row">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span> Online
                        </p>
                    </div>
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6" ref={scrollRef}>
                {messages.map((msg, idx) => (
                    <div key={idx} className={`flex gap-4 max-w-[80%] ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`}>

                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-blue-600' : 'bg-amber-100'}`}>
                            {msg.role === 'user' ? <User className="w-4 h-4 text-white" /> : <Sparkles className="w-4 h-4 text-amber-600" />}
                        </div>

                        <div className={`p-4 rounded-2xl text-sm leading-relaxed ${msg.role === 'user'
                            ? 'bg-blue-600 text-white rounded-tr-sm shadow-md whitespace-pre-wrap'
                            : 'bg-slate-50 border border-slate-100 text-slate-700 rounded-tl-sm prose prose-sm max-w-none prose-p:my-1 prose-headings:my-2 prose-ul:my-1'
                            }`}>
                            {msg.role === 'ai' ? (
                                <ReactMarkdown>{msg.text}</ReactMarkdown>
                            ) : (
                                msg.text
                            )}
                        </div>

                    </div>
                ))}

                {loading && (
                    <div className="flex gap-4 max-w-[80%]">
                        <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                            <Sparkles className="w-4 h-4 text-amber-600" />
                        </div>
                        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 rounded-tl-sm flex gap-2 w-20 justify-center">
                            <div className="w-2 h-2 rounded-full bg-slate-300 animate-bounce" style={{ animationDelay: '0ms' }} />
                            <div className="w-2 h-2 rounded-full bg-slate-300 animate-bounce" style={{ animationDelay: '150ms' }} />
                            <div className="w-2 h-2 rounded-full bg-slate-300 animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                    </div>
                )}
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-slate-100 bg-white">
                <form onSubmit={handleSend} className="relative flex items-center max-w-4xl mx-auto">
                    <input
                        type="text"
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        disabled={loading}
                        placeholder="Ask the system about active queues..."
                        className="w-full pl-6 pr-14 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-slate-700 shadow-inner disabled:opacity-50"
                    />
                    <button
                        type="submit"
                        disabled={loading || !input.trim()}
                        className="absolute right-2 p-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-0 text-white rounded-xl transition-all shadow-sm flex items-center justify-center"
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </form>
                <p className="text-center text-[10px] text-slate-400 font-medium uppercase tracking-wider mt-3">
                    AI may generate inaccurate information about system state.
                </p>
            </div>
        </div>
    );
}
