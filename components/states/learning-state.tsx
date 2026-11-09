import Link from "next/link";
import { Sparkles, ArrowRight, BookOpen, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

interface LearningStateProps {
  gamesCount?: number;
  className?: string;
}

export function LearningState({ gamesCount = 3, className }: LearningStateProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-line bg-surface p-8 max-w-2xl mx-auto shadow-xs",
        className
      )}
    >
      <div className="flex items-start gap-4">
        <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center text-accent shrink-0 border border-accent/20">
          <Sparkles className="h-5 w-5" />
        </div>

        <div className="space-y-4 flex-1">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-accent bg-accent/10 px-2 py-0.5 rounded-xs">
              Taste Profile Calibrating
            </span>
            <h3 className="font-heading text-lg font-bold text-ink mt-1">
              Hunch is still learning what you truly love
            </h3>
            <p className="text-xs text-muted leading-relaxed mt-1">
              We’ve imported {gamesCount} games from your library, but our pure ranking engine needs
              a few more signals to confidently estimate your taste vector and regret risk.
            </p>
          </div>

          <div className="rounded-lg border border-line bg-section/40 p-4 space-y-3 text-xs">
            <div className="flex items-center justify-between text-ink font-medium">
              <span>Taste Calibration Progress</span>
              <span className="text-accent font-bold">40%</span>
            </div>
            <div className="w-full h-2 bg-line rounded-full overflow-hidden">
              <div className="h-full bg-accent rounded-full w-2/5 transition-all duration-500" />
            </div>
            <p className="text-[11px] text-muted">
              Tip: Rating 3 favorites or choosing your desired session length instantly unlocks
              higher-confidence match scores.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <Link
              href="/start"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-accent hover:bg-accent-hover rounded-md shadow-2xs transition-colors"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Calibrate Taste via Quick Survey
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>

            <Link
              href="/discover"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-ink bg-section hover:bg-line/80 rounded-md border border-line transition-colors"
            >
              <BookOpen className="h-3.5 w-3.5" />
              Explore Discover Catalog
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

