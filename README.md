# Hunch 🎯

> **Steam recommendations, explained.**  
> Never buy another game you abandon after 90 minutes. Transparent picks calculated from your actual playtime, tags, and regret risk.

---

## Tech Stack

* **Framework:** Next.js (App Router) + TypeScript + React 19
* **Styling:** Tailwind CSS v4 + Radix UI / custom editorial components (No dark mode)
* **Typography:** `Bricolage Grotesque` (headings) & `DM Sans` (body) via `next/font`
* **Design Tokens:**
  * Background: `#F4EFE6`
  * Surface: `#FBF8F2`
  * Section: `#ECE5D7`
  * Line: `#D8D0C0`
  * Ink: `#1B1B1F`
  * Muted: `#5C5A55`
  * Accent: `#C8321A`
* **Database & ORM:** PostgreSQL with `pgvector` extension via Drizzle ORM
* **Background Jobs:** Inngest (throttled catalog enrichment ~200 req/5 min, library sync, daily cron)
* **Realtime Multiplayer:** Supabase Realtime (collaborative Squad voting rooms)
* **Auth:** Steam OpenID 2.0 (read-only 64-bit SteamID, nonce replay protection, `httpOnly` signed cookie session) + One-click Sample Profile Mode
* **Ranking Engine:** Pure, decoupled mathematical module (Taste 0.40, Wilson Review 0.20, Inverted Regret 0.15, Time Fit 0.15, Price 0.10)

---

## Getting Started

### 1. Prerequisites
* Node.js 20+
* Docker & Docker Compose (for local PostgreSQL with `pgvector`)

### 2. Setup Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

| Variable | Description | Default / Example |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_APP_URL` | Base URL of the application | `http://localhost:3000` |
| `SESSION_SECRET` | 32+ char secret for JWT cookie encryption | `development_secret_must_be_at_least_32_bytes_long_hunch` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://postgres:password@localhost:5432/hunch` |
| `STEAM_API_KEY` | Steam Web API Key ([Get one here](https://steamcommunity.com/dev/apikey)) | `your_key_here` |
| `INNGEST_EVENT_KEY` | Inngest event key for background jobs | `local` |
| `INNGEST_SIGNING_KEY` | Inngest signing key | `local` |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Project URL (Squad rooms) | `https://your-project.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`| Supabase Anonymous Public Key | `your-anon-key` |

### 3. Start PostgreSQL with pgvector
```bash
docker compose up -d
```

### 4. Install Dependencies & Run Development Server
```bash
npm install
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) in your browser.

---

## Sample Profile Mode (Zero Setup Required)

Hunch includes a built-in **Sample Profile Mode**. Click **"Try Sample Profile"** in the top navigation or on the homepage to instantly explore the app with pre-seeded games, tags, and a calibrated taste vector without requiring a Steam account or Steam API key.

---

## 5-Factor Pure Ranking Engine

Hunch computes a 0–100 composite score from five pure mathematical factors:
1. **Taste Match (40%):** Sparse tag-weighted cosine similarity against actual library playtime.
2. **Review Quality (20%):** 95% Wilson score confidence lower bound.
3. **Inverted Regret Risk (15%):** Penalizes games with high early drop-off (&lt;2 hours) and review sentiment volatility.
4. **Time Fit (15%):** Gaussian distribution matching user bandwidth against median hours to beat.
5. **Price & Sale Value (10%):** Active discount depth and price-per-hour ratio.

---

## Project Roadmap

* [x] **Phase 1: Foundation & Editorial Design System**
  * Scaffold light editorial theme, tokens, and typography
  * OpenID 2.0 auth with nonce verification & sample profile mode
  * Shared header, footer with Valve disclaimer, and core page states
* [x] **Phase 2: SteamSpy & Ingestion Pipeline**
  * SteamSpy client (`lib/steam/steamspy.ts`) for tags, owner counts, and median playtime
  * Rate-limited Steam Storefront API client (`lib/steam/store-api.ts`) with backoff (~200 req / 5 min)
  * Steam Web API library sync (`lib/steam/client.ts`) for user owned games & playtimes
  * Inngest functions: `seed-catalog` (2–5k games enrichment), `sync-steam-library`, `daily-resync-cron`
  * Curated 50+ rich game fixtures (`lib/sample-data/sample-games.ts`) & database seeder (`lib/sample-data/seeder.ts`)
* [x] **Phase 3: Onboarding, Pure Ranking Engine & Taste Profile**
  * Interactive onboarding questionnaire at `/start` (mechanics, hours target, budget)
  * Pure ranking engine in `lib/ranking/`: Taste (0.40), Wilson review lower bound (0.20), Inverted regret risk (0.15), Time fit (0.15), Price/sale (0.10)
  * Explainable score breakdown & "Why this?" rationale generator (`lib/ranking/explainer.ts`)
  * Sparse tag-weight vector synthesis, L2 normalization, and 128D projection for pgvector (`lib/ranking/taste-vector.ts`)
  * Unit test suite with 12/12 passing tests (`npm test`) across Wilson formula, pure ranking, and vectors
* [ ] **Phase 4: Core Recommendation Experience**
  * `/for-you`, `/discover`, game details, and "Why this?" inspection drawer
* [ ] **Phase 5: My Games, Squad Rooms & Polish**
  * Local backlog & lists, Supabase Realtime squad rooms (max 1 veto), and profile radar

---

## Legal Disclaimer

*Hunch is a fan project and is not affiliated with, authorized, maintained, sponsored, or endorsed by Valve Corporation or Steam. Steam and the Steam logo are registered trademarks of Valve Corporation in the U.S. and/or other countries.*
