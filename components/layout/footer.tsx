import Link from "next/link";
import { ShieldCheck } from "lucide-react";

export function Footer() {
  return (
    <footer className="w-full border-t border-line bg-surface mt-auto">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <span className="font-heading text-lg font-bold text-ink">Hunch</span>
              <span className="text-xs text-muted">/ Explainable Steam Picks</span>
            </div>
            <p className="text-xs text-muted leading-relaxed max-w-md">
              Hunch analyzes your actual Steam play habits to recommend games you’ll truly finish.
              Every pick comes with transparent factors: taste match, review quality, regret risk,
              and playtime fit.
            </p>
            <div className="flex items-center gap-2 text-[11px] text-muted">
              <ShieldCheck className="h-3.5 w-3.5 text-accent" />
              <span>Read-only Steam connection. Lists and ratings are stored on Hunch only.</span>
            </div>
          </div>

          <div>
            <h4 className="font-heading text-xs font-semibold uppercase tracking-wider text-ink mb-3">
              Explore
            </h4>
            <ul className="space-y-2 text-xs text-muted">
              <li>
                <Link href="/for-you" className="hover:text-accent transition-colors">
                  For You Feed
                </Link>
              </li>
              <li>
                <Link href="/discover" className="hover:text-accent transition-colors">
                  Discover Catalog
                </Link>
              </li>
              <li>
                <Link href="/squad" className="hover:text-accent transition-colors">
                  Squad Multiplayer Pick
                </Link>
              </li>
              <li>
                <Link href="/my-games" className="hover:text-accent transition-colors">
                  My Backlog & Lists
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-heading text-xs font-semibold uppercase tracking-wider text-ink mb-3">
              Account & Taste
            </h4>
            <ul className="space-y-2 text-xs text-muted">
              <li>
                <a href="/api/auth/sample" className="hover:text-accent transition-colors">
                  Try Sample Profile
                </a>
              </li>
              <li>
                <Link href="/start" className="hover:text-accent transition-colors">
                  Onboarding Survey
                </Link>
              </li>
              <li>
                <Link href="/settings" className="hover:text-accent transition-colors">
                  Preferences & Sync
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Legal Disclaimer Required by Valve Guidelines & Product Spec */}
        <div className="pt-6 border-t border-line/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-muted">
          <p className="text-center sm:text-left">
            <strong>Disclaimer:</strong> Hunch is a fan project and is not affiliated with, authorized,
            maintained, sponsored, or endorsed by Valve Corporation or Steam. Steam and the Steam logo
            are registered trademarks of Valve Corporation in the U.S. and/or other countries.
          </p>
          <div className="flex items-center gap-1 shrink-0">
            <span>Built for thoughtful gamers</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
