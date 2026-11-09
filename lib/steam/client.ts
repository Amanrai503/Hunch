export interface SteamOwnedGame {
  appid: number;
  name: string;
  playtime_forever: number; // in minutes
  playtime_2weeks?: number; // in minutes
  rtime_last_played: number; // Unix timestamp
  img_icon_url?: string;
}

export interface GetOwnedGamesResult {
  success: boolean;
  isPrivate?: boolean;
  gameCount: number;
  games: SteamOwnedGame[];
  error?: string;
}

export async function getOwnedGames(
  steamId: string,
  apiKey = process.env.STEAM_API_KEY
): Promise<GetOwnedGamesResult> {
  if (!apiKey || apiKey === "dummy_steam_api_key_for_dev") {
    return {
      success: false,
      gameCount: 0,
      games: [],
      error: "STEAM_API_KEY is not configured.",
    };
  }

  const url = `https://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/?key=${apiKey}&steamid=${steamId}&include_appinfo=1&include_played_free_games=1&format=json`;

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Hunch-Steam-Recommender/1.0",
      },
      next: { revalidate: 300 }, // 5 min cache
    });

    if (res.status === 401 || res.status === 403) {
      return {
        success: false,
        gameCount: 0,
        games: [],
        error: "Steam API key is unauthorized or profile games are private.",
      };
    }

    if (!res.ok) {
      return {
        success: false,
        gameCount: 0,
        games: [],
        error: `Steam API responded with HTTP ${res.status}`,
      };
    }

    const data = await res.json();
    const response = data.response;

    if (!response || Object.keys(response).length === 0) {
      // Empty response from Steam usually indicates private profile
      return {
        success: true,
        isPrivate: true,
        gameCount: 0,
        games: [],
      };
    }

    const games: SteamOwnedGame[] = response.games || [];
    return {
      success: true,
      isPrivate: false,
      gameCount: response.game_count || games.length,
      games,
    };
  } catch (err) {
    return {
      success: false,
      gameCount: 0,
      games: [],
      error: String(err),
    };
  }
}

