"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/components/AuthProvider";
import { doc, setDoc, updateDoc, arrayUnion, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Building2, MapPin, Phone, Briefcase, Users, Rocket, Lightbulb, ClipboardList, QrCode, ArrowRight, ArrowLeft, Check, ChevronRight, Smartphone, SkipForward } from "lucide-react";
import QRCode from "react-qr-code";

// ─── Step Data ────────────────────────────────────────────────────────────────
const INDUSTRIES = [
    "Technology", "E-commerce", "Real Estate", "Education / EdTech",
    "Healthcare", "Finance / FinTech", "Marketing / Agency",
    "Retail", "Food & Beverage", "Travel & Hospitality", "Other"
];

const TEAM_SIZES = ["Just me", "2-5", "6-10", "11-50", "51-200", "200+"];

const ROLES = [
    "Founder / CEO", "Co-Founder", "CTO / Tech Lead",
    "Marketing Manager", "Sales Manager", "Operations", "Other"
];

const COUNTRIES = [
    { code: "IN", name: "India", flag: "🇮🇳", dial: "+91" },
    { code: "US", name: "USA", flag: "🇺🇸", dial: "+1" },
    { code: "PK", name: "Pakistan", flag: "🇵🇰", dial: "+92" },
];

// ─── Welcome Slides ──────────────────────────────────────────────────────────
const welcomeSlides = [
    {
        icon: Rocket,
        color: "blue",
        title: "What BulkReply.io Can Do",
        subtitle: "Your AI-Powered WhatsApp Command Center",
        items: [
            { emoji: "🤖", text: "AI auto-replies to every customer message — 24/7" },
            { emoji: "📱", text: "Connect multiple WhatsApp numbers simultaneously" },
            { emoji: "📤", text: "Run bulk outreach campaigns with anti-ban protection" },
            { emoji: "🧠", text: "Neural Admin — talk to your AI agent in natural language" },
        ]
    },
    {
        icon: Lightbulb,
        color: "amber",
        title: "Endless Possibilities",
        subtitle: "What You Can Achieve",
        items: [
            { emoji: "💬", text: "24/7 customer support bots that never sleep" },
            { emoji: "🎯", text: "AI-powered lead generation & qualification" },
            { emoji: "📊", text: "Track message analytics & campaign performance" },
            { emoji: "🔗", text: "Multi-agent: Image vision, PDF reading, voice transcription" },
        ]
    },
    {
        icon: ClipboardList,
        color: "green",
        title: "Real Use Cases",
        subtitle: "How Businesses Use BulkReply.io",
        items: [
            { emoji: "🛒", text: "E-commerce: Auto-reply order status, returns, product queries" },
            { emoji: "🏠", text: "Real Estate: Instant property details & scheduling" },
            { emoji: "📚", text: "EdTech: Course info, enrollment, doubt clearing" },
            { emoji: "🏥", text: "Services: Appointment booking, follow-ups, reminders" },
        ]
    }
];

// ─── Main Component ──────────────────────────────────────────────────────────
export default function OnboardingPage() {
    const { user, userData } = useAuth();
    const [step, setStep] = useState(0);
    const [saving, setSaving] = useState(false);

    // Form fields
    const [company, setCompany] = useState("");
    const [industry, setIndustry] = useState("");
    const [teamSize, setTeamSize] = useState("");
    const [role, setRole] = useState("");
    const [phone, setPhone] = useState("");
    const [country, setCountry] = useState("IN");
    const [location, setLocation] = useState("");

    // First bot
    const [qrCode, setQrCode] = useState("");
    const [botStatus, setBotStatus] = useState("");
    const [isPolling, setIsPolling] = useState(false);

    // Pre-fill from existing data
    useEffect(() => {
        if (userData) {
            setCompany(userData.company || "");
            setIndustry(userData.industry || "");
            setTeamSize(userData.teamSize || "");
            setRole(userData.role || "");
            setPhone(userData.phone || "");
            setLocation(userData.location || "");
        }
    }, [userData]);

    // Already onboarded? Redirect
    useEffect(() => {
        if (userData?.onboardingComplete) {
            window.location.href = "/dashboard";
        }
    }, [userData]);

    const totalSteps = 6; // 2 form + 3 welcome + 1 bot

    // ── Save onboarding data ─────────────────────────────────────────────────
    const saveAndComplete = async (skipBot = false) => {
        if (!user) return;
        setSaving(true);
        try {
            await setDoc(doc(db, "users", user.uid), {
                company, industry, teamSize, role, phone, country, location,
                onboardingComplete: true,
                updatedAt: serverTimestamp()
            }, { merge: true });
            window.location.href = "/dashboard";
        } catch (err) {
            console.error("Save error:", err);
        } finally {
            setSaving(false);
        }
    };

    // ── Start first bot ──────────────────────────────────────────────────────
    const startFirstBot = useCallback(async () => {
        if (!user) return;
        const sessionId = `${user.uid}_bot-1`;
        setBotStatus("Starting your first bot...");
        setQrCode("");

        try {
            const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";
            const res = await fetch(`${baseUrl}/session/start`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ sessionId, uid: user.uid })
            });
            const data = await res.json();
            setBotStatus(data.message || data.error);
            if (data.message?.includes("started")) {
                setIsPolling(true);
            }
        } catch {
            setBotStatus("Failed to start bot. You can set it up later from the dashboard.");
        }
    }, [user]);

    // Poll for QR
    useEffect(() => {
        if (!isPolling || !user) return;
        const sessionId = `${user.uid}_bot-1`;
        const interval = setInterval(async () => {
            try {
                const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";
                const res = await fetch(`${baseUrl}/session/status/${sessionId}`);
                const data = await res.json();
                if (data.qr) {
                    setQrCode(data.qr);
                    setBotStatus("Scan this QR code with WhatsApp");
                }
                if (data.status === "connected") {
                    setBotStatus("✅ Bot connected! Redirecting...");
                    setQrCode("");
                    setIsPolling(false);
                    // Track session in Firestore
                    await updateDoc(doc(db, "users", user.uid), { sessions: arrayUnion(sessionId) });
                    setTimeout(() => saveAndComplete(), 1500);
                }
            } catch { }
        }, 2000);
        return () => clearInterval(interval);
    }, [isPolling, user]);

    // Auto-start bot early when reaching the last welcome slide (step 4)
    // so it's ready by the time they click next to step 5.
    useEffect(() => {
        if ((step === 4 || step === 5) && !qrCode && !isPolling) {
            if (botStatus.includes("Starting") || botStatus.includes("connected") || botStatus.includes("active") || botStatus.includes("Redirecting")) {
                return;
            }
            startFirstBot();
        }
    }, [step, qrCode, isPolling, startFirstBot, botStatus]);

    // ── Validation ───────────────────────────────────────────────────────────
    const canProceed = () => {
        if (step === 0) return company && industry && teamSize && role;
        if (step === 1) return phone && country && location;
        return true;
    };

    const next = () => { if (step < totalSteps - 1) setStep(s => s + 1); };
    const prev = () => { if (step > 0) setStep(s => s - 1); };

    // ── Progress bar ─────────────────────────────────────────────────────────
    const progress = ((step + 1) / totalSteps) * 100;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
            <div className="w-full max-w-lg">

                {/* Progress */}
                <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                            Step {step + 1} of {totalSteps}
                        </span>
                        <span className="text-xs font-bold text-blue-600">{Math.round(progress)}%</span>
                    </div>
                    <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500 ease-out"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>

                {/* Card */}
                <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">

                    {/* ── Step 0: Company Details ── */}
                    {step === 0 && (
                        <div className="p-8">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 rounded-2xl bg-blue-100 flex items-center justify-center">
                                    <Building2 className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-slate-900">Tell us about your business</h2>
                                    <p className="text-xs text-slate-500">This helps us customize your experience</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Company Name</label>
                                    <input value={company} onChange={e => setCompany(e.target.value)} placeholder="e.g., TCS Enterprises"
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Industry</label>
                                    <select value={industry} onChange={e => setIndustry(e.target.value)}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
                                        <option value="">Select industry</option>
                                        {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Team Size</label>
                                        <select value={teamSize} onChange={e => setTeamSize(e.target.value)}
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
                                            <option value="">Select</option>
                                            {TEAM_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Your Role</label>
                                        <select value={role} onChange={e => setRole(e.target.value)}
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
                                            <option value="">Select</option>
                                            {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── Step 1: Contact Info ── */}
                    {step === 1 && (
                        <div className="p-8">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 rounded-2xl bg-green-100 flex items-center justify-center">
                                    <Phone className="w-5 h-5 text-green-600" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-slate-900">Contact Information</h2>
                                    <p className="text-xs text-slate-500">So we can reach you when needed</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Country</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {COUNTRIES.map(c => (
                                            <button key={c.code} type="button" onClick={() => setCountry(c.code)}
                                                className={`flex items-center justify-center gap-2 px-3 py-3 rounded-xl border-2 text-sm font-semibold transition-all ${country === c.code
                                                    ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm'
                                                    : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300'
                                                    }`}>
                                                <span className="text-lg">{c.flag}</span>
                                                <span>{c.name}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Phone Number</label>
                                    <div className="flex gap-2">
                                        <div className="flex items-center gap-1.5 px-3 py-3 bg-slate-100 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 shrink-0">
                                            <span>{COUNTRIES.find(c => c.code === country)?.flag}</span>
                                            <span>{COUNTRIES.find(c => c.code === country)?.dial}</span>
                                        </div>
                                        <input value={phone} onChange={e => setPhone(e.target.value.replace(/[^0-9]/g, ''))}
                                            placeholder="98765 43210" type="tel"
                                            className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Location</label>
                                    <div className="relative">
                                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <input value={location} onChange={e => setLocation(e.target.value)}
                                            placeholder="e.g., Jaipur, India"
                                            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── Steps 2-4: Welcome Guides ── */}
                    {step >= 2 && step <= 4 && (() => {
                        const slide = welcomeSlides[step - 2];
                        const Icon = slide.icon;
                        const colors: Record<string, string> = {
                            blue: "bg-blue-100 text-blue-600",
                            amber: "bg-amber-100 text-amber-600",
                            green: "bg-green-100 text-green-600",
                        };
                        return (
                            <div className="p-8 text-center">
                                <div className={`w-16 h-16 rounded-3xl ${colors[slide.color]} mx-auto flex items-center justify-center mb-5`}>
                                    <Icon className="w-7 h-7" />
                                </div>
                                <h2 className="text-xl font-bold text-slate-900 mb-1">{slide.title}</h2>
                                <p className="text-sm text-slate-500 mb-6">{slide.subtitle}</p>

                                <div className="space-y-3 text-left max-w-sm mx-auto">
                                    {slide.items.map((item, idx) => (
                                        <div key={idx} className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                                            <span className="text-lg">{item.emoji}</span>
                                            <p className="text-sm text-slate-700 leading-relaxed">{item.text}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })()}

                    {/* ── Step 5: First Bot Setup ── */}
                    {step === 5 && (
                        <div className="p-8 text-center">
                            <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-blue-100 to-indigo-100 mx-auto flex items-center justify-center mb-5">
                                <Smartphone className="w-7 h-7 text-blue-600" />
                            </div>
                            <h2 className="text-xl font-bold text-slate-900 mb-1">My First Bot</h2>
                            <p className="text-sm text-slate-500 mb-6">Connect your WhatsApp to get started instantly</p>

                            {qrCode ? (
                                <div className="space-y-4">
                                    <div className="bg-white p-3 rounded-2xl border-2 border-blue-100 shadow-sm inline-block mx-auto">
                                        <QRCode value={qrCode} size={200} style={{ height: "auto", maxWidth: "100%", width: "100%" }} />
                                    </div>
                                    <div className="max-w-xs mx-auto space-y-2 text-left">
                                        <p className="text-xs text-slate-500 flex items-start gap-2"><span className="font-bold text-blue-600">1.</span> Open WhatsApp on your phone</p>
                                        <p className="text-xs text-slate-500 flex items-start gap-2"><span className="font-bold text-blue-600">2.</span> Go to Settings → Linked Devices</p>
                                        <p className="text-xs text-slate-500 flex items-start gap-2"><span className="font-bold text-blue-600">3.</span> Tap "Link a Device" and scan this QR</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200">
                                    <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                                    <p className="text-sm text-slate-600">{botStatus || "Preparing..."}</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── Navigation ── */}
                    <div className="px-8 pb-8 pt-4 flex items-center justify-between">
                        {step > 0 ? (
                            <button onClick={prev}
                                className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors">
                                <ArrowLeft className="w-4 h-4" /> Back
                            </button>
                        ) : <div />}

                        <div className="flex items-center gap-3">
                            {step === 5 && (
                                <button onClick={() => saveAndComplete(true)} disabled={saving}
                                    className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-50">
                                    <SkipForward className="w-4 h-4" /> Skip
                                </button>
                            )}

                            {step < 5 ? (
                                <button onClick={next} disabled={!canProceed()}
                                    className="flex items-center gap-1.5 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-sm font-semibold rounded-xl transition-all shadow-sm">
                                    Continue <ArrowRight className="w-4 h-4" />
                                </button>
                            ) : (
                                <button onClick={() => saveAndComplete()} disabled={saving}
                                    className="flex items-center gap-1.5 px-5 py-2.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-all shadow-sm">
                                    {saving ? "Saving..." : <><Check className="w-4 h-4" /> Go to Dashboard</>}
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Step dots */}
                    <div className="flex items-center justify-center gap-1.5 pb-6">
                        {Array.from({ length: totalSteps }).map((_, i) => (
                            <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === step ? 'w-6 bg-blue-600' : i < step ? 'w-1.5 bg-blue-300' : 'w-1.5 bg-slate-200'}`} />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
