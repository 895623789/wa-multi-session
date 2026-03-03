import React from "react";
import { ShieldCheck, Activity, Lock } from "lucide-react";

export default function AntiBanSection() {
    return (
        <section className="py-16 bg-blue-600 relative overflow-hidden">
            {/* Decorative patterns */}
            <div className="absolute top-0 right-0 opacity-10 blur-2xl pointer-events-none">
                <div className="w-[400px] h-[400px] bg-white rounded-full"></div>
            </div>
            <div className="absolute bottom-[-100px] left-[-100px] opacity-10 blur-2xl pointer-events-none">
                <div className="w-[300px] h-[300px] bg-sky-300 rounded-full"></div>
            </div>

            <div className="container mx-auto max-w-7xl px-4 sm:px-6 relative z-10">
                <div className="grid lg:grid-cols-2 gap-10 items-center">

                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-white mb-5">
                            <ShieldCheck className="w-3.5 h-3.5 text-green-300" />
                            <span className="text-[10px] font-semibold tracking-wider">ENTERPRISE SECURITY</span>
                        </div>

                        <h2 className="text-3xl font-bold text-white mb-5 font-outfit">
                            Advanced Anti-Ban Core Architecture
                        </h2>

                        <p className="text-blue-100 text-base mb-6 leading-relaxed">
                            WhatsApp algorithms are constantly evolving. Our system stays one step ahead using probabilistic human delay curves, IP rotation, and dynamic session spoofing to keep your numbers 100% safe.
                        </p>

                        <div className="space-y-4">
                            {[
                                { icon: <Activity className="w-4 h-4" />, title: "Human Randomization", desc: "Mimics real typing speed and randomizes delays between messages." },
                                { icon: <Lock className="w-4 h-4" />, title: "Session Integrity", desc: "Browser fingerprints and WebSockets match official WhatsApp Web clients." }
                            ].map((item, idx) => (
                                <div key={idx} className="flex items-start gap-3">
                                    <div className="mt-1 bg-white/10 p-2 rounded-lg text-white">
                                        {item.icon}
                                    </div>
                                    <div>
                                        <h4 className="text-white font-bold mb-0.5 text-sm">{item.title}</h4>
                                        <p className="text-blue-200 text-xs leading-relaxed">{item.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="relative">
                        <div className="bg-white p-5 rounded-3xl shadow-2xl relative z-10">
                            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-2">
                                <h3 className="font-bold text-slate-900 font-outfit text-xs">System Health</h3>
                                <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-1 rounded uppercase flex items-center gap-1">
                                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                                    Secure
                                </span>
                            </div>

                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-xs text-slate-500 font-medium">Session Fingerprint</span>
                                    <span className="text-xs text-slate-900 font-mono font-bold">MATCHED <CheckIcon className="w-3 h-3 inline text-green-500" /></span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-xs text-slate-500 font-medium">Delay Curve Variant</span>
                                    <span className="text-xs text-slate-900 font-mono font-bold">TYPE_B <CheckIcon className="w-3 h-3 inline text-green-500" /></span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-xs text-slate-500 font-medium">Risk Score</span>
                                    <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-green-500 w-[5%]"></div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-4 bg-slate-50 border border-slate-100 p-2 rounded-xl flex items-center justify-center gap-2 text-slate-600 text-[10px] font-medium">
                                <ShieldCheck className="w-4 h-4 text-blue-500" /> Automatic Protection Active
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
