import { z } from "zod";

export const envSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  SESSION_SECRET: z.string().min(32).default("development_secret_must_be_at_least_32_bytes_long_hunch"),
  DATABASE_URL: z.string().url().default("postgresql://postgres:password@localhost:5432/hunch"),
  STEAM_API_KEY: z.string().default("dummy_steam_api_key_for_dev"),
  INNGEST_EVENT_KEY: z.string().default("local"),
  INNGEST_SIGNING_KEY: z.string().default("local"),
  NEXT_PUBLIC_SUPABASE_URL: z.string().default(""),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().default(""),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
});

export type Env = z.infer<typeof envSchema>;

function parseEnv(): Env {
  const result = envSchema.safeParse({
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    SESSION_SECRET: process.env.SESSION_SECRET,
    DATABASE_URL: process.env.DATABASE_URL,
    STEAM_API_KEY: process.env.STEAM_API_KEY,
    INNGEST_EVENT_KEY: process.env.INNGEST_EVENT_KEY,
    INNGEST_SIGNING_KEY: process.env.INNGEST_SIGNING_KEY,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NODE_ENV: process.env.NODE_ENV,
  });

  if (!result.success) {
    console.error("❌ Invalid environment variables:", result.error.format());
    throw new Error("Invalid environment variables");
  }

  return result.data;
}

export const env = parseEnv();
