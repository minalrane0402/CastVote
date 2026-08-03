# CastVote — Real-Time Voting & Audience Engagement

CastVote is a modern, high-performance web application designed for live audience interaction during presentations, keynotes, meetups, and workshops. It allows presenters to launch live multiple-choice polls and host anonymous Q&A sessions where participants upvote burning questions in real time — with **zero logins or app downloads required**.

---

## Key Features

* **⚡ Real-Time Live Polling**: Presenters create multiple-choice polls on the fly. Results synchronize live as audience members tap their choices.
* **💬 Upvoted Audience Q&A**: Anonymous question submission board with live upvoting, moderation, and answered/archived tagging.
* **📺 Stage-Ready Projector Display**: High-visibility presentation view with dynamic animated result charts and a fast local QR code.
* **📱 Zero-Login Guest Access**: Audience members join instantly by scanning a scannable QR code or typing a 5-letter room code on their mobile browser.
* **✨ AI Presenter Co-Pilot**:
  * **AI Poll Generator**: Type a presentation topic (e.g. *"Cloud Native Architecture"*) and generate a formatted multiple-choice poll in seconds.
  * **AI Q&A Summarizer**: Synthesize top audience questions into executive summaries and key presenter talking points live on stage.
* **🔒 Cloud & Privacy First**: Zero local disk footprint. Session data runs seamlessly in server memory or connects to **Firebase Cloud Firestore (Free Tier)** for zero-latency real-time state broadcasts.

---

## Quick Start Guide

### Prerequisites
* **Node.js**: v18.0.0 or higher
* **npm**: v9.0.0 or higher

### Installation & Running Locally

1. **Clone or navigate to the project repository:**
   ```bash
   cd CastVote
   ```

2. **Install project dependencies:**
   ```bash
   npm install
   ```

3. **(Optional) Configure Environment Variables:**
   Copy `.env.example` to `.env` if you wish to configure Gemini AI features or Firebase Cloud Firestore persistence:
   ```bash
   cp .env.example .env
   ```
   * Set `GEMINI_API_KEY` for AI poll generation and Q&A summarization.
   * Set `VITE_FIREBASE_PROJECT_ID` & `VITE_FIREBASE_API_KEY` if using Cloud Firestore.

4. **Start the application:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## How It Works & How to Use It

### 1. Presenter Workflow
1. Navigate to the homepage and click **Create Session**.
2. Enter your event title (e.g., *"Engineering All-Hands 2026"*).
3. You will land in the **Presenter Control Panel**:
   - **Launch Polls**: Type questions manually or click ** Draft with AI** to generate options automatically. Click **Launch** to push a poll to audience screens.
   - **Moderate Q&A**: Monitor incoming questions, view upvote counts, mark items as **Answered Live**, or archive off-topic items.
   - **Open Projector View**: Click **Projector View** to display full-screen charts and the join QR code on the main stage screen.

### 2. Participant / Audience Workflow
1. Scan the QR code on the stage screen or go to `http://<server-ip>:3000` and enter the 5-letter Room Code (or try code `DEMO`).
2. **Vote on Active Polls**: Tap an option on your smartphone screen and watch results sync instantly.
3. **Ask & Upvote Questions**: Submit questions anonymously or tap the upvote icon on fellow attendees' questions to push them to the top of the presenter's queue.

---

## Built With

* **Frontend**: React 19, Vite, Tailwind CSS, Motion (Framer Motion), Lucide Icons, Canvas Confetti, QRCode.react
* **Backend**: Node.js, Express, tsx
* **Database & Sync**: Firebase Cloud Firestore (optional real-time mode) & in-memory state engine
* **AI Integration**: `@google/genai` (Gemini API)

---

## 📄 License

MIT License. Designed for seamless live audience engagement.
