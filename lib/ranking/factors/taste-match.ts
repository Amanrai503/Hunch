export function evaluateTasteMatch(
  precomputedSimilarity: number,
  gameTags: { tag: string; weight: number }[],
  favoriteTags: string[] = []
): { score: number; matchedTags: string[]; summary: string } {
  // Normalize similarity between 0 and 1
  const sim = Math.max(0, Math.min(1, precomputedSimilarity));

  // Find overlap with user's explicitly pinned/favorite tags
  const gameTagSet = new Set(
    gameTags
      .slice(0, 10)
      .map((t) => t.tag.toLowerCase().trim())
  );

  const matchedTags: string[] = [];
  if (favoriteTags.length > 0) {
    for (const fav of favoriteTags) {
      if (gameTagSet.has(fav.toLowerCase().trim())) {
        matchedTags.push(fav);
      }
    }
  }

  // Bonus up to 20% for explicit favorite tag overlap
  const tagBonus =
    favoriteTags.length > 0
      ? Math.min(1.0, matchedTags.length / Math.min(3, favoriteTags.length))
      : sim; // if no explicit tags, rely fully on vector similarity

  const compositeRatio = 0.8 * sim + 0.2 * tagBonus;
  const score = Math.round(compositeRatio * 100);

  let summary = `${score}% taste vector alignment`;
  if (matchedTags.length > 0) {
    summary = `Direct match on ${matchedTags.slice(0, 2).join(" & ")}`;
  }

  return {
    score,
    matchedTags,
    summary,
  };
}

