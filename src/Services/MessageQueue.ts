import { Firestore, getFirestore, FieldValue } from "firebase-admin/firestore";
import { Whatsapp } from "../Whatsapp/Whatsapp";

const COLLECTION = "message_queue";

export interface QueueTask {
    id?: string;
    sessionId: string;
    to: string;
    text: string;
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

    /**
     * Pushes a new message into the Firestore queue
     */
    async push(sessionId: string, to: string, text: string) {
        const task: QueueTask = {
            sessionId,
            to,
            text,
            status: "pending",
            createdAt: new Date(),
        };
        return await this.db.collection(COLLECTION).add(task);
    }

    private processingSessions = new Set<string>();

    /**
     * Starts the global worker loop with multi-session parallelism
     */
    async startWorker() {
        if (this.isRunning) return;
        this.isRunning = true;
        console.log("🛡️ High-Concurrency Anti-Ban Queue Worker Started");

        while (this.isRunning) {
            try {
                // Find pending messages that aren't already being processed by their respective session workers
                const snapshot = await this.db.collection(COLLECTION)
                    .where("status", "==", "pending")
                    .limit(20) // Snag a batch
                    .get();

                if (snapshot.empty) {
                    await new Promise(resolve => setTimeout(resolve, 3000));
                    continue;
                }

                for (const doc of snapshot.docs) {
                    const task = { id: doc.id, ...doc.data() } as QueueTask;

                    // If this bot is already busy sending a message, skip to the next one in the batch
                    // This preserves the anti-ban sequence for individual bots while allowing
                    // Bot A and Bot B to send messages simultaneously.
                    if (this.processingSessions.has(task.sessionId)) continue;

                    // Spawn a parallel processor for this session
                    this.processingSessions.add(task.sessionId);
                    this.processTask(task).finally(() => {
                        this.processingSessions.delete(task.sessionId);
                    });
                }

                // Small breath between batch checks
                await new Promise(resolve => setTimeout(resolve, 1000));

            } catch (error) {
                console.error("Queue Worker Error:", error);
                await new Promise(resolve => setTimeout(resolve, 5000));
            }
        }
    }

    private async processTask(task: QueueTask) {
        const docRef = this.db.collection(COLLECTION).doc(task.id!);

        try {
            // 1. Mark as processing
            await docRef.update({ status: "processing" });

            // 2. Check if session is connected
            const session = await this.whatsapp.getSessionById(task.sessionId);
            if (!session || session.status !== 'connected') {
                throw new Error(`Session ${task.sessionId} not connected`);
            }

            // 3. Mimic human behavior with randomized delay (5-10 seconds)
            const delay = Math.floor(Math.random() * (10000 - 5000 + 1)) + 5000;
            console.log(`⏳ Queue: Waiting ${delay / 1000}s before sending to ${task.to}...`);
            await new Promise(resolve => setTimeout(resolve, delay));

            // 4. Send Message
            await this.whatsapp.sendText({
                sessionId: task.sessionId,
                to: task.to,
                text: task.text
            });

            // 5. Success
            await docRef.update({ status: "sent", sentAt: new Date() });

            // 6. TRACK COUNT ONLY (Do NOT store actual message)
            // Need to find which uid owns this sessionId
            const uid = task.sessionId.split('_')[0]; // assuming format uid_device1
            if (uid && uid.length > 5) { // quick sanity check
                await this.db.collection('users').doc(uid).update({
                    'stats.messagesUsed': FieldValue.increment(1),
                    updatedAt: FieldValue.serverTimestamp()
                }).catch(err => console.error(`[Stats Update Error] UID: ${uid}`, err));
            }

            console.log(`✅ Queue: Sent message to ${task.to}`);

        } catch (error: any) {
            console.error(`❌ Queue Error [${task.id}]:`, error.message);
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
