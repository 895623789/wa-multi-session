"use client";
import React, { useEffect } from "react";
import { useAuth } from "./AuthProvider";
import { useRouter } from "next/navigation";

interface OwnerGuardProps {
    children: React.ReactNode;
}

export default function OwnerGuard({ children }: OwnerGuardProps) {
    const { user, userData, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading) {
            if (!user) {
                router.replace("/login");
            } else if (userData && String(userData.owner) !== "true") {
                router.replace("/dashboard");
            }
        }
    }, [user, userData, loading, router]);

    if (loading || !user || !userData || String(userData.owner) !== "true") {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#F9FAFB]">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm text-slate-400 font-medium">Verifying authorization...</p>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}
