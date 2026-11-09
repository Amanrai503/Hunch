import Link from "next/link";
import { notFound } from "next/navigation";
import { SAMPLE_GAMES } from "@/lib/sample-data/sample-games";
import { formatPrice, formatPlaytime } from "@/lib/utils";
import { evaluateReviewQuality } from "@/lib/ranking/factors/review-quality";
import { evaluateRegretRisk } from "@/lib/ranking/factors/regret-risk";
import {
  Sparkles,
  ExternalLink,
  ThumbsUp,
  ShieldCheck,
  Tag,
  Gamepad2,
  ArrowLeft,
} from "lucide-react";
import { FeedbackActions } from "@/components/recommendations/feedback-actions";

export default async function GameDetailPage({
  params,
}: {
  params: Promise<{ appId: string }>;
}) {
  const { appId } = await params;
  const numAppId = Number(appId);

  // Find game in curated sample fixtures
  const game = SAMPLE_GAMES.find((g) => g.steamAppId === numAppId);

  if (!game) {
    notFound();
  }

  const reviewMetrics = evaluateReviewQuality(game.positiveReviews, game.totalReviews);
  const regretMetrics = evaluateRegretRisk(
    game.medianPlaytimeMinutes,
    game.averagePlaytimeMinutes,
    Number(game.estimatedHoursToBeat) || null,
    game.positiveReviews,
    game.totalReviews
  );

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-8">
      {/* Back button */}
      <div>
        <Link
          href="/discover"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-ink transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Catalog</span>
        </Link>
      </div>

      {/* Hero Header */}
      <div className="relative rounded-2xl border border-line bg-surface overflow-hidden shadow-xs">
        <div className="relative aspect-21/9 w-full bg-section">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={
              game.headerImage ||
              `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${game.steamAppId}/header.jpg`
            }
            alt={game.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/40 to-transparent flex items-end p-6 sm:p-8">
            <div className="space-y-2 text-white max-w-2xl">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-md bg-accent px-2.5 py-0.5 text-xs font-heading font-black text-white shadow-xs">
                  <Sparkles className="h-3 w-3" />
                  Top Pick
                </span>
                {game.steamDeckCompatibility === "verified" && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-black/60 backdrop-blur-xs px-2 py-0.5 text-xs font-medium text-white border border-white/20">
                    <Gamepad2 className="h-3 w-3 text-accent" />
                    Deck Verified
                  </span>
                )}
              </div>
              <h1 className="font-heading text-3xl sm:text-4xl font-black tracking-tight">
                {game.name}
              </h1>
            </div>
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="p-6 bg-surface flex flex-wrap items-center justify-between gap-4 border-t border-line">
          <div className="flex items-center gap-3">
            <div className="flex items-baseline gap-2">
              {game.discountPercent > 0 && (
                <span className="rounded-md bg-emerald-700 px-2 py-0.5 text-xs font-black text-white">
                  -{game.discountPercent}%
                </span>
              )}
              <span className="font-heading text-2xl font-black text-ink">
                {formatPrice(game.priceFinal)}
              </span>
              {game.discountPercent > 0 && (
                <span className="text-xs text-muted line-through">
                  {formatPrice(game.priceInitial)}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <FeedbackActions steamAppId={game.steamAppId} gameName={game.name} />
            <a
              href={`https://store.steampowered.com/app/${game.steamAppId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold text-white bg-accent hover:bg-accent-hover shadow-2xs transition-colors"
            >
              <span>View on Steam</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      </div>

      {/* Main Grid: Description & Factor Inspection */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Description & Tags */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl border border-line bg-surface p-6 space-y-4">
            <h2 className="font-heading text-lg font-bold text-ink">Overview</h2>
            <p className="text-sm text-muted leading-relaxed font-body">
              {game.shortDescription}
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4 border-t border-line text-xs">
              <div>
                <span className="text-muted block">Completion Time</span>
                <span className="font-heading font-bold text-ink text-sm">
                  ~{game.estimatedHoursToBeat} Hours
                </span>
              </div>
              <div>
                <span className="text-muted block">Median Playtime</span>
                <span className="font-heading font-bold text-ink text-sm">
                  {formatPlaytime(game.medianPlaytimeMinutes)}
                </span>
              </div>
              <div>
                <span className="text-muted block">Steam Reviews</span>
                <span className="font-heading font-bold text-ink text-sm">
                  {game.steamReviewScore}% Positive
                </span>
              </div>
            </div>
          </div>

          {/* Community Tags with SteamSpy vote counts */}
          <div className="rounded-xl border border-line bg-surface p-6 space-y-4">
            <h2 className="font-heading text-lg font-bold text-ink flex items-center gap-2">
              <Tag className="h-4 w-4 text-accent" />
              Community Tags (SteamSpy)
            </h2>
            <div className="flex flex-wrap gap-2">
              {game.tags.map((t) => (
                <span
                  key={t.tag}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-section border border-line text-ink"
                >
                  <span>{t.tag}</span>
                  <span className="text-[10px] text-muted font-bold">({t.weight})</span>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Mathematical Factors Card */}
        <div className="space-y-6">
          <div className="rounded-xl border border-line bg-surface p-6 space-y-5">
            <h3 className="font-heading text-base font-bold text-ink uppercase tracking-wider text-xs">
              Factor Analysis
            </h3>

            {/* Review Quality Card */}
            <div className="rounded-lg border border-line bg-bg p-4 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-ink">
                <span className="flex items-center gap-1.5">
                  <ThumbsUp className="h-4 w-4 text-accent" />
                  Review Quality
                </span>
                <span className="font-heading text-sm font-bold text-accent">
                  {reviewMetrics.score}/100
                </span>
              </div>
              <p className="text-xs text-muted leading-relaxed">
                95% Wilson confidence lower bound based on {game.totalReviews.toLocaleString()}{" "}
                reviews.
              </p>
            </div>

            {/* Regret Risk Card */}
            <div className="rounded-lg border border-line bg-bg p-4 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-ink">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-accent" />
                  Buyer Regret Risk
                </span>
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-xs ${
                    regretMetrics.riskRating === "low"
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {regretMetrics.riskRating} risk
                </span>
              </div>
              <p className="text-xs text-muted leading-relaxed">{regretMetrics.summary}</p>
            </div>

            {/* Steam Deck Support Card */}
            <div className="rounded-lg border border-line bg-bg p-4 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-ink">
                <span className="flex items-center gap-1.5">
                  <Gamepad2 className="h-4 w-4 text-accent" />
                  Steam Deck Status
                </span>
                <span className="text-xs font-bold capitalize text-ink">
                  {game.steamDeckCompatibility}
                </span>
              </div>
              <p className="text-xs text-muted leading-relaxed">
                Full controller support and optimized text sizing for handheld play.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
