"use client";
import React, { useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
    ArrowLeft, MessageSquare, Phone, Mail, Clock, CheckCircle2,
    Loader2, Send, HelpCircle, AlertCircle, ChevronDown, ChevronUp
} from "lucide-react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

const FAQS = [
    {
        q: "WhatsApp session disconnect क्यों हो जाती है?",
        a: "अगर आपका फोन इंटरनेट से disconnect हो जाए, या WhatsApp app बंद हो जाए, तो session खत्म हो सकती है। Session page से फिर से QR scan करके reconnect करें।",
    },
    {
        q: "Bulk message भेजने की limit क्या है?",
        a: "Free plan में 500 messages/month, Starter में 10,000/month और Pro में unlimited messages भेज सकते हैं।",
    },
    {
        q: "Campaign fail क्यों होता है?",
        a: "सबसे common कारण है invalid/banned WhatsApp number या session disconnect होना। सुनिश्चित करें कि session active है।",
    },
    {
        q: "Payment / Subscription से related issue?",
        a: "Payment issue के लिए contact form fill करें। हम 24 घंटे के भीतर resolve करते हैं।",
    },
    {
        q: "WhatsApp नंबर ban हो जाए तो क्या करें?",
        a: "ज्यादा तेज़ message sending से ban हो सकता है। Anti-ban section में delay settings configure करें और session हटाकर नया नंबर add करें।",
    },
];

const SUBJECTS = [
    "Technical Issue",
    "Billing / Payment",
    "Account Problem",
    "Feature Request",
    "WhatsApp Session Issue",
    "Campaign Problem",
    "Other",
];

export default function HelplinePage() {
    const { user, userData } = useAuth();
    const router = useRouter();
    const [form, setForm] = useState({
        subject: "",
        message: "",
        phone: userData?.phone || "",
    });
    const [sending, setSending] = useState(false);
    const [sent, setSent] = useState(false);
    const [error, setError] = useState("");
    const [openFaq, setOpenFaq] = useState<number | null>(null);

    const handleSubmit = async () => {
        if (!user) return;
        if (!form.subject || !form.message) {
            setError("Subject और Message दोनों ज़रूरी हैं।");
            return;
        }
        setSending(true);
        setError("");
        try {
            await addDoc(collection(db, "support_tickets"), {
                uid: user.uid,
                email: user.email,
                displayName: userData?.displayName || "User",
                subject: form.subject,
                message: form.message,
                phone: form.phone,
                status: "open",
                createdAt: serverTimestamp(),
            });
            setSent(true);
            setForm({ subject: "", message: "", phone: userData?.phone || "" });
        } catch (err: any) {
            setError(err.message || "कुछ गलत हो गया। फिर कोशिश करें।");
        } finally {
            setSending(false);
        }
    };

    if (!user || !userData) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto pb-12">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6 pt-2">
                <button
                    onClick={() => router.back()}
                    className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:scale-105 active:scale-95"
                    style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
                >
                    <ArrowLeft className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
                </button>
                <h1 className="text-xl font-bold font-outfit tracking-tight" style={{ color: 'var(--text-primary)' }}>
                    Helpline & Support
                </h1>
            </div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">

                {/* Contact Cards */}
                <div className="grid grid-cols-3 gap-3">
                    {[
                        { icon: Phone, label: "Call", sub: "+91 98765 43210", color: "#10b981", bg: "rgba(16,185,129,0.1)", href: "tel:+919876543210" },
                        { icon: Mail, label: "Email", sub: "support@bulkreply.io", color: "#4f46e5", bg: "rgba(79,70,229,0.1)", href: "mailto:support@bulkreply.io" },
                        { icon: MessageSquare, label: "WhatsApp", sub: "Chat Support", color: "#25D366", bg: "rgba(37,211,102,0.1)", href: "https://wa.me/919876543210" },
                    ].map(({ icon: Icon, label, sub, color, bg, href }) => (
                        <a key={label} href={href} target="_blank" rel="noreferrer"
                            className="rounded-2xl p-4 flex flex-col items-center gap-2 text-center transition-all hover:scale-105 active:scale-95"
                            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: bg }}>
                                <Icon className="w-5 h-5" style={{ color }} />
                            </div>
                            <p className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>{label}</p>
                            <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{sub}</p>
                        </a>
                    ))}
                </div>

                {/* Timing */}
                <div className="rounded-2xl p-4 flex items-center gap-3"
                    style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
                    <Clock className="w-5 h-5 text-amber-500 shrink-0" />
                    <div>
                        <p className="text-sm font-bold text-amber-600">Support Hours</p>
                        <p className="text-xs text-amber-500">Mon – Sat: 9:00 AM – 6:00 PM IST</p>
                    </div>
                </div>

                {/* FAQ */}
                <div>
                    <h3 className="text-xs font-bold uppercase tracking-widest mb-3 ml-1" style={{ color: 'var(--text-muted)' }}>
                        Frequently Asked Questions
                    </h3>
                    <div className="rounded-2xl overflow-hidden divide-y"
                        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderColor: 'var(--border)' }}>
                        {FAQS.map((faq, i) => (
                            <div key={i}>
                                <button
                                    className="w-full flex items-center justify-between p-4 text-left transition-colors"
                                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
                                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                                >
                                    <div className="flex items-center gap-3">
                                        <HelpCircle className="w-4 h-4 shrink-0" style={{ color: 'var(--color-primary, #4f46e5)' }} />
                                        <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{faq.q}</span>
                                    </div>
                                    {openFaq === i
                                        ? <ChevronUp className="w-4 h-4 shrink-0" style={{ color: 'var(--text-muted)' }} />
                                        : <ChevronDown className="w-4 h-4 shrink-0" style={{ color: 'var(--text-muted)' }} />
                                    }
                                </button>
                                {openFaq === i && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        className="px-4 pb-4"
                                    >
                                        <p className="text-sm ml-7" style={{ color: 'var(--text-secondary)' }}>{faq.a}</p>
                                    </motion.div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Contact Form */}
                <div>
                    <h3 className="text-xs font-bold uppercase tracking-widest mb-3 ml-1" style={{ color: 'var(--text-muted)' }}>
                        Submit a Support Ticket
                    </h3>
                    <div className="rounded-2xl p-5 space-y-4"
                        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>

                        {sent && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="rounded-xl p-4 flex items-center gap-3"
                                style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}
                            >
                                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                                <div>
                                    <p className="text-sm font-bold text-emerald-600">Ticket Submit हो गया!</p>
                                    <p className="text-xs text-emerald-500 mt-0.5">हम 24 घंटे के भीतर आपसे संपर्क करेंगे।</p>
                                </div>
                            </motion.div>
                        )}

                        {!sent && (
                            <>
                                <div>
                                    <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                                        Subject *
                                    </label>
                                    <select
                                        value={form.subject}
                                        onChange={e => setForm(prev => ({ ...prev, subject: e.target.value }))}
                                        className="w-full px-4 py-2.5 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500"
                                        style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                                    >
                                        <option value="">-- Select Issue Type --</option>
                                        {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                                        Your Phone (Optional)
                                    </label>
                                    <input
                                        type="tel"
                                        value={form.phone}
                                        onChange={e => setForm(prev => ({ ...prev, phone: e.target.value }))}
                                        placeholder="+91 XXXXX XXXXX"
                                        className="w-full px-4 py-2.5 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500"
                                        style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                                        Describe Your Issue *
                                    </label>
                                    <textarea
                                        rows={5}
                                        value={form.message}
                                        onChange={e => setForm(prev => ({ ...prev, message: e.target.value }))}
                                        placeholder="अपनी समस्या विस्तार से बताएं..."
                                        className="w-full px-4 py-2.5 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                                        style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                                    />
                                </div>

                                {error && (
                                    <div className="rounded-lg px-3 py-2.5 flex items-center gap-2 text-sm font-medium"
                                        style={{ background: 'rgba(239,68,68,0.08)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}>
                                        <AlertCircle className="w-4 h-4 shrink-0" /> {error}
                                    </div>
                                )}

                                <button
                                    onClick={handleSubmit}
                                    disabled={sending}
                                    className="w-full py-3.5 rounded-2xl font-bold text-sm text-white flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
                                    style={{ background: 'linear-gradient(135deg, #f59e0b, #ef4444)' }}
                                >
                                    {sending
                                        ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</>
                                        : <><Send className="w-4 h-4" /> Send Ticket</>
                                    }
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
