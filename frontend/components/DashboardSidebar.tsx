import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, MessageCircle, Send, Settings, LogOut, User, PanelLeftClose, PanelLeftOpen, Bot } from "lucide-react";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import Image from "next/image";

export default function DashboardSidebar() {
    const pathname = usePathname();
    const [isExpanded, setIsExpanded] = useState(true);

    const links = [
        { name: "Home", href: "/dashboard", icon: LayoutDashboard },
        { name: "Agents", href: "/dashboard/agents", icon: Bot },
        { name: "Campaigns", href: "/dashboard/campaigns", icon: Send },
        { name: "Neural AI", href: "/dashboard/ai", icon: Settings },
        { name: "Profile", href: "/dashboard/profile", icon: User },
    ];

    return (
        <aside
            className={`relative hidden md:flex flex-col h-full shrink-0 py-4 px-3 z-50 transition-all duration-300 ease-out overflow-visible ${isExpanded ? 'w-64 items-start' : 'w-[72px] items-center'}`}
            style={{
                background: 'var(--sidebar-bg)',
                borderRight: '1px solid var(--sidebar-border)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
            }}
        >
            {/* Toggle Button */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="absolute -right-3 top-8 w-6 h-6 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-500 hover:text-indigo-600 shadow-sm z-[60] transition-transform hover:scale-110"
                title={isExpanded ? "Collapse Sidebar" : "Expand Sidebar"}
            >
                {isExpanded ? <PanelLeftClose size={14} /> : <PanelLeftOpen size={14} />}
            </button>

            {/* Brand/Logo */}
            <div className={`mb-8 w-full flex items-center ${isExpanded ? 'justify-start px-1' : 'justify-center'}`}>
                <Link href="/" className="flex items-center gap-3 w-full">
                    <div className="flex items-center justify-center w-10 h-10 shrink-0 rounded-[14px] bg-slate-900 overflow-hidden shadow-lg hover:scale-105 transition-transform border border-amber-500/30">
                        <Image src="/logo.png" alt="Logo" width={40} height={40} className="object-cover" />
                    </div>
                    {isExpanded && (
                        <span className="text-lg font-bold tracking-tight font-outfit transition-opacity duration-300 whitespace-nowrap"
                            style={{ color: 'var(--text-primary)' }}>
                            BulkReply
                        </span>
                    )}
                </Link>
            </div>

            {/* Nav Links */}
            <nav className={`flex-1 flex flex-col gap-1.5 w-full ${isExpanded ? 'items-start' : 'items-center'}`}>
                {links.map((link) => {
                    const isActive = pathname === link.href;
                    const Icon = link.icon;
                    return (
                        <div key={link.name} className="relative group w-full flex justify-center">
                            <Link
                                href={link.href}
                                className={`flex items-center h-12 rounded-[14px] transition-all duration-200 overflow-hidden ${isExpanded ? 'w-full' : 'w-[48px]'}`}
                                style={isActive ? {
                                    background: 'rgba(79,70,229,0.12)',
                                    color: '#4f46e5',
                                } : {
                                    color: 'var(--text-secondary)',
                                }}
                                onMouseEnter={e => {
                                    if (!isActive) {
                                        (e.currentTarget as HTMLElement).style.background = 'var(--bg-hover)';
                                        (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)';
                                    }
                                }}
                                onMouseLeave={e => {
                                    if (!isActive) {
                                        (e.currentTarget as HTMLElement).style.background = 'transparent';
                                        (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)';
                                    }
                                }}
                            >
                                <div className="w-[48px] h-full flex items-center justify-center shrink-0">
                                    <Icon className={`w-5 h-5 transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
                                </div>
                                {isExpanded && (
                                    <span className="font-semibold text-sm whitespace-nowrap transition-opacity duration-300 pr-4">
                                        {link.name}
                                    </span>
                                )}
                            </Link>

                            {/* Tooltip (Only visible when sidebar is collapsed) */}
                            {!isExpanded && (
                                <div className="absolute left-[100%] ml-4 px-3 py-1.5 text-xs font-semibold rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 shadow-lg"
                                    style={{ background: 'var(--text-primary)', color: 'var(--bg)' }}>
                                    {link.name}
                                    <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 rotate-45"
                                        style={{ background: 'var(--text-primary)' }}></div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </nav>

            {/* Bottom Actions */}
            <div className={`flex flex-col gap-4 w-full mt-auto ${isExpanded ? 'items-start' : 'items-center'}`}>
                <div className={`h-[1px] rounded-full mb-2 transition-all duration-300 ${isExpanded ? 'w-full' : 'w-8'}`}
                    style={{ background: 'var(--border)' }}></div>
                <div className="relative group w-full flex justify-center">
                    <button
                        onClick={async () => { await signOut(auth); window.location.href = "/login"; }}
                        className={`flex items-center h-12 rounded-[14px] transition-all duration-200 overflow-hidden ${isExpanded ? 'w-full' : 'w-[48px]'}`}
                        style={{ color: 'var(--text-secondary)' }}
                        onMouseEnter={e => {
                            (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.08)';
                            (e.currentTarget as HTMLElement).style.color = '#ef4444';
                        }}
                        onMouseLeave={e => {
                            (e.currentTarget as HTMLElement).style.background = 'transparent';
                            (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)';
                        }}
                    >
                        <div className="w-[48px] h-full flex items-center justify-center shrink-0">
                            <LogOut className="w-5 h-5 group-hover:scale-110 transition-transform" />
                        </div>
                        {isExpanded && (
                            <span className="font-semibold text-sm whitespace-nowrap transition-opacity duration-300 pr-4">
                                Logout
                            </span>
                        )}
                    </button>
                    {/* Tooltip */}
                    {!isExpanded && (
                        <div className="absolute left-[100%] ml-4 px-3 py-1.5 bg-red-600 text-white text-xs font-semibold rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 shadow-lg">
                            Logout
                            <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-red-600 rotate-45"></div>
                        </div>
                    )}
                </div>
            </div>
        </aside>
    );
}
