"use client";

import Link from "next/link";
import { RankedGameResult } from "@/lib/ranking/types";
import { formatPrice } from "@/lib/utils";
import { FeedbackActions } from "./feedback-actions";
import { Sparkles, Clock, ThumbsUp, Gamepad2 } from "lucide-react";

interface RecommendationCardProps {
  result: RankedGameResult;
  onOpenWhyThis: (result: RankedGameResult) => void;
  onDismiss?: (steamAppId: number, action: string) => void;
}

export function RecommendationCard({
  result,
  onOpenWhyThis,
  onDismiss,
}: RecommendationCardProps) {
  const { game, totalScore, factors, reasons } = result;

  const hoursToBeat =
    game.estimatedHoursToBeat ||
    (game.medianPlaytimeMinutes > 0 ? Math.round(game.medianPlaytimeMinutes / 60) : null);

  const isDeckVerified = game.steamDeckCompatibility === "verified";

  return (
    <div className="group relative rounded-xl border border-line bg-surface hover:border-muted/80 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden">
      {/* Top Artwork & Badges */}
      <div>
        <div className="relative aspect-16/9 w-full bg-section overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={
              game.headerImage ||
              `https://shared.steamstatic.com/store_item_assets/steam/apps/${game.steamAppId}/header.jpg`
            }
            alt={game.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={(e) => {
              const target = e.currentTarget;
              const fallbackUrl = `https://steamcdn-a.akamaihd.net/steam/apps/${game.steamAppId}/header.jpg`;
              if (target.src !== fallbackUrl) {
                target.src = fallbackUrl;
              }
            }}
          />

          {/* Match Score Badge */}
          <div className="absolute top-2.5 left-2.5">
            <span className="inline-flex items-center gap-1 rounded-md bg-accent px-2.5 py-1 text-xs font-heading font-black text-white shadow-sm">
              <Sparkles className="h-3 w-3" />
              {totalScore}% Match
            </span>
          </div>

          {/* Pricing & Discount Badge */}
          <div className="absolute bottom-2.5 right-2.5 flex items-center gap-1.5">
            {game.discountPercent > 0 && (
              <span className="rounded-md bg-emerald-700 px-2 py-0.5 text-[11px] font-black text-white shadow-xs">
                -{game.discountPercent}%
              </span>
            )}
            <span className="rounded-md bg-ink/90 backdrop-blur-xs px-2.5 py-0.5 text-xs font-bold text-white shadow-xs">
              {formatPrice(game.priceFinalCents)}
            </span>
          </div>

          {/* Steam Deck Verified Badge */}
          {isDeckVerified && (
            <div
              className="absolute top-2.5 right-2.5 bg-ink/80 backdrop-blur-xs text-white p-1 rounded-md shadow-xs"
              title="Steam Deck Verified"
            >
              <Gamepad2 className="h-3.5 w-3.5 text-accent" />
            </div>
          )}
        </div>

        {/* Content Section */}
        <div className="p-4 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <Link
              href={`/games/${game.steamAppId}`}
              className="font-heading text-base font-bold text-ink hover:text-accent transition-colors line-clamp-1"
            >
              {game.name}
            </Link>
            <FeedbackActions
              steamAppId={game.steamAppId}
              gameName={game.name}
              onDismiss={(action) => onDismiss && onDismiss(game.steamAppId, action)}
            />
          </div>

          {/* Metadata Chips: Playtime & Reviews */}
          <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted">
            {hoursToBeat && (
              <span className="inline-flex items-center gap-1 bg-section px-2 py-0.5 rounded-md">
                <Clock className="h-3 w-3 text-muted" />
                ~{hoursToBeat}h to beat
              </span>
            )}

            {game.totalReviews > 0 && (
              <span className="inline-flex items-center gap-1 bg-section px-2 py-0.5 rounded-md">
                <ThumbsUp className="h-3 w-3 text-muted" />
                {game.steamReviewScore || Math.round((game.positiveReviews / game.totalReviews) * 100)}%
              </span>
            )}

            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                factors.regretRisk.riskRating === "low"
                  ? "bg-emerald-100 text-emerald-800"
                  : factors.regretRisk.riskRating === "medium"
                  ? "bg-amber-100 text-amber-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              {factors.regretRisk.riskRating} regret risk
            </span>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5 pt-0.5">
            {game.tags.slice(0, 3).map((t) => (
              <span
                key={t.tag}
                className="text-[10px] font-medium bg-bg text-muted border border-line px-2 py-0.5 rounded-md"
              >
                {t.tag}
              </span>
            ))}
          </div>

          {/* Top Explanation Bullet Point */}
          {reasons.length > 0 && (
            <p className="text-xs text-ink/80 pt-1 line-clamp-2 leading-relaxed">
              <span className="text-accent font-bold mr-1">Why:</span>
              {reasons[0]}
            </p>
          )}
        </div>
      </div>

      {/* Card Footer: "Why this?" button & Game link */}
      <div className="p-4 pt-0 border-t border-line/60 mt-3 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => onOpenWhyThis(result)}
          className="flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-bold text-accent bg-accent/5 hover:bg-accent/10 border border-accent/20 transition-colors"
        >
          <Sparkles className="h-3.5 w-3.5" />
          Why this?
        </button>

        <Link
          href={`/games/${game.steamAppId}`}
          className="py-1.5 px-3 rounded-lg text-xs font-semibold text-muted hover:text-ink hover:bg-section transition-colors"
        >
          Details
        </Link>
      </div>
    </div>
  );
}
