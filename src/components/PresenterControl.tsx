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
  
  // Create Poll State
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

  // AI Poll Generator Trigger
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
      alert("AI Poll Generation failed: " + (err.message || "Unknown error"));
    } finally {
      setIsGeneratingAI(false);
    }
  };

  // AI Q&A Summary Trigger
  const handleAISummarizeQA = async () => {
    setIsSummarizingAI(true);
    setShowAiSummaryModal(true);
    try {
      const result = await summarizeAIQA(room.id);
      setAiSummaryResult(result);
    } catch (err: any) {
      console.error(err);
      setAiSummaryResult({
        summary: "Could not summarize Q&A at this moment.",
        keyPoints: ["Please try again in a few seconds."]
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
    <div className="min-h-screen bg-[#09090B] text-white flex flex-col justify-between font-sans selection:bg-accent-1 selection:text-black">
      {/* Dashboard Header */}
      <header className="border-b-2 border-zinc-900 bg-[#09090B] sticky top-0 z-40 px-4 sm:px-6 lg:px-8 py-5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          
          {/* Logo & Title */}
          <div className="flex items-center space-x-3">
            <div className="bg-white text-black p-2.5 rounded-none border-2 border-white flex items-center justify-center">
              <Vote className="h-5 w-5 text-black" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-black text-lg text-white uppercase tracking-tight">CASTVOTE PRESENTER</span>
                <span className="text-[10px] bg-zinc-900 text-zinc-300 font-mono font-bold uppercase px-2 py-0.5 rounded-none border border-zinc-800">
                  CTRL PANEL
                </span>
              </div>
              <p className="text-xs font-mono uppercase text-zinc-400">
                EVENT: <span className="text-white font-bold">{room.title}</span>
              </p>
            </div>
          </div>

          {/* Quick Stats / Codes & Shares */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-zinc-950 border-2 border-zinc-900 px-3.5 py-1.5 text-center">
              <span className="block text-[8px] uppercase font-mono font-black tracking-widest text-zinc-500">Room Code</span>
              <span className="font-mono text-sm font-black text-accent-1 tracking-wider uppercase">{room.id}</span>
            </div>

            <button
              onClick={handleCopyLink}
              className="px-4 py-2.5 bg-zinc-900 border-2 border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white font-mono font-black uppercase text-xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5 text-zinc-500" />}
              {copied ? "COPIED!" : "COPY EVENT LINK"}
            </button>

            <button
              onClick={onOpenProjector}
              className="px-4 py-2.5 bg-accent-1 hover:bg-cyan-300 text-black font-mono font-black uppercase text-xs flex items-center gap-1.5 transition-all border-2 border-white cursor-pointer"
            >
              <Monitor className="h-3.5 w-3.5 stroke-[2.5]" />
              PROJECTOR VIEW
            </button>

            <button
              onClick={onForceRefresh}
              className={`p-2.5 bg-zinc-900 border-2 border-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer ${
                isSyncing ? "text-accent-1 border-accent-1/30" : ""
              }`}
              title="Force sync data"
            >
              <RefreshCw className={`h-4 w-4 ${isSyncing ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Grid */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-12 gap-8 items-start">
        
        {/* Left Hand: Tab Selection & Quick Status (Col 1-3) */}
        <section className="col-span-12 md:col-span-3 space-y-4">
          <div className="bg-zinc-950 border-2 border-zinc-900 p-4 space-y-2 rounded-none">
            <h3 className="text-[10px] font-mono font-black text-zinc-500 uppercase tracking-widest mb-3 px-1">
              PRESENTER TABS
            </h3>
            
            <button
              onClick={() => setActiveSubTab("polls")}
              className={`w-full flex items-center justify-between p-3.5 rounded-none text-xs font-mono font-black uppercase tracking-wider transition-all cursor-pointer ${
                activeSubTab === "polls"
                  ? "bg-zinc-900 text-accent-1 border border-accent-1/30"
                  : "text-zinc-400 hover:bg-zinc-900/60 border border-transparent"
              }`}
            >
              <span className="flex items-center gap-2">
                <Vote className="h-4 w-4" /> Polls
              </span>
              <span className="bg-zinc-950 border border-zinc-850 text-zinc-300 font-mono font-bold px-2 py-0.5 text-[10px]">
                {room.polls.length}
              </span>
            </button>

            <button
              onClick={() => setActiveSubTab("qa")}
              className={`w-full flex items-center justify-between p-3.5 rounded-none text-xs font-mono font-black uppercase tracking-wider transition-all cursor-pointer ${
                activeSubTab === "qa"
                  ? "bg-zinc-900 text-accent-3 border border-accent-3/30"
                  : "text-zinc-400 hover:bg-zinc-900/60 border border-transparent"
              }`}
            >
              <span className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" /> Guest Q&A
              </span>
              <span className="bg-zinc-950 border border-zinc-850 text-zinc-300 font-mono font-bold px-2 py-0.5 text-[10px]">
                {room.questions.filter(q => !q.isArchived).length}
              </span>
            </button>
          </div>

          {/* AI Helper Banner */}
          <div className="bg-gradient-to-br from-indigo-950/40 to-zinc-950 border-2 border-indigo-800/60 p-4 space-y-3 rounded-none">
            <h4 className="font-mono font-black uppercase tracking-wider text-accent-1 flex items-center gap-1.5 text-xs">
              <Sparkles className="h-4 w-4 text-accent-1 animate-pulse" /> Gemini AI Co-Pilot
            </h4>
            <p className="text-zinc-300 text-xs leading-relaxed">
              Use Gemini AI to instantly write custom multi-choice polls or synthesize top audience Q&A questions live on stage.
            </p>
            <div className="pt-1 flex flex-col gap-2">
              <button
                onClick={() => setShowAiPollModal(true)}
                className="w-full py-2 px-3 bg-accent-1 hover:bg-cyan-300 text-black font-mono font-bold uppercase text-[11px] flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <Wand2 className="h-3.5 w-3.5 stroke-[2.5]" /> Auto-Generate Poll
              </button>
              <button
                onClick={handleAISummarizeQA}
                className="w-full py-2 px-3 bg-zinc-900 hover:bg-zinc-800 text-accent-3 border border-accent-3/40 font-mono font-bold uppercase text-[11px] flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <FileText className="h-3.5 w-3.5" /> Summarize Q&A Insights
              </button>
            </div>
          </div>
        </section>

        {/* Right Hand: Interactive Workspaces (Col 4-12) */}
        <section className="col-span-12 md:col-span-9 bg-zinc-950 border-2 border-zinc-900 p-6 shadow-sm min-h-[500px] rounded-none">
          <AnimatePresence mode="wait">
            {activeSubTab === "polls" ? (
              <motion.div
                key="tab-polls"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.15 }}
                className="grid grid-cols-1 lg:grid-cols-12 gap-8"
              >
                {/* Create Poll Box (Lg: Col 1-5) */}
                <div className="lg:col-span-5 space-y-5">
                  <div className="border-b border-zinc-900 pb-3 flex justify-between items-center">
                    <div>
                      <h3 className="font-mono font-black uppercase tracking-wider text-white text-sm">Create a New Poll</h3>
                      <p className="text-[11px] text-zinc-400">Add options for multi-choice response.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowAiPollModal(true)}
                      className="p-1.5 bg-accent-1/10 hover:bg-accent-1 text-accent-1 hover:text-black border border-accent-1/30 text-[10px] font-mono font-black uppercase transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <Wand2 className="h-3 w-3" /> AI Fill
                    </button>
                  </div>

                  <form onSubmit={handleCreatePollSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono font-black text-zinc-500 uppercase tracking-widest block">
                        Question Text
                      </label>
                      <input
                        type="text"
                        required
                        value={newQuestion}
                        onChange={(e) => setNewQuestion(e.target.value)}
                        placeholder="e.g. Which project should we prioritize next?"
                        className="w-full bg-zinc-900 border-2 border-zinc-850 focus:border-accent-1 focus:bg-[#121214] focus:outline-none rounded-none px-3.5 py-2.5 text-xs font-semibold transition-all text-white placeholder-zinc-600"
                      />
                    </div>

                    <div className="space-y-3">
                      <label className="text-[10px] font-mono font-black text-zinc-500 uppercase tracking-widest block">
                        Answer Options
                      </label>
                      
                      {newOptions.map((option, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <span className="text-xs font-mono text-zinc-500 font-bold shrink-0 w-4">
                            {idx + 1}.
                          </span>
                          <input
                            type="text"
                            required
                            value={option}
                            onChange={(e) => handleOptionChange(idx, e.target.value)}
                            placeholder={`Option ${idx + 1}`}
                            className="flex-grow bg-zinc-900 border-2 border-zinc-850 focus:border-accent-1 focus:bg-[#121214] focus:outline-none rounded-none px-3 py-2 text-xs font-medium transition-all text-white placeholder-zinc-650"
                          />
                          {newOptions.length > 2 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveOption(idx)}
                              className="text-zinc-500 hover:text-rose-400 p-1.5 rounded-none hover:bg-zinc-900 transition-colors cursor-pointer"
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
                          className="text-accent-1 hover:text-cyan-300 text-xs font-mono font-black uppercase tracking-wider flex items-center gap-1 mt-2 px-1 py-1 transition-colors cursor-pointer"
                        >
                          <Plus className="h-3.5 w-3.5 stroke-[3]" /> Add Option
                        </button>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={!newQuestion.trim() || newOptions.filter(Boolean).length < 2}
                      className="w-full py-3.5 px-4 bg-accent-1 hover:bg-cyan-300 disabled:bg-zinc-900 text-black disabled:text-zinc-600 font-mono font-black uppercase text-xs tracking-wider border-2 border-white disabled:border-transparent transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="h-4 w-4 stroke-[3]" /> Create Poll
                    </button>
                  </form>
                </div>

                {/* Polls list & visualizer (Lg: Col 6-12) */}
                <div className="lg:col-span-7 space-y-5">
                  <div className="border-b border-zinc-900 pb-3 flex justify-between items-center">
                    <div>
                      <h3 className="font-mono font-black uppercase tracking-wider text-white text-sm">Session Polls</h3>
                      <p className="text-[11px] text-zinc-400">Currently configured voting panels.</p>
                    </div>
                    {activePoll && (
                      <span className="bg-accent-1/10 text-accent-1 font-mono font-black px-2.5 py-1 border border-accent-1/20 text-[10px] uppercase tracking-wider animate-pulse flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-accent-1"></span> 1 Poll Active
                      </span>
                    )}
                  </div>

                  {room.polls.length === 0 ? (
                    <div className="border-2 border-dashed border-zinc-800 p-12 text-center text-zinc-500 text-xs font-mono uppercase rounded-none">
                      No polls created yet. Fill out the form or click "AI Fill" to start collecting feedback!
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {room.polls.map((poll) => {
                        const totalVotes = getTotalVotes(poll);
                        return (
                          <div
                            key={poll.id}
                            className={`p-4 border-2 space-y-3 transition-all bg-zinc-950/40 rounded-none relative overflow-hidden ${
                              poll.isActive 
                                ? "border-accent-1" 
                                : "border-zinc-900"
                            }`}
                          >
                            <div className="flex justify-between items-start gap-4">
                              <div className="space-y-1.5 min-w-0">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-bold text-xs sm:text-sm text-white truncate leading-snug uppercase">
                                    {poll.question}
                                  </h4>
                                  {poll.isActive ? (
                                    <span className="bg-accent-1/10 text-accent-1 font-mono font-black text-[9px] uppercase px-2 py-0.5 border border-accent-1/25 shrink-0">
                                      Active
                                    </span>
                                  ) : poll.isClosed ? (
                                    <span className="bg-zinc-900 text-zinc-400 font-mono font-black text-[9px] uppercase px-2 py-0.5 border border-zinc-800 shrink-0">
                                      Closed
                                    </span>
                                  ) : (
                                    <span className="bg-zinc-900 text-zinc-500 font-mono font-black text-[9px] uppercase px-2 py-0.5 border border-zinc-800/80 shrink-0">
                                      Draft
                                    </span>
                                  )}
                                </div>
                                <p className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-widest">
                                  {totalVotes} {totalVotes === 1 ? "response" : "responses"}
                                </p>
                              </div>

                              {/* Controls */}
                              <div className="flex items-center gap-1.5 shrink-0">
                                {!poll.isActive && !poll.isClosed && (
                                  <button
                                    onClick={() => onActivatePoll(poll.id)}
                                    className="p-1.5 bg-accent-1/10 text-accent-1 hover:bg-accent-1 hover:text-black border border-accent-1/30 text-xs font-mono font-bold uppercase transition-all flex items-center gap-1 cursor-pointer"
                                    title="Activate voting for guests"
                                  >
                                    <Play className="h-3 w-3 fill-current" /> Launch
                                  </button>
                                )}
                                {poll.isActive && (
                                  <button
                                    onClick={() => onClosePoll(poll.id)}
                                    className="p-1.5 bg-rose-950/20 text-rose-300 hover:bg-rose-400 hover:text-black border border-rose-900 text-xs font-mono font-bold uppercase transition-all flex items-center gap-1 cursor-pointer"
                                    title="Close voting"
                                  >
                                    <Square className="h-3 w-3 fill-current" /> Close
                                  </button>
                                )}
                                {poll.isClosed && (
                                  <button
                                    onClick={() => onActivatePoll(poll.id)}
                                    className="p-1.5 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 border border-zinc-800 text-xs font-mono font-bold uppercase transition-all flex items-center gap-1 cursor-pointer"
                                    title="Re-open voting"
                                  >
                                    <RefreshCw className="h-3 w-3" /> Re-launch
                                  </button>
                                )}
                                <button
                                  onClick={() => onDeletePoll(poll.id)}
                                  className="p-1.5 text-zinc-500 hover:text-rose-400 hover:bg-zinc-900 border border-transparent hover:border-zinc-800 transition-colors cursor-pointer"
                                  title="Delete poll"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>

                            {/* Options visualization */}
                            <div className="space-y-2.5 pt-2 border-t border-zinc-900">
                              {poll.options.map((option, index) => {
                                const votes = poll.votes[index] || 0;
                                const percentage = totalVotes > 0 
                                  ? Math.round((votes / totalVotes) * 100) 
                                  : 0;

                                return (
                                  <div key={index} className="space-y-1 text-xs">
                                    <div className="flex justify-between font-semibold text-zinc-300">
                                      <span className="truncate pr-3">{option}</span>
                                      <span className="font-mono text-zinc-400 shrink-0">
                                        {percentage}% ({votes})
                                      </span>
                                    </div>
                                    <div className="h-2 w-full bg-zinc-900 border border-zinc-850 rounded-none overflow-hidden relative">
                                      <div
                                        style={{ width: `${percentage}%` }}
                                        className={`h-full transition-all duration-300 ${
                                          poll.isActive ? "bg-accent-1" : "bg-zinc-600"
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
              // Q&A Moderation Panel
              <motion.div
                key="tab-qa"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.15 }}
                className="space-y-5"
              >
                <div className="border-b border-zinc-900 pb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <h3 className="font-mono font-black uppercase tracking-wider text-white text-sm">Audience Q&A Moderation</h3>
                    <p className="text-[11px] text-zinc-400">Filter, upvote, and flag audience questions live.</p>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleAISummarizeQA}
                      className="px-3 py-1.5 bg-accent-3/10 hover:bg-accent-3 text-accent-3 hover:text-black border border-accent-3/30 font-mono font-black text-xs uppercase flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Sparkles className="h-3.5 w-3.5" /> AI Summary
                    </button>

                    {/* Filters */}
                    <div className="flex bg-zinc-950 p-0.5 border border-zinc-900 text-xs">
                      <button
                        onClick={() => setQaFilter("active")}
                        className={`px-3 py-1.5 font-mono uppercase font-black transition-all cursor-pointer ${
                          qaFilter === "active"
                            ? "bg-zinc-900 text-accent-3 border border-accent-3/20"
                            : "text-zinc-500 hover:text-zinc-300"
                        }`}
                      >
                        Unanswered ({room.questions.filter(q => !q.isAnswered && !q.isArchived).length})
                      </button>
                      <button
                        onClick={() => setQaFilter("answered")}
                        className={`px-3 py-1.5 font-mono uppercase font-black transition-all cursor-pointer ${
                          qaFilter === "answered"
                            ? "bg-zinc-900 text-accent-3 border border-accent-3/20"
                            : "text-zinc-500 hover:text-zinc-300"
                        }`}
                      >
                        Answered ({room.questions.filter(q => q.isAnswered && !q.isArchived).length})
                      </button>
                      <button
                        onClick={() => setQaFilter("archived")}
                        className={`px-3 py-1.5 font-mono uppercase font-black transition-all cursor-pointer ${
                          qaFilter === "archived"
                            ? "bg-zinc-900 text-accent-3 border border-accent-3/20"
                            : "text-zinc-500 hover:text-zinc-300"
                        }`}
                      >
                        Archived ({room.questions.filter(q => q.isArchived).length})
                      </button>
                    </div>
                  </div>
                </div>

                {filteredQuestions.length === 0 ? (
                  <div className="border-2 border-dashed border-zinc-900 p-16 text-center text-zinc-500 text-xs font-mono uppercase rounded-none">
                    No questions in this filter.
                  </div>
                ) : (
                  <div className="space-y-3">
                    <AnimatePresence initial={false}>
                      {filteredQuestions.map((q) => (
                        <motion.div
                          key={q.id}
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.98 }}
                          layout
                          className={`p-4 border-2 flex items-start justify-between gap-4 bg-zinc-950 transition-all rounded-none ${
                            q.isAnswered 
                              ? "border-emerald-900 bg-emerald-950/10" 
                              : q.isArchived 
                                ? "border-zinc-900 opacity-60" 
                                : "border-zinc-900"
                          }`}
                        >
                          <div className="space-y-2 min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              {q.isAnswered && (
                                <span className="text-[9px] font-mono font-black text-emerald-400 bg-emerald-950 border border-emerald-800 px-1.5 py-0.5 uppercase">
                                  ✓ Answered
                                </span>
                              )}
                              {q.isArchived && (
                                <span className="text-[9px] font-mono font-black text-zinc-400 bg-zinc-900 border border-zinc-800 px-1.5 py-0.5 uppercase">
                                  Archived
                                </span>
                              )}
                              <span className="text-[10px] font-mono font-black text-zinc-500 uppercase tracking-wider">
                                ▲ {q.upvotes} {q.upvotes === 1 ? "upvote" : "upvotes"}
                              </span>
                            </div>
                            <p className="text-xs sm:text-sm text-zinc-100 font-bold break-words leading-relaxed">
                              "{q.text}"
                            </p>
                            <span className="text-[10px] font-mono text-zinc-500 block uppercase">
                              Asked at {new Date(q.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          </div>

                          {/* Action Items */}
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              onClick={() => onToggleAnswered(q.id)}
                              className={`p-1.5 border-2 transition-all cursor-pointer ${
                                q.isAnswered
                                  ? "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white"
                                  : "bg-emerald-950 text-emerald-400 border-emerald-800 hover:bg-emerald-900"
                              }`}
                              title={q.isAnswered ? "Mark as unanswered" : "Mark as answered live"}
                            >
                              <Check className="h-4 w-4 stroke-[2.5]" />
                            </button>

                            <button
                              onClick={() => onToggleArchive(q.id)}
                              className="p-1.5 border-2 border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                              title={q.isArchived ? "Unarchive question" : "Archive question"}
                            >
                              {q.isArchived ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                            </button>

                            <button
                              onClick={() => onDeleteQuestion(q.id)}
                              className="p-1.5 border-2 border-transparent hover:border-rose-900 hover:bg-rose-950/20 text-zinc-500 hover:text-rose-400 transition-colors cursor-pointer"
                              title="Delete permanently"
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
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-zinc-950 border-2 border-accent-1 p-6 w-full max-w-md space-y-4 rounded-none shadow-2xl relative"
          >
            <div className="flex justify-between items-center border-b border-zinc-900 pb-3">
              <h3 className="font-mono font-black uppercase text-accent-1 text-sm flex items-center gap-2">
                <Wand2 className="h-4 w-4" /> Gemini AI Poll Generator
              </h3>
              <button
                onClick={() => setShowAiPollModal(false)}
                className="text-zinc-500 hover:text-white p-1 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-xs text-zinc-400">
              Enter any presentation topic, and Gemini AI will automatically compose an engaging poll question with 4 answer choices.
            </p>

            <form onSubmit={handleAIPollGenerate} className="space-y-4">
              <div>
                <label className="block text-[10px] font-mono font-black uppercase text-zinc-400 mb-1.5">
                  Presentation Topic
                </label>
                <input
                  type="text"
                  required
                  value={aiTopicInput}
                  onChange={(e) => setAiTopicInput(e.target.value)}
                  placeholder="e.g. AI Ethics, Remote Work, Product Strategy"
                  className="w-full bg-zinc-900 border-2 border-zinc-800 focus:border-accent-1 focus:outline-none p-3 text-xs text-white"
                  autoFocus
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAiPollModal(false)}
                  className="px-4 py-2 text-xs font-mono uppercase font-bold text-zinc-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isGeneratingAI || !aiTopicInput.trim()}
                  className="px-5 py-2.5 bg-accent-1 hover:bg-cyan-300 text-black font-mono font-black text-xs uppercase flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isGeneratingAI ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Generating...
                    </>
                  ) : (
                    <>
                      <Wand2 className="h-3.5 w-3.5" /> Generate Poll
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* AI Q&A Summary Modal */}
      {showAiSummaryModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-zinc-950 border-2 border-accent-3 p-6 w-full max-w-lg space-y-5 rounded-none shadow-2xl relative"
          >
            <div className="flex justify-between items-center border-b border-zinc-900 pb-3">
              <h3 className="font-mono font-black uppercase text-accent-3 text-sm flex items-center gap-2">
                <Sparkles className="h-4 w-4" /> AI Audience Q&A Insights
              </h3>
              <button
                onClick={() => setShowAiSummaryModal(false)}
                className="text-zinc-500 hover:text-white p-1 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {isSummarizingAI ? (
              <div className="py-12 text-center space-y-3">
                <RefreshCw className="h-8 w-8 text-accent-3 animate-spin mx-auto" />
                <p className="text-xs font-mono uppercase text-zinc-400">Gemini is analyzing audience sentiment...</p>
              </div>
            ) : aiSummaryResult ? (
              <div className="space-y-4">
                <div className="p-3.5 bg-accent-3/10 border border-accent-3/30 text-xs text-zinc-200 font-medium leading-relaxed">
                  <span className="font-mono font-black uppercase text-accent-3 block mb-1">Executive Overview</span>
                  {aiSummaryResult.summary}
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-mono font-black text-white uppercase tracking-wider">
                    Key Presenter Talking Points
                  </h4>
                  <div className="space-y-2">
                    {aiSummaryResult.keyPoints.map((point, idx) => (
                      <div key={idx} className="p-3 bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 flex items-start gap-2.5">
                        <span className="bg-accent-3/20 text-accent-3 font-mono font-black text-[10px] px-1.5 py-0.5 rounded-none shrink-0">
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
                className="px-5 py-2 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-xs font-mono uppercase font-bold text-white cursor-pointer"
              >
                Close Insights
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Control Footer */}
      <footer className="border-t border-zinc-900 bg-black py-4 text-center text-[10px] text-zinc-550 font-mono uppercase tracking-wider">
        CastVote Presenter Dashboard. Real-time sync is active and secured.
      </footer>
    </div>
  );
}
