"use client";
import React from "react";
import DashboardSidebar from "@/components/DashboardSidebar";
import DashboardNavbar from "@/components/DashboardNavbar";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex h-screen bg-[#F9FAFB] overflow-hidden">
            <DashboardSidebar />
            <div className="flex flex-col flex-1 min-w-0">
                <DashboardNavbar />
                <main className="flex-1 overflow-auto p-4 sm:p-8 relative">
                    {/* Subtle noise/gradient background for internal pages as well to keep the premium feel */}
                    <div className="absolute top-0 right-0 -z-10 w-[600px] h-[600px] bg-blue-50 rounded-full blur-3xl opacity-50 translate-x-1/2 -translate-y-1/2 pointer-events-none" />
                    <div className="max-w-7xl mx-auto w-full">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
