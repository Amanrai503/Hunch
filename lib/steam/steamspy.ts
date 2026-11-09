const STEAMSPY_BASE_URL = "https://steamspy.com/api.php";

export interface SteamSpyGameDetails {
  appid: number;
  name: string;
  developer?: string;
  publisher?: string;
  positive: number;
  negative: number;
  userscore?: number;
  owners?: string;
  average_forever: number; // in minutes
  average_2weeks: number;
  median_forever: number;  // in minutes
  median_2weeks: number;
  price?: string;          // in cents as string
  initialprice?: string;
  discount?: string;
  tags?: Record<string, number>; // Tag name -> vote count
}

export interface SteamSpyTagSummary {
  appid: number;
  name: string;
  developer?: string;
  publisher?: string;
  positive: number;
  negative: number;
  owners?: string;
  average_forever: number;
  median_forever: number;
  price?: string;
}

export async function fetchSteamSpyGame(appId: number): Promise<SteamSpyGameDetails | null> {
  const url = `${STEAMSPY_BASE_URL}?request=appdetails&appid=${appId}`;
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Hunch-Steam-Recommender/1.0",
      },
      next: { revalidate: 3600 }, // cache 1 hour
    });

    if (!res.ok) {
      console.warn(`SteamSpy HTTP ${res.status} for appId ${appId}`);
      return null;
    }

    const data = await res.json();
    if (!data || !data.appid) {
      return null;
    }

    return {
      appid: Number(data.appid),
      name: data.name || "",
      developer: data.developer,
      publisher: data.publisher,
      positive: Number(data.positive) || 0,
      negative: Number(data.negative) || 0,
      userscore: Number(data.userscore) || 0,
      owners: data.owners,
      average_forever: Number(data.average_forever) || 0,
      average_2weeks: Number(data.average_2weeks) || 0,
      median_forever: Number(data.median_forever) || 0,
      median_2weeks: Number(data.median_2weeks) || 0,
      price: data.price,
      initialprice: data.initialprice,
      discount: data.discount,
      tags: typeof data.tags === "object" && data.tags !== null ? data.tags : {},
    };
  } catch (err) {
    console.warn(`Error fetching SteamSpy data for appId ${appId}:`, err);
    return null;
  }
}

export async function fetchTopGamesByTag(tag: string): Promise<SteamSpyTagSummary[]> {
  const url = `${STEAMSPY_BASE_URL}?request=tag&tag=${encodeURIComponent(tag)}`;
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Hunch-Steam-Recommender/1.0",
      },
      next: { revalidate: 86400 }, // cache 24 hours
    });

    if (!res.ok) return [];

    const data = await res.json();
    if (!data || typeof data !== "object") return [];

    return Object.values(data as Record<string, Record<string, unknown>>).map((item) => ({
      appid: Number(item.appid),
      name: String(item.name || ""),
      developer: item.developer ? String(item.developer) : undefined,
      publisher: item.publisher ? String(item.publisher) : undefined,
      positive: Number(item.positive) || 0,
      negative: Number(item.negative) || 0,
      owners: item.owners ? String(item.owners) : undefined,
      average_forever: Number(item.average_forever) || 0,
      median_forever: Number(item.median_forever) || 0,
      price: item.price ? String(item.price) : undefined,
    }));
  } catch (err) {
    console.warn(`Error fetching SteamSpy top games for tag ${tag}:`, err);
    return [];
  }
}

export async function fetchTopGamesByGenre(genre: string): Promise<SteamSpyTagSummary[]> {
  const url = `${STEAMSPY_BASE_URL}?request=genre&genre=${encodeURIComponent(genre)}`;
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Hunch-Steam-Recommender/1.0",
      },
      next: { revalidate: 86400 },
    });

    if (!res.ok) return [];

    const data = await res.json();
    if (!data || typeof data !== "object") return [];

    return Object.values(data as Record<string, Record<string, unknown>>).map((item) => ({
      appid: Number(item.appid),
      name: String(item.name || ""),
      developer: item.developer ? String(item.developer) : undefined,
      publisher: item.publisher ? String(item.publisher) : undefined,
      positive: Number(item.positive) || 0,
      negative: Number(item.negative) || 0,
      owners: item.owners ? String(item.owners) : undefined,
      average_forever: Number(item.average_forever) || 0,
      median_forever: Number(item.median_forever) || 0,
      price: item.price ? String(item.price) : undefined,
    }));
  } catch (err) {
    console.warn(`Error fetching SteamSpy top games for genre ${genre}:`, err);
    return [];
  }
}
