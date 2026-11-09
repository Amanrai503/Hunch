export interface UserProfileInput {
  userId?: string;
  tasteVector?: Record<string, number>; // Tag name -> normalized weight
  favoriteTags?: string[];
  preferredMedianHoursToBeat?: number; // e.g. 20 hours
  preferredSessionMinutes?: number;    // e.g. 60 minutes
  budgetPreference?: "budget" | "any" | "sales_only";
}

export interface CandidateGameInput {
  id: string;
  steamAppId: number;
  name: string;
  headerImage?: string;
  capsuleImage?: string;
  precomputedSimilarity: number; // 0 to 1, from sparse cosine or pgvector HNSW
  tags: { tag: string; weight: number }[];
  positiveReviews: number;
  totalReviews: number;
  steamReviewScore?: number | null;
  medianPlaytimeMinutes: number; // SteamSpy
  averagePlaytimeMinutes: number;
  estimatedHoursToBeat?: number | null;
  priceFinalCents: number;
  priceInitialCents: number;
  discountPercent: number;
  isFree: boolean;
  steamDeckCompatibility?: "verified" | "playable" | "unsupported" | "unknown";
  releaseDate?: Date | null;
}

export interface FactorBreakdown {
  score: number;        // 0 to 100
  weight: number;       // e.g. 0.40
  contribution: number; // score * weight
  summary: string;
}

export interface RankedGameResult {
  game: CandidateGameInput;
  totalScore: number; // 0 to 100
  factors: {
    tasteMatch: FactorBreakdown & { matchedTags: string[] };
    reviewQuality: FactorBreakdown & { wilsonScore: number };
    regretRisk: FactorBreakdown & { riskRating: "low" | "medium" | "high" };
    timeFit: FactorBreakdown & { estimatedHours: number };
    priceValue: FactorBreakdown & { discountPercent: number; hourlyRateCents: number };
  };
  reasons: string[]; // Human-readable "Why this?" points
}

