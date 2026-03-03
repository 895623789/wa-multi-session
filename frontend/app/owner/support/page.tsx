"use client";
import React, { useState } from "react";
import {
    MessageSquare,
    Search,
    Filter,
    Clock,
    CheckCircle2,
    AlertCircle,
    User,
    Send,
    Paperclip,
    MoreHorizontal,
    ChevronRight,
    Smartphone,
    Monitor,
    ShieldAlert,
    Hash,
    MoreVertical,
    Check,
    X,
    MessageCircle,
    ArrowLeft
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const tickets = [
    { id: "T-801", user: "Rahul Sharma", subject: "WhatsApp QR not loading", priority: "High", status: "Open", time: "10m ago", lastMsg: "I've tried clearing cache but it still doesn't show up." },
    { id: "T-802", user: "Sneha Reddy", subject: "Payment failed but amount deducted", priority: "Critical", status: "In-Progress", time: "1h ago", lastMsg: "Please check the txn id RAZ-90123." },
    { id: "T-803", user: "Amit Patel", subject: "How to add multiple sub-agents?", priority: "Medium", status: "Open", time: "3h ago", lastMsg: "Unable to find the option in settings." },
    { id: "T-804", user: "Karan Johar", subject: "Plan upgrade inquiry", priority: "Low", status: "Resolved", time: "1d ago", lastMsg: "Thanks for the help, upgrading tomorrow." },
];

const mockChat = [
    { id: 1, sender: "user", text: "Hey, I am trying to connect my WhatsApp but the QR code is stuck on loading forever. I have tried 3 different browsers.", time: "10:15 AM" },
    { id: 2, sender: "system", text: "Rahul Sharma (User) attached a screenshot.", time: "10:15 AM", attachment: true },
    { id: 3, sender: "admin", text: "Hi Rahul! Sorry for the trouble. Could you please tell me which device you are using and your internet speed?", time: "10:20 AM" },
    { id: 4, sender: "user", text: "I am on iPhone 15 Pro, Mac M2. Internet is around 100Mbps.", time: "10:22 AM" },
];

export default function SupportTicketsPage() {
    const [selectedId, setSelectedId] = useState(tickets[0].id);
    const [msg, setMsg] = useState("");

    const selectedTicket = tickets.find(t => t.id === selectedId) || tickets[0];

    return (
        <div className="h-[calc(100vh-180px)] flex flex-col gap-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight font-outfit text-indigo-900">Support Command Center</h1>
                    <p className="text-sm text-slate-500 font-medium">Manage user queries, technical issues and billing disputes.</p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 text-rose-600 rounded-xl border border-rose-100 text-[10px] font-black uppercase">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                        3 Critical Tickets
                    </div>
                </div>
            </div>

            <div className="flex-1 flex gap-6 overflow-hidden">
                {/* Tickets Sidebar */}
                <div className="w-full md:w-80 lg:w-96 flex flex-col gap-4 shrink-0">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search tickets..."
                            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all font-bold placeholder:text-slate-300"
                        />
                    </div>

                    <div className="flex-1 bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-y-auto custom-scrollbar p-2 space-y-1">
                        {tickets.map((ticket) => (
                            <button
                                key={ticket.id}
                                onClick={() => setSelectedId(ticket.id)}
                                className={`w-full text-left p-4 rounded-[24px] transition-all relative group ${selectedId === ticket.id
                                    ? "bg-slate-900 text-white shadow-xl shadow-slate-200"
                                    : "hover:bg-slate-50 text-slate-600"
                                    }`}
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <span className={`text-[10px] font-black uppercase tracking-widest ${selectedId === ticket.id ? 'text-indigo-400' : 'text-slate-400'
                                        }`}>{ticket.id}</span>
                                    <span className="text-[10px] font-bold opacity-60 italic">{ticket.time}</span>
                                </div>
                                <h3 className={`text-sm font-black mb-1 font-outfit truncate pr-8 ${selectedId === ticket.id ? 'text-white' : 'text-slate-900'
                                    }`}>{ticket.subject}</h3>
                                <p className={`text-[11px] line-clamp-1 opacity-70 mb-3 ${selectedId === ticket.id ? 'text-slate-300' : 'text-slate-500'
                                    }`}>{ticket.lastMsg}</p>

                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black uppercase ${ticket.priority === 'Critical' ? 'bg-rose-500 text-white' :
                                            ticket.priority === 'High' ? 'bg-amber-500 text-white' : 'bg-slate-200 text-slate-500'
                                            }`}>
                                            {ticket.priority.charAt(0)}
                                        </div>
                                        <span className={`text-[10px] font-black uppercase tracking-tighter ${selectedId === ticket.id ? 'text-indigo-300' : 'text-slate-400'
                                            }`}>{ticket.user}</span>
                                    </div>
                                    <div className={`w-2 h-2 rounded-full ${ticket.status === 'Open' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' :
                                        ticket.status === 'In-Progress' ? 'bg-blue-500' : 'bg-slate-300'
                                        }`}></div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Chat Area */}
                <div className="flex-1 bg-white rounded-[40px] border border-slate-100 shadow-sm flex flex-col overflow-hidden relative">
                    {/* Chat Header */}
                    <div className="p-6 md:p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-xl shadow-lg shadow-indigo-100">
                                {selectedTicket.user.charAt(0)}
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-slate-900 font-outfit leading-none mb-1">{selectedTicket.subject}</h3>
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{selectedTicket.id}</span>
                                    <span className="text-slate-300 text-[10px]">•</span>
                                    <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">{selectedTicket.user}</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-emerald-100 transition-all border border-emerald-100">Mark Resolved</button>
                            <button className="p-2 text-slate-400 hover:text-slate-600 transition-all">
                                <MoreVertical size={22} />
                            </button>
                        </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-8 custom-scrollbar bg-[radial-gradient(#f1f5f9_1px,transparent_1px)] [background-size:20px_20px]">
                        {mockChat.map((chat) => (
                            <div key={chat.id} className={`flex ${chat.sender === 'admin' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[80%] flex flex-col ${chat.sender === 'admin' ? 'items-end' : 'items-start'}`}>
                                    <div className={`p-5 rounded-[28px] text-sm font-medium leading-relaxed shadow-sm ${chat.sender === 'admin'
                                        ? 'bg-indigo-600 text-white rounded-tr-none'
                                        : 'bg-white border border-slate-100 text-slate-700 rounded-tl-none'
                                        }`}>
                                        {chat.text}
                                        {chat.attachment && (
                                            <div className="mt-4 p-4 bg-slate-50 rounded-[20px] border border-slate-200 flex items-center gap-3">
                                                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400">
                                                    <Paperclip size={18} />
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-[10px] font-black text-slate-900 uppercase">screenshot_error_01.png</p>
                                                    <p className="text-[9px] text-slate-400 font-bold">1.2 MB • PNG Image</p>
                                                </div>
                                                <button className="text-indigo-600 text-[10px] font-black uppercase hover:underline">View</button>
                                            </div>
                                        )}
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-400 mt-2 px-1">{chat.time}</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Input Area */}
                    <div className="p-6 md:p-8 bg-white border-t border-slate-50">
                        <div className="flex items-center gap-4 bg-slate-50 border border-slate-200 rounded-[32px] p-2 pl-6 focus-within:ring-4 focus-within:ring-indigo-500/10 focus-within:border-indigo-400 transition-all">
                            <input
                                type="text"
                                value={msg}
                                onChange={(e) => setMsg(e.target.value)}
                                placeholder="Type your response to the user..."
                                className="flex-1 bg-transparent border-none focus:outline-none text-sm font-bold text-slate-700 placeholder:text-slate-400"
                            />
                            <div className="flex items-center gap-1 pr-2">
                                <button className="p-3 text-slate-400 hover:text-indigo-600 transition-all">
                                    <Paperclip size={20} />
                                </button>
                                <button className="p-3 w-12 h-12 bg-indigo-600 text-white rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-lg shadow-indigo-100">
                                    <Send size={20} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Meta Info Floating (Mobile hidden) */}
                    <div className="hidden xl:block absolute top-[100px] right-8 w-64 space-y-4">
                        <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-xl overflow-hidden relative active:scale-[0.98] transition-all cursor-pointer">
                            <div className="absolute top-0 left-0 w-1 h-full bg-indigo-600"></div>
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">User Ecosystem</h4>
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center">
                                        <Monitor size={16} />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black text-slate-900 leading-none mb-1">MacOS M2</span>
                                        <span className="text-[9px] text-slate-400 font-bold uppercase">Chrome 122.0</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center">
                                        <Smartphone size={16} />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black text-slate-900 leading-none mb-1">iPhone 15 Pro</span>
                                        <span className="text-[9px] text-slate-400 font-bold uppercase">App v1.02</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                        <ShieldAlert size={16} />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black text-emerald-900 leading-none mb-1">Verified User</span>
                                        <span className="text-[9px] text-emerald-400 font-bold uppercase">Pro Plan Active</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
