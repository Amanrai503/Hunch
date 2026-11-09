"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  Check,
  Clock,
  Tag,
  ArrowRight,
  SlidersHorizontal,
  Flame,
  ShieldCheck,
} from "lucide-react";

const CURATED_ONBOARDING_TAGS = [
  "Roguelike Deckbuilder",
  "Action Roguelike",
  "Card Battler",
  "RPG",
  "Turn-Based Combat",
  "Metroidvania",
  "Souls-like",
  "Strategy",
  "Co-op",
  "Story Rich",
  "Difficult",
  "Pixel Graphics",
  "Bullet Hell",
  "Management",
  "Dark Fantasy",
  "Sci-fi",
  "Farming Sim",
  "Puzzle",
];

const TIME_OPTIONS = [
  {
    hours: 12,
    label: "Tight & Focused (< 15h)",
    desc: "Compact indies, punchy narratives, and tight mechanical loops.",
  },
  {
    hours: 28,
    label: "Sweet Spot (15 – 35h)",
    desc: "Balanced single-player campaigns and rich roguelites.",
  },
  {
    hours: 60,
    label: "Deep Commitment (40h+)",
    desc: "Vast RPGs, intricate strategy, and endless buildcrafting.",
  },
];

const BUDGET_OPTIONS = [
  {
    value: "any",
    label: "Any Price",
    desc: "Rank solely by mathematical quality and taste match.",
  },
  {
    value: "sales_only",
    label: "Sales Only",
    desc: "Strongly boost games currently on steep discount.",
  },
  {
    value: "budget",
    label: "Under $15 / High Value",
    desc: "Reward accessible pricing and high hours-per-dollar ratios.",
  },
];

export default function OnboardingPage() {
  const router = useRouter();

  const [selectedTags, setSelectedTags] = useState<string[]>([
    "Roguelike Deckbuilder",
    "Card Battler",
    "Strategy",
  ]);
  const [preferredHours, setPreferredHours] = useState<number>(28);
  const [budgetPreference, setBudgetPreference] = useState<string>("any");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSaveTaste = async () => {
    setIsSubmitting(true);
    try {
      await fetch("/api/taste/calibrate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          favoriteTags: selectedTags,
          preferredHours,
          budgetPreference,
        }),
      });
      router.push("/for-you");
    } catch (err) {
      console.warn("Failed to calibrate taste:", err);
      router.push("/for-you");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="space-y-3 mb-10 text-center sm:text-left border-b border-line pb-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/5 px-3 py-1 text-xs font-semibold text-accent">
          <SlidersHorizontal className="h-3.5 w-3.5" />
          <span>Taste Profile Calibration</span>
        </div>
        <h1 className="font-heading text-3xl sm:text-4xl font-black text-ink tracking-tight">
          Calibrate what you love playing
        </h1>
        <p className="text-sm text-muted max-w-2xl leading-relaxed">
          Hunch uses these inputs to calibrate your 128-dimensional taste vector, adjust regret risk
          thresholds, and personalize your 5-factor match score.
        </p>
      </div>

      <div className="space-y-12">
        {/* Step 1: Favorite Tags & Mechanics */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <h2 className="font-heading text-lg font-bold text-ink flex items-center gap-2">
              <Tag className="h-4 w-4 text-accent" />
              1. Pinned Genres & Mechanics
            </h2>
            <span className="text-xs text-muted">
              Select 3 or more ({selectedTags.length} selected)
            </span>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            {CURATED_ONBOARDING_TAGS.map((tag) => {
              const isSelected = selectedTags.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium border transition-all ${
                    isSelected
                      ? "bg-accent text-white border-accent shadow-2xs font-semibold"
                      : "bg-surface text-ink border-line hover:border-muted hover:bg-section/60"
                  }`}
                >
                  {isSelected && <Check className="h-3.5 w-3.5 stroke-[2.5]" />}
                  {tag}
                </button>
              );
            })}
          </div>
        </section>

        {/* Step 2: Preferred Completion Hours */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-lg font-bold text-ink flex items-center gap-2">
              <Clock className="h-4 w-4 text-accent" />
              2. Ideal Time Commitment
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {TIME_OPTIONS.map((opt) => {
              const isSelected = preferredHours === opt.hours;
              return (
                <div
                  key={opt.hours}
                  onClick={() => setPreferredHours(opt.hours)}
                  className={`cursor-pointer rounded-xl border p-5 transition-all flex flex-col justify-between ${
                    isSelected
                      ? "bg-surface border-accent shadow-xs ring-1 ring-accent"
                      : "bg-surface/60 border-line hover:border-muted hover:bg-surface"
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-heading font-bold text-sm text-ink">{opt.label}</span>
                      {isSelected && (
                        <div className="h-5 w-5 rounded-full bg-accent text-white flex items-center justify-center">
                          <Check className="h-3 w-3 stroke-[3]" />
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-muted leading-relaxed">{opt.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Step 3: Budget Philosophy */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-lg font-bold text-ink flex items-center gap-2">
              <Flame className="h-4 w-4 text-accent" />
              3. Deal & Pricing Preference
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {BUDGET_OPTIONS.map((opt) => {
              const isSelected = budgetPreference === opt.value;
              return (
                <div
                  key={opt.value}
                  onClick={() => setBudgetPreference(opt.value)}
                  className={`cursor-pointer rounded-xl border p-5 transition-all flex flex-col justify-between ${
                    isSelected
                      ? "bg-surface border-accent shadow-xs ring-1 ring-accent"
                      : "bg-surface/60 border-line hover:border-muted hover:bg-surface"
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-heading font-bold text-sm text-ink">{opt.label}</span>
                      {isSelected && (
                        <div className="h-5 w-5 rounded-full bg-accent text-white flex items-center justify-center">
                          <Check className="h-3 w-3 stroke-[3]" />
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-muted leading-relaxed">{opt.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Submit Action */}
        <div className="pt-6 border-t border-line flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-muted">
            <ShieldCheck className="h-4 w-4 text-accent" />
            <span>Preferences can be adjusted anytime in Settings</span>
          </div>

          <button
            type="button"
            onClick={handleSaveTaste}
            disabled={isSubmitting || selectedTags.length === 0}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg text-sm font-bold text-white bg-accent hover:bg-accent-hover disabled:opacity-50 transition-colors shadow-2xs"
          >
            {isSubmitting ? (
              <>
                <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                <span>Calibrating Taste Vector...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                <span>Generate Explained Recommendations</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
