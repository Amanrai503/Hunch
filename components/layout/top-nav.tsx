"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles, Compass, Library, Users, Search, LogOut, ShieldCheck, Settings } from "lucide-react";

interface TopNavProps {
  user?: {
    displayName: string;
    avatarUrl: string;
    isSampleUser: boolean;
    isPrivate?: boolean;
  } | null;
}

export function TopNav({ user }: TopNavProps) {
  const pathname = usePathname();

  const navItems = [
    { label: "For You", href: "/for-you", icon: Sparkles },
    { label: "Discover", href: "/discover", icon: Compass },
    { label: "My Games", href: "/my-games", icon: Library },
    { label: "Squad", href: "/squad", icon: Users },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-line bg-surface/95 backdrop-blur supports-[backdrop-filter]:bg-surface/80">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand / Logo */}
        <div className="flex items-center gap-8">
          <Link href="/" className="group flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-accent text-white font-heading font-black text-xl shadow-xs transition-transform group-hover:scale-105">
              H
            </div>
            <div className="flex flex-col">
              <span className="font-heading text-xl font-bold tracking-tight text-ink">
                Hunch
              </span>
              <span className="text-[10px] uppercase tracking-widest text-muted -mt-1 font-medium">
                Steam Explained
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-section text-accent font-semibold"
                      : "text-muted hover:text-ink hover:bg-section/60"
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isActive ? "text-accent" : "text-muted"}`} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Search Bar & Auth Actions */}
        <div className="flex items-center gap-3">
          <div className="relative hidden lg:block w-56">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted pointer-events-none" />
            <input
              type="text"
              placeholder="Search games or tags..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-bg border border-line rounded-md text-ink placeholder:text-muted focus:outline-hidden focus:ring-1 focus:ring-accent focus:border-accent transition-all"
            />
          </div>

          {user ? (
            <div className="flex items-center gap-3">
              {user.isSampleUser && (
                <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-2.5 py-0.5 text-xs font-semibold text-accent border border-accent/20">
                  <ShieldCheck className="h-3 w-3" />
                  Sample Mode
                </span>
              )}

              <div className="flex items-center gap-2 pl-2 border-l border-line">
                <Link
                  href="/profile"
                  className="flex items-center gap-2 group hover:opacity-90 transition-opacity"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={user.avatarUrl}
                    alt={user.displayName}
                    className="h-8 w-8 rounded-full border border-line object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <span className="hidden sm:inline text-xs font-medium text-ink max-w-[120px] truncate">
                    {user.displayName}
                  </span>
                </Link>

                <Link
                  href="/settings"
                  title="Settings"
                  className="p-1.5 rounded-md text-muted hover:text-ink hover:bg-section transition-colors"
                >
                  <Settings className="h-4 w-4" />
                </Link>

                <a
                  href="/api/auth/logout"
                  title="Sign Out"
                  className="p-1.5 rounded-md text-muted hover:text-accent hover:bg-section transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                </a>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <a
                href="/api/auth/sample"
                className="hidden sm:inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-ink bg-section hover:bg-line/70 rounded-md border border-line transition-colors"
              >
                Sample Profile
              </a>
              <a
                href="/api/auth/steam"
                className="inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-bold text-white bg-accent hover:bg-accent-hover rounded-md shadow-xs transition-colors"
              >
                <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2a10 10 0 0 0-10 10c0 4.42 2.87 8.17 6.84 9.5l1.63-2.39a3.5 3.5 0 0 1-.47-.41l-2.92-1.22a5 5 0 1 1 8.87-3.83 5 5 0 0 1-1.39 3.5l2.44 3.47A10 10 0 0 0 12 2zm-4.3 14.5a1.7 1.7 0 1 0 0-3.4 1.7 1.7 0 0 0 0 3.4zm7.3-4.5a2.5 2.5 0 1 0-5 0 2.5 2.5 0 0 0 5 0z" />
                </svg>
                Sign in with Steam
              </a>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
