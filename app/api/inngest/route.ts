import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";
import { seedCatalogFunction } from "@/inngest/functions/seed-catalog";
import { syncSteamLibraryFunction } from "@/inngest/functions/sync-steam-library";
import { dailyResyncCronFunction } from "@/inngest/functions/daily-resync-cron";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    seedCatalogFunction,
    syncSteamLibraryFunction,
    dailyResyncCronFunction,
  ],
});
