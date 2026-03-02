"use client";
import React, { useEffect } from "react";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import FeaturesSection from "@/components/FeaturesSection";
import StepsSection from "@/components/StepsSection";
import AntiBanSection from "@/components/AntiBanSection";
import PricingSection from "@/components/PricingSection";
import Footer from "@/components/Footer";
import { useAuth } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.replace("/dashboard");
    }
  }, [user, loading, router]);

  // Optional: show a minimal loading state while checking auth
  if (loading) {
    return <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin" />
    </div>;
  }

  return (
    <main className="min-h-screen bg-[#F9FAFB] text-slate-900 font-sans selection:bg-blue-100 selection:text-blue-900">
      <Navbar />
      <HeroSection />
      <FeaturesSection />
      <StepsSection />
      <AntiBanSection />
      <PricingSection />
      <Footer />
    </main>
  );
}
