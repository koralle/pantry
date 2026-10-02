import { describe, expect, test } from "vitest";

import { defaultBookmarkSearch } from "./bookmark-search";
import {
  allShelfSearch,
  buildListBackSearch,
  chromeListSearch,
  detailSearchFromList,
  listSearchFromDetail,
  resolveChromeListSearch,
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

describe(chromeListSearch, () => {
  test("prefers the list search when present", () => {
    const index = {
      ...defaultBookmarkSearch,
      tags: ["frontend"],
    };

    expect(chromeListSearch(index, [{ tags: ["ignored"] }])).toStrictEqual(
      index
    );
  });

  test("uses tags from a child route when the list is not mounted", () => {
    expect(
      chromeListSearch(undefined, [{ tags: ["frontend"] }, { tags: ["other"] }])
    ).toStrictEqual({
      ...defaultBookmarkSearch,
      tags: ["frontend"],
    });
  });

  test("returns undefined when no list and no tags", () => {
    expect(chromeListSearch(undefined, [{}, undefined])).toBeUndefined();
  });
});

describe(resolveChromeListSearch, () => {
  test("keeps remembered list search when the index route is unmounted", () => {
    const remembered = {
      ...defaultBookmarkSearch,
      tags: ["frontend"],
    };

    expect(
      resolveChromeListSearch(undefined, remembered, [{ tags: ["other"] }])
    ).toStrictEqual(remembered);
  });

  test("falls back to child-route tags when nothing is remembered", () => {
    expect(
      resolveChromeListSearch(undefined, undefined, [{ tags: ["frontend"] }])
    ).toStrictEqual({
      ...defaultBookmarkSearch,
      tags: ["frontend"],
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
