import {
    AuthenticationCreds,
    AuthenticationState,
    BufferJSON,
    initAuthCreds,
    proto,
    SignalDataTypeMap,
} from "baileys";
import { getFirestore, Firestore, FieldValue } from "firebase-admin/firestore";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { LegacyStore } from "./Store";
import dotenv from "dotenv";

dotenv.config();

// ─── Firebase App Init (same as FirebaseAdapter — safe to call multiple times) ─
function getFirebaseApp() {
    if (getApps().length === 0) {
        initializeApp({
            credential: cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
            }),
        });
    }
}

// ─── Collection Name ──────────────────────────────────────────────────────────
const COLLECTION = "wa_credentials";

// ─── Helper functions (same pattern as Sqlite.ts readData / writeData) ────────

const getDb = (): Firestore => {
    getFirebaseApp();
    return getFirestore();
};

/**
 * Sirf ek document mein saari keys field ke roop mein store hogi.
 * Key format: "creds", "app-state-sync-key-xxx", "pre-key-xxx", etc.
 * (SQLite mein yeh id column tha)
 */
const docRef = (db: Firestore, sessionId: string) =>
    db.collection(COLLECTION).doc(sessionId);

// ─── useFirebaseAuthState ──────────────────────────────────────────────────────
// Exact same signature as useSQLiteAuthState in Sqlite.ts
export const useFirebaseAuthState = async (
    sessionId: string
): Promise<{
    state: AuthenticationState;
    saveCreds: () => Promise<void>;
    deleteCreds: () => Promise<void>;
}> => {
    const db = getDb();
    const ref = docRef(db, sessionId);

    // ── writeData ──────────────────────────────────────────────────────────────
    const writeData = async (id: string, _category: string, data: any) => {
        await ref.set(
            { [id]: JSON.stringify(data, BufferJSON.replacer) },
            { merge: true }
        );
    };

    // ── readData ───────────────────────────────────────────────────────────────
    const readData = async (id: string): Promise<any> => {
        const snap = await ref.get();
        if (!snap.exists) return null;
        const raw = snap.data()?.[id];
        return raw ? JSON.parse(raw, BufferJSON.reviver) : null;
    };

    // ── removeData ─────────────────────────────────────────────────────────────
    const removeData = async (id: string) => {
        await ref.update({ [id]: FieldValue.delete() });
    };

    // ── clearData ──────────────────────────────────────────────────────────────
    const clearData = async () => {
        await ref.delete();
    };

    // ── Load existing creds (same as Sqlite.ts line 94-95) ────────────────────
    const creds: AuthenticationCreds =
        (await readData("creds")) || initAuthCreds();

    return {
        state: {
            creds,
            keys: {
                get: async (type, ids) => {
                    const data: { [_: string]: SignalDataTypeMap[typeof type] } = {};
                    for (const id of ids) {
                        let value = await readData(`${type}-${id}`);
                        if (type === "app-state-sync-key" && value) {
                            value = proto.Message.AppStateSyncKeyData.fromObject(value);
                        }
                        data[id] = value;
                    }
                    return data;
                },
                set: async (data) => {
                    for (const category in data) {
                        for (const id in data[category as keyof SignalDataTypeMap]) {
                            const value = data[category as keyof SignalDataTypeMap]![id];
                            if (value) {
                                await writeData(`${category}-${id}`, category, value);
                            } else {
                                await removeData(`${category}-${id}`);
                            }
                        }
                    }
                },
            },
        },
        saveCreds: async () => {
            await writeData("creds", "credentials", creds);
        },
        deleteCreds: async () => {
            await clearData();
        },
    };
};

// ─── getFirebaseSessionIds ──────────────────────────────────────────────────
// Same as getSQLiteSessionIds in Sqlite.ts
export const getFirebaseSessionIds = async (): Promise<string[]> => {
    const db = getDb();
    const snap = await db.collection(COLLECTION).get();
    return snap.docs.map((doc) => doc.id);
};

// ─── FirebaseStore (LegacyStore) ───────────────────────────────────────────
// Exact same class structure as SQLiteStore in Sqlite.ts
export class FirebaseStore implements LegacyStore {
    sessionId: string;
    state: AuthenticationState;

    private db: Firestore;
    private ref: ReturnType<typeof docRef>;

    private writeData = async (id: string, category: string, data: any) => {
        await this.ref.set(
            { [id]: JSON.stringify(data, BufferJSON.replacer) },
            { merge: true }
        );
    };

    private readData = async (id: string): Promise<any> => {
        const snap = await this.ref.get();
        if (!snap.exists) return null;
        const raw = snap.data()?.[id];
        return raw ? JSON.parse(raw, BufferJSON.reviver) : null;
    };

    private removeData = async (id: string) => {
        await this.ref.update({ [id]: FieldValue.delete() });
    };

    private clearData = async () => {
        await this.ref.delete();
    };

    constructor(sessionId: string) {
        this.sessionId = sessionId;
        this.db = getDb();
        this.ref = docRef(this.db, sessionId);

        this.state = {
            creds: initAuthCreds(),
            keys: {
                get: async (type, ids) => {
                    const data: { [_: string]: SignalDataTypeMap[typeof type] } = {};
                    for (const id of ids) {
                        let value = await this.readData(`${type}-${id}`);
                        if (type === "app-state-sync-key" && value) {
                            value = proto.Message.AppStateSyncKeyData.fromObject(value);
                        }
                        data[id] = value;
                    }
                    return data;
                },
                set: async (data) => {
                    for (const category in data) {
                        for (const id in data[category as keyof SignalDataTypeMap]) {
                            const value = data[category as keyof SignalDataTypeMap]![id];
                            if (value) {
                                await this.writeData(`${category}-${id}`, category, value);
                            } else {
                                await this.removeData(`${category}-${id}`);
                            }
                        }
                    }
                },
            },
        };
    }

    async saveCreds() {
        await this.writeData("creds", "credentials", this.state.creds);
    }

    async deleteCreds() {
        await this.clearData();
    }
}
