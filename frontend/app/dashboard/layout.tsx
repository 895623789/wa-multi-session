"use client";
import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import DashboardSidebar from "@/components/DashboardSidebar";
// Removed DashboardNavbar to achieve cleaner SaaS look
import { useAuth } from "@/components/AuthProvider";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { LayoutDashboard, MessageCircle, Send, Settings, LogOut, User, Bot } from "lucide-react";
import SubscriptionBanner from "@/components/SubscriptionBanner";
import BlockedScreen from "@/components/BlockedScreen";

const mobileNavLinks = [
    { name: "Home", href: "/dashboard", icon: LayoutDashboard },
    { name: "AI", href: "/dashboard/ai", icon: Bot },
    { name: "Agents", href: "/dashboard/agents", icon: Settings },
    { name: "Campaigns", href: "/dashboard/campaigns", icon: Send },
    { name: "Profile", href: "/dashboard/profile", icon: User },
];

function MobileBottomNav() {
    const pathname = usePathname();

    // Hide bottom nav entirely on the admin chat page for full-screen mobile experience
    if (pathname === '/dashboard/ai') {
        return null;
    }

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden backdrop-blur-md border-t pb-safe shadow-[0_-5px_20px_rgba(0,0,0,0.06)]"
            style={{ background: 'var(--sidebar-bg)', borderColor: 'var(--border)' }}>
            <div className="flex items-center justify-around h-[68px] px-1 max-w-md mx-auto">
                {mobileNavLinks.map((link) => {
                    const isActive = pathname === link.href;
                    const Icon = link.icon;
                    return (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={`relative flex flex-col items-center justify-center gap-1 flex-1 h-full rounded-2xl transition-all duration-300 ${isActive ? 'text-primary scale-105' : 'text-slate-400 active:scale-95'
                                }`}
                        >
                            <Icon className={`w-5 h-5 transition-transform duration-300`} />
                            <span className={`text-[10px] font-medium tracking-tight ${isActive ? 'text-primary' : 'text-slate-500'
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

    // Block guard — real-time via Firestore onSnapshot in AuthProvider
    if (!loading && userData?.blocked === true) {
        return <BlockedScreen />;
    }

    const isAdminRoute = pathname === '/dashboard/ai';

    // Remove max-w restriction and padding if it's the admin chat route for maximum space
    const mainClasses = isAdminRoute
        ? "flex-1 overflow-hidden relative"
        : "flex-1 overflow-y-auto overflow-x-hidden p-3 lg:p-4 relative pb-20 md:pb-8";

    const containerClasses = isAdminRoute
        ? "w-full h-full"
        : "max-w-7xl mx-auto w-full";

    return (
        <div className="flex h-screen overflow-x-visible" style={{ background: 'var(--bg)', color: 'var(--text-primary)' }}>
            <SubscriptionBanner />
            <DashboardSidebar />
            <div className="flex flex-col flex-1 min-w-0 h-full">
                <main className={mainClasses}>
                    <div className={containerClasses}>
                        {children}
                    </div>
                </main>
            </div>
            <MobileBottomNav />
        </div>
    );
}

