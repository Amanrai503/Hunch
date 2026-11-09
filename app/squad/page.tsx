"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Users,
  PlusCircle,
  LogIn,
  ShieldAlert,
  Trophy,
  Zap,
  ArrowRight,
  Check,
} from "lucide-react";

export default function SquadLobbyPage() {
  const router = useRouter();
  const [roomName, setRoomName] = useState("Game Night Session");
  const [joinCode, setJoinCode] = useState("");
  const [coopOnly, setCoopOnly] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    setError(null);

    try {
      const res = await fetch("/api/squads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: roomName || "Game Night Session",
          coopOnly,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to create room");
      }

      const data = await res.json();
      router.push(`/squad/${data.code}`);
    } catch {
      // Offline fallback: generate client room code
      const fallbackCode = `SQ-${Math.floor(1000 + Math.random() * 9000)}`;
      router.push(`/squad/${fallbackCode}`);
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = joinCode.trim().toUpperCase();
    if (!cleanCode) {
      setError("Please enter a room code (e.g. SQ-1234)");
      return;
    }
    router.push(`/squad/${cleanCode}`);
  };

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-12">
      {/* Hero Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-accent/20 bg-accent/5 px-3 py-1 text-xs font-semibold text-accent">
          <Users className="h-3.5 w-3.5" />
          <span>Realtime Multiplayer Decider</span>
        </div>
        <h1 className="font-heading text-4xl sm:text-5xl font-black text-ink tracking-tight">
          Squad Game Night
        </h1>
        <p className="text-sm sm:text-base text-muted max-w-2xl mx-auto leading-relaxed">
          End the 45-minute argument of &ldquo;I don&apos;t care, what do you want to play?&rdquo;
          Vote on candidate games with your squad in real time. Pick favorites, pass on the rest,
          and use your single veto tactically.
        </p>
      </div>

      {/* Main Action Cards: Create vs Join */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {/* Create Room */}
        <div className="rounded-2xl border border-line bg-surface p-6 sm:p-8 shadow-xs flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="h-10 w-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center">
              <PlusCircle className="h-6 w-6" />
            </div>
            <div>
              <h2 className="font-heading text-xl font-bold text-ink">Host a Game Night</h2>
              <p className="text-xs text-muted mt-1 leading-relaxed">
                Generate a live room code, invite your friends, and start swiping through candidate games.
              </p>
            </div>

            <form onSubmit={handleCreateRoom} className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-ink">Room Name</label>
                <input
                  type="text"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  placeholder="e.g. Friday Co-op Mayhem"
                  className="w-full px-3.5 py-2.5 text-xs bg-bg border border-line rounded-lg text-ink placeholder:text-muted focus:outline-hidden focus:ring-1 focus:ring-accent"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="coop-filter"
                  checked={coopOnly}
                  onChange={(e) => setCoopOnly(e.target.checked)}
                  className="h-4 w-4 rounded-sm border-line text-accent focus:ring-accent accent-accent"
                />
                <label htmlFor="coop-filter" className="text-xs text-ink cursor-pointer select-none">
                  Filter for Multiplayer & Co-op games only
                </label>
              </div>

              <button
                type="submit"
                disabled={isCreating}
                className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold text-white bg-accent hover:bg-accent-hover shadow-xs transition-all disabled:opacity-50 cursor-pointer"
              >
                {isCreating ? "Creating Room..." : "Create Room & Invite Friends"}
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          </div>

          <div className="text-[11px] text-muted border-t border-line/60 pt-3 flex items-center gap-2">
            <Zap className="h-3.5 w-3.5 text-accent" />
            <span>Generates an instant 6-digit room code for your party.</span>
          </div>
        </div>

        {/* Join Room */}
        <div className="rounded-2xl border border-line bg-surface p-6 sm:p-8 shadow-xs flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="h-10 w-10 rounded-xl bg-section text-ink flex items-center justify-center">
              <LogIn className="h-6 w-6" />
            </div>
            <div>
              <h2 className="font-heading text-xl font-bold text-ink">Join With Code</h2>
              <p className="text-xs text-muted mt-1 leading-relaxed">
                Has your friend already started a session? Enter their 6-character room code to jump right into the lobby.
              </p>
            </div>

            <form onSubmit={handleJoinRoom} className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-ink">Room Code</label>
                <input
                  type="text"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="e.g. SQ-4821"
                  maxLength={10}
                  className="w-full px-3.5 py-2.5 text-center font-heading text-lg font-black tracking-widest uppercase bg-bg border border-line rounded-lg text-ink placeholder:text-muted placeholder:font-normal placeholder:tracking-normal placeholder:text-xs focus:outline-hidden focus:ring-1 focus:ring-accent"
                />
              </div>

              {error && (
                <p className="text-xs text-accent font-medium">{error}</p>
              )}

              <button
                type="submit"
                className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold text-ink bg-section hover:bg-line/70 border border-line shadow-xs transition-all cursor-pointer"
              >
                Join Squad Room
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          </div>

          <div className="text-[11px] text-muted border-t border-line/60 pt-3 flex items-center justify-between">
            <span>Want to test solo?</span>
            <Link
              href="/squad/SQ-DEMO"
              className="text-xs font-bold text-accent hover:underline flex items-center gap-1"
            >
              Enter Demo Room →
            </Link>
          </div>
        </div>
      </div>

      {/* Rules & Features Explanation */}
      <div className="max-w-4xl mx-auto rounded-2xl border border-line bg-section/40 p-6 sm:p-8 space-y-6">
        <h3 className="font-heading text-lg font-bold text-ink text-center">
          How Squad Rooms Work
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-surface rounded-xl p-4 border border-line/80 space-y-2">
            <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs">
              <div className="h-6 w-6 rounded-md bg-emerald-100 flex items-center justify-center">
                <Check className="h-4 w-4" />
              </div>
              <span>1. Pick or Pass</span>
            </div>
            <p className="text-xs text-muted leading-relaxed">
              Every player votes on a shared queue of recommended games. +1 for Pick, 0 for Pass.
            </p>
          </div>

          <div className="bg-surface rounded-xl p-4 border border-line/80 space-y-2">
            <div className="flex items-center gap-2 text-accent font-bold text-xs">
              <div className="h-6 w-6 rounded-md bg-accent/10 flex items-center justify-center">
                <ShieldAlert className="h-4 w-4 text-accent" />
              </div>
              <span>2. The 1-Veto Rule</span>
            </div>
            <p className="text-xs text-muted leading-relaxed">
              Every player gets strictly <strong>one veto</strong>. A single veto instantly eliminates that game from contention.
            </p>
          </div>

          <div className="bg-surface rounded-xl p-4 border border-line/80 space-y-2">
            <div className="flex items-center gap-2 text-amber-700 font-bold text-xs">
              <div className="h-6 w-6 rounded-md bg-amber-100 flex items-center justify-center">
                <Trophy className="h-4 w-4 text-amber-600" />
              </div>
              <span>3. Live Consensus</span>
            </div>
            <p className="text-xs text-muted leading-relaxed">
              Powered by Supabase Realtime. As votes cast, the top unanimous pick surfaces immediately to launch.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
