"use client";
import React, { useState, useRef, useEffect } from "react";
import { BrainCircuit, Send, User, Sparkles, Paperclip, X, Image as ImageIcon, FileText, Music, Download, Database, ArrowLeft, Plus, History, Trash2, Edit2, Wand2, Check, MoreVertical } from "lucide-react";
import ReactMarkdown from 'react-markdown';
import Link from "next/link";
import { v4 as uuidv4 } from "uuid";
import { db } from "@/lib/firebase";
import { useAuth } from "@/components/AuthProvider";
import { collection, getDocs } from "firebase/firestore";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Message {
    role: 'user' | 'ai';
    text: string;
    imageBase64?: string;
    filePreview?: string;
    fileName?: string;
    isStoragePrompt?: boolean;
    storageFileName?: string;
    storageFile?: File;
}

interface ChatSession {
    id: string;
    title: string;
    messages: Message[];
    updatedAt: number;
}

const LOCAL_STORAGE_KEY = "neural_admin_chats_v1";

const WELCOME_MESSAGE: Message = {
    role: 'ai',
    text: `Hello! I'm your **AI Agent** with full capabilities:\n\n📷 **Vision** — Send me a photo, I'll describe it\n🎙️ **Audio** — Send a voice note, I'll transcribe it\n📄 **PDF** — Share a document, I'll read it\n🎨 **Image Generation** — Toggle the ✨ icon to create an image\n📤 **WhatsApp Send** — Say "Send Hello to 91XXXXXXXXXX"\n\nHow can I help you today?`
};

// ─── File type icon helper ────────────────────────────────────────────────────
function FileIcon({ mimeType }: { mimeType: string }) {
    if (mimeType.startsWith('image/')) return <ImageIcon className="w-4 h-4 text-blue-500" />;
    if (mimeType.startsWith('audio/')) return <Music className="w-4 h-4 text-purple-500" />;
    return <FileText className="w-4 h-4 text-orange-500" />;
}

// ─── Storage Prompt Card ──────────────────────────────────────────────────────
function StoragePromptCard({
    fileName,
    file,
    onSave,
    onSkip,
}: { fileName: string; file?: File; onSave: () => void; onSkip: () => void }) {
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    const handleSave = async () => {
        setSaving(true);
        await onSave();
        setSaving(false);
        setSaved(true);
    };

    return (
        <div className="flex gap-3 max-w-[85%] mb-4">
            <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                <Database className="w-4 h-4 text-amber-600" />
            </div>
            <div className="p-4 rounded-2xl rounded-tl-sm bg-amber-50 border border-amber-200 text-sm">
                <p className="font-semibold text-amber-900 mb-1">💾 Save to Firebase Storage?</p>
                <p className="text-amber-700 text-xs mb-3">
                    File <span className="font-mono font-bold">{fileName}</span> seems important. Should I save it permanently?
                </p>
                {saved ? (
                    <p className="text-emerald-700 font-medium text-xs flex items-center gap-1"><Check className="w-3 h-3" /> Saved to Storage!</p>
                ) : (
                    <div className="flex gap-2">
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
                        >
                            {saving ? 'Saving...' : 'Yes, Save it'}
                        </button>
                        <button
                            onClick={onSkip}
                            className="px-3 py-1.5 border border-amber-300 text-amber-700 text-xs font-semibold rounded-lg hover:bg-amber-100 transition-colors"
                        >
                            No thanks
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function NeuralAdminPage() {
    // ── States ──
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [activeSessionId, setActiveSessionId] = useState<string>("");
    const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);

    // UI States
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [attachedFile, setAttachedFile] = useState<File | null>(null);
    const [filePreview, setFilePreview] = useState<string | null>(null);
    const [forceImageGen, setForceImageGen] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [editingTitleId, setEditingTitleId] = useState<string | null>(null);
    const [editTitleText, setEditTitleText] = useState("");
    const [agentNames, setAgentNames] = useState<Record<string, string>>({});
    const [currentModel, setCurrentModel] = useState("gemini-2.0-flash");
    const [showModelMenu, setShowModelMenu] = useState(false);
    const [usageStats, setUsageStats] = useState<Record<string, any>>({});
    const { user } = useAuth();

    const scrollRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // ── Load / Save History ──
    useEffect(() => {
        const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (stored) {
            try {
                const parsed = JSON.parse(stored) as ChatSession[];
                setSessions(parsed);
                if (parsed.length > 0) {
                    setActiveSessionId(parsed[0].id);
                    setMessages(parsed[0].messages);
                } else {
                    startNewChat();
                }
            } catch (e) {
                startNewChat();
            }
        } else {
            startNewChat();
        }
    }, []);

    // Fetch Agent Names
    useEffect(() => {
        const fetchNames = async () => {
            if (!user?.uid) return;
            try {
                const agentsRef = collection(db, "users", user.uid, "agents");
                const agentsSnap = await getDocs(agentsRef);
                const nameMap: Record<string, string> = {};
                agentsSnap.forEach(doc => {
                    const data = doc.data();
                    nameMap[doc.id] = data.name || "Unnamed Bot";
                });
                setAgentNames(nameMap);
            } catch (err) {
                console.error("Failed to fetch agent names:", err);
            }
        };
        fetchNames();
    }, [user?.uid]);

    // Fetch Global Model Setting
    useEffect(() => {
        const fetchAiConfig = async () => {
            try {
                const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";
                const res = await fetch(`${baseUrl}/admin/settings/ai-config`);
                const data = await res.json();
                if (data.currentModel) setCurrentModel(data.currentModel);
            } catch (err) {
                console.error("Failed to fetch AI config:", err);
            }
        };
        fetchAiConfig();
    }, []);

    // Fetch Usage Stats
    useEffect(() => {
        const fetchUsage = async () => {
            try {
                const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";
                const res = await fetch(`${baseUrl}/admin/stats/usage`);
                const data = await res.json();
                setUsageStats(data);
            } catch (err) {
                console.error("Failed to fetch usage stats:", err);
            }
        };
        fetchUsage();
        // Refresh usage stats whenever model menu is opened
        if (showModelMenu) fetchUsage();
    }, [showModelMenu]);

    const updateGlobalModel = async (model: string) => {
        setCurrentModel(model);
        setShowModelMenu(false);
        try {
            const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";
            await fetch(`${baseUrl}/admin/settings/ai-config`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ currentModel: model })
            });
        } catch (err) {
            console.error("Failed to update AI model:", err);
        }
    };

    const AI_MODELS = [
        {
            id: "gemini-2.0-flash",
            name: "2.0 Flash (Default)",
            desc: "Smartest & Multi-modal",
            price: "Standard",
            costStat: "Cost: ₹100",
            note: "Base Price (100% usage)"
        },
        {
            id: "gemini-2.0-flash-lite",
            name: "2.0 Flash-Lite",
            desc: "Ultra Fast",
            price: "Cheap",
            costStat: "Cost: ₹75",
            note: "25% Savings vs Default"
        },
        {
            id: "gemini-flash-latest",
            name: "Gemini 1.5 Flash",
            desc: "Proven & Stable",
            price: "Stable",
            costStat: "Cost: ₹40",
            note: "60% Savings vs Default"
        },
        {
            id: "gemini-flash-lite-latest",
            name: "Flash-Lite (8B)",
            desc: "Small & Instant",
            price: "Cheapest",
            costStat: "Cost: ₹15",
            note: "85% Savings vs Default"
        },
        {
            id: "gemini-pro-latest",
            name: "Gemini 1.5 Pro",
            desc: "Deep Reasoning",
            price: "Premium",
            costStat: "Cost: ₹2500",
            note: "High Cost for Pro work"
        },
    ];

    const saveStateToLocal = (id: string, msgs: Message[], titleFallback: string) => {
        setSessions(prev => {
            let exists = false;
            let titleStr = titleFallback;

            // Auto-generate title from first user message if current title is default
            if (msgs.length > 1 && msgs[1].role === 'user') {
                titleStr = msgs[1].text.substring(0, 30) + (msgs[1].text.length > 30 ? '...' : '');
            }

            const updated = prev.map(s => {
                if (s.id === id) {
                    exists = true;
                    // Only update title if it's still 'New Chat', otherwise keep custom
                    return { ...s, messages: msgs, updatedAt: Date.now(), title: s.title === 'New Chat' ? titleStr : s.title };
                }
                return s;
            });
            const finalSessions = exists
                ? updated
                : [{ id, title: titleStr, messages: msgs, updatedAt: Date.now() }, ...prev];

            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(finalSessions));
            return finalSessions;
        });
    };

    // ── Session Management ──
    const startNewChat = () => {
        const id = uuidv4();
        setActiveSessionId(id);
        const initMsgs = [WELCOME_MESSAGE];
        setMessages(initMsgs);
        setForceImageGen(false);
        saveStateToLocal(id, initMsgs, "New Chat");
        setShowHistory(false);
    };

    const loadSession = (id: string) => {
        const s = sessions.find(x => x.id === id);
        if (s) {
            setActiveSessionId(s.id);
            setMessages(s.messages || [WELCOME_MESSAGE]);
            setShowHistory(false);
        }
    };

    const deleteSession = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const filtered = sessions.filter(x => x.id !== id);
        setSessions(filtered);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(filtered));
        if (activeSessionId === id) {
            if (filtered.length > 0) loadSession(filtered[0].id);
            else startNewChat();
        }
    };

    const deleteAllSessions = () => {
        setSessions([]);
        localStorage.removeItem(LOCAL_STORAGE_KEY);
        startNewChat();
    };

    const renameSession = (id: string, newTitle: string) => {
        setSessions(prev => {
            const updated = prev.map(s => s.id === id ? { ...s, title: newTitle } : s);
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
            return updated;
        });
        setEditingTitleId(null);
    };

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    // ── Handle file selection ──
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setAttachedFile(file);

        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (ev) => setFilePreview(ev.target?.result as string);
            reader.readAsDataURL(file);
        } else {
            setFilePreview(null);
        }
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const removeFile = () => { setAttachedFile(null); setFilePreview(null); };

    // ── Send message ──
    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if ((!input.trim() && !attachedFile) || loading) return;

        let userText = input.trim();
        const fileToSend = attachedFile;
        const preview = filePreview;

        // Apply Image Generation Flag Override
        if (forceImageGen && userText) {
            userText = `[Image Generation Request] Please generate an image for the following: ${userText}`;
        }

        setInput("");
        setAttachedFile(null);
        setFilePreview(null);

        const newMsgs: Message[] = [...messages, {
            role: 'user',
            text: userText || `📎 ${fileToSend?.name}`,
            filePreview: preview || undefined,
            fileName: fileToSend?.name
        }];

        setMessages(newMsgs);
        saveStateToLocal(activeSessionId, newMsgs, "New Chat");
        setLoading(true);

        try {
            const formData = new FormData();
            formData.append('query', userText);
            if (fileToSend) formData.append('file', fileToSend);

            // Send history
            const chatHistory = newMsgs.slice(1, -1).map(m => ({
                role: m.role,
                text: m.text
            }));
            if (chatHistory.length > 0) {
                formData.append('history', JSON.stringify(chatHistory));
            }
            formData.append('agentNames', JSON.stringify(agentNames));

            const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";
            const res = await fetch(`${baseUrl}/admin/chat`, { method: "POST", body: formData });
            const data = await res.json();

            const aiMsg: Message = {
                role: 'ai',
                text: data.text || data.reply || "Sorry, I couldn't process that.",
                imageBase64: data.imageBase64,
                isStoragePrompt: data.askStorage,
                storageFileName: data.storageFileName,
                storageFile: data.askStorage ? fileToSend || undefined : undefined,
            };

            const updatedMsgs = [...newMsgs, aiMsg];
            setMessages(updatedMsgs);
            saveStateToLocal(activeSessionId, updatedMsgs, "New Chat");

        } catch (err: any) {
            const errorMsg = "Unable to reach Neural Core. Please ensure the backend is running.";
            const failMsgs = [...newMsgs, { role: 'ai', text: `❌ **Connection Failed**\n\n${errorMsg}` } as Message];
            setMessages(failMsgs);
            saveStateToLocal(activeSessionId, failMsgs, "New Chat");
        } finally {
            setLoading(false);
            setForceImageGen(false); // reset toggle after send
        }
    };

    const handleStorageSave = async (file: File | undefined, fileName: string) => {
        if (!file) return;
        const formData = new FormData();
        formData.append('file', file);
        const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";
        await fetch(`${baseUrl}/admin/upload-to-storage`, { method: "POST", body: formData });
    };

    return (
        <div className="h-full w-full bg-slate-50 flex flex-col relative overflow-hidden">

            {/* ── History Overlay Drawer ── */}
            {showHistory && (
                <>
                    <div
                        className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm z-40 transition-opacity"
                        onClick={() => setShowHistory(false)}
                    />
                    <div className="absolute top-0 left-0 bottom-0 w-[300px] bg-white shadow-2xl z-50 flex flex-col border-r border-slate-100 animate-in slide-in-from-left duration-300">
                        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <h3 className="font-bold text-slate-800 font-outfit flex items-center gap-2">
                                <History className="w-4 h-4 text-blue-600" /> Chat History
                            </h3>
                            <button onClick={() => setShowHistory(false)} className="p-1 hover:bg-slate-200 rounded-md text-slate-500">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-3 outline-none">
                            {sessions.length === 0 ? (
                                <p className="text-center text-slate-400 text-sm mt-10 font-medium">No history yet.</p>
                            ) : (
                                sessions.sort((a, b) => b.updatedAt - a.updatedAt).map(s => (
                                    <div
                                        key={s.id}
                                        onClick={() => loadSession(s.id)}
                                        className={`group p-3 rounded-xl mb-2 cursor-pointer transition-colors flex flex-col gap-1 relative ${s.id === activeSessionId ? 'bg-blue-50/80 border border-blue-200/50' : 'hover:bg-slate-50 border border-transparent'}`}
                                    >
                                        <div className="flex items-start justify-between pr-8">
                                            {editingTitleId === s.id ? (
                                                <input
                                                    autoFocus
                                                    value={editTitleText}
                                                    onChange={e => setEditTitleText(e.target.value)}
                                                    onBlur={() => renameSession(s.id, editTitleText || s.title)}
                                                    onKeyDown={e => { if (e.key === 'Enter') renameSession(s.id, editTitleText || s.title) }}
                                                    className="text-sm font-semibold bg-white border border-blue-300 px-1.5 py-0.5 rounded w-full outline-none focus:ring-2 ring-blue-500/20"
                                                    onClick={e => e.stopPropagation()}
                                                />
                                            ) : (
                                                <span className={`text-sm font-semibold truncate block w-full ${s.id === activeSessionId ? 'text-blue-700' : 'text-slate-700'}`}>
                                                    {s.title}
                                                </span>
                                            )}
                                        </div>
                                        <span className="text-[11px] text-slate-400 font-medium">
                                            {new Date(s.updatedAt).toLocaleDateString()} · {s.messages.length - 1} msgs
                                        </span>

                                        {/* Action buttons (Rename, Delete) */}
                                        <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5 p-0.5 bg-white/90 backdrop-blur rounded-lg border border-slate-200 shadow-sm">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setEditingTitleId(s.id); setEditTitleText(s.title); }}
                                                className="p-1.5 hover:bg-blue-50 hover:text-blue-600 rounded-md text-slate-400 transition-colors"
                                                title="Rename"
                                            >
                                                <Edit2 className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                                onClick={(e) => deleteSession(s.id, e)}
                                                className="p-1.5 hover:bg-red-50 hover:text-red-500 rounded-md text-slate-400 transition-colors"
                                                title="Delete Chat"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                        {sessions.length > 0 && (
                            <div className="p-3 border-t border-slate-100 bg-slate-50">
                                <button
                                    onClick={deleteAllSessions}
                                    className="w-full py-2.5 text-xs font-bold text-red-600 bg-red-50/50 border border-red-100 hover:bg-red-100 hover:border-red-200 rounded-xl transition-colors flex items-center justify-center gap-2"
                                >
                                    <Trash2 className="w-4 h-4" /> Delete All History
                                </button>
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* ── Main Chat Header ── */}
            <div className="h-12 border-b border-slate-200 flex items-center justify-between px-3 bg-white/90 backdrop-blur-md shrink-0 z-10 shadow-[0_2px_10px_rgba(0,0,0,0.02)] relative">
                <div className="flex items-center gap-2">
                    {/* Mobile Back Button */}
                    <Link href="/dashboard" className="p-1 text-sm text-slate-500 hover:bg-slate-100 hover:text-slate-800 rounded-lg transition-colors md:hidden">
                        <ArrowLeft className="w-4 h-4" />
                    </Link>

                    <div className="w-8 h-8 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-lg flex items-center justify-center shadow-sm">
                        <BrainCircuit className="w-4 h-4 text-white" />
                    </div>
                    <div>
                        <h2 className="text-xs font-bold text-slate-900 font-outfit leading-tight">Neural Admin</h2>
                        <p className="text-[10px] text-emerald-600 font-medium flex items-center gap-1 mt-0.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-[pulse_2s_ease-in-out_infinite]"></span>
                            Online & Ready
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-1.5">
                    {/* Model Switcher */}
                    <div className="relative">
                        <button
                            onClick={() => setShowModelMenu(!showModelMenu)}
                            className="flex items-center gap-1.5 px-2 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-all text-[11px] font-bold text-slate-700"
                        >
                            <BrainCircuit className="w-3.5 h-3.5 text-blue-600" />
                            <span className="max-w-[80px] truncate">{AI_MODELS.find(m => m.id === currentModel)?.name || currentModel}</span>
                        </button>

                        {showModelMenu && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={() => setShowModelMenu(false)} />
                                <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-xl z-50 p-1.5 animate-in fade-in zoom-in-95 duration-100">
                                    <p className="px-2.5 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Select AI Intelligence</p>
                                    {AI_MODELS.map(m => (
                                        <button
                                            key={m.id}
                                            onClick={() => updateGlobalModel(m.id)}
                                            className={`w-full text-left p-2.5 rounded-lg transition-colors flex flex-col gap-0.5 mb-0.5 ${currentModel === m.id ? 'bg-blue-50 border border-blue-100' : 'hover:bg-slate-50 border border-transparent'}`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className={`text-xs font-bold ${currentModel === m.id ? 'text-blue-700' : 'text-slate-700'}`}>{m.name}</span>
                                                <div className="flex flex-col items-end">
                                                    <span className={`text-[10px] font-black ${m.id === 'gemini-flash-lite-latest' ? 'text-emerald-600' : 'text-slate-500'}`}>{m.costStat}</span>
                                                    {usageStats[m.id] && (
                                                        <span className="text-[9px] font-bold text-blue-600 bg-blue-50 px-1 rounded">Spent: ₹{usageStats[m.id].totalCostINR.toFixed(2)}</span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-[10px] text-slate-500">{m.desc}</span>
                                                <span className="text-[9px] font-medium text-slate-400 italic">{m.note}</span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>

                    <button
                        onClick={() => setShowHistory(true)}
                        className="p-2 flex items-center gap-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900 rounded-lg transition-colors font-medium text-sm"
                        title="View Chat History"
                    >
                        <History className="w-4 h-4" />
                        <span className="hidden sm:block">History</span>
                    </button>
                    <button
                        onClick={startNewChat}
                        className="p-2 sm:px-3 flex items-center gap-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors font-semibold shadow-sm border border-blue-100 text-sm"
                        title="Start New Chat"
                    >
                        <Plus className="w-4 h-4" />
                        <span className="hidden sm:block">New Chat</span>
                    </button>
                </div>
            </div>

            {/* ── Chat Area ── */}
            <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-4 scroll-smooth bg-slate-50/50" ref={scrollRef}>
                {messages.map((msg, idx) => (
                    <div key={idx} className={`animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                        {/* Storage Prompt Card */}
                        {msg.isStoragePrompt && msg.role === 'ai' && (
                            <div className="mb-3 max-w-[95%] md:max-w-[80%]">
                                <StoragePromptCard
                                    fileName={msg.storageFileName || 'file'}
                                    file={msg.storageFile}
                                    onSave={() => handleStorageSave(msg.storageFile, msg.storageFileName || 'file')}
                                    onSkip={() => { }}
                                />
                            </div>
                        )}

                        <div className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : ''} max-w-[92%] md:max-w-[75%] ${msg.role === 'user' ? 'ml-auto' : ''}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm ${msg.role === 'user' ? 'bg-blue-600 shadow-blue-500/20' : 'bg-gradient-to-br from-indigo-100 to-blue-50 border border-blue-100'}`}>
                                {msg.role === 'user' ? <User className="w-4 h-4 text-white" /> : <Sparkles className="w-4 h-4 text-blue-600" />}
                            </div>

                            <div className={`rounded-2xl text-[14px] leading-relaxed overflow-hidden shadow-sm ${msg.role === 'user'
                                ? 'bg-blue-600 text-white rounded-tr-sm shadow-[0_4px_12px_rgba(37,99,235,0.15)]'
                                : 'bg-white border border-slate-200/60 text-slate-800 rounded-tl-sm shadow-[0_4px_12px_rgba(0,0,0,0.02)]'}`}>

                                {/* User image preview */}
                                {msg.filePreview && (
                                    <img src={msg.filePreview} alt="attachment" className="w-full max-w-xs object-cover border-b border-black/10" />
                                )}
                                {/* Non-image file chip */}
                                {msg.fileName && !msg.filePreview && (
                                    <div className="flex items-center gap-1.5 px-3 pt-2.5 text-xs opacity-90 font-medium">
                                        <FileText className="w-3.5 h-3.5" />
                                        <span className="font-mono truncate max-w-[180px]">{msg.fileName}</span>
                                    </div>
                                )}

                                <div className="p-2.5 md:p-3">
                                    {msg.role === 'ai' ? (
                                        <div className="prose prose-sm max-w-none prose-slate prose-p:my-1 prose-headings:my-2 prose-ul:my-1 prose-a:text-blue-600 font-manrope text-xs">
                                            <ReactMarkdown>{msg.text}</ReactMarkdown>
                                        </div>
                                    ) : (
                                        <span className="whitespace-pre-wrap font-manrope font-medium text-xs">{msg.text.replace('[Image Generation Request] Please generate an image for the following: ', '')}</span>
                                    )}

                                    {/* Generated Image */}
                                    {msg.imageBase64 && (
                                        <div className="mt-3">
                                            <img
                                                src={msg.imageBase64}
                                                alt="AI Generated"
                                                className="rounded-xl w-full max-w-xs border border-slate-200 shadow-sm transform hover:scale-[1.01] transition-transform"
                                            />
                                            <a
                                                href={msg.imageBase64}
                                                download="ai-generated.png"
                                                className="mt-2.5 inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 bg-blue-50 border border-blue-100 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors shadow-sm"
                                            >
                                                <Download className="w-3.5 h-3.5" /> Download
                                            </a>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}

                {loading && (
                    <div className="flex gap-2.5 max-w-[80%] animate-in fade-in slide-in-from-bottom-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-100 to-blue-50 border border-blue-100 flex items-center justify-center shrink-0 shadow-sm">
                            <Sparkles className="w-4 h-4 text-blue-600" />
                        </div>
                        <div className="px-4 py-3 rounded-2xl bg-white border border-slate-200/60 shadow-sm rounded-tl-sm flex gap-1.5 items-center min-h-[44px]">
                            <div className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                            <div className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                            <div className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                    </div>
                )}
            </div>

            {/* ── Input Area ── */}
            <div className="px-3 py-3 md:px-4 md:py-3 border-t border-slate-200 bg-white shadow-[0_-10px_30px_rgba(0,0,0,0.02)] z-10 shrink-0 relative">
                <div className="max-w-4xl mx-auto">

                    {/* File attachment preview */}
                    {attachedFile && (
                        <div className="absolute bottom-full mb-3 left-3 md:left-1/2 md:-translate-x-1/2 flex items-center gap-2 text-xs bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-lg max-w-xs animate-in fade-in slide-in-from-bottom-2 z-20">
                            <FileIcon mimeType={attachedFile.type} />
                            <span className="font-mono text-slate-700 font-bold truncate flex-1">{attachedFile.name}</span>
                            <span className="text-slate-400 font-medium text-[10px] bg-slate-100 px-1.5 py-0.5 rounded-md">{(attachedFile.size / 1024).toFixed(0)}KB</span>
                            <button onClick={removeFile} className="text-slate-400 hover:text-red-600 hover:bg-red-50 p-1 rounded-md transition-colors shrink-0">
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    )}

                    {/* File input (hidden) */}
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*,audio/*,video/*,.pdf,.doc,.docx"
                        className="hidden"
                        onChange={handleFileSelect}
                    />

                    <form onSubmit={handleSend} className="relative flex items-center gap-1.5 bg-slate-50 border border-slate-200/80 rounded-[2rem] p-1 shadow-sm focus-within:ring-2 focus-within:ring-blue-500/10 focus-within:border-blue-300 focus-within:bg-white transition-all">

                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="shrink-0 p-2.5 bg-white hover:bg-slate-100 text-slate-500 rounded-full transition-all shadow-sm border border-slate-200"
                            title="Attach file"
                        >
                            <Paperclip className="w-4 h-4" />
                        </button>

                        {/* Image Gen Toggle */}
                        <button
                            type="button"
                            onClick={() => setForceImageGen(!forceImageGen)}
                            className={`shrink-0 p-2.5 rounded-full transition-all shadow-sm border ${forceImageGen ? 'bg-indigo-100 border-indigo-200 text-indigo-700 shadow-indigo-100' : 'bg-white hover:bg-slate-100 text-slate-400 border-slate-200'}`}
                            title={forceImageGen ? "Image Generation Mode: ON" : "Turn on Image Generation Mode"}
                        >
                            <Wand2 className={`w-4 h-4 ${forceImageGen ? 'animate-pulse' : ''}`} />
                        </button>

                        <input
                            type="text"
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            disabled={loading}
                            placeholder={attachedFile ? "Ask about this file..." : forceImageGen ? "Describe image to generate..." : "Message Neural Admin..."}
                            className="flex-1 bg-transparent border-none focus:outline-none focus:ring-0 text-slate-800 text-[14px] font-manrope font-medium px-2 py-1.5 placeholder-slate-400"
                        />

                        <button
                            type="submit"
                            disabled={loading || (!input.trim() && !attachedFile)}
                            className="shrink-0 w-10 h-10 flex items-center justify-center bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 text-white rounded-full transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5"
                        >
                            <Send className="w-4 h-4 ml-0.5" />
                        </button>
                    </form>

                    <p className="text-center text-[9px] md:text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2 px-1">
                        Powered by Google Gemini · 20MB MAX
                    </p>
                </div>
            </div>
        </div>
    );
}
