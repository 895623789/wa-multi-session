"use client";
import React, { useState, useEffect } from "react";
import { Loader2, QrCode, ShieldCheck, Wifi, WifiOff } from "lucide-react";
import { motion } from "framer-motion";
import axios from "axios";

export function ConnectionTab() {
    const [sessionId, setSessionId] = useState("my-first-session");
    const [ownerNumber, setOwnerNumber] = useState("");
    const [status, setStatus] = useState("disconnected");
    const [qr, setQr] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const startSession = async () => {
        if (!sessionId || !ownerNumber) return alert("Fill all fields");
        setLoading(true);
        try {
            await axios.post("http://localhost:3000/session/start", { sessionId, ownerNumber });
            // Polling will handle the rest
        } catch (error) {
            console.error(error);
            alert("Failed to start session");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = setInterval(async () => {
            try {
                const res = await axios.get(`http://localhost:3000/session/status/${sessionId}`);
                setStatus(res.data.status);
                if (res.data.status === "scan_qr") {
                    setQr(res.data.qr);
                } else {
                    setQr(null);
                }
            } catch (e) { }
        }, 3000);
        return () => clearInterval(timer);
    }, [sessionId]);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="glass p-10 rounded-[2rem] space-y-8 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl rounded-full -mr-16 -mt-16" />

                <div className="relative z-10">
                    <h2 className="text-2xl font-bold flex items-center gap-3 text-white">
                        <QrCode size={24} className="text-secondary" /> Setup Connection
                    </h2>
                    <p className="text-slate-400 text-sm mt-2 font-medium">Link your WhatsApp account to start automating with AI.</p>
                </div>

                <div className="space-y-6 relative z-10">
                    <div className="space-y-2">
                        <label className="text-[10px] uppercase text-slate-500 font-bold ml-2 tracking-[0.2em]">Session Name</label>
                        <input
                            value={sessionId}
                            onChange={(e) => setSessionId(e.target.value)}
                            className="w-full bg-slate-950/50 border border-white/5 rounded-2xl px-6 py-5 text-white focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all font-medium"
                            placeholder="e.g. Sales-Bot"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] uppercase text-slate-500 font-bold ml-2 tracking-[0.2em]">Owner Number (with 91)</label>
                        <input
                            value={ownerNumber}
                            onChange={(e) => setOwnerNumber(e.target.value)}
                            className="w-full bg-slate-950/50 border border-white/5 rounded-2xl px-6 py-5 text-white focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all font-medium"
                            placeholder="918302XXXXXX"
                        />
                    </div>

                    <button
                        onClick={startSession}
                        disabled={loading}
                        className="w-full bg-primary hover:bg-primary/90 disabled:opacity-50 text-white font-bold py-5 rounded-full shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-3 uppercase text-xs tracking-[0.2em] active:scale-95 neon-shadow"
                    >
                        {loading ? <Loader2 className="animate-spin" size={20} /> : (
                            <>
                                <Wifi size={20} />
                                Initialize QR
                            </>
                        )}
                    </button>
                </div>
            </div>

            <div className="glass rounded-[2rem] flex flex-col items-center justify-center p-10 text-center min-h-[450px] relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-primary/5" />
                {status === "connected" ? (
                    <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="space-y-6 relative z-10">
                        <div className="w-24 h-24 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto text-green-500 shadow-2xl shadow-green-500/20">
                            <ShieldCheck size={48} />
                        </div>
                        <div>
                            <h3 className="text-3xl font-bold text-white">Device Connected</h3>
                            <p className="text-slate-400 mt-2 font-medium">Your session <span className="text-primary font-bold">{sessionId}</span> is running at full power.</p>
                        </div>
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 text-green-500 text-[10px] font-bold uppercase tracking-widest border border-green-500/20">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            Secure Connection
                        </div>
                    </motion.div>
                ) : qr ? (
                    <div className="space-y-8 relative z-10">
                        <div className="bg-white p-6 rounded-[2.5rem] inline-block shadow-2xl relative">
                            <div className="absolute -inset-4 bg-primary/20 blur-3xl -z-10 rounded-full animate-pulse" />
                            <img
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(qr)}`}
                                alt="QR Code"
                                width={280}
                                height={280}
                                className="rounded-xl"
                            />
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold text-white">Scan QR Code</h3>
                            <p className="text-slate-400 text-sm mt-3 font-medium max-w-[250px] mx-auto leading-relaxed">
                                Open WhatsApp on your phone, go to <span className="text-white">Linked Devices</span> and scan this code.
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6 text-slate-700 relative z-10">
                        <div className="w-24 h-24 rounded-full bg-slate-900 border border-white/5 flex items-center justify-center mx-auto">
                            <WifiOff size={48} />
                        </div>
                        <p className="font-bold text-xl tracking-tight">Offline Mode</p>
                        <p className="text-slate-500 text-sm max-w-[200px] mx-auto">Initialize a session to see the QR code and connect.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
