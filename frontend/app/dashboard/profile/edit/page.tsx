"use client";
import React, { useState, useRef } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Save, Camera, Loader2, CheckCircle2 } from "lucide-react";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { updateProfile } from "firebase/auth";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { db, auth, storage } from "@/lib/firebase";

export default function EditProfilePage() {
    const { user, userData } = useAuth();
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [toast, setToast] = useState(false);
    const [error, setError] = useState("");

    const [form, setForm] = useState({
        displayName: userData?.displayName || "",
        phone: userData?.phone || "",
        company: userData?.company || "",
        industry: userData?.industry || "",
        teamSize: userData?.teamSize || "",
        role: userData?.role || "",
        location: userData?.location || "",
        photoURL: userData?.photoURL || user?.photoURL || "",
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user) return;

        if (file.size > 2 * 1024 * 1024) {
            setError("Picture size must be less than 2MB.");
            return;
        }

        setUploading(true);
        setError("");

        try {
            const ext = file.name.split('.').pop();
            const storageRef = ref(storage, `avatars/${user.uid}_${Date.now()}.${ext}`);
            const uploadTask = uploadBytesResumable(storageRef, file);

            uploadTask.on('state_changed',
                (snapshot) => { },
                (err) => {
                    setError(err.message);
                    setUploading(false);
                },
                async () => {
                    const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                    setForm(prev => ({ ...prev, photoURL: downloadURL }));

                    if (auth.currentUser) {
                        await updateProfile(auth.currentUser, { photoURL: downloadURL });
                    }
                    await updateDoc(doc(db, "users", user.uid), {
                        photoURL: downloadURL,
                        updatedAt: serverTimestamp()
                    });

                    setUploading(false);
                }
            );
        } catch (err: any) {
            setError(err.message || "Upload failed");
            setUploading(false);
        }
    };

    const handleSave = async () => {
        if (!user) return;
        setSaving(true);
        setError("");
        try {
            // Update Firestore
            await updateDoc(doc(db, "users", user.uid), {
                ...form,
                updatedAt: serverTimestamp(),
            });
            // Update Firebase Auth display name
            if (auth.currentUser) {
                await updateProfile(auth.currentUser, { displayName: form.displayName });
            }
            // Show toast then go back
            setToast(true);
            setTimeout(() => {
                setToast(false);
                router.back();
            }, 1500);
        } catch (err: any) {
            setError(err.message || "कुछ गलत हो गया। फिर कोशिश करें।");
        } finally {
            setSaving(false);
        }
    };

    const initials = form.displayName
        ? form.displayName.split(" ").map((n: string) => n[0]).join("").toUpperCase().substring(0, 2)
        : user?.email ? user.email[0].toUpperCase() : "U";

    const fields = [
        { label: "Full Name", name: "displayName", type: "text", placeholder: "John Doe" },
        { label: "Phone Number", name: "phone", type: "tel", placeholder: "+91 XXXXX XXXXX" },
        { label: "Company / Brand", name: "company", type: "text", placeholder: "My Company Ltd." },
        { label: "Role / Designation", name: "role", type: "text", placeholder: "Marketing Manager" },
        { label: "Location", name: "location", type: "text", placeholder: "Mumbai, India" },
    ];

    const industries = ["E-commerce", "Healthcare", "Education", "Finance", "Real Estate", "Retail", "Technology", "Other"];
    const teamSizes = ["1-5", "6-20", "21-50", "51-200", "200+"];

    if (!user || !userData) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto pb-12">

            {/* ── Toast Notification ── */}
            <AnimatePresence>
                {toast && (
                    <motion.div
                        initial={{ opacity: 0, y: 60, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 60, scale: 0.95 }}
                        transition={{ type: "spring", stiffness: 400, damping: 28 }}
                        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl"
                        style={{
                            background: 'linear-gradient(135deg, #10b981, #059669)',
                            minWidth: '260px',
                            boxShadow: '0 8px 32px rgba(16,185,129,0.35)',
                        }}
                    >
                        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                            <CheckCircle2 className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <p className="text-white font-bold text-sm">Edit Profile Successful!</p>
                            <p className="text-emerald-100 text-xs">आपकी profile update हो गई ✓</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
            {/* Header */}
            <div className="flex items-center gap-3 mb-6 pt-2">
                <button
                    onClick={() => router.back()}
                    className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors hover:scale-105 active:scale-95"
                    style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
                >
                    <ArrowLeft className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
                </button>
                <h1 className="text-xl font-bold font-outfit tracking-tight" style={{ color: 'var(--text-primary)' }}>
                    Edit Profile
                </h1>
            </div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">

                {/* Avatar Card */}
                <div className="rounded-2xl p-6 flex items-center gap-5 shadow-sm"
                    style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                    <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-2xl font-bold font-outfit shadow-lg shrink-0 overflow-hidden relative">
                            {form.photoURL ? (
                                <img src={form.photoURL} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                                initials
                            )}
                            {uploading && (
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                    <Loader2 className="w-6 h-6 text-white animate-spin" />
                                </div>
                            )}
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center shadow transition-transform group-hover:scale-110">
                            <Camera className="w-3.5 h-3.5 text-white" />
                        </div>
                        <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            ref={fileInputRef}
                            onChange={handleImageUpload}
                        />
                    </div>
                    <div>
                        <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{form.displayName || "User"}</p>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{user.email}</p>
                        <p className="text-xs mt-1 text-indigo-400 font-medium">UID: {user.uid.substring(0, 12)}...</p>
                    </div>
                </div>

                {/* Form Fields */}
                <div className="rounded-2xl p-6 space-y-5"
                    style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                    <h3 className="text-sm font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--text-muted)' }}>
                        Personal Information
                    </h3>

                    {fields.map(field => (
                        <div key={field.name}>
                            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                                {field.label}
                            </label>
                            <input
                                type={field.type}
                                name={field.name}
                                value={(form as any)[field.name]}
                                onChange={handleChange}
                                placeholder={field.placeholder}
                                className="w-full px-4 py-2.5 rounded-xl text-sm font-medium outline-none transition-all focus:ring-2 focus:ring-indigo-500"
                                style={{
                                    background: 'var(--bg-subtle)',
                                    border: '1px solid var(--border)',
                                    color: 'var(--text-primary)',
                                }}
                            />
                        </div>
                    ))}

                    {/* Industry Dropdown */}
                    <div>
                        <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                            Industry
                        </label>
                        <select
                            name="industry"
                            value={form.industry}
                            onChange={handleChange}
                            className="w-full px-4 py-2.5 rounded-xl text-sm font-medium outline-none transition-all focus:ring-2 focus:ring-indigo-500"
                            style={{
                                background: 'var(--bg-subtle)',
                                border: '1px solid var(--border)',
                                color: 'var(--text-primary)',
                            }}
                        >
                            <option value="">Select Industry</option>
                            {industries.map(i => <option key={i} value={i}>{i}</option>)}
                        </select>
                    </div>

                    {/* Team Size */}
                    <div>
                        <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                            Team Size
                        </label>
                        <div className="flex gap-2 flex-wrap">
                            {teamSizes.map(size => (
                                <button
                                    key={size}
                                    type="button"
                                    onClick={() => setForm(prev => ({ ...prev, teamSize: size }))}
                                    className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                                    style={{
                                        background: form.teamSize === size ? '#4f46e5' : 'var(--bg-subtle)',
                                        color: form.teamSize === size ? '#fff' : 'var(--text-secondary)',
                                        border: `1px solid ${form.teamSize === size ? '#4f46e5' : 'var(--border)'}`,
                                    }}
                                >
                                    {size}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Error */}
                {error && (
                    <div className="rounded-xl px-4 py-3 text-sm text-red-600 font-medium" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                        {error}
                    </div>
                )}

                {/* Save Button */}
                <button
                    onClick={handleSave}
                    disabled={saving || toast}
                    className="w-full py-3.5 rounded-2xl font-bold text-sm text-white flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
                    style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}
                >
                    {saving ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
                    ) : (
                        <><Save className="w-4 h-4" /> Save Changes</>
                    )}
                </button>
            </motion.div>
        </div>
    );
}
