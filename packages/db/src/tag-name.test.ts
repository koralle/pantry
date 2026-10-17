import { describe, expect, it } from "vitest";

import { toTagName } from "./tag-name";

describe(toTagName, () => {
  it("前後の空白を除き、表示形は大文字小文字を保つ", () => {
    expect(toTagName("  TypeScript ")).toStrictEqual({
      display: "TypeScript",
      normalized: "typescript",
    });
  });

  it("NFC に正規化してから小文字にする", () => {
    // "e" + 結合アクサン（NFD）と "é"（NFC）は同じタグになる。
    expect(toTagName("Cafe\u0301").normalized).toBe(
      toTagName("Caf\u00E9").normalized
    );
    expect(toTagName("Cafe\u0301").display).toBe("Caf\u00E9");
  });
});
