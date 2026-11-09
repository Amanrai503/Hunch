CREATE EXTENSION IF NOT EXISTS vector;--> statement-breakpoint
CREATE TYPE "public"."feedback_action" AS ENUM('not_interested', 'already_played', 'hide');--> statement-breakpoint
CREATE TYPE "public"."vote_type" AS ENUM('pick', 'pass', 'veto');--> statement-breakpoint
CREATE TABLE "feedback" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"game_id" uuid NOT NULL,
	"action" "feedback_action" NOT NULL,
	"reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "game_tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"game_id" uuid NOT NULL,
	"tag" text NOT NULL,
	"weight" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "games" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"steam_app_id" integer NOT NULL,
	"name" text NOT NULL,
	"short_description" text,
	"header_image" text NOT NULL,
	"capsule_image" text,
	"hero_image" text,
	"currency" text DEFAULT 'USD' NOT NULL,
	"price_initial" integer DEFAULT 0 NOT NULL,
	"price_final" integer DEFAULT 0 NOT NULL,
	"discount_percent" integer DEFAULT 0 NOT NULL,
	"is_free" boolean DEFAULT false NOT NULL,
	"steam_deck_compatibility" text DEFAULT 'unknown',
	"release_date" timestamp with time zone,
	"metacritic_score" integer,
	"steam_review_score" integer,
	"steam_review_sentiment" text,
	"total_reviews" integer DEFAULT 0 NOT NULL,
	"positive_reviews" integer DEFAULT 0 NOT NULL,
	"median_playtime_minutes" integer DEFAULT 0 NOT NULL,
	"average_playtime_minutes" integer DEFAULT 0 NOT NULL,
	"estimated_hours_to_beat" numeric,
	"embedding" vector(128),
	"last_enriched_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "games_steam_app_id_unique" UNIQUE("steam_app_id")
);
--> statement-breakpoint
CREATE TABLE "library_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"game_id" uuid NOT NULL,
	"playtime_forever_minutes" integer DEFAULT 0 NOT NULL,
	"playtime_2weeks_minutes" integer DEFAULT 0 NOT NULL,
	"rtime_last_played" timestamp with time zone,
	"has_playtime" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "list_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"list_id" uuid NOT NULL,
	"game_id" uuid NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lists" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"is_public" boolean DEFAULT false NOT NULL,
	"is_system_backlog" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ratings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"game_id" uuid NOT NULL,
	"score" integer NOT NULL,
	"review_text" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "rating_score_check" CHECK ("ratings"."score" >= 1 AND "ratings"."score" <= 10)
);
--> statement-breakpoint
CREATE TABLE "squad_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"squad_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"is_host" boolean DEFAULT false NOT NULL,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "squads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"host_user_id" uuid NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"filter_preferences" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "squads_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"steam_id" text,
	"display_name" text NOT NULL,
	"avatar_url" text NOT NULL,
	"profile_url" text,
	"is_private" boolean DEFAULT false NOT NULL,
	"is_sample_user" boolean DEFAULT false NOT NULL,
	"taste_vector" vector(128),
	"taste_profile_json" jsonb,
	"last_synced_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_steam_id_unique" UNIQUE("steam_id")
);
--> statement-breakpoint
CREATE TABLE "votes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"squad_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"game_id" uuid NOT NULL,
	"vote" "vote_type" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_tags" ADD CONSTRAINT "game_tags_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "library_items" ADD CONSTRAINT "library_items_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "library_items" ADD CONSTRAINT "library_items_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "list_items" ADD CONSTRAINT "list_items_list_id_lists_id_fk" FOREIGN KEY ("list_id") REFERENCES "public"."lists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "list_items" ADD CONSTRAINT "list_items_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lists" ADD CONSTRAINT "lists_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ratings" ADD CONSTRAINT "ratings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ratings" ADD CONSTRAINT "ratings_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "squad_members" ADD CONSTRAINT "squad_members_squad_id_squads_id_fk" FOREIGN KEY ("squad_id") REFERENCES "public"."squads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "squad_members" ADD CONSTRAINT "squad_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "squads" ADD CONSTRAINT "squads_host_user_id_users_id_fk" FOREIGN KEY ("host_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "votes" ADD CONSTRAINT "votes_squad_id_squads_id_fk" FOREIGN KEY ("squad_id") REFERENCES "public"."squads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "votes" ADD CONSTRAINT "votes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "votes" ADD CONSTRAINT "votes_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "user_game_feedback_idx" ON "feedback" USING btree ("user_id","game_id","action");--> statement-breakpoint
CREATE INDEX "game_tags_game_id_idx" ON "game_tags" USING btree ("game_id");--> statement-breakpoint
CREATE INDEX "game_tags_tag_idx" ON "game_tags" USING btree ("tag");--> statement-breakpoint
CREATE UNIQUE INDEX "game_tag_unique_idx" ON "game_tags" USING btree ("game_id","tag");--> statement-breakpoint
CREATE INDEX "games_embedding_hnsw_idx" ON "games" USING hnsw ("embedding" vector_cosine_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "user_game_library_idx" ON "library_items" USING btree ("user_id","game_id");--> statement-breakpoint
CREATE UNIQUE INDEX "list_game_idx" ON "list_items" USING btree ("list_id","game_id");--> statement-breakpoint
CREATE UNIQUE INDEX "user_game_rating_idx" ON "ratings" USING btree ("user_id","game_id");--> statement-breakpoint
CREATE UNIQUE INDEX "squad_user_idx" ON "squad_members" USING btree ("squad_id","user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "squad_user_game_vote_idx" ON "votes" USING btree ("squad_id","user_id","game_id");--> statement-breakpoint
CREATE UNIQUE INDEX "squad_user_single_veto_idx" ON "votes" USING btree ("squad_id","user_id") WHERE vote = 'veto';