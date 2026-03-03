"use client";
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import Image from "next/image";

export default function HeroSection() {
    const [backendStatus, setBackendStatus] = useState("Disconnected");

    useEffect(() => {
        fetch("http://localhost:5000/session/list")
            .then(res => res.ok ? res.json() : Promise.reject('Not ok')) // Changed throw new Error to Promise.reject for consistency
            .then(data => setBackendStatus("Connected to API"))
            .catch(err => setBackendStatus("Connection Failed"));
    }, []);

    return (
        <section className="relative pt-12 pb-20 overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 -z-10 w-[600px] h-[600px] bg-blue-50 rounded-full blur-3xl opacity-50 translate-x-1/3 -translate-y-1/3" />
            <div className="absolute bottom-0 left-0 -z-10 w-[400px] h-[400px] bg-sky-50 rounded-full blur-3xl opacity-50 -translate-x-1/3 translate-y-1/3" />

            <div className="container mx-auto max-w-7xl px-4 sm:px-6">
                <div className="grid lg:grid-cols-2 gap-12 items-center">

                    {/* Left Content */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="max-w-2xl"
                    >
                        <div className="inline-flex items-center gap-3 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 mb-6">
                            <div className="flex items-center gap-2 text-blue-600">
                                <span className="flex h-1.5 w-1.5 rounded-full bg-blue-600"></span>
                                <span className="text-[10px] font-semibold uppercase tracking-wider">v4.0 Live Now</span>
                            </div>
                            <div className="w-px h-3 bg-blue-200"></div>
                            <div className={`text-[10px] font-bold uppercase ${backendStatus.includes('Connected') ? 'text-green-600' : 'text-red-500'}`}>
                                API: {backendStatus}
                            </div>
                        </div>

                        <h1 className="text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900 leading-[1.1] mb-5 font-outfit">
                            Supercharge your <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-sky-500">
                                WhatsApp
                            </span> Marketing
                        </h1>

                        <p className="text-base text-slate-600 mb-6 leading-relaxed">
                            Automate multi-session outreach, manage campaigns effortlessly, and hit the inbox every time with our advanced anti-ban AI core.
                        </p>

                        <form
                            className="flex flex-col sm:flex-row gap-3 min-w-full sm:min-w-0 max-w-md mb-5"
                            onSubmit={(e) => {
                                e.preventDefault();
                                window.location.href = "/signup";
                            }}
                        >
                            <input
                                type="email"
                                placeholder="Enter your work email"
                                className="flex-1 px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900 shadow-sm text-sm"
                                required
                                suppressHydrationWarning
                            />
                            <button
                                type="submit"
                                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl font-medium transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2 whitespace-nowrap text-sm"
                            >
                                Start Free Trial <ArrowRight className="w-4 h-4" />
                            </button>
                        </form>

                        <div className="flex items-center gap-6 text-xs text-slate-500">
                            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-green-500" /> No credit card</span>
                            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-green-500" /> 14-day tracking</span>
                        </div>
                    </motion.div>

                    {/* Right Visuals */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="relative"
                    >
                        {/* Main Application Mockup */}
                        <div className="relative z-10 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden transform rotate-1 hover:rotate-0 transition-transform duration-500">
                            <div className="h-10 bg-slate-50 border-b border-slate-100 flex items-center px-4 gap-2">
                                <div className="flex gap-1.5">
                                    <div className="w-3 h-3 rounded-full bg-red-400"></div>
                                    <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                                    <div className="w-3 h-3 rounded-full bg-green-400"></div>
                                </div>
                            </div>
                            <div className="p-6">
                                {/* Mockup inner content */}
                                <div className="flex gap-4">
                                    <div className="w-1/3 space-y-3">
                                        <div className="h-4 bg-slate-100 rounded w-3/4"></div>
                                        <div className="h-8 bg-slate-50 rounded-lg"></div>
                                        <div className="h-8 bg-slate-50 rounded-lg"></div>
                                        <div className="h-8 bg-blue-50 rounded-lg border border-blue-100"></div>
                                    </div>
                                    <div className="w-2/3 space-y-4">
                                        <div className="h-24 bg-slate-50 rounded-xl border border-slate-100 p-4 flex flex-col justify-between">
                                            <div className="h-3 bg-slate-200 rounded w-1/4"></div>
                                            <div className="h-6 bg-slate-300 rounded w-1/2"></div>
                                        </div>
                                        <div className="flex gap-4">
                                            <div className="h-20 bg-slate-50 rounded-xl border border-slate-100 flex-1"></div>
                                            <div className="h-20 bg-slate-50 rounded-xl border border-slate-100 flex-1"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Floating Element - Trust Score */}
                        <motion.div
                            animate={{ y: [0, -10, 0] }}
                            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                            className="absolute -bottom-10 -left-10 z-20 bg-white p-4 rounded-xl shadow-xl border border-slate-100 flex items-start gap-4"
                        >
                            <div className="bg-green-100 p-2.5 rounded-lg">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-green-600">
                                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 font-medium mb-1">Anti-ban Core</p>
                                <p className="text-lg font-bold text-slate-900 leading-none">99.8% Safe</p>
                            </div>
                        </motion.div>
                    </motion.div>

                </div>
            </div>
        </section>
    );
}
