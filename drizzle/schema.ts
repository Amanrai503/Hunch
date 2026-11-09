import {
  pgTable,
  uuid,
  text,
  integer,
  boolean,
  timestamp,
  numeric,
  jsonb,
  customType,
  uniqueIndex,
  index,
  check,
  pgEnum,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// 128-dimensional pgvector embedding custom type
export const vector = customType<{ data: number[] }>({
  dataType() {
    return "vector(128)";
  },
  toDriver(value: number[]) {
    return JSON.stringify(value);
  },
  fromDriver(value: unknown) {
    if (typeof value === "string") {
      try {
        return JSON.parse(value);
      } catch {
        return [];
      }
    }
    return (value as number[]) || [];
  },
});

export const voteTypeEnum = pgEnum("vote_type", ["pick", "pass", "veto"]);
export const feedbackActionEnum = pgEnum("feedback_action", [
  "not_interested",
  "already_played",
  "hide",
]);

// 1. Users
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  steamId: text("steam_id").unique(), // null or prefix 'sample_'
  displayName: text("display_name").notNull(),
  avatarUrl: text("avatar_url").notNull(),
  profileUrl: text("profile_url"),
  isPrivate: boolean("is_private").default(false).notNull(),
  isSampleUser: boolean("is_sample_user").default(false).notNull(),
  tasteVector: vector("taste_vector"),
  tasteProfileJson: jsonb("taste_profile_json").$type<{
    topTags: { tag: string; weight: number }[];
    medianPlaytimePreference: number;
    budgetPreference: "budget" | "any" | "sales_only";
  }>(),
  lastSyncedAt: timestamp("last_synced_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// 2. Games
export const games = pgTable(
  "games",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    steamAppId: integer("steam_app_id").notNull().unique(), // unique creates an index automatically
    name: text("name").notNull(),
    shortDescription: text("short_description"),
    headerImage: text("header_image").notNull(),
    capsuleImage: text("capsule_image"),
    heroImage: text("hero_image"),
    currency: text("currency").default("USD").notNull(),
    priceInitial: integer("price_initial").default(0).notNull(), // in cents
    priceFinal: integer("price_final").default(0).notNull(),     // in cents
    discountPercent: integer("discount_percent").default(0).notNull(),
    isFree: boolean("is_free").default(false).notNull(),
    steamDeckCompatibility: text("steam_deck_compatibility").default("unknown"),
    releaseDate: timestamp("release_date", { withTimezone: true }),
    metacriticScore: integer("metacritic_score"),
    steamReviewScore: integer("steam_review_score"), // 0 - 100% positive
    steamReviewSentiment: text("steam_review_sentiment"),
    totalReviews: integer("total_reviews").default(0).notNull(),
    positiveReviews: integer("positive_reviews").default(0).notNull(),
    medianPlaytimeMinutes: integer("median_playtime_minutes").default(0).notNull(), // SteamSpy
    averagePlaytimeMinutes: integer("average_playtime_minutes").default(0).notNull(),
    estimatedHoursToBeat: numeric("estimated_hours_to_beat"),
    embedding: vector("embedding"),
    lastEnrichedAt: timestamp("last_enriched_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("games_embedding_hnsw_idx").using("hnsw", table.embedding.op("vector_cosine_ops")),
  ]
);

// 3. Game Tags
export const gameTags = pgTable(
  "game_tags",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    gameId: uuid("game_id")
      .references(() => games.id, { onDelete: "cascade" })
      .notNull(),
    tag: text("tag").notNull(),
    weight: integer("weight").default(1).notNull(), // SteamSpy tag votes
  },
  (table) => [
    index("game_tags_game_id_idx").on(table.gameId),
    index("game_tags_tag_idx").on(table.tag),
    uniqueIndex("game_tag_unique_idx").on(table.gameId, table.tag),
  ]
);

// 4. Library Items
export const libraryItems = pgTable(
  "library_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    gameId: uuid("game_id")
      .references(() => games.id, { onDelete: "cascade" })
      .notNull(),
    playtimeForeverMinutes: integer("playtime_forever_minutes").default(0).notNull(),
    playtime2WeeksMinutes: integer("playtime_2weeks_minutes").default(0).notNull(),
    rtimeLastPlayed: timestamp("rtime_last_played", { withTimezone: true }),
    hasPlaytime: boolean("has_playtime").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("user_game_library_idx").on(table.userId, table.gameId),
  ]
);

// 5. Ratings (1 - 10 check constraint)
export const ratings = pgTable(
  "ratings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    gameId: uuid("game_id")
      .references(() => games.id, { onDelete: "cascade" })
      .notNull(),
    score: integer("score").notNull(),
    reviewText: text("review_text"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("user_game_rating_idx").on(table.userId, table.gameId),
    check("rating_score_check", sql`${table.score} >= 1 AND ${table.score} <= 10`),
  ]
);

// 6. Lists
export const lists = pgTable("lists", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  title: text("title").notNull(),
  description: text("description"),
  isPublic: boolean("is_public").default(false).notNull(),
  isSystemBacklog: boolean("is_system_backlog").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// 7. List Items
export const listItems = pgTable(
  "list_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    listId: uuid("list_id")
      .references(() => lists.id, { onDelete: "cascade" })
      .notNull(),
    gameId: uuid("game_id")
      .references(() => games.id, { onDelete: "cascade" })
      .notNull(),
    sortOrder: integer("sort_order").default(0).notNull(),
    note: text("note"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("list_game_idx").on(table.listId, table.gameId),
  ]
);

// 8. Feedback (not_interested, already_played, hide)
export const feedback = pgTable(
  "feedback",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    gameId: uuid("game_id")
      .references(() => games.id, { onDelete: "cascade" })
      .notNull(),
    action: feedbackActionEnum("action").notNull(),
    reason: text("reason"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("user_game_feedback_idx").on(table.userId, table.gameId, table.action),
  ]
);

// 9. Squads
export const squads = pgTable("squads", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  hostUserId: uuid("host_user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  status: text("status").default("active").notNull(),
  filterPreferences: jsonb("filter_preferences").$type<{
    maxPriceCents?: number;
    tags?: string[];
    coopOnly?: boolean;
    maxHoursToBeat?: number;
  }>(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// 10. Squad Members
export const squadMembers = pgTable(
  "squad_members",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    squadId: uuid("squad_id")
      .references(() => squads.id, { onDelete: "cascade" })
      .notNull(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    isHost: boolean("is_host").default(false).notNull(),
    joinedAt: timestamp("joined_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("squad_user_idx").on(table.squadId, table.userId),
  ]
);

// 11. Votes (pick, pass, veto; max 1 veto per user per squad)
export const votes = pgTable(
  "votes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    squadId: uuid("squad_id")
      .references(() => squads.id, { onDelete: "cascade" })
      .notNull(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    gameId: uuid("game_id")
      .references(() => games.id, { onDelete: "cascade" })
      .notNull(),
    vote: voteTypeEnum("vote").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("squad_user_game_vote_idx").on(table.squadId, table.userId, table.gameId),
    uniqueIndex("squad_user_single_veto_idx")
      .on(table.squadId, table.userId)
      .where(sql`vote = 'veto'`),
  ]
);

