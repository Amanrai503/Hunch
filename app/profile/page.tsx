"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Sparkles,
  Trophy,
  ExternalLink,
  SlidersHorizontal,
  Bookmark,
  Award,
  ArrowRight,
} from "lucide-react";

interface UserProfile {
  id?: string;
  steamId: string;
  displayName: string;
  avatarUrl: string;
  isSampleUser: boolean;
  libraryCount?: number;
  totalPlaytimeMinutes?: number;
}

export default function ProfilePage() {
  const [user, setUser] = useState<UserProfile>({
    steamId: "76561198000000000",
    displayName: "Sam The Deckbuilder",
    avatarUrl:
      "https://avatars.steamstatic.com/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_full.jpg",
    isSampleUser: true,
    libraryCount: 84,
    totalPlaytimeMinutes: 88800, // 1480 hours
  });

  useEffect(() => {
    async function loadMe() {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          if (data.user) {
            setUser((prev) => ({
              ...prev,
              ...data.user,
              libraryCount: data.user.isSampleUser ? 84 : 42,
              totalPlaytimeMinutes: data.user.isSampleUser ? 88800 : 36000,
            }));
          }
        }
      } catch {
        // fallback to default
      }
    }
    loadMe();
  }, []);

  const genreAffinities = [
    { name: "Roguelike Deckbuilder", score: 98, color: "bg-accent" },
    { name: "Turn-Based Strategy", score: 91, color: "bg-amber-600" },
    { name: "Tactical RPG", score: 84, color: "bg-indigo-600" },
    { name: "Action Roguelike", score: 78, color: "bg-emerald-600" },
    { name: "Pixel Graphics / Indie", score: 72, color: "bg-sky-600" },
    { name: "Resource Management", score: 65, color: "bg-stone-600" },
  ];

  const milestoneBadges = [
    {
      title: "Deck Architect",
      desc: "Logged 200+ hours in Slay the Spire & Balatro",
      icon: Trophy,
      unlocked: true,
    },
    {
      title: "Backlog Sleuth",
      desc: "Identified 12 unplayed games under 10 hours",
      icon: Bookmark,
      unlocked: true,
    },
    {
      title: "Squad Tactician",
      desc: "Successfully cast a game-saving veto in a squad room",
      icon: ShieldCheck,
      unlocked: true,
    },
    {
      title: "Steam Veteran",
      desc: "Profile active with community verified library sync",
      icon: Award,
      unlocked: true,
    },
  ];

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-10">
      {/* Header Profile Card */}
      <div className="rounded-2xl border border-line bg-surface p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={user.avatarUrl}
              alt={user.displayName}
              className="h-20 w-20 sm:h-24 sm:w-24 rounded-full border-2 border-line object-cover shadow-xs"
            />
            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="font-heading text-2xl sm:text-3xl font-black text-ink">
                  {user.displayName}
                </h1>
                {user.isSampleUser ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-2.5 py-0.5 text-xs font-semibold text-accent border border-accent/20">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Sample Profile
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 border border-emerald-200">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Steam Verified
                  </span>
                )}
              </div>

              <p className="text-xs text-muted flex items-center gap-2">
                <span>SteamID: {user.steamId}</span>
                <span>•</span>
                <a
                  href={`https://steamcommunity.com/profiles/${user.steamId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-accent inline-flex items-center gap-0.5"
                >
                  Steam Community Profile
                  <ExternalLink className="h-3 w-3" />
                </a>
              </p>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-3">
            <Link
              href="/start"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-ink bg-section hover:bg-line/70 border border-line rounded-lg transition-colors"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              <span>Calibrate Taste</span>
            </Link>

            <Link
              href="/settings"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-accent hover:bg-accent-hover rounded-lg shadow-2xs transition-colors"
            >
              <span>Settings</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        {/* Aggregate Stats Ribbons */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-6 border-t border-line/70">
          <div className="space-y-1">
            <span className="text-[11px] font-semibold uppercase text-muted tracking-wider">
              Steam Library
            </span>
            <div className="font-heading text-2xl font-black text-ink">
              {user.libraryCount || 84} Games
            </div>
            <p className="text-[11px] text-muted">Synced via Steam API</p>
          </div>

          <div className="space-y-1">
            <span className="text-[11px] font-semibold uppercase text-muted tracking-wider">
              Lifetime Playtime
            </span>
            <div className="font-heading text-2xl font-black text-ink">
              ~{Math.round((user.totalPlaytimeMinutes || 88800) / 60)} hrs
            </div>
            <p className="text-[11px] text-accent font-medium">Top 5% Deckbuilder</p>
          </div>

          <div className="space-y-1">
            <span className="text-[11px] font-semibold uppercase text-muted tracking-wider">
              Backlog Queue
            </span>
            <div className="font-heading text-2xl font-black text-ink">12 Unplayed</div>
            <p className="text-[11px] text-muted">Under 5h playtime</p>
          </div>

          <div className="space-y-1">
            <span className="text-[11px] font-semibold uppercase text-muted tracking-wider">
              Taste Confidence
            </span>
            <div className="font-heading text-2xl font-black text-emerald-800">
              98.4%
            </div>
            <p className="text-[11px] text-muted">High statistical match</p>
          </div>
        </div>
      </div>

      {/* Main Grid: Taste Vector Breakdown & Milestone Badges */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Taste Profile Distribution (2 cols) */}
        <div className="lg:col-span-2 rounded-2xl border border-line bg-surface p-6 sm:p-8 space-y-6 shadow-xs">
          <div className="flex items-center justify-between border-b border-line pb-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Taste Vector Calibration</span>
              </div>
              <h2 className="font-heading text-xl font-bold text-ink">
                Calculated Tag Preferences
              </h2>
            </div>

            <Link
              href="/start"
              className="text-xs font-bold text-accent hover:underline flex items-center gap-1"
            >
              Re-calibrate →
            </Link>
          </div>

          <p className="text-xs text-muted leading-relaxed">
            Hunch generates an L2-normalized sparse vector from your Steam library playtime
            weighted by sqrt(playtime) combined with your explicit onboarding calibrations.
          </p>

          <div className="space-y-4 pt-2">
            {genreAffinities.map((item) => (
              <div key={item.name} className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-ink">{item.name}</span>
                  <span className="font-bold text-muted">{item.score}% Match</span>
                </div>
                <div className="h-2 w-full bg-section rounded-full overflow-hidden">
                  <div
                    className={`h-full ${item.color} rounded-full transition-all duration-500`}
                    style={{ width: `${item.score}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-line/70 bg-[#FAF6EC] p-4 text-xs text-ink space-y-1 mt-6">
            <span className="font-bold">Recommendation Focus:</span>
            <p className="text-muted leading-relaxed">
              You strongly prefer turn-based procedural combat with high build diversity. Your
              recommendation feed will deprioritize 100+ hour open-world fetch quests and heavily
              surface 10–40 hour indie triumphs.
            </p>
          </div>
        </div>

        {/* Milestone Badges (1 col) */}
        <div className="rounded-2xl border border-line bg-surface p-6 sm:p-8 space-y-6 shadow-xs">
          <div className="space-y-1 border-b border-line pb-4">
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700">
              <Trophy className="h-3.5 w-3.5" />
              <span>Gamer Milestones</span>
            </div>
            <h2 className="font-heading text-xl font-bold text-ink">Profile Badges</h2>
          </div>

          <div className="space-y-3.5">
            {milestoneBadges.map((badge) => {
              const Icon = badge.icon;
              return (
                <div
                  key={badge.title}
                  className="flex items-start gap-3 p-3 rounded-xl border border-line/80 bg-bg/50"
                >
                  <div className="h-9 w-9 rounded-lg bg-section flex items-center justify-center text-accent shrink-0">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-heading text-xs font-bold text-ink">{badge.title}</h3>
                    <p className="text-[11px] text-muted mt-0.5 leading-snug">{badge.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-2">
            <Link
              href="/for-you"
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-accent hover:bg-accent-hover shadow-xs transition-colors"
            >
              <span>Explore My Feed</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
