"use client";
import React, { useState, useEffect } from "react";
import { Link2, QrCode, RefreshCw, XCircle } from "lucide-react";
import Image from "next/image";

export default function SessionsPage() {
    const [sessions, setSessions] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);

    // Create state
    const [newSessionId, setNewSessionId] = useState("");
    const [qrCode, setQrCode] = useState("");
    const [creationStatus, setCreationStatus] = useState("");
    const [isPolling, setIsPolling] = useState(false);

    useEffect(() => {
        fetchSessions();
    }, []);

    const fetchSessions = async () => {
        try {
            const res = await fetch("http://localhost:5000/session/list");
            const data = await res.json();
            setSessions(data.sessions || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateSession = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newSessionId) return;

        setCreationStatus("Starting session...");
        setQrCode("");

        try {
            const res = await fetch("http://localhost:5000/session/start", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ sessionId: newSessionId })
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
        if (!isPolling || !newSessionId) return;

        const interval = setInterval(async () => {
            try {
                const res = await fetch(`http://localhost:5000/session/status/${newSessionId}`);
                const statusData = await res.json();

                if (statusData.qr) {
                    setQrCode(statusData.qr);
                    setCreationStatus("Scan QR Code to connect.");
                }

                if (statusData.status === 'connected') {
                    setCreationStatus(`✅ Session ${newSessionId} Connected!`);
                    setQrCode("");
                    setIsPolling(false);
                    fetchSessions();
                    setNewSessionId("");
                }

            } catch (e) { /* ignore polling errors */ }
        }, 2000);

        return () => clearInterval(interval);
    }, [isPolling, newSessionId]);

    return (
        <div className="grid lg:grid-cols-3 gap-8">
            {/* Session List */}
            <div className="lg:col-span-2 space-y-6">
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 md:p-8">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-xl font-bold text-slate-900 font-outfit">Active Sessions</h2>
                            <p className="text-sm text-slate-500">Manage your connected WhatsApp instances.</p>
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
                            <Link2 className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                            <h3 className="text-sm font-bold text-slate-900 mb-1">No Active Sessions</h3>
                            <p className="text-xs text-slate-500">Create a new session to the right to get started.</p>
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {sessions.map(id => (
                                <div key={id} className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                                            <Link2 className="w-5 h-5 text-green-600" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-900">{id}</p>
                                            <div className="flex items-center gap-1.5 text-xs font-semibold text-green-600 uppercase tracking-wide">
                                                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                                Connected
                                            </div>
                                        </div>
                                    </div>
                                    <button className="text-xs font-medium text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5">
                                        <XCircle className="w-4 h-4" /> Disconnect
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Create Session */}
            <div className="lg:col-span-1">
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sticky top-24">
                    <h2 className="text-xl font-bold text-slate-900 font-outfit mb-2">New Session</h2>
                    <p className="text-sm text-slate-500 mb-6">Create an ID and link a new device securely.</p>

                    <form onSubmit={handleCreateSession} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Session Identifier</label>
                            <input
                                type="text"
                                value={newSessionId}
                                onChange={e => setNewSessionId(e.target.value.replace(/[^a-zA-Z0-9-]/g, ''))}
                                placeholder="e.g., sales-phone-1"
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-mono text-sm"
                                required
                                disabled={isPolling}
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={isPolling || !newSessionId}
                            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium py-3 rounded-xl transition-all shadow-sm"
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
                            <div className="bg-white p-2 rounded-xl shadow-sm border border-slate-200 relative w-48 h-48">
                                <Image src={qrCode} alt="WhatsApp Login QR Code" fill className="object-cover rounded-lg" />
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
    );
}
