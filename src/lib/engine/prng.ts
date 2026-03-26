/**
 * prng.ts
 * Deterministic pseudorandom number generation based on Mulberry32.
 */

/**
 * Robust string hasher (cyrb53)
 * Generates a 53-bit hash from a string, and we cast it down to 32 bits for the PRNG seed if needed.
 */
export function hashString(str: string, seed = 0): number {
  let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed;
  for (let i = 0, ch; i < str.length; i++) {
    ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1>>>16), 2246822507) ^ Math.imul(h2 ^ (h2>>>13), 3266489909);
  h2 = Math.imul(h2 ^ (h2>>>16), 2246822507) ^ Math.imul(h1 ^ (h1>>>13), 3266489909);
  return 4294967296 * (2097151 & h2) + (h1>>>0);
}

/**
 * Creates a deterministic PRNG function based on Mulberry32.
 * The returned function yields a pseudo-random float between 0 (inclusive) and 1 (exclusive).
 * @param seed - The 32-bit integer seed
 */
export function createPRNG(seed: number): () => number {
  return function() {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }
}

/**
 * Helper to get a ready-to-use PRNG from a date string.
 * @param dateString Format 'YYYY-MM-DD'
 */
export function getDatePRNG(dateString: string): () => number {
  const seed = hashString(dateString);
  return createPRNG(seed);
}
