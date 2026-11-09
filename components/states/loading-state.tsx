import { cn } from "@/lib/utils";

interface LoadingStateProps {
  count?: number;
  message?: string;
  className?: string;
}

export function LoadingState({
  count = 6,
  message = "Analyzing taste profile and ranking candidate games...",
  className,
}: LoadingStateProps) {
  return (
    <div className={cn("w-full py-8 space-y-6", className)}>
      <div className="flex items-center gap-3">
        <div className="h-4 w-4 rounded-full border-2 border-accent border-t-transparent animate-spin" />
        <p className="text-xs font-medium text-muted tracking-wide animate-pulse">
          {message}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className="rounded-lg border border-line bg-surface p-4 space-y-4 shadow-2xs animate-pulse"
          >
            {/* Image Placeholder */}
            <div className="w-full aspect-16/9 bg-section rounded-md" />

            {/* Title & Badge */}
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1.5 flex-1">
                <div className="h-4 bg-section rounded-xs w-3/4" />
                <div className="h-3 bg-section/70 rounded-xs w-1/2" />
              </div>
              <div className="h-6 w-12 bg-section rounded-full" />
            </div>

            {/* Tag Pills */}
            <div className="flex gap-1.5">
              <div className="h-4 bg-section rounded-full w-14" />
              <div className="h-4 bg-section rounded-full w-16" />
              <div className="h-4 bg-section rounded-full w-12" />
            </div>

            {/* Why This Bar Placeholder */}
            <div className="pt-2 border-t border-line/50 space-y-2">
              <div className="h-2.5 bg-section rounded-full w-full" />
              <div className="flex justify-between">
                <div className="h-2 bg-section rounded-xs w-16" />
                <div className="h-2 bg-section rounded-xs w-12" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

