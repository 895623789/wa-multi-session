"use client";
import React, { useState, useRef, useEffect } from "react";
import { BrainCircuit, Send, User, Sparkles, Paperclip, X, Image, FileText, Music, Download, Database } from "lucide-react";
import ReactMarkdown from 'react-markdown';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Message {
    role: 'user' | 'ai';
    text: string;
    imageBase64?: string;       // AI-generated image
    filePreview?: string;       // User's uploaded image preview
    fileName?: string;          // Attached file name
    isStoragePrompt?: boolean;  // Firebase Storage ask card
    storageFileName?: string;
    storageFile?: File;         // Keep file ref for saving
}

// ─── File type icon helper ────────────────────────────────────────────────────
function FileIcon({ mimeType }: { mimeType: string }) {
    if (mimeType.startsWith('image/')) return <Image className="w-4 h-4 text-blue-500" />;
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
        <div className="flex gap-3 max-w-[85%]">
            <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                <Database className="w-4 h-4 text-amber-600" />
            </div>
            <div className="p-4 rounded-2xl rounded-tl-sm bg-amber-50 border border-amber-200 text-sm">
                <p className="font-semibold text-amber-900 mb-1">💾 Save to Firebase Storage?</p>
                <p className="text-amber-700 text-xs mb-3">
                    File <span className="font-mono font-bold">{fileName}</span> seems important. Should I save it permanently?
                </p>
                {saved ? (
                    <p className="text-green-700 font-medium text-xs">✅ Saved to Firebase Storage!</p>
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
    const [messages, setMessages] = useState<Message[]>([
        {
            role: 'ai',
            text: `Hello! I'm your **AI Agent** with full capabilities:\n\n📷 **Vision** — Send me a photo, I'll describe it\n🎙️ **Audio** — Send a voice note, I'll transcribe it\n📄 **PDF** — Share a document, I'll read it\n🎨 **Image Generation** — Ask me to create an image\n📤 **WhatsApp Send** — Say "Send Hello to 91XXXXXXXXXX"\n\nHow can I help you today?`
        }
    ]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [attachedFile, setAttachedFile] = useState<File | null>(null);
    const [filePreview, setFilePreview] = useState<string | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    // ── Handle file selection ─────────────────────────────────────────────────
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

    // ── Send message ──────────────────────────────────────────────────────────
    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if ((!input.trim() && !attachedFile) || loading) return;

        const userText = input.trim();
        const fileToSend = attachedFile;
        const preview = filePreview;

        setInput("");
        setAttachedFile(null);
        setFilePreview(null);
        setMessages(prev => [...prev, {
            role: 'user',
            text: userText || `📎 ${fileToSend?.name}`,
            filePreview: preview || undefined,
            fileName: fileToSend?.name
        }]);
        setLoading(true);

        try {
            const formData = new FormData();
            formData.append('query', userText);
            if (fileToSend) formData.append('file', fileToSend);

            // Send history (skip the first welcome message to save tokens)
            const chatHistory = messages.slice(1).map(m => ({
                role: m.role,
                text: m.text
            }));
            if (chatHistory.length > 0) {
                formData.append('history', JSON.stringify(chatHistory));
            }

            const res = await fetch("http://localhost:5000/admin/chat", { method: "POST", body: formData });

            const data = await res.json();

            // Build AI message
            const aiMsg: Message = {
                role: 'ai',
                text: data.text || data.reply || "Sorry, I couldn't process that.",
                imageBase64: data.imageBase64,
                isStoragePrompt: data.askStorage,
                storageFileName: data.storageFileName,
                storageFile: data.askStorage ? fileToSend || undefined : undefined,
            };
            setMessages(prev => [...prev, aiMsg]);

        } catch (err) {
            setMessages(prev => [...prev, { role: 'ai', text: "❌ Connection to Neural Core failed." }]);
        } finally {
            setLoading(false);
        }
    };

    // ── Firebase Storage save handler ─────────────────────────────────────────
    const handleStorageSave = async (file: File | undefined, fileName: string) => {
        if (!file) return;
        const formData = new FormData();
        formData.append('file', file);
        await fetch("http://localhost:5000/admin/upload-to-storage", { method: "POST", body: formData });
    };

    return (
        <div className="h-[calc(100vh-10rem)] max-h-[850px] bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">

            {/* Header */}
            <div className="h-16 border-b border-slate-100 flex items-center justify-between px-6 bg-slate-50/50 shrink-0">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                        <BrainCircuit className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                        <h2 className="text-sm font-bold text-slate-900 font-outfit">Neural Admin Agent</h2>
                        <p className="text-xs text-green-600 font-medium flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                            Vision · Audio · PDF · Image Gen · WhatsApp
                        </p>
                    </div>
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5" ref={scrollRef}>
                {messages.map((msg, idx) => (
                    <div key={idx}>
                        {/* Storage Prompt Card */}
                        {msg.isStoragePrompt && msg.role === 'ai' && (
                            <div className="mb-3">
                                <StoragePromptCard
                                    fileName={msg.storageFileName || 'file'}
                                    file={msg.storageFile}
                                    onSave={() => handleStorageSave(msg.storageFile, msg.storageFileName || 'file')}
                                    onSkip={() => { }}
                                />
                            </div>
                        )}

                        <div className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''} max-w-[88%] ${msg.role === 'user' ? 'ml-auto' : ''}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-blue-600' : 'bg-gradient-to-br from-amber-100 to-orange-100'}`}>
                                {msg.role === 'user' ? <User className="w-4 h-4 text-white" /> : <Sparkles className="w-4 h-4 text-amber-600" />}
                            </div>

                            <div className={`rounded-2xl text-sm leading-relaxed overflow-hidden ${msg.role === 'user'
                                ? 'bg-blue-600 text-white rounded-tr-sm shadow-md'
                                : 'bg-slate-50 border border-slate-100 text-slate-700 rounded-tl-sm'}`}>

                                {/* User image preview */}
                                {msg.filePreview && (
                                    <img src={msg.filePreview} alt="attachment" className="w-full max-w-xs rounded-t-xl object-cover" />
                                )}
                                {/* Non-image file chip */}
                                {msg.fileName && !msg.filePreview && (
                                    <div className="flex items-center gap-2 px-4 pt-3 text-xs opacity-80">
                                        <FileText className="w-3.5 h-3.5" />
                                        <span className="font-mono truncate max-w-[160px]">{msg.fileName}</span>
                                    </div>
                                )}

                                <div className="p-4">
                                    {msg.role === 'ai' ? (
                                        <div className="prose prose-sm max-w-none prose-p:my-1 prose-headings:my-2 prose-ul:my-1">
                                            <ReactMarkdown>{msg.text}</ReactMarkdown>
                                        </div>
                                    ) : (
                                        <span className="whitespace-pre-wrap">{msg.text}</span>
                                    )}

                                    {/* Generated Image */}
                                    {msg.imageBase64 && (
                                        <div className="mt-3">
                                            <img
                                                src={msg.imageBase64}
                                                alt="AI Generated"
                                                className="rounded-xl max-w-xs w-full border border-slate-200 shadow-sm"
                                            />
                                            <a
                                                href={msg.imageBase64}
                                                download="ai-generated.png"
                                                className="mt-2 inline-flex items-center gap-1.5 text-xs text-blue-600 hover:underline"
                                            >
                                                <Download className="w-3 h-3" /> Download image
                                            </a>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}

                {loading && (
                    <div className="flex gap-3 max-w-[88%]">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center shrink-0">
                            <Sparkles className="w-4 h-4 text-amber-600" />
                        </div>
                        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 rounded-tl-sm flex gap-1.5 items-center">
                            <div className="w-2 h-2 rounded-full bg-slate-300 animate-bounce" style={{ animationDelay: '0ms' }} />
                            <div className="w-2 h-2 rounded-full bg-slate-300 animate-bounce" style={{ animationDelay: '150ms' }} />
                            <div className="w-2 h-2 rounded-full bg-slate-300 animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                    </div>
                )}
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-slate-100 bg-white shrink-0">

                {/* File attachment preview */}
                {attachedFile && (
                    <div className="mb-3 flex items-center gap-2 text-xs bg-blue-50 border border-blue-200 rounded-xl px-3 py-2 max-w-xs">
                        <FileIcon mimeType={attachedFile.type} />
                        <span className="font-mono text-slate-700 truncate flex-1">{attachedFile.name}</span>
                        <span className="text-slate-400 shrink-0">{(attachedFile.size / 1024).toFixed(0)}KB</span>
                        <button onClick={removeFile} className="text-slate-400 hover:text-red-500 transition-colors shrink-0">
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

                <form onSubmit={handleSend} className="relative flex items-center gap-2 max-w-4xl mx-auto">
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="shrink-0 p-3 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-xl transition-all"
                        title="Attach file (image, audio, PDF, video)"
                    >
                        <Paperclip className="w-4 h-4" />
                    </button>

                    <input
                        type="text"
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        disabled={loading}
                        placeholder={attachedFile ? "Ask about this file, or just send…" : "Ask anything · Send WhatsApp · Generate image · Attach files…"}
                        className="flex-1 pl-5 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-slate-700 shadow-inner disabled:opacity-50 text-sm"
                    />

                    <button
                        type="submit"
                        disabled={loading || (!input.trim() && !attachedFile)}
                        className="shrink-0 p-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-30 text-white rounded-xl transition-all shadow-sm flex items-center justify-center"
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </form>

                <p className="text-center text-[10px] text-slate-400 font-medium uppercase tracking-wider mt-2">
                    Supports: Images · Audio · PDF · Video · 20MB max
                </p>
            </div>
        </div>
    );
}
