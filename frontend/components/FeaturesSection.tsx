import React from "react";
import { Send, Shield, Zap, RefreshCw, Smartphone, BarChart3 } from "lucide-react";

export default function FeaturesSection() {
    const features = [
        {
            icon: <Send className="w-6 h-6 text-blue-600" />,
            title: "Bulk Messaging",
            description: "Send thousands of personalized messages across multiple numbers simultaneously."
        },
        {
            icon: <Shield className="w-6 h-6 text-blue-600" />,
            title: "Anti-Ban Protection",
            description: "Our proprietary AI mimics human typing delays and randomized scheduling to keep accounts safe."
        },
        {
            icon: <BarChart3 className="w-6 h-6 text-blue-600" />,
            title: "Real-time Analytics",
            description: "Track delivered, read, and replied statuses natively in an easy-to-read dashboard."
        },
        {
            icon: <Zap className="w-6 h-6 text-blue-600" />,
            title: "Smart Reply Bots",
            description: "Auto-respond to interested leads with predefined conversational AI flows."
        },
        {
            icon: <Smartphone className="w-6 h-6 text-blue-600" />,
            title: "Native Session Link",
            description: "Scan a QR or use pairing code to attach as many WhatsApp Web instances as you need."
        },
        {
            icon: <RefreshCw className="w-6 h-6 text-blue-600" />,
            title: "Variable Injection",
            description: "Personalize every single message with {name}, {company}, or custom spreadsheet columns."
        }
    ];

    return (
        <section id="features" className="py-24 bg-white relative">
            <div className="container mx-auto max-w-7xl px-4 sm:px-6">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <h2 className="text-4xl font-bold text-slate-900 mb-4 font-outfit">Everything you need to scale</h2>
                    <p className="text-lg text-slate-500">Stop doing manual outreach. Connect your sessions and let the automation engine securely handle your marketing pipelines.</p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {features.map((feat, idx) => (
                        <div key={idx} className="bg-slate-50 border border-slate-100 p-8 rounded-2xl hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300 group">
                            <div className="bg-blue-100/50 w-14 h-14 rounded-xl flex items-center justify-center mb-6 group-hover:bg-blue-600 group-hover:text-white group-hover:-translate-y-1 transition-all">
                                {React.cloneElement(feat.icon as React.ReactElement<any>, { className: "w-6 h-6 text-blue-600 group-hover:text-white transition-colors" })}
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-2 font-outfit">{feat.title}</h3>
                            <p className="text-slate-500 leading-relaxed">{feat.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
