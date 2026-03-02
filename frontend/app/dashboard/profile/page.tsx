"use client";
import React from "react";
import { useAuth } from "@/components/AuthProvider";
import { motion } from "framer-motion";
import { User, CreditCard, HelpCircle, LogOut, ChevronRight, Settings } from "lucide-react";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function ProfilePage() {
    const { user, userData } = useAuth();

    const handleLogout = async () => {
        try {
            await signOut(auth);
            window.location.href = "/login";
        } catch (error) {
            console.error("Logout error", error);
        }
    };

    if (!user || !userData) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    const { displayName, email, plan = "Free", company } = userData;
    const initials = displayName
        ? displayName.split(" ").map((n: string) => n[0]).join("").toUpperCase().substring(0, 2)
        : email ? email[0].toUpperCase() : "U";

    return (
        <div className="max-w-2xl mx-auto pb-12">
            {/* Header / Native App Style Header */}
            <div className="mb-8 pt-4">
                <h1 className="text-2xl font-bold text-slate-900 font-outfit tracking-tight">Profile</h1>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
            >
                {/* ── User ID Card ── */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-center gap-5">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xl font-bold font-outfit shadow-md shrink-0">
                        {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                        <h2 className="text-xl font-bold text-slate-900 truncate">{displayName || "User"}</h2>
                        <p className="text-sm text-slate-500 truncate">{email}</p>
                        {company && <p className="text-xs font-semibold text-blue-600 mt-1 uppercase tracking-wider">{company}</p>}
                    </div>
                </div>

                {/* ── Settings Groups ── */}
                <div className="space-y-6">

                    {/* Account Section */}
                    <div>
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 ml-2 lg:ml-0">Account</h3>
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden divide-y divide-slate-100">

                            <button className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors group">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                                        <User className="w-4 h-4 text-blue-600" />
                                    </div>
                                    <span className="text-sm font-semibold text-slate-700">Edit Profile</span>
                                </div>
                                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600" />
                            </button>

                            <button className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors group">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center group-hover:bg-indigo-100 transition-colors">
                                        <CreditCard className="w-4 h-4 text-indigo-600" />
                                    </div>
                                    <div className="flex flex-col items-start">
                                        <span className="text-sm font-semibold text-slate-700">Subscription</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 uppercase tracking-wider">
                                        {plan}
                                    </span>
                                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600" />
                                </div>
                            </button>

                            <button className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors group">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center group-hover:bg-slate-200 transition-colors">
                                        <Settings className="w-4 h-4 text-slate-600" />
                                    </div>
                                    <span className="text-sm font-semibold text-slate-700">Preferences</span>
                                </div>
                                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600" />
                            </button>
                        </div>
                    </div>

                    {/* Support Section */}
                    <div>
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 ml-2 lg:ml-0">Support</h3>
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                            <button className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors group">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center group-hover:bg-amber-100 transition-colors">
                                        <HelpCircle className="w-4 h-4 text-amber-600" />
                                    </div>
                                    <span className="text-sm font-semibold text-slate-700">Helpline / Contact Us</span>
                                </div>
                                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600" />
                            </button>
                        </div>
                    </div>

                    {/* Danger Zone */}
                    <div>
                        <div className="bg-white rounded-2xl shadow-sm border border-red-100 overflow-hidden mt-6">
                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center justify-center gap-2 p-4 hover:bg-red-50 transition-colors group text-red-600"
                            >
                                <LogOut className="w-4 h-4" />
                                <span className="text-sm font-bold">Sign Out</span>
                            </button>
                        </div>
                    </div>

                </div>
            </motion.div>
        </div>
    );
}
