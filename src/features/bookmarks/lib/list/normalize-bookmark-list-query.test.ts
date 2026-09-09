import { describe, expect, test } from "vitest";

import { normalizeListQuery } from "./normalize-bookmark-list-query";

describe(normalizeListQuery, () => {
  test("trims q and drops empty", () => {
    expect(
      normalizeListQuery({
        q: "  ",
        sort: "newest",
        tagMode: "and",
      }).q
    ).toBeUndefined();
  });

  test("normalizes tag names", () => {
    expect(
      normalizeListQuery({
        sort: "updated",
        tagMode: "or",
        tagNames: [" React ", "react", "TS", "TypeScript"],
      }).tagNames
    ).toStrictEqual(["react", "ts", "typescript"]);
  });

  test("collapses tag names that differ only by Unicode composition", () => {
    expect(
      normalizeListQuery({
        sort: "updated",
        tagMode: "or",
        tagNames: ["ハ\u309A", "パ"],
      }).tagNames
    ).toStrictEqual(["パ"]);
  });
});
