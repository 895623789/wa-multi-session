"use client";
import React, { useState, useRef, useEffect } from "react";
import {
    Sparkles,
    History,
    Plus,
    Paperclip,
    Send,
    User,
    Circle,
    Settings2,
    X,
    ChevronRight,
    MessageSquare
} from "lucide-react";
import { v4 as uuidv4 } from 'uuid';

/**
 * ⚠️ DEVELOPER NOTE / FUTURE ARCHITECTURE ⚠️
 * This Owner Assistant IS COMPLETELY SEPARATE from the main Gemini-based system used by WhatsApp bots.
 * 
 * DESIGN DECISIONS:
 * 1. PERSISTENCE: Uses browser 'localStorage' for history (no database calls required for UI phase).
 * 2. AGNOSTIC BACKEND: This UI does NOT use the current Gemini API. It is designed to be connected 
 *    to a different provider (OpenAI o1, Grok 3, etc.) in the future via a separate backend route.
 * 3. LOGIC: All chat handling logic here should remain isolated from 'AIHandler.ts'.
 */

const STORAGE_KEY = "neural_owner_assistant_v1";

interface Message {
    role: 'user' | 'assistant';
    text: string;
    ts: number;
}

interface ChatSession {
    id: string;
    title: string;
    messages: Message[];
    updatedAt: number;
}

const WELCOME_MSG: Message = {
    role: 'assistant',
    text: "नमस्ते, Operations Manager! क्या हाल है? How can I assist you today? Do you want to send a WhatsApp message, check on your bots, generate an image, or something else?",
    ts: Date.now()
};

export default function OwnerAssistantPage() {
    // ─── States ───
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [activeSessionId, setActiveSessionId] = useState<string>("");
    const [messages, setMessages] = useState<Message[]>([WELCOME_MSG]);
    const [input, setInput] = useState("");
    const [showHistory, setShowHistory] = useState(false);
    const [showSettings, setShowSettings] = useState(false);

    const scrollRef = useRef<HTMLDivElement>(null);

    // ─── Persistence ───
    useEffect(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            try {
                const parsed = JSON.parse(stored) as ChatSession[];
                setSessions(parsed);
                if (parsed.length > 0) {
                    setActiveSessionId(parsed[0].id);
                    setMessages(parsed[0].messages);
                } else {
                    initNewChat();
                }
            } catch (e) {
                initNewChat();
            }
        } else {
            initNewChat();
        }
    }, []);

    const saveToLocal = (allSessions: ChatSession[]) => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(allSessions));
    };

    const initNewChat = () => {
        const newId = uuidv4();
        const newSession: ChatSession = {
            id: newId,
            title: "New Operations Chat",
            messages: [WELCOME_MSG],
            updatedAt: Date.now()
        };
        const updated = [newSession, ...sessions];
        setSessions(updated);
        setActiveSessionId(newId);
        setMessages([WELCOME_MSG]);
        saveToLocal(updated);
    };

    const loadSession = (id: string) => {
        const session = sessions.find(s => s.id === id);
        if (session) {
            setActiveSessionId(id);
            setMessages(session.messages);
            setShowHistory(false);
        }
    };

    const deleteSession = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        const updated = sessions.filter(s => s.id !== id);
        setSessions(updated);
        saveToLocal(updated);
        if (activeSessionId === id) {
            if (updated.length > 0) {
                loadSession(updated[0].id);
            } else {
                initNewChat();
            }
        }
    };

    // ─── Interaction ───
    const handleSend = () => {
        if (!input.trim()) return;

        const userMsg: Message = { role: 'user', text: input, ts: Date.now() };
        const newMessages = [...messages, userMsg];
        setMessages(newMessages);
        setInput("");

        // Update session
        const updatedSessions = sessions.map(s => {
            if (s.id === activeSessionId) {
                const newTitle = s.title === "New Operations Chat" ? input.substring(0, 25) + "..." : s.title;
                return { ...s, messages: newMessages, updatedAt: Date.now(), title: newTitle };
            }
            return s;
        });
        setSessions(updatedSessions);
        saveToLocal(updatedSessions);

        // Simulated AI response (Placeholder for OpenAI/Grok later)
        setTimeout(() => {
            const aiMsg: Message = {
                role: 'assistant',
                text: "I understand, Boss. I am currently in UI mode. Once you connect my backend API (OpenAI/Grok), I will be able to execute these operations for you.",
                ts: Date.now()
            };
            const finalMessages = [...newMessages, aiMsg];
            setMessages(finalMessages);

            const finalSessions = updatedSessions.map(s => {
                if (s.id === activeSessionId) return { ...s, messages: finalMessages, updatedAt: Date.now() };
                return s;
            });
            setSessions(finalSessions);
            saveToLocal(finalSessions);
        }, 1000);
    };

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    return (
        <div className="flex flex-col h-full bg-white font-sans selection:bg-blue-100 relative overflow-hidden">
            {/* Header - Fixed Top */}
            <header className="flex items-center justify-between px-6 py-3 bg-white border-b border-slate-100 shrink-0 sticky top-0 z-50">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-50 cursor-pointer" onClick={() => setShowHistory(!showHistory)}>
                        <Sparkles size={18} className="text-white fill-white" />
                    </div>
                    <div className="flex flex-col">
                        <h1 className="text-[15px] font-black text-slate-900 tracking-tight leading-none">Neural Admin</h1>
                        <div className="flex items-center gap-1.5 mt-1">
                            <Circle size={6} className="fill-emerald-500 text-emerald-500" />
                            <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest">Online & Ready</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {/* Model Indicator (UI Only) */}
                    <div className="flex items-center py-1.5 px-3 bg-indigo-50/50 border border-indigo-100 rounded-full gap-2 cursor-wait">
                        <Sparkles size={12} className="text-indigo-600" />
                        <span className="text-[10px] font-black text-indigo-700 uppercase tracking-tighter">API Standby</span>
                    </div>

                    {/* SETTINGS BUTTON - Added as requested */}
                    <button
                        onClick={() => setShowSettings(!showSettings)}
                        className={`p-2 rounded-full transition-all ${showSettings ? 'bg-blue-50 text-blue-600' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-50'}`}
                    >
                        <Settings2 size={18} strokeWidth={2.5} />
                    </button>

                    <button
                        onClick={() => setShowHistory(!showHistory)}
                        className={`flex items-center gap-2 px-3 py-2 transition-all rounded-lg ${showHistory ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:text-slate-900'}`}
                    >
                        <History size={16} strokeWidth={2.5} />
                        <span className="text-[11px] font-black uppercase tracking-tight">History</span>
                    </button>

                    <button
                        onClick={initNewChat}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-full font-black text-[11px] hover:shadow-xl hover:shadow-blue-200 transition-all uppercase tracking-tight shadow-md"
                    >
                        <Plus size={16} strokeWidth={3} />
                        <span>New Chat</span>
                    </button>
                </div>
            </header>

            <div className="flex flex-1 overflow-hidden relative">
                {/* ─── History Drawer ─── */}
                {showHistory && (
                    <div className="absolute inset-y-0 left-0 w-80 bg-white border-r border-slate-100 z-40 shadow-2xl flex flex-col animate-in slide-in-from-left duration-300">
                        <div className="p-5 border-b border-slate-50 flex items-center justify-between">
                            <h2 className="text-xs font-black uppercase tracking-widest text-slate-400">Past Conversations</h2>
                            <button onClick={() => setShowHistory(false)} className="text-slate-400 hover:text-rose-500 border border-slate-100 rounded-lg p-1 transition-colors">
                                <X size={14} />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
                            {sessions.map(s => (
                                <div
                                    key={s.id}
                                    onClick={() => loadSession(s.id)}
                                    className={`group p-3 rounded-2xl cursor-pointer transition-all border flex items-center justify-between ${s.id === activeSessionId ? 'bg-blue-50 border-blue-100' : 'border-transparent hover:bg-slate-50 hover:border-slate-100'}`}
                                >
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <MessageSquare size={14} className={s.id === activeSessionId ? 'text-blue-500' : 'text-slate-400'} />
                                        <span className={`text-[12px] font-bold truncate ${s.id === activeSessionId ? 'text-blue-700' : 'text-slate-600'}`}>{s.title}</span>
                                    </div>
                                    <button onClick={(e) => deleteSession(e, s.id)} className="opacity-0 group-hover:opacity-100 p-1 hover:text-rose-500 transition-opacity">
                                        <X size={12} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ─── Settings Panel (UI Mockup) ─── */}
                {showSettings && (
                    <div className="absolute inset-y-0 right-0 w-80 bg-white border-l border-slate-100 z-40 shadow-2xl p-6 flex flex-col gap-6 animate-in slide-in-from-right duration-300">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xs font-black uppercase tracking-widest text-slate-400">Assistant Config</h2>
                            <button onClick={() => setShowSettings(false)} className="text-slate-400 hover:text-rose-500"><X size={18} /></button>
                        </div>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Target Backend Provider</label>
                                <select className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all cursor-not-allowed" disabled>
                                    <option>Select Provider (UI Only)</option>
                                    <option>Grok-3 (X.ai)</option>
                                    <option>OpenAI GPT-4o</option>
                                    <option>DeepSeek R1</option>
                                </select>
                            </div>
                            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100">
                                <div className="flex items-center gap-2 mb-2 text-amber-700">
                                    <Settings2 size={14} />
                                    <span className="text-[11px] font-black uppercase">Dev Note</span>
                                </div>
                                <p className="text-[10px] text-amber-600 leading-relaxed font-bold">
                                    This assistant is architecturally isolated. Connect your chosen API in a new backend controller to enable real logic.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* ─── Main Chat Body ─── */}
                <main ref={scrollRef} className="flex-1 overflow-y-auto px-4 md:px-[15%] py-10 space-y-10 custom-scrollbar pb-40 scroll-smooth">
                    {messages.map((msg, idx) => (
                        <div key={idx} className={`flex w-full group ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                            <div className={`flex items-start gap-3 max-w-[90%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                                <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center border transition-transform group-hover:scale-110 shadow-sm ${msg.role === 'assistant'
                                        ? 'bg-blue-50 border-blue-100 text-blue-600'
                                        : 'bg-blue-600 border-blue-700 text-white'
                                    }`}>
                                    {msg.role === 'assistant' ? <Sparkles size={14} className="fill-blue-600" /> : <User size={14} fill="white" />}
                                </div>
                                <div className={`px-6 py-4 rounded-[28px] text-[14px] leading-[1.6] font-medium shadow-sm border ${msg.role === 'assistant'
                                        ? 'bg-[#f8fafc] text-slate-700 border-slate-100 rounded-tl-sm'
                                        : 'bg-blue-600 text-white border-blue-700 rounded-tr-sm'
                                    }`}>
                                    {msg.text}
                                </div>
                            </div>
                        </div>
                    ))}
                </main>

                {/* ─── Floating Input Area ─── */}
                <div className="absolute bottom-6 left-0 right-0 flex justify-center px-4 pointer-events-none">
                    <form
                        onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                        className="w-full max-w-2xl bg-white border border-slate-100 rounded-full p-1.5 flex items-center shadow-[0_10px_40px_rgba(0,0,0,0.08)] pointer-events-auto ring-4 ring-slate-50/50"
                    >
                        <div className="flex items-center pl-1">
                            <button type="button" className="w-9 h-9 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full flex items-center justify-center transition-all">
                                <Paperclip size={18} />
                            </button>
                            <button type="button" className="w-9 h-9 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full flex items-center justify-center transition-all ml-1">
                                <Sparkles size={18} />
                            </button>
                        </div>

                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Message Neural Admin..."
                            className="flex-1 bg-transparent border-none focus:ring-0 text-[14px] text-slate-800 placeholder:text-slate-400 font-bold px-4 py-2"
                        />

                        <button
                            type="submit"
                            disabled={!input.trim()}
                            className="w-10 h-10 bg-blue-600 text-white disabled:bg-slate-100 disabled:text-slate-300 rounded-full flex items-center justify-center hover:bg-blue-700 transition-all shadow-lg active:scale-95 ml-2 mr-0.5"
                        >
                            <Send size={18} fill="currentColor" />
                        </button>
                    </form>
                </div>
            </div>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #f1f5f9; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #e2e8f0; }
            `}</style>
        </div>
    );
}
