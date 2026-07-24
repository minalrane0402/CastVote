import React, { useState, useEffect } from "react";
import { 
  createRoom, getRoom, createPoll, activatePoll, closePoll, deletePoll, 
  submitVote, submitQuestion, toggleUpvote, toggleAnswered, toggleArchive, 
  deleteQuestion, getOrCreateUserId, subscribeToRoom 
} from "./lib/api";
import { Room } from "./types";
import LandingPage from "./components/LandingPage";
import ParticipantView from "./components/ParticipantView";
import PresenterControl from "./components/PresenterControl";
import ProjectorView from "./components/ProjectorView";

type ViewState = "landing" | "participant" | "presenter" | "projector";

export default function App() {
  const [currentView, setCurrentView] = useState<ViewState>("landing");
  const [roomId, setRoomId] = useState<string | null>(null);
  const [room, setRoom] = useState<Room | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Parse URL hash routing on load and on hash change
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (!hash || hash === "#" || hash === "#/") {
        setCurrentView("landing");
        setRoomId(null);
        setRoom(null);
        setError(null);
        return;
      }

      // Format: #/room/DEMO, #/room/DEMO/presenter, #/room/DEMO/projector
      const match = hash.match(/^#\/room\/([A-Za-z0-9_-]+)(?:\/(\w+))?$/);
      if (match) {
        const id = match[1].toUpperCase();
        const action = match[2];

        setRoomId(id);
        if (action === "presenter") {
          setCurrentView("presenter");
        } else if (action === "projector") {
          setCurrentView("projector");
        } else {
          setCurrentView("participant");
        }
      } else {
        // Fallback for short hash like #/DEMO
        const shortMatch = hash.match(/^#\/([A-Za-z0-9_-]+)$/);
        if (shortMatch) {
          const id = shortMatch[1].toUpperCase();
          setRoomId(id);
          setCurrentView("participant");
          window.location.hash = `#/room/${id}`;
        } else {
          window.location.hash = "#/";
        }
      }
    };

    window.addEventListener("hashchange", handleHashChange);
    handleHashChange();

    return () => {
      window.removeEventListener("hashchange", handleHashChange);
    };
  }, []);

  // Initial Room Fetch
  useEffect(() => {
    if (!roomId) return;

    let isMounted = true;
    const fetchInitialData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await getRoom(roomId);
        if (isMounted) {
          setRoom(data);
        }
      } catch (err: any) {
        console.error(err);
        if (isMounted) {
          setError(err.message || "Failed to load session. Please check your room code.");
          setCurrentView("landing");
          setRoomId(null);
          setRoom(null);
          window.location.hash = "#/";
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchInitialData();

    return () => {
      isMounted = false;
    };
  }, [roomId]);

  // Real-time Cloud Firestore / Subscribed Sync Loop
  useEffect(() => {
    if (!roomId || isLoading) return;

    setIsSyncing(true);
    const unsubscribe = subscribeToRoom(roomId, (updatedRoom) => {
      setRoom(updatedRoom);
      setIsSyncing(false);
    });

    return () => {
      unsubscribe();
    };
  }, [roomId, isLoading]);

  // Handlers
  const handleCreateRoom = async (title: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const newRoom = await createRoom(title);
      setRoom(newRoom);
      setRoomId(newRoom.id);
      window.location.hash = `#/room/${newRoom.id}/presenter`;
    } catch (err: any) {
      setError(err.message || "Failed to create room");
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinRoom = async (code: string) => {
    setIsLoading(true);
    setError(null);
    const upperCode = code.trim().toUpperCase();
    try {
      const data = await getRoom(upperCode);
      setRoom(data);
      setRoomId(upperCode);
      window.location.hash = `#/room/${upperCode}`;
    } catch (err: any) {
      setError(`Room "${upperCode}" not found. Try "DEMO" or check your code.`);
    } finally {
      setIsLoading(false);
    }
  };

  // Participant Operations
  const handleVote = async (pollId: string, optionIndex: number) => {
    if (!roomId) return;
    const userId = getOrCreateUserId();
    
    // Optimistic UI update
    if (room) {
      const updatedPolls = room.polls.map(p => {
        if (p.id === pollId) {
          const currentVotes = { ...p.votes };
          currentVotes[optionIndex] = (currentVotes[optionIndex] || 0) + 1;
          return {
            ...p,
            votes: currentVotes,
            votedUsers: [...p.votedUsers, userId]
          };
        }
        return p;
      });
      setRoom({ ...room, polls: updatedPolls });
    }

    try {
      const updatedPoll = await submitVote(roomId, pollId, optionIndex, userId);
      if (room) {
        const updatedPolls = room.polls.map(p => p.id === pollId ? updatedPoll : p);
        setRoom({ ...room, polls: updatedPolls });
      }
    } catch (err: any) {
      alert(err.message || "Failed to submit vote");
      // Refetch latest state on failure
      forceRefresh();
    }
  };

  const handleAskQuestion = async (text: string) => {
    if (!roomId) return;
    try {
      const newQuestion = await submitQuestion(roomId, text);
      if (room) {
        setRoom({
          ...room,
          questions: [...room.questions, newQuestion],
        });
      }
    } catch (err: any) {
      alert(err.message || "Failed to submit question");
    }
  };

  const handleUpvoteQuestion = async (questionId: string) => {
    if (!roomId) return;
    const userId = getOrCreateUserId();

    if (room) {
      const updatedQuestions = room.questions.map(q => {
        if (q.id === questionId) {
          const hasUpvoted = q.upvotedBy.includes(userId);
          const upvotes = hasUpvoted ? Math.max(0, q.upvotes - 1) : q.upvotes + 1;
          const upvotedBy = hasUpvoted 
            ? q.upvotedBy.filter(uid => uid !== userId) 
            : [...q.upvotedBy, userId];
          return { ...q, upvotes, upvotedBy };
        }
        return q;
      });
      setRoom({ ...room, questions: updatedQuestions });
    }

    try {
      const updatedQuestion = await toggleUpvote(roomId, questionId, userId);
      if (room) {
        const updatedQuestions = room.questions.map(q => q.id === questionId ? updatedQuestion : q);
        setRoom({ ...room, questions: updatedQuestions });
      }
    } catch (err: any) {
      console.error(err);
      forceRefresh();
    }
  };

  // Presenter Operations
  const handleCreatePoll = async (question: string, options: string[]) => {
    if (!roomId) return;
    try {
      const newPoll = await createPoll(roomId, question, options);
      if (room) {
        const updatedPolls = newPoll.isActive 
          ? room.polls.map(p => ({ ...p, isActive: false })).concat(newPoll)
          : room.polls.concat(newPoll);
        
        setRoom({ ...room, polls: updatedPolls });
      }
    } catch (err: any) {
      alert(err.message || "Failed to create poll");
    }
  };

  const handleActivatePoll = async (pollId: string) => {
    if (!roomId) return;
    try {
      const updatedPoll = await activatePoll(roomId, pollId);
      if (room) {
        const updatedPolls = room.polls.map(p => {
          if (p.id === pollId) return updatedPoll;
          return { ...p, isActive: false };
        });
        setRoom({ ...room, polls: updatedPolls });
      }
    } catch (err: any) {
      alert(err.message || "Failed to activate poll");
    }
  };

  const handleClosePoll = async (pollId: string) => {
    if (!roomId) return;
    try {
      const updatedPoll = await closePoll(roomId, pollId);
      if (room) {
        const updatedPolls = room.polls.map(p => p.id === pollId ? updatedPoll : p);
        setRoom({ ...room, polls: updatedPolls });
      }
    } catch (err: any) {
      alert(err.message || "Failed to close poll");
    }
  };

  const handleDeletePoll = async (pollId: string) => {
    if (!roomId) return;
    if (!confirm("Are you sure you want to delete this poll? This will erase all results.")) return;
    try {
      await deletePoll(roomId, pollId);
      if (room) {
        setRoom({
          ...room,
          polls: room.polls.filter(p => p.id !== pollId),
        });
      }
    } catch (err: any) {
      alert(err.message || "Failed to delete poll");
    }
  };

  const handleToggleAnswered = async (questionId: string) => {
    if (!roomId) return;
    try {
      const updatedQuestion = await toggleAnswered(roomId, questionId);
      if (room) {
        setRoom({
          ...room,
          questions: room.questions.map(q => q.id === questionId ? updatedQuestion : q),
        });
      }
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleToggleArchive = async (questionId: string) => {
    if (!roomId) return;
    try {
      const updatedQuestion = await toggleArchive(roomId, questionId);
      if (room) {
        setRoom({
          ...room,
          questions: room.questions.map(q => q.id === questionId ? updatedQuestion : q),
        });
      }
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (!roomId) return;
    if (!confirm("Are you sure you want to delete this question?")) return;
    try {
      await deleteQuestion(roomId, questionId);
      if (room) {
        setRoom({
          ...room,
          questions: room.questions.filter(q => q.id !== questionId),
        });
      }
    } catch (err: any) {
      alert(err.message || "Failed to delete question");
    }
  };

  const forceRefresh = async () => {
    if (!roomId) return;
    setIsSyncing(true);
    try {
      const data = await getRoom(roomId);
      setRoom(data);
    } catch (err) {
      console.error("Force refresh failed:", err);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleLeaveRoom = () => {
    window.location.hash = "#/";
  };

  const handleOpenProjector = () => {
    window.location.hash = `#/room/${roomId}/projector`;
  };

  const handleCloseProjector = () => {
    window.location.hash = `#/room/${roomId}/presenter`;
  };

  // Routing Switch
  if (currentView === "landing") {
    return (
      <LandingPage 
        onCreateRoom={handleCreateRoom}
        onJoinRoom={handleJoinRoom}
        isLoading={isLoading}
        error={error}
      />
    );
  }

  if (isLoading || !room) {
    return (
      <div className="min-h-screen bg-[#09090B] flex flex-col items-center justify-center font-sans gap-4">
        <div className="bg-cyan-500 text-black p-3 rounded-none border-2 border-white animate-pulse">
          <svg className="animate-spin h-6 w-6 text-black" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </div>
        <p className="text-zinc-400 font-mono font-medium text-xs uppercase tracking-widest">Connecting to CastVote...</p>
      </div>
    );
  }

  switch (currentView) {
    case "participant":
      return (
        <ParticipantView
          room={room}
          onVote={handleVote}
          onAskQuestion={handleAskQuestion}
          onUpvoteQuestion={handleUpvoteQuestion}
          onLeave={handleLeaveRoom}
          isSyncing={isSyncing}
          onForceRefresh={forceRefresh}
        />
      );
    case "presenter":
      return (
        <PresenterControl
          room={room}
          onCreatePoll={handleCreatePoll}
          onActivatePoll={handleActivatePoll}
          onClosePoll={handleClosePoll}
          onDeletePoll={handleDeletePoll}
          onToggleAnswered={handleToggleAnswered}
          onToggleArchive={handleToggleArchive}
          onDeleteQuestion={handleDeleteQuestion}
          onForceRefresh={forceRefresh}
          isSyncing={isSyncing}
          onOpenProjector={handleOpenProjector}
        />
      );
    case "projector":
      return (
        <ProjectorView
          room={room}
          onClose={handleCloseProjector}
        />
      );
    default:
      return (
        <LandingPage 
          onCreateRoom={handleCreateRoom}
          onJoinRoom={handleJoinRoom}
          isLoading={isLoading}
          error={error}
        />
      );
  }
}
