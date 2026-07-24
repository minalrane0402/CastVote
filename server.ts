import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { Room, Poll, Question } from "./src/types";

// In-memory database of rooms
const rooms = new Map<string, Room>();

// Helper to generate a unique 5-letter room code
function generateRoomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ"; // Exclude easily confused letters like I, O
  let code = "";
  for (let i = 0; i < 5; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  // Ensure uniqueness
  if (rooms.has(code)) {
    return generateRoomCode();
  }
  return code;
}

// Initialize Gemini AI Client
const apiKey = process.env.GEMINI_API_KEY || "";
const aiClient = apiKey ? new GoogleGenAI({ apiKey }) : null;

// Seed a "DEMO" room for onboarding and immediate testing
const demoRoom: Room = {
  id: "DEMO",
  title: "CastVote Demo Session",
  createdAt: new Date().toISOString(),
  polls: [
    {
      id: "poll-1",
      question: "How would you rate your experience with CastVote so far?",
      options: ["Amazing! 🚀", "Pretty good 👍", "It has potential 💡", "Needs improvement 🔧"],
      votes: { 0: 5, 1: 3, 2: 1, 3: 0 },
      votedUsers: ["user-demo-1", "user-demo-2", "user-demo-3", "user-demo-4", "user-demo-5", "user-demo-6", "user-demo-7", "user-demo-8", "user-demo-9"],
      isActive: true,
      isClosed: false,
    },
    {
      id: "poll-2",
      question: "Which feature of a live Q&A/Poll app is most crucial to you?",
      options: [
        "Real-time visual chart updates",
        "No-login guest access (via QR)",
        "Question upvoting & moderation",
        "Sleek mobile-responsive design"
      ],
      votes: { 0: 2, 1: 8, 2: 4, 3: 3 },
      votedUsers: [],
      isActive: false,
      isClosed: false,
    }
  ],
  questions: [
    {
      id: "q-1",
      text: "How do participants join? Do they need to download an app?",
      upvotes: 8,
      upvotedBy: ["user-demo-1", "user-demo-2", "user-demo-3", "user-demo-4", "user-demo-5", "user-demo-6", "user-demo-7", "user-demo-8"],
      isAnswered: true,
      isArchived: false,
      createdAt: new Date(Date.now() - 300000).toISOString(),
    },
    {
      id: "q-2",
      text: "Is there a limit on how many people can vote at the same time?",
      upvotes: 12,
      upvotedBy: ["user-demo-1", "user-demo-2", "user-demo-3", "user-demo-4", "user-demo-5", "user-demo-6", "user-demo-7", "user-demo-8", "user-demo-9", "user-demo-10", "user-demo-11", "user-demo-12"],
      isAnswered: false,
      isArchived: false,
      createdAt: new Date(Date.now() - 120000).toISOString(),
    },
    {
      id: "q-3",
      text: "Can I moderate questions and archive inappropriate ones?",
      upvotes: 4,
      upvotedBy: ["user-demo-1", "user-demo-2", "user-demo-3", "user-demo-4"],
      isAnswered: false,
      isArchived: false,
      createdAt: new Date(Date.now() - 30000).toISOString(),
    }
  ]
};
rooms.set("DEMO", demoRoom);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());

  // API ROUTES

  // Create a new room
  app.post("/api/rooms", (req, res) => {
    const { title } = req.body;
    if (!title || typeof title !== "string") {
      return res.status(400).json({ error: "Room title is required" });
    }

    const id = generateRoomCode();
    const newRoom: Room = {
      id,
      title: title.trim(),
      createdAt: new Date().toISOString(),
      polls: [],
      questions: [],
    };

    rooms.set(id, newRoom);
    console.log(`Created room: ${id} - ${newRoom.title}`);
    res.status(201).json(newRoom);
  });

  // Get a room's state
  app.get("/api/rooms/:id", (req, res) => {
    const roomId = req.params.id.toUpperCase();
    const room = rooms.get(roomId);
    if (!room) {
      return res.status(404).json({ error: `Room ${roomId} not found` });
    }
    res.json(room);
  });

  // Create a poll
  app.post("/api/rooms/:id/polls", (req, res) => {
    const roomId = req.params.id.toUpperCase();
    const room = rooms.get(roomId);
    if (!room) {
      return res.status(404).json({ error: `Room ${roomId} not found` });
    }

    const { question, options } = req.body;
    if (!question || !Array.isArray(options) || options.length < 2) {
      return res.status(400).json({ error: "Poll question and at least 2 options are required" });
    }

    const initialVotes: Record<number, number> = {};
    options.forEach((_, idx) => {
      initialVotes[idx] = 0;
    });

    const newPoll: Poll = {
      id: "poll-" + Math.random().toString(36).substr(2, 9),
      question: question.trim(),
      options: options.map(opt => opt.trim()),
      votes: initialVotes,
      votedUsers: [],
      isActive: room.polls.length === 0, // Auto-activate first poll if no active polls exist
      isClosed: false,
    };

    if (newPoll.isActive) {
      room.polls.forEach(p => p.isActive = false);
    }

    room.polls.push(newPoll);
    res.status(201).json(newPoll);
  });

  // Activate a poll
  app.post("/api/rooms/:id/polls/:pollId/activate", (req, res) => {
    const roomId = req.params.id.toUpperCase();
    const { pollId } = req.params;
    const room = rooms.get(roomId);
    if (!room) {
      return res.status(404).json({ error: `Room ${roomId} not found` });
    }

    const poll = room.polls.find(p => p.id === pollId);
    if (!poll) {
      return res.status(404).json({ error: `Poll ${pollId} not found` });
    }

    room.polls.forEach(p => p.isActive = false);
    poll.isActive = true;
    poll.isClosed = false;

    res.json(poll);
  });

  // Close a poll
  app.post("/api/rooms/:id/polls/:pollId/close", (req, res) => {
    const roomId = req.params.id.toUpperCase();
    const { pollId } = req.params;
    const room = rooms.get(roomId);
    if (!room) {
      return res.status(404).json({ error: `Room ${roomId} not found` });
    }

    const poll = room.polls.find(p => p.id === pollId);
    if (!poll) {
      return res.status(404).json({ error: `Poll ${pollId} not found` });
    }

    poll.isActive = false;
    poll.isClosed = true;

    res.json(poll);
  });

  // Delete a poll
  app.delete("/api/rooms/:id/polls/:pollId", (req, res) => {
    const roomId = req.params.id.toUpperCase();
    const { pollId } = req.params;
    const room = rooms.get(roomId);
    if (!room) {
      return res.status(404).json({ error: `Room ${roomId} not found` });
    }

    const pollIndex = room.polls.findIndex(p => p.id === pollId);
    if (pollIndex === -1) {
      return res.status(404).json({ error: `Poll ${pollId} not found` });
    }

    const wasActive = room.polls[pollIndex].isActive;
    room.polls.splice(pollIndex, 1);

    if (wasActive && room.polls.length > 0) {
      room.polls[0].isActive = true;
    }

    res.json({ success: true });
  });

  // Vote on a poll
  app.post("/api/rooms/:id/polls/:pollId/vote", (req, res) => {
    const roomId = req.params.id.toUpperCase();
    const { pollId } = req.params;
    const room = rooms.get(roomId);
    if (!room) {
      return res.status(404).json({ error: `Room ${roomId} not found` });
    }

    const poll = room.polls.find(p => p.id === pollId);
    if (!poll) {
      return res.status(404).json({ error: `Poll ${pollId} not found` });
    }

    if (poll.isClosed) {
      return res.status(400).json({ error: "This poll is closed for voting" });
    }

    const { optionIndex, userId } = req.body;
    if (typeof optionIndex !== "number" || !userId) {
      return res.status(400).json({ error: "Option index and user ID are required" });
    }

    if (optionIndex < 0 || optionIndex >= poll.options.length) {
      return res.status(400).json({ error: "Invalid option index" });
    }

    if (poll.votedUsers.includes(userId)) {
      return res.status(400).json({ error: "You have already voted on this poll" });
    }

    if (poll.votes[optionIndex] === undefined) {
      poll.votes[optionIndex] = 0;
    }
    poll.votes[optionIndex]++;
    poll.votedUsers.push(userId);

    res.json(poll);
  });

  // Submit a question to Q&A
  app.post("/api/rooms/:id/questions", (req, res) => {
    const roomId = req.params.id.toUpperCase();
    const room = rooms.get(roomId);
    if (!room) {
      return res.status(404).json({ error: `Room ${roomId} not found` });
    }

    const { text } = req.body;
    if (!text || typeof text !== "string" || !text.trim()) {
      return res.status(400).json({ error: "Question text is required" });
    }

    const newQuestion: Question = {
      id: "q-" + Math.random().toString(36).substr(2, 9),
      text: text.trim(),
      upvotes: 0,
      upvotedBy: [],
      isAnswered: false,
      isArchived: false,
      createdAt: new Date().toISOString(),
    };

    room.questions.push(newQuestion);
    res.status(201).json(newQuestion);
  });

  // Upvote a question
  app.post("/api/rooms/:id/questions/:questionId/upvote", (req, res) => {
    const roomId = req.params.id.toUpperCase();
    const { questionId } = req.params;
    const room = rooms.get(roomId);
    if (!room) {
      return res.status(404).json({ error: `Room ${roomId} not found` });
    }

    const question = room.questions.find(q => q.id === questionId);
    if (!question) {
      return res.status(404).json({ error: `Question ${questionId} not found` });
    }

    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    const index = question.upvotedBy.indexOf(userId);
    if (index !== -1) {
      question.upvotedBy.splice(index, 1);
      question.upvotes = Math.max(0, question.upvotes - 1);
    } else {
      question.upvotedBy.push(userId);
      question.upvotes++;
    }

    res.json(question);
  });

  // Toggle question answered status
  app.post("/api/rooms/:id/questions/:questionId/answered", (req, res) => {
    const roomId = req.params.id.toUpperCase();
    const { questionId } = req.params;
    const room = rooms.get(roomId);
    if (!room) {
      return res.status(404).json({ error: `Room ${roomId} not found` });
    }

    const question = room.questions.find(q => q.id === questionId);
    if (!question) {
      return res.status(404).json({ error: `Question ${questionId} not found` });
    }

    question.isAnswered = !question.isAnswered;
    res.json(question);
  });

  // Toggle question archived status
  app.post("/api/rooms/:id/questions/:questionId/archive", (req, res) => {
    const roomId = req.params.id.toUpperCase();
    const { questionId } = req.params;
    const room = rooms.get(roomId);
    if (!room) {
      return res.status(404).json({ error: `Room ${roomId} not found` });
    }

    const question = room.questions.find(q => q.id === questionId);
    if (!question) {
      return res.status(404).json({ error: `Question ${questionId} not found` });
    }

    question.isArchived = !question.isArchived;
    res.json(question);
  });

  // Delete a question
  app.delete("/api/rooms/:id/questions/:questionId", (req, res) => {
    const roomId = req.params.id.toUpperCase();
    const { questionId } = req.params;
    const room = rooms.get(roomId);
    if (!room) {
      return res.status(404).json({ error: `Room ${roomId} not found` });
    }

    const qIndex = room.questions.findIndex(q => q.id === questionId);
    if (qIndex === -1) {
      return res.status(404).json({ error: `Question ${questionId} not found` });
    }

    room.questions.splice(qIndex, 1);
    res.json({ success: true });
  });

  // GEMINI AI ENDPOINTS

  // AI Poll Generator Endpoint
  app.post("/api/ai/generate-poll", async (req, res) => {
    const { topic } = req.body;
    if (!topic || typeof topic !== "string") {
      return res.status(400).json({ error: "Topic string is required" });
    }

    if (!aiClient) {
      // Intelligent fallback if GEMINI_API_KEY is not set
      return res.json({
        question: `What is the most critical factor regarding ${topic.trim()}?`,
        options: [
          "High Performance & Scalability ⚡",
          "User Experience & Design Aesthetics 🎨",
          "Security & Reliability 🔒",
          "Ease of Implementation & Cost 💡"
        ]
      });
    }

    try {
      const prompt = `You are an expert event presenter assistant. Based on the topic "${topic.trim()}", create ONE engaging multiple-choice poll question with 4 distinct, concise answer options. Respond ONLY in valid JSON with format: {"question": "...", "options": ["...", "...", "...", "..."]}`;
      const response = await aiClient.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });

      const text = response.text || "";
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return res.json(parsed);
      }
      throw new Error("Could not parse AI response JSON");
    } catch (err: any) {
      console.error("Gemini AI poll generation error:", err);
      // Fallback
      return res.json({
        question: `How would you evaluate ${topic.trim()} for your team?`,
        options: [
          "Essential priority 🚀",
          "Valuable addition 👍",
          "Needs further testing 🔬",
          "Low priority right now ⏳"
        ]
      });
    }
  });

  // AI Q&A Summarizer & Talking Points Endpoint
  app.post("/api/ai/summarize-qa", async (req, res) => {
    const { roomId } = req.body;
    if (!roomId) {
      return res.status(400).json({ error: "Room ID is required" });
    }

    const room = rooms.get(roomId.toUpperCase());
    if (!room) {
      return res.status(404).json({ error: "Room not found" });
    }

    const questionsList = room.questions
      .filter(q => !q.isArchived)
      .sort((a, b) => b.upvotes - a.upvotes)
      .map(q => `• [${q.upvotes} upvotes] ${q.text}`);

    if (questionsList.length === 0) {
      return res.json({
        summary: "No questions submitted yet to summarize.",
        keyPoints: ["Encourage your audience to scan the QR code and submit their burning questions!"]
      });
    }

    if (!aiClient) {
      return res.json({
        summary: `Analyzed ${questionsList.length} audience questions. Key concerns focus on setup, limits, and moderation features.`,
        keyPoints: questionsList.slice(0, 3)
      });
    }

    try {
      const prompt = `You are a live event keynotes co-pilot. Here are the top upvoted questions from the audience:\n${questionsList.join("\n")}\n\nProvide a concise 2-sentence executive summary of audience sentiment, followed by 3 key presenter talking points to address these questions. Return strictly JSON with format: {"summary": "...", "keyPoints": ["...", "...", "..."]}`;
      
      const response = await aiClient.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });

      const text = response.text || "";
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return res.json(parsed);
      }
      throw new Error("Could not parse AI summary JSON");
    } catch (err: any) {
      console.error("Gemini Q&A summary error:", err);
      return res.json({
        summary: `Audience submitted ${questionsList.length} questions prioritizing platform limits and ease of use.`,
        keyPoints: questionsList.slice(0, 3)
      });
    }
  });

  // VITE DEV SERVER OR STATIC SERVING MIDDLEWARE

  if (process.env.NODE_ENV !== "production") {
    console.log("Starting Vite in middleware mode...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Serving static production assets...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`CastVote server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start CastVote server:", err);
});
