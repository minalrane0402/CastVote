import React from "react";
import { Vote, MessageSquare, Monitor, HelpCircle, ExternalLink, ArrowLeft } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { Room, Poll } from "../types";
import { motion, AnimatePresence } from "motion/react";

interface ProjectorViewProps {
  room: Room;
  onClose: () => void;
}

export default function ProjectorView({ room, onClose }: ProjectorViewProps) {
  const joinUrl = `${window.location.origin}/#/room/${room.id}`;
  const activePoll = room.polls.find(p => p.isActive);

  const qaQuestions = room.questions
    .filter(q => !q.isArchived)
    .sort((a, b) => b.upvotes - a.upvotes)
    .slice(0, 5);

  const getTotalVotes = (poll: Poll) => {
    return Object.values(poll.votes).reduce((sum, count) => sum + count, 0);
  };

  const totalActivePollVotes = activePoll ? getTotalVotes(activePoll) : 0;

  return (
    <div className="min-h-screen bg-[#09090B] text-white flex flex-col justify-between font-sans overflow-hidden selection:bg-sky-500/30 selection:text-sky-200">
      {/* Stage Display Header */}
      <header className="border-b border-zinc-800/80 bg-[#09090B] px-8 py-5 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="bg-gradient-to-tr from-sky-400 to-indigo-500 text-black p-2.5 rounded-xl shadow-lg shadow-sky-500/20">
            <Monitor className="h-6 w-6 text-zinc-950 stroke-[2.5]" />
          </div>
          <div>
            <h1 className="font-bold text-xl tracking-tight text-white flex items-center gap-2">
              Cast<span className="text-sky-400">Vote</span> Projector View
            </h1>
            <p className="text-xs text-zinc-400">
              Event: <span className="text-sky-300 font-medium">{room.title}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-5">
          <div className="glass-panel px-4 py-2 rounded-xl text-center">
            <p className="text-[10px] text-zinc-400 font-medium tracking-wide">
              JOIN AT
            </p>
            <p className="font-mono text-xs font-semibold text-sky-400">
              {window.location.host}
            </p>
          </div>
          <div className="bg-sky-500 text-zinc-950 px-5 py-2 rounded-xl text-center shadow-lg shadow-sky-500/20">
            <p className="text-[9px] font-bold tracking-wider uppercase opacity-80">
              ROOM CODE
            </p>
            <p className="font-mono text-xl font-extrabold tracking-widest">
              {room.id}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-xs font-medium px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors border border-zinc-800 cursor-pointer flex items-center gap-1.5"
          >
            <ArrowLeft className="h-4 w-4" /> Exit Stage View
          </button>
        </div>
      </header>

      {/* Main Split Stage Grid */}
      <main className="flex-grow p-8 grid grid-cols-12 gap-8 items-stretch overflow-hidden">
        {/* Left Side: Poll Results or Q&A Board */}
        <section className="col-span-8 flex flex-col justify-center glass-panel p-8 rounded-3xl shadow-2xl overflow-y-auto border-zinc-800/80">
          <AnimatePresence mode="wait">
            {activePoll ? (
              <motion.div
                key={activePoll.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                className="space-y-6"
              >
                <div>
                  <span className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-sky-500/10 text-sky-400 border border-sky-500/20 text-xs font-semibold rounded-full">
                    <Vote className="h-4 w-4" /> LIVE POLL RESULTS
                  </span>
                  <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mt-4 leading-tight">
                    {activePoll.question}
                  </h2>
                </div>

                <div className="space-y-4 pt-2">
                  {activePoll.options.map((option, index) => {
                    const votes = activePoll.votes[index] || 0;
                    const percentage = totalActivePollVotes > 0 
                      ? Math.round((votes / totalActivePollVotes) * 100) 
                      : 0;

                    return (
                      <div key={index} className="space-y-2">
                        <div className="flex justify-between items-center text-base font-semibold">
                          <span className="text-zinc-200 truncate pr-4">{option}</span>
                          <span className="text-sky-400 font-mono font-bold">
                            {percentage}% <span className="text-zinc-500 text-xs font-normal">({votes} {votes === 1 ? 'vote' : 'votes'})</span>
                          </span>
                        </div>
                        <div className="h-6 w-full bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden relative">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${percentage}%` }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            className="h-full bg-gradient-to-r from-sky-400 to-indigo-500 rounded-xl"
                          ></motion.div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex justify-between items-center pt-4 text-xs text-zinc-400 border-t border-zinc-800/80 font-mono">
                  <span>LIVE BROADCAST • REALTIME</span>
                  <span>TOTAL RESPONSES: {totalActivePollVotes}</span>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="qa-feature"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                <div>
                  <span className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-xs font-semibold rounded-full">
                    <MessageSquare className="h-4 w-4" /> LIVE AUDIENCE Q&A BOARD
                  </span>
                  <h2 className="text-2xl font-bold text-white tracking-tight mt-4 leading-snug">
                    Submit your questions at <span className="text-indigo-400 font-mono">{window.location.host}</span> with code <span className="text-indigo-400 font-mono">{room.id}</span>
                  </h2>
                </div>

                <div className="space-y-3 pt-2">
                  {qaQuestions.length === 0 ? (
                    <div className="bg-zinc-900/40 border border-zinc-800 p-12 rounded-2xl text-center text-zinc-500 text-base space-y-2">
                      <HelpCircle className="h-10 w-10 text-zinc-600 mx-auto animate-bounce" />
                      <p className="font-semibold text-zinc-300">No questions submitted yet</p>
                      <p className="text-xs text-zinc-500">Scan the QR code on the right to ask a question!</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {qaQuestions.map((q, idx) => (
                        <motion.div
                          key={q.id}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.08 }}
                          className={`p-4 rounded-2xl border flex justify-between items-center gap-4 glass-panel ${
                            q.isAnswered 
                              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                              : "border-zinc-800 text-zinc-200"
                          }`}
                        >
                          <div className="space-y-1 min-w-0">
                            {q.isAnswered && (
                              <span className="inline-flex items-center text-[9px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                                ✓ Answered on Stage
                              </span>
                            )}
                            <p className="text-base font-semibold line-clamp-2 leading-snug">
                              "{q.text}"
                            </p>
                          </div>
                          <div className="glass-panel px-4 py-2 rounded-xl text-center shrink-0 border-zinc-800">
                            <span className="block text-[9px] text-zinc-500 font-mono uppercase">Upvotes</span>
                            <span className="text-base font-bold text-indigo-400 font-mono">{q.upvotes}</span>
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

        {/* Right Side: Local QR Code & Access Panel */}
        <section className="col-span-4 flex flex-col justify-between gap-6">
          <div className="glass-panel p-6 rounded-3xl text-center space-y-4 flex flex-col justify-center items-center flex-grow shadow-xl border-zinc-800/80">
            <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              SCAN TO JOIN INSTANTLY
            </h3>
            
            <div className="p-4 bg-white rounded-2xl border border-zinc-300 shadow-md flex items-center justify-center">
              <QRCodeSVG
                value={joinUrl}
                size={200}
                bgColor="#FFFFFF"
                fgColor="#000000"
                level="M"
              />
            </div>

            <div className="space-y-1">
              <p className="text-xs text-zinc-400">
                No signups or app downloads needed.
              </p>
              <p className="text-xs font-semibold text-sky-400 flex items-center justify-center gap-1 font-mono">
                {joinUrl.replace(/(^\w+:|^)\/\//, "")} <ExternalLink className="h-3 w-3" />
              </p>
            </div>
          </div>

          {activePoll && (
            <div className="glass-panel p-4 rounded-2xl h-44 flex flex-col justify-between shadow-lg border-zinc-800/80">
              <div className="flex justify-between items-center border-b border-zinc-800 pb-2">
                <h3 className="text-[11px] font-semibold text-zinc-400 flex items-center gap-1.5">
                  <MessageSquare className="h-3.5 w-3.5 text-indigo-400" /> TOP AUDIENCE QUESTIONS
                </h3>
                <span className="bg-zinc-800 text-zinc-300 text-[10px] font-mono px-2 py-0.5 rounded-md">
                  {room.questions.filter(q => !q.isArchived).length}
                </span>
              </div>

              <div className="flex-grow overflow-y-auto space-y-1.5 py-1.5 text-xs">
                {qaQuestions.length === 0 ? (
                  <p className="text-zinc-600 text-center py-3 text-[11px]">No questions yet</p>
                ) : (
                  qaQuestions.slice(0, 3).map((q) => (
                    <div key={q.id} className="flex justify-between items-center gap-2 p-2 bg-zinc-900/40 rounded-lg border border-zinc-800/60">
                      <p className="truncate text-zinc-300 font-medium flex-grow min-w-0 pr-1 text-[11px]">
                        "{q.text}"
                      </p>
                      <span className="bg-zinc-950 text-indigo-400 font-mono font-semibold text-[10px] px-1.5 py-0.5 rounded-md border border-zinc-800 shrink-0">
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

      <footer className="bg-[#09090B] border-t border-zinc-800/80 py-3 px-8 text-center text-xs text-zinc-500">
        CastVote Presentation View • Real-time Broadcast Active
      </footer>
    </div>
  );
}
