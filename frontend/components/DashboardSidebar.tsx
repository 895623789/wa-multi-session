"use client";
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, MessageCircle, Send, Settings, MessageSquare, LogOut, User } from "lucide-react";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function DashboardSidebar() {
    const pathname = usePathname();

    const links = [
        { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
        { name: "Sessions", href: "/dashboard/sessions", icon: MessageCircle },
        { name: "Campaigns", href: "/dashboard/campaigns", icon: Send },
        { name: "Neural Admin", href: "/dashboard/admin", icon: Settings },
        { name: "Profile", href: "/dashboard/profile", icon: User },
    ];

    return (
        <aside className="w-64 border-r border-slate-200 bg-white hidden md:flex flex-col h-full shrink-0">
            {/* Brand */}
            <div className="h-16 flex items-center px-6 border-b border-slate-100">
                <Link href="/" className="flex items-center gap-2">
                    <div className="bg-blue-600 p-1.5 rounded-lg">
                        <MessageSquare className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-lg font-bold tracking-tight text-slate-900 font-outfit">
                        BulkReply.io
                    </span>
                </Link>
            </div>

            {/* Nav */}
            <nav className="flex-1 p-4 space-y-1">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 mt-4 px-2">Main Menu</div>
                {links.map((link) => {
                    const isActive = pathname === link.href;
                    const Icon = link.icon;
                    return (
                        <Link
                            key={link.name}
                            href={link.href}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive
                                ? "bg-blue-50 text-blue-600"
                                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                }`}
                        >
                            <Icon className={`w-4 h-4 ${isActive ? "text-blue-600" : "text-slate-400"}`} />
                            {link.name}
                        </Link>
                    );
                })}
            </nav>

            {/* Bottom Profile/Logout */}
            <div className="p-4 border-t border-slate-100">
                <button onClick={async () => { await signOut(auth); window.location.href = "/login"; }} className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                    <LogOut className="w-4 h-4 text-slate-400" />
                    Log out
                </button>
            </div>
        </aside>
    );
}
