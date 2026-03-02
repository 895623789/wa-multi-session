"use client";
import AuthProvider from "./AuthProvider";

export default function AuthProviderWrapper({ children }: { children: React.ReactNode }) {
    return <AuthProvider>{children}</AuthProvider>;
}
