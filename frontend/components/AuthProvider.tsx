"use client";
import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useRouter, usePathname } from "next/navigation";

// ─── Types ────────────────────────────────────────────────────────────────────
export interface UserData {
    displayName: string;
    email: string;
    phone: string;
    company: string;
    industry: string;
    teamSize: string;
    role: string;
    location: string;
    photoURL?: string; // Newly added
    onboardingComplete: boolean;
    plan: string;
    sessions: string[];
    stats?: {
        messagesUsed?: number;
        aiRepliesUsed?: number;
    };
    createdAt: any;
    updatedAt: any;
}

interface AuthContextType {
    user: User | null;
    userData: UserData | null;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, userData: null, loading: true });

export function useAuth() {
    return useContext(AuthContext);
}

// ─── Public Routes (no auth required) ─────────────────────────────────────────
const PUBLIC_ROUTES = ["/", "/login", "/signup"];

// ─── Provider ─────────────────────────────────────────────────────────────────
export default function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [userData, setUserData] = useState<UserData | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        const unsubAuth = onAuthStateChanged(auth, (firebaseUser) => {
            setUser(firebaseUser);
            if (!firebaseUser) {
                setUserData(null);
                setLoading(false);
                // Redirect to login if on a protected route
                if (!PUBLIC_ROUTES.includes(pathname)) {
                    router.replace("/login");
                }
                return;
            }

            // Listen to user's Firestore document (1 real-time listener, no extra reads)
            const unsubDoc = onSnapshot(
                doc(db, "users", firebaseUser.uid),
                (snap) => {
                    if (snap.exists()) {
                        const data = snap.data() as UserData;
                        setUserData(data);

                        // Route guards
                        if (!data.onboardingComplete && pathname.startsWith("/dashboard")) {
                            router.replace("/onboarding");
                        }
                    } else {
                        // Doc doesn't exist yet (just signed up, will be created)
                        setUserData(null);
                    }
                    setLoading(false);
                },
                (err) => {
                    console.error("Firestore listener error:", err);
                    setLoading(false);
                }
            );

            return () => unsubDoc();
        });

        return () => unsubAuth();
    }, [pathname, router]);

    // Show nothing while loading auth state
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#F9FAFB]">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm text-slate-400 font-medium">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <AuthContext.Provider value={{ user, userData, loading }}>
            {children}
        </AuthContext.Provider>
    );
}
