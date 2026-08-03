export interface Poll {
  id: string;
  question: string;
  options: string[];
  votes: Record<number, number>; // optionIndex -> count
  votedUsers: string[]; // anonymous user IDs
  isActive: boolean;
  isClosed: boolean;
}

export interface Question {
  id: string;
  text: string;
  upvotes: number;
  upvotedBy: string[]; // anonymous user IDs
  isAnswered: boolean;
  isArchived: boolean;
  createdAt: string;
}

export interface Room {
  id: string; // 5-letter room code (e.g. "DEMO")
  title: string;
  createdAt: string;
  polls: Poll[];
  questions: Question[];
}

export interface AISummary {
  summary: string;
  keyPoints: string[];
}
