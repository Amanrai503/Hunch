"use client";

import { useState } from "react";
import Link from "next/link";
import { formatPlaytime } from "@/lib/utils";
import { SAMPLE_GAMES } from "@/lib/sample-data/sample-games";
import {
  Library,
  Bookmark,
  ListPlus,
  Clock,
  ExternalLink,
  ShieldCheck,
  Plus,
  X,
} from "lucide-react";

export default function MyGamesPage() {
  const [activeTab, setActiveTab] = useState<"library" | "backlog" | "lists">("library");

  // Sample library items mapped to fixtures
  const libraryGames = [
    {
      ...SAMPLE_GAMES[0], // Balatro
      playtimeForeverMinutes: 5700, // 95h
      lastPlayedText: "Yesterday",
      inBacklog: false,
    },
    {
      ...SAMPLE_GAMES[1], // Slay the Spire
      playtimeForeverMinutes: 8700, // 145h
      lastPlayedText: "3 days ago",
      inBacklog: false,
    },
    {
      ...SAMPLE_GAMES[7], // Monster Train
      playtimeForeverMinutes: 2520, // 42h
      lastPlayedText: "Last week",
      inBacklog: false,
    },
    {
      ...SAMPLE_GAMES[6], // Inscryption
      playtimeForeverMinutes: 1080, // 18h
      lastPlayedText: "2 weeks ago",
      inBacklog: true,
    },
    {
      ...SAMPLE_GAMES[2], // Hades
      playtimeForeverMinutes: 2100, // 35h
      lastPlayedText: "Last month",
      inBacklog: false,
    },
    {
      ...SAMPLE_GAMES[4], // Elden Ring
      playtimeForeverMinutes: 150, // 2.5h (backlog!)
      lastPlayedText: "3 months ago",
      inBacklog: true,
    },
    {
      ...SAMPLE_GAMES[9], // Dead Cells
      playtimeForeverMinutes: 1320, // 22h
      lastPlayedText: "2 months ago",
      inBacklog: false,
    },
  ];

  const backlogGames = libraryGames.filter(
    (g) => g.inBacklog || g.playtimeForeverMinutes < 300
  );

  const [customLists, setCustomLists] = useState([
    {
      id: "list_1",
      title: "Deck Verified Travel Queue",
      description: "Perfect games for flights and train rides with long battery life.",
      gameCount: 4,
    },
    {
      id: "list_2",
      title: "Challenging Roguelikes",
      description: "High skill ceiling deckbuilders and action dungeon crawlers.",
      gameCount: 5,
    },
  ]);

  const [showCreateListModal, setShowCreateListModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");

  const handleCreateList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    try {
      const res = await fetch("/api/lists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle, description: newDesc }),
      });
      if (res.ok) {
        const data = await res.json();
        setCustomLists([
          ...customLists,
          {
            id: data.list.id,
            title: data.list.title,
            description: data.list.description || "",
            gameCount: 0,
          },
        ]);
        setNewTitle("");
        setNewDesc("");
        setShowCreateListModal(false);
      }
    } catch {
      // offline fallback
      setCustomLists([
        ...customLists,
        {
          id: `list_${Date.now()}`,
          title: newTitle.trim(),
          description: newDesc.trim(),
          gameCount: 0,
        },
      ]);
      setNewTitle("");
      setNewDesc("");
      setShowCreateListModal(false);
    }
  };

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-line pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-accent/20 bg-accent/5 px-3 py-1 text-xs font-semibold text-accent mb-2">
            <Library className="h-3.5 w-3.5" />
            <span>Library & Backlog Organizer</span>
          </div>
          <h1 className="font-heading text-3xl sm:text-4xl font-black text-ink tracking-tight">
            My Games
          </h1>
          <p className="text-xs sm:text-sm text-muted mt-1 max-w-xl leading-relaxed">
            Organize your owned Steam library, prioritize unplayed backlog gems, and create custom
            lists.
          </p>
        </div>

        {/* Read-only Assurance Badge */}
        <div className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface px-3 py-2 text-xs text-muted">
          <ShieldCheck className="h-4 w-4 text-accent" />
          <span>Local storage only. Never writes to your Steam account.</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-between border-b border-line pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("library")}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === "library"
                ? "bg-accent text-white shadow-2xs"
                : "text-muted hover:text-ink hover:bg-section"
            }`}
          >
            <Library className="h-4 w-4" />
            <span>Steam Library ({libraryGames.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("backlog")}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === "backlog"
                ? "bg-accent text-white shadow-2xs"
                : "text-muted hover:text-ink hover:bg-section"
            }`}
          >
            <Bookmark className="h-4 w-4" />
            <span>Backlog Queue ({backlogGames.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("lists")}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === "lists"
                ? "bg-accent text-white shadow-2xs"
                : "text-muted hover:text-ink hover:bg-section"
            }`}
          >
            <ListPlus className="h-4 w-4" />
            <span>Custom Lists ({customLists.length})</span>
          </button>
        </div>

        {activeTab === "lists" && (
          <button
            onClick={() => setShowCreateListModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-accent hover:bg-accent-hover shadow-2xs transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>New List</span>
          </button>
        )}
      </div>

      {/* Tab Content: Library */}
      {activeTab === "library" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {libraryGames.map((g) => (
            <div
              key={g.steamAppId}
              className="rounded-xl border border-line bg-surface p-4 flex flex-col justify-between space-y-3 shadow-2xs"
            >
              <div className="flex gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={
                    g.capsuleImage ||
                    `https://shared.steamstatic.com/store_item_assets/steam/apps/${g.steamAppId}/capsule_231x87.jpg`
                  }
                  alt={g.name}
                  className="w-24 h-auto rounded-md object-cover border border-line shrink-0"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    const target = e.currentTarget;
                    const fallbackUrl = `https://steamcdn-a.akamaihd.net/steam/apps/${g.steamAppId}/capsule_231x87.jpg`;
                    if (target.src !== fallbackUrl) {
                      target.src = fallbackUrl;
                    }
                  }}
                />
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/games/${g.steamAppId}`}
                    className="font-heading text-sm font-bold text-ink hover:text-accent transition-colors line-clamp-1"
                  >
                    {g.name}
                  </Link>
                  <div className="text-[11px] text-muted space-y-0.5 mt-1">
                    <p className="flex items-center gap-1 font-semibold text-accent">
                      <Clock className="h-3 w-3" />
                      {formatPlaytime(g.playtimeForeverMinutes)} played
                    </p>
                    <p>Last active: {g.lastPlayedText}</p>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-line/60 flex items-center justify-between text-xs">
                <span className="text-[11px] text-muted">
                  {g.tags.slice(0, 2).map((t) => t.tag).join(" • ")}
                </span>
                <a
                  href={`https://store.steampowered.com/app/${g.steamAppId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted hover:text-accent p-1"
                  title="Open in Steam Store"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab Content: Backlog */}
      {activeTab === "backlog" && (
        <div className="space-y-4">
          <div className="rounded-xl border border-line bg-[#FAF6EC] p-4 text-xs text-ink">
            <strong>Backlog Assistant:</strong> These games are in your library with under 5 hours of
            playtime. Pick one to tackle next weekend!
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {backlogGames.map((g) => (
              <div
                key={g.steamAppId}
                className="rounded-xl border border-line bg-surface p-4 flex flex-col justify-between space-y-3 shadow-2xs"
              >
                <div className="flex gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={
                      g.capsuleImage ||
                      `https://shared.steamstatic.com/store_item_assets/steam/apps/${g.steamAppId}/capsule_231x87.jpg`
                    }
                    alt={g.name}
                    className="w-24 h-auto rounded-md object-cover border border-line shrink-0"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      const target = e.currentTarget;
                      const fallbackUrl = `https://steamcdn-a.akamaihd.net/steam/apps/${g.steamAppId}/capsule_231x87.jpg`;
                      if (target.src !== fallbackUrl) {
                        target.src = fallbackUrl;
                      }
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/games/${g.steamAppId}`}
                      className="font-heading text-sm font-bold text-ink hover:text-accent transition-colors line-clamp-1"
                    >
                      {g.name}
                    </Link>
                    <div className="text-[11px] text-muted space-y-0.5 mt-1">
                      <span className="inline-block bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-xs">
                        ~{g.estimatedHoursToBeat}h to beat
                      </span>
                      <p className="mt-1">
                        Current: {formatPlaytime(g.playtimeForeverMinutes)} played
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-line/60 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-muted">
                    {g.steamReviewScore}% Positive
                  </span>
                  <Link
                    href={`/games/${g.steamAppId}`}
                    className="font-bold text-accent text-xs hover:underline"
                  >
                    View Details →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab Content: Custom Lists */}
      {activeTab === "lists" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {customLists.map((list) => (
            <div
              key={list.id}
              className="rounded-xl border border-line bg-surface p-5 flex flex-col justify-between space-y-3 shadow-2xs"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-heading text-base font-bold text-ink">{list.title}</h3>
                  <span className="text-[10px] font-bold uppercase bg-section px-2 py-0.5 rounded-md text-muted">
                    {list.gameCount} Games
                  </span>
                </div>
                <p className="text-xs text-muted leading-relaxed">{list.description}</p>
              </div>

              <div className="pt-3 border-t border-line/60 flex items-center justify-between">
                <span className="text-[11px] text-muted">Stored locally on Hunch</span>
                <span className="text-xs font-semibold text-accent cursor-pointer hover:underline">
                  Manage List →
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create List Modal */}
      {showCreateListModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-xs">
          <form
            onSubmit={handleCreateList}
            className="w-full max-w-md rounded-xl border border-line bg-surface p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between border-b border-line pb-3">
              <h3 className="font-heading text-base font-bold text-ink">Create Custom List</h3>
              <button
                type="button"
                onClick={() => setShowCreateListModal(false)}
                className="p-1 text-muted hover:text-ink"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-ink">List Title</label>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g. Co-op with Friends"
                required
                className="w-full p-2.5 text-xs bg-bg border border-line rounded-md text-ink placeholder:text-muted focus:outline-hidden focus:ring-1 focus:ring-accent"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-ink">Description (optional)</label>
              <textarea
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="What is this list for?"
                rows={3}
                className="w-full p-2.5 text-xs bg-bg border border-line rounded-md text-ink placeholder:text-muted focus:outline-hidden focus:ring-1 focus:ring-accent"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-line">
              <button
                type="button"
                onClick={() => setShowCreateListModal(false)}
                className="px-3 py-1.5 text-xs font-semibold text-muted hover:text-ink"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 text-xs font-bold text-white bg-accent hover:bg-accent-hover rounded-md shadow-2xs transition-colors"
              >
                Create List
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
