"use client";

import { useEffect, useState } from "react";
import { CheckCircle, XCircle, AlertTriangle, Info, X } from "lucide-react";

export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastMessage {
    id: string;
    title: string;
    msg: string;
    type: ToastType;
}

// Global toast state accessible from anywhere
let globalAddToast: ((toast: Omit<ToastMessage, "id">) => void) | null = null;

export function toast(title: string, msg: string, type: ToastType = "info") {
    if (globalAddToast) {
        globalAddToast({ title, msg, type });
    }
}

const ICONS = {
    success: <CheckCircle className="w-5 h-5 text-emerald-500" />,
    error: <XCircle className="w-5 h-5 text-rose-500" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-400" />,
    info: <Info className="w-5 h-5 text-blue-500" />,
};

const ACCENT = {
    success: "border-l-4 border-emerald-500",
    error: "border-l-4 border-rose-500",
    warning: "border-l-4 border-amber-400",
    info: "border-l-4 border-blue-500",
};

export function ToastContainer() {
    const [toasts, setToasts] = useState<ToastMessage[]>([]);

    useEffect(() => {
        globalAddToast = (newToast) => {
            const id = Math.random().toString(36).slice(2);
            setToasts((prev) => [...prev, { ...newToast, id }]);
            setTimeout(() => {
                setToasts((prev) => prev.filter((t) => t.id !== id));
            }, 4500);
        };
        return () => { globalAddToast = null; };
    }, []);

    const dismiss = (id: string) => setToasts((prev) => prev.filter((t) => t.id !== id));

    if (toasts.length === 0) return null;

    return (
        <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-3 max-w-sm w-full pointer-events-none">
            {toasts.map((t) => (
                <div
                    key={t.id}
                    className={`pointer-events-auto flex items-start gap-3 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl shadow-slate-200/60 dark:shadow-slate-900/60 p-4 pr-3 animate-in slide-in-from-right-10 fade-in duration-300 ${ACCENT[t.type]}`}
                >
                    <div className="shrink-0 mt-0.5">{ICONS[t.type]}</div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-900 dark:text-white leading-tight">{t.title}</p>
                        {t.msg && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">{t.msg}</p>}
                    </div>
                    <button
                        onClick={() => dismiss(t.id)}
                        className="shrink-0 p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                    >
                        <X className="w-3.5 h-3.5" />
                    </button>
                </div>
            ))}
        </div>
    );
}
