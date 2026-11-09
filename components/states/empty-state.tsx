import Link from "next/link";
import { FolderSearch, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  title?: string;
  description?: string;
  actionHref?: string;
  actionLabel?: string;
  onReset?: () => void;
  className?: string;
}

export function EmptyState({
  title = "No games found matching your filters",
  description = "Try expanding your playtime window, clearing specific genre tags, or resetting your price filter.",
  actionHref,
  actionLabel = "Browse Discover Catalog",
  onReset,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-line border-dashed bg-surface/60 p-12 text-center flex flex-col items-center justify-center my-8",
        className
      )}
    >
      <div className="h-12 w-12 rounded-full bg-section flex items-center justify-center text-muted mb-4 border border-line">
        <FolderSearch className="h-6 w-6 text-muted" />
      </div>

      <h3 className="font-heading text-lg font-bold text-ink mb-1.5">{title}</h3>
      <p className="text-xs text-muted max-w-md mx-auto leading-relaxed mb-6">
        {description}
      </p>

      <div className="flex flex-wrap items-center justify-center gap-3">
        {onReset && (
          <button
            onClick={onReset}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-ink bg-section hover:bg-line/80 rounded-md border border-line transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset All Filters
          </button>
        )}

        {actionHref && (
          <Link
            href={actionHref}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-accent hover:bg-accent-hover rounded-md shadow-2xs transition-colors"
          >
            {actionLabel}
          </Link>
        )}
      </div>
    </div>
  );
}
