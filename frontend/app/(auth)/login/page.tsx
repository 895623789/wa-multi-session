"use client";
import React, { useState } from "react";
import { MessageSquare, ArrowRight } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { auth } from "@/lib/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            await signInWithEmailAndPassword(auth, email, password);
            window.location.href = "/dashboard";
        } catch (err: any) {
            console.error(err);
            setError(err.message || "Failed to sign in.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-md w-full mx-auto px-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white p-8 sm:p-12 rounded-3xl shadow-2xl border border-slate-100 flex flex-col items-center"
            >
                <div className="flex items-center gap-2 mb-8">
                    <div className="bg-blue-600 p-1.5 rounded-lg">
                        <MessageSquare className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-xl font-bold tracking-tight text-slate-900 font-outfit">
                        BulkReply.io
                    </span>
                </div>

                {error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-xl mb-4 border border-red-100 w-full text-center">{error}</div>}

                <form className="w-full space-y-4 mb-6" onSubmit={handleLogin}>
                    <div>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="john.doe@acme.com"
                            className="w-full px-4 py-3.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900 shadow-sm"
                            required
                            suppressHydrationWarning
                        />
                    </div>
                    <div>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="password"
                            className="w-full px-4 py-3.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900 shadow-sm"
                            required
                            suppressHydrationWarning
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-6 py-3.5 rounded-xl font-medium transition-all shadow-sm hover:shadow-md mt-2"
                    >
                        {loading ? "Signing in..." : "Sign in"}
                    </button>
                </form>

                <div className="flex items-center justify-between w-full text-sm font-medium text-slate-500 mb-8">
                    <a href="#" className="hover:text-blue-600">Forgot password?</a>
                    <Link href="/signup" className="hover:text-blue-600">Sign up your team</Link>
                </div>

                <div className="w-full flex items-center gap-4 mb-6">
                    <div className="h-px bg-slate-100 flex-1"></div>
                    <span className="text-xs text-slate-400 font-medium whitespace-nowrap">or log in with one of the following platforms</span>
                    <div className="h-px bg-slate-100 flex-1"></div>
                </div>

                <div className="flex items-center justify-center gap-3 w-full">
                    <button className="flex-1 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg flex items-center justify-center transition-colors">
                        <svg className="w-5 h-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /><path d="M1 1h22v22H1z" fill="none" /></svg>
                    </button>
                    <button className="flex-1 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg flex items-center justify-center transition-colors">
                        <svg className="w-5 h-5 text-[#0072C6]" fill="currentColor" viewBox="0 0 24 24"><path d="M11.4 24H0V12.6h11.4V24zM24 24H12.6V12.6H24V24zM11.4 11.4H0V0h11.4v11.4zM24 11.4H12.6V0H24v11.4z" /></svg>
                    </button>
                </div>
            </motion.div>

            <p className="text-center text-xs text-slate-400 mt-8">
                This site is protected by reCAPTCHA and the Google Privacy Policy and Terms of Service apply.
            </p>
        </div>
    );
}
