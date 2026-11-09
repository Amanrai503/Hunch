import { steamStoreRateLimiter } from "./rate-limiter";

export interface SteamStoreGameDetails {
  steamAppId: number;
  name: string;
  shortDescription: string;
  headerImage: string;
  capsuleImage?: string;
  heroImage?: string;
  currency: string;
  priceInitial: number; // in cents
  priceFinal: number;   // in cents
  discountPercent: number;
  isFree: boolean;
  steamDeckCompatibility: "verified" | "playable" | "unsupported" | "unknown";
  releaseDate?: Date | null;
  metacriticScore?: number | null;
}

export async function fetchSteamStoreDetails(
  appId: number
): Promise<SteamStoreGameDetails | null> {
  await steamStoreRateLimiter.acquire();

  const url = `https://store.steampowered.com/api/appdetails?appids=${appId}&cc=us&l=en`;

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Hunch-Steam-Recommender/1.0",
      },
      next: { revalidate: 86400 }, // 24 hours
    });

    if (res.status === 429) {
      steamStoreRateLimiter.record429();
      return null;
    }

    if (!res.ok) {
      return null;
    }

    steamStoreRateLimiter.recordSuccess();

    const json = await res.json();
    const appEntry = json[String(appId)];

    if (!appEntry || !appEntry.success || !appEntry.data) {
      return null;
    }

    const d = appEntry.data;

    let releaseDate: Date | null = null;
    if (d.release_date?.date) {
      const parsed = Date.parse(d.release_date.date);
      if (!isNaN(parsed)) {
        releaseDate = new Date(parsed);
      }
    }

    let deckStatus: "verified" | "playable" | "unsupported" | "unknown" = "unknown";
    // Check categories or controller support
    const categories: { id: number; description: string }[] = d.categories || [];
    if (categories.some((c) => c.id === 28)) {
      deckStatus = "verified";
    } else if (categories.some((c) => c.id === 18)) {
      deckStatus = "playable";
    }

    const priceOverview = d.price_overview;

    return {
      steamAppId: appId,
      name: d.name || "",
      shortDescription: d.short_description || "",
      headerImage: d.header_image || `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${appId}/header.jpg`,
      capsuleImage: d.capsule_image,
      heroImage: `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${appId}/library_hero.jpg`,
      currency: priceOverview?.currency || "USD",
      priceInitial: priceOverview?.initial || 0,
      priceFinal: priceOverview?.final || 0,
      discountPercent: priceOverview?.discount_percent || 0,
      isFree: Boolean(d.is_free),
      steamDeckCompatibility: deckStatus,
      releaseDate,
      metacriticScore: d.metacritic?.score || null,
    };
  } catch (err) {
    console.warn(`Error fetching Steam Store details for appId ${appId}:`, err);
    return null;
  }
}

