import { describe, expect, test } from "vitest";

import { defaultBookmarkSearch } from "./bookmark-search";
import {
  allShelfSearch,
  buildListBackSearch,
  detailSearchFromList,
  listSearchFromDetail,
  tagShelfSearch,
} from "./bookmark-search-builders";

describe("shelf filter search", () => {
  test("all clears tags", () => {
    const next = allShelfSearch({
      ...defaultBookmarkSearch,
      tags: ["frontend"],
    });

    expect(next).toStrictEqual(defaultBookmarkSearch);
  });

  test("tag writes the normalized name into search", () => {
    const next = tagShelfSearch("TypeScript", {
      ...defaultBookmarkSearch,
      tags: ["frontend", "docs"],
    });

    expect(next).toStrictEqual({
      tags: ["typescript"],
    });
  });
});

describe(buildListBackSearch, () => {
  test("keeps the current layout while resetting view", () => {
    const next = buildListBackSearch(["TanStack"], {
      ...defaultBookmarkSearch,
      layout: "cards",
      tags: ["frontend"],
      view: "favorites",
    });

    expect(next).toStrictEqual({
      ...defaultBookmarkSearch,
      layout: "cards",
      tags: ["tanstack"],
    });
  });

  test("without current search, produces a fresh tag filter", () => {
    expect(buildListBackSearch(["docs"])).toStrictEqual({
      ...defaultBookmarkSearch,
      tags: ["docs"],
    });
  });
});

describe("detail search round-trip", () => {
  test("non-default list conditions travel to detail and back", () => {
    const current = {
      ...defaultBookmarkSearch,
      layout: "cards" as const,
      tags: ["frontend"],
      view: "favorites" as const,
    };

    expect(listSearchFromDetail(detailSearchFromList(current))).toStrictEqual(
      current
    );
  });
});
