"use client";
import React, { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { motion, AnimatePresence } from "framer-motion";
import { ConnectionTab } from "@/components/tabs/ConnectionTab";
import { CampaignTab } from "@/components/tabs/CampaignTab";
import { ChatTab } from "@/components/tabs/ChatTab";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("connection");

  return (
    <main className="min-h-screen bg-[#020617] text-slate-200 flex overflow-hidden selection:bg-primary/30 selection:text-white">
      {/* Visual Noise Overlay */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-[100] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />

      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      <div className="flex-1 h-screen overflow-y-auto gradient-bg p-12 relative">
        <div className="max-w-7xl mx-auto space-y-12">
          <header className="flex items-center justify-between relative z-10">
            <div>
              <motion.h1
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-5xl font-bold tracking-tight text-white"
              >
                {activeTab === "connection" && "Nexus Terminal"}
                {activeTab === "campaigns" && "Campaign Hub"}
                {activeTab === "chat" && "AI Neural Link"}
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="text-slate-500 font-medium mt-3 tracking-wide"
              >
                {activeTab === "connection" && "Initialize your WhatsApp instance and monitor status."}
                {activeTab === "campaigns" && "Create high-conversion AI-powered bulk outreaches."}
                {activeTab === "chat" && "Direct communication with the system management core."}
              </motion.p>
            </div>

            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full border border-white/5 glass flex items-center justify-center text-slate-400">
                <span className="text-xs font-bold font-outfit uppercase">v4.0</span>
              </div>
            </div>
          </header>

          <section className="relative z-10">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 30, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -30, scale: 0.98 }}
                transition={{
                  type: "spring",
                  stiffness: 260,
                  damping: 20
                }}
              >
                {activeTab === "connection" && <ConnectionTab />}
                {activeTab === "campaigns" && <CampaignTab />}
                {activeTab === "chat" && <ChatTab />}
              </motion.div>
            </AnimatePresence>
          </section>
        </div>
      </div>
    </main>
  );
}
