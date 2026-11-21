/**
 * Domain color lives only in favicon tiles and tag dots (design rule).
 * Tones are deterministic: the same seed always maps to the same tone.
 */
export const DOMAIN_TONES = [
  "teal",
  "blue",
  "violet",
  "pink",
  "green",
  "orange",
  "yellow",
  "slate",
] as const;

export type DomainTone = (typeof DOMAIN_TONES)[number];

const HASH_MOD = 2_147_483_647;

/** 31-bit prime rolling hash distributes domain and tag names evenly across tones. */
export const toneFor = (seed: string): DomainTone => {
  let hash = 5381;
  for (const char of seed) {
    hash = (hash * 33 + (char.codePointAt(0) ?? 0)) % HASH_MOD;
  }
  return DOMAIN_TONES[hash % DOMAIN_TONES.length] ?? "slate";
};
