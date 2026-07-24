import React, { useState } from "react";
import { Vote, MessageSquare, QrCode, Sparkles, ChevronRight, Play, ArrowRight } from "lucide-react";
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
    <div className="min-h-screen bg-[#09090B] text-white flex flex-col justify-between font-sans selection:bg-accent-1 selection:text-black">
      {/* Header */}
      <header className="border-b-2 border-zinc-900 bg-[#09090B]/90 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-zinc-100 text-black p-2.5 rounded-none border-2 border-white flex items-center justify-center">
              <Vote className="h-5 w-5 animate-pulse text-black" />
            </div>
            <div>
              <span className="font-mono font-black text-2xl tracking-tighter uppercase text-white">
                CAST<span className="text-accent-1 font-sans">VOTE</span>
              </span>
              <span className="ml-2 px-2 py-0.5 text-[10px] font-black font-mono uppercase bg-accent-1/20 text-accent-1 rounded-none border border-accent-1/30">
                REALTIME
              </span>
            </div>
          </div>
          
          <div className="hidden sm:flex items-center space-x-6 text-xs font-mono uppercase tracking-wider text-zinc-400">
            <span className="flex items-center gap-2 hover:text-white transition-colors">
              <span className="h-2 w-2 rounded-full bg-accent-1 inline-block animate-ping"></span>
              Real-time Polls
            </span>
            <span className="flex items-center gap-2 hover:text-white transition-colors">
              <span className="h-2 w-2 rounded-full bg-accent-2 inline-block"></span>
              Interactive Q&A
            </span>
          </div>
        </div>
      </header>

      {/* Hero / Action Area */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20 flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
        <div className="flex-1 space-y-6 text-center lg:text-left">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 bg-zinc-900 border border-zinc-800 text-accent-1 rounded-none text-xs font-mono uppercase tracking-widest"
          >
            <Sparkles className="h-3.5 w-3.5" /> ZERO INSTALL • 100% WEB-BASED
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white uppercase leading-none"
          >
            ENGAGE YOUR <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-1 via-accent-2 to-accent-3">
              AUDIENCE LIVE
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-base sm:text-lg text-zinc-400 max-w-xl mx-auto lg:mx-0 font-normal leading-relaxed"
          >
            CastVote is a lightweight, real-time Slido replacement. Presenters create event rooms, audiences scan local QR codes to vote and upvote Q&A topics anonymously, and results synchronize instantly on stage.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="pt-4 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
          >
            <button
              onClick={() => onJoinRoom("DEMO")}
              className="group inline-flex items-center justify-center gap-3 px-8 py-4 bg-white hover:bg-zinc-200 text-black font-mono font-bold uppercase tracking-wider transition-all duration-200 border-2 border-white cursor-pointer"
            >
              <Play className="h-4 w-4 fill-black" /> DEMO ROOM
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>
          </motion.div>
        </div>

        {/* Right card: Join/Create Tabs */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="w-full max-w-md bg-zinc-950 border-2 border-zinc-800 p-6 sm:p-8 rounded-none relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-accent-1 via-accent-2 to-accent-3"></div>

          {/* Tabs */}
          <div className="flex border-b border-zinc-900 pb-4 mb-6">
            <button
              onClick={() => setActiveTab("join")}
              className={`flex-1 text-center pb-3 text-xs uppercase font-mono font-black tracking-widest border-b-2 transition-all cursor-pointer ${
                activeTab === "join"
                  ? "border-accent-1 text-accent-1"
                  : "border-transparent text-zinc-500 hover:text-zinc-300"
              }`}
            >
              Join Session
            </button>
            <button
              onClick={() => setActiveTab("create")}
              className={`flex-1 text-center pb-3 text-xs uppercase font-mono font-black tracking-widest border-b-2 transition-all cursor-pointer ${
                activeTab === "create"
                  ? "border-accent-3 text-accent-3"
                  : "border-transparent text-zinc-500 hover:text-zinc-300"
              }`}
            >
              Create Session
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-rose-950/50 text-rose-300 text-xs font-mono uppercase tracking-wider rounded-none border border-rose-800 flex items-center">
              <span className="mr-2">⚠️</span> {error}
            </div>
          )}

          {activeTab === "join" ? (
            <form onSubmit={handleJoinSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-black font-mono uppercase tracking-widest text-zinc-400 mb-2">
                  ENTER ROOM CODE
                </label>
                <input
                  type="text"
                  maxLength={5}
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value)}
                  placeholder="DEMO"
                  className="w-full text-center text-4xl font-black font-mono tracking-widest uppercase bg-zinc-900 border-2 border-zinc-850 hover:border-zinc-700 focus:border-accent-1 focus:bg-[#121214] focus:outline-none rounded-none py-4 transition-all text-white placeholder-zinc-700"
                  disabled={isLoading}
                  autoFocus
                />
              </div>
              <button
                type="submit"
                className="w-full py-4 px-4 bg-accent-1 hover:bg-cyan-300 text-black font-mono font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer"
                disabled={isLoading}
              >
                {isLoading ? "JOINING..." : "JOIN EVENT"}
                <ChevronRight className="h-5 w-5 stroke-[3]" />
              </button>
              <p className="text-center text-[11px] font-mono uppercase text-zinc-500">
                No logins, no signups required.
              </p>
            </form>
          ) : (
            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-black font-mono uppercase tracking-widest text-zinc-400 mb-2">
                  EVENT / SESSION TITLE
                </label>
                <input
                  type="text"
                  value={roomTitle}
                  onChange={(e) => setRoomTitle(e.target.value)}
                  placeholder="e.g. Weekly All-Hands Meeting"
                  className="w-full bg-zinc-900 border-2 border-zinc-850 focus:border-accent-3 focus:bg-[#121214] focus:outline-none rounded-none px-4 py-3.5 text-sm font-semibold transition-all text-white placeholder-zinc-600"
                  disabled={isLoading}
                  autoFocus
                />
              </div>
              <button
                type="submit"
                className="w-full py-4 px-4 bg-accent-3 hover:bg-pink-300 text-black font-mono font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer"
                disabled={isLoading}
              >
                {isLoading ? "CREATING..." : "CREATE EVENT ROOM"}
                <ChevronRight className="h-5 w-5 stroke-[3]" />
              </button>
              <p className="text-center text-[11px] font-mono uppercase text-zinc-500">
                You will receive a room code and presenter controls.
              </p>
            </form>
          )}
        </motion.div>
      </main>

      {/* Feature pillars section */}
      <section className="bg-zinc-950/60 border-t-2 border-zinc-900 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex gap-4 p-5 bg-zinc-900/20 border border-zinc-800 hover:border-zinc-700 transition-colors">
              <div className="bg-accent-1/10 text-accent-1 p-3.5 h-12 w-12 rounded-none border border-accent-1/20 flex items-center justify-center shrink-0">
                <Vote className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-mono font-bold uppercase text-white mb-1.5 tracking-wider">Instant Realtime Polls</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Design multiple-choice polls or generate them instantly with Gemini AI. Audience responses sync live.
                </p>
              </div>
            </div>

            <div className="flex gap-4 p-5 bg-zinc-900/20 border border-zinc-800 hover:border-zinc-700 transition-colors">
              <div className="bg-accent-2/10 text-accent-2 p-3.5 h-12 w-12 rounded-none border border-accent-2/20 flex items-center justify-center shrink-0">
                <MessageSquare className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-mono font-bold uppercase text-white mb-1.5 tracking-wider">Upvoted Q&A Boards</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Anonymous question submission with real-time upvoting and AI-powered topic summarization.
                </p>
              </div>
            </div>

            <div className="flex gap-4 p-5 bg-zinc-900/20 border border-zinc-800 hover:border-zinc-700 transition-colors">
              <div className="bg-accent-3/10 text-accent-3 p-3.5 h-12 w-12 rounded-none border border-accent-3/20 flex items-center justify-center shrink-0">
                <QrCode className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-mono font-bold uppercase text-white mb-1.5 tracking-wider">Sleek QR Code Joining</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Projector mode generates a custom scannable QR code using fast local SVG rendering.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black text-zinc-500 py-8 text-xs border-t-2 border-zinc-900">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="font-mono uppercase tracking-wider text-[11px]">
            &copy; 2026 CASTVOTE INC. REAL-TIME VOTING &amp; AUDIENCE ENGAGEMENT.
          </div>
          <div className="font-mono uppercase text-zinc-650 text-[10px] tracking-widest bg-zinc-900/40 px-3 py-1 border border-zinc-800">
            SYSTEM STATUS: ONLINE
          </div>
        </div>
      </footer>
    </div>
  );
}
