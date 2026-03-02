"use client";
import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, MessageCircle, Send, Settings, LogOut, User } from "lucide-react";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import Image from "next/image";

export default function DashboardSidebar() {
    const pathname = usePathname();

    const links = [
        { name: "Home", href: "/dashboard", icon: LayoutDashboard },
        { name: "Sessions", href: "/dashboard/sessions", icon: MessageCircle },
        { name: "Campaigns", href: "/dashboard/campaigns", icon: Send },
        { name: "Neural AI", href: "/dashboard/ai", icon: Settings },
        { name: "Profile", href: "/dashboard/profile", icon: User },
    ];

    return (
        <aside className="group/sidebar w-[80px] hover:w-64 border-r border-slate-200/60 bg-white/80 backdrop-blur-xl hidden md:flex flex-col items-center hover:items-start h-full shrink-0 py-6 px-4 shadow-[2px_0_24px_rgba(0,0,0,0.02)] z-50 transition-all duration-300 ease-out overflow-hidden">
            {/* Brand/Logo */}
            <div className="mb-10 w-full flex items-center justify-center group-hover/sidebar:justify-start px-1">
                <Link href="/" className="flex items-center gap-3 w-full">
                    <div className="flex items-center justify-center w-12 h-12 shrink-0 rounded-[18px] bg-gradient-to-tr from-slate-900 to-slate-800 text-white shadow-lg shadow-slate-900/10 hover:scale-105 transition-transform">
                        <Image src="/logo.png" alt="Logo" width={24} height={24} className="rounded-md object-contain" />
                    </div>
                    <span className="text-xl font-bold tracking-tight text-slate-900 font-outfit opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-300 whitespace-nowrap">
                        BulkReply
                    </span>
                </Link>
            </div>

            {/* Nav Links */}
            <nav className="flex-1 flex flex-col items-center group-hover/sidebar:items-start gap-3 w-full">
                {links.map((link) => {
                    const isActive = pathname === link.href;
                    const Icon = link.icon;
                    return (
                        <div key={link.name} className="relative group w-full flex justify-center group-hover/sidebar:justify-start">
                            <Link
                                href={link.href}
                                className={`flex items-center w-[48px] group-hover/sidebar:w-full h-12 rounded-[16px] transition-all duration-300 overflow-hidden ${isActive
                                    ? "bg-slate-900 text-white shadow-md shadow-slate-900/20"
                                    : "text-slate-400 hover:bg-slate-100 hover:text-slate-900"
                                    }`}
                            >
                                <div className="w-[48px] h-full flex items-center justify-center shrink-0">
                                    <Icon className={`w-5 h-5 transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
                                </div>
                                <span className={`font-semibold text-sm whitespace-nowrap opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-300 pr-4 ${isActive ? "text-white" : ""}`}>
                                    {link.name}
                                </span>
                            </Link>

                            {/* Tooltip (Only visible when sidebar is collapsed) */}
                            <div className="absolute left-[100%] ml-4 px-3 py-1.5 bg-slate-800 text-white text-xs font-semibold rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible group-hover/sidebar:hidden transition-all whitespace-nowrap z-50 shadow-lg">
                                {link.name}
                                <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-slate-800 rotate-45"></div>
                            </div>
                        </div>
                    );
                })}
            </nav>

            {/* Bottom Actions */}
            <div className="flex flex-col items-center group-hover/sidebar:items-start gap-4 w-full mt-auto">
                <div className="w-8 group-hover/sidebar:w-full h-[1px] bg-slate-200/60 rounded-full mb-2 transition-all duration-300"></div>
                <div className="relative group w-full flex justify-center group-hover/sidebar:justify-start">
                    <button
                        onClick={async () => { await signOut(auth); window.location.href = "/login"; }}
                        className="flex items-center w-[48px] group-hover/sidebar:w-full h-12 rounded-[16px] text-slate-400 hover:bg-red-50 hover:text-red-600 transition-all duration-300 overflow-hidden"
                    >
                        <div className="w-[48px] h-full flex items-center justify-center shrink-0">
                            <LogOut className="w-5 h-5 group-hover:scale-110 transition-transform" />
                        </div>
                        <span className="font-semibold text-sm whitespace-nowrap opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-300 pr-4">
                            Logout
                        </span>
                    </button>
                    {/* Tooltip (Only visible when sidebar is collapsed) */}
                    <div className="absolute left-[100%] ml-4 px-3 py-1.5 bg-red-600 text-white text-xs font-semibold rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible group-hover/sidebar:hidden transition-all whitespace-nowrap z-50 shadow-lg">
                        Logout
                        <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-red-600 rotate-45"></div>
                    </div>
                </div>
            </div>
        </aside>
    );
}
