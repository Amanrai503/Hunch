"use client";

import { RankedGameResult } from "@/lib/ranking/types";
import { formatPrice } from "@/lib/utils";
import {
  X,
  Target,
  ThumbsUp,
  ShieldCheck,
  Clock,
  Tag,
  ExternalLink,
  Sparkles,
  CheckCircle2,
} from "lucide-react";

interface WhyThisDrawerProps {
  result: RankedGameResult | null;
  isOpen: boolean;
  onClose: () => void;
}

export function WhyThisDrawer({ result, isOpen, onClose }: WhyThisDrawerProps) {
  if (!isOpen || !result) return null;

  const { game, totalScore, factors, reasons } = result;

  const factorList = [
    {
      name: "Taste Match",
      weightLabel: "40%",
      score: factors.tasteMatch.score,
      contribution: factors.tasteMatch.contribution,
      summary: factors.tasteMatch.summary,
      icon: Target,
      extra:
        factors.tasteMatch.matchedTags.length > 0 ? (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {factors.tasteMatch.matchedTags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-accent/10 text-accent border border-accent/20"
              >
                {tag}
              </span>
            ))}
          </div>
        ) : null,
    },
    {
      name: "Review Quality",
      weightLabel: "20%",
      score: factors.reviewQuality.score,
      contribution: factors.reviewQuality.contribution,
      summary: factors.reviewQuality.summary,
      icon: ThumbsUp,
      extra: (
        <span className="text-[11px] text-muted block mt-1">
          95% Wilson confidence lower bound: {(factors.reviewQuality.wilsonScore * 100).toFixed(1)}%
        </span>
      ),
    },
    {
      name: "Inverted Regret Risk",
      weightLabel: "15%",
      score: factors.regretRisk.score,
      contribution: factors.regretRisk.contribution,
      summary: factors.regretRisk.summary,
      icon: ShieldCheck,
      extra: (
        <span
          className={`inline-block mt-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-xs ${
            factors.regretRisk.riskRating === "low"
              ? "bg-emerald-100 text-emerald-800"
              : factors.regretRisk.riskRating === "medium"
              ? "bg-amber-100 text-amber-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {factors.regretRisk.riskRating} abandonment risk
        </span>
      ),
    },
    {
      name: "Time Fit",
      weightLabel: "15%",
      score: factors.timeFit.score,
      contribution: factors.timeFit.contribution,
      summary: factors.timeFit.summary,
      icon: Clock,
      extra: (
        <span className="text-[11px] text-muted block mt-1">
          Median completion: ~{factors.timeFit.estimatedHours} hours
        </span>
      ),
    },
    {
      name: "Price & Sale Value",
      weightLabel: "10%",
      score: factors.priceValue.score,
      contribution: factors.priceValue.contribution,
      summary: factors.priceValue.summary,
      icon: Tag,
      extra: (
        <span className="text-[11px] text-muted block mt-1">
          {game.isFree
            ? "Free to Play"
            : `${formatPrice(game.priceFinalCents)} (${factors.priceValue.discountPercent}% discount)`}
        </span>
      ),
    },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-ink/40 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg bg-surface border-l border-line h-full flex flex-col shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-250"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-5 border-b border-line bg-surface/95 backdrop-blur">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-accent/10 text-accent">
              <Sparkles className="h-4 w-4" />
            </span>
            <div>
              <h2 className="font-heading text-base font-bold text-ink">Score Inspection</h2>
              <span className="text-[11px] text-muted">Why Hunch recommended this</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-muted hover:text-ink hover:bg-section transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Game Banner & Composite Score */}
          <div className="rounded-xl border border-line bg-bg p-4 flex gap-4 items-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={
                game.capsuleImage ||
                `https://shared.steamstatic.com/store_item_assets/steam/apps/${game.steamAppId}/capsule_231x87.jpg`
              }
              alt={game.name}
              className="w-24 h-auto rounded-md border border-line object-cover shrink-0"
              referrerPolicy="no-referrer"
              onError={(e) => {
                const target = e.currentTarget;
                const fallbackUrl = `https://steamcdn-a.akamaihd.net/steam/apps/${game.steamAppId}/capsule_231x87.jpg`;
                if (target.src !== fallbackUrl) {
                  target.src = fallbackUrl;
                }
              }}
            />
            <div className="flex-1 min-w-0">
              <h3 className="font-heading text-lg font-bold text-ink truncate">{game.name}</h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="inline-flex items-center gap-1 rounded-md bg-accent text-white px-2.5 py-0.5 text-xs font-heading font-black shadow-2xs">
                  {totalScore}% Match
                </span>
                <span className="text-xs font-semibold text-muted">
                  {formatPrice(game.priceFinalCents)}
                </span>
              </div>
            </div>
          </div>

          {/* Key Explanations Bullet Points */}
          <div className="rounded-xl border border-line bg-[#FAF5EB] p-4 space-y-2">
            <h4 className="font-heading text-xs font-bold uppercase tracking-wider text-accent flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Key Rationale Highlights
            </h4>
            <ul className="space-y-1.5 text-xs text-ink">
              {reasons.map((r, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-accent font-bold mt-0.5">•</span>
                  <span className="leading-relaxed">{r}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* 5 Factor Breakdown Bars */}
          <div className="space-y-4">
            <h4 className="font-heading text-xs font-bold uppercase tracking-wider text-ink">
              Mathematical Factor Breakdown
            </h4>

            <div className="space-y-3">
              {factorList.map((f) => {
                const Icon = f.icon;
                return (
                  <div
                    key={f.name}
                    className="rounded-lg border border-line bg-surface p-3.5 space-y-2 shadow-2xs"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 font-medium text-ink">
                        <Icon className="h-4 w-4 text-accent" />
                        <span>{f.name}</span>
                        <span className="text-[10px] text-muted">({f.weightLabel} weight)</span>
                      </div>
                      <div className="font-heading font-bold text-xs text-ink">
                        {f.score}
                        <span className="text-[10px] text-muted font-normal">/100</span>
                        <span className="text-[10px] text-accent ml-1.5 font-semibold">
                          (+{f.contribution.toFixed(1)} pts)
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-2 bg-section rounded-full overflow-hidden">
                      <div
                        className="h-full bg-accent rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(5, f.score)}%` }}
                      />
                    </div>

                    <p className="text-[11px] text-muted leading-tight">{f.summary}</p>
                    {f.extra}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Actions & Steam Store Link */}
          <div className="pt-4 border-t border-line flex flex-col gap-2">
            <a
              href={`https://store.steampowered.com/app/${game.steamAppId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-lg text-xs font-bold text-white bg-accent hover:bg-accent-hover shadow-2xs transition-colors"
            >
              <span>View on Steam Store</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

