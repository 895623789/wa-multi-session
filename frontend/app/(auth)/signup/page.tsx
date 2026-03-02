"use client";
import React, { useState } from "react";
import { MessageSquare, ArrowRight, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { auth } from "@/lib/firebase";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";

export default function SignupPage() {
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [company, setCompany] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            await updateProfile(userCredential.user, {
                displayName: `${firstName} ${lastName}`
            });
            window.location.href = "/dashboard";
        } catch (err: any) {
            console.error(err);
            setError(err.message || "Failed to create account.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex bg-white relative z-10">
            {/* Left Form Side */}
            <div className="flex-1 flex flex-col justify-center px-8 sm:px-16 lg:px-24">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="max-w-md w-full mx-auto"
                >
                    <div className="flex items-center gap-2 mb-12">
                        <div className="bg-blue-600 p-1.5 rounded-lg">
                            <MessageSquare className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-xl font-bold tracking-tight text-slate-900 font-outfit">
                            BulkReply.io
                        </span>
                    </div>

                    <h1 className="text-4xl font-extrabold text-slate-900 mb-2 font-outfit">
                        Sign up free <br /> for BulkReply
                    </h1>
                    <p className="text-slate-500 mb-8">No credit card required. 14-day tracking included.</p>

                    {error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-xl mb-4 border border-red-100">{error}</div>}

                    <form className="space-y-4" onSubmit={handleSignup}>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 mb-1.5">First name</label>
                                <input
                                    type="text"
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Last name</label>
                                <input
                                    type="text"
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Business email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                suppressHydrationWarning
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Company name</label>
                            <input
                                type="text"
                                value={company}
                                onChange={(e) => setCompany(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Create a password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                suppressHydrationWarning
                                placeholder="6+ characters"
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
                                required
                            />
                        </div>

                        <div className="pt-4 flex items-center gap-4">
                            <button
                                type="submit"
                                disabled={loading}
                                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-8 py-3 rounded-xl font-medium transition-all shadow-sm hover:shadow-md"
                            >
                                {loading ? "Creating account..." : "Get started now"}
                            </button>
                            <div className="flex items-center gap-1.5 text-sm font-medium text-blue-600">
                                <CheckCircle2 className="w-4 h-4" /> No credit card required
                            </div>
                        </div>
                    </form>

                    <p className="text-xs text-slate-400 mt-12">
                        By signing up you agree to our <a href="#" className="underline">Terms of Service</a> and <a href="#" className="underline">Privacy Policy</a>. Already have an account? <Link href="/login" className="text-blue-600 font-medium">Log in</Link>
                    </p>
                </motion.div>
            </div>

            {/* Right Graphic Side (hidden on small screens) */}
            <div className="hidden lg:flex flex-1 bg-slate-50 items-center justify-center p-12 relative overflow-hidden">
                {/* Decorative blob */}
                <div className="absolute top-[-10%] right-[-10%] w-[800px] h-[800px] bg-blue-100 rounded-full blur-[120px] opacity-60"></div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className="w-full max-w-lg relative z-10"
                >
                    <div className="mb-8 text-center">
                        <p className="text-slate-500 mb-4 font-medium">Join over <strong className="text-slate-900">10,000+ marketers</strong> around the world.</p>
                        <div className="flex justify-center gap-8 opacity-50 grayscale">
                            {/* Mock logos */}
                            <div className="font-bold text-xl uppercase tracking-tighter">Acme Corp</div>
                            <div className="font-bold text-xl uppercase tracking-tighter text-blue-600">Globex</div>
                            <div className="font-bold text-xl uppercase tracking-tighter">Initech</div>
                        </div>
                    </div>

                    <div className="bg-white rounded-3xl p-8 shadow-xl border border-slate-100 relative">
                        <div className="flex -space-x-4 mb-6">
                            <div className="w-12 h-12 rounded-full border-4 border-white bg-blue-100 flex items-center justify-center font-bold text-blue-600">AI</div>
                            <div className="w-12 h-12 rounded-full border-4 border-white bg-green-100 flex items-center justify-center font-bold text-green-600">AB</div>
                            <div className="w-12 h-12 rounded-full border-4 border-white bg-amber-100 flex items-center justify-center font-bold text-amber-600">WA</div>
                        </div>
                        <div className="flex items-end gap-4 mb-8">
                            <div className="text-6xl font-black text-slate-900 tracking-tighter font-outfit">99.8<span className="text-2xl text-slate-400">%</span></div>
                            <div className="text-sm font-medium text-green-500 mb-2 flex items-center gap-1">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
                                Delivery Rate
                            </div>
                        </div>

                        {/* Mock chart area */}
                        <div className="h-32 w-full flex items-end justify-between gap-2 border-b border-slate-100 pb-2 relative">
                            <div className="absolute w-full h-[2px] bg-blue-500/20 top-1/2"></div>
                            <div className="w-1/6 bg-blue-100 rounded-t border-t-2 border-blue-500 h-[30%]"></div>
                            <div className="w-1/6 bg-blue-100 rounded-t border-t-2 border-blue-500 h-[45%]"></div>
                            <div className="w-1/6 bg-blue-100 rounded-t border-t-2 border-blue-500 h-[60%]"></div>
                            <div className="w-1/6 bg-blue-100 rounded-t border-t-2 border-blue-500 h-[50%]"></div>
                            <div className="w-1/6 bg-blue-500 rounded-t border-t-2 border-blue-600 h-[90%] relative shadow-[0_0_20px_rgba(37,99,235,0.3)]">
                                <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs py-1 px-2 rounded whitespace-nowrap font-bold">+12,400</div>
                            </div>
                        </div>
                        <div className="flex justify-between text-xs text-slate-400 mt-2 font-medium">
                            <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
