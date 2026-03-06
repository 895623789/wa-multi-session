import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { Whatsapp } from "../Whatsapp/Whatsapp";
import { MessageQueue } from "./MessageQueue";

const COLLECTION = "scheduled_tasks";

export interface ScheduledTask {
    id?: string;
    sessionId: string;
    ownerNumber?: string;
    type: 'message' | 'reminder' | 'broadcast';
    time: string; // ISO string
    data: {
        text: string;
        numbers?: string[];
        media?: string;
        repeat?: 'daily' | 'weekly' | 'none';
    };
    status: 'pending' | 'processing' | 'completed' | 'failed';
    retryCount?: number;
    createdAt: string;
}

export class TaskScheduler {
    private db = getFirestore();
    private whatsapp: Whatsapp;
    private queue: MessageQueue;
    private interval: NodeJS.Timeout | null = null;
    private readonly MAX_RETRIES = 3;

    constructor(whatsapp: Whatsapp, queue: MessageQueue) {
        this.whatsapp = whatsapp;
        this.queue = queue;
    }

    public start() {
        console.log("⏰ AI Task Scheduler Online. Polling every 60s...");
        this.interval = setInterval(() => this.checkTasks(), 60000);
        this.checkTasks(); // Immediate check on boot
    }

    private async checkTasks() {
        const now = new Date();
        const nowIso = now.toISOString();

        try {
            // Using a single where to avoid index complexity, filtering time locally
            const snapshot = await this.db.collection(COLLECTION)
                .where("status", "==", "pending")
                .limit(20)
                .get();

            if (snapshot.empty) return;

            const dueTasks = snapshot.docs.filter(d => {
                const t = d.data().time;
                return t && t <= nowIso;
            });

            if (dueTasks.length === 0) return;

            console.log(`🔔 Scheduler: Found ${dueTasks.length} tasks ready for execution.`);

            for (const doc of dueTasks) {
                const task = { id: doc.id, ...doc.data() } as ScheduledTask;
                await this.executeTask(task, doc.ref);
            }
        } catch (err) {
            console.error("Task Scheduler Poll Error:", err);
        }
    }

    private async executeTask(task: ScheduledTask, docRef: any) {
        const now = new Date().toISOString();
        const retryCount = task.retryCount || 0;

        try {
            // Lock the task
            await docRef.update({ status: 'processing' });

            if (task.type === 'reminder' && task.ownerNumber) {
                await this.whatsapp.sendText({
                    sessionId: task.sessionId,
                    to: task.ownerNumber,
                    text: `⏰ *REMINDER* 🔔\n\n${task.data.text}\n\n_Scheduled by your AI Assistant_`
                });
            } else if ((task.type === 'message' || task.type === 'broadcast') && task.data.numbers) {
                for (const num of task.data.numbers) {
                    const cleanNum = num.replace(/[^\d]/g, "");
                    if (cleanNum.length > 5) {
                        await this.queue.push(task.sessionId, cleanNum, task.data.text, task.data.media);
                    }
                }
            }

            // Handle Repetition vs Completion
            const repeat = task.data?.repeat;
            if (repeat === 'daily' || repeat === 'weekly') {
                const nextDate = new Date(task.time);
                if (repeat === 'daily') nextDate.setDate(nextDate.getDate() + 1);
                if (repeat === 'weekly') nextDate.setDate(nextDate.getDate() + 7);

                await docRef.update({
                    status: 'pending',
                    time: nextDate.toISOString(),
                    retryCount: 0,
                    lastExecutedAt: now
                });
                console.log(`♻️ Recurring task ${task.id} rescheduled for ${nextDate.toISOString()}`);
            } else {
                await docRef.update({
                    status: 'completed',
                    executedAt: now
                });
            }

            // Notify Owner on Success
            if (task.ownerNumber) {
                const count = task.data.numbers?.length || 1;
                const completionMsg = `✅ *Scheduled Task Done!*\n\n*Type:* ${task.type}\n*Target:* ${count > 1 ? count + ' contacts' : 'Self'}\n*Original Time:* ${new Date(task.time).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`;
                this.whatsapp.sendText({
                    sessionId: task.sessionId,
                    to: task.ownerNumber,
                    text: completionMsg
                }).catch(() => { });
            }

            console.log(`✅ Task ${task.id} executed successfully.`);

        } catch (err: any) {
            console.error(`❌ Task ${task.id} failed:`, err);
            if (retryCount < this.MAX_RETRIES) {
                await docRef.update({ status: 'pending', retryCount: retryCount + 1 });
                console.log(`🔁 Task ${task.id} will retry (${retryCount + 1}/${this.MAX_RETRIES})`);
            } else {
                await docRef.update({ status: 'failed', error: err.message, failedAt: now });
            }
        }
    }

    public stop() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
    }
}
