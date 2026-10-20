import * as v from "valibot";
import { describe, expect, test } from "vitest";

import { bookmarksContract } from "./bookmarks";
import { bookmarkListInputSchema } from "./schemas/bookmark-procedures";

describe("bookmarksContract", () => {
  test("web の /api/rpc と同じ procedure を公開する（title は web に残る）", () => {
    expect(Object.keys(bookmarksContract).toSorted()).toStrictEqual([
      "counts",
      "create",
      "delete",
      "detail",
      "editor",
      "list",
      "setFavorite",
      "update",
    ]);
    expect(Object.keys(bookmarksContract.counts).toSorted()).toStrictEqual([
      "favorites",
      "inbox",
      "recent",
    ]);
  });

  test("画面が分岐する業務エラーの status を web と揃える", () => {
    expect(bookmarksContract.create["~orpc"].errorMap).toMatchObject({
      UNAUTHORIZED: { status: 401 },
      "duplicate-url": { status: 409 },
      "invalid-tag": { status: 409 },
    });
    expect(bookmarksContract.update["~orpc"].errorMap).toMatchObject({
      "bookmark-not-found": { status: 404 },
      "duplicate-url": { status: 409 },
      "invalid-tag": { status: 409 },
    });
    for (const name of ["delete", "detail", "editor", "setFavorite"] as const) {
      expect(bookmarksContract[name]["~orpc"].errorMap).toMatchObject({
        UNAUTHORIZED: { status: 401 },
        "bookmark-not-found": { status: 404 },
      });
    }
  });
});

describe("bookmarkListInputSchema", () => {
  test("cursor は createdAtMs:UUID の形だけを受ける", () => {
    expect(
      v.safeParse(bookmarkListInputSchema, {
        cursor: "1767225600000:01a14ade-61b5-7416-af28-6ad04e6fc648",
      }).success
    ).toBe(true);
    expect(
      v.safeParse(bookmarkListInputSchema, { cursor: "broken" }).success
    ).toBe(false);
  });

  test("tagNames は 20 件まで、view は recent / inbox / favorites だけ", () => {
    expect(
      v.safeParse(bookmarkListInputSchema, {
        tagNames: Array.from({ length: 21 }, (_, index) => `t${index}`),
      }).success
    ).toBe(false);
    expect(
      v.safeParse(bookmarkListInputSchema, { view: "trash" }).success
    ).toBe(false);
  });
});
