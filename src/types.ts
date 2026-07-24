export interface Poll {
  id: string;
  question: string;
  options: string[];
  votes: Record<number, number>; // index of option -> count of votes
  votedUsers: string[]; // anonymous user IDs who have voted
  isActive: boolean;
  isClosed: boolean;
}

export interface Question {
  id: string;
  text: string;
  upvotes: number;
  upvotedBy: string[]; // anonymous user IDs who have upvoted
  isAnswered: boolean;
  isArchived: boolean;
  createdAt: string;
}

export interface Room {
  id: string; // The short room code (e.g. "PULSE")
  title: string;
  createdAt: string;
  polls: Poll[];
  questions: Question[];
}
