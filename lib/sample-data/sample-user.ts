export const SAMPLE_USER = {
  id: "00000000-0000-0000-0000-000000000001",
  steamId: "sample_deckbuilder_enthusiast",
  displayName: "Sam The Deckbuilder",
  avatarUrl: "https://avatars.steamstatic.com/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_full.jpg",
  profileUrl: "https://steamcommunity.com/id/sample_deckbuilder",
  isPrivate: false,
  isSampleUser: true,
  tasteProfileJson: {
    topTags: [
      { tag: "Roguelike Deckbuilder", weight: 95 },
      { tag: "Strategy", weight: 88 },
      { tag: "Card Game", weight: 84 },
      { tag: "Indie", weight: 80 },
      { tag: "Turn-Based", weight: 75 },
    ],
    medianPlaytimePreference: 25,
    budgetPreference: "any" as const,
  },
};
