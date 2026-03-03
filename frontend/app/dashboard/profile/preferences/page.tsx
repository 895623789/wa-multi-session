"use client";
import React, { useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Sun, Moon, Bell, BellOff, Globe, Lock, Loader2, CheckCircle2 } from "lucide-react";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useTheme } from "@/lib/ThemeContext";

export default function SettingsPage() {
    const { user, userData } = useAuth();
    const router = useRouter();
    const { theme, toggleTheme } = useTheme();
    const isDark = theme === "dark";

    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState(false);

    const [prefs, setPrefs] = useState({
        emailNotifications: true,
        whatsappNotifications: true,
        campaignAlerts: true,
        sessionAlerts: true,
        language: "Hindi/English",
        timezone: "Asia/Kolkata",
        twoFactorEnabled: false,
    });

    const toggle = (key: keyof typeof prefs) => {
        setPrefs(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleSave = async () => {
        if (!user) return;
        setSaving(true);
        try {
            await updateDoc(doc(db, "users", user.uid), {
                preferences: prefs,
                updatedAt: serverTimestamp(),
            });
            setToast(true);
            setTimeout(() => {
                setToast(false);
                router.back();
            }, 1500);
        } catch (err) {
            console.error("Settings save error:", err);
        } finally {
            setSaving(false);
        }
    };

    if (!user || !userData) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    const ToggleRow = ({
        label, desc, enabled, onToggle, iconOn, iconOff, color = "#4f46e5"
    }: {
        label: string; desc: string; enabled: boolean; onToggle: () => void;
        iconOn: React.ReactNode; iconOff: React.ReactNode; color?: string;
    }) => (
        <div className="flex items-center justify-between py-3.5 border-b last:border-b-0" style={{ borderColor: 'var(--border)' }}>
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: enabled ? `${color}18` : 'var(--bg-subtle)' }}>
                    {enabled ? iconOn : iconOff}
                </div>
                <div>
                    <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{label}</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{desc}</p>
                </div>
            </div>
            <button
                onClick={onToggle}
                role="switch"
                aria-checked={enabled}
                className="relative w-12 h-6 rounded-full p-0.5 transition-colors duration-300 focus:outline-none shrink-0"
                style={{ background: enabled ? color : '#cbd5e1', cursor: 'pointer' }}
            >
                <motion.div
                    layout
                    transition={{ type: "spring", stiffness: 700, damping: 35 }}
                    className="w-5 h-5 bg-white rounded-full shadow"
                    style={{ marginLeft: enabled ? 'auto' : '0' }}
                />
            </button>
        </div>
    );

    return (
        <div className="max-w-2xl mx-auto pb-12">

            {/* ── Toast Notification ── */}
            <AnimatePresence>
                {toast && (
                    <motion.div
                        initial={{ opacity: 0, y: 60, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 60, scale: 0.95 }}
                        transition={{ type: "spring", stiffness: 400, damping: 28 }}
                        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl"
                        style={{
                            background: 'linear-gradient(135deg, #10b981, #059669)',
                            minWidth: '260px',
                            boxShadow: '0 8px 32px rgba(16,185,129,0.35)',
                        }}
                    >
                        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                            <CheckCircle2 className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <p className="text-white font-bold text-sm">Settings Saved!</p>
                            <p className="text-emerald-100 text-xs">आपकी settings save हो गई ✓</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

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
                    Settings
                </h1>
            </div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">

                {/* Theme */}
                <div className="rounded-2xl p-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                    <h3 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>Appearance</h3>
                    <ToggleRow
                        label={isDark ? "Dark Mode" : "Light Mode"}
                        desc={isDark ? "Currently using dark theme" : "Currently using light theme"}
                        enabled={isDark}
                        onToggle={toggleTheme}
                        iconOn={<Moon className="w-4 h-4 text-indigo-400" />}
                        iconOff={<Sun className="w-4 h-4 text-amber-500" />}
                    />
                </div>

                {/* Notifications */}
                <div className="rounded-2xl p-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                    <h3 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>Notifications</h3>
                    <ToggleRow
                        label="Email Notifications"
                        desc="Campaign reports and updates via email"
                        enabled={prefs.emailNotifications}
                        onToggle={() => toggle("emailNotifications")}
                        iconOn={<Bell className="w-4 h-4" style={{ color: '#4f46e5' }} />}
                        iconOff={<BellOff className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />}
                    />
                    <ToggleRow
                        label="WhatsApp Notifications"
                        desc="Alerts on your WhatsApp number"
                        enabled={prefs.whatsappNotifications}
                        onToggle={() => toggle("whatsappNotifications")}
                        iconOn={<Bell className="w-4 h-4 text-emerald-500" />}
                        iconOff={<BellOff className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />}
                        color="#10b981"
                    />
                    <ToggleRow
                        label="Campaign Alerts"
                        desc="Notify when campaign completes or fails"
                        enabled={prefs.campaignAlerts}
                        onToggle={() => toggle("campaignAlerts")}
                        iconOn={<Bell className="w-4 h-4 text-amber-500" />}
                        iconOff={<BellOff className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />}
                        color="#f59e0b"
                    />
                    <ToggleRow
                        label="Session Alerts"
                        desc="Notify when WhatsApp session disconnects"
                        enabled={prefs.sessionAlerts}
                        onToggle={() => toggle("sessionAlerts")}
                        iconOn={<Bell className="w-4 h-4 text-rose-500" />}
                        iconOff={<BellOff className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />}
                        color="#f43f5e"
                    />
                </div>

                {/* Language & Timezone */}
                <div className="rounded-2xl p-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                    <h3 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--text-muted)' }}>Regional</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold mb-1.5 flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
                                <Globe className="w-3.5 h-3.5" /> Language
                            </label>
                            <select
                                value={prefs.language}
                                onChange={e => setPrefs(prev => ({ ...prev, language: e.target.value }))}
                                className="w-full px-4 py-2.5 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500"
                                style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                            >
                                <option>Hindi/English</option>
                                <option>English Only</option>
                                <option>Hindi Only</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                                Timezone
                            </label>
                            <select
                                value={prefs.timezone}
                                onChange={e => setPrefs(prev => ({ ...prev, timezone: e.target.value }))}
                                className="w-full px-4 py-2.5 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500"
                                style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                            >
                                <option value="Asia/Kolkata">Asia/Kolkata (IST +5:30)</option>
                                <option value="UTC">UTC</option>
                                <option value="America/New_York">America/New York (EST)</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Security */}
                <div className="rounded-2xl p-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                    <h3 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>Security</h3>
                    <ToggleRow
                        label="Two-Factor Authentication"
                        desc="Extra security layer for your account"
                        enabled={prefs.twoFactorEnabled}
                        onToggle={() => toggle("twoFactorEnabled")}
                        iconOn={<Lock className="w-4 h-4 text-emerald-500" />}
                        iconOff={<Lock className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />}
                        color="#10b981"
                    />
                </div>

                {/* Save */}
                <button
                    onClick={handleSave}
                    disabled={saving || toast}
                    className="w-full py-3.5 rounded-2xl font-bold text-sm text-white flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
                    style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}
                >
                    {saving
                        ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
                        : "Save Settings"
                    }
                </button>
            </motion.div>
        </div>
    );
}
