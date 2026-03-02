import React from "react";
import { MessageSquare } from "lucide-react";

export default function Navbar() {
    return (
        <header className="sticky top-0 z-50 w-full border-b border-black/5 glass-panel">
            <div className="container mx-auto max-w-7xl px-4 sm:px-6 h-16 flex items-center justify-between">
                {/* Logo */}
                <div className="flex items-center gap-2">
                    <div className="bg-blue-600 p-1.5 rounded-lg">
                        <MessageSquare className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-xl font-bold tracking-tight text-slate-900 font-outfit">
                        BulkReply.io
                    </span>
                </div>

                {/* Desktop Nav */}
                <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
                    <a href="#features" className="hover:text-blue-600 transition-colors">Features</a>
                    <a href="#how-it-works" className="hover:text-blue-600 transition-colors">How it works</a>
                    <a href="#pricing" className="hover:text-blue-600 transition-colors">Pricing</a>
                </nav>

                {/* CTA */}
                <div className="flex items-center gap-4">
                    <button className="hidden sm:inline-flex text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
                        Log in
                    </button>
                    <button className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-5 py-2 rounded-full transition-all shadow-sm hover:shadow-md">
                        Get Started
                    </button>
                </div>
            </div>
        </header>
    );
}
