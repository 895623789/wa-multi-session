"use client";
import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    MessageCircle,
    Send,
    Settings,
    LogOut,
    User,
    PanelLeftClose,
    PanelLeftOpen,
    Bot,
    ShieldCheck,
    RefreshCcw
} from "lucide-react";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import Image from "next/image";
import { useAuth } from "./AuthProvider";

function cn(...classes: (string | boolean | undefined)[]) {
    return classes.filter(Boolean).join(" ");
}

export default function DashboardSidebar() {
    const pathname = usePathname();
    const [isExpanded, setIsExpanded] = useState(true);
    const { userData } = useAuth();

    const links = [
        { name: "Home", href: "/dashboard", icon: LayoutDashboard },
        { name: "AI", href: "/dashboard/ai", icon: Bot },
        { name: "Agents", href: "/dashboard/agents", icon: Settings },
        { name: "Campaigns", href: "/dashboard/campaigns", icon: Send },
        { name: "Profile", href: "/dashboard/profile", icon: User },
    ];

    return (
        <aside
            className={cn(
                "h-screen hidden md:flex flex-col shrink-0 relative overflow-visible z-[100] transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] shadow-[1px_0_10px_rgba(0,0,0,0.02)]",
                isExpanded ? "w-64" : "w-[76px]"
            )}
            style={{
                background: 'rgba(255, 255, 255, 0.98)',
                backdropFilter: 'blur(20px)',
                borderRight: '1px solid rgba(226, 232, 240, 0.8)',
            }}
        >
            {/* Toggle Button - Restored to PROTRUDING position with MAX prominence */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="absolute -right-4 top-4 w-9 h-9 bg-indigo-600 border-2 border-white rounded-full flex items-center justify-center text-white shadow-[0_0_15px_rgba(79,70,229,0.5)] z-[500] transition-all hover:scale-125 hover:rotate-180 hover:bg-indigo-700 active:scale-95 group/toggle"
            >
                {isExpanded ? <PanelLeftClose size={18} className="group-hover/toggle:scale-110" /> : <PanelLeftOpen size={18} className="group-hover/toggle:scale-110" />}
            </button>

            {/* Brand - Fixed */}
            <div className={`shrink-0 p-4 ${isExpanded ? 'px-6' : 'px-0 flex justify-center'}`}>
                <Link href="/dashboard" className="flex items-center gap-2.5">
                    <div className="flex items-center justify-center w-8 h-8 shrink-0 rounded-xl bg-slate-900 border border-amber-500/30 overflow-hidden shadow-lg shadow-amber-100">
                        <Image src="/logo.png" alt="Logo" width={32} height={32} className="object-cover" />
                    </div>
                    {isExpanded && (
                        <div className="flex flex-col min-w-0">
                            <span className="text-sm font-black text-slate-900 tracking-tighter leading-tight truncate">BulkReply</span>
                            <span className="text-[9px] font-black text-amber-600 uppercase tracking-widest mt-[-2px]">Business Panel</span>
                        </div>
                    )}
                </Link>
            </div>

            {/* Nav - Scrollable Area */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden px-3 custom-scrollbar">
                <nav className="flex flex-col gap-1 py-1">
                    {links.map((link) => {
                        const isActive = pathname === link.href;
                        const Icon = link.icon;
                        return (
                            <div key={link.name} className="relative group w-full flex justify-center">
                                <Link
                                    href={link.href}
                                    className={cn(
                                        "flex items-center h-10 rounded-xl transition-all duration-200 overflow-hidden group/item",
                                        isExpanded ? "w-full px-3" : "w-11 justify-center",
                                        isActive ? "bg-indigo-50 text-indigo-600 shadow-sm shadow-indigo-50/50" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                                    )}
                                >
                                    <Icon size={18} className={cn("shrink-0 transition-transform duration-300", isActive ? "scale-110" : "group-hover/item:scale-110")} />
                                    {isExpanded && (
                                        <span className="ml-3 font-bold text-[13px] whitespace-nowrap tracking-tight">
                                            {link.name}
                                        </span>
                                    )}
                                </Link>

                                {!isExpanded && (
                                    <div className="absolute left-[100%] ml-4 px-3 py-1.5 text-[11px] font-black rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 shadow-xl bg-slate-900 text-white">
                                        {link.name}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </nav>
            </div>

            {/* Bottom Actions - Fixed Area */}
            <div className="shrink-0 p-4 border-t border-slate-50 space-y-2 bg-slate-50/20">
                {/* Owner Panel Switch */}
                {String(userData?.owner) === 'true' && (
                    <Link
                        href="/owner/dashboard"
                        className={cn(
                            "flex items-center gap-2.5 h-9 rounded-xl transition-all duration-300 group shadow-sm border border-indigo-100",
                            isExpanded ? "px-3" : "w-11 justify-center mx-auto",
                            "bg-white text-indigo-600 hover:bg-indigo-50"
                        )}
                    >
                        <ShieldCheck size={14} className="shrink-0 group-hover:scale-110 transition-transform" />
                        {isExpanded && <span className="text-[11px] font-black tracking-tight uppercase">Owner Panel</span>}
                    </Link>
                )}

                {/* Profile Card */}
                <div className={cn(
                    "flex flex-col gap-1.5 p-1.5 rounded-2xl bg-white border border-slate-100 shadow-sm",
                    !isExpanded && "items-center"
                )}>
                    <div className="flex items-center gap-2.5 w-full">
                        <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0 border border-white shadow-sm overflow-hidden">
                            {userData?.photoURL ? (
                                <img src={userData.photoURL} alt="" className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-[11px] font-black text-indigo-500 uppercase">{userData?.displayName?.charAt(0) || 'U'}</span>
                            )}
                        </div>
                        {isExpanded && (
                            <div className="flex-1 min-w-0 pr-1">
                                <p className="text-[11px] font-black text-slate-900 truncate tracking-tight">{userData?.displayName || 'User'}</p>
                                <p className="text-[9px] font-bold text-slate-400 truncate uppercase mt-[-1px] leading-none">{userData?.role || 'Member'}</p>
                            </div>
                        )}
                    </div>

                    <button
                        onClick={async () => { await signOut(auth); window.location.href = "/login"; }}
                        className={cn(
                            "flex items-center gap-2.5 h-8 rounded-lg transition-all duration-200 group/logout w-full",
                            isExpanded ? "px-2" : "justify-center",
                            "hover:bg-rose-50 text-slate-400 hover:text-rose-600"
                        )}
                    >
                        <LogOut size={14} className="shrink-0 transition-transform group-hover/logout:translate-x-0.5" />
                        {isExpanded && <span className="text-[10px] font-black uppercase tracking-widest">Logout Account</span>}
                    </button>
                </div>
            </div>
        </aside>
    );
}
