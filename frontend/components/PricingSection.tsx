import React from "react";
import { Check } from "lucide-react";

export default function PricingSection() {
    const plans = [
        {
            name: "Starter",
            desc: "Perfect for small businesses and independent marketers.",
            price: "$29",
            period: "/month",
            features: [
                "Up to 3 WhatsApp Instances",
                "5,000 Messages/month",
                "Standard Anti-Ban Delay",
                "Basic Analytics",
                "Community Support"
            ],
            cta: "Start Free Trial",
            highlight: false
        },
        {
            name: "Professional",
            desc: "For growing teams that need raw volume and automation.",
            price: "$79",
            period: "/month",
            features: [
                "Up to 10 WhatsApp Instances",
                "50,000 Messages/month",
                "Advanced AI Anti-Ban",
                "Real-time Read Analytics",
                "Auto-Reply Chatbots",
                "Priority Support"
            ],
            cta: "Get Professional",
            highlight: true
        },
        {
            name: "Enterprise",
            desc: "Uncapped scaling for marketing agencies and large teams.",
            price: "$199",
            period: "/month",
            features: [
                "Unlimited Instances",
                "Unlimited Messages",
                "Dedicated Account Manager",
                "Custom Workflow Integration",
                "White-label Dashboard",
                "24/7 Phone Support"
            ],
            cta: "Contact Sales",
            highlight: false
        }
    ];

    return (
        <section id="pricing" className="py-24 bg-white relative">
            <div className="container mx-auto max-w-7xl px-4 sm:px-6">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <h2 className="text-4xl font-bold text-slate-900 mb-4 font-outfit">Simple, transparent pricing</h2>
                    <p className="text-lg text-slate-500">Pick the plan that fits your growth. No hidden limits.</p>
                </div>

                <div className="grid md:grid-cols-3 gap-8 items-center max-w-6xl mx-auto">
                    {plans.map((plan, idx) => (
                        <div
                            key={idx}
                            className={`rounded-3xl p-8 relative flex flex-col h-full bg-white border ${plan.highlight
                                    ? "border-blue-500 shadow-xl shadow-blue-500/10 md:-translate-y-4"
                                    : "border-slate-200 shadow-sm"
                                }`}
                        >
                            {plan.highlight && (
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-blue-600 text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wide shadow-md">
                                    Most Popular
                                </div>
                            )}

                            <div className="mb-6">
                                <h3 className="text-2xl font-bold text-slate-900 font-outfit mb-2">{plan.name}</h3>
                                <p className="text-slate-500 text-sm h-10">{plan.desc}</p>
                            </div>

                            <div className="mb-8 flex items-baseline gap-1">
                                <span className="text-5xl font-extrabold text-slate-900 font-outfit">{plan.price}</span>
                                <span className="text-slate-500 font-medium">{plan.period}</span>
                            </div>

                            <div className="mb-8 flex-grow">
                                <ul className="space-y-4">
                                    {plan.features.map((feat, fIdx) => (
                                        <li key={fIdx} className="flex items-center gap-3">
                                            <div className={`p-0.5 rounded-full ${plan.highlight ? "bg-blue-100 text-blue-600" : "bg-slate-100 text-slate-500"}`}>
                                                <Check className="w-3.5 h-3.5" strokeWidth={3} />
                                            </div>
                                            <span className="text-slate-600 text-sm">{feat}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <button
                                className={`w-full py-3.5 rounded-xl font-medium transition-all ${plan.highlight
                                        ? "bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20"
                                        : "bg-slate-50 hover:bg-slate-100 text-slate-900 border border-slate-200"
                                    }`}
                            >
                                {plan.cta}
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
