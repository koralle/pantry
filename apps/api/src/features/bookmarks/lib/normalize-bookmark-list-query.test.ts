import { describe, expect, test } from "vitest";

import { normalizeListQuery } from "./normalize-bookmark-list-query";

describe(normalizeListQuery, () => {
  test("normalizes tag names", () => {
    expect(
      normalizeListQuery({
        tagNames: [" React ", "react", "TS", "TypeScript"],
      }).tagNames
    ).toStrictEqual(["react", "ts", "typescript"]);
  });

  test("collapses tag names that differ only by Unicode composition", () => {
    expect(
      normalizeListQuery({
        tagNames: ["ハ\u309A", "パ"],
      }).tagNames
    ).toStrictEqual(["パ"]);
  });
});
