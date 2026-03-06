"use client";
import React from "react";
import { usePathname } from "next/navigation";
import { Bell, Search, User, Zap, ChevronRight } from "lucide-react";
import { useAuth } from "./AuthProvider";
import Link from "next/link";

interface DashboardNavbarProps {
    onOpenNotifications: () => void;
}

export default function DashboardNavbar({ onOpenNotifications }: DashboardNavbarProps) {
    const pathname = usePathname();
    const { userData } = useAuth();

    // Enhanced title & ID generator from path for unique page signatures
    const getPageInfo = () => {
        if (pathname.includes("sessions") || pathname.includes("agents")) return { title: "Smart Agents", breadcrumb: "Workspace", color: "text-indigo-500" };
        if (pathname.includes("campaigns")) return { title: "AI Campaigns", breadcrumb: "Outreach", color: "text-rose-500" };
        if (pathname.includes("admin")) return { title: "Neural Lab", breadcrumb: "System", color: "text-emerald-500" };
        if (pathname.includes("ai")) return { title: "AI Genius", breadcrumb: "Assistant", color: "text-amber-500" };
        if (pathname.includes("profile")) return { title: "Profile Settings", breadcrumb: "Account", color: "text-slate-500" };
        return { title: "Dashboard", breadcrumb: "Workspace", color: "text-indigo-500" };
    };

    const { title, breadcrumb, color } = getPageInfo();

    const plan = (userData as any)?.subscription?.plan || userData?.plan || "Free";
    const planColor = plan.toLowerCase() === 'business' ? 'bg-amber-100 text-amber-600 border-amber-200' :
        plan.toLowerCase() === 'pro' ? 'bg-indigo-100 text-indigo-600 border-indigo-200' :
            'bg-slate-100 text-slate-500 border-slate-200';

    return (
        <header className="h-16 lg:h-16 flex items-center justify-between px-4 lg:px-8 sticky top-0 z-40 bg-white/80 backdrop-blur-3xl border-b border-slate-100/50 shrink-0 select-none">

            {/* --- DESKTOP VIEW: Professional SaaS Breadcrumbs --- */}
            <div className="hidden lg:flex items-center gap-3">
                <div className="flex flex-col">
                    <div className="flex items-center gap-1 text-[9px] font-black text-slate-400 uppercase tracking-[0.15em] leading-none mb-0.5">
                        <span className="hover:text-slate-600 cursor-default transition-colors">BulkReply</span>
                        <ChevronRight size={8} className="text-slate-300" />
                        <span className={`${color} opacity-80`}>{breadcrumb}</span>
                    </div>
                    <h1 className="text-base font-black text-slate-900 tracking-tight font-outfit uppercase">{title}</h1>
                </div>
            </div>

            {/* --- MOBILE VIEW: Native Mobile App Feel --- */}
            {/* Logo on Left */}
            <div className="flex lg:hidden items-center">
                <div className="w-8 h-8 rounded-xl bg-slate-900 border border-white/20 flex items-center justify-center shadow-md active:scale-95 transition-transform overflow-hidden">
                    <img src="/logo.png" alt="Logo" className="w-full h-full object-cover scale-110" />
                </div>
            </div>

            {/* Centered Title (Absolute pos) */}
            <div className="absolute left-1/2 -translate-x-1/2 lg:hidden flex flex-col items-center">
                <span className="text-[12px] font-black text-slate-900 tracking-tight leading-none">{title}</span>
                <span className={`text-[7px] font-black uppercase tracking-[0.2em] mt-0.5 ${color}`}>{breadcrumb}</span>
            </div>

            {/* --- RIGHT ACTIONS: Unified across both --- */}
            <div className="flex items-center gap-2 lg:gap-4">
                {/* Desktop Search */}
                <div className="hidden xl:flex relative group">
                    <Search className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                    <input
                        type="search"
                        placeholder="Search..."
                        className="pl-9 pr-4 py-1.5 bg-slate-100/50 border border-transparent rounded-xl text-[11px] font-bold focus:outline-none focus:bg-white focus:border-indigo-500/20 focus:ring-4 focus:ring-indigo-500/5 transition-all w-48 placeholder:text-slate-400"
                    />
                </div>

                {/* Plan Badge - Hidden on XSmall */}
                <div className={`hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-lg border text-[9px] font-black uppercase tracking-tight shadow-sm ${planColor}`}>
                    <Zap size={10} fill="currentColor" />
                    {plan}
                </div>

                {/* Notification - Native Toggle Style */}
                <button
                    onClick={onOpenNotifications}
                    className="w-9 h-9 rounded-xl border border-slate-100 bg-white flex items-center justify-center text-slate-700 relative hover:bg-white hover:border-slate-300 transition-all hover:scale-105 active:scale-90 shadow-[0_2px_10px_rgba(0,0,0,0.03)]"
                >
                    <Bell className="w-4 h-4 stroke-[2.5]" />
                    <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-rose-500 border-2 border-white ring-1 ring-rose-500/20"></span>
                </button>

                {/* Profile Avatar - Mini for Native look on mobile */}
                <Link
                    href="/dashboard/profile"
                    className="flex items-center gap-2 p-0.5 rounded-xl hover:bg-slate-50 transition-all group lg:border lg:border-slate-100 lg:pr-3"
                >
                    <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-black text-[10px] shadow-md shadow-indigo-200 group-hover:scale-110 transition-transform overflow-hidden border-2 border-white lg:border-none">
                        {userData?.photoURL ? (
                            <img src={userData.photoURL} alt="" className="w-full h-full object-cover" />
                        ) : (
                            userData?.displayName?.charAt(0) || 'U'
                        )}
                    </div>
                    <div className="hidden md:flex flex-col items-start leading-none">
                        <span className="text-[10px] font-black text-slate-900 tracking-tight">{userData?.displayName || 'User'}</span>
                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Profile</span>
                    </div>
                </Link>
            </div>
        </header>
    );
}
