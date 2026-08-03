import React, { useState } from "react";
import { Vote, MessageSquare, Send, ThumbsUp, HelpCircle, RefreshCw, ArrowLeft, CheckCircle2 } from "lucide-react";
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
  const activePoll = room.polls.find(p => p.isActive);

  const hasVotedActivePoll = activePoll 
    ? activePoll.votedUsers.includes(userId) || votedLocalPolls.includes(activePoll.id)
    : false;

  const handleVoteSubmit = (optionIndex: number) => {
    if (!activePoll) return;
    onVote(activePoll.id, optionIndex);
    setVotedLocalPolls(prev => [...prev, activePoll.id]);

    try {
      confetti({
        particleCount: 45,
        spread: 60,
        origin: { y: 0.75 },
        colors: ["#38BDF8", "#818CF8", "#F472B6"]
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

  const visibleQuestions = room.questions.filter(q => !q.isArchived);

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

  const getTotalVotes = (poll: Poll) => {
    return Object.values(poll.votes).reduce((sum, count) => sum + count, 0);
  };

  const totalActivePollVotes = activePoll ? getTotalVotes(activePoll) : 0;

  return (
    <div className="min-h-screen bg-[#09090B] text-slate-100 flex flex-col justify-between font-sans selection:bg-sky-500/30 selection:text-sky-200">
      {/* Mobile-optimized Header */}
      <header className="sticky top-0 bg-[#09090B]/90 border-b border-zinc-800/80 z-40 backdrop-blur-xl px-4 py-3.5">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button 
              onClick={onLeave}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800/60 transition-colors cursor-pointer"
              title="Leave Room"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <h1 className="font-semibold text-white text-sm truncate max-w-[150px] sm:max-w-[200px]" title={room.title}>
                {room.title}
              </h1>
              <p className="text-[10px] text-sky-400 font-mono font-medium tracking-wide">
                CODE: {room.id}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onForceRefresh}
              className={`p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer ${
                isSyncing ? "animate-spin text-sky-400 border-sky-500/30" : ""
              }`}
              title="Refresh Room Data"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow max-w-md w-full mx-auto px-4 py-5 overflow-y-auto">
        {/* Tab Selector */}
        <div className="flex bg-zinc-900/90 p-1 rounded-xl mb-5 border border-zinc-800">
          <button
            onClick={() => setActiveTab("polls")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              activeTab === "polls"
                ? "bg-zinc-800 text-sky-400 shadow-sm"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Vote className="h-4 w-4" />
            Live Polls
            {activePoll && !hasVotedActivePoll && (
              <span className="h-2 w-2 rounded-full bg-sky-400 animate-pulse"></span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("qa")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              activeTab === "qa"
                ? "bg-zinc-800 text-indigo-400 shadow-sm"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <MessageSquare className="h-4 w-4" />
            Audience Q&A
            {visibleQuestions.length > 0 && (
              <span className="bg-zinc-700/60 text-zinc-300 text-[10px] px-1.5 py-0.5 rounded-md font-mono">
                {visibleQuestions.length}
              </span>
            )}
          </button>
        </div>

        {/* Tab View */}
        <AnimatePresence mode="wait">
          {activeTab === "polls" ? (
            <motion.div
              key="polls-tab"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              {!activePoll ? (
                <div className="glass-panel p-8 text-center space-y-3.5 rounded-2xl">
                  <div className="w-12 h-12 bg-zinc-900 text-zinc-400 rounded-2xl flex items-center justify-center mx-auto border border-zinc-800">
                    <HelpCircle className="h-6 w-6 text-sky-400 animate-bounce" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-semibold text-white text-sm">No active poll right now</h3>
                    <p className="text-xs text-zinc-400 leading-relaxed max-w-xs mx-auto">
                      The presenter will launch a poll shortly. Stay tuned!
                    </p>
                  </div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-sky-500/10 text-sky-400 border border-sky-500/20 text-[11px] rounded-full font-medium">
                    <span className="h-1.5 w-1.5 rounded-full bg-sky-400 animate-pulse"></span>
                    Listening for stage updates...
                  </div>
                </div>
              ) : (
                <div className="glass-panel p-5 sm:p-6 rounded-2xl space-y-5">
                  <div>
                    <span className="text-[10px] font-medium text-sky-400 uppercase tracking-wider bg-sky-500/10 border border-sky-500/20 px-2.5 py-1 rounded-full">
                      Active Live Poll
                    </span>
                    <h2 className="text-base sm:text-lg font-bold text-white mt-3 leading-snug">
                      {activePoll.question}
                    </h2>
                  </div>

                  {!hasVotedActivePoll ? (
                    <div className="space-y-2.5">
                      {activePoll.options.map((option, index) => (
                        <button
                          key={index}
                          onClick={() => handleVoteSubmit(index)}
                          className="w-full text-left p-3.5 bg-zinc-900/60 border border-zinc-800 hover:border-sky-500/60 hover:bg-zinc-850 active:bg-zinc-800 rounded-xl text-xs sm:text-sm text-zinc-200 hover:text-white transition-all flex justify-between items-center cursor-pointer font-medium group"
                        >
                          <span>{option}</span>
                          <div className="w-5 h-5 rounded-full border border-zinc-700 group-hover:border-sky-400 flex items-center justify-center shrink-0 transition-colors">
                            <div className="w-2 h-2 rounded-full bg-transparent group-hover:bg-sky-400 transition-colors"></div>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="p-3 bg-emerald-500/10 text-emerald-300 text-xs font-medium border border-emerald-500/20 rounded-xl flex items-center justify-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                        <span>Vote submitted successfully!</span>
                      </div>

                      <div className="space-y-3 pt-1">
                        <div className="flex justify-between items-center text-xs font-semibold text-zinc-400">
                          <span>Live Results</span>
                          <span className="font-mono text-[11px]">{totalActivePollVotes} {totalActivePollVotes === 1 ? "vote" : "votes"}</span>
                        </div>
                        
                        {activePoll.options.map((option, index) => {
                          const count = activePoll.votes[index] || 0;
                          const pct = totalActivePollVotes > 0 
                            ? Math.round((count / totalActivePollVotes) * 100) 
                            : 0;

                          return (
                            <div key={index} className="space-y-1.5">
                              <div className="flex justify-between items-center text-xs text-zinc-300">
                                <span className="truncate max-w-[240px]">{option}</span>
                                <span className="font-mono text-sky-400 font-semibold">{pct}%</span>
                              </div>
                              <div className="h-3 w-full bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${pct}%` }}
                                  transition={{ duration: 0.5, ease: "easeOut" }}
                                  className="h-full bg-gradient-to-r from-sky-400 to-indigo-500 rounded-lg"
                                ></motion.div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="qa-tab"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              {/* Submit Question */}
              <div className="glass-panel p-4 sm:p-5 rounded-2xl space-y-3">
                <h3 className="text-xs font-semibold text-white">
                  Ask the Presenter Anonymously
                </h3>
                <form onSubmit={handleQuestionSubmit} className="space-y-3">
                  <div className="relative">
                    <textarea
                      value={questionText}
                      onChange={(e) => setQuestionText(e.target.value.slice(0, 160))}
                      placeholder="Type your question..."
                      className="w-full h-20 bg-zinc-950/80 border border-zinc-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 focus:outline-none rounded-xl p-3 text-xs sm:text-sm font-normal transition-all resize-none text-white placeholder-zinc-600"
                      required
                    />
                    <span className="absolute bottom-2.5 right-3 text-[10px] font-mono text-zinc-500">
                      {questionText.length}/160
                    </span>
                  </div>
                  <button
                    type="submit"
                    disabled={!questionText.trim()}
                    className="w-full py-2.5 px-4 bg-indigo-500 disabled:bg-zinc-800 text-white disabled:text-zinc-500 hover:bg-indigo-400 font-semibold text-xs rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-indigo-500/10"
                  >
                    <Send className="h-3.5 w-3.5" />
                    Submit Question
                  </button>
                </form>
              </div>

              {/* Sort Bar */}
              <div className="flex items-center justify-between text-xs text-zinc-400 px-1 py-1">
                <span className="font-semibold text-white">
                  Questions ({visibleQuestions.length})
                </span>
                <div className="flex bg-zinc-900 p-0.5 rounded-lg border border-zinc-800">
                  <button
                    onClick={() => setQaSort("top")}
                    className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-all cursor-pointer ${
                      qaSort === "top"
                        ? "bg-zinc-800 text-indigo-400"
                        : "text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    Top
                  </button>
                  <button
                    onClick={() => setQaSort("recent")}
                    className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-all cursor-pointer ${
                      qaSort === "recent"
                        ? "bg-zinc-800 text-indigo-400"
                        : "text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    Recent
                  </button>
                </div>
              </div>

              {/* Question Queue */}
              <div className="space-y-2.5">
                {sortedQuestions.length === 0 ? (
                  <div className="glass-panel p-8 text-center text-zinc-500 text-xs rounded-2xl">
                    No questions yet. Be the first to ask!
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
                          exit={{ opacity: 0, scale: 0.96 }}
                          layout
                          className={`p-4 rounded-xl border transition-all flex items-start gap-3.5 glass-panel ${
                            question.isAnswered ? "border-emerald-500/30 bg-emerald-500/5" : "border-zinc-800/80"
                          }`}
                        >
                          <div className="flex-grow space-y-1.5 min-w-0">
                            {question.isAnswered && (
                              <span className="inline-flex items-center gap-1 text-[9px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md">
                                ✓ Answered on Stage
                              </span>
                            )}
                            <p className="text-xs sm:text-sm text-zinc-100 font-medium break-words leading-relaxed">
                              {question.text}
                            </p>
                            <span className="text-[10px] text-zinc-500 block font-mono">
                              {new Date(question.createdAt).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>

                          <button
                            onClick={() => onUpvoteQuestion(question.id)}
                            className={`flex flex-col items-center justify-center p-2.5 rounded-xl border transition-all gap-1 shrink-0 w-11 cursor-pointer ${
                              hasUpvoted
                                ? "bg-sky-500/10 border-sky-500/40 text-sky-400"
                                : "bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700"
                            }`}
                          >
                            <ThumbsUp className={`h-3.5 w-3.5 ${hasUpvoted ? "fill-sky-400" : ""}`} />
                            <span className="text-[10px] font-mono font-bold">{question.upvotes}</span>
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
      </main>

      <footer className="border-t border-zinc-900 bg-[#09090B] text-center py-3 px-4 text-[10px] text-zinc-500">
        CastVote Audience View • Zero login required
      </footer>
    </div>
  );
}
