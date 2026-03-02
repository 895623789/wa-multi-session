# Practical Steps Performed

यह फ़ाइल उन सभी चरणों का सारांश देती है जो हमने `wa-multi-session` इंजन के साथ प्रैक्टिकल रूप में किए हैं।

## 1️⃣ रेपो क्लोन किया
```bash
git clone https://github.com/mimamch/wa-multi-session.git
cd wa-multi-session
```

## 2️⃣ डिपेंडेंसी इंस्टॉल की
```powershell
npm install
```

## 3️⃣ सर्वर शुरू किया
```powershell
npm run dev   # या npx ts-node src/server.ts
```
सर्वर स्टार्ट होने पर टर्मिनल में दिखता है:
```
🚀 BulkReply.io API is running at http://localhost:3000
```

## 4️⃣ सत्र (session) शुरू किया
```powershell
Invoke-RestMethod -Method Post -Uri http://localhost:3000/session/start \
  -Headers @{ 'Content-Type' = 'application/json' } \
  -Body '{"sessionId":"test-user-2"}'
```
टर्मिनल में QR‑कोड प्रिंट हुआ, जिसे फ़ोन से स्कैन किया गया।

## 5️⃣ मैसेज भेजा
```powershell
Invoke-RestMethod -Method Post -Uri http://localhost:3000/message/send \
  -Headers @{ 'Content-Type' = 'application/json' } \
  -Body '{"sessionId":"test-user-2","to":"918302829465","text":"Hello from BulkReply.io API!"}'
```
सफल प्रतिक्रिया:
```
Message sent in queue
```

## 6️⃣ परिणाम
- सत्र सफलतापूर्वक कनेक्ट हो गया और QR‑कोड स्कैन हो गया।
- संदेश फ़ोन पर प्राप्त हुआ।
- अब हम इस बैकएंड को आगे के फीचर्स (AI Auto‑Reply, Anti‑Ban Queue, फ़्रंट‑एंड) के साथ विस्तारित कर सकते हैं।

---
*यह फ़ाइल `practical_steps.md` के रूप में `C:\Users\TCS\.gemini\antigravity\brain\8d3e5dad-95f6-45af-9c2d-0cbb4eb330d5\practical_steps.md` में सेव की गई है।*
