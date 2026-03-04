# BulkReply.io - Enterprise Architecture & Zero-Downtime Handbook

> **CRITICAL DIRECTIVE FOR ALL DEVELOPERS**
> BulkReply.io is not a standard React/Node CRUD app. It is a **High-Availability Stateful Communications Platform** designed to emulate the stability of WhatsApp itself. 
> 
> We host millions of active WhatsApp automation bots globally. The Node.js backend (`src/server.ts`) is designed to run **FOREVER**. 
> 
> **YOU MUST NEVER REQUIRE A SERVER RESTART, REBUILD, OR REDEPLOY (`npm run dev`, `pm2 restart`, etc.) FOR ANY APP FEATURE TO WORK.** 

This document outlines the strict engineering principles required to maintain 100% uptime while allowing users to dynamically create, edit, delete, and toggle bots and features.

---

## 1. The Core Philosophy: "Live-State Synchronization"

When a user interacts with the Frontend (Next.js Dashboard, Agency Portal, settings, bulk messaging, AI config), the change must be reflected in the Backend's **Live Memory** instantly. 

The Backend lives in its own memory space handling live WebSocket connections to WhatsApp servers via Baileys. **Updating a database (like Firestore) from the frontend DOES NOT magically update the running backend session.** 

### Every Feature Must Follow This 3-Step Flow:
1. **Persistence:** Frontend saves the user action (e.g., "Bot turned OFF", "System Prompt changed", "New AI Agent created") to the Database (Firestore).
2. **Real-Time Sync:** Frontend *immediately* fires a REST API call or WebSocket event to the Node.js backend (`e.g., POST /session/update-config`).
3. **In-Memory Mutatation:** The Node.js backend receives the API call, locates the running WhatsApp adapter/session in memory, and mutates its variables. The very next message handled down the pipeline uses the new state.
*Result: 0.0ms downtime.*

---

## 2. Feature Implementation Guidelines

Whenever you build a new feature, you must design it for a constantly running server.

### A. Bot Creation & QR Scanning
- **The Wrong Way:** Generate QR, tell user to scan, tell user to hard refresh or restart server to see bot.
- **The Right Way:** The frontend requests `/session/start`. The backend dynamically launches a new Baileys adapter socket in memory, bridges the events to the frontend via polling/WebSockets, and instantly begins processing messages the millisecond the QR is scanned.

### B. Bot Configuration (AI System Instructions, Name, Role)
- **The Wrong Way:** Save config to DB. Hope the message handler fetches from DB on every message (causes huge latency and database billing spikes).
- **The Right Way:** Call `POST /session/update-config`. The backend keeps the bot's "brain" cached in RAM. The API updates the RAM cache instantly. The AI changes its personality mid-conversation without dropping the socket.

### C. Logic Switch & Feature Toggles (ON/OFF)
- **The Wrong Way:** Deleting the bot from the database to stop it, causing the socket to forcefully unpair and the user getting logged out of WhatsApp Web.
- **The Right Way:** Call `POST /session/update-status`. Update a boolean flag in the backend adapter (`isActive: false`). The message listener (`onMessageReceived`) will check this flag and instantly drop incoming messages, keeping the socket silently connected in the background.

### D. Bulk Messaging & Campaigns
- **The Wrong Way:** Frontend loops through 10,000 numbers and fires 10,000 APIs to the backend, crashing the Node Event Loop.
- **The Right Way:** Frontend submits a "Campaign Payload" to a Queue (DB or Redis). A separate worker process or interval on the backend pulls jobs from the queue and sends them via the already-open Baileys sockets, respecting WhatsApp rate limits.

---

## 3. Graceful Crash Recovery & Deployments

While we *never* manually disrupt the server for user actions, production servers do experience uncontrollable restarts (Deploying new code versions, VPS hardware reboots, fatal Node out-of-memory crashes).

**When the server restarts, NO USER should ever know it restarted. Sessions must instantly resume.**

### The `autoConnectActiveAgents` Engine
Located at the bottom of `server.ts`, this engine is our lifeline. It runs **exactly once** when the Node server boots.

1. It bypasses everything and scans the `users` and `agencyAgents` collections in Firestore.
2. It lists every single Agent that has `isActive == true`.
3. It rapidly triggers `whatsapp.startSession()` for every active agent in a non-blocking loop.
4. The Baileys library looks at the existing Auth Keys folder (`wa-sessions/`) and instantly re-establishes the WebSocket connection to WhatsApp servers for millions of bots.
5. Users do not need to re-scan QR codes. Messages queued during the 5-second deploy downtime instantly stream in.

### 🚨 Developer Requirement for New Collections 🚨
If you (the future developer) create a new type of Bot, a new Subscription plan, or a new database collection that holds active WhatsApp sessions, **YOU MUST ADD A SCANNING ROUTINE FOR IT INSIDE `autoConnectActiveAgents()`**. 

If you forget this, the next time we deploy a code update to the VPS, all the bots in your new collection will permanently go offline until the user manually logs in and clicks "Start". **This is a catastrophic failure.**

---

## 4. Stability & Memory Management

Because this server runs 24/7 forever, **Memory Leaks are fatal.**

- **Event Listeners:** If you add an event listener (`socket.ev.on(...)`), ensure it is properly scoped to the session and destroyed if the session is disconnected/deleted.
- **SetInterval/Timeouts:** Always use `clearInterval` and `clearTimeout` when an agent is deleted. Do not let orphaned loops run forever in the background.
- **Global Arrays:** Do not push infinite chat history into a global array. RAM will fill up in hours. Use temporary LRU caches or stream directly to the database.

---

## 5. Atomic Cleanup & Anti-Ghost Protocol

The most dangerous bug in this system is the **"Ghost Bot"**—a running WhatsApp session that has no corresponding record in the database. If this happens, the bot will continue to reply to customers, but the user/admin will have no button to stop it.

### 🚨 Mandatory Deletion Sequence 🚨

When deleting a Client, Agent, or Session, you **MUST** follow this exact order:

1.  **Backend Cleanup First:** Call the Backend API (e.g., `DELETE /session/delete` or `POST /session/bulk-delete`). 
    - This ensures the Node.js event loop kills the socket and clears the RAM *while it still knows who the bot belongs to*.
2.  **Persistence Cleanup Second:** Only after the backend confirms (or at least receives) the request, delete the document from Firestore.

### 🛑 Blocking vs. Deletion
- **Blocking a User:** MUST call `POST /session/bulk-status` with `isActive: false`. This kills the AI logic but keeps the WhatsApp session authenticated. **DO NOT DELETE** the sessions, as a blocked user might be unblocked later and shouldn't have to re-scan QR codes.
- **Deleting a Client/SaaS User:** MUST call `POST /session/bulk-delete`. This completely destroys the authentication keys and memory state.

**Failing to follow this sequence will lead to uncontrollable automated bots that can only be killed by a full VPS reboot—which violates our Zero-Downtime mission.**

---

## 6. High-Concurrency & Anti-Ban Architecture (Message Queue)

WhatsApp/Meta's AI is extremely aggressive at banning numbers that exhibit "Bot-Like" behavior (e.g., sending 100 messages in 1 second). To counter this while still maintaining massive scale, we use a **Multi-Queue Anti-Ban Architecture**:

1. **Dedicated Workers (100% Parallelism):** The `MessageQueue` does NOT use a single loop. When a bot starts, it spawns its own isolated `while` loop in the Node.js event loop. 
   - *Result:* If Bot A is sending 10,000 messages, Bot B does not have to wait in line. 100 bots can send messages at the exact same millisecond.
2. **Human Mimicry (Anti-Ban):** Before any message is sent, the dedicated worker reads the message length, calculates the average human typing time, applies a randomized hesitation delay, and sends a `composing` (typing...) indicator to Meta's servers. **Do not remove this delay.**
3. **Safe-Sleep & Auto-Retry:** If a bot temporarily loses internet connection right before sending a message, the worker will NOT fail the queue. It will push the message back to the top of the queue and "Sleep" for 10 seconds, waiting for the connection to recover.

By following these rules, BulkReply.io will achieve WhatsApp-level infrastructure stability while maintaining near-zero ban rates.
