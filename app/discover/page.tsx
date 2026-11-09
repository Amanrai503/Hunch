"use client";

import { useState, useEffect } from "react";
import { RankedGameResult } from "@/lib/ranking/types";
import { RecommendationCard } from "@/components/recommendations/recommendation-card";
import { WhyThisDrawer } from "@/components/recommendations/why-this-drawer";
import { LoadingState } from "@/components/states/loading-state";
import { EmptyState } from "@/components/states/empty-state";
import { Search, Compass, ArrowUpDown } from "lucide-react";

const DISCOVER_GENRES = [
  "All",
  "Roguelike Deckbuilder",
  "Action Roguelike",
  "RPG",
  "Strategy",
  "Metroidvania",
  "Souls-like",
  "Co-op",
  "Indie",
  "Story Rich",
  "Pixel Graphics",
];

export default function DiscoverPage() {
  const [results, setResults] = useState<RankedGameResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("All");
  const [deckOnly, setDeckOnly] = useState(false);
  const [salesOnly, setSalesOnly] = useState(false);
  const [sortBy, setSortBy] = useState<"match" | "review" | "discount" | "time">("match");
  const [selectedResult, setSelectedResult] = useState<RankedGameResult | null>(null);

  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        const params = new URLSearchParams();
        if (selectedGenre !== "All") params.set("tag", selectedGenre);
        if (deckOnly) params.set("deck", "1");
        if (salesOnly) params.set("salesOnly", "1");
        if (searchQuery.trim()) params.set("q", searchQuery.trim());

        const res = await fetch(`/api/recommendations?${params.toString()}`);
        if (!ignore && res.ok) {
          const data = await res.json();
          setResults(data.recommendations || []);
        }
      } catch (err) {
        console.warn("Failed to fetch discover games:", err);
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    load();
    return () => {
      ignore = true;
    };
  }, [selectedGenre, deckOnly, salesOnly, searchQuery]);

  // Client-side sort
  const sortedResults = [...results].sort((a, b) => {
    if (sortBy === "match") return b.totalScore - a.totalScore;
    if (sortBy === "review") return b.factors.reviewQuality.score - a.factors.reviewQuality.score;
    if (sortBy === "discount") return b.game.discountPercent - a.game.discountPercent;
    if (sortBy === "time") {
      const hA = a.game.estimatedHoursToBeat || a.game.medianPlaytimeMinutes / 60;
      const hB = b.game.estimatedHoursToBeat || b.game.medianPlaytimeMinutes / 60;
      return hA - hB;
    }
    return 0;
  });

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
      {/* Page Header */}
      <div className="border-b border-line pb-6 space-y-2">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-accent/20 bg-accent/5 px-3 py-1 text-xs font-semibold text-accent">
          <Compass className="h-3.5 w-3.5" />
          <span>Catalog Explorer</span>
        </div>
        <h1 className="font-heading text-3xl sm:text-4xl font-black text-ink tracking-tight">
          Discover
        </h1>
        <p className="text-xs sm:text-sm text-muted max-w-xl leading-relaxed">
          Explore top-rated Steam games with transparent ratings, Wilson review confidence, and
          playtime estimates.
        </p>
      </div>

      {/* Search & Filter Controls */}
      <div className="rounded-xl border border-line bg-surface p-4 space-y-4 shadow-2xs">
        <div className="flex flex-col md:flex-row items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by game title, genre, or tag..."
              className="w-full pl-9 pr-4 py-2 text-xs bg-bg border border-line rounded-lg text-ink placeholder:text-muted focus:outline-hidden focus:ring-1 focus:ring-accent"
            />
          </div>

          {/* Quick Toggles */}
          <div className="flex items-center gap-2 self-stretch sm:self-auto justify-between sm:justify-start">
            <button
              onClick={() => setDeckOnly(!deckOnly)}
              className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-all ${
                deckOnly
                  ? "bg-accent text-white border-accent shadow-2xs"
                  : "bg-bg text-ink border-line hover:bg-section"
              }`}
            >
              Deck Verified
            </button>

            <button
              onClick={() => setSalesOnly(!salesOnly)}
              className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-all ${
                salesOnly
                  ? "bg-accent text-white border-accent shadow-2xs"
                  : "bg-bg text-ink border-line hover:bg-section"
              }`}
            >
              On Sale
            </button>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-1.5 pl-2 border-l border-line">
              <ArrowUpDown className="h-3.5 w-3.5 text-muted" />
              <select
                value={sortBy}
                onChange={(e) =>
                  setSortBy(
                    e.target.value as "match" | "review" | "discount" | "time"
                  )
                }
                className="py-1.5 px-2 text-xs bg-bg border border-line rounded-lg text-ink font-medium focus:outline-hidden"
              >
                <option value="match">Sort by: Match %</option>
                <option value="review">Sort by: Review Quality</option>
                <option value="discount">Sort by: Deepest Discount</option>
                <option value="time">Sort by: Quickest to Beat</option>
              </select>
            </div>
          </div>
        </div>

        {/* Genre Tags Carousel / Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 no-scrollbar">
          {DISCOVER_GENRES.map((genre) => (
            <button
              key={genre}
              onClick={() => setSelectedGenre(genre)}
              className={`shrink-0 px-3 py-1 rounded-md text-xs font-medium transition-all ${
                selectedGenre === genre
                  ? "bg-ink text-white font-semibold"
                  : "bg-bg text-muted hover:text-ink border border-line"
              }`}
            >
              {genre}
            </button>
          ))}
        </div>
      </div>

      {/* Results Grid */}
      {loading ? (
        <LoadingState count={9} message="Filtering games and computing factor breakdowns..." />
      ) : sortedResults.length === 0 ? (
        <EmptyState
          title="No games found matching your search"
          description="Try broadening your search term, clearing tag filters, or unchecking Deck Verified."
          onReset={() => {
            setSelectedGenre("All");
            setSearchQuery("");
            setDeckOnly(false);
            setSalesOnly(false);
          }}
        />
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-muted px-1">
            <span>Showing {sortedResults.length} curated games</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedResults.map((r) => (
              <RecommendationCard
                key={r.game.id}
                result={r}
                onOpenWhyThis={(res) => setSelectedResult(res)}
                onDismiss={(steamAppId) =>
                  setResults((prev) => prev.filter((item) => item.game.steamAppId !== steamAppId))
                }
              />
            ))}
          </div>
        </div>
      )}

      {/* Slide-Out "Why This?" Inspection Drawer */}
      <WhyThisDrawer
        result={selectedResult}
        isOpen={Boolean(selectedResult)}
        onClose={() => setSelectedResult(null)}
      />
    </div>
  );
}
