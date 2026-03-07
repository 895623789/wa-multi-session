"use client";
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    Users,
    CreditCard,
    Package,
    IndianRupee,
    Bell,
    Ticket,
    Settings,
    ClipboardList,
    RefreshCcw,
    Briefcase,
    Sparkles
} from "lucide-react";

function cn(...classes: (string | boolean | undefined)[]) {
    return classes.filter(Boolean).join(" ");
}

export default function OwnerMobileNav() {
    const pathname = usePathname();

    const links = [
        { name: "Dashboard", href: "/owner/dashboard", icon: LayoutDashboard },
        { name: "Users", href: "/owner/users", icon: Users },
        { name: "Subs", href: "/owner/subscriptions", icon: CreditCard },
        { name: "Agency", href: "/owner/agency", icon: Briefcase },
        { name: "Plans", href: "/owner/plans", icon: Package },
        { name: "Pay", href: "/owner/payments", icon: IndianRupee },
        { name: "News", href: "/owner/announcements", icon: Bell },
        { name: "Support", href: "/owner/support", icon: Ticket },
        { name: "Logs", href: "/owner/logs", icon: ClipboardList },
        { name: "AI", href: "/owner/assistant", icon: Sparkles },
        { name: "Settings", href: "/owner/settings", icon: Settings },
        { name: "Business", href: "/dashboard", icon: RefreshCcw, isSpecial: true },
    ];

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-[200] md:hidden backdrop-blur-xl border-t pb-safe shadow-[0_-8px_30px_rgba(0,0,0,0.12)] bg-white/90 border-slate-200">
            <div className="flex items-center overflow-x-auto overflow-y-hidden px-4 gap-2 h-[72px] scrollbar-none snap-x active:cursor-grabbing">
                {links.map((link) => {
                    const isActive = pathname.startsWith(link.href) && (link.href !== "/dashboard" || pathname === link.href);
                    const Icon = link.icon;
                    return (
                        <Link
                            key={link.name}
                            href={link.href}
                            className={cn(
                                "flex flex-col items-center justify-center min-w-[72px] h-[60px] rounded-2xl transition-all duration-300 snap-center",
                                isActive
                                    ? "bg-indigo-50 text-indigo-600 scale-105"
                                    : link.isSpecial
                                        ? "text-amber-600 bg-amber-50/50"
                                        : "text-slate-500 active:scale-95"
                            )}
                        >
                            <div className={cn(
                                "p-2 rounded-xl transition-colors",
                                isActive ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200" : "bg-transparent"
                            )}>
                                <Icon size={isActive ? 20 : 18} strokeWidth={isActive ? 2.5 : 2} />
                            </div>
                            <span className={cn(
                                "text-[10px] font-black lowercase tracking-tighter mt-0.5",
                                isActive ? "text-indigo-600" : "text-slate-400"
                            )}>
                                {link.name}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
