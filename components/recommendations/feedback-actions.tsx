"use client";

import { useState } from "react";
import {
  Ban,
  CheckCircle2,
  EyeOff,
  Star,
  X,
  MoreVertical,
} from "lucide-react";

interface FeedbackActionsProps {
  steamAppId: number;
  gameName: string;
  onDismiss?: (action: string) => void;
}

export function FeedbackActions({ steamAppId, gameName, onDismiss }: FeedbackActionsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [ratingScore, setRatingScore] = useState<number>(8);
  const [reviewText, setReviewText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFeedback = async (action: "not_interested" | "already_played" | "hide") => {
    setIsOpen(false);
    try {
      await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ steamAppId, action }),
      });
      if (onDismiss) onDismiss(action);
    } catch (err) {
      console.warn("Feedback error:", err);
    }
  };

  const submitRating = async () => {
    setIsSubmitting(true);
    try {
      await fetch("/api/ratings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          steamAppId,
          score: ratingScore,
          reviewText: reviewText.trim() || undefined,
        }),
      });
      setShowRatingModal(false);
      if (onDismiss) onDismiss("rated");
    } catch (err) {
      console.warn("Rating error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="relative inline-block text-left">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="p-1.5 rounded-md text-muted hover:text-ink hover:bg-section transition-colors"
          title="Game options & feedback"
        >
          <MoreVertical className="h-4 w-4" />
        </button>

        {isOpen && (
          <>
            <div className="fixed inset-0 z-20" onClick={() => setIsOpen(false)} />
            <div className="absolute right-0 z-30 mt-1 w-48 rounded-lg border border-line bg-surface p-1 shadow-lg text-xs space-y-0.5">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  setShowRatingModal(true);
                }}
                className="w-full text-left px-2.5 py-1.5 rounded-md text-ink hover:bg-section flex items-center gap-2 transition-colors"
              >
                <Star className="h-3.5 w-3.5 text-accent" />
                <span>Rate Game (1–10)</span>
              </button>

              <button
                type="button"
                onClick={() => handleFeedback("already_played")}
                className="w-full text-left px-2.5 py-1.5 rounded-md text-ink hover:bg-section flex items-center gap-2 transition-colors"
              >
                <CheckCircle2 className="h-3.5 w-3.5 text-muted" />
                <span>Already Played</span>
              </button>

              <button
                type="button"
                onClick={() => handleFeedback("not_interested")}
                className="w-full text-left px-2.5 py-1.5 rounded-md text-ink hover:bg-section flex items-center gap-2 transition-colors"
              >
                <Ban className="h-3.5 w-3.5 text-muted" />
                <span>Not Interested</span>
              </button>

              <button
                type="button"
                onClick={() => handleFeedback("hide")}
                className="w-full text-left px-2.5 py-1.5 rounded-md text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
              >
                <EyeOff className="h-3.5 w-3.5 text-red-500" />
                <span>Don’t Show Again</span>
              </button>
            </div>
          </>
        )}
      </div>

      {/* 1–10 Rating Modal Dialog */}
      {showRatingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-xl border border-line bg-surface p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div>
                <h3 className="font-heading text-base font-bold text-ink">Rate this game</h3>
                <span className="text-xs text-muted truncate block max-w-xs">{gameName}</span>
              </div>
              <button
                onClick={() => setShowRatingModal(false)}
                className="p-1 text-muted hover:text-ink"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Score Selector (1 - 10) */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-ink flex items-center justify-between">
                <span>Score (1 to 10)</span>
                <span className="font-heading text-base font-black text-accent">
                  {ratingScore} / 10
                </span>
              </label>

              <div className="flex items-center gap-1.5 justify-between">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setRatingScore(num)}
                    className={`h-8 w-8 rounded-md text-xs font-bold transition-all ${
                      ratingScore === num
                        ? "bg-accent text-white shadow-2xs scale-105"
                        : "bg-section text-ink hover:bg-line/70"
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>

            {/* Optional Notes */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-ink">
                Quick note or review (optional)
              </label>
              <textarea
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder="What did you love or dislike about it?"
                rows={3}
                className="w-full p-2.5 text-xs bg-bg border border-line rounded-md text-ink placeholder:text-muted focus:outline-hidden focus:ring-1 focus:ring-accent"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-line">
              <button
                type="button"
                onClick={() => setShowRatingModal(false)}
                className="px-3 py-1.5 text-xs font-semibold text-muted hover:text-ink"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitRating}
                disabled={isSubmitting}
                className="px-4 py-1.5 text-xs font-bold text-white bg-accent hover:bg-accent-hover rounded-md shadow-2xs transition-colors"
              >
                {isSubmitting ? "Saving..." : "Save Rating"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
