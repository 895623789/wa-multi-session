"use client";
import React from "react";
import OwnerSidebar from "@/components/OwnerSidebar";
import OwnerGuard from "@/components/OwnerGuard";
import { usePathname } from "next/navigation";
import { Search, Bell, Moon, Sun, ChevronRight, User } from "lucide-react";
import { useTheme } from "@/lib/ThemeContext";

function OwnerHeader() {
    const pathname = usePathname();
    const { theme, toggleTheme } = useTheme();

    // Generate page title from pathname
    const pageTitle = pathname.split('/').pop()?.replace(/-/g, ' ') || 'Dashboard';
    const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

    return (
        <header className="h-16 shrink-0 border-b flex items-center justify-between px-6 bg-white sticky top-0 z-40 transition-colors duration-300">
            <div className="flex items-center gap-4">
                <nav className="flex items-center gap-2 text-xs font-medium text-slate-400">
                    <span>Owner</span>
                    <ChevronRight size={12} />
                    <span className="text-slate-600 font-bold">{capitalize(pageTitle)}</span>
                </nav>
            </div>

            <div className="flex items-center gap-3">
                <div className="relative hidden sm:block">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                        type="text"
                        placeholder="Search anything..."
                        className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 w-64 transition-all"
                    />
                </div>

                <div className="w-[1px] h-6 bg-slate-200 mx-1 hidden sm:block"></div>

                <button
                    onClick={toggleTheme}
                    className="p-2 text-slate-500 hover:bg-slate-50 rounded-lg transition-colors"
                >
                    {theme === 'dark' ? <Sun size={20} className="text-amber-500" /> : <Moon size={20} />}
                </button>

                <button className="p-2 text-slate-500 hover:bg-slate-50 rounded-lg relative transition-colors">
                    <Bell size={20} />
                    <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                </button>

                <button className="flex items-center gap-2 ml-2 p-1 pl-1 pr-3 hover:bg-slate-50 rounded-full transition-colors border border-transparent hover:border-slate-100">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                        <User size={18} />
                    </div>
                </button>
            </div>
        </header>
    );
}

import OwnerMobileNav from "@/components/OwnerMobileNav";

export default function OwnerLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <OwnerGuard>
            <div className="flex h-screen overflow-x-visible bg-slate-50 text-slate-900 font-manrope relative">
                <OwnerSidebar />
                <div className="flex flex-col flex-1 min-w-0 h-full overflow-hidden">
                    <OwnerHeader />
                    <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 pb-32 md:pb-8">
                        <div className="max-w-7xl mx-auto">
                            {children}
                        </div>
                    </main>
                </div>
                <OwnerMobileNav />
            </div>
        </OwnerGuard>
    );
}
