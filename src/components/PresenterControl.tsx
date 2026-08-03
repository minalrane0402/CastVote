import React, { useState } from "react";
import { 
  Plus, Trash2, Play, Square, Check, Copy, 
  MessageSquare, Vote, RefreshCw, Sparkles, Monitor, EyeOff, Eye, Wand2, FileText, X
} from "lucide-react";
import { Room, Poll } from "../types";
import { generateAIPoll, summarizeAIQA } from "../lib/api";
import { motion, AnimatePresence } from "motion/react";

interface PresenterControlProps {
  room: Room;
  onCreatePoll: (question: string, options: string[]) => void;
  onActivatePoll: (pollId: string) => void;
  onClosePoll: (pollId: string) => void;
  onDeletePoll: (pollId: string) => void;
  onToggleAnswered: (questionId: string) => void;
  onToggleArchive: (questionId: string) => void;
  onDeleteQuestion: (questionId: string) => void;
  onForceRefresh: () => void;
  isSyncing: boolean;
  onOpenProjector: () => void;
}

export default function PresenterControl({
  room,
  onCreatePoll,
  onActivatePoll,
  onClosePoll,
  onDeletePoll,
  onToggleAnswered,
  onToggleArchive,
  onDeleteQuestion,
  onForceRefresh,
  isSyncing,
  onOpenProjector,
}: PresenterControlProps) {
  const [activeSubTab, setActiveSubTab] = useState<"polls" | "qa">("polls");
  const [copied, setCopied] = useState(false);
  
  // Poll creation form
  const [newQuestion, setNewQuestion] = useState("");
  const [newOptions, setNewOptions] = useState<string[]>(["", ""]);
  const [qaFilter, setQaFilter] = useState<"active" | "answered" | "archived">("active");

  // AI Modal States
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiTopicInput, setAiTopicInput] = useState("");
  const [showAiPollModal, setShowAiPollModal] = useState(false);

  const [isSummarizingAI, setIsSummarizingAI] = useState(false);
  const [aiSummaryResult, setAiSummaryResult] = useState<{ summary: string; keyPoints: string[] } | null>(null);
  const [showAiSummaryModal, setShowAiSummaryModal] = useState(false);

  const handleCopyLink = () => {
    const joinUrl = `${window.location.origin}/#/room/${room.id}`;
    navigator.clipboard.writeText(joinUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAddOption = () => {
    if (newOptions.length < 8) {
      setNewOptions([...newOptions, ""]);
    }
  };

  const handleRemoveOption = (index: number) => {
    if (newOptions.length > 2) {
      setNewOptions(newOptions.filter((_, idx) => idx !== index));
    }
  };

  const handleOptionChange = (index: number, val: string) => {
    const updated = [...newOptions];
    updated[index] = val;
    setNewOptions(updated);
  };

  const handleCreatePollSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestion.trim()) return;
    
    const filteredOptions = newOptions.map(o => o.trim()).filter(Boolean);
    if (filteredOptions.length < 2) return;

    onCreatePoll(newQuestion.trim(), filteredOptions);
    
    setNewQuestion("");
    setNewOptions(["", ""]);
  };

  const handleAIPollGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiTopicInput.trim()) return;

    setIsGeneratingAI(true);
    try {
      const generated = await generateAIPoll(aiTopicInput.trim());
      if (generated.question && Array.isArray(generated.options)) {
        setNewQuestion(generated.question);
        setNewOptions(generated.options);
        setShowAiPollModal(false);
        setAiTopicInput("");
      }
    } catch (err: any) {
      alert("AI Poll Generation: " + (err.message || "Could not generate poll choices"));
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleAISummarizeQA = async () => {
    setIsSummarizingAI(true);
    setShowAiSummaryModal(true);
    try {
      const result = await summarizeAIQA(room.id);
      setAiSummaryResult(result);
    } catch (err: any) {
      console.error(err);
      setAiSummaryResult({
        summary: "Could not generate Q&A summary.",
        keyPoints: ["Check back in a few seconds after attendees submit questions."]
      });
    } finally {
      setIsSummarizingAI(false);
    }
  };

  const getTotalVotes = (poll: Poll) => {
    return Object.values(poll.votes).reduce((sum, count) => sum + count, 0);
  };

  const filteredQuestions = room.questions.filter(q => {
    if (qaFilter === "answered") return q.isAnswered && !q.isArchived;
    if (qaFilter === "archived") return q.isArchived;
    return !q.isAnswered && !q.isArchived;
  }).sort((a, b) => b.upvotes - a.upvotes);

  const activePoll = room.polls.find(p => p.isActive);

  return (
    <div className="min-h-screen bg-[#09090B] text-slate-100 flex flex-col justify-between font-sans selection:bg-sky-500/30 selection:text-sky-200">
      {/* Header */}
      <header className="border-b border-zinc-800/80 bg-[#09090B]/90 sticky top-0 z-40 px-4 sm:px-6 lg:px-8 py-4 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-tr from-sky-400 to-indigo-500 text-black p-2 rounded-xl shadow-lg shadow-sky-500/20">
              <Vote className="h-5 w-5 text-zinc-950 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-white text-base">Presenter Dashboard</span>
                <span className="text-[10px] bg-zinc-800 text-zinc-300 font-mono font-medium px-2 py-0.5 rounded-full border border-zinc-700">
                  {room.id}
                </span>
              </div>
              <p className="text-xs text-zinc-400 font-normal truncate max-w-xs">
                Event: <span className="text-zinc-200 font-medium">{room.title}</span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleCopyLink}
              className="px-3.5 py-2 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-300 hover:text-white rounded-xl font-medium text-xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5 text-zinc-500" />}
              {copied ? "Link Copied!" : "Copy Event Link"}
            </button>

            <button
              onClick={onOpenProjector}
              className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-zinc-950 font-semibold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md shadow-sky-500/15 cursor-pointer"
            >
              <Monitor className="h-3.5 w-3.5" />
              Projector Display
            </button>

            <button
              onClick={onForceRefresh}
              className={`p-2 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-400 hover:text-white transition-colors cursor-pointer ${
                isSyncing ? "text-sky-400 border-sky-500/30" : ""
              }`}
              title="Refresh Room"
            >
              <RefreshCw className={`h-4 w-4 ${isSyncing ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Grid */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 grid grid-cols-12 gap-6 items-start">
        
        {/* Left Navigation */}
        <section className="col-span-12 md:col-span-3 space-y-4">
          <div className="glass-panel p-3.5 rounded-2xl space-y-1.5">
            <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider block px-2.5 mb-1">
              VIEWS &amp; QUEUES
            </span>
            
            <button
              onClick={() => setActiveSubTab("polls")}
              className={`w-full flex items-center justify-between p-3 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeSubTab === "polls"
                  ? "bg-zinc-800 text-sky-400 border border-sky-500/30"
                  : "text-zinc-400 hover:bg-zinc-900/60"
              }`}
            >
              <span className="flex items-center gap-2">
                <Vote className="h-4 w-4" /> Live Polls
              </span>
              <span className="bg-zinc-900 border border-zinc-800 text-zinc-300 font-mono text-[10px] px-2 py-0.5 rounded-md">
                {room.polls.length}
              </span>
            </button>

            <button
              onClick={() => setActiveSubTab("qa")}
              className={`w-full flex items-center justify-between p-3 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeSubTab === "qa"
                  ? "bg-zinc-800 text-indigo-400 border border-indigo-500/30"
                  : "text-zinc-400 hover:bg-zinc-900/60"
              }`}
            >
              <span className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" /> Audience Q&A
              </span>
              <span className="bg-zinc-900 border border-zinc-800 text-zinc-300 font-mono text-[10px] px-2 py-0.5 rounded-md">
                {room.questions.filter(q => !q.isArchived).length}
              </span>
            </button>
          </div>

          {/* AI Co-Pilot Banner */}
          <div className="glass-panel p-4 rounded-2xl space-y-3 border-indigo-500/20">
            <div className="flex items-center gap-2 text-indigo-300 text-xs font-semibold">
              <Sparkles className="h-4 w-4 text-indigo-400" />
              <span>AI Presenter Assistant</span>
            </div>
            <p className="text-zinc-400 text-xs leading-relaxed">
              Use Gemini AI to draft poll options or summarize top upvoted questions live.
            </p>
            <div className="pt-1 flex flex-col gap-2">
              <button
                onClick={() => setShowAiPollModal(true)}
                className="w-full py-2 px-3 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <Wand2 className="h-3.5 w-3.5" /> ✨ Draft Poll with AI
              </button>
              <button
                onClick={handleAISummarizeQA}
                className="w-full py-2 px-3 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-semibold text-xs rounded-xl border border-zinc-800 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <FileText className="h-3.5 w-3.5 text-sky-400" /> ✨ Summarize Q&A
              </button>
            </div>
          </div>
        </section>

        {/* Right Workspace Panel */}
        <section className="col-span-12 md:col-span-9 glass-panel p-6 rounded-2xl min-h-[480px]">
          <AnimatePresence mode="wait">
            {activeSubTab === "polls" ? (
              <motion.div
                key="tab-polls"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.15 }}
                className="grid grid-cols-1 lg:grid-cols-12 gap-6"
              >
                {/* Create Poll Form */}
                <div className="lg:col-span-5 space-y-4">
                  <div className="border-b border-zinc-800 pb-3 flex justify-between items-center">
                    <div>
                      <h3 className="font-semibold text-white text-sm">Create New Poll</h3>
                      <p className="text-[11px] text-zinc-400">Add choices for audience voting.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowAiPollModal(true)}
                      className="p-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-lg text-[11px] font-medium transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <Wand2 className="h-3 w-3" /> Draft AI
                    </button>
                  </div>

                  <form onSubmit={handleCreatePollSubmit} className="space-y-3.5">
                    <div>
                      <label className="text-[11px] font-semibold text-zinc-400 block mb-1">
                        Question Prompt
                      </label>
                      <input
                        type="text"
                        required
                        value={newQuestion}
                        onChange={(e) => setNewQuestion(e.target.value)}
                        placeholder="e.g. Which topic shall we discuss first?"
                        className="w-full bg-zinc-950/80 border border-zinc-800 focus:border-sky-500 focus:outline-none rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-600"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[11px] font-semibold text-zinc-400 block">
                        Options
                      </label>
                      
                      {newOptions.map((option, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <span className="text-xs font-mono text-zinc-500 w-3 shrink-0">
                            {idx + 1}.
                          </span>
                          <input
                            type="text"
                            required
                            value={option}
                            onChange={(e) => handleOptionChange(idx, e.target.value)}
                            placeholder={`Option ${idx + 1}`}
                            className="flex-grow bg-zinc-950/80 border border-zinc-800 focus:border-sky-500 focus:outline-none rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-600"
                          />
                          {newOptions.length > 2 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveOption(idx)}
                              className="text-zinc-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-zinc-900 transition-colors cursor-pointer"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      ))}

                      {newOptions.length < 8 && (
                        <button
                          type="button"
                          onClick={handleAddOption}
                          className="text-sky-400 hover:text-sky-300 text-xs font-medium flex items-center gap-1 mt-1.5 px-1 py-1 cursor-pointer"
                        >
                          <Plus className="h-3.5 w-3.5" /> Add Choice
                        </button>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={!newQuestion.trim() || newOptions.filter(Boolean).length < 2}
                      className="w-full py-2.5 px-4 bg-sky-500 hover:bg-sky-400 disabled:bg-zinc-800 text-zinc-950 disabled:text-zinc-500 font-semibold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-sky-500/10"
                    >
                      <Plus className="h-4 w-4" /> Create Poll
                    </button>
                  </form>
                </div>

                {/* Poll List & Active Monitor */}
                <div className="lg:col-span-7 space-y-4">
                  <div className="border-b border-zinc-800 pb-3 flex justify-between items-center">
                    <div>
                      <h3 className="font-semibold text-white text-sm">Session Polls</h3>
                      <p className="text-[11px] text-zinc-400">Manage and broadcast voting rounds.</p>
                    </div>
                    {activePoll && (
                      <span className="bg-emerald-500/10 text-emerald-400 font-semibold px-2.5 py-0.5 rounded-full border border-emerald-500/20 text-[10px] flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span> 1 Poll Active
                      </span>
                    )}
                  </div>

                  {room.polls.length === 0 ? (
                    <div className="border border-dashed border-zinc-800 p-12 text-center text-zinc-500 text-xs rounded-2xl">
                      No polls added yet. Use the form on the left or click "Draft AI" to start.
                    </div>
                  ) : (
                    <div className="space-y-3.5">
                      {room.polls.map((poll) => {
                        const totalVotes = getTotalVotes(poll);
                        return (
                          <div
                            key={poll.id}
                            className={`p-4 rounded-xl border space-y-3 transition-all glass-panel ${
                              poll.isActive ? "border-sky-500/50" : "border-zinc-800/80"
                            }`}
                          >
                            <div className="flex justify-between items-start gap-4">
                              <div className="space-y-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-semibold text-xs sm:text-sm text-white truncate">
                                    {poll.question}
                                  </h4>
                                  {poll.isActive ? (
                                    <span className="bg-sky-500/10 text-sky-400 text-[9px] font-semibold px-2 py-0.5 rounded-md border border-sky-500/20">
                                      Active
                                    </span>
                                  ) : poll.isClosed ? (
                                    <span className="bg-zinc-800 text-zinc-400 text-[9px] font-semibold px-2 py-0.5 rounded-md">
                                      Closed
                                    </span>
                                  ) : null}
                                </div>
                                <p className="text-[10px] text-zinc-400 font-mono">
                                  {totalVotes} {totalVotes === 1 ? "response" : "responses"}
                                </p>
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0">
                                {!poll.isActive && !poll.isClosed && (
                                  <button
                                    onClick={() => onActivatePoll(poll.id)}
                                    className="px-2.5 py-1 bg-sky-500/10 text-sky-400 hover:bg-sky-500 hover:text-zinc-950 border border-sky-500/30 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer"
                                  >
                                    <Play className="h-3 w-3 fill-current" /> Launch
                                  </button>
                                )}
                                {poll.isActive && (
                                  <button
                                    onClick={() => onClosePoll(poll.id)}
                                    className="px-2.5 py-1 bg-rose-500/10 text-rose-300 hover:bg-rose-500 hover:text-zinc-950 border border-rose-500/30 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer"
                                  >
                                    <Square className="h-3 w-3 fill-current" /> Close
                                  </button>
                                )}
                                {poll.isClosed && (
                                  <button
                                    onClick={() => onActivatePoll(poll.id)}
                                    className="px-2.5 py-1 bg-zinc-800 text-zinc-300 hover:bg-zinc-700 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer"
                                  >
                                    <RefreshCw className="h-3 w-3" /> Re-open
                                  </button>
                                )}
                                <button
                                  onClick={() => onDeletePoll(poll.id)}
                                  className="p-1 text-zinc-500 hover:text-rose-400 rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer"
                                  title="Delete Poll"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>

                            {/* Option Bars */}
                            <div className="space-y-2 pt-2 border-t border-zinc-800/80">
                              {poll.options.map((option, index) => {
                                const votes = poll.votes[index] || 0;
                                const percentage = totalVotes > 0 
                                  ? Math.round((votes / totalVotes) * 100) 
                                  : 0;

                                return (
                                  <div key={index} className="space-y-1 text-xs">
                                    <div className="flex justify-between font-medium text-zinc-300">
                                      <span className="truncate pr-2">{option}</span>
                                      <span className="font-mono text-zinc-400 text-[11px]">
                                        {percentage}% ({votes})
                                      </span>
                                    </div>
                                    <div className="h-2 w-full bg-zinc-900 border border-zinc-800 rounded-md overflow-hidden relative">
                                      <div
                                        style={{ width: `${percentage}%` }}
                                        className={`h-full transition-all duration-300 ${
                                          poll.isActive ? "bg-sky-400" : "bg-zinc-600"
                                        }`}
                                      ></div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </motion.div>
            ) : (
              /* Q&A Moderation Queue */
              <motion.div
                key="tab-qa"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.15 }}
                className="space-y-4"
              >
                <div className="border-b border-zinc-800 pb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-white text-sm">Audience Q&A Queue</h3>
                    <p className="text-[11px] text-zinc-400">Moderate and tag incoming attendee questions.</p>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <button
                      onClick={handleAISummarizeQA}
                      className="px-3 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-xl font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Sparkles className="h-3.5 w-3.5" /> AI Summary
                    </button>

                    <div className="flex bg-zinc-900 p-0.5 rounded-lg border border-zinc-800 text-xs">
                      <button
                        onClick={() => setQaFilter("active")}
                        className={`px-3 py-1 rounded-md font-medium transition-all cursor-pointer ${
                          qaFilter === "active"
                            ? "bg-zinc-800 text-indigo-400"
                            : "text-zinc-400 hover:text-zinc-200"
                        }`}
                      >
                        Unanswered ({room.questions.filter(q => !q.isAnswered && !q.isArchived).length})
                      </button>
                      <button
                        onClick={() => setQaFilter("answered")}
                        className={`px-3 py-1 rounded-md font-medium transition-all cursor-pointer ${
                          qaFilter === "answered"
                            ? "bg-zinc-800 text-indigo-400"
                            : "text-zinc-400 hover:text-zinc-200"
                        }`}
                      >
                        Answered ({room.questions.filter(q => q.isAnswered && !q.isArchived).length})
                      </button>
                      <button
                        onClick={() => setQaFilter("archived")}
                        className={`px-3 py-1 rounded-md font-medium transition-all cursor-pointer ${
                          qaFilter === "archived"
                            ? "bg-zinc-800 text-indigo-400"
                            : "text-zinc-400 hover:text-zinc-200"
                        }`}
                      >
                        Archived ({room.questions.filter(q => q.isArchived).length})
                      </button>
                    </div>
                  </div>
                </div>

                {filteredQuestions.length === 0 ? (
                  <div className="border border-dashed border-zinc-800 p-16 text-center text-zinc-500 text-xs rounded-2xl">
                    No questions in this filter tab.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    <AnimatePresence initial={false}>
                      {filteredQuestions.map((q) => (
                        <motion.div
                          key={q.id}
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.98 }}
                          layout
                          className={`p-4 rounded-xl border flex items-start justify-between gap-4 glass-panel ${
                            q.isAnswered 
                              ? "border-emerald-500/30 bg-emerald-500/5" 
                              : q.isArchived 
                                ? "border-zinc-800 opacity-60" 
                                : "border-zinc-800/80"
                          }`}
                        >
                          <div className="space-y-1.5 min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              {q.isAnswered && (
                                <span className="text-[9px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded-md">
                                  ✓ Answered
                                </span>
                              )}
                              <span className="text-[10px] font-mono text-zinc-400">
                                ▲ {q.upvotes} {q.upvotes === 1 ? "upvote" : "upvotes"}
                              </span>
                            </div>
                            <p className="text-xs sm:text-sm text-zinc-100 font-medium break-words leading-relaxed">
                              "{q.text}"
                            </p>
                            <span className="text-[10px] text-zinc-500 font-mono block">
                              Asked at {new Date(q.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              onClick={() => onToggleAnswered(q.id)}
                              className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                                q.isAnswered
                                  ? "bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-white"
                                  : "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20"
                              }`}
                              title={q.isAnswered ? "Mark unanswered" : "Mark answered live"}
                            >
                              <Check className="h-4 w-4" />
                            </button>

                            <button
                              onClick={() => onToggleArchive(q.id)}
                              className="p-1.5 rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                              title={q.isArchived ? "Unarchive question" : "Archive question"}
                            >
                              {q.isArchived ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                            </button>

                            <button
                              onClick={() => onDeleteQuestion(q.id)}
                              className="p-1.5 rounded-lg border border-transparent hover:border-rose-500/30 hover:bg-rose-500/10 text-zinc-500 hover:text-rose-400 transition-colors cursor-pointer"
                              title="Delete question"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      </main>

      {/* AI Poll Generator Modal */}
      {showAiPollModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-panel border-indigo-500/30 p-6 w-full max-w-md space-y-4 rounded-2xl shadow-2xl relative"
          >
            <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
              <h3 className="font-semibold text-indigo-300 text-sm flex items-center gap-2">
                <Wand2 className="h-4 w-4 text-indigo-400" /> Gemini AI Poll Draft
              </h3>
              <button
                onClick={() => setShowAiPollModal(false)}
                className="text-zinc-500 hover:text-white p-1 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed">
              Enter your talk topic, and Gemini AI will compose a question with 4 choices.
            </p>

            <form onSubmit={handleAIPollGenerate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Presentation Topic
                </label>
                <input
                  type="text"
                  required
                  value={aiTopicInput}
                  onChange={(e) => setAiTopicInput(e.target.value)}
                  placeholder="e.g. Microservices, AI Ethics, Design Systems"
                  className="w-full bg-zinc-950/80 border border-zinc-800 focus:border-indigo-500 focus:outline-none rounded-xl p-3 text-xs text-white"
                  autoFocus
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAiPollModal(false)}
                  className="px-3.5 py-2 text-xs font-medium text-zinc-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isGeneratingAI || !aiTopicInput.trim()}
                  className="px-4 py-2 bg-indigo-500 hover:bg-indigo-400 text-white font-semibold text-xs rounded-xl flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isGeneratingAI ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Drafting...
                    </>
                  ) : (
                    <>
                      <Wand2 className="h-3.5 w-3.5" /> Draft Poll
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* AI Q&A Insights Modal */}
      {showAiSummaryModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-panel border-sky-500/30 p-6 w-full max-w-lg space-y-5 rounded-2xl shadow-2xl relative"
          >
            <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
              <h3 className="font-semibold text-sky-300 text-sm flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-sky-400" /> AI Q&A Insights
              </h3>
              <button
                onClick={() => setShowAiSummaryModal(false)}
                className="text-zinc-500 hover:text-white p-1 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {isSummarizingAI ? (
              <div className="py-12 text-center space-y-3">
                <RefreshCw className="h-8 w-8 text-sky-400 animate-spin mx-auto" />
                <p className="text-xs text-zinc-400">Gemini AI is analyzing audience questions...</p>
              </div>
            ) : aiSummaryResult ? (
              <div className="space-y-4">
                <div className="p-3.5 bg-sky-500/10 border border-sky-500/20 rounded-xl text-xs text-zinc-200 leading-relaxed">
                  <span className="font-semibold text-sky-300 block mb-1">Executive Summary</span>
                  {aiSummaryResult.summary}
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-white">
                    Key Presenter Talking Points
                  </h4>
                  <div className="space-y-2">
                    {aiSummaryResult.keyPoints.map((point, idx) => (
                      <div key={idx} className="p-3 bg-zinc-900/60 border border-zinc-800 rounded-xl text-xs text-zinc-300 flex items-start gap-2.5">
                        <span className="bg-sky-500/20 text-sky-300 font-mono text-[10px] px-1.5 py-0.5 rounded-md shrink-0">
                          {idx + 1}
                        </span>
                        <p className="leading-relaxed">{point}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowAiSummaryModal(false)}
                className="px-4 py-2 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-xs font-medium rounded-xl text-white cursor-pointer"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-zinc-900 bg-[#09090B] py-3 text-center text-[10px] text-zinc-500">
        CastVote Presenter Workspace
      </footer>
    </div>
  );
}
