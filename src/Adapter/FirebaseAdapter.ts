import { Adapter } from "./Adapter";
import { getFirestore, Firestore } from "firebase-admin/firestore";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import dotenv from "dotenv";

dotenv.config();

// ─── Firebase App Initialization ─────────────────────────────────────────────
// Sirf ek baar initialize hoga (multiple calls safe hain)
function getFirebaseApp() {
    if (getApps().length === 0) {
        initializeApp({
            credential: cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                // \n ko actual newline mein convert karo (.env mein escape hota hai)
                privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
            }),
        });
    }
}

// ─── Collection Name ──────────────────────────────────────────────────────────
// Firestore mein sabhi WhatsApp credentials yahan store honge:
// wa_credentials/{sessionId}  (ek document, key = field name)
const COLLECTION = "wa_credentials";

export class FirebaseAdapter implements Adapter {
    private db: Firestore;

    constructor() {
        getFirebaseApp();
        this.db = getFirestore();
    }

    // ─── Helper: ek session ka document reference ─────────────────────────────
    private docRef(sessionId: string) {
        return this.db.collection(COLLECTION).doc(sessionId);
    }

    // ─── Write: ek key-value pair save karo ──────────────────────────────────
    // SqliteAdapter mein: INSERT OR REPLACE INTO auth_store ...
    async writeData(
        sessionId: string,
        key: string,
        _category: string,
        data: string
    ): Promise<void> {
        // merge: true → sirf yeh field update hogi, baaki fields safe rahenge
        await this.docRef(sessionId).set({ [key]: data }, { merge: true });
    }

    // ─── Read: ek key ki value nikalo ────────────────────────────────────────
    // SqliteAdapter mein: SELECT value FROM auth_store WHERE id = ? AND session_id = ?
    async readData(sessionId: string, key: string): Promise<string | null> {
        const snap = await this.docRef(sessionId).get();
        if (!snap.exists) return null;
        const val = snap.data()?.[key];
        return val ?? null;
    }

    // ─── Delete: ek specific key hataao ──────────────────────────────────────
    // SqliteAdapter mein: DELETE FROM auth_store WHERE id = ? AND session_id = ?
    async deleteData(sessionId: string, key: string): Promise<void> {
        const { FieldValue } = await import("firebase-admin/firestore");
        await this.docRef(sessionId).update({ [key]: FieldValue.delete() });
    }

    // ─── Clear: ek session ki sabhi keys delete karo (logout/delete session) ─
    // SqliteAdapter mein: DELETE FROM auth_store WHERE session_id = ?
    async clearData(sessionId: string): Promise<void> {
        await this.docRef(sessionId).delete();
    }

    // ─── List Sessions: saare session IDs nikalo ─────────────────────────────
    // SqliteAdapter mein: SELECT DISTINCT session_id FROM auth_store
    async listSessions(): Promise<string[]> {
        const snap = await this.db.collection(COLLECTION).get();
        return snap.docs.map((doc) => doc.id);
    }
}
