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
                isExpanded ? "w-56" : "w-16"
            )}
            style={{
                background: 'rgba(255, 255, 255, 0.98)',
                backdropFilter: 'blur(20px)',
                borderRight: '1px solid rgba(226, 232, 240, 0.8)',
            }}
        >
            {/* Toggle Button - Sleeker pulse */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="absolute -right-3 top-4 w-7 h-7 bg-indigo-600 border-2 border-white rounded-full flex items-center justify-center text-white shadow-lg z-[500] transition-all hover:scale-110 active:scale-95 group/toggle"
            >
                {isExpanded ? <PanelLeftClose size={14} /> : <PanelLeftOpen size={14} />}
            </button>

            {/* Brand - Compact */}
            <div className={`shrink-0 p-3 ${isExpanded ? 'px-5' : 'px-0 flex justify-center'}`}>
                <Link href="/dashboard" className="flex items-center gap-2">
                    <div className="flex items-center justify-center w-7 h-7 shrink-0 rounded-lg bg-slate-900 border border-amber-500/30 overflow-hidden shadow-sm">
                        <Image src="/logo.png" alt="Logo" width={28} height={28} className="object-cover" />
                    </div>
                    {isExpanded && (
                        <div className="flex flex-col min-w-0">
                            <span className="text-xs font-black text-slate-900 tracking-tighter leading-tight truncate">BulkReply</span>
                            <span className="text-[8px] font-black text-amber-600 uppercase tracking-widest mt-[-1px]">Business</span>
                        </div>
                    )}
                </Link>
            </div>

            {/* Nav - High Density */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden px-2.5 custom-scrollbar">
                <nav className="flex flex-col gap-0.5 py-1">
                    {links.map((link) => {
                        const isActive = pathname === link.href;
                        const Icon = link.icon;
                        return (
                            <div key={link.name} className="relative group w-full flex justify-center">
                                <Link
                                    href={link.href}
                                    className={cn(
                                        "flex items-center h-9 rounded-lg transition-all duration-200 overflow-hidden group/item",
                                        isExpanded ? "w-full px-2.5" : "w-10 justify-center",
                                        isActive ? "bg-indigo-50 text-indigo-600 shadow-sm" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                                    )}
                                >
                                    <Icon size={16} className={cn("shrink-0 transition-transform duration-300", isActive ? "scale-105" : "group-hover/item:scale-105")} />
                                    {isExpanded && (
                                        <span className="ml-2.5 font-bold text-[12px] whitespace-nowrap tracking-tight">
                                            {link.name}
                                        </span>
                                    )}
                                </Link>

                                {!isExpanded && (
                                    <div className="absolute left-[100%] ml-4 px-2.5 py-1 text-[10px] font-black rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 shadow-lg bg-slate-900 text-white">
                                        {link.name}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </nav>
            </div>

            {/* Bottom Actions - Compact Card */}
            <div className="shrink-0 p-3 border-t border-slate-50 space-y-1.5 bg-slate-50/20">
                {/* Owner Panel Switch */}
                {String(userData?.owner) === 'true' && (
                    <Link
                        href="/owner/dashboard"
                        className={cn(
                            "flex items-center gap-2 h-8 rounded-lg transition-all duration-300 group border border-indigo-100",
                            isExpanded ? "px-2.5" : "w-10 justify-center mx-auto",
                            "bg-white text-indigo-600 hover:bg-indigo-50"
                        )}
                    >
                        <ShieldCheck size={14} className="shrink-0" />
                        {isExpanded && <span className="text-[10px] font-black tracking-tight uppercase">Owner Panel</span>}
                    </Link>
                )}

                {/* Profile Card Fixed */}
                <div className={cn(
                    "flex flex-col gap-1.5 p-1.5 rounded-xl bg-white border border-slate-100 shadow-sm",
                    !isExpanded && "items-center"
                )}>
                    <div className="flex items-center gap-2 w-full">
                        <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0 border border-white overflow-hidden">
                            {userData?.photoURL ? (
                                <img src={userData.photoURL} alt="" className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-[10px] font-black text-indigo-500 uppercase">{userData?.displayName?.charAt(0) || 'U'}</span>
                            )}
                        </div>
                        {isExpanded && (
                            <div className="flex-1 min-w-0">
                                <p className="text-[10px] font-black text-slate-900 truncate tracking-tight">{userData?.displayName || 'User'}</p>
                                <p className="text-[8px] font-bold text-slate-400 truncate uppercase leading-none">{userData?.role || 'Member'}</p>
                            </div>
                        )}
                    </div>

                    <button
                        onClick={async () => { await signOut(auth); window.location.href = "/login"; }}
                        className={cn(
                            "flex items-center gap-2 h-7 rounded-md transition-all duration-200 group/logout w-full",
                            isExpanded ? "px-1.5" : "justify-center",
                            "hover:bg-rose-50 text-slate-400 hover:text-rose-600"
                        )}
                    >
                        <LogOut size={13} className="shrink-0" />
                        {isExpanded && <span className="text-[9px] font-black uppercase tracking-widest">Logout</span>}
                    </button>
                </div>
            </div>
        </aside>
    );
}
