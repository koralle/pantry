import { describe, expect, test } from "vitest";
import { normalizeTags } from "../../services/tags";

describe("normalizeTags", () => {
  test("trims, lowercases, and deduplicates tags", () => {
    expect(normalizeTags([" Cloudflare ", "cloudflare", "Workers"])).toStrictEqual([
      "cloudflare",
      "workers",
    ]);
  });

  test("rejects empty, too-long, and oversized tag collections", () => {
    expect(() => normalizeTags(["   "])).toThrow();
    expect(() => normalizeTags(["x".repeat(33)])).toThrow();
    expect(() => normalizeTags(Array.from({ length: 21 }, (_, index) => `tag-${index}`))).toThrow();
  });
});
