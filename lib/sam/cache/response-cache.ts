/**
 * Response Cache
 *
 * Client-side response cache for degraded mode using Jaccard bigram
 * similarity matching. Returns cached responses when the AI backend
 * is unavailable.
 *
 * - Max 100 entries with LRU eviction
 * - 24-hour TTL per entry
 * - Only caches responses with confidence >= 0.7
 * - Similarity threshold of 0.85 for fuzzy matching
 */

// =============================================================================
// TYPES
// =============================================================================

interface CachedResponse {
  query: string;
  response: string;
  mode: string;
  pageType: string;
  confidence: number;
  cachedAt: number;
  accessedAt: number;
  bigrams: Set<string>;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const MAX_ENTRIES = 100;
const TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const SIMILARITY_THRESHOLD = 0.85;
const MIN_CONFIDENCE_TO_CACHE = 0.7;

// =============================================================================
// BIGRAM SIMILARITY
// =============================================================================

function getBigrams(text: string): Set<string> {
  const normalized = text.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
  const words = normalized.split(/\s+/);
  const bigrams = new Set<string>();
  for (const word of words) {
    for (let i = 0; i < word.length - 1; i++) {
      bigrams.add(word.slice(i, i + 2));
    }
  }
  return bigrams;
}

function jaccardSimilarity(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 1;
  let intersection = 0;
  for (const item of a) {
    if (b.has(item)) intersection++;
  }
  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

// =============================================================================
// CACHE
// =============================================================================

const cache = new Map<string, CachedResponse>();

function evictExpired(): void {
  const now = Date.now();
  for (const [key, entry] of cache) {
    if (now - entry.cachedAt > TTL_MS) {
      cache.delete(key);
    }
  }
}

function evictLRU(): void {
  if (cache.size <= MAX_ENTRIES) return;

  // Find the entry with the oldest accessedAt
  let oldestKey: string | null = null;
  let oldestAccess = Infinity;
  for (const [key, entry] of cache) {
    if (entry.accessedAt < oldestAccess) {
      oldestAccess = entry.accessedAt;
      oldestKey = key;
    }
  }
  if (oldestKey) cache.delete(oldestKey);
}

function normalizeKey(query: string, mode: string, pageType: string): string {
  return `${mode}:${pageType}:${query.toLowerCase().trim()}`;
}

// =============================================================================
// PUBLIC API
// =============================================================================

/**
 * Cache a response for potential degraded-mode retrieval.
 * Only caches if confidence meets the threshold.
 */
export function cacheResponse(
  query: string,
  response: string,
  mode: string,
  pageType: string,
  confidence: number,
): void {
  if (confidence < MIN_CONFIDENCE_TO_CACHE) return;
  if (!query.trim() || !response.trim()) return;

  evictExpired();
  evictLRU();

  const key = normalizeKey(query, mode, pageType);
  const now = Date.now();

  cache.set(key, {
    query: query.trim(),
    response,
    mode,
    pageType,
    confidence,
    cachedAt: now,
    accessedAt: now,
    bigrams: getBigrams(query),
  });
}

/**
 * Look up a cached response using fuzzy matching.
 * Returns the best match above the similarity threshold, or null.
 */
export function getCachedResponse(
  query: string,
  mode: string,
  pageType: string,
): { response: string; similarity: number; originalQuery: string } | null {
  evictExpired();

  const queryBigrams = getBigrams(query);
  let bestMatch: CachedResponse | null = null;
  let bestSimilarity = 0;

  for (const entry of cache.values()) {
    // Prefer same mode and page type
    if (entry.mode !== mode || entry.pageType !== pageType) continue;

    const similarity = jaccardSimilarity(queryBigrams, entry.bigrams);
    if (similarity > bestSimilarity && similarity >= SIMILARITY_THRESHOLD) {
      bestSimilarity = similarity;
      bestMatch = entry;
    }
  }

  // Fallback: search across modes if no match found
  if (!bestMatch) {
    for (const entry of cache.values()) {
      const similarity = jaccardSimilarity(queryBigrams, entry.bigrams);
      if (similarity > bestSimilarity && similarity >= SIMILARITY_THRESHOLD) {
        bestSimilarity = similarity;
        bestMatch = entry;
      }
    }
  }

  if (!bestMatch) return null;

  // Update LRU timestamp
  bestMatch.accessedAt = Date.now();

  return {
    response: bestMatch.response,
    similarity: bestSimilarity,
    originalQuery: bestMatch.query,
  };
}

/**
 * Clear all cached responses.
 */
export function clearResponseCache(): void {
  cache.clear();
}

/**
 * Get cache statistics.
 */
export function getCacheStats(): { size: number; maxEntries: number } {
  evictExpired();
  return { size: cache.size, maxEntries: MAX_ENTRIES };
}
