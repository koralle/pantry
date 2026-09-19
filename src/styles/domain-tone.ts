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

export const toneFor = (seed: string): DomainTone => {
  let hash = 0;
  for (const char of seed) {
    hash = Math.trunc(hash * 31 + (char.codePointAt(0) ?? 0));
  }
  return DOMAIN_TONES[Math.abs(hash) % DOMAIN_TONES.length] ?? "slate";
};
