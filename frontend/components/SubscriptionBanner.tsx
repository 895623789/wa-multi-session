"use client";
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, CreditCard, Zap, Shield, ArrowRight, Bot } from 'lucide-react';
import { useSubscription } from '@/lib/useSubscription';

export default function SubscriptionBanner() {
    const { isExpired, subscription } = useSubscription();

    if (!isExpired) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-xl"
            >
                <motion.div
                    initial={{ scale: 0.9, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    className="w-full max-w-2xl bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/20 relative"
                >
                    {/* Progress Bar (Expired) */}
                    <div className="absolute top-0 left-0 w-full h-2 bg-rose-500" />

                    <div className="p-10 md:p-14 text-center">
                        <div className="w-20 h-20 bg-rose-50 dark:bg-rose-900/20 rounded-[1.5rem] flex items-center justify-center text-rose-500 mx-auto mb-8 shadow-inner ring-4 ring-rose-500/10">
                            <AlertCircle className="w-10 h-10" />
                        </div>

                        <h2 className="text-4xl font-black text-slate-900 dark:text-white mb-4 font-outfit tracking-tight">
                            Subscription Expired! 🛑
                        </h2>
                        <p className="text-slate-500 dark:text-slate-400 text-lg font-bold leading-relaxed mb-10 max-w-md mx-auto">
                            Your <span className="text-indigo-600 font-black uppercase">{subscription?.plan}</span> plan has reached its end.
                            AI replies and message flows have been paused to protect your account.
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
                            <div className="p-6 bg-slate-50 dark:bg-slate-900/50 rounded-[1.5rem] border border-slate-100 dark:border-slate-700 text-left">
                                <div className="flex items-center gap-3 mb-2">
                                    <Bot className="w-5 h-5 text-indigo-500" />
                                    <span className="text-xs font-black uppercase text-slate-400 tracking-widest">Status</span>
                                </div>
                                <p className="text-sm font-black text-slate-800 dark:text-white">AI Engine Paused</p>
                            </div>
                            <div className="p-6 bg-slate-50 dark:bg-slate-900/50 rounded-[1.5rem] border border-slate-100 dark:border-slate-700 text-left">
                                <div className="flex items-center gap-3 mb-2">
                                    <Shield className="w-5 h-5 text-indigo-500" />
                                    <span className="text-xs font-black uppercase text-slate-400 tracking-widest">Next Step</span>
                                </div>
                                <p className="text-sm font-black text-slate-800 dark:text-white">Immediate Renewal Required</p>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <button
                                onClick={() => window.location.href = '/owner/plans'}
                                className="px-10 py-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black flex items-center justify-center gap-3 transition-all shadow-xl shadow-indigo-600/25 hover:scale-105 active:scale-95"
                            >
                                <Zap className="w-5 h-5" /> Renew Now <ArrowRight className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => window.location.href = 'https://wa.me/9198XXXXXXXX'}
                                className="px-8 py-5 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-2xl font-black border border-slate-200 dark:border-slate-600 transition-all hover:bg-slate-50 dark:hover:bg-slate-600 text-sm"
                            >
                                Contact Support
                            </button>
                        </div>

                        <p className="mt-8 text-[10px] font-black text-slate-400 uppercase tracking-widest opacity-60">
                            BulkReply.io Premium Enforcement System v1.0
                        </p>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
