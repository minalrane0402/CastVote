import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { Room, Poll, Question } from "./src/types";

const rooms = new Map<string, Room>();

function generateRoomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  let code = "";
  for (let i = 0; i < 5; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  if (rooms.has(code)) {
    return generateRoomCode();
  }
  return code;
}

const apiKey = process.env.GEMINI_API_KEY || "";
const aiClient = apiKey ? new GoogleGenAI({ apiKey }) : null;

// Seed DEMO room for immediate testing
const demoRoom: Room = {
  id: "DEMO",
  title: "CastVote Live Demo Session",
  createdAt: new Date().toISOString(),
  polls: [
    {
      id: "poll-1",
      question: "How would you rate your experience with CastVote so far?",
      options: ["Outstanding 🚀", "Very good 👍", "Promising 💡", "Needs work 🔧"],
      votes: { 0: 6, 1: 4, 2: 2, 3: 0 },
      votedUsers: ["user-demo-1", "user-demo-2", "user-demo-3", "user-demo-4", "user-demo-5", "user-demo-6", "user-demo-7", "user-demo-8", "user-demo-9", "user-demo-10", "user-demo-11", "user-demo-12"],
      isActive: true,
      isClosed: false,
    },
    {
      id: "poll-2",
      question: "Which live interaction capability is most critical for your events?",
      options: [
        "Real-time chart broadcasts on stage",
        "Zero-download guest mobile voting",
        "Audience Q&A upvoting & moderation",
        "AI-assisted poll drafting & insights"
      ],
      votes: { 0: 3, 1: 9, 2: 5, 3: 4 },
      votedUsers: [],
      isActive: false,
      isClosed: false,
    }
  ],
  questions: [
    {
      id: "q-1",
      text: "How do participants join a room? Do attendees need to create an account?",
      upvotes: 9,
      upvotedBy: ["user-demo-1", "user-demo-2", "user-demo-3", "user-demo-4", "user-demo-5", "user-demo-6", "user-demo-7", "user-demo-8", "user-demo-9"],
      isAnswered: true,
      isArchived: false,
      createdAt: new Date(Date.now() - 300000).toISOString(),
    },
    {
      id: "q-2",
      text: "Is there a limit on how many audience members can vote simultaneously?",
      upvotes: 14,
      upvotedBy: ["user-demo-1", "user-demo-2", "user-demo-3", "user-demo-4", "user-demo-5", "user-demo-6", "user-demo-7", "user-demo-8", "user-demo-9", "user-demo-10", "user-demo-11", "user-demo-12", "user-demo-13", "user-demo-14"],
      isAnswered: false,
      isArchived: false,
      createdAt: new Date(Date.now() - 120000).toISOString(),
    },
    {
      id: "q-3",
      text: "Can presenters moderate inappropriate questions before showing them on stage?",
      upvotes: 5,
      upvotedBy: ["user-demo-1", "user-demo-2", "user-demo-3", "user-demo-4", "user-demo-5"],
      isAnswered: false,
      isArchived: false,
      createdAt: new Date(Date.now() - 45000).toISOString(),
    }
  ]
};
rooms.set("DEMO", demoRoom);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());

  // API Endpoints

  app.post("/api/rooms", (req, res) => {
    const { title } = req.body;
    if (!title || typeof title !== "string") {
      return res.status(400).json({ error: "Event title is required" });
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
    res.status(201).json(newRoom);
  });

  app.get("/api/rooms/:id", (req, res) => {
    const roomId = req.params.id.toUpperCase();
    const room = rooms.get(roomId);
    if (!room) {
      return res.status(404).json({ error: `Room ${roomId} not found` });
    }
    res.json(room);
  });

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
      id: "poll-" + Math.random().toString(36).substring(2, 11),
      question: question.trim(),
      options: options.map(opt => opt.trim()),
      votes: initialVotes,
      votedUsers: [],
      isActive: room.polls.length === 0,
      isClosed: false,
    };

    if (newPoll.isActive) {
      room.polls.forEach(p => p.isActive = false);
    }

    room.polls.push(newPoll);
    res.status(201).json(newPoll);
  });

  app.post("/api/rooms/:id/polls/:pollId/activate", (req, res) => {
    const roomId = req.params.id.toUpperCase();
    const { pollId } = req.params;
    const room = rooms.get(roomId);
    if (!room) return res.status(404).json({ error: `Room ${roomId} not found` });

    const poll = room.polls.find(p => p.id === pollId);
    if (!poll) return res.status(404).json({ error: `Poll ${pollId} not found` });

    room.polls.forEach(p => p.isActive = false);
    poll.isActive = true;
    poll.isClosed = false;

    res.json(poll);
  });

  app.post("/api/rooms/:id/polls/:pollId/close", (req, res) => {
    const roomId = req.params.id.toUpperCase();
    const { pollId } = req.params;
    const room = rooms.get(roomId);
    if (!room) return res.status(404).json({ error: `Room ${roomId} not found` });

    const poll = room.polls.find(p => p.id === pollId);
    if (!poll) return res.status(404).json({ error: `Poll ${pollId} not found` });

    poll.isActive = false;
    poll.isClosed = true;

    res.json(poll);
  });

  app.delete("/api/rooms/:id/polls/:pollId", (req, res) => {
    const roomId = req.params.id.toUpperCase();
    const { pollId } = req.params;
    const room = rooms.get(roomId);
    if (!room) return res.status(404).json({ error: `Room ${roomId} not found` });

    const idx = room.polls.findIndex(p => p.id === pollId);
    if (idx === -1) return res.status(404).json({ error: `Poll ${pollId} not found` });

    const wasActive = room.polls[idx].isActive;
    room.polls.splice(idx, 1);

    if (wasActive && room.polls.length > 0) {
      room.polls[0].isActive = true;
    }

    res.json({ success: true });
  });

  app.post("/api/rooms/:id/polls/:pollId/vote", (req, res) => {
    const roomId = req.params.id.toUpperCase();
    const { pollId } = req.params;
    const room = rooms.get(roomId);
    if (!room) return res.status(404).json({ error: `Room ${roomId} not found` });

    const poll = room.polls.find(p => p.id === pollId);
    if (!poll) return res.status(404).json({ error: `Poll ${pollId} not found` });

    if (poll.isClosed) {
      return res.status(400).json({ error: "Voting is currently closed for this poll" });
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

    poll.votes[optionIndex] = (poll.votes[optionIndex] || 0) + 1;
    poll.votedUsers.push(userId);

    res.json(poll);
  });

  app.post("/api/rooms/:id/questions", (req, res) => {
    const roomId = req.params.id.toUpperCase();
    const room = rooms.get(roomId);
    if (!room) return res.status(404).json({ error: `Room ${roomId} not found` });

    const { text } = req.body;
    if (!text || typeof text !== "string" || !text.trim()) {
      return res.status(400).json({ error: "Question text is required" });
    }

    const newQuestion: Question = {
      id: "q-" + Math.random().toString(36).substring(2, 11),
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

  app.post("/api/rooms/:id/questions/:questionId/upvote", (req, res) => {
    const roomId = req.params.id.toUpperCase();
    const { questionId } = req.params;
    const room = rooms.get(roomId);
    if (!room) return res.status(404).json({ error: `Room ${roomId} not found` });

    const question = room.questions.find(q => q.id === questionId);
    if (!question) return res.status(404).json({ error: `Question ${questionId} not found` });

    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: "User ID is required" });

    const idx = question.upvotedBy.indexOf(userId);
    if (idx !== -1) {
      question.upvotedBy.splice(idx, 1);
      question.upvotes = Math.max(0, question.upvotes - 1);
    } else {
      question.upvotedBy.push(userId);
      question.upvotes++;
    }

    res.json(question);
  });

  app.post("/api/rooms/:id/questions/:questionId/answered", (req, res) => {
    const roomId = req.params.id.toUpperCase();
    const { questionId } = req.params;
    const room = rooms.get(roomId);
    if (!room) return res.status(404).json({ error: `Room ${roomId} not found` });

    const question = room.questions.find(q => q.id === questionId);
    if (!question) return res.status(404).json({ error: `Question ${questionId} not found` });

    question.isAnswered = !question.isAnswered;
    res.json(question);
  });

  app.post("/api/rooms/:id/questions/:questionId/archive", (req, res) => {
    const roomId = req.params.id.toUpperCase();
    const { questionId } = req.params;
    const room = rooms.get(roomId);
    if (!room) return res.status(404).json({ error: `Room ${roomId} not found` });

    const question = room.questions.find(q => q.id === questionId);
    if (!question) return res.status(404).json({ error: `Question ${questionId} not found` });

    question.isArchived = !question.isArchived;
    res.json(question);
  });

  app.delete("/api/rooms/:id/questions/:questionId", (req, res) => {
    const roomId = req.params.id.toUpperCase();
    const { questionId } = req.params;
    const room = rooms.get(roomId);
    if (!room) return res.status(404).json({ error: `Room ${roomId} not found` });

    const qIdx = room.questions.findIndex(q => q.id === questionId);
    if (qIdx === -1) return res.status(404).json({ error: `Question ${questionId} not found` });

    room.questions.splice(qIdx, 1);
    res.json({ success: true });
  });

  // AI Assistance API Endpoints

  app.post("/api/ai/generate-poll", async (req, res) => {
    const { topic } = req.body;
    if (!topic || typeof topic !== "string") {
      return res.status(400).json({ error: "Topic is required" });
    }

    if (!aiClient) {
      return res.json({
        question: `What is your team's top priority regarding ${topic.trim()}?`,
        options: [
          "Performance & Speed Optimization ⚡",
          "User Experience & Design Quality 🎨",
          "Security & Data Protection 🔒",
          "Operational Efficiency & Cost 💡"
        ]
      });
    }

    try {
      const prompt = `Create one engaging, realistic multiple-choice poll question with 4 concise answer choices for a presentation topic on "${topic.trim()}". Return ONLY valid JSON format: {"question": "...", "options": ["...", "...", "...", "..."]}`;
      const response = await aiClient.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });

      const text = response.text || "";
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return res.json(JSON.parse(jsonMatch[0]));
      }
      throw new Error("Invalid response format");
    } catch (err: any) {
      return res.json({
        question: `How does your team approach ${topic.trim()}?`,
        options: [
          "High priority in current roadmap 🚀",
          "Planned for next quarter 📅",
          "Under evaluation & research 🔬",
          "Not a priority at this time ⏸️"
        ]
      });
    }
  });

  app.post("/api/ai/summarize-qa", async (req, res) => {
    const { roomId } = req.body;
    if (!roomId) return res.status(400).json({ error: "Room ID is required" });

    const room = rooms.get(roomId.toUpperCase());
    if (!room) return res.status(404).json({ error: "Room not found" });

    const questionsList = room.questions
      .filter(q => !q.isArchived)
      .sort((a, b) => b.upvotes - a.upvotes)
      .map(q => `• [${q.upvotes} upvotes] ${q.text}`);

    if (questionsList.length === 0) {
      return res.json({
        summary: "No audience questions submitted yet.",
        keyPoints: ["Invite your audience to scan the stage QR code and submit questions!"]
      });
    }

    if (!aiClient) {
      return res.json({
        summary: `Audience submitted ${questionsList.length} questions focusing on platform capabilities, scalability, and ease of joining.`,
        keyPoints: questionsList.slice(0, 3)
      });
    }

    try {
      const prompt = `Analyze these top audience questions from a live event:\n${questionsList.join("\n")}\n\nProvide a 2-sentence executive summary of audience concerns, followed by 3 key talking points for the presenter to address on stage. Return ONLY valid JSON format: {"summary": "...", "keyPoints": ["...", "...", "..."]}`;
      const response = await aiClient.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });

      const text = response.text || "";
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return res.json(JSON.parse(jsonMatch[0]));
      }
      throw new Error("Invalid response format");
    } catch (err: any) {
      return res.json({
        summary: `Audience submitted ${questionsList.length} questions prioritizing platform setup and limits.`,
        keyPoints: questionsList.slice(0, 3)
      });
    }
  });

  // Vite Dev Server / Static Assets
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`CastVote running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start CastVote server:", err);
});
