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

## Docker & AWS EC2 Deployment 🐳

### Option A: Complete Stack via Docker Compose (Recommended)
Runs both the Next.js web application and PostgreSQL with `pgvector`, automatically mounts schema migrations into `/docker-entrypoint-initdb.d/`, and sets up container networking.

1. **Clone repository on your EC2 instance:**
   ```bash
   git clone <your-repo-url>
   cd hunch
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   # Set NEXT_PUBLIC_APP_URL to your EC2 public IP or domain:
   # NEXT_PUBLIC_APP_URL=http://<YOUR_EC2_PUBLIC_IP>:3000
   ```

3. **Build and start containers:**
   ```bash
   docker compose up -d --build
   ```

4. **Seed database with 50+ curated games & SteamSpy metadata:**
   ```bash
   curl http://localhost:3000/api/seed
   ```

5. **AWS EC2 Security Group:**
   Ensure Inbound Rules allow **Custom TCP Port 3000** (or port 80 if reverse-proxied with Nginx) from your IP or `0.0.0.0/0`.
   Open `http://<YOUR_EC2_PUBLIC_IP>:3000` in your browser.

---

### Option B: Standalone Docker Run
If connecting to an external database (e.g., AWS RDS PostgreSQL with `pgvector` or Supabase):

1. **Build image:**
   ```bash
   docker build -t hunch .
   ```

2. **Run container:**
   ```bash
   docker run -d \
     -p 3000:3000 \
     --name hunch \
     --restart always \
     -e DATABASE_URL="postgresql://user:password@your-db-host:5432/hunch" \
     -e SESSION_SECRET="development_secret_must_be_at_least_32_bytes_long_hunch" \
     -e NEXT_PUBLIC_APP_URL="http://<YOUR_EC2_PUBLIC_IP>:3000" \
     hunch
   ```

---

## Jenkins CI/CD Pipeline & GitHub Webhook 🚀

This repository includes a production-ready declarative [`Jenkinsfile`](./Jenkinsfile) that automates linting, testing, Docker image building, zero-downtime container updating, and post-deploy health checks whenever code is pushed to GitHub.

### 1. GitHub Webhook Setup
1. Go to your GitHub repository -> **Settings** -> **Webhooks** -> **Add webhook**.
2. **Payload URL:** `http://<YOUR_JENKINS_SERVER_IP>:8080/github-webhook/`
3. **Content type:** `application/json`
4. **Which events would you like to trigger this webhook?** Select **Just the push event**.
5. Click **Add webhook**.

### 2. Jenkins Job Configuration
1. In Jenkins dashboard, click **New Item** -> Name it `hunch-pipeline` -> Select **Pipeline** -> Click **OK**.
2. Under **Build Triggers**, check **GitHub hook trigger for GITScm polling**.
3. Under **Pipeline**:
   - **Definition:** Pipeline script from SCM
   - **SCM:** Git
   - **Repository URL:** `<your-github-repo-url>`
   - **Branch Specifier:** `*/main`
   - **Script Path:** `Jenkinsfile`
4. Click **Save**.

### 3. Pipeline Stages Executed on Every Push
- **Checkout:** Pulls the latest commit.
- **Test & Lint:** Runs `npm ci`, ESLint, and the 12 ranking algorithm unit tests.
- **Build Docker Image:** Builds the Next.js standalone container tagged with the Jenkins build number (`hunch-web:<build_number>` and `hunch-web:latest`).
- **Deploy & Update Service:** Gracefully updates the running container using `docker compose up -d --build --no-deps web`.
- **Health Check:** Polls `http://localhost:3000` until HTTP 200 is verified.
- **Cleanup:** Automatically prunes unused dangling Docker images.

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
* [x] **Phase 4: Core Recommendation Experience**
  * Algorithmic recommendation feed at `/for-you` with quick filters (Deck verified, Under $20, Under 25h, Sales)
  * Exploratory catalog at `/discover` with multi-facet searching, genre carousels, and multi-mode sorting
  * Recommendation card component with match %, review badges, and playtime estimates
  * Slide-out "Why This?" drawer with 5-factor breakdown bars, Wilson metrics, and plain-English reasons
  * Complete feedback loop (`/api/feedback` & `/api/ratings`): Not Interested, Already Played, Hide, and 1–10 rating dialog with DB check constraint
  * Game detail page at `/games/[appId]` with SteamSpy community tags, regret risk analysis, and store links
* [x] **Phase 5: My Games, Squad Decider Rooms, Profile & Settings**
  * **My Games (`/my-games`):** Steam library browser, backlog organizer (&lt;5 hours filter), and custom list creator with zero-write-to-Steam guarantee.
  * **Squad Decider Lobby (`/squad`):** Create session rooms with custom filters or join existing sessions via 6-digit room code (`SQ-XXXX`).
  * **Realtime Collaborative Room (`/squad/[code]`):**
    * Supabase Realtime channel integration with live member presence and avatar dots.
    * Realtime broadcast voting deck (`Pick` +1, `Pass` 0, `Veto` strike).
    * **The 1-Veto Rule:** Strict enforcement of max 1 veto per user per squad session backed by application logic and PostgreSQL partial unique index `uniqueIndex("squad_user_single_veto_idx").on(table.squadId, table.userId).where(sql`vote = 'veto'`)`.
    * Live Consensus Scoreboard: real-time ranked consensus leaderboards with instant elimination of vetoed games and winner crowning.
    * Built-in peer simulation for immediate solo testing.
  * **Gamer Profile (`/profile`):** Taste vector affinity bars (Roguelike, Strategy, RPG, Indie), playtime statistics, backlog metrics, and gamer achievement badges.
  * **Settings (`/settings`):** Session management, manual Steam library resync trigger, taste calibration reset, local data wipe, and Valve compliance notes.
  * **100% Passing Test Suite & Clean Turbopack Build:** 12/12 unit tests passing via `npm test`, 0 lint warnings/errors via `npm run lint`, all 24 routes cleanly compiled via `npm run build`.

---

## Legal Disclaimer

*Hunch is a fan project and is not affiliated with, authorized, maintained, sponsored, or endorsed by Valve Corporation or Steam. Steam and the Steam logo are registered trademarks of Valve Corporation in the U.S. and/or other countries.*
