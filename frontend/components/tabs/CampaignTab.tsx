"use client";
import React, { useState } from "react";
import { Plus, Send, Trash2, Wand2, ClipboardPaste } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";

export function CampaignTab() {
    const [sessionId, setSessionId] = useState("my-first-session");
    const [numbers, setNumbers] = useState([""]);
    const [context, setContext] = useState("");
    const [status, setStatus] = useState<string | null>(null);

    const addRow = () => setNumbers([...numbers, ""]);
    const removeRow = (index: number) => setNumbers(numbers.filter((_, i) => i !== index));
    const updateNumber = (index: number, val: string) => {
        const newNumbers = [...numbers];
        newNumbers[index] = val;
        setNumbers(newNumbers);
    };

    const smartPaste = async () => {
        try {
            const text = await navigator.clipboard.readText();
            const extracted = text.match(/\d+/g);
            if (extracted) {
                const cleaned = extracted.filter(n => n.length >= 10).map(n => n.length === 10 ? "91" + n : n);
                setNumbers([...numbers.filter(n => n !== ""), ...cleaned]);
            }
        } catch (e) {
            alert("Clipboard access required");
        }
    };

    const launchCampaign = async () => {
        if (!context || numbers.filter(n => n.length >= 10).length === 0) return alert("Fill all fields");
        setStatus("launching");

        const formattedNumbers = numbers
            .map(n => {
                let val = n.trim().replace(/[^\d]/g, "");
                if (val.length === 10) return "91" + val;
                return val;
            })
            .filter(v => v.length >= 11);

        try {
            await axios.post("http://localhost:3000/campaign/outreach", {
                sessionId,
                numbers: formattedNumbers,
                businessContext: context
            });
            setStatus("success");
        } catch (error) {
            setStatus("error");
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            <div className="lg:col-span-2 space-y-8">
                <div className="glass p-10 rounded-[2rem] space-y-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/5 blur-3xl rounded-full -mr-16 -mt-16" />

                    <div className="flex items-center justify-between relative z-10">
                        <h2 className="text-2xl font-bold flex items-center gap-3 text-white">
                            <Plus size={24} className="text-primary" /> Recipient Numbers
                        </h2>
                        <button
                            onClick={smartPaste}
                            className="px-6 py-3 bg-secondary/10 hover:bg-secondary/20 text-secondary rounded-full text-xs font-bold transition-all flex items-center gap-2 uppercase tracking-widest border border-secondary/20 active:scale-95"
                        >
                            <ClipboardPaste size={16} /> Smart Paste
                        </button>
                    </div>

                    <div className="max-h-[450px] overflow-y-auto space-y-4 pr-3 custom-scrollbar relative z-10">
                        <AnimatePresence initial={false}>
                            {numbers.map((num, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="flex items-center gap-4"
                                >
                                    <div className="flex-1 bg-slate-950/50 border border-white/5 rounded-2xl flex items-center px-6 overflow-hidden focus-within:border-primary/50 transition-colors">
                                        <span className="text-slate-500 font-bold border-r border-white/10 pr-4 mr-4 text-xs tracking-widest">+91</span>
                                        <input
                                            value={num}
                                            onChange={(e) => updateNumber(idx, e.target.value)}
                                            placeholder="8302XXXXXX"
                                            className="bg-transparent border-none outline-none py-5 text-white w-full font-medium"
                                        />
                                    </div>
                                    <button
                                        onClick={() => removeRow(idx)}
                                        className="p-5 rounded-2xl bg-white/5 hover:bg-destructive/10 text-slate-600 hover:text-destructive transition-all border border-white/5 active:scale-90"
                                    >
                                        <Trash2 size={24} />
                                    </button>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>

                    <button
                        onClick={addRow}
                        className="w-full py-5 border-2 border-dashed border-white/5 hover:border-primary/40 hover:bg-primary/5 text-slate-500 hover:text-primary rounded-3xl transition-all font-bold text-sm uppercase tracking-[0.2em]"
                    >
                        + Add New Recipient
                    </button>
                </div>
            </div>

            <div className="space-y-8">
                <div className="glass p-10 rounded-[2rem] space-y-8 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl rounded-full -mr-16 -mt-16" />

                    <h2 className="text-2xl font-bold flex items-center gap-3 text-white relative z-10">
                        <Wand2 size={24} className="text-primary" /> AI Pitch Context
                    </h2>
                    <div className="relative z-10">
                        <textarea
                            value={context}
                            onChange={(e) => setContext(e.target.value)}
                            className="w-full bg-slate-950/50 border border-white/5 rounded-3xl p-6 text-white focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all min-h-[180px] resize-none font-medium leading-relaxed"
                            placeholder="Describe what you want to achieve... e.g. Sell real estate to high-value leads with a 10% discount."
                        />
                    </div>

                    <button
                        onClick={launchCampaign}
                        disabled={status === "launching"}
                        className="w-full bg-primary hover:bg-primary/90 disabled:opacity-50 text-white font-bold py-6 rounded-full shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-3 uppercase text-xs tracking-[0.2em] neon-shadow active:scale-95"
                    >
                        {status === "launching" ? <Loader2 className="animate-spin w-5 h-5" /> : <Send size={20} />}
                        Execute AI Campaign
                    </button>

                    {status === "success" && (
                        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center text-[10px] text-green-500 font-bold uppercase tracking-widest">
                            Campaign deployed to server!
                        </motion.p>
                    )}
                </div>

                <div className="glass p-8 rounded-[2rem] border-primary/20 relative overflow-hidden">
                    <div className="absolute top-2 left-2 w-1 h-8 bg-primary/50 rounded-full" />
                    <h3 className="text-xs font-bold mb-3 text-white uppercase tracking-widest pl-2">Strategy Tip</h3>
                    <p className="text-xs text-slate-400 leading-relaxed pl-2 font-medium">
                        The Gemini AI will analyze your context and respond in the customer's preferred language (Hinglish/English).
                    </p>
                </div>
            </div>
        </div>
    );
}

function Loader2({ className }: { className?: string }) {
    return (
        <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2V6M12 18V22M6 12H2M22 12H18M19.07 4.93L16.24 7.76M7.76 16.24L4.93 19.07M19.07 19.07L16.24 16.24M7.76 7.76L4.93 4.93" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}
