import React from "react";
import { QrCode, FileSpreadsheet, Send } from "lucide-react";

export default function StepsSection() {
    const steps = [
        {
            num: "01",
            icon: <QrCode className="w-6 h-6" />,
            title: "Link your WhatsApp",
            description: "Easily connect one or multiple WhatsApp accounts via QR code. No complex API approvals needed."
        },
        {
            num: "02",
            icon: <FileSpreadsheet className="w-6 h-6" />,
            title: "Upload Contacts",
            description: "Import your leads via CSV or Excel mapping custom fields for deep personalization."
        },
        {
            num: "03",
            icon: <Send className="w-6 h-6" />,
            title: "Start Sending",
            description: "Configure humanized delays, select your numbers, and hit send. Watch the analytics roll in."
        }
    ];

    return (
        <section id="how-it-works" className="py-12 bg-slate-50 relative border-y border-slate-100">
            <div className="container mx-auto max-w-7xl px-4 sm:px-6">
                <div className="mb-8">
                    <h2 className="text-2xl font-bold text-slate-900 mb-2 font-outfit">How the tool works</h2>
                    <p className="text-sm text-slate-500">Go from 0 to 10,000 personalized messages in just three steps.</p>
                </div>

                <div className="grid md:grid-cols-3 gap-5 relative">
                    <div className="hidden md:block absolute top-[40px] left-[15%] right-[15%] h-px bg-slate-200" />

                    {steps.map((step, idx) => (
                        <div key={idx} className="relative bg-white p-5 rounded-xl shadow-sm border border-slate-100 z-10 flex flex-col h-full">
                            <div className="flex items-center justify-between mb-5">
                                <div className="w-9 h-9 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                                    {React.cloneElement(step.icon as React.ReactElement<any>, { className: "w-4 h-4" })}
                                </div>
                                <span className="text-2xl font-black text-slate-100 font-outfit">{step.num}</span>
                            </div>
                            <h3 className="text-base font-bold text-slate-900 mb-1 font-outfit">{step.title}</h3>
                            <p className="text-xs text-slate-500 leading-relaxed flex-grow">{step.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
