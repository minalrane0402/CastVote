import React from "react";
import { Vote, MessageSquare, Monitor, HelpCircle, ExternalLink } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { Room, Poll } from "../types";
import { motion, AnimatePresence } from "motion/react";

interface ProjectorViewProps {
  room: Room;
  onClose: () => void;
}

export default function ProjectorView({ room, onClose }: ProjectorViewProps) {
  // Determine join link
  const joinUrl = `${window.location.origin}/#/room/${room.id}`;

  // Active poll
  const activePoll = room.polls.find(p => p.isActive);

  // Filter out archived questions and sort by upvotes
  const qaQuestions = room.questions
    .filter(q => !q.isArchived)
    .sort((a, b) => b.upvotes - a.upvotes)
    .slice(0, 5); // top 5 questions to keep projector clean

  // Calculate total votes
  const getTotalVotes = (poll: Poll) => {
    return Object.values(poll.votes).reduce((sum, count) => sum + count, 0);
  };

  const totalActivePollVotes = activePoll ? getTotalVotes(activePoll) : 0;

  return (
    <div className="min-h-screen bg-[#09090B] text-white flex flex-col justify-between font-sans overflow-hidden selection:bg-accent-1 selection:text-black">
      {/* Projector Header */}
      <header className="border-b-2 border-zinc-900 bg-[#09090B] px-8 py-5 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="bg-white text-black p-2.5 rounded-none border-2 border-white flex items-center justify-center">
            <Monitor className="h-6 w-6 stroke-[2.5]" />
          </div>
          <div>
            <h1 className="font-black text-xl tracking-tight uppercase text-white flex items-center gap-2">
              CAST<span className="text-accent-1 font-sans">VOTE</span> PROJECTOR
            </h1>
            <p className="text-xs font-mono uppercase text-zinc-400">
              EVENT SCREEN: <span className="text-accent-1 font-bold">{room.title}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-6">
          <div className="bg-zinc-950 border-2 border-zinc-900 px-4 py-2 text-center">
            <p className="text-[9px] uppercase font-mono font-black tracking-widest text-zinc-500">
              JOIN INSTANTLY AT
            </p>
            <p className="font-mono text-sm font-bold text-accent-1 lowercase">
              {window.location.host}
            </p>
          </div>
          <div className="bg-accent-1 text-black border-2 border-white px-5 py-2 text-center">
            <p className="text-[9px] uppercase font-mono font-black tracking-widest text-black/80">
              ROOM CODE
            </p>
            <p className="font-mono text-xl font-black tracking-widest text-black">
              {room.id}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-xs font-mono uppercase font-bold px-4 py-3 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors border-2 border-zinc-800 cursor-pointer"
          >
            EXIT SCREEN
          </button>
        </div>
      </header>

      {/* Main Split Layout */}
      <main className="flex-grow p-8 grid grid-cols-12 gap-8 items-stretch overflow-hidden">
        {/* Left Side: Active Poll or Primary Content (Cols 1-8) */}
        <section className="col-span-8 flex flex-col justify-center bg-zinc-950/80 border-2 border-zinc-900 p-8 shadow-2xl overflow-y-auto">
          <AnimatePresence mode="wait">
            {activePoll ? (
              <motion.div
                key={activePoll.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-6"
              >
                <div>
                  <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-accent-1/10 text-accent-1 border border-accent-1/20 text-xs font-mono font-black uppercase tracking-wider">
                    <Vote className="h-4 w-4" /> LIVE POLL RESULTS
                  </span>
                  <h2 className="text-3xl sm:text-4xl font-black text-white uppercase tracking-tight mt-5 leading-none">
                    {activePoll.question}
                  </h2>
                </div>

                {/* Bars Chart Container */}
                <div className="space-y-5 pt-4">
                  {activePoll.options.map((option, index) => {
                    const votes = activePoll.votes[index] || 0;
                    const percentage = totalActivePollVotes > 0 
                      ? Math.round((votes / totalActivePollVotes) * 100) 
                      : 0;

                    return (
                      <div key={index} className="space-y-2">
                        <div className="flex justify-between items-center text-lg font-bold">
                          <span className="text-zinc-200 truncate pr-4">{option}</span>
                          <span className="text-accent-1 font-mono font-black">
                            {percentage}% <span className="text-zinc-500 text-sm font-medium">({votes} {votes === 1 ? 'vote' : 'votes'})</span>
                          </span>
                        </div>
                        <div className="h-7 w-full bg-zinc-900 border-2 border-zinc-850 rounded-none overflow-hidden relative">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${percentage}%` }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            className="h-full bg-gradient-to-r from-accent-1 to-accent-2"
                          ></motion.div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex justify-between items-center pt-4 text-xs font-bold text-zinc-500 font-mono border-t border-zinc-900 uppercase tracking-widest">
                  <span>VOTING IN PROGRESS • REALTIME</span>
                  <span>TOTAL RESPONSES: {totalActivePollVotes}</span>
                </div>
              </motion.div>
            ) : (
              // If no active poll, present top Q&A questions as main feature!
              <motion.div
                key="qa-feature"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                <div>
                  <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-accent-3/10 text-accent-3 border border-accent-3/20 text-xs font-mono font-black uppercase tracking-wider">
                    <MessageSquare className="h-4 w-4" /> LIVE AUDIENCE Q&A BOARD
                  </span>
                  <h2 className="text-2xl font-black text-white uppercase tracking-tight mt-5 leading-snug">
                    SEND YOUR QUESTIONS AT <span className="text-accent-3 font-mono">{window.location.host}</span> USING CODE <span className="text-accent-3 font-mono">{room.id}</span>
                  </h2>
                </div>

                <div className="space-y-4 pt-4">
                  {qaQuestions.length === 0 ? (
                    <div className="bg-zinc-900/50 border-2 border-zinc-900 p-12 text-center text-zinc-500 text-lg space-y-3">
                      <HelpCircle className="h-12 w-12 text-zinc-600 mx-auto animate-bounce" />
                      <p className="font-mono font-black uppercase text-zinc-400">No questions submitted yet</p>
                      <p className="text-sm font-light text-zinc-550">Scan the QR code on the right to ask your first question!</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {qaQuestions.map((q, idx) => (
                        <motion.div
                          key={q.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.1 }}
                          className={`p-5 border-2 flex justify-between items-center gap-4 ${
                            q.isAnswered 
                              ? "bg-emerald-950/20 border-emerald-900/40 text-emerald-300"
                              : "bg-zinc-900/40 border-zinc-900 text-zinc-200"
                          }`}
                        >
                          <div className="space-y-1.5 min-w-0">
                            {q.isAnswered && (
                              <span className="inline-flex items-center text-[9px] font-mono font-black text-emerald-400 bg-emerald-950/60 px-2 py-0.5 border border-emerald-900/30 uppercase">
                                ✓ Answered Live
                              </span>
                            )}
                            <p className="text-base sm:text-lg font-bold truncate-2-lines leading-snug">
                              "{q.text}"
                            </p>
                          </div>
                          <div className="bg-zinc-950 border-2 border-zinc-900 px-4 py-2.5 text-center shrink-0">
                            <span className="block text-[9px] font-mono font-black text-zinc-500 uppercase tracking-widest">Upvotes</span>
                            <span className="text-lg font-black text-accent-3 font-mono">{q.upvotes}</span>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* Right Side: Local QR Code & Fast Joining Panel (Cols 9-12) */}
        <section className="col-span-4 flex flex-col justify-between gap-6">
          {/* Joining QR Box */}
          <div className="bg-zinc-950 border-2 border-zinc-900 p-6 text-center space-y-5 flex flex-col justify-center items-center flex-grow shadow-lg">
            <h3 className="text-xs font-mono font-black tracking-widest text-zinc-400 uppercase">
              SCAN TO JOIN INSTANTLY
            </h3>
            
            <div className="p-4 bg-white hover:scale-102 transition-transform duration-200 border-2 border-zinc-800 flex items-center justify-center">
              <QRCodeSVG
                value={joinUrl}
                size={210}
                bgColor="#FFFFFF"
                fgColor="#000000"
                level="M"
              />
            </div>

            <div className="space-y-1.5">
              <p className="text-xs font-mono uppercase text-zinc-500">
                No logins. No downloads.
              </p>
              <p className="text-xs font-bold text-accent-1 flex items-center justify-center gap-1.5 font-mono lowercase">
                {joinUrl.replace(/(^\w+:|^)\/\//, "")} <ExternalLink className="h-3 w-3" />
              </p>
            </div>
          </div>

          {/* Q&A Side board (if active poll is showing) */}
          {activePoll && (
            <div className="bg-zinc-950 border-2 border-zinc-900 p-5 h-48 flex flex-col justify-between shadow-lg">
              <div className="flex justify-between items-center border-b border-zinc-900 pb-2.5">
                <h3 className="text-[10px] font-mono font-black tracking-widest text-zinc-400 uppercase flex items-center gap-1.5">
                  <MessageSquare className="h-3.5 w-3.5 text-accent-3" /> TOP QUESTIONS
                </h3>
                <span className="bg-zinc-900 border border-zinc-850 text-zinc-300 text-[10px] font-mono px-2 py-0.5">
                  {room.questions.filter(q => !q.isArchived).length}
                </span>
              </div>

              <div className="flex-grow overflow-y-auto space-y-2 py-2 text-xs">
                {qaQuestions.length === 0 ? (
                  <p className="text-zinc-600 text-center py-4 font-mono uppercase text-[10px]">No questions yet</p>
                ) : (
                  qaQuestions.slice(0, 3).map((q) => (
                    <div key={q.id} className="flex justify-between items-center gap-2 p-2 bg-zinc-900/30 rounded-none border border-zinc-900">
                      <p className="truncate text-zinc-300 font-medium flex-grow min-w-0 pr-1 text-[11px]">
                        "{q.text}"
                      </p>
                      <span className="bg-zinc-950 border border-zinc-900 text-accent-3 font-mono font-bold px-1.5 py-0.5 text-[10px] shrink-0">
                        ▲ {q.upvotes}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </section>
      </main>

      {/* Footer Instructions bar */}
      <footer className="bg-[#09090B] border-t-2 border-zinc-900 py-4 px-8 text-center text-xs font-bold tracking-widest text-zinc-500 font-mono uppercase">
        CASTVOTE PRESENTATION PORTAL • INSTANT SYNC ACTIVE • EVENT IS LIVE
      </footer>
    </div>
  );
}
