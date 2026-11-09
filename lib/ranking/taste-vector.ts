/**
 * Taste Vector & Sparse Cosine Similarity Engine
 *
 * Method:
 * 1. Sparse tag-weight vector: tags are square-root scaled and L2-normalized.
 * 2. User taste vector: synthesized from library games weighted by sqrt(playtime),
 *    plus explicit onboarding tag bonuses.
 * 3. Cosine similarity: exact dot product between normalized vectors.
 * 4. Fixed 128-dimensional projection for Postgres pgvector HNSW indexing.
 */

export type SparseVector = Record<string, number>;

export function normalizeSparseVector(vec: SparseVector): SparseVector {
  let sumSq = 0;
  for (const val of Object.values(vec)) {
    sumSq += val * val;
  }

  const norm = Math.sqrt(sumSq);
  if (norm === 0) return {};

  const normalized: SparseVector = {};
  for (const [k, v] of Object.entries(vec)) {
    normalized[k] = v / norm;
  }
  return normalized;
}

export function buildGameTagVector(tags: { tag: string; weight: number }[]): SparseVector {
  const vec: SparseVector = {};
  for (const t of tags) {
    const key = t.tag.toLowerCase().trim();
    // Square root dampening to avoid runaway votes on generic tags
    vec[key] = Math.sqrt(Math.max(1, t.weight));
  }
  return normalizeSparseVector(vec);
}

export interface LibraryGameForTaste {
  playtimeForeverMinutes: number;
  tags: { tag: string; weight: number }[];
}

export function buildUserTasteVector(
  library: LibraryGameForTaste[],
  favoriteTags: string[] = []
): SparseVector {
  const aggregated: SparseVector = {};

  // Accumulate tags from played games
  for (const item of library) {
    if (item.playtimeForeverMinutes <= 0) continue;
    const playWeight = Math.sqrt(item.playtimeForeverMinutes);
    const gameVec = buildGameTagVector(item.tags);

    for (const [tag, weight] of Object.entries(gameVec)) {
      aggregated[tag] = (aggregated[tag] || 0) + weight * playWeight;
    }
  }

  // Boost explicit onboarding favorites
  for (const fav of favoriteTags) {
    const key = fav.toLowerCase().trim();
    aggregated[key] = (aggregated[key] || 0) + 15.0; // equivalent to strong playtime signal
  }

  return normalizeSparseVector(aggregated);
}

export function calculateSparseCosineSimilarity(
  vecA: SparseVector,
  vecB: SparseVector
): number {
  let dot = 0;
  // Iterate over smaller vector
  const [small, large] =
    Object.keys(vecA).length <= Object.keys(vecB).length ? [vecA, vecB] : [vecB, vecA];

  for (const [key, valA] of Object.entries(small)) {
    const valB = large[key];
    if (valB !== undefined) {
      dot += valA * valB;
    }
  }

  return Math.max(0, Math.min(1, dot));
}

/**
 * Deterministic hash-based projection from sparse tag space to a 128-dimensional
 * dense unit vector for Postgres pgvector HNSW indexing.
 */
export function projectSparseToDense128(sparse: SparseVector): number[] {
  const dim = 128;
  const dense = new Array<number>(dim).fill(0);

  for (const [tag, weight] of Object.entries(sparse)) {
    // Simple 32-bit FNV-1a hash
    let hash = 2166136261;
    for (let i = 0; i < tag.length; i++) {
      hash ^= tag.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }

    const index = Math.abs(hash) % dim;
    const sign = hash & 1 ? 1 : -1;
    dense[index] += sign * weight;
  }

  // L2 normalize dense vector
  let sumSq = 0;
  for (let i = 0; i < dim; i++) {
    sumSq += dense[i] * dense[i];
  }

  const norm = Math.sqrt(sumSq);
  if (norm === 0) return dense;

  return dense.map((v) => Number((v / norm).toFixed(6)));
}

