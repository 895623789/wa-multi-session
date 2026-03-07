"use client";
import React, { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
    Building2, MapPin, Phone, Briefcase, Users, Rocket, Lightbulb,
    ClipboardList, ArrowRight, ArrowLeft, Check, Play, SkipForward,
    Languages, Sparkles, BrainCircuit
} from "lucide-react";

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

// ─── Translations ─────────────────────────────────────────────────────────────
const TRANSLATIONS = {
    en: {
        toggle: "Hindi में देखें",
        back: "Back",
        continue: "Continue",
        skip: "Skip",
        finish: "Go to Dashboard",
        saving: "Saving...",
        companyTitle: "Tell us about your business",
        companySub: "This helps us customize your experience",
        companyName: "Company Name",
        industry: "Industry",
        teamSize: "Team Size",
        role: "Your Role",
        contactTitle: "Contact Information",
        contactSub: "So we can reach you when needed",
        country: "Country",
        phone: "Phone Number",
        location: "Location",
        videoTitle: "Watch Quick Tutorial",
        videoSub: "Learn how to use BulkReply.io in just a few minutes",
        slides: [
            {
                title: "WhatsApp AI (Smart Bot)",
                subtitle: "Automate your customer conversations 24/7",
                items: [
                    { emoji: "🤖", text: "Auto-replies to every message in your business tone" },
                    { emoji: "📄", text: "OCR: Extract numbers from images & PDFs automatically" },
                    { emoji: "⚡", text: "Instant engagement to capture leads immediately" },
                ]
            },
            {
                title: "Neural Admin (Frontend AI)",
                subtitle: "Your AI Command Center directly in Dashboard",
                items: [
                    { emoji: "👁️", text: "Vision: Send an image, AI will describe it for you" },
                    { emoji: "🎙️", text: "Multi-modal: Transcribe audio & understand complex docs" },
                    { emoji: "🛡️", text: "Control: Command your bots to start/stop or send messages" },
                ]
            },
            {
                title: "Marketing & Campaigns",
                subtitle: "Scale your business with AI-powered outreach",
                items: [
                    { emoji: "🚀", text: "Bulk Outreach: Send personalized campaigns at scale" },
                    { emoji: "⏰", text: "Scheduling: Reminders for you & follow-ups for clients" },
                    { emoji: "📈", text: "History Analysis: AI studies chats to suggest best replies" },
                ]
            }
        ]
    },
    hi: {
        toggle: "View in English",
        back: "पीछे",
        continue: "आगे बढ़ें",
        skip: "छोड़ें",
        finish: "डैशबोर्ड पर जाएँ",
        saving: "सेव हो रहा है...",
        companyTitle: "अपने बिज़नेस के बारे में बताएं",
        companySub: "यह हमें आपके अनुभव को बेहतर बनाने में मदद करता है",
        companyName: "कंपनी का नाम",
        industry: "इंडस्ट्री",
        teamSize: "टीम का साइज़",
        role: "आपकी भूमिका",
        contactTitle: "संपर्क जानकारी",
        contactSub: "ताकि ज़रूरत पड़ने पर हम आप तक पहुँच सकें",
        country: "देश",
        phone: "फ़ोन नंबर",
        location: "स्थान",
        videoTitle: "ट्यूटोरियल वीडियो देखें",
        videoSub: "कुछ ही मिनटों में BulkReply.io का उपयोग करना सीखें",
        slides: [
            {
                title: "WhatsApp AI (स्मार्ट बॉट)",
                subtitle: "अपने ग्राहकों की बातचीत को 24/7 ऑटोमेट करें",
                items: [
                    { emoji: "🤖", text: "हर मैसेज का आपके बिज़नेस टोन में ऑटो-रिप्लाई" },
                    { emoji: "📄", text: "OCR: इमेज और PDF से अपने आप नंबर निकालें" },
                    { emoji: "⚡", text: "लीड्स को तुरंत कैप्चर करने के लिए इंस्टेंट रिप्लाई" },
                ]
            },
            {
                title: "Neural Admin (Frontend AI)",
                subtitle: "सीधे डैशबोर्ड में आपका AI कमांड सेंटर",
                items: [
                    { emoji: "👁️", text: "विज़न: इमेज भेजें, AI उसकी जानकारी देगा" },
                    { emoji: "🎙️", text: "मल्टी-मोडल: ऑडियो ट्रांसक्राइब करें और डॉक्युमेंट्स समझें" },
                    { emoji: "🛡️", text: "कंट्रोल: बॉट्स को शुरू करने/रोकने या मैसेज भेजने का कमांड दें" },
                ]
            },
            {
                title: "मार्केटिंग और कैंपेन",
                subtitle: "AI-पावर्ड आउटरीच के साथ अपने बिज़नेस को बढ़ाएं",
                items: [
                    { emoji: "🚀", text: "बल्क आउटरीच: बड़े पैमाने पर पर्सनलाइज़्ड मैसेज भेजें" },
                    { emoji: "⏰", text: "शिड्यूलिंग: आपके लिए रिमाइंडर्स और क्लाइंट्स के लिए फॉलो-अप" },
                    { emoji: "📈", text: "हिस्ट्री एनालिसिस: AI चैट पढ़कर सही जवाब सुझाता है" },
                ]
            }
        ]
    }
};

// Default fallback video
const DEFAULT_VIDEO_URL = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";

// Helper: convert YouTube URL to embed URL
function toEmbedUrl(url: string): string {
    try {
        if (url.includes("embed/")) return url;
        const match = url.match(/(?:v=|\/)([\w-]{11})/);
        if (match) return `https://www.youtube.com/embed/${match[1]}?rel=0&modestbranding=1`;
    } catch { }
    return `https://www.youtube.com/embed/dQw4w9WgXcQ?rel=0`;
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function OnboardingPage() {
    const { user, userData } = useAuth();
    const [step, setStep] = useState(0);
    const [saving, setSaving] = useState(false);
    const [lang, setLang] = useState<'en' | 'hi'>('en');

    const t = TRANSLATIONS[lang];

    // Form fields
    const [company, setCompany] = useState("");
    const [industry, setIndustry] = useState("");
    const [teamSize, setTeamSize] = useState("");
    const [role, setRole] = useState("");
    const [phone, setPhone] = useState("");
    const [country, setCountry] = useState("IN");
    const [location, setLocation] = useState("");

    // Video URL from owner config
    const [videoUrl, setVideoUrl] = useState(DEFAULT_VIDEO_URL);

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

    // Fetch onboarding video URL from owner config
    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const snap = await getDoc(doc(db, "platform_config", "onboarding"));
                if (snap.exists() && snap.data().videoUrl) {
                    setVideoUrl(snap.data().videoUrl);
                }
            } catch (err) {
                console.error("Failed to fetch onboarding config:", err);
            }
        };
        fetchConfig();
    }, []);

    const totalSteps = 6; // 2 form + 3 AI slides + 1 video

    // Welcome slides based on language
    const welcomeSlides = t.slides.map((s, idx) => {
        const icons = [Rocket, BrainCircuit, Rocket];
        const colors = ["blue", "indigo", "amber"];
        return {
            ...s,
            icon: icons[idx],
            color: colors[idx]
        };
    });

    // ── Save onboarding data ─────────────────────────────────────────────────
    const saveAndComplete = async () => {
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

                {/* Header with Language Toggle */}
                <div className="flex items-center justify-between mb-4 px-2">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold shadow-sm">B</div>
                        <span className="text-sm font-bold text-slate-800 tracking-tight">BulkReply.io</span>
                    </div>
                    <button
                        onClick={() => setLang(lang === 'en' ? 'hi' : 'en')}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 hover:border-blue-200 transition-all shadow-sm active:scale-95"
                    >
                        <Languages className="w-3.5 h-3.5 text-blue-500" />
                        {t.toggle}
                    </button>
                </div>

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
                <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden min-h-[520px] flex flex-col transition-all duration-500">

                    <div className="flex-1 overflow-y-auto">
                        {/* ── Step 0: Company Details ── */}
                        {step === 0 && (
                            <div className="p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-10 h-10 rounded-2xl bg-blue-100 flex items-center justify-center">
                                        <Building2 className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold text-slate-900">{t.companyTitle}</h2>
                                        <p className="text-xs text-slate-500">{t.companySub}</p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">{t.companyName}</label>
                                        <input value={company} onChange={e => setCompany(e.target.value)} placeholder="e.g., TCS Enterprises"
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white text-sm transition-all" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">{t.industry}</label>
                                        <select value={industry} onChange={e => setIndustry(e.target.value)}
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white text-sm transition-all appearance-none">
                                            <option value="">Select industry</option>
                                            {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
                                        </select>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">{t.teamSize}</label>
                                            <select value={teamSize} onChange={e => setTeamSize(e.target.value)}
                                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white text-sm transition-all appearance-none">
                                                <option value="">Select</option>
                                                {TEAM_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">{t.role}</label>
                                            <select value={role} onChange={e => setRole(e.target.value)}
                                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white text-sm transition-all appearance-none">
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
                            <div className="p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-10 h-10 rounded-2xl bg-emerald-100 flex items-center justify-center">
                                        <Phone className="w-5 h-5 text-emerald-600" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold text-slate-900">{t.contactTitle}</h2>
                                        <p className="text-xs text-slate-500">{t.contactSub}</p>
                                    </div>
                                </div>

                                <div className="space-y-5">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 ml-1">{t.country}</label>
                                        <div className="grid grid-cols-3 gap-3">
                                            {COUNTRIES.map(c => (
                                                <button key={c.code} type="button" onClick={() => setCountry(c.code)}
                                                    className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl border-2 text-xs font-bold transition-all ${country === c.code
                                                        ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm'
                                                        : 'border-slate-100 bg-slate-50 text-slate-500 hover:border-slate-200'
                                                        }`}>
                                                    <span className="text-xl">{c.flag}</span>
                                                    <span>{c.name}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">{t.phone}</label>
                                        <div className="flex gap-2">
                                            <div className="flex items-center gap-2 px-4 py-3 bg-slate-100 border border-slate-200 rounded-2xl text-sm font-bold text-slate-600 shrink-0">
                                                <span>{COUNTRIES.find(c => c.code === country)?.flag}</span>
                                                <span>{COUNTRIES.find(c => c.code === country)?.dial}</span>
                                            </div>
                                            <input value={phone} onChange={e => setPhone(e.target.value.replace(/[^0-9]/g, ''))}
                                                placeholder="98765 43210" type="tel"
                                                className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white text-sm transition-all" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">{t.location}</label>
                                        <div className="relative">
                                            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                            <input value={location} onChange={e => setLocation(e.target.value)}
                                                placeholder="e.g., Jaipur, India"
                                                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white text-sm transition-all" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ── Steps 2-4: Welcome Guides ── */}
                        {step >= 2 && step <= 4 && (() => {
                            const slideIdx = step - 2;
                            const slide = welcomeSlides[slideIdx];
                            const Icon = slide.icon;
                            const colorMap: Record<string, string> = {
                                blue: "bg-blue-100 text-blue-600",
                                indigo: "bg-indigo-100 text-indigo-600",
                                amber: "bg-amber-100 text-amber-600"
                            };
                            return (
                                <div className="p-8 text-center animate-in fade-in slide-in-from-right duration-500">
                                    <div className={`w-16 h-16 rounded-3xl ${colorMap[slide.color]} mx-auto flex items-center justify-center mb-6 shadow-sm`}>
                                        <Icon className="w-8 h-8" />
                                    </div>
                                    <h2 className="text-2xl font-black text-slate-900 mb-2 font-outfit">{slide.title}</h2>
                                    <p className="text-sm font-medium text-slate-500 mb-8 px-4">{slide.subtitle}</p>

                                    <div className="space-y-3.5 text-left max-w-sm mx-auto">
                                        {slide.items.map((item, idx) => (
                                            <div key={idx} className="flex items-start gap-4 p-4 bg-slate-50/70 rounded-2xl border border-slate-100/80 hover:bg-white hover:shadow-xl hover:border-blue-100/50 transition-all duration-300 group">
                                                <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center text-xl shadow-sm border border-slate-100 shrink-0 group-hover:scale-110 transition-transform">
                                                    {item.emoji}
                                                </div>
                                                <p className="text-sm text-slate-700 leading-relaxed font-semibold pt-1.5">{item.text}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })()}

                        {/* ── Step 5: Watch Tutorial Video ── */}
                        {step === 5 && (
                            <div className="p-8 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-red-100 to-red-600/10 mx-auto flex items-center justify-center mb-6 shadow-sm">
                                    <Play className="w-8 h-8 text-red-600 fill-red-600" />
                                </div>
                                <h2 className="text-2xl font-black text-slate-900 mb-2 font-outfit">{t.videoTitle}</h2>
                                <p className="text-sm font-medium text-slate-500 mb-8">{t.videoSub}</p>

                                <div className="rounded-[2rem] overflow-hidden border-4 border-slate-50 shadow-2xl bg-black aspect-video relative group">
                                    <iframe
                                        src={toEmbedUrl(videoUrl)}
                                        title="BulkReply.io Tutorial"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                        className="w-full h-full"
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ── Navigation ── */}
                    <div className="px-8 pb-8 pt-4 flex items-center justify-between bg-white/80 backdrop-blur-sm border-t border-slate-50 shrink-0 relative z-10">
                        {step > 0 ? (
                            <button onClick={prev}
                                className="flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-slate-700 transition-all active:scale-90">
                                <ArrowLeft className="w-4 h-4" /> {t.back}
                            </button>
                        ) : <div />}

                        <div className="flex items-center gap-4">
                            {step === 5 && (
                                <button onClick={() => saveAndComplete()} disabled={saving}
                                    className="flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-red-500 transition-all active:scale-90 disabled:opacity-50">
                                    <SkipForward className="w-4 h-4" /> {t.skip}
                                </button>
                            )}

                            {step < 5 ? (
                                <button onClick={next} disabled={!canProceed()}
                                    className="flex items-center gap-2 px-7 py-3.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-sm font-black rounded-2xl transition-all shadow-[0_8px_20px_rgba(37,99,235,0.25)] hover:shadow-[0_12px_24px_rgba(37,99,235,0.35)] active:scale-95 disabled:hover:shadow-none translate-y-0 hover:-translate-y-0.5">
                                    {t.continue} <ArrowRight className="w-5 h-5" />
                                </button>
                            ) : (
                                <button onClick={() => saveAndComplete()} disabled={saving}
                                    className="flex items-center gap-2 px-7 py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-black rounded-2xl transition-all shadow-[0_8px_20px_rgba(16,185,129,0.25)] hover:shadow-[0_12px_24px_rgba(16,185,129,0.35)] active:scale-95 translate-y-0 hover:-translate-y-0.5">
                                    {saving ? t.saving : <><Check className="w-5 h-5" /> {t.finish}</>}
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Step dots */}
                    <div className="flex items-center justify-center gap-2 pb-6">
                        {Array.from({ length: totalSteps }).map((_, i) => (
                            <button
                                key={i}
                                onClick={() => i < step ? setStep(i) : null}
                                className={`h-1.5 rounded-full transition-all duration-500 ${i === step ? 'w-8 bg-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.3)]' : i < step ? 'w-2 bg-blue-400 cursor-pointer' : 'w-2 bg-slate-200 cursor-default'}`}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
