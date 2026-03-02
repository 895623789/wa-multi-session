"use client";
import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import DashboardSidebar from "@/components/DashboardSidebar";
// Removed DashboardNavbar to achieve cleaner SaaS look
import { useAuth } from "@/components/AuthProvider";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { LayoutDashboard, MessageCircle, Send, Settings, LogOut, User } from "lucide-react";

const mobileNavLinks = [
    { name: "Home", href: "/dashboard", icon: LayoutDashboard },
    { name: "Sessions", href: "/dashboard/sessions", icon: MessageCircle },
    { name: "Campaigns", href: "/dashboard/campaigns", icon: Send },
    { name: "AI", href: "/dashboard/ai", icon: Settings },
    { name: "Profile", href: "/dashboard/profile", icon: User },
];

function MobileBottomNav() {
    const pathname = usePathname();

    // Hide bottom nav entirely on the admin chat page for full-screen mobile experience
    if (pathname === '/dashboard/ai') {
        return null;
    }

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white/90 backdrop-blur-2xl border-t border-slate-200/50 pb-safe shadow-[0_-4px_24px_rgba(0,0,0,0.02)]">
            <div className="flex items-center justify-around h-[68px] px-1 max-w-md mx-auto">
                {mobileNavLinks.map((link) => {
                    const isActive = pathname === link.href;
                    const Icon = link.icon;
                    return (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={`relative flex flex-col items-center justify-center gap-1 flex-1 h-full rounded-2xl transition-all duration-300 ${isActive ? 'text-blue-600 scale-105' : 'text-slate-400 active:scale-95'
                                }`}
                        >
                            <Icon className={`w-5 h-5 transition-transform duration-300 ${isActive ? 'fill-blue-100/50 stroke-blue-600' : ''}`} />
                            <span className={`text-[9px] font-bold tracking-tight ${isActive ? 'text-blue-600' : 'text-slate-500'
                                }`}>{link.name}</span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, userData, loading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    // Auth guard
    if (!loading && !user) {
        router.replace("/login");
        return null;
    }
    if (!loading && userData && !userData.onboardingComplete) {
        router.replace("/onboarding");
        return null;
    }

    const isAdminRoute = pathname === '/dashboard/ai';

    // Remove max-w restriction and padding if it's the admin chat route for maximum space
    const mainClasses = isAdminRoute
        ? "flex-1 overflow-hidden relative"
        : "flex-1 overflow-auto p-4 sm:p-8 relative pb-20 md:pb-8";

    const containerClasses = isAdminRoute
        ? "w-full h-full"
        : "max-w-7xl mx-auto w-full";

    return (
        <div className="flex h-screen bg-[#F9FAFB] overflow-hidden">
            <DashboardSidebar />
            <div className="flex flex-col flex-1 min-w-0 h-full bg-slate-50">
                <main className={mainClasses}>
                    {!isAdminRoute && (
                        <div className="absolute top-0 right-0 -z-10 w-[800px] h-[800px] bg-gradient-to-bl from-blue-100/40 via-purple-50/20 to-transparent rounded-full blur-3xl opacity-60 translate-x-1/2 -translate-y-1/2 pointer-events-none" />
                    )}
                    <div className={containerClasses}>
                        {children}
                    </div>
                </main>
            </div>
            <MobileBottomNav />
        </div>
    );
}

