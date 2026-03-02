"use client";
import React from "react";
import { usePathname } from "next/navigation";
import { Bell, Search, User } from "lucide-react";

export default function DashboardNavbar() {
    const pathname = usePathname();

    // Simple title generator from path
    let title = "Dashboard";
    if (pathname.includes("sessions")) title = "WhatsApp Sessions";
    if (pathname.includes("campaigns")) title = "AI Campaigns";
    if (pathname.includes("admin")) title = "Neural Admin Console";

    return (
        <header className="h-16 flex items-center justify-between px-8 bg-white border-b border-slate-200 shrink-0 shadow-sm z-10">
            <div className="flex items-center gap-4">
                <h1 className="text-xl font-bold text-slate-900 font-outfit">{title}</h1>
            </div>

            <div className="flex items-center gap-4">
                {/* Search */}
                <div className="hidden md:flex relative group">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                    <input
                        type="text"
                        placeholder="Search..."
                        className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all w-64"
                    />
                </div>

                {/* Notifications */}
                <button className="w-10 h-10 rounded-full border border-slate-200 bg-white flex items-center justify-center text-slate-600 relative hover:bg-slate-50 transition-colors">
                    <Bell className="w-4 h-4" />
                    <span className="absolute top-2 right-2.5 w-2 h-2 rounded-full bg-red-500 border-2 border-white"></span>
                </button>

                {/* Profile */}
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold border border-blue-200 cursor-pointer">
                    JD
                </div>
            </div>
        </header>
    );
}
