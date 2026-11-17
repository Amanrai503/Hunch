"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Sparkles,
  ShieldCheck,
  Target,
  Clock,
  Tag,
  ThumbsUp,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { LoadingState } from "@/components/states/loading-state";
import { EmptyState } from "@/components/states/empty-state";
import { PrivateProfileState } from "@/components/states/private-profile-state";
import { LearningState } from "@/components/states/learning-state";

function AuthAlert() {
  const searchParams = useSearchParams();
  const authError = searchParams.get("auth_error");
  const loginRequired = searchParams.get("login_required");

  if (!authError && !loginRequired) return null;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-6">
      <div
        className={`p-4 rounded-xl border flex items-center justify-between text-sm ${
          authError
            ? "border-amber-200 bg-amber-50 text-amber-900"
            : "border-blue-200 bg-blue-50 text-blue-900"
        }`}
      >
        <div className="flex items-center gap-3">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>
            {authError
              ? `Authentication notice: ${authError}. Please try signing in again.`
              : "Please sign in with Steam or try the Sample Profile to access that page."}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  const [activeStateTab, setActiveStateTab] = useState<
    "loading" | "empty" | "private" | "learning"
  >("learning");

  return (
    <div className="flex flex-col min-h-screen">
      <Suspense fallback={null}>
        <AuthAlert />
      </Suspense>

      {/* Hero Section */}

      <section className="relative border-b border-line bg-surface/40 py-20 lg:py-28 overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/5 px-3 py-1 text-xs font-semibold text-accent">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Transparent Algorithmic Game Picks</span>
            </div>

            <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-ink leading-[1.08]">
              Steam recommendations,{" "}
              <span className="text-accent underline decoration-accent/30 underline-offset-8">
                explained.
              </span>
            </h1>

            <p className="text-base sm:text-lg text-muted leading-relaxed max-w-2xl font-body">
              Stop hoarding unplayed games. Hunch builds a personalized taste profile from your real
              playtime, breaks down why every title matches you, and protects you from buyer regret.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <a
                href="/api/auth/steam"
                className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-lg text-sm font-bold text-white bg-accent hover:bg-accent-hover shadow-sm transition-all transform hover:-translate-y-0.5"
              >
                <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2a10 10 0 0 0-10 10c0 4.42 2.87 8.17 6.84 9.5l1.63-2.39a3.5 3.5 0 0 1-.47-.41l-2.92-1.22a5 5 0 1 1 8.87-3.83 5 5 0 0 1-1.39 3.5l2.44 3.47A10 10 0 0 0 12 2zm-4.3 14.5a1.7 1.7 0 1 0 0-3.4 1.7 1.7 0 0 0 0 3.4zm7.3-4.5a2.5 2.5 0 1 0-5 0 2.5 2.5 0 0 0 5 0z" />
                </svg>
                Sign in with Steam
              </a>

              <a
                href="/api/auth/sample"
                className="inline-flex items-center gap-2 px-5 py-3.5 rounded-lg text-sm font-semibold text-ink bg-surface hover:bg-section border border-line shadow-2xs transition-colors"
              >
                <span>Try Sample Profile</span>
                <ArrowRight className="h-4 w-4 text-muted" />
              </a>
            </div>

            {/* Trust Badges */}
            <div className="flex flex-wrap items-center gap-5 pt-4 text-xs text-muted">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-accent" />
                <span>Read-only SteamID (no passwords)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-accent" />
                <span>Zero writes to your Steam account</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-accent" />
                <span>Instant guest test drive</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5-Factor Ranking Engine Highlights */}
      <section className="py-16 sm:py-20 border-b border-line bg-surface">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-widest text-accent">
              The Math Behind Your Picks
            </span>
            <h2 className="font-heading text-2xl sm:text-3xl font-bold text-ink mt-2">
              Five explainable factors. Zero black boxes.
            </h2>
            <p className="text-xs sm:text-sm text-muted mt-2">
              Every score on Hunch is a composite of five mathematically independent signals you can
              inspect on any card.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div className="rounded-lg border border-line bg-bg p-5 space-y-2">
              <div className="flex items-center justify-between">
                <Target className="h-5 w-5 text-accent" />
                <span className="font-heading font-black text-xs text-accent">40%</span>
              </div>
              <h3 className="font-heading text-sm font-bold text-ink">Taste Match</h3>
              <p className="text-xs text-muted leading-relaxed">
                Tag-weighted cosine similarity calculated from games you actually poured hours into.
              </p>
            </div>

            <div className="rounded-lg border border-line bg-bg p-5 space-y-2">
              <div className="flex items-center justify-between">
                <ThumbsUp className="h-5 w-5 text-accent" />
                <span className="font-heading font-black text-xs text-accent">20%</span>
              </div>
              <h3 className="font-heading text-sm font-bold text-ink">Review Quality</h3>
              <p className="text-xs text-muted leading-relaxed">
                95% Wilson confidence lower bound protecting against 100% positive 3-review games.
              </p>
            </div>

            <div className="rounded-lg border border-line bg-bg p-5 space-y-2">
              <div className="flex items-center justify-between">
                <ShieldCheck className="h-5 w-5 text-accent" />
                <span className="font-heading font-black text-xs text-accent">15%</span>
              </div>
              <h3 className="font-heading text-sm font-bold text-ink">Inverted Regret Risk</h3>
              <p className="text-xs text-muted leading-relaxed">
                Penalizes games with steep &lt;2 hour refund drop-offs and sentiment volatility.
              </p>
            </div>

            <div className="rounded-lg border border-line bg-bg p-5 space-y-2">
              <div className="flex items-center justify-between">
                <Clock className="h-5 w-5 text-accent" />
                <span className="font-heading font-black text-xs text-accent">15%</span>
              </div>
              <h3 className="font-heading text-sm font-bold text-ink">Time Fit</h3>
              <p className="text-xs text-muted leading-relaxed">
                Gaussian distribution matching your available free time against median completion hours.
              </p>
            </div>

            <div className="rounded-lg border border-line bg-bg p-5 space-y-2">
              <div className="flex items-center justify-between">
                <Tag className="h-5 w-5 text-accent" />
                <span className="font-heading font-black text-xs text-accent">10%</span>
              </div>
              <h3 className="font-heading text-sm font-bold text-ink">Price & Value</h3>
              <p className="text-xs text-muted leading-relaxed">
                Combines active discount depth and price-per-hour value score.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Core Page States Showcase */}
      <section className="py-16 sm:py-20 bg-bg">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-accent">
                Core UI Architecture
              </span>
              <h2 className="font-heading text-2xl sm:text-3xl font-bold text-ink mt-1">
                Every state designed with care
              </h2>
              <p className="text-xs text-muted mt-1 max-w-lg">
                Hunch gracefully handles all edge states in tactile editorial styling:
              </p>
            </div>

            {/* State Switcher Pills */}
            <div className="flex flex-wrap gap-1.5 p-1 bg-section rounded-lg border border-line">
              <button
                onClick={() => setActiveStateTab("learning")}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  activeStateTab === "learning"
                    ? "bg-surface text-accent shadow-2xs"
                    : "text-muted hover:text-ink"
                }`}
              >
                Still Learning
              </button>
              <button
                onClick={() => setActiveStateTab("private")}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  activeStateTab === "private"
                    ? "bg-surface text-accent shadow-2xs"
                    : "text-muted hover:text-ink"
                }`}
              >
                Private Profile
              </button>
              <button
                onClick={() => setActiveStateTab("empty")}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  activeStateTab === "empty"
                    ? "bg-surface text-accent shadow-2xs"
                    : "text-muted hover:text-ink"
                }`}
              >
                Empty / No Results
              </button>
              <button
                onClick={() => setActiveStateTab("loading")}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  activeStateTab === "loading"
                    ? "bg-surface text-accent shadow-2xs"
                    : "text-muted hover:text-ink"
                }`}
              >
                Shimmer Loading
              </button>
            </div>
          </div>

          {/* Render Active State Component */}
          <div className="p-6 sm:p-10 rounded-2xl border border-line bg-surface/50 min-h-[380px] flex items-center justify-center">
            <div className="w-full">
              {activeStateTab === "learning" && <LearningState gamesCount={8} />}
              {activeStateTab === "private" && <PrivateProfileState />}
              {activeStateTab === "empty" && (
                <EmptyState
                  title="No games matched your current filters"
                  description="Try resetting your playtime threshold or expanding tag selections."
                  actionHref="/discover"
                  actionLabel="Reset to All Games"
                />
              )}
              {activeStateTab === "loading" && (
                <LoadingState
                  count={3}
                  message="Calibrating Wilson score and matching tag vectors..."
                />
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
