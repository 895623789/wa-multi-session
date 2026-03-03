"use client";
import React, { useState, useEffect, useCallback } from "react";
import { QrCode, RefreshCw, Smartphone, AlertTriangle, Wifi, Languages, XCircle } from "lucide-react";
import QRCode from "react-qr-code";
import { useAuth } from "@/components/AuthProvider";
import { doc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { db } from "@/lib/firebase";

// ─── Bilingual Content ────────────────────────────────────────────────────────
const content = {
    en: {
        modalTitle: "Disconnect Session",
        modalDesc: (id: string) => `Are you sure you want to disconnect session`,
        modalWarn: "This will permanently log out that WhatsApp number. You will need to scan a QR code again to reconnect.",
        confirm: "Yes, Disconnect",
        cancel: "Cancel",
        switchLang: "हिन्दी में देखें",
    },
    hi: {
        modalTitle: "सेशन डिस्कनेक्ट करें",
        modalDesc: (id: string) => `क्या आप सच में सेशन को डिस्कनेक्ट करना चाहते हैं?`,
        modalWarn: "यह उस WhatsApp नंबर को लॉग आउट कर देगा। दोबारा कनेक्ट करने के लिए QR कोड स्कैन करना होगा।",
        confirm: "हाँ, डिस्कनेक्ट करें",
        cancel: "रद्द करें",
        switchLang: "View in English",
    }
};

// ─── Custom Modal Component ───────────────────────────────────────────────────
function DisconnectModal({
    sessionId,
    onConfirm,
    onCancel,
    isLoading,
}: {
    sessionId: string;
    onConfirm: () => void;
    onCancel: () => void;
    isLoading: boolean;
}) {
    const [lang, setLang] = useState<"en" | "hi">("en");
    const t = content[lang];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
                onClick={!isLoading ? onCancel : undefined}
            />

            {/* Modal Card */}
            <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Top danger bar */}
                <div className="h-1.5 w-full bg-red-500" />

                <div className="p-6 sm:p-8">
                    {/* Icon + Title */}
                    <div className="flex items-start gap-4 mb-5">
                        <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center">
                            <AlertTriangle className="w-6 h-6 text-red-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h2 className="text-lg font-bold text-slate-800 mb-0.5">{t.modalTitle}</h2>
                            <p className="text-sm text-slate-600 leading-relaxed">
                                {t.modalDesc(sessionId)}{" "}
                                <span className="font-mono font-bold text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded-lg text-xs">
                                    {sessionId}
                                </span>
                                {"?"}
                            </p>
                        </div>
                    </div>

                    {/* Warning box */}
                    <div className="bg-amber-50 border border-amber-100 rounded-2xl px-4 py-3 mb-6 flex gap-3 items-start">
                        <Wifi className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                        <p className="text-xs text-amber-900 leading-relaxed font-medium">{t.modalWarn}</p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-3">
                        <button
                            onClick={onCancel}
                            disabled={isLoading}
                            className="flex-1 px-4 py-3 rounded-2xl border-2 border-slate-100 text-slate-600 text-sm font-bold hover:bg-slate-50 transition-all disabled:opacity-40"
                        >
                            {t.cancel}
                        </button>
                        <button
                            onClick={onConfirm}
                            disabled={isLoading}
                            className="flex-1 px-4 py-3 rounded-2xl bg-red-500 hover:bg-red-600 active:bg-red-700 text-white text-sm font-bold transition-all shadow-lg shadow-red-500/25 disabled:opacity-70 flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <><RefreshCw className="w-4 h-4 animate-spin" /> Disconnecting...</>
                            ) : (
                                <><XCircle className="w-4 h-4" /> {t.confirm}</>
                            )}
                        </button>
                    </div>

                    {/* Language Toggle */}
                    <div className="mt-4 text-center">
                        <button
                            onClick={() => setLang(lang === "en" ? "hi" : "en")}
                            className="inline-flex items-center gap-1.5 text-xs text-slate-500 font-semibold hover:text-teal-600 transition-colors"
                        >
                            <Languages className="w-3.5 h-3.5" />
                            {t.switchLang}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function SessionsPage() {
    const { user } = useAuth();
    const uid = user?.uid || '';

    const [sessions, setSessions] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);

    // Create state
    const [newSessionId, setNewSessionId] = useState("");
    const [qrCode, setQrCode] = useState("");
    const [creationStatus, setCreationStatus] = useState("");
    const [isPolling, setIsPolling] = useState(false);
    const [fullSessionId, setFullSessionId] = useState(""); // uid_name format

    // Disconnect modal state
    const [modalSession, setModalSession] = useState<string | null>(null);
    const [disconnecting, setDisconnecting] = useState(false);

    // Display name: strip uid prefix
    const displayName = (id: string) => id.startsWith(uid + '_') ? id.slice(uid.length + 1) : id;

    const fetchSessions = useCallback(async () => {
        if (!uid) return;
        try {
            const res = await fetch(`http://localhost:5000/session/list?uid=${uid}`);
            const data = await res.json();
            setSessions(data.sessions || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [uid]);

    useEffect(() => { fetchSessions(); }, [fetchSessions]);

    const confirmDisconnect = async () => {
        if (!modalSession || !uid) return;
        setDisconnecting(true);
        try {
            await fetch(`http://localhost:5000/session/delete/${modalSession}?uid=${uid}`, { method: "DELETE" });
            // Remove from Firestore user doc
            await updateDoc(doc(db, "users", uid), { sessions: arrayRemove(modalSession) });
            setModalSession(null);
            await fetchSessions();
        } catch (e) {
            alert("Failed to disconnect session. Please try again.");
        } finally {
            setDisconnecting(false);
        }
    };

    const handleCreateSession = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newSessionId || !uid) return;

        const scopedId = `${uid}_${newSessionId}`;
        setFullSessionId(scopedId);
        setCreationStatus("Starting session...");
        setQrCode("");

        try {
            const res = await fetch("http://localhost:5000/session/start", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ sessionId: scopedId, uid })
            });
            const data = await res.json();

            setCreationStatus(data.message || data.error);
            if (data.message && data.message.includes('started')) {
                setIsPolling(true);
            } else if (data.message && data.message.includes('already active')) {
                fetchSessions();
            }
        } catch (e) {
            setCreationStatus("Failed to create session.");
        }
    };

    useEffect(() => {
        if (!isPolling || !fullSessionId) return;

        const interval = setInterval(async () => {
            try {
                const res = await fetch(`http://localhost:5000/session/status/${fullSessionId}`);
                const statusData = await res.json();

                if (statusData.qr) {
                    setQrCode(statusData.qr);
                    setCreationStatus("Scan QR Code to connect.");
                }

                if (statusData.status === 'connected') {
                    setCreationStatus(`✅ Session connected!`);
                    setQrCode("");
                    setIsPolling(false);
                    // Save to Firestore user doc
                    if (uid) {
                        await updateDoc(doc(db, "users", uid), { sessions: arrayUnion(fullSessionId) });
                    }
                    fetchSessions();
                    setNewSessionId("");
                    setFullSessionId("");
                }

                if (statusData.status === 'duplicate_rejected') {
                    setCreationStatus(`❌ This WhatsApp number is already connected! Please use a different number.`);
                    setQrCode("");
                    setIsPolling(false);
                }

            } catch (e) { /* ignore */ }
        }, 2000);

        return () => clearInterval(interval);
    }, [isPolling, newSessionId, fetchSessions]);

    return (
        <>
            {/* ── Disconnect Modal ── */}
            {modalSession && (
                <DisconnectModal
                    sessionId={modalSession}
                    onConfirm={confirmDisconnect}
                    onCancel={() => !disconnecting && setModalSession(null)}
                    isLoading={disconnecting}
                />
            )}

            <div className="w-full h-full p-4 lg:p-8 grid lg:grid-cols-3 gap-8">
                {/* Session List */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white dark:bg-card-dark rounded-2xl shadow-soft p-6 md:p-8 glass">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-xl font-bold text-slate-800 dark:text-white font-outfit">Active Sessions</h2>
                                <p className="text-sm text-slate-500 dark:text-slate-400">Manage your connected WhatsApp instances.</p>
                            </div>
                            <button onClick={fetchSessions} className="p-2 text-slate-400 hover:text-blue-600 transition-colors">
                                <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                            </button>
                        </div>

                        {loading ? (
                            <div className="flex items-center gap-2 text-slate-500 p-4">
                                <RefreshCw className="w-4 h-4 animate-spin" /> Loading...
                            </div>
                        ) : sessions.length === 0 ? (
                            <div className="p-8 border-2 border-dashed border-slate-200 rounded-xl text-center">
                                <QrCode className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                                <h3 className="text-sm font-bold text-slate-900 mb-1">No Active Sessions</h3>
                                <p className="text-xs text-slate-500">Create a new session to the right to get started.</p>
                            </div>
                        ) : (
                            <div className="grid gap-3">
                                {sessions.map(id => (
                                    <div key={id} className="group flex items-center gap-4 p-4 rounded-2xl border border-white/60 bg-white/70 hover:bg-white/90 hover:shadow-soft transition-all duration-300">
                                        {/* Left: Avatar */}
                                        <div className="relative flex-shrink-0">
                                            <div className="w-11 h-11 rounded-2xl bg-green-100 flex items-center justify-center shadow-sm">
                                                <Smartphone className="w-5 h-5 text-green-700" />
                                            </div>
                                            {/* Live pulse dot */}
                                            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-500 border-2 border-white shadow">
                                                <span className="absolute inset-0 rounded-full bg-green-400 animate-ping opacity-75" />
                                            </span>
                                        </div>

                                        {/* Center: Info */}
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-slate-800 dark:text-white truncate text-sm">{displayName(id)}</p>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded-full uppercase tracking-wider">
                                                    ● Live
                                                </span>
                                                <span className="text-[10px] text-slate-400">WhatsApp Connected</span>
                                            </div>
                                        </div>

                                        {/* Right: Disconnect button */}
                                        <button
                                            onClick={() => setModalSession(id)}
                                            className="flex-shrink-0 text-xs font-bold text-slate-500 hover:text-red-500 border border-slate-200 hover:border-red-100 hover:bg-red-50 px-4 py-2 rounded-xl transition-all duration-200 bg-white shadow-sm"
                                        >
                                            Disconnect
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Create Session */}
                <div className="lg:col-span-1">
                    <div className="bg-white dark:bg-card-dark rounded-2xl shadow-soft p-6 glass sticky top-24">
                        <h2 className="text-xl font-bold text-slate-800 dark:text-white font-outfit mb-2">New Session</h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Create an ID and link a new device securely.</p>

                        <form onSubmit={handleCreateSession} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Session Identifier</label>
                                <input
                                    type="text"
                                    value={newSessionId}
                                    onChange={e => setNewSessionId(e.target.value.replace(/[^a-zA-Z0-9-]/g, ''))}
                                    placeholder="e.g., sales-phone-1"
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary transition-all font-mono text-sm dark:text-white"
                                    required
                                    disabled={isPolling}
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={isPolling || !newSessionId}
                                className="w-full bg-primary hover:bg-teal-700 disabled:opacity-50 text-white font-medium py-3 rounded-xl transition-all shadow-glow"
                            >
                                {isPolling ? 'Connecting...' : 'Generate Target'}
                            </button>
                        </form>

                        {creationStatus && (
                            <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-center text-slate-600 break-words">
                                {creationStatus}
                            </div>
                        )}

                        {qrCode && (
                            <div className="mt-6 p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col items-center justify-center animate-in fade-in zoom-in slide-in-from-bottom-2 duration-300">
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Scan using WhatsApp</p>
                                <div className="bg-white p-2 rounded-xl shadow-sm border border-slate-200 relative w-48 h-48 flex items-center justify-center">
                                    <QRCode
                                        value={qrCode}
                                        size={192}
                                        style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                                    />
                                </div>
                                <div className="mt-4 text-xs font-medium text-slate-400 flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-full border border-slate-200 shadow-sm">
                                    <QrCode className="w-3.5 h-3.5" />
                                    Awaiting Scan...
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
