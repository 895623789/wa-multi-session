"use client";
import React, { useState } from "react";
import {
    Megaphone,
    Plus,
    Search,
    Filter,
    Eye,
    MousePointer2,
    Clock,
    CheckCircle2,
    AlertCircle,
    MoreVertical,
    Calendar,
    ChevronLeft,
    ChevronRight,
    X,
    FileText,
    Target,
    Zap,
    Send
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const announcements = [
    { id: "ANN-001", title: "New AI Engine v2.0 Released!", summary: "We have upgraded our AI model for better responses...", target: "All Users", status: "Active", views: "1,240", clicks: "450", date: "2024-03-01" },
    { id: "ANN-002", title: "Scheduled Maintenance: March 15", summary: "BulkReply will be down for 2 hours on March 15th...", target: "Pro & Basic", status: "Scheduled", views: "0", clicks: "0", date: "2024-03-15" },
    { id: "ANN-003", title: "Flash Sale: 50% Off Annual Plans", summary: "Upgrade now to get the best deal of the year...", target: "Free Trial", status: "Draft", views: "0", clicks: "0", date: "2024-03-05" },
];

export default function AnnouncementsPage() {
    const [isCreating, setIsCreating] = useState(false);

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight font-outfit text-indigo-900">Broadcast Announcements</h1>
                    <p className="text-sm text-slate-500 font-medium">Send global updates, offers, or alerts to user panels.</p>
                </div>
                <button
                    onClick={() => setIsCreating(true)}
                    className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 flex items-center gap-2 active:scale-95"
                >
                    <Plus size={18} />
                    Create Announcement
                </button>
            </div>

            {/* Performance Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                        <Megaphone size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Total Broadcasts</p>
                        <p className="text-2xl font-black text-slate-900 font-outfit leading-none">42</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                        <Eye size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Total Impressions</p>
                        <p className="text-2xl font-black text-slate-900 font-outfit leading-none">1.2M</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                        <MousePointer2 size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Avg. Click Rate</p>
                        <p className="text-2xl font-black text-slate-900 font-outfit leading-none">12.5%</p>
                    </div>
                </div>
            </div>

            {/* Announcements List */}
            <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-8 border-b border-slate-50 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input
                                type="text"
                                placeholder="Filter announcements..."
                                className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 w-64"
                            />
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-600">All</button>
                        <button className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-indigo-600 transition-all">Active</button>
                        <button className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-indigo-600 transition-all">Draft</button>
                    </div>
                </div>

                <div className="divide-y divide-slate-50">
                    {announcements.map((ann) => (
                        <div key={ann.id} className="p-8 hover:bg-slate-50/50 transition-all flex flex-col md:flex-row md:items-center justify-between gap-6 group">
                            <div className="space-y-3 max-w-xl">
                                <div className="flex items-center gap-3">
                                    <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-tighter border ${ann.status === 'Active' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                            ann.status === 'Scheduled' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-slate-100 text-slate-400 border-slate-200'
                                        }`}>
                                        {ann.status}
                                    </span>
                                    <span className="text-xs font-bold text-slate-400 font-outfit flex items-center gap-1">
                                        <Calendar size={12} />
                                        {ann.date}
                                    </span>
                                </div>
                                <h3 className="text-lg font-black text-slate-900 font-outfit group-hover:text-indigo-600 transition-colors leading-tight">{ann.title}</h3>
                                <p className="text-xs text-slate-500 font-medium leading-relaxed">{ann.summary}</p>
                                <div className="flex items-center gap-4 pt-1">
                                    <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        <Target size={12} className="text-indigo-400" />
                                        {ann.target}
                                    </div>
                                    <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        <Eye size={12} className="text-emerald-400" />
                                        {ann.views} Views
                                    </div>
                                    <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        <MousePointer2 size={12} className="text-amber-400" />
                                        {ann.clicks} Clicks
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:border-indigo-200 hover:text-indigo-600 transition-all">Edit</button>
                                <button className="p-2 border border-slate-200 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 hover:border-rose-100 transition-all">
                                    <Trash2 size={18} />
                                </button>
                                <button className="p-2 text-slate-300 hover:text-slate-600 transition-all">
                                    <MoreVertical size={20} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="p-8 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Showing 3 of 42 announcements</p>
                    <div className="flex items-center gap-2">
                        <button className="p-2 border border-slate-200 rounded-xl text-slate-400 hover:bg-white transition-all disabled:opacity-50" disabled>
                            <ChevronLeft size={18} />
                        </button>
                        <button className="p-2 border border-slate-200 rounded-xl text-slate-400 hover:bg-white transition-all">
                            <ChevronRight size={18} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Create Modal Overlay */}
            {isCreating && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        className="bg-white rounded-[40px] w-full max-w-3xl shadow-2xl overflow-hidden border border-slate-100"
                    >
                        <div className="p-10 border-b border-slate-50 bg-slate-50/50 flex items-center justify-between">
                            <div>
                                <h2 className="text-3xl font-black text-slate-900 font-outfit tracking-tight">Compose Broadcast</h2>
                                <p className="text-sm text-slate-500 font-medium">Create a new message for your user base.</p>
                            </div>
                            <button
                                onClick={() => setIsCreating(false)}
                                className="p-2 hover:bg-white rounded-xl text-slate-400 hover:text-slate-600 transition-all shadow-none hover:shadow-sm"
                            >
                                <X size={24} />
                            </button>
                        </div>
                        <div className="p-10 space-y-8 max-h-[60vh] overflow-y-auto custom-scrollbar">
                            <div className="space-y-4">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Announcement Title</label>
                                <input type="text" placeholder="e.g. Major Platform Update v2.0" className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-[24px] text-base font-black text-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all placeholder:text-slate-300" />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Target Audience</label>
                                    <select className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-[24px] text-sm font-bold focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all appearance-none cursor-pointer">
                                        <option>All Users</option>
                                        <option>Pro Plan Holders</option>
                                        <option>Basic Plan Holders</option>
                                        <option>Free Trial Users</option>
                                        <option>Inactive Users</option>
                                    </select>
                                </div>
                                <div className="space-y-4">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Priority Level</label>
                                    <div className="flex gap-2 p-1 bg-slate-100 rounded-[22px] border border-slate-200">
                                        {['Low', 'Medium', 'High'].map(p => (
                                            <button key={p} className={`flex-1 py-3 rounded-[18px] text-[10px] font-black uppercase tracking-widest transition-all ${p === 'Medium' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>
                                                {p}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Detailed Message (Markdown Support)</label>
                                <textarea rows={6} placeholder="Write your announcement details here..." className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-[24px] text-sm font-medium focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all placeholder:text-slate-300 leading-relaxed"></textarea>
                            </div>

                            <div className="space-y-4">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Action Button (Optional)</label>
                                <div className="grid grid-cols-2 gap-4">
                                    <input type="text" placeholder="Button Label (e.g. Upgrade Now)" className="px-5 py-4 bg-slate-50 border border-slate-200 rounded-[24px] text-sm font-bold" />
                                    <input type="text" placeholder="URL (e.g. /dashboard/plans)" className="px-5 py-4 bg-slate-50 border border-slate-200 rounded-[24px] text-sm font-bold" />
                                </div>
                            </div>
                        </div>
                        <div className="p-10 bg-slate-50 flex items-center justify-end gap-4 border-t border-slate-100">
                            <button
                                onClick={() => setIsCreating(false)}
                                className="px-8 py-4 font-black text-slate-400 hover:text-slate-600 text-xs uppercase tracking-widest transition-all"
                            >
                                Discard Draft
                            </button>
                            <button className="px-10 py-4 bg-slate-900 text-white rounded-[24px] text-xs font-black uppercase tracking-widest shadow-xl shadow-slate-200 hover:bg-slate-800 transition-all active:scale-[0.98] flex items-center gap-3">
                                <Send size={16} className="text-indigo-400" />
                                Publish Now
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
