import React from "react";
import { ShieldCheck, Activity, Lock } from "lucide-react";

export default function AntiBanSection() {
    return (
        <section className="py-24 bg-blue-600 relative overflow-hidden">
            {/* Decorative patterns */}
            <div className="absolute top-0 right-0 opacity-10 blur-2xl pointer-events-none">
                <div className="w-[500px] h-[500px] bg-white rounded-full"></div>
            </div>
            <div className="absolute bottom-[-100px] left-[-100px] opacity-10 blur-2xl pointer-events-none">
                <div className="w-[400px] h-[400px] bg-sky-300 rounded-full"></div>
            </div>

            <div className="container mx-auto max-w-7xl px-4 sm:px-6 relative z-10">
                <div className="grid lg:grid-cols-2 gap-16 items-center">

                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-white mb-6">
                            <ShieldCheck className="w-4 h-4 text-green-300" />
                            <span className="text-sm font-semibold tracking-wider">ENTERPRISE SECURITY</span>
                        </div>

                        <h2 className="text-4xl font-bold text-white mb-6 font-outfit">
                            Advanced Anti-Ban Core Architecture
                        </h2>

                        <p className="text-blue-100 text-lg mb-8 leading-relaxed">
                            WhatsApp algorithms are constantly evolving. Our system stays one step ahead using probabilistic human delay curves, IP rotation, and dynamic session spoofing to keep your numbers 100% safe.
                        </p>

                        <div className="space-y-6">
                            {[
                                { icon: <Activity className="w-5 h-5" />, title: "Human Randomization", desc: "Mimics real typing speed and randomizes delays between messages." },
                                { icon: <Lock className="w-5 h-5" />, title: "Session Integrity", desc: "Browser fingerprints and WebSockets match official WhatsApp Web clients." }
                            ].map((item, idx) => (
                                <div key={idx} className="flex items-start gap-4">
                                    <div className="mt-1 bg-white/10 p-2 rounded-lg text-white">
                                        {item.icon}
                                    </div>
                                    <div>
                                        <h4 className="text-white font-bold mb-1">{item.title}</h4>
                                        <p className="text-blue-200 text-sm leading-relaxed">{item.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="relative">
                        <div className="bg-white p-8 rounded-3xl shadow-2xl relative z-10">
                            <div className="flex items-center justify-between mb-8 border-b border-slate-100 pb-4">
                                <h3 className="font-bold text-slate-900 font-outfit">System Health</h3>
                                <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded uppercase flex items-center gap-1">
                                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                                    Secure
                                </span>
                            </div>

                            <div className="space-y-6">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-slate-500 font-medium">Session Fingerprint</span>
                                    <span className="text-sm text-slate-900 font-mono font-bold">MATCHED <CheckIcon className="w-4 h-4 inline text-green-500" /></span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-slate-500 font-medium">Delay Curve Variant</span>
                                    <span className="text-sm text-slate-900 font-mono font-bold">TYPE_B <CheckIcon className="w-4 h-4 inline text-green-500" /></span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-slate-500 font-medium">Risk Score</span>
                                    <div className="w-32 h-2 bg-slate-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-green-500 w-[5%]"></div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8 bg-slate-50 border border-slate-100 p-4 rounded-xl flex items-center justify-center gap-2 text-slate-600 text-sm font-medium">
                                <ShieldCheck className="w-5 h-5 text-blue-500" /> Automatic Protection Active
                            </div>
                        </div>

                        {/* Abstract overlapping card */}
                        <div className="absolute -bottom-6 -right-6 w-full h-full border-2 border-white/20 rounded-3xl -z-10 bg-transparent flex items-end justify-end p-6"></div>
                    </div>

                </div>
            </div>
        </section>
    );
}

function CheckIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg viewBox="0 0 24 24" fill="none" {...props}>
            <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}
