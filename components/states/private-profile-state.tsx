import { Lock, ExternalLink, RefreshCw, Eye } from "lucide-react";
import { cn } from "@/lib/utils";

interface PrivateProfileStateProps {
  className?: string;
  onResync?: () => void;
}

export function PrivateProfileState({ className, onResync }: PrivateProfileStateProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-amber-300/80 bg-[#FFFDF7] p-8 max-w-2xl mx-auto shadow-xs",
        className
      )}
    >
      <div className="flex items-start gap-4">
        <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-800 shrink-0 border border-amber-300">
          <Lock className="h-5 w-5" />
        </div>

        <div className="space-y-3 flex-1">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded-xs">
              Steam Privacy Setting Required
            </span>
            <h3 className="font-heading text-lg font-bold text-ink mt-1">
              Your Steam Game Details are set to Private
            </h3>
            <p className="text-xs text-muted leading-relaxed mt-1">
              Hunch needs read-only access to your owned games and playtimes to understand what you love playing and calculate your taste match.
            </p>
          </div>

          <div className="rounded-lg border border-line bg-surface p-4 space-y-2.5 text-xs text-ink">
            <div className="font-semibold text-ink flex items-center gap-1.5">
              <Eye className="h-4 w-4 text-accent" />
              How to enable recommendations in 30 seconds:
            </div>
            <ol className="list-decimal list-inside space-y-1.5 text-muted pl-1">
              <li>
                Open your{" "}
                <a
                  href="https://steamcommunity.com/my/edit/settings"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent underline font-medium inline-flex items-center gap-0.5"
                >
                  Steam Privacy Settings <ExternalLink className="h-3 w-3" />
                </a>
              </li>
              <li>
                Set <span className="font-semibold text-ink">“Game details”</span> to{" "}
                <span className="font-semibold text-ink">“Public”</span>
              </li>
              <li>
                Uncheck the box{" "}
                <span className="font-semibold text-ink">“Always keep my total playtime private”</span>
              </li>
            </ol>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            {onResync ? (
              <button
                onClick={onResync}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-accent hover:bg-accent-hover rounded-md shadow-2xs transition-colors"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                I’ve Updated My Settings — Re-check Now
              </button>
            ) : (
              <a
                href="/api/auth/steam"
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-accent hover:bg-accent-hover rounded-md shadow-2xs transition-colors"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                I’ve Updated My Settings — Re-check Now
              </a>
            )}

            <a
              href="/api/auth/sample"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-ink bg-section hover:bg-line/80 rounded-md border border-line transition-colors"
            >
              Explore with Sample Profile Instead
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
