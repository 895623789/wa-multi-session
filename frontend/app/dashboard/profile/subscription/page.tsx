"use client";
import React, { useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Check, Zap, Crown, Building2, Loader2, MessageSquare, Users, Bot, Shield } from "lucide-react";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

declare global {
    interface Window {
        Razorpay: any;
    }
}

const PLANS = [
    {
        id: "free",
        name: "Free",
        price: "₹0",
        period: "/month",
        color: "#64748b",
        gradient: "linear-gradient(135deg, #64748b, #94a3b8)",
        icon: Zap,
        features: [
            "1 WhatsApp Session",
            "500 Messages / month",
            "Basic Bulk Broadcast",
            "Community Support",
        ],
        limit_sessions: 1,
        limit_messages: 500,
    },
    {
        id: "starter",
        name: "Starter",
        price: "₹999",
        period: "/month",
        color: "#4f46e5",
        gradient: "linear-gradient(135deg, #4f46e5, #7c3aed)",
        icon: Crown,
        popular: true,
        features: [
            "5 WhatsApp Sessions",
            "10,000 Messages / month",
            "Advanced Bulk Broadcast",
            "AI Reply Bot",
            "Priority Support",
            "Campaign Analytics",
        ],
        limit_sessions: 5,
        limit_messages: 10000,
    },
    {
        id: "pro",
        name: "Pro",
        price: "₹2,499",
        period: "/month",
        color: "#0ea5e9",
        gradient: "linear-gradient(135deg, #0ea5e9, #6366f1)",
        icon: Building2,
        features: [
            "20 WhatsApp Sessions",
            "Unlimited Messages",
            "White-label Ready",
            "API Access",
            "Team Collaboration",
            "Dedicated Account Manager",
            "SLA 99.9% Uptime",
        ],
        limit_sessions: 20,
        limit_messages: -1,
    },
];

export default function SubscriptionPage() {
    const { user, userData } = useAuth();
    const router = useRouter();
    const [upgrading, setUpgrading] = useState<string | null>(null);
    const [success, setSuccess] = useState("");

    const currentPlan = (userData?.plan || "free").toLowerCase();

    const loadRazorpay = () => {
        return new Promise((resolve) => {
            if (window.Razorpay) {
                resolve(true);
                return;
            }
            const script = document.createElement("script");
            script.src = "https://checkout.razorpay.com/v1/checkout.js";
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
        });
    };

    const handleUpgrade = async (planId: string) => {
        if (!user || planId === currentPlan) return;
        setUpgrading(planId);
        setSuccess("");

        try {
            // Razorpay load script
            const res = await loadRazorpay();
            if (!res) {
                alert("Razorpay SDK failed to load. Are you online?");
                setUpgrading(null);
                return;
            }

            // Dummy options for Razorpay checkout (Client-side only demo)
            // In real app, create orderId from backend first!
            const priceOptions: any = { free: 0, starter: 99900, pro: 249900 };

            const options = {
                key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_dummykey123456", // Put real key in .env
                amount: priceOptions[planId],
                currency: "INR",
                name: "BulkReply.io",
                description: `Upgrade to ${planId.toUpperCase()} Plan`,
                image: "https://your-logo-url.com/logo.png",
                handler: async function (response: any) {
                    // Success callback
                    try {
                        await updateDoc(doc(db, "users", user.uid), {
                            plan: planId.charAt(0).toUpperCase() + planId.slice(1),
                            planUpdatedAt: serverTimestamp(),
                        });
                        setSuccess(`Payment Successful! Upgraded to ${planId.toUpperCase()}!`);
                        setTimeout(() => setSuccess(""), 4000);
                    } catch (err) {
                        console.error("Firestore update error:", err);
                    }
                    setUpgrading(null);
                },
                prefill: {
                    name: userData?.displayName || "User",
                    email: user.email,
                    contact: userData?.phone || "9999999999",
                },
                theme: { color: "#4f46e5" },
                modal: {
                    ondismiss: function () {
                        setUpgrading(null);
                    },
                },
            };

            const rzp = new window.Razorpay(options);

            rzp.on('payment.failed', function (response: any) {
                alert(`Payment failed: ${response.error.description}`);
                setUpgrading(null);
            });

            rzp.open();
        } catch (err) {
            console.error("Upgrade error:", err);
            setUpgrading(null);
        }
    };

    if (!user || !userData) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    const stats = [
        { icon: MessageSquare, label: "Messages Used", value: (userData?.stats?.messagesUsed || 0).toLocaleString() },
        { icon: Users, label: "Active Sessions", value: (userData?.sessions || []).length.toString() },
        { icon: Bot, label: "AI Replies Sent", value: (userData?.stats?.aiRepliesUsed || 0).toLocaleString() },
        { icon: Shield, label: "Current Plan", value: userData?.plan || "Free" },
    ];

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
                    Subscription
                </h1>
            </div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">

                {/* Current Plan Banner */}
                <div className="rounded-2xl p-5 relative overflow-hidden"
                    style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', border: 'none' }}>
                    <div className="absolute -right-6 -top-6 w-28 h-28 rounded-full opacity-20 bg-white" />
                    <div className="absolute -right-2 -bottom-8 w-20 h-20 rounded-full opacity-10 bg-white" />
                    <p className="text-indigo-200 text-xs font-bold uppercase tracking-widest mb-1">Current Plan</p>
                    <p className="text-white text-2xl font-extrabold font-outfit">{userData?.plan || "Free"}</p>
                    <p className="text-indigo-200 text-xs mt-1">Active since account creation</p>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-2 gap-3">
                    {stats.map(({ icon: Icon, label, value }) => (
                        <div key={label} className="rounded-2xl p-4 flex items-center gap-3"
                            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                                style={{ background: 'rgba(79,70,229,0.1)' }}>
                                <Icon className="w-4 h-4" style={{ color: 'var(--color-primary)' }} />
                            </div>
                            <div>
                                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</p>
                                <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{value}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Success Message */}
                {success && (
                    <div className="rounded-xl px-4 py-3 text-sm font-semibold text-emerald-700 flex items-center gap-2"
                        style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}>
                        <Check className="w-4 h-4" /> {success}
                    </div>
                )}

                {/* Plans — desktop: 3-col grid | mobile: horizontal scroll/swipe */}
                <h3 className="text-xs font-bold uppercase tracking-widest ml-1" style={{ color: 'var(--text-muted)' }}>
                    Available Plans
                </h3>

                {/* ── Desktop: 3 columns side-by-side ── */}
                <div className="hidden md:grid md:grid-cols-3 gap-3">
                    {PLANS.map((plan, i) => {
                        const Icon = plan.icon;
                        const isActive = currentPlan === plan.id;
                        const isLoading = upgrading === plan.id;
                        return (
                            <motion.div
                                key={plan.id}
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.07 }}
                                className="rounded-2xl p-4 relative overflow-hidden flex flex-col"
                                style={{
                                    background: 'var(--bg-card)',
                                    border: `1.5px solid ${isActive ? plan.color : 'var(--border)'}`,
                                    boxShadow: isActive ? `0 0 0 1px ${plan.color}20` : 'none',
                                }}
                            >
                                {plan.popular && !isActive && (
                                    <span className="absolute top-3 right-2 text-[9px] font-extrabold px-1.5 py-0.5 rounded-md uppercase tracking-wider text-white"
                                        style={{ background: plan.gradient }}>Popular</span>
                                )}
                                {isActive && (
                                    <span className="absolute top-3 right-2 text-[9px] font-extrabold px-1.5 py-0.5 rounded-md uppercase tracking-wider text-white bg-emerald-500">Active</span>
                                )}
                                <div className="flex flex-col items-start gap-2 mb-3">
                                    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white"
                                        style={{ background: plan.gradient }}>
                                        <Icon className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <p className="font-extrabold text-sm" style={{ color: 'var(--text-primary)' }}>{plan.name}</p>
                                        <p className="text-sm font-bold" style={{ color: plan.color }}>
                                            {plan.price}<span className="text-xs font-normal" style={{ color: 'var(--text-muted)' }}>{plan.period}</span>
                                        </p>
                                    </div>
                                </div>
                                <ul className="space-y-1.5 mb-4 flex-1">
                                    {plan.features.map(feat => (
                                        <li key={feat} className="flex items-start gap-1.5 text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                                            <Check className="w-3 h-3 text-emerald-500 shrink-0 mt-0.5" /> {feat}
                                        </li>
                                    ))}
                                </ul>
                                <button
                                    onClick={() => handleUpgrade(plan.id)}
                                    disabled={isActive || !!upgrading}
                                    className="w-full py-2 rounded-xl text-xs font-bold transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-1.5 mt-auto"
                                    style={{
                                        background: isActive ? 'var(--bg-subtle)' : plan.gradient,
                                        color: isActive ? 'var(--text-muted)' : '#fff',
                                        border: isActive ? '1px solid var(--border)' : 'none',
                                    }}
                                >
                                    {isLoading ? <><Loader2 className="w-3 h-3 animate-spin" /> Wait...</> :
                                        isActive ? 'Current Plan' : 'Upgrade'}
                                </button>
                            </motion.div>
                        );
                    })}
                </div>

                {/* ── Mobile: horizontal drag/scroll with snap ── */}
                <div className="md:hidden -mx-4 px-4">
                    <div
                        className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory"
                        style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}
                    >
                        {PLANS.map((plan, i) => {
                            const Icon = plan.icon;
                            const isActive = currentPlan === plan.id;
                            const isLoading = upgrading === plan.id;
                            return (
                                <motion.div
                                    key={plan.id}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.07 }}
                                    className="rounded-2xl p-4 relative overflow-hidden flex flex-col snap-center shrink-0"
                                    style={{
                                        background: 'var(--bg-card)',
                                        border: `1.5px solid ${isActive ? plan.color : 'var(--border)'}`,
                                        boxShadow: isActive ? `0 0 0 1px ${plan.color}20` : 'none',
                                        width: '72vw',
                                        maxWidth: '280px',
                                        minHeight: '280px',
                                    }}
                                >
                                    {plan.popular && !isActive && (
                                        <span className="absolute top-3 right-3 text-[9px] font-extrabold px-1.5 py-0.5 rounded-md uppercase tracking-wider text-white"
                                            style={{ background: plan.gradient }}>Popular</span>
                                    )}
                                    {isActive && (
                                        <span className="absolute top-3 right-3 text-[9px] font-extrabold px-1.5 py-0.5 rounded-md uppercase tracking-wider text-white bg-emerald-500">Active</span>
                                    )}
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0"
                                            style={{ background: plan.gradient }}>
                                            <Icon className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="font-extrabold text-base" style={{ color: 'var(--text-primary)' }}>{plan.name}</p>
                                            <p className="text-sm font-bold" style={{ color: plan.color }}>
                                                {plan.price}<span className="text-xs font-normal" style={{ color: 'var(--text-muted)' }}>{plan.period}</span>
                                            </p>
                                        </div>
                                    </div>
                                    <ul className="space-y-1.5 mb-4 flex-1">
                                        {plan.features.map(feat => (
                                            <li key={feat} className="flex items-start gap-2 text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                                                <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" /> {feat}
                                            </li>
                                        ))}
                                    </ul>
                                    <button
                                        onClick={() => handleUpgrade(plan.id)}
                                        disabled={isActive || !!upgrading}
                                        className="w-full py-2.5 rounded-xl text-sm font-bold transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2 mt-auto"
                                        style={{
                                            background: isActive ? 'var(--bg-subtle)' : plan.gradient,
                                            color: isActive ? 'var(--text-muted)' : '#fff',
                                            border: isActive ? '1px solid var(--border)' : 'none',
                                        }}
                                    >
                                        {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</> :
                                            isActive ? 'Current Plan' : `Upgrade to ${plan.name}`}
                                    </button>
                                </motion.div>
                            );
                        })}
                        <div className="shrink-0 w-4" />
                    </div>
                    <p className="text-center text-xs mt-1" style={{ color: 'var(--text-muted)' }}>← स्वाइप करें →</p>
                </div>

                <p className="text-center text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
                    Payment gateway integration के बाद Razorpay/Stripe से secure payment होगी।
                </p>
            </motion.div>
        </div>
    );
}
