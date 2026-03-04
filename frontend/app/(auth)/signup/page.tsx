"use client";
import React, { useState } from "react";
import { MessageSquare, ArrowRight, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { auth, db, googleProvider } from "@/lib/firebase";
import { createUserWithEmailAndPassword, updateProfile, signInWithPopup } from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";

function firebaseError(code: string): string {
    const map: Record<string, string> = {
        'auth/email-already-in-use': '⚠️ This email is already registered. Please log in instead.',
        'auth/invalid-email': '⚠️ Please enter a valid email address.',
        'auth/weak-password': '⚠️ Password must be at least 6 characters.',
        'auth/operation-not-allowed': '⚠️ Sign-ups are currently disabled. Please contact support.',
        'auth/network-request-failed': '⚠️ Network error. Please check your internet connection.',
    };
    return map[code] || '⚠️ Something went wrong. Please try again.';
}

export default function SignupPage() {
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [company, setCompany] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [defaultTrialDays, setDefaultTrialDays] = useState(7);

    React.useEffect(() => {
        const fetchConfig = async () => {
            try {
                const snap = await getDoc(doc(db, "platform_config", "general"));
                if (snap.exists() && snap.data().defaultTrialDays !== undefined) {
                    setDefaultTrialDays(snap.data().defaultTrialDays);
                }
            } catch (err) {
                console.error("Failed to fetch trial config:", err);
            }
        };
        fetchConfig();
    }, []);

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            await updateProfile(userCredential.user, {
                displayName: `${firstName} ${lastName}`
            });

            // Create Firestore user document (1 write)
            const expiryDate = new Date();
            expiryDate.setDate(expiryDate.getDate() + defaultTrialDays); // dynamic free trial

            await setDoc(doc(db, "users", userCredential.user.uid), {
                displayName: `${firstName} ${lastName}`,
                email: email,
                company: company || "",
                phone: "",
                country: "IN",
                industry: "",
                teamSize: "",
                role: "",
                location: "",
                onboardingComplete: false,
                subscription: {
                    status: 'active',
                    plan: 'starter',
                    startedAt: serverTimestamp(),
                    expiresAt: expiryDate
                },
                sessions: [],
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });

            window.location.href = "/onboarding";
        } catch (err: any) {
            console.error(err);
            setError(firebaseError(err.code));
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignup = async () => {
        setLoading(true);
        setError("");
        try {
            const result = await signInWithPopup(auth, googleProvider);
            const user = result.user;

            // Check if user document exists
            const userDoc = await getDoc(doc(db, "users", user.uid));

            if (!userDoc.exists()) {
                // If new user via Google, create the document first
                const expiryDate = new Date();
                expiryDate.setDate(expiryDate.getDate() + defaultTrialDays); // dynamic free trial

                await setDoc(doc(db, "users", user.uid), {
                    displayName: user.displayName || "",
                    email: user.email || "",
                    company: "",
                    phone: "",
                    country: "IN",
                    industry: "",
                    teamSize: "",
                    role: "",
                    location: "",
                    onboardingComplete: false,
                    subscription: {
                        status: 'active',
                        plan: 'starter',
                        startedAt: serverTimestamp(),
                        expiresAt: expiryDate
                    },
                    sessions: [],
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp()
                });
                window.location.href = "/onboarding";
            } else {
                if (userDoc.data()?.onboardingComplete) {
                    window.location.href = "/dashboard";
                } else {
                    window.location.href = "/onboarding";
                }
            }
        } catch (err: any) {
            console.error(err);
            setError(firebaseError(err.code));
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
                    className="max-w-md w-full mx-auto py-12"
                >
                    <div className="flex items-center gap-2 mb-10">
                        <div className="bg-blue-600 p-1.5 rounded-lg">
                            <MessageSquare className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-xl font-bold tracking-tight text-slate-900 font-outfit">
                            BulkReply.io
                        </span>
                    </div>

                    <h1 className="text-3xl font-extrabold text-slate-900 mb-2 font-outfit">
                        Get started with BulkReply
                    </h1>
                    <p className="text-slate-500 mb-8">Join 10,000+ marketers and scale your WhatsApp outreach.</p>

                    {error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-xl mb-4 border border-red-100">{error}</div>}

                    {/* Google Signup Button */}
                    <button
                        onClick={handleGoogleSignup}
                        disabled={loading}
                        className="w-full py-3.5 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl flex items-center justify-center gap-3 transition-all shadow-sm hover:shadow-md mb-6 disabled:opacity-50"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /></svg>
                        <span className="text-slate-700 font-bold text-sm">Sign up with Google</span>
                    </button>

                    <div className="w-full flex items-center gap-4 mb-6">
                        <div className="h-px bg-slate-100 flex-1"></div>
                        <span className="text-[10px] text-slate-400 font-bold whitespace-nowrap uppercase tracking-widest">or sign up with email</span>
                        <div className="h-px bg-slate-100 flex-1"></div>
                    </div>

                    <form className="space-y-4" onSubmit={handleSignup}>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">First name</label>
                                <input
                                    type="text"
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
                                    className="w-full px-4 py-3.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 shadow-sm"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Last name</label>
                                <input
                                    type="text"
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                    className="w-full px-4 py-3.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 shadow-sm"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Business email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                suppressHydrationWarning
                                className="w-full px-4 py-3.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 shadow-sm"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Company name</label>
                            <input
                                type="text"
                                value={company}
                                onChange={(e) => setCompany(e.target.value)}
                                className="w-full px-4 py-3.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 shadow-sm"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                suppressHydrationWarning
                                placeholder="6+ characters"
                                className="w-full px-4 py-3.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 shadow-sm"
                                required
                            />
                        </div>

                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-8 py-3.5 rounded-xl font-bold transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2"
                            >
                                {loading ? "Creating account..." : <>Get started now <ArrowRight className="w-4 h-4" /></>}
                            </button>
                        </div>
                    </form>

                    <p className="text-xs text-slate-400 mt-8 text-center">
                        Already have an account? <Link href="/login" className="text-blue-600 font-bold hover:underline">Log in</Link>
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
