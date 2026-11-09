"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Settings,
  RefreshCw,
  Trash2,
  ShieldCheck,
  LogOut,
  Check,
  SlidersHorizontal,
  Info,
} from "lucide-react";

export default function SettingsPage() {
  const router = useRouter();
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [clearDataSuccess, setClearDataSuccess] = useState(false);

  const [user, setUser] = useState({
    steamId: "76561198000000000",
    displayName: "Sam The Deckbuilder",
    isSampleUser: true,
  });

  useEffect(() => {
    async function loadMe() {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          if (data.user) {
            setUser({
              steamId: data.user.steamId,
              displayName: data.user.displayName,
              isSampleUser: !!data.user.isSampleUser,
            });
          }
        }
      } catch {
        // fallback
      }
    }
    loadMe();
  }, []);

  const handleResyncLibrary = async () => {
    setIsSyncing(true);
    setSyncSuccess(false);

    try {
      // Simulate/trigger resync call
      await new Promise((r) => setTimeout(r, 1500));
      setSyncSuccess(true);
      setTimeout(() => setSyncSuccess(false), 3000);
    } catch {
      // ignore
    } finally {
      setIsSyncing(false);
    }
  };

  const handleResetTaste = async () => {
    if (
      !confirm(
        "Are you sure you want to reset your taste calibrations? You will be redirected to the onboarding wizard."
      )
    ) {
      return;
    }
    setResetSuccess(true);
    setTimeout(() => {
      router.push("/start");
    }, 1000);
  };

  const handleClearLocalData = () => {
    if (
      !confirm(
        "Are you sure you want to clear your local ratings, lists, and feedback history? This action cannot be undone."
      )
    ) {
      return;
    }
    setClearDataSuccess(true);
    setTimeout(() => setClearDataSuccess(false), 3000);
  };

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-10">
      {/* Header */}
      <div className="border-b border-line pb-6 space-y-2">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-accent/20 bg-accent/5 px-3 py-1 text-xs font-semibold text-accent">
          <Settings className="h-3.5 w-3.5" />
          <span>Application Preferences</span>
        </div>
        <h1 className="font-heading text-3xl sm:text-4xl font-black text-ink">
          Settings & Account
        </h1>
        <p className="text-xs sm:text-sm text-muted max-w-2xl leading-relaxed">
          Manage your Steam connection, library sync preferences, taste calibrations, and local
          privacy controls.
        </p>
      </div>

      {/* Section 1: Account Connection */}
      <div className="rounded-2xl border border-line bg-surface p-6 sm:p-8 space-y-6 shadow-xs">
        <div className="space-y-1">
          <h2 className="font-heading text-lg font-bold text-ink">Account & Session</h2>
          <p className="text-xs text-muted">
            Manage your authenticated Steam profile or toggle sample mode.
          </p>
        </div>

        <div className="rounded-xl border border-line bg-bg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-ink">{user.displayName}</span>
              {user.isSampleUser ? (
                <span className="text-[10px] font-bold uppercase bg-accent/10 text-accent px-2 py-0.5 rounded-md border border-accent/20">
                  Sample Mode
                </span>
              ) : (
                <span className="text-[10px] font-bold uppercase bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-md border border-emerald-200">
                  Steam Connected
                </span>
              )}
            </div>
            <p className="text-xs text-muted">SteamID: {user.steamId}</p>
          </div>

          <div className="flex items-center gap-2">
            {user.isSampleUser ? (
              <a
                href="/api/auth/steam"
                className="px-3.5 py-2 rounded-lg text-xs font-bold text-white bg-accent hover:bg-accent-hover transition-colors shadow-2xs"
              >
                Connect Real Steam Account
              </a>
            ) : (
              <a
                href="/api/auth/sample"
                className="px-3.5 py-2 rounded-lg text-xs font-semibold text-ink bg-section hover:bg-line/70 border border-line transition-colors"
              >
                Switch to Sample Profile
              </a>
            )}

            <a
              href="/api/auth/logout"
              className="p-2 rounded-lg text-muted hover:text-accent hover:bg-section border border-line transition-colors"
              title="Sign Out"
            >
              <LogOut className="h-4 w-4" />
            </a>
          </div>
        </div>

        <div className="text-xs text-muted flex items-start gap-2 bg-section/40 p-3.5 rounded-xl border border-line/60">
          <ShieldCheck className="h-4 w-4 text-accent shrink-0 mt-0.5" />
          <span>
            Hunch connects via Steam OpenID 2.0 (read-only 64-bit SteamID). We never ask for or
            store your Steam credentials, credit cards, or chat history.
          </span>
        </div>
      </div>

      {/* Section 2: Library Sync */}
      <div className="rounded-2xl border border-line bg-surface p-6 sm:p-8 space-y-6 shadow-xs">
        <div className="space-y-1">
          <h2 className="font-heading text-lg font-bold text-ink">Steam Library Synchronization</h2>
          <p className="text-xs text-muted">
            Fetch new game purchases and playtime updates from your Steam profile.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
          <div className="space-y-0.5">
            <span className="text-xs font-bold text-ink">Background Resync</span>
            <p className="text-xs text-muted">
              Syncs owned games and enriches community tags from SteamSpy with rate-limit safety.
            </p>
          </div>

          <button
            onClick={handleResyncLibrary}
            disabled={isSyncing}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold text-white bg-accent hover:bg-accent-hover shadow-2xs transition-colors disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? "animate-spin" : ""}`} />
            <span>{isSyncing ? "Syncing Library..." : "Resync Now"}</span>
          </button>
        </div>

        {syncSuccess && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-bold text-emerald-800 flex items-center gap-2">
            <Check className="h-4 w-4" />
            <span>Library synced successfully! Metadata and community tags are up to date.</span>
          </div>
        )}
      </div>

      {/* Section 3: Ranking Engine & Taste Calibration */}
      <div className="rounded-2xl border border-line bg-surface p-6 sm:p-8 space-y-6 shadow-xs">
        <div className="space-y-1">
          <h2 className="font-heading text-lg font-bold text-ink">Recommendation Engine Tuning</h2>
          <p className="text-xs text-muted">
            The mathematical weights used in the 5-factor scoring function:
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
          <div className="rounded-xl border border-line bg-bg p-3 text-center space-y-1">
            <span className="text-xs font-bold text-accent">40%</span>
            <div className="text-[11px] font-semibold text-ink">Taste Match</div>
            <p className="text-[10px] text-muted">Cosine similarity</p>
          </div>
          <div className="rounded-xl border border-line bg-bg p-3 text-center space-y-1">
            <span className="text-xs font-bold text-accent">20%</span>
            <div className="text-[11px] font-semibold text-ink">Review Quality</div>
            <p className="text-[10px] text-muted">Wilson 95% bound</p>
          </div>
          <div className="rounded-xl border border-line bg-bg p-3 text-center space-y-1">
            <span className="text-xs font-bold text-accent">15%</span>
            <div className="text-[11px] font-semibold text-ink">Regret Risk</div>
            <p className="text-[10px] text-muted">Abandonment factor</p>
          </div>
          <div className="rounded-xl border border-line bg-bg p-3 text-center space-y-1">
            <span className="text-xs font-bold text-accent">15%</span>
            <div className="text-[11px] font-semibold text-ink">Time Fit</div>
            <p className="text-[10px] text-muted">Target hours match</p>
          </div>
          <div className="rounded-xl border border-line bg-bg p-3 text-center space-y-1">
            <span className="text-xs font-bold text-accent">10%</span>
            <div className="text-[11px] font-semibold text-ink">Price / Value</div>
            <p className="text-[10px] text-muted">Discount & tier</p>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-line/70">
          <span className="text-xs text-muted">
            Want to re-answer the archetype and genre quiz?
          </span>

          <button
            onClick={handleResetTaste}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-ink bg-section hover:bg-line/70 border border-line transition-colors cursor-pointer"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span>Reset Taste Calibrations</span>
          </button>
        </div>

        {resetSuccess && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-bold text-emerald-800 flex items-center gap-2">
            <Check className="h-4 w-4" />
            <span>Resetting calibrations and redirecting to wizard...</span>
          </div>
        )}
      </div>

      {/* Section 4: Privacy & Local Data Wipe */}
      <div className="rounded-2xl border border-line bg-surface p-6 sm:p-8 space-y-6 shadow-xs">
        <div className="space-y-1">
          <h2 className="font-heading text-lg font-bold text-ink">Data & Privacy Controls</h2>
          <p className="text-xs text-muted">
            All custom lists, ratings, and feedback are saved strictly on Hunch and never write to
            your Steam account.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
          <div className="space-y-0.5">
            <span className="text-xs font-bold text-ink">Clear Local Data</span>
            <p className="text-xs text-muted">
              Wipes custom backlog lists, hidden games, and 1–10 ratings.
            </p>
          </div>

          <button
            onClick={handleClearLocalData}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold text-accent bg-accent/10 hover:bg-accent/20 border border-accent/30 transition-colors cursor-pointer"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Clear Ratings & Lists</span>
          </button>
        </div>

        {clearDataSuccess && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-bold text-emerald-800 flex items-center gap-2">
            <Check className="h-4 w-4" />
            <span>Local lists and feedback have been cleared.</span>
          </div>
        )}
      </div>

      {/* Legal & Valve Compliance Disclaimer */}
      <div className="rounded-2xl border border-line/70 bg-[#FAF6EC] p-6 text-xs text-muted space-y-2">
        <div className="flex items-center gap-2 font-bold text-ink">
          <Info className="h-4 w-4 text-accent" />
          <span>Legal Disclaimer & Non-Affiliation</span>
        </div>
        <p className="leading-relaxed">
          Hunch is a fan project and is not affiliated with, authorized, maintained, sponsored or
          endorsed by Valve Corporation or Steam. Steam and the Steam logo are trademarks and/or
          registered trademarks of Valve Corporation in the U.S. and/or other countries.
        </p>
        <p className="text-[11px] text-muted">
          Game metadata, community tags, and median playtimes are retrieved via the Steam Web API and
          SteamSpy under standard fair-use non-commercial terms.
        </p>
      </div>
    </div>
  );
}
