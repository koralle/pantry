import { describe, expect, test } from "vitest";

import { DOMAIN_TONES, toneFor } from "./domain-tone";

const domains = [
  "github.com",
  "x.com",
  "zenn.dev",
  "note.com",
  "developer.mozilla.org",
  "youtube.com",
  "tanstack.com",
  "npmjs.com",
];

describe(toneFor, () => {
  test("同じ seed は常に同じ tone", () => {
    expect(toneFor("github.com")).toBe(toneFor("github.com"));
  });

  test("tone の数値が変わったら気づけるよう固定値で留める", () => {
    expect(toneFor("zenn.dev")).toBe("slate");
    expect(toneFor("react")).toBe("yellow");
  });

  test("ハッシュが溢れると 1 色に潰れる（旧実装の退行）", () => {
    // 旧実装は hash * 31 が 2^53 を超えて精度を失い、長い seed が全て
    // 同じ tone へ落ちていた。偏りが戻ったらここで落ちる。
    const tones = new Set(domains.map((domain) => toneFor(domain)));
    expect(tones.size).toBeGreaterThanOrEqual(4);
    for (const tone of tones) {
      expect(DOMAIN_TONES).toContain(tone);
    }
  });
});
