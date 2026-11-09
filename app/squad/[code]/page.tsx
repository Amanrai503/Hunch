"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { supabase } from "@/lib/realtime/supabase";
import { formatPrice } from "@/lib/utils";
import {
  ThumbsUp,
  ThumbsDown,
  ShieldAlert,
  Trophy,
  Copy,
  Check,
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Crown,
  Clock,
  Tag,
} from "lucide-react";

interface Member {
  userId: string;
  displayName: string;
  avatarUrl: string;
  isHost?: boolean;
  hasVetoed?: boolean;
}

interface SquadGame {
  steamAppId: number;
  name: string;
  headerImage: string;
  capsuleImage?: string;
  priceFinal: number; // in cents
  discountPercent: number;
  estimatedHours: number | string;
  tags: string[];
}

export default function SquadRoomPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const resolvedParams = use(params);
  const code = resolvedParams.code.toUpperCase();

  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"vote" | "leaderboard">("vote");
  const [currentIndex, setCurrentIndex] = useState(0);

  // Current user state
  const [currentUser, setCurrentUser] = useState<{
    id: string;
    displayName: string;
    avatarUrl: string;
  }>({
    id: "user_sam",
    displayName: "Sam The Deckbuilder",
    avatarUrl:
      "https://avatars.steamstatic.com/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_full.jpg",
  });

  // Room members
  const [members, setMembers] = useState<Member[]>([
    {
      userId: "user_sam",
      displayName: "Sam The Deckbuilder",
      avatarUrl:
        "https://avatars.steamstatic.com/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_full.jpg",
      isHost: true,
    },
    {
      userId: "user_alex",
      displayName: "Alex (Co-op Buddy)",
      avatarUrl: "https://api.dicebear.com/7.x/bottts/svg?seed=alex",
      isHost: false,
    },
    {
      userId: "user_jordan",
      displayName: "Jordan (Strategist)",
      avatarUrl: "https://api.dicebear.com/7.x/bottts/svg?seed=jordan",
      isHost: false,
    },
  ]);

  // Candidate games for the squad
  const [candidateGames] = useState<SquadGame[]>([
    {
      steamAppId: 1942280, // Brotato
      name: "Brotato",
      headerImage:
        "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1942280/header.jpg",
      priceFinal: 499,
      discountPercent: 0,
      estimatedHours: 25,
      tags: ["Action Roguelike", "Twin Stick Shooter", "Co-op"],
    },
    {
      steamAppId: 1794680, // Vampire Survivors
      name: "Vampire Survivors",
      headerImage:
        "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1794680/header.jpg",
      priceFinal: 499,
      discountPercent: 0,
      estimatedHours: 40,
      tags: ["Action Roguelike", "Bullet Hell", "Local Co-Op"],
    },
    {
      steamAppId: 2379780, // Balatro
      name: "Balatro",
      headerImage:
        "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/2379780/header.jpg",
      priceFinal: 1499,
      discountPercent: 10,
      estimatedHours: 50,
      tags: ["Roguelike Deckbuilder", "Card Battler", "Strategy"],
    },
    {
      steamAppId: 286160, // Tabletop Simulator
      name: "Tabletop Simulator",
      headerImage:
        "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/286160/header.jpg",
      priceFinal: 1999,
      discountPercent: 50,
      estimatedHours: 100,
      tags: ["Multiplayer", "Tabletop", "Board Game"],
    },
    {
      steamAppId: 1145360, // Hades
      name: "Hades",
      headerImage:
        "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1145360/header.jpg",
      priceFinal: 2499,
      discountPercent: 0,
      estimatedHours: 35,
      tags: ["Action Roguelike", "Hack and Slash", "Great Soundtrack"],
    },
    {
      steamAppId: 588650, // Dead Cells
      name: "Dead Cells",
      headerImage:
        "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/588650/header.jpg",
      priceFinal: 2499,
      discountPercent: 50,
      estimatedHours: 30,
      tags: ["Metroidvania", "Roguelite", "Pixel Graphics"],
    },
  ]);

  // Aggregate votes: steamAppId -> { picks: number, passes: number, vetoed: boolean, vetoedBy?: string }
  const [tally, setTally] = useState<
    Record<
      number,
      {
        picks: number;
        passes: number;
        vetoed: boolean;
        vetoedBy?: string;
      }
    >
  >({
    1942280: { picks: 2, passes: 0, vetoed: false },
    1794680: { picks: 2, passes: 1, vetoed: false },
    2379780: { picks: 3, passes: 0, vetoed: false },
    286160: { picks: 1, passes: 1, vetoed: false },
    1145360: { picks: 1, passes: 2, vetoed: false },
    588650: { picks: 0, passes: 2, vetoed: false },
  });

  // Current user's recorded votes: steamAppId -> "pick" | "pass" | "veto"
  const [userVotes, setUserVotes] = useState<Record<number, "pick" | "pass" | "veto">>({});
  const [hasUsedVeto, setHasUsedVeto] = useState(false);
  const [vetoAlert, setVetoAlert] = useState<string | null>(null);

  // Initialize and load user profile
  useEffect(() => {
    async function loadUser() {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          if (data.user) {
            setCurrentUser({
              id: data.user.id || data.user.steamId,
              displayName: data.user.displayName,
              avatarUrl: data.user.avatarUrl,
            });
          }
        }
      } catch {
        // use default Sam fixture
      }
    }
    loadUser();
  }, []);

  // Connect to Supabase Realtime channel
  useEffect(() => {
    const channelName = `squad:${code}`;
    const channel = supabase.channel(channelName, {
      config: {
        broadcast: { ack: false },
        presence: { key: currentUser.id },
      },
    });

    // Track presence
    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        const activeMembers: Member[] = [];
        for (const key of Object.keys(state)) {
          const presences = state[key] as unknown as {
            displayName?: string;
            avatarUrl?: string;
            isHost?: boolean;
          }[];
          if (presences && presences.length > 0) {
            const p = presences[0];
            activeMembers.push({
              userId: key,
              displayName: p.displayName || `Member ${key.slice(0, 4)}`,
              avatarUrl:
                p.avatarUrl ||
                `https://api.dicebear.com/7.x/bottts/svg?seed=${key}`,
              isHost: p.isHost || false,
            });
          }
        }
        if (activeMembers.length > 0) {
          setMembers(activeMembers);
        }
      })
      .on("broadcast", { event: "squad-vote" }, ({ payload }) => {
        if (!payload) return;
        const { steamAppId, vote, voterName } = payload;

        setTally((prev) => {
          const current = prev[steamAppId] || {
            picks: 0,
            passes: 0,
            vetoed: false,
          };
          if (vote === "veto") {
            return {
              ...prev,
              [steamAppId]: {
                ...current,
                vetoed: true,
                vetoedBy: voterName,
              },
            };
          } else if (vote === "pick") {
            return {
              ...prev,
              [steamAppId]: {
                ...current,
                picks: current.picks + 1,
              },
            };
          } else {
            return {
              ...prev,
              [steamAppId]: {
                ...current,
                passes: current.passes + 1,
              },
            };
          }
        });
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({
            displayName: currentUser.displayName,
            avatarUrl: currentUser.avatarUrl,
            isHost: true,
          });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [code, currentUser]);

  const handleCopyCode = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const castVote = async (vote: "pick" | "pass" | "veto") => {
    const currentGame = candidateGames[currentIndex];
    if (!currentGame) return;

    // Enforce 1-veto constraint
    if (vote === "veto" && hasUsedVeto && userVotes[currentGame.steamAppId] !== "veto") {
      setVetoAlert(
        "You have already used your single veto for this squad session. You cannot veto more than one game."
      );
      setTimeout(() => setVetoAlert(null), 4000);
      return;
    }

    if (vote === "veto") {
      setHasUsedVeto(true);
    }

    // Update local user state
    setUserVotes((prev) => ({
      ...prev,
      [currentGame.steamAppId]: vote,
    }));

    // Update local tally
    setTally((prev) => {
      const current = prev[currentGame.steamAppId] || {
        picks: 0,
        passes: 0,
        vetoed: false,
      };

      if (vote === "veto") {
        return {
          ...prev,
          [currentGame.steamAppId]: {
            ...current,
            vetoed: true,
            vetoedBy: currentUser.displayName,
          },
        };
      } else if (vote === "pick") {
        return {
          ...prev,
          [currentGame.steamAppId]: {
            ...current,
            picks: current.picks + 1,
          },
        };
      } else {
        return {
          ...prev,
          [currentGame.steamAppId]: {
            ...current,
            passes: current.passes + 1,
          },
        };
      }
    });

    // Broadcast realtime event
    try {
      const channel = supabase.channel(`squad:${code}`);
      await channel.send({
        type: "broadcast",
        event: "squad-vote",
        payload: {
          steamAppId: currentGame.steamAppId,
          vote,
          voterName: currentUser.displayName,
        },
      });
    } catch {
      // offline fallback
    }

    // Persist to server API
    fetch(`/api/squads/${code}/vote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        steamAppId: currentGame.steamAppId,
        vote,
      }),
    }).catch(() => {});

    // Advance to next game in queue
    if (currentIndex < candidateGames.length - 1) {
      setCurrentIndex((idx) => idx + 1);
    }
  };

  const simulateFriendVotes = () => {
    // Add votes from simulated players
    setTally((prev) => {
      return {
        ...prev,
        2379780: { picks: (prev[2379780]?.picks || 0) + 2, passes: 0, vetoed: false },
        1942280: { picks: (prev[1942280]?.picks || 0) + 1, passes: 1, vetoed: false },
        286160: {
          picks: prev[286160]?.picks || 0,
          passes: prev[286160]?.passes || 0,
          vetoed: true,
          vetoedBy: "Jordan",
        },
      };
    });
  };

  const currentGame = candidateGames[currentIndex];

  // Calculate sorted rankings for leaderboard
  const scoredGames = candidateGames
    .map((g) => {
      const t = tally[g.steamAppId] || { picks: 0, passes: 0, vetoed: false };
      // Consensus score: +2 per pick, -1 per pass. Vetoed games drop to bottom.
      const score = t.vetoed ? -9999 : t.picks * 2 - t.passes;
      return {
        ...g,
        picks: t.picks,
        passes: t.passes,
        vetoed: t.vetoed,
        vetoedBy: t.vetoedBy,
        score,
      };
    })
    .sort((a, b) => b.score - a.score);

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
      {/* Squad Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-line pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-heading text-xs font-black uppercase tracking-wider bg-accent text-white px-2.5 py-0.5 rounded-md">
              Room {code}
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md font-semibold">
              <span className="h-2 w-2 rounded-full bg-emerald-700 animate-pulse" />
              Live Presence ({members.length} Online)
            </span>
          </div>
          <h1 className="font-heading text-2xl sm:text-3xl font-black text-ink">
            Friday Night Squad Decider
          </h1>
        </div>

        {/* Action Controls: Share Link & Simulate */}
        <div className="flex items-center gap-2">
          <button
            onClick={simulateFriendVotes}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-ink bg-section hover:bg-line/70 border border-line rounded-lg transition-colors cursor-pointer"
            title="Simulate votes from other squad members"
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-600" />
            <span className="hidden sm:inline">Simulate Peers</span>
          </button>

          <button
            onClick={handleCopyCode}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-accent hover:bg-accent-hover rounded-lg shadow-2xs transition-colors cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5" />
                <span>Link Copied!</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                <span>Invite Friends</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Members Presence Bar */}
      <div className="flex items-center gap-3 overflow-x-auto py-1">
        <span className="text-xs font-bold text-muted uppercase tracking-wider shrink-0">
          In Room:
        </span>
        <div className="flex items-center gap-2">
          {members.map((m) => (
            <div
              key={m.userId}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-line bg-surface text-xs font-medium text-ink shadow-2xs shrink-0"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={m.avatarUrl}
                alt={m.displayName}
                className="h-5 w-5 rounded-full object-cover border border-line"
              />
              <span className="truncate max-w-[110px]">{m.displayName}</span>
              {m.isHost && (
                <Crown className="h-3 w-3 text-amber-500 fill-amber-500 shrink-0" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Veto Warning Banner */}
      {vetoAlert && (
        <div className="rounded-xl border border-accent bg-accent/10 p-4 text-xs font-bold text-accent flex items-center gap-2 animate-in fade-in">
          <ShieldAlert className="h-4 w-4 shrink-0" />
          <span>{vetoAlert}</span>
        </div>
      )}

      {/* Tab Switcher: Vote Deck vs Consensus Scoreboard */}
      <div className="flex items-center justify-between border-b border-line pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("vote")}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === "vote"
                ? "bg-accent text-white shadow-2xs"
                : "text-muted hover:text-ink hover:bg-section"
            }`}
          >
            <Sparkles className="h-4 w-4" />
            <span>Vote Deck ({currentIndex + 1}/{candidateGames.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("leaderboard")}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === "leaderboard"
                ? "bg-accent text-white shadow-2xs"
                : "text-muted hover:text-ink hover:bg-section"
            }`}
          >
            <Trophy className="h-4 w-4" />
            <span>Live Consensus Scoreboard</span>
          </button>
        </div>

        {/* 1-Veto Status Indicator */}
        <div className="hidden sm:inline-flex items-center gap-1.5 text-xs">
          <span className="text-muted">Your Veto:</span>
          {hasUsedVeto ? (
            <span className="font-bold text-accent bg-accent/10 px-2 py-0.5 rounded-md border border-accent/20">
              1 / 1 Used
            </span>
          ) : (
            <span className="font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md border border-emerald-300">
              Available (1 remaining)
            </span>
          )}
        </div>
      </div>

      {/* TAB 1: SWIPE / VOTE VIEW */}
      {activeTab === "vote" && currentGame && (
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Progress Indicator */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-muted">
              <span>Game {currentIndex + 1} of {candidateGames.length}</span>
              <span>{Math.round(((currentIndex + 1) / candidateGames.length) * 100)}% complete</span>
            </div>
            <div className="h-1.5 w-full bg-section rounded-full overflow-hidden">
              <div
                className="h-full bg-accent transition-all duration-300"
                style={{
                  width: `${((currentIndex + 1) / candidateGames.length) * 100}%`,
                }}
              />
            </div>
          </div>

          {/* Active Game Card */}
          <div className="rounded-2xl border border-line bg-surface overflow-hidden shadow-xs space-y-4">
            <div className="relative aspect-video w-full bg-section overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={currentGame.headerImage}
                alt={currentGame.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-3 right-3 bg-surface/90 backdrop-blur-xs px-2.5 py-1 rounded-md text-xs font-bold text-ink border border-line">
                {formatPrice(currentGame.priceFinal)}
              </div>

              {tally[currentGame.steamAppId]?.vetoed && (
                <div className="absolute inset-0 bg-ink/75 flex flex-col items-center justify-center p-4 text-center">
                  <ShieldAlert className="h-10 w-10 text-accent mb-2" />
                  <span className="font-heading text-xl font-black text-white uppercase tracking-wider">
                    VETOED
                  </span>
                  <p className="text-xs text-white/80 mt-1">
                    Eliminated by {tally[currentGame.steamAppId].vetoedBy || "a squad member"}
                  </p>
                </div>
              )}
            </div>

            <div className="p-6 space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-heading text-2xl font-black text-ink">
                    {currentGame.name}
                  </h2>
                  <div className="flex items-center gap-3 text-xs text-muted mt-1">
                    <span className="flex items-center gap-1 font-semibold text-accent">
                      <Clock className="h-3.5 w-3.5" />
                      ~{currentGame.estimatedHours}h to beat
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Tag className="h-3.5 w-3.5" />
                      {currentGame.tags.join(" • ")}
                    </span>
                  </div>
                </div>

                <Link
                  href={`/games/${currentGame.steamAppId}`}
                  target="_blank"
                  className="p-2 text-muted hover:text-accent rounded-lg hover:bg-section transition-colors"
                  title="View full Hunch analysis"
                >
                  <ExternalLink className="h-4 w-4" />
                </Link>
              </div>

              {/* Live Room Votes on this Card */}
              <div className="rounded-xl border border-line/70 bg-bg p-3 flex items-center justify-between text-xs">
                <span className="text-muted font-medium">Room Votes:</span>
                <div className="flex items-center gap-3 font-bold">
                  <span className="text-emerald-800 flex items-center gap-1">
                    <ThumbsUp className="h-3.5 w-3.5" />
                    {tally[currentGame.steamAppId]?.picks || 0} Picks
                  </span>
                  <span className="text-muted flex items-center gap-1">
                    <ThumbsDown className="h-3.5 w-3.5" />
                    {tally[currentGame.steamAppId]?.passes || 0} Passes
                  </span>
                  {tally[currentGame.steamAppId]?.vetoed && (
                    <span className="text-accent flex items-center gap-1">
                      <ShieldAlert className="h-3.5 w-3.5" />
                      Vetoed
                    </span>
                  )}
                </div>
              </div>

              {/* Tactile Voting Action Buttons */}
              <div className="grid grid-cols-3 gap-3 pt-2">
                {/* PASS */}
                <button
                  onClick={() => castVote("pass")}
                  className={`flex flex-col items-center justify-center gap-1.5 p-3.5 rounded-xl border font-bold text-xs transition-all cursor-pointer ${
                    userVotes[currentGame.steamAppId] === "pass"
                      ? "bg-section border-line text-ink font-black ring-2 ring-ink/20"
                      : "bg-surface border-line text-muted hover:text-ink hover:bg-section"
                  }`}
                >
                  <ThumbsDown className="h-5 w-5" />
                  <span>Pass (Skip)</span>
                </button>

                {/* PICK */}
                <button
                  onClick={() => castVote("pick")}
                  className={`flex flex-col items-center justify-center gap-1.5 p-3.5 rounded-xl border font-bold text-xs transition-all cursor-pointer ${
                    userVotes[currentGame.steamAppId] === "pick"
                      ? "bg-emerald-600 text-white border-emerald-600 ring-2 ring-emerald-400/40"
                      : "bg-emerald-50 text-emerald-900 border-emerald-300 hover:bg-emerald-100"
                  }`}
                >
                  <ThumbsUp className="h-5 w-5" />
                  <span>Pick (+1)</span>
                </button>

                {/* VETO */}
                <button
                  onClick={() => castVote("veto")}
                  disabled={hasUsedVeto && userVotes[currentGame.steamAppId] !== "veto"}
                  className={`flex flex-col items-center justify-center gap-1.5 p-3.5 rounded-xl border font-bold text-xs transition-all cursor-pointer ${
                    userVotes[currentGame.steamAppId] === "veto"
                      ? "bg-accent text-white border-accent ring-2 ring-accent/40"
                      : hasUsedVeto
                      ? "bg-section/50 border-line text-muted/50 cursor-not-allowed"
                      : "bg-accent/5 text-accent border-accent/30 hover:bg-accent/15"
                  }`}
                  title={
                    hasUsedVeto
                      ? "You have already used your single veto for this squad session"
                      : "Eliminate this game entirely (Max 1 veto per player)"
                  }
                >
                  <ShieldAlert className="h-5 w-5" />
                  <span>{hasUsedVeto && userVotes[currentGame.steamAppId] !== "veto" ? "Veto Used" : "Veto (Strike)"}</span>
                </button>
              </div>

              {/* Prev / Next Navigation Controls */}
              <div className="flex items-center justify-between pt-2 border-t border-line/60">
                <button
                  onClick={() => setCurrentIndex((idx) => Math.max(0, idx - 1))}
                  disabled={currentIndex === 0}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-muted hover:text-ink disabled:opacity-40"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous Game
                </button>

                <button
                  onClick={() => setCurrentIndex((idx) => Math.min(candidateGames.length - 1, idx + 1))}
                  disabled={currentIndex === candidateGames.length - 1}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-muted hover:text-ink disabled:opacity-40"
                >
                  Next Game
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: LIVE CONSENSUS SCOREBOARD */}
      {activeTab === "leaderboard" && (
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="rounded-xl border border-line bg-[#FAF6EC] p-4 text-xs text-ink flex items-center justify-between">
            <div className="space-y-0.5">
              <strong>Consensus Rule:</strong> Ranked by squad picks. Games with a veto are
              disqualified and moved to the eliminated section.
            </div>
            <Trophy className="h-5 w-5 text-amber-600 shrink-0" />
          </div>

          <div className="space-y-3">
            {scoredGames.map((game, index) => {
              const isWinner = index === 0 && !game.vetoed;

              return (
                <div
                  key={game.steamAppId}
                  className={`rounded-xl border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
                    game.vetoed
                      ? "bg-bg/60 border-line/60 opacity-60 line-through"
                      : isWinner
                      ? "bg-surface border-amber-300 ring-2 ring-amber-400/30 shadow-xs"
                      : "bg-surface border-line shadow-2xs"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    {/* Rank Number / Trophy */}
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg shrink-0 font-heading font-black text-sm">
                      {isWinner ? (
                        <Trophy className="h-6 w-6 text-amber-500" />
                      ) : (
                        <span className="text-muted">#{index + 1}</span>
                      )}
                    </div>

                    {/* Capsule Image */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={
                        game.headerImage ||
                        `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${game.steamAppId}/capsule_231x87.jpg`
                      }
                      alt={game.name}
                      className="w-20 h-auto rounded-md object-cover border border-line shrink-0"
                    />

                    {/* Details */}
                    <div>
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/games/${game.steamAppId}`}
                          className="font-heading text-sm font-bold text-ink hover:text-accent transition-colors"
                        >
                          {game.name}
                        </Link>
                        {isWinner && (
                          <span className="bg-amber-100 text-amber-800 text-[10px] font-black uppercase px-2 py-0.5 rounded-md">
                            Squad Favorite
                          </span>
                        )}
                        {game.vetoed && (
                          <span className="bg-accent/10 text-accent text-[10px] font-black uppercase px-2 py-0.5 rounded-md no-underline">
                            Vetoed by {game.vetoedBy || "Peer"}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-muted space-x-2 mt-0.5 no-underline">
                        <span>{formatPrice(game.priceFinal)}</span>
                        <span>•</span>
                        <span>~{game.estimatedHours}h</span>
                        <span>•</span>
                        <span>{game.tags.slice(0, 2).join(", ")}</span>
                      </div>
                    </div>
                  </div>

                  {/* Score Tally Pill */}
                  <div className="flex items-center gap-3 shrink-0 no-underline self-end sm:self-center">
                    <div className="text-right">
                      <div className="text-xs font-bold text-ink">
                        {game.picks} Picks / {game.passes} Passes
                      </div>
                      <div className="text-[10px] text-muted">
                        Score: {game.vetoed ? "DISQUALIFIED" : game.score}
                      </div>
                    </div>

                    <a
                      href={`https://store.steampowered.com/app/${game.steamAppId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-accent hover:bg-accent-hover transition-colors shadow-2xs inline-flex items-center gap-1"
                    >
                      <span>Play</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
