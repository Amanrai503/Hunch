import { test } from "node:test";
import assert from "node:assert/strict";
import {
  buildGameTagVector,
  buildUserTasteVector,
  calculateSparseCosineSimilarity,
  projectSparseToDense128,
} from "../../lib/ranking/taste-vector";

test("Taste Vector: normalization produces unit length vector", () => {
  const gameTags = [
    { tag: "Roguelike Deckbuilder", weight: 900 },
    { tag: "Strategy", weight: 400 },
    { tag: "Card Game", weight: 100 },
  ];

  const vec = buildGameTagVector(gameTags);

  let norm = 0;
  for (const v of Object.values(vec)) {
    norm += v * v;
  }
  // Norm of unit vector is 1.0
  assert.ok(Math.abs(norm - 1.0) < 0.0001);
});

test("Taste Vector: cosine similarity is 1.0 for identical vectors, 0 for orthogonal", () => {
  const vecA = buildGameTagVector([
    { tag: "Action", weight: 100 },
    { tag: "Indie", weight: 50 },
  ]);

  const simIdentical = calculateSparseCosineSimilarity(vecA, vecA);
  assert.ok(Math.abs(simIdentical - 1.0) < 0.0001);

  const vecB = buildGameTagVector([
    { tag: "Racing", weight: 100 },
    { tag: "Sports", weight: 50 },
  ]);

  const simOrthogonal = calculateSparseCosineSimilarity(vecA, vecB);
  assert.strictEqual(simOrthogonal, 0);
});

test("Taste Vector: user profile weights higher playtime games more strongly", () => {
  const library = [
    {
      playtimeForeverMinutes: 6000, // 100 hours in Deckbuilder
      tags: [{ tag: "Roguelike Deckbuilder", weight: 100 }],
    },
    {
      playtimeForeverMinutes: 60, // 1 hour in Racing
      tags: [{ tag: "Racing", weight: 100 }],
    },
  ];

  const userVec = buildUserTasteVector(library);

  assert.ok(
    userVec["roguelike deckbuilder"] > userVec["racing"] * 5,
    "100h game should dwarf 1h game in taste vector"
  );
});

test("Taste Vector: project to 128-dimensional dense vector for pgvector", () => {
  const sparse = buildGameTagVector([
    { tag: "Souls-like", weight: 500 },
    { tag: "Dark Fantasy", weight: 400 },
    { tag: "Difficult", weight: 300 },
  ]);

  const dense128 = projectSparseToDense128(sparse);

  assert.strictEqual(dense128.length, 128);

  // Check that dense vector is L2 normalized
  let norm = 0;
  for (const val of dense128) {
    norm += val * val;
  }
  assert.ok(Math.abs(norm - 1.0) < 0.005);
});
