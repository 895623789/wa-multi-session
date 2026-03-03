import React from "react";
import { MessageSquare } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function Navbar() {
    return (
        <header className="sticky top-0 z-50 w-full border-b border-black/5 glass-panel bg-white/80 backdrop-blur-md">
            <div className="container mx-auto max-w-7xl px-4 sm:px-6 h-16 flex items-center justify-between">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
                    <div className="bg-slate-900 w-10 h-10 rounded-xl overflow-hidden shadow-md flex items-center justify-center border border-amber-500/20">
                        <Image src="/logo.png" alt="BulkReply Logo" width={32} height={32} className="object-cover" />
                    </div>
                    <span className="text-xl font-bold tracking-tight text-slate-900 font-outfit">
                        BulkReply<span className="text-blue-600">.io</span>
                    </span>
                </Link>

                {/* Desktop Nav */}
                <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
                    <a href="#features" className="hover:text-blue-600 transition-colors">Features</a>
                    <a href="#how-it-works" className="hover:text-blue-600 transition-colors">How it works</a>
                    <a href="#pricing" className="hover:text-blue-600 transition-colors">Pricing</a>
                </nav>

                {/* CTA */}
                <div className="flex items-center gap-4">
                    <Link
                        href="/login"
                        className="hidden sm:inline-flex text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
                    >
                        Log in
                    </Link>
                    <Link
                        href="/signup"
                        className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-5 py-2 rounded-full transition-all shadow-sm hover:shadow-md"
                    >
                        Get Started
                    </Link>
                </div>
            </div>
        </header>
    );
}
