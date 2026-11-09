"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { RankedGameResult } from "@/lib/ranking/types";
import { RecommendationCard } from "@/components/recommendations/recommendation-card";
import { WhyThisDrawer } from "@/components/recommendations/why-this-drawer";
import { LoadingState } from "@/components/states/loading-state";
import { EmptyState } from "@/components/states/empty-state";
import { Sparkles, SlidersHorizontal, Gamepad2, Tag, Clock, Flame } from "lucide-react";

export default function ForYouPage() {
  const [results, setResults] = useState<RankedGameResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<
    "all" | "deck" | "under20" | "under25h" | "sale"
  >("all");
  const [selectedResult, setSelectedResult] = useState<RankedGameResult | null>(null);

  const changeFilter = (newFilter: "all" | "deck" | "under20" | "under25h" | "sale") => {
    setActiveFilter(newFilter);
    setLoading(true);
  };

  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        const params = new URLSearchParams();
        if (activeFilter === "deck") params.set("deck", "1");
        if (activeFilter === "under20") params.set("maxPrice", "2000");
        if (activeFilter === "under25h") params.set("maxHours", "25");
        if (activeFilter === "sale") params.set("salesOnly", "1");

        const res = await fetch(`/api/recommendations?${params.toString()}`);
        if (!ignore && res.ok) {
          const data = await res.json();
          setResults(data.recommendations || []);
        }
      } catch (err) {
        console.warn("Failed to fetch recommendations:", err);
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
  }, [activeFilter]);

  const handleDismiss = (steamAppId: number) => {
    setResults((prev) => prev.filter((r) => r.game.steamAppId !== steamAppId));
  };

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
      {/* Feed Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-line pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-accent/20 bg-accent/5 px-3 py-1 text-xs font-semibold text-accent mb-2">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Algorithmic Feed</span>
          </div>
          <h1 className="font-heading text-3xl sm:text-4xl font-black text-ink tracking-tight">
            For You
          </h1>
          <p className="text-xs sm:text-sm text-muted mt-1 max-w-xl leading-relaxed">
            Personalized Steam picks ranked by your playtime habits, Wilson review confidence, and
            inverted regret risk.
          </p>
        </div>

        {/* Recalibrate CTA */}
        <Link
          href="/start"
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold text-ink bg-surface hover:bg-section border border-line shadow-2xs transition-colors self-start md:self-auto"
        >
          <SlidersHorizontal className="h-3.5 w-3.5 text-accent" />
          <span>Tune Taste Profile</span>
        </Link>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center gap-2 pb-2">
        <button
          onClick={() => changeFilter("all")}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
            activeFilter === "all"
              ? "bg-accent text-white shadow-2xs"
              : "bg-surface text-ink border border-line hover:bg-section"
          }`}
        >
          <span>All Matches</span>
        </button>

        <button
          onClick={() => changeFilter("deck")}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
            activeFilter === "deck"
              ? "bg-accent text-white shadow-2xs"
              : "bg-surface text-ink border border-line hover:bg-section"
          }`}
        >
          <Gamepad2 className="h-3.5 w-3.5" />
          <span>Deck Verified</span>
        </button>

        <button
          onClick={() => changeFilter("sale")}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
            activeFilter === "sale"
              ? "bg-accent text-white shadow-2xs"
              : "bg-surface text-ink border border-line hover:bg-section"
          }`}
        >
          <Flame className="h-3.5 w-3.5" />
          <span>On Sale</span>
        </button>

        <button
          onClick={() => changeFilter("under20")}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
            activeFilter === "under20"
              ? "bg-accent text-white shadow-2xs"
              : "bg-surface text-ink border border-line hover:bg-section"
          }`}
        >
          <Tag className="h-3.5 w-3.5" />
          <span>Under $20</span>
        </button>

        <button
          onClick={() => changeFilter("under25h")}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
            activeFilter === "under25h"
              ? "bg-accent text-white shadow-2xs"
              : "bg-surface text-ink border border-line hover:bg-section"
          }`}
        >
          <Clock className="h-3.5 w-3.5" />
          <span>&lt; 25 Hours</span>
        </button>
      </div>

      {/* Grid of Recommendation Cards */}
      {loading ? (
        <LoadingState count={6} message="Evaluating 5-factor mathematical rankings..." />
      ) : results.length === 0 ? (
        <EmptyState
          title="No recommendations match this filter"
          description="Try switching back to 'All Matches' or tune your taste preferences."
          onReset={() => setActiveFilter("all")}
          actionHref="/discover"
          actionLabel="Browse Full Discover Catalog"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {results.map((r) => (
            <RecommendationCard
              key={r.game.id}
              result={r}
              onOpenWhyThis={(res) => setSelectedResult(res)}
              onDismiss={handleDismiss}
            />
          ))}
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
