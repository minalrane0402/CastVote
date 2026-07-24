import React, { useState } from "react";
import { Vote, MessageSquare, Send, ThumbsUp, HelpCircle, RefreshCw } from "lucide-react";
import { Room, Poll, Question } from "../types";
import { getOrCreateUserId } from "../lib/api";
import { motion, AnimatePresence } from "motion/react";
import confetti from "canvas-confetti";

interface ParticipantViewProps {
  room: Room;
  onVote: (pollId: string, optionIndex: number) => void;
  onAskQuestion: (text: string) => void;
  onUpvoteQuestion: (questionId: string) => void;
  onLeave: () => void;
  isSyncing: boolean;
  onForceRefresh: () => void;
}

export default function ParticipantView({
  room,
  onVote,
  onAskQuestion,
  onUpvoteQuestion,
  onLeave,
  isSyncing,
  onForceRefresh
}: ParticipantViewProps) {
  const [activeTab, setActiveTab] = useState<"polls" | "qa">("polls");
  const [questionText, setQuestionText] = useState("");
  const [qaSort, setQaSort] = useState<"top" | "recent">("top");
  const [votedLocalPolls, setVotedLocalPolls] = useState<string[]>([]);
  
  const userId = getOrCreateUserId();

  // Find the currently active poll
  const activePoll = room.polls.find(p => p.isActive);

  // Check if current user has voted on the active poll
  const hasVotedActivePoll = activePoll 
    ? activePoll.votedUsers.includes(userId) || votedLocalPolls.includes(activePoll.id)
    : false;

  const handleVoteSubmit = (optionIndex: number) => {
    if (!activePoll) return;
    onVote(activePoll.id, optionIndex);
    setVotedLocalPolls(prev => [...prev, activePoll.id]);

    // Trigger celebratory confetti effect
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.8 },
        colors: ["#22D3EE", "#818CF8", "#F472B6"]
      });
    } catch (e) {
      // Ignore confetti errors if blocked
    }
  };

  const handleQuestionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionText.trim()) return;
    onAskQuestion(questionText.trim());
    setQuestionText("");
  };

  // Filter out archived questions for participants
  const visibleQuestions = room.questions.filter(q => !q.isArchived);

  // Sort questions
  const sortedQuestions = [...visibleQuestions].sort((a, b) => {
    if (qaSort === "top") {
      if (b.upvotes !== a.upvotes) {
        return b.upvotes - a.upvotes;
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    } else {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
  });

  // Calculate total votes for active poll to show percentages
  const getTotalVotes = (poll: Poll) => {
    return Object.values(poll.votes).reduce((sum, count) => sum + count, 0);
  };

  const totalActivePollVotes = activePoll ? getTotalVotes(activePoll) : 0;

  return (
    <div className="min-h-screen bg-[#09090B] text-white flex flex-col justify-between font-sans selection:bg-accent-1 selection:text-black">
      {/* Mobile-optimized Header */}
      <header className="sticky top-0 bg-[#09090B]/95 border-b-2 border-zinc-900 z-40 backdrop-blur-md px-4 py-4">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button 
              onClick={onLeave}
              className="text-zinc-400 hover:text-white text-xs font-mono uppercase tracking-wider px-2.5 py-1.5 bg-zinc-900 border border-zinc-800 transition-colors cursor-pointer"
            >
              ← LEAVE
            </button>
            <div className="h-5 w-px bg-zinc-800"></div>
            <div>
              <h1 className="font-black text-white text-sm tracking-tight truncate max-w-[140px] sm:max-w-[180px]" title={room.title}>
                {room.title}
              </h1>
              <p className="text-[10px] text-accent-1 font-bold font-mono tracking-wider">
                CODE: {room.id}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={onForceRefresh}
              className={`p-2 bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer ${
                isSyncing ? "animate-spin text-accent-1 border-accent-1/40" : ""
              }`}
              title="Force refresh"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-1 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-accent-1"></span>
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow max-w-md w-full mx-auto px-4 py-6 overflow-y-auto">
        {/* Tab Selection */}
        <div className="flex bg-zinc-950 border-2 border-zinc-900 p-1 mb-6 rounded-none">
          <button
            onClick={() => setActiveTab("polls")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-mono uppercase font-black transition-all cursor-pointer ${
              activeTab === "polls"
                ? "bg-zinc-900 text-accent-1 border border-accent-1/30"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <Vote className="h-4 w-4" />
            Live Polls
            {activePoll && !hasVotedActivePoll && (
              <span className="h-2 w-2 rounded-full bg-accent-1 animate-pulse"></span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("qa")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-mono uppercase font-black transition-all cursor-pointer ${
              activeTab === "qa"
                ? "bg-zinc-900 text-accent-3 border border-accent-3/30"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <MessageSquare className="h-4 w-4" />
            Audience Q&A
            {visibleQuestions.length > 0 && (
              <span className="bg-zinc-800 text-zinc-300 text-[10px] px-1.5 py-0.2 font-mono">
                {visibleQuestions.length}
              </span>
            )}
          </button>
        </div>

        {/* Tab Contents */}
        <div className="space-y-4">
          <AnimatePresence mode="wait">
            {activeTab === "polls" ? (
              <motion.div
                key="polls-tab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                {!activePoll ? (
                  <div className="bg-zinc-950 border-2 border-zinc-900 p-8 text-center space-y-4 rounded-none">
                    <div className="w-16 h-16 bg-zinc-900 text-zinc-500 rounded-none flex items-center justify-center mx-auto border-2 border-zinc-800">
                      <HelpCircle className="h-8 w-8 animate-bounce text-accent-1" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-mono font-bold uppercase text-white tracking-wide text-sm">No active polls</h3>
                      <p className="text-xs text-zinc-400 max-w-xs mx-auto">
                        The presenter hasn't opened a poll yet. Hang tight! They will appear here in real time.
                      </p>
                    </div>
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-accent-1/10 text-accent-1 border border-accent-1/20 text-[11px] font-mono uppercase">
                      <span className="h-1.5 w-1.5 rounded-full bg-accent-1 animate-ping"></span>
                      Listening for live votes...
                    </div>
                  </div>
                ) : (
                  <div className="bg-zinc-950 border-2 border-zinc-900 p-5 sm:p-6 rounded-none space-y-5">
                    <div>
                      <span className="text-[10px] font-mono font-black text-accent-1 uppercase tracking-widest bg-accent-1/10 border border-accent-1/30 px-2.5 py-1">
                        Active Poll
                      </span>
                      <h2 className="text-base sm:text-lg font-bold text-white mt-4 leading-snug">
                        {activePoll.question}
                      </h2>
                    </div>

                    {!hasVotedActivePoll ? (
                      <div className="space-y-3">
                        {activePoll.options.map((option, index) => (
                          <button
                            key={index}
                            onClick={() => handleVoteSubmit(index)}
                            className="w-full text-left p-4 bg-zinc-900/40 border-2 border-zinc-850 hover:border-accent-1 hover:bg-zinc-900 active:bg-zinc-900 text-xs sm:text-sm text-zinc-200 hover:text-white transition-all duration-150 flex justify-between items-center cursor-pointer font-medium group"
                          >
                            <span>{option}</span>
                            <span className="w-5 h-5 rounded-none border-2 border-zinc-700 flex items-center justify-center shrink-0 group-hover:border-accent-1">
                              <span className="w-2.5 h-2.5 bg-transparent"></span>
                            </span>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="p-3 bg-accent-1/10 text-accent-1 text-xs font-mono uppercase tracking-wide border border-accent-1/30 text-center flex items-center justify-center gap-2">
                          <span className="animate-pulse">🎉</span> Vote submitted successfully!
                        </div>

                        <div className="space-y-3">
                          <h4 className="text-xs font-mono font-black text-zinc-500 uppercase tracking-widest">
                            Live Results ({totalActivePollVotes} {totalActivePollVotes === 1 ? "vote" : "votes"})
                          </h4>
                          
                          {activePoll.options.map((option, index) => {
                            const count = activePoll.votes[index] || 0;
                            const pct = totalActivePollVotes > 0 
                              ? Math.round((count / totalActivePollVotes) * 100) 
                              : 0;

                            return (
                              <div key={index} className="space-y-1.5">
                                <div className="flex justify-between items-center text-xs font-semibold text-zinc-300">
                                  <span className="truncate max-w-[250px]">{option}</span>
                                  <span className="font-mono text-accent-1">{pct}% ({count})</span>
                                </div>
                                <div className="h-3.5 w-full bg-zinc-900 border border-zinc-800 rounded-none overflow-hidden">
                                  <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${pct}%` }}
                                    transition={{ duration: 0.5, ease: "easeOut" }}
                                    className="h-full bg-gradient-to-r from-accent-1 to-accent-2"
                                  ></motion.div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        <p className="text-center text-[10px] font-mono uppercase text-zinc-500">
                          Waiting for the presenter to trigger the next poll.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="qa-tab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                {/* Submit Question Card */}
                <div className="bg-zinc-950 border-2 border-zinc-900 p-4 sm:p-5 rounded-none">
                  <h3 className="text-xs font-mono font-black text-white uppercase tracking-widest mb-3">
                    Ask the Presenter
                  </h3>
                  <form onSubmit={handleQuestionSubmit} className="space-y-3">
                    <div className="relative">
                      <textarea
                        value={questionText}
                        onChange={(e) => setQuestionText(e.target.value.slice(0, 150))}
                        placeholder="Type your question anonymously..."
                        className="w-full h-20 bg-zinc-900 border-2 border-zinc-850 focus:border-accent-3 focus:bg-[#121214] focus:outline-none rounded-none px-4 py-3.5 text-xs sm:text-sm font-medium transition-all resize-none text-white placeholder-zinc-650"
                        required
                      />
                      <span className="absolute bottom-2.5 right-3 text-[10px] font-mono text-zinc-500">
                        {questionText.length}/150
                      </span>
                    </div>
                    <button
                      type="submit"
                      disabled={!questionText.trim()}
                      className="w-full py-3 px-4 bg-accent-3 disabled:bg-zinc-900 text-black disabled:text-zinc-600 hover:bg-pink-300 font-mono font-black uppercase text-xs tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Send className="h-3.5 w-3.5 stroke-[3]" />
                      Submit Question
                    </button>
                  </form>
                </div>

                {/* Sort Bar */}
                <div className="flex items-center justify-between text-xs text-zinc-400 px-1 py-1">
                  <span className="font-mono font-bold uppercase tracking-wider text-white">
                    Questions ({visibleQuestions.length})
                  </span>
                  <div className="flex bg-zinc-950 p-0.5 border border-zinc-900">
                    <button
                      onClick={() => setQaSort("top")}
                      className={`px-3 py-1 text-[11px] font-mono uppercase font-bold transition-all cursor-pointer ${
                        qaSort === "top"
                          ? "bg-zinc-900 text-accent-3 border border-accent-3/20"
                          : "text-zinc-500 hover:text-zinc-300"
                      }`}
                    >
                      Top
                    </button>
                    <button
                      onClick={() => setQaSort("recent")}
                      className={`px-3 py-1 text-[11px] font-mono uppercase font-bold transition-all cursor-pointer ${
                        qaSort === "recent"
                          ? "bg-zinc-900 text-accent-3 border border-accent-3/20"
                          : "text-zinc-500 hover:text-zinc-300"
                      }`}
                    >
                      Recent
                    </button>
                  </div>
                </div>

                {/* Questions List */}
                <div className="space-y-3">
                  {sortedQuestions.length === 0 ? (
                    <div className="bg-zinc-950 border-2 border-zinc-900 p-8 text-center text-zinc-500 text-xs font-mono uppercase">
                      No questions yet. Be the first!
                    </div>
                  ) : (
                    <AnimatePresence initial={false}>
                      {sortedQuestions.map((question) => {
                        const hasUpvoted = question.upvotedBy.includes(userId);
                        return (
                          <motion.div
                            key={question.id}
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            layout
                            className={`p-4 border-2 transition-all flex items-start gap-4 bg-zinc-950 ${
                              question.isAnswered ? "border-emerald-900/60 bg-emerald-950/10" : "border-zinc-900"
                            }`}
                          >
                            <div className="flex-grow space-y-2 min-w-0">
                              {question.isAnswered && (
                                <span className="inline-flex items-center gap-1 text-[9px] font-mono font-black text-emerald-400 bg-emerald-950 border border-emerald-800 px-2 py-0.5 uppercase">
                                  ✓ Answered Live
                                </span>
                              )}
                              <p className="text-xs sm:text-sm text-zinc-100 font-medium break-words leading-relaxed">
                                {question.text}
                              </p>
                              <div className="flex items-center text-[10px] font-mono text-zinc-500 space-x-1.5">
                                <span>ANONYMOUS</span>
                                <span>•</span>
                                <span>
                                  {new Date(question.createdAt).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                              </div>
                            </div>

                            <button
                              onClick={() => onUpvoteQuestion(question.id)}
                              className={`flex flex-col items-center justify-center p-2.5 border-2 transition-all gap-1 shrink-0 w-11 cursor-pointer ${
                                hasUpvoted
                                  ? "bg-accent-1/10 border-accent-1 text-accent-1"
                                  : "bg-zinc-900 border-zinc-850 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700"
                              }`}
                            >
                              <ThumbsUp className={`h-3.5 w-3.5 ${hasUpvoted ? "fill-accent-1" : ""}`} />
                              <span className="text-[10px] font-mono font-black">{question.upvotes}</span>
                            </button>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Footer Branding */}
      <footer className="border-t border-zinc-900 bg-black text-center py-4 px-4 text-[10px] font-mono uppercase tracking-wider text-zinc-500">
        Powered by CastVote. Real-Time Voting &amp; Audience Engagement.
      </footer>
    </div>
  );
}
