"use client";
import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import DashboardSidebar from "@/components/DashboardSidebar";
import DashboardNavbar from "@/components/DashboardNavbar";
import { useAuth } from "@/components/AuthProvider";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { LayoutDashboard, MessageCircle, Send, Settings, LogOut } from "lucide-react";

const mobileNavLinks = [
    { name: "Home", href: "/dashboard", icon: LayoutDashboard },
    { name: "Sessions", href: "/dashboard/sessions", icon: MessageCircle },
    { name: "Campaigns", href: "/dashboard/campaigns", icon: Send },
    { name: "AI Admin", href: "/dashboard/admin", icon: Settings },
];

function MobileBottomNav() {
    const pathname = usePathname();
    const handleLogout = async () => {
        await signOut(auth);
        window.location.href = "/login";
    };
    return (
        <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white/80 backdrop-blur-xl border-t border-slate-200 pb-safe">
            <div className="flex items-center justify-around h-16 px-2 max-w-lg mx-auto">
                {mobileNavLinks.map((link) => {
                    const isActive = pathname === link.href;
                    const Icon = link.icon;
                    return (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={`relative flex flex-col items-center justify-center gap-1 flex-1 h-full rounded-2xl transition-all duration-200 ${isActive ? 'text-blue-600' : 'text-slate-400 active:scale-90'
                                }`}
                        >
                            {isActive && (
                                <span className="absolute top-2 w-8 h-8 rounded-xl bg-blue-50 -z-10" />
                            )}
                            <Icon className={`w-5 h-5 transition-transform duration-200 ${isActive ? 'scale-110' : ''}`} />
                            <span className={`text-[10px] font-semibold tracking-tight ${isActive ? 'text-blue-600' : 'text-slate-400'
                                }`}>{link.name}</span>
                            {isActive && (
                                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full bg-blue-600" />
                            )}
                        </Link>
                    );
                })}
                <button
                    onClick={handleLogout}
                    className="relative flex flex-col items-center justify-center gap-1 flex-1 h-full rounded-2xl text-slate-400 active:scale-90 transition-all"
                >
                    <LogOut className="w-5 h-5" />
                    <span className="text-[10px] font-semibold tracking-tight">Logout</span>
                </button>
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

    // Auth guard
    if (!loading && !user) {
        router.replace("/login");
        return null;
    }
    if (!loading && userData && !userData.onboardingComplete) {
        router.replace("/onboarding");
        return null;
    }

    return (
        <div className="flex h-screen bg-[#F9FAFB] overflow-hidden">
            <DashboardSidebar />
            <div className="flex flex-col flex-1 min-w-0">
                <DashboardNavbar />
                <main className="flex-1 overflow-auto p-4 sm:p-8 relative pb-20 md:pb-8">
                    {/* Subtle noise/gradient background */}
                    <div className="absolute top-0 right-0 -z-10 w-[600px] h-[600px] bg-blue-50 rounded-full blur-3xl opacity-50 translate-x-1/2 -translate-y-1/2 pointer-events-none" />
                    <div className="max-w-7xl mx-auto w-full">
                        {children}
                    </div>
                </main>
            </div>
            <MobileBottomNav />
        </div>
    );
}

