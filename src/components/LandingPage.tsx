import React, { useState, useEffect } from "react";
import { Vote, MessageSquare, QrCode, Sparkles, ChevronRight, Play, ArrowRight, ShieldCheck, Zap, Users } from "lucide-react";
import { motion } from "motion/react";

interface LandingPageProps {
  onCreateRoom: (title: string) => void;
  onJoinRoom: (code: string) => void;
  isLoading: boolean;
  error: string | null;
}

export default function LandingPage({ onCreateRoom, onJoinRoom, isLoading, error }: LandingPageProps) {
  const [joinCode, setJoinCode] = useState("");
  const [roomTitle, setRoomTitle] = useState("");
  const [activeTab, setActiveTab] = useState<"join" | "create">("join");

  // Keyboard shortcut listener ('/' or 'Cmd+K' to focus join code)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setActiveTab("join");
        const el = document.getElementById("join-code-input");
        if (el) el.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim()) return;
    onJoinRoom(joinCode.trim().toUpperCase());
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomTitle.trim()) return;
    onCreateRoom(roomTitle.trim());
  };

  return (
    <div className="min-h-screen bg-[#09090B] text-slate-100 flex flex-col justify-between font-sans selection:bg-sky-500/30 selection:text-sky-200">
      {/* Navigation Header */}
      <header className="border-b border-zinc-800/80 bg-[#09090B]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto px-5 sm:px-8 lg:px-12 h-24 sm:h-28 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-tr from-sky-400 to-indigo-500 text-black p-3 rounded-2xl shadow-lg shadow-sky-500/20 flex items-center justify-center">
              <Vote className="h-8 w-8 text-zinc-950 stroke-[2.5]" />
            </div>
            <div>
              <span className="font-sans font-bold text-3xl sm:text-4xl tracking-tight text-white">
                Cast<span className="text-sky-400">Vote</span>
              </span>
              <span className="ml-2 px-2 py-0.5 text-[10px] font-mono font-semibold bg-sky-500/10 text-sky-400 rounded-full border border-sky-500/20">
                Live Engagement
              </span>
            </div>
          </div>
          
          <div className="hidden sm:flex items-center space-x-6 text-xs font-medium text-zinc-400">
            <span className="flex items-center gap-2 hover:text-zinc-200 transition-colors">
              <span className="h-2 w-2 rounded-full bg-emerald-400 inline-block animate-pulse"></span>
              Real-Time Polling
            </span>
            <span className="flex items-center gap-2 hover:text-zinc-200 transition-colors">
              <span className="h-2 w-2 rounded-full bg-sky-400 inline-block"></span>
              Upvoted Q&A
            </span>
            <button
              onClick={() => onJoinRoom("DEMO")}
              className="px-3.5 py-1.5 bg-zinc-800/80 hover:bg-zinc-700 text-zinc-200 hover:text-white rounded-lg border border-zinc-700/60 transition-all text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <Play className="h-3 w-3 fill-current" /> Try Demo Room
            </button>
          </div>
        </div>
      </header>

      {/* Main Hero & Action Section */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20 flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
        {/* Left Column: Hero Text */}
        <div className="flex-1 space-y-6 text-center lg:text-left">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-sky-500/10 border border-sky-500/20 text-sky-300 rounded-full text-xs font-medium"
          >
            <Sparkles className="h-3.5 w-3.5 text-sky-400" />
            <span>ZERO APP DOWNLOAD • 100% WEB-BASED</span>
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.1]"
          >
            ENGAGE YOUR AUDIENCE LIVE <br />
            <span className="bg-gradient-to-r from-sky-400 via-indigo-400 to-pink-400 bg-clip-text text-transparent">
              in real time.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
            className="text-base sm:text-lg text-zinc-400 max-w-xl mx-auto lg:mx-0 font-normal leading-relaxed"
          >
            CastVote makes live keynotes, workshops, and team meetings interactive. Launch live polls, let attendees upvote burning questions anonymously, and broadcast results on stage.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="pt-2 flex flex-col sm:flex-row gap-3.5 justify-center lg:justify-start"
          >
            <button
              onClick={() => onJoinRoom("DEMO")}
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-sky-500 hover:bg-sky-400 text-zinc-950 font-semibold rounded-xl transition-all duration-150 shadow-lg shadow-sky-500/20 cursor-pointer text-sm"
            >
              <Play className="h-4 w-4 fill-zinc-950" /> EXPLORE DEMO ROOM
            </button>
            
            <a
              href="#features"
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white font-medium rounded-xl border border-zinc-800 transition-all cursor-pointer text-sm"
            >
              Learn How It Works <ArrowRight className="h-4 w-4" />
            </a>
          </motion.div>
        </div>

        {/* Right Column: Tabbed Join / Create Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="w-full max-w-md glass-panel p-6 sm:p-8 rounded-2xl relative shadow-2xl border border-zinc-800/80"
        >
          {/* Card Tabs */}
          <div className="flex bg-zinc-900/90 p-1 rounded-xl mb-6 border border-zinc-800">
            <button
              onClick={() => setActiveTab("join")}
              className={`flex-1 text-center py-2.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                activeTab === "join"
                  ? "bg-zinc-800 text-white shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              JOIN SESSION
            </button>
            <button
              onClick={() => setActiveTab("create")}
              className={`flex-1 text-center py-2.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                activeTab === "create"
                  ? "bg-zinc-800 text-white shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              CREATE SESSION
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs rounded-xl flex items-center gap-2">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {activeTab === "join" ? (
            <form onSubmit={handleJoinSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-2 flex justify-between">
                  <span>ENTER 5-LETTER ROOM CODE</span>
                  <span className="text-[10px] text-zinc-500 font-mono">Press ⌘K to focus</span>
                </label>
                <input
                  id="join-code-input"
                  type="text"
                  maxLength={5}
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value)}
                  placeholder="DEMO"
                  className="w-full text-center text-3xl font-bold font-mono tracking-widest uppercase bg-zinc-950/80 border border-zinc-800 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 focus:outline-none rounded-xl py-3.5 transition-all text-white placeholder-zinc-700"
                  disabled={isLoading}
                  autoFocus
                />
              </div>
              <button
                type="submit"
                className="w-full py-3.5 px-4 bg-sky-500 hover:bg-sky-400 text-zinc-950 font-semibold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-sky-500/15"
                disabled={isLoading}
              >
                {isLoading ? "Connecting..." : "Join Session"}
                <ChevronRight className="h-4 w-4 stroke-[2.5]" />
              </button>
              <p className="text-center text-[11px] text-zinc-500">
                NO LOGINS, NO SIGNUPS REQUIRED.
              </p>
            </form>
          ) : (
            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-2">
                  EVENT / SESSION TITLE
                </label>
                <input
                  type="text"
                  value={roomTitle}
                  onChange={(e) => setRoomTitle(e.target.value)}
                  placeholder="e.g. Q3 All-Hands Meeting"
                  className="w-full bg-zinc-950/80 border border-zinc-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none rounded-xl px-4 py-3 text-sm font-medium transition-all text-white placeholder-zinc-600"
                  disabled={isLoading}
                  autoFocus
                />
              </div>
              <button
                type="submit"
                className="w-full py-3.5 px-4 bg-indigo-500 hover:bg-indigo-400 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-indigo-500/15"
                disabled={isLoading}
              >
                {isLoading ? "Creating..." : "Create Event Room"}
                <ChevronRight className="h-4 w-4 stroke-[2.5]" />
              </button>
              <p className="text-center text-[11px] text-zinc-500">
                Instantly generates a presenter dashboard & projector view.
              </p>
            </form>
          )}
        </motion.div>
      </main>

      {/* Feature Pillars Section */}
      <section id="features" className="border-t border-zinc-800/60 bg-zinc-950/50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
            <h2 className="text-2xl font-bold text-white tracking-tight">Built for live events of any scale</h2>
            <p className="text-sm text-zinc-400">Everything presenters and attendees need for smooth, real-time engagement.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass-panel glass-panel-hover p-6 rounded-2xl space-y-3">
              <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center border border-sky-500/20">
                <Vote className="h-5 w-5" />
              </div>
              <h3 className="text-base font-semibold text-white">Live Polling & Charts</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Create multiple-choice polls or draft them with AI. Votes update automatically on screen as choices are tapped.
              </p>
            </div>

            <div className="glass-panel glass-panel-hover p-6 rounded-2xl space-y-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
                <MessageSquare className="h-5 w-5" />
              </div>
              <h3 className="text-base font-semibold text-white">Upvoted Q&A Boards</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Attendees ask questions anonymously. Upvoting pushes key topics to the top of the presenter's queue.
              </p>
            </div>

            <div className="glass-panel glass-panel-hover p-6 rounded-2xl space-y-3">
              <div className="w-10 h-10 rounded-xl bg-pink-500/10 text-pink-400 flex items-center justify-center border border-pink-500/20">
                <QrCode className="h-5 w-5" />
              </div>
              <h3 className="text-base font-semibold text-white">Stage Projector & Local QR</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Stage screen mode generates a scannable QR code using fast local rendering, keeping audience access reliable.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-900 bg-[#09090B] py-6 text-xs text-zinc-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-zinc-300">CastVote</span>
            <span>— Real-Time Voting &amp; Audience Engagement</span>
          </div>
          <div className="text-[11px] text-zinc-600 font-mono">
            MIT Licensed • Zero Local Footprint
          </div>
        </div>
      </footer>
    </div>
  );
}
