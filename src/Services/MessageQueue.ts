import { Firestore, getFirestore, FieldValue } from "firebase-admin/firestore";
import { Whatsapp } from "../Whatsapp/Whatsapp";

const COLLECTION = "message_queue";

export interface QueueTask {
    id?: string;
    sessionId: string;
    to: string;
    text: string;
    media?: string; // Base64 or URL
    status: "pending" | "processing" | "sent" | "failed";
    createdAt: Date;
    error?: string;
}

export class MessageQueue {
    private db: Firestore;
    private whatsapp: Whatsapp;
    private isRunning: boolean = false;

    constructor(whatsapp: Whatsapp) {
        this.db = getFirestore();
        this.whatsapp = whatsapp;
    }


    private inMemoryQueues: Map<string, QueueTask[]> = new Map();
    private activeWorkers: Set<string> = new Set();

    /**
     * Pushes a new message into the Firestore queue and the isolated memory queue
     */
    async push(sessionId: string, to: string, text: string, media?: string) {
        const task: QueueTask = {
            sessionId,
            to,
            text,
            media,
            status: "pending",
            createdAt: new Date(),
        };
        const docRef = await this.db.collection(COLLECTION).add(task);
        task.id = docRef.id;

        // Push to isolated memory queue
        if (!this.inMemoryQueues.has(sessionId)) {
            this.inMemoryQueues.set(sessionId, []);
        }
        this.inMemoryQueues.get(sessionId)!.push(task);

        // Boot the dedicated worker for this session if it's sleeping
        this.startSessionWorker(sessionId);

        return docRef;
    }

    /**
     * Recovers pending messages on server boot
     */
    async startWorker() {
        if (this.isRunning) return;
        this.isRunning = true;
        console.log("🛡️ High-Concurrency Anti-Ban Queue Booting...");

        try {
            // Recover any pending tasks from before the server restarted
            const snapshot = await this.db.collection(COLLECTION).where("status", "==", "pending").get();
            let recovered = 0;

            for (const doc of snapshot.docs) {
                const task = { id: doc.id, ...doc.data() } as QueueTask;
                if (!this.inMemoryQueues.has(task.sessionId)) {
                    this.inMemoryQueues.set(task.sessionId, []);
                }
                this.inMemoryQueues.get(task.sessionId)!.push(task);
                recovered++;
            }

            console.log(`♻️ Recovered ${recovered} pending messages. Spawning dedicated workers...`);

            // Start workers for all sessions that have pending tasks
            for (const sessionId of this.inMemoryQueues.keys()) {
                this.startSessionWorker(sessionId);
            }
        } catch (error) {
            console.error("Queue Boot Recovery Error:", error);
        }
    }

    /**
     * Dedicated isolated worker loop for ONE specific WhatsApp Bot
     * Ensures Bot A's messages never block Bot B's messages.
     */
    private async startSessionWorker(sessionId: string) {
        if (this.activeWorkers.has(sessionId)) return;
        this.activeWorkers.add(sessionId);

        console.log(`🚀 Dedicated Worker Online for Session: [${sessionId}]`);

        while (this.activeWorkers.has(sessionId)) {
            const queue = this.inMemoryQueues.get(sessionId);

            if (!queue || queue.length === 0) {
                // Queue is empty, put this bot's worker to sleep
                this.activeWorkers.delete(sessionId);
                break;
            }

            // Check connection status before dequeuing to prevent failing entire queues during short disconnects
            const session = await this.whatsapp.getSessionById(sessionId);
            if (!session || session.status !== 'connected') {
                console.log(`💤 [${sessionId}] Disconnected. Queue sleeping for 10s... pending: ${queue.length}`);
                await new Promise(resolve => setTimeout(resolve, 10000));
                continue;
            }

            // Dequeue the first message
            const task = queue.shift()!;

            try {
                await this.processTask(task);
            } catch (err) {
                console.error(`Dedicated worker error for ${sessionId}:`, err);
            }

            // Small isolated cooldown between messages for this specific bot
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }

    private async processTask(task: QueueTask) {
        const docRef = this.db.collection(COLLECTION).doc(task.id!);

        try {
            await docRef.update({ status: "processing" });

            const session = await this.whatsapp.getSessionById(task.sessionId);
            if (!session || session.status !== 'connected') {
                throw new Error(`Session ${task.sessionId} not connected`);
            }

            // --- ANTI-BAN HUMAN MIMICRY ---
            // 1. Calculate reading/typing time based on text length (avg human types 1 char per 50ms)
            const typingDuration = Math.min(Math.max(task.text.length * 50, 2000), 10000); // 2s to 10s max

            // 2. Add random human hesitation before typing begins (1s to 3s)
            const hesitation = Math.floor(Math.random() * (3000 - 1000 + 1)) + 1000;
            await new Promise(resolve => setTimeout(resolve, hesitation));

            console.log(`🟢 [${task.sessionId}] Simulating typing for ${typingDuration / 1000}s to ${task.to}...`);

            // 3. Show "composing..." status on WhatsApp to Meta's servers
            await this.whatsapp.sendTypingIndicator({
                sessionId: task.sessionId,
                to: task.to,
                duration: typingDuration
            });

            // 4. Send Message (with Human Mimicry)
            if (task.media) {
                await this.whatsapp.sendImage({
                    sessionId: task.sessionId,
                    to: task.to,
                    media: task.media,
                    text: task.text
                });
            } else {
                await this.whatsapp.sendText({
                    sessionId: task.sessionId,
                    to: task.to,
                    text: task.text
                });
            }

            // 5. Success
            await docRef.update({ status: "sent", sentAt: new Date() });

            // 6. Track count
            const uid = task.sessionId.split('_')[0];
            if (uid && uid.length > 5) {
                await this.db.collection('users').doc(uid).update({
                    'stats.messagesUsed': FieldValue.increment(1),
                    updatedAt: FieldValue.serverTimestamp()
                }).catch(() => { });
            }

            console.log(`✅ [${task.sessionId}] Message sent successfully to ${task.to}`);

        } catch (error: any) {
            console.error(`❌ [${task.sessionId}] Failed to send to ${task.to}:`, error.message);

            // If it failed due to disconnect mid-typing, push it back to the front of the line
            if (error.message.includes('not connected') || error.message.includes('Connection Closed')) {
                console.log(`♻️ [${task.sessionId}] Auto-Retry: Saving message to ${task.to} for when connection returns.`);
                await docRef.update({ status: "pending" });
                this.inMemoryQueues.get(task.sessionId)?.unshift(task);
                return;
            }

            // Otherwise, it's a permanent error (invalid number, etc.)
            await docRef.update({
                status: "failed",
                error: error.message
            });
        }
    }

    /**
     * Retrieves current queue statistics
     */
    async getStats() {
        const pending = await this.db.collection(COLLECTION).where("status", "==", "pending").count().get();
        const sent = await this.db.collection(COLLECTION).where("status", "==", "sent").count().get();
        const failed = await this.db.collection(COLLECTION).where("status", "==", "failed").count().get();

        return {
            pending: pending.data().count,
            sent: sent.data().count,
            failed: failed.data().count
        };
    }

    stopWorker() {
        this.isRunning = false;
    }
}
