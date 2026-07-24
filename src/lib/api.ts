import { Room, Poll, Question } from "../types";
import { db, isFirebaseConfigured } from "./firebase";
import { doc, onSnapshot } from "firebase/firestore";

// Base API URL is relative to the origin
const API_BASE = "";

// Helper to get or create an anonymous user ID stored in localStorage
export function getOrCreateUserId(): string {
  if (typeof window === "undefined") return "server-id";
  let userId = localStorage.getItem("castvote_user_id");
  if (!userId) {
    userId = "usr_" + Math.random().toString(36).substring(2, 11);
    localStorage.setItem("castvote_user_id", userId);
  }
  return userId;
}

// Real-time Cloud Firestore or Fallback Polling Listener
export function subscribeToRoom(roomId: string, callback: (room: Room) => void): () => void {
  const upperCode = roomId.toUpperCase();
  
  if (isFirebaseConfigured() && db) {
    // Real-time Firebase Firestore listener
    const roomRef = doc(db, "rooms", upperCode);
    const unsubscribe = onSnapshot(roomRef, (snapshot) => {
      if (snapshot.exists()) {
        callback(snapshot.data() as Room);
      }
    }, (err) => {
      console.warn("Firestore snapshot error:", err);
    });
    return unsubscribe;
  }

  // Fallback 2-second polling listener
  const intervalId = setInterval(async () => {
    try {
      const roomData = await getRoom(upperCode);
      callback(roomData);
    } catch (err) {
      // Ignore background sync hiccups
    }
  }, 2000);

  return () => clearInterval(intervalId);
}

export async function createRoom(title: string): Promise<Room> {
  const response = await fetch(`${API_BASE}/api/rooms`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || "Failed to create room");
  }
  return response.json();
}

export async function getRoom(roomId: string): Promise<Room> {
  const response = await fetch(`${API_BASE}/api/rooms/${roomId}`);
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `Failed to fetch room ${roomId}`);
  }
  return response.json();
}

export async function createPoll(roomId: string, question: string, options: string[]): Promise<Poll> {
  const response = await fetch(`${API_BASE}/api/rooms/${roomId}/polls`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question, options }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || "Failed to create poll");
  }
  return response.json();
}

export async function activatePoll(roomId: string, pollId: string): Promise<Poll> {
  const response = await fetch(`${API_BASE}/api/rooms/${roomId}/polls/${pollId}/activate`, {
    method: "POST",
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || "Failed to activate poll");
  }
  return response.json();
}

export async function closePoll(roomId: string, pollId: string): Promise<Poll> {
  const response = await fetch(`${API_BASE}/api/rooms/${roomId}/polls/${pollId}/close`, {
    method: "POST",
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || "Failed to close poll");
  }
  return response.json();
}

export async function deletePoll(roomId: string, pollId: string): Promise<{ success: boolean }> {
  const response = await fetch(`${API_BASE}/api/rooms/${roomId}/polls/${pollId}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || "Failed to delete poll");
  }
  return response.json();
}

export async function submitVote(roomId: string, pollId: string, optionIndex: number, userId: string): Promise<Poll> {
  const response = await fetch(`${API_BASE}/api/rooms/${roomId}/polls/${pollId}/vote`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ optionIndex, userId }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || "Failed to submit vote");
  }
  return response.json();
}

export async function submitQuestion(roomId: string, text: string): Promise<Question> {
  const response = await fetch(`${API_BASE}/api/rooms/${roomId}/questions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || "Failed to submit question");
  }
  return response.json();
}

export async function toggleUpvote(roomId: string, questionId: string, userId: string): Promise<Question> {
  const response = await fetch(`${API_BASE}/api/rooms/${roomId}/questions/${questionId}/upvote`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || "Failed to upvote question");
  }
  return response.json();
}

export async function toggleAnswered(roomId: string, questionId: string): Promise<Question> {
  const response = await fetch(`${API_BASE}/api/rooms/${roomId}/questions/${questionId}/answered`, {
    method: "POST",
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || "Failed to toggle answered status");
  }
  return response.json();
}

export async function toggleArchive(roomId: string, questionId: string): Promise<Question> {
  const response = await fetch(`${API_BASE}/api/rooms/${roomId}/questions/${questionId}/archive`, {
    method: "POST",
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || "Failed to toggle archive status");
  }
  return response.json();
}

export async function deleteQuestion(roomId: string, questionId: string): Promise<{ success: boolean }> {
  const response = await fetch(`${API_BASE}/api/rooms/${roomId}/questions/${questionId}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || "Failed to delete question");
  }
  return response.json();
}

// AI API calls
export async function generateAIPoll(topic: string): Promise<{ question: string; options: string[] }> {
  const response = await fetch(`${API_BASE}/api/ai/generate-poll`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ topic }),
  });
  if (!response.ok) {
    throw new Error("Failed to generate AI poll");
  }
  return response.json();
}

export async function summarizeAIQA(roomId: string): Promise<{ summary: string; keyPoints: string[] }> {
  const response = await fetch(`${API_BASE}/api/ai/summarize-qa`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ roomId }),
  });
  if (!response.ok) {
    throw new Error("Failed to summarize Q&A");
  }
  return response.json();
}
