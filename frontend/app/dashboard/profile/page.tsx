"use client";
import React from "react";
import { useAuth } from "@/components/AuthProvider";
import { useTheme } from "@/lib/ThemeContext";
import { motion } from "framer-motion";
import { User, CreditCard, HelpCircle, LogOut, ChevronRight, Settings, Sun, Moon } from "lucide-react";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
    const { user, userData } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const router = useRouter();
    const isDark = theme === "dark";

    const handleLogout = async () => {
        try {
            await signOut(auth);
            window.location.href = "/login";
        } catch (error) {
            console.error("Logout error", error);
        }
    };

    if (!user || !userData) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    const { displayName, email, plan = "Free", company } = userData;
    const initials = displayName
        ? displayName.split(" ").map((n: string) => n[0]).join("").toUpperCase().substring(0, 2)
        : email ? email[0].toUpperCase() : "U";

    return (
        <div className="max-w-2xl mx-auto pb-12">

            {/* Header */}
            <div className="mb-6 pt-2">
                <h1 className="text-xl font-bold font-outfit tracking-tight" style={{ color: 'var(--text-primary)' }}>
                    Profile
                </h1>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
            >
                {/* ── User ID Card ── */}
                <div className="rounded-2xl p-6 flex items-center gap-5 shadow-sm"
                    style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-xl font-bold font-outfit shadow-md shrink-0">
                        {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                        <h2 className="text-xl font-bold truncate" style={{ color: 'var(--text-primary)' }}>
                            {displayName || "User"}
                        </h2>
                        <p className="text-sm truncate" style={{ color: 'var(--text-secondary)' }}>{email}</p>
                        {company && (
                            <p className="text-xs font-semibold text-indigo-500 mt-1 uppercase tracking-wider">
                                {company}
                            </p>
                        )}
                    </div>
                </div>

                {/* ── Settings Groups ── */}
                <div className="space-y-6">

                    {/* Account Section */}
                    <div>
                        <h3 className="text-xs font-bold uppercase tracking-widest mb-3 ml-2 lg:ml-0"
                            style={{ color: 'var(--text-muted)' }}>Account</h3>
                        <div className="rounded-2xl overflow-hidden divide-y"
                            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderColor: 'var(--border)' }}>

                            <button onClick={() => router.push('/dashboard/profile/edit')} className="w-full flex items-center justify-between p-4 transition-colors group"
                                style={{ '--hover-bg': 'var(--bg-hover)' } as React.CSSProperties}
                                onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
                                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                                        style={{ background: 'rgba(79,70,229,0.1)' }}>
                                        <User className="w-4 h-4" style={{ color: 'var(--color-primary)' }} />
                                    </div>
                                    <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Edit Profile</span>
                                </div>
                                <ChevronRight className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                            </button>

                            <button onClick={() => router.push('/dashboard/profile/subscription')} className="w-full flex items-center justify-between p-4 transition-colors group"
                                onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
                                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                                        style={{ background: 'rgba(79,70,229,0.08)' }}>
                                        <CreditCard className="w-4 h-4" style={{ color: 'var(--color-primary)' }} />
                                    </div>
                                    <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Subscription</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold px-2 py-0.5 rounded-md uppercase tracking-wider"
                                        style={{ background: 'var(--bg-subtle)', color: 'var(--text-secondary)' }}>
                                        {plan}
                                    </span>
                                    <ChevronRight className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                                </div>
                            </button>

                            <button onClick={() => router.push('/dashboard/profile/preferences')} className="w-full flex items-center justify-between p-4 transition-colors group"
                                onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
                                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                                        style={{ background: 'var(--bg-subtle)' }}>
                                        <Settings className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
                                    </div>
                                    <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Settings</span>
                                </div>
                                <ChevronRight className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                            </button>
                        </div>
                    </div>

                    {/* ── Appearance (Dark / Light Toggle) ── */}
                    <div>
                        <h3 className="text-xs font-bold uppercase tracking-widest mb-3 ml-2 lg:ml-0"
                            style={{ color: 'var(--text-muted)' }}>Appearance</h3>
                        <div className="rounded-2xl p-4 flex items-center justify-between"
                            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                                    style={{ background: isDark ? 'rgba(99,102,241,0.15)' : 'rgba(251,191,36,0.12)' }}>
                                    {isDark
                                        ? <Moon className="w-4 h-4 text-indigo-400" />
                                        : <Sun className="w-4 h-4 text-amber-500" />
                                    }
                                </div>
                                <div>
                                    <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                                        {isDark ? "Dark Mode" : "Light Mode"}
                                    </p>
                                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                        {isDark ? "Switch to light" : "Switch to dark"}
                                    </p>
                                </div>
                            </div>

                            {/* iOS-style animated toggle */}
                            <button
                                onClick={toggleTheme}
                                role="switch"
                                aria-checked={isDark}
                                aria-label="Toggle dark mode"
                                className="relative w-14 h-7 rounded-full p-0.5 transition-colors duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
                                style={{
                                    background: isDark
                                        ? '#4f46e5'
                                        : '#cbd5e1',
                                    cursor: 'pointer',
                                }}
                            >
                                <motion.div
                                    layout
                                    transition={{ type: "spring", stiffness: 700, damping: 35 }}
                                    className="w-6 h-6 rounded-full shadow-md flex items-center justify-center"
                                    style={{
                                        background: '#ffffff',
                                        marginLeft: isDark ? 'auto' : '0',
                                    }}
                                >
                                    {isDark
                                        ? <Moon className="w-3 h-3 text-indigo-500" />
                                        : <Sun className="w-3 h-3 text-amber-400" />
                                    }
                                </motion.div>
                            </button>
                        </div>
                    </div>

                    {/* Support Section */}
                    <div>
                        <h3 className="text-xs font-bold uppercase tracking-widest mb-3 ml-2 lg:ml-0"
                            style={{ color: 'var(--text-muted)' }}>Support</h3>
                        <div className="rounded-2xl overflow-hidden"
                            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                            <button onClick={() => router.push('/dashboard/profile/helpline')} className="w-full flex items-center justify-between p-4 transition-colors"
                                onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
                                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                                        style={{ background: 'rgba(245,158,11,0.1)' }}>
                                        <HelpCircle className="w-4 h-4 text-amber-500" />
                                    </div>
                                    <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                                        Helpline / Contact Us
                                    </span>
                                </div>
                                <ChevronRight className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                            </button>
                        </div>
                    </div>

                    {/* Sign Out */}
                    <div>
                        <div className="rounded-2xl overflow-hidden mt-2"
                            style={{ background: 'var(--bg-card)', border: '1px solid rgba(239,68,68,0.2)' }}>
                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center justify-center gap-2 p-4 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors group"
                            >
                                <LogOut className="w-4 h-4" />
                                <span className="text-sm font-bold">Sign Out</span>
                            </button>
                        </div>
                    </div>

                </div>
            </motion.div>
        </div>
    );
}
